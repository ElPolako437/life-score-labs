import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    // 1. Get user profile for manual premium fields
    const { data: profileData } = await supabaseClient
      .from("user_profiles")
      .select("premium_source, premium_until, role")
      .eq("id", user.id)
      .maybeSingle();

    const premiumSource = profileData?.premium_source || "none";
    const premiumUntil = profileData?.premium_until || null;
    const userRole = profileData?.role || "user";

    // 2. Check manual/beta/founder/developer premium
    const manualSources = ["manual", "beta", "founder", "developer"];
    const hasManualPremium = manualSources.includes(premiumSource) &&
      (!premiumUntil || new Date(premiumUntil) > new Date());

    // 3. Check Stripe subscription (if key is set)
    let hasStripeSub = false;
    let subscriptionEnd = null;
    let cancelAtPeriodEnd = false;

    if (stripeKey) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });

        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId, status: "active", limit: 1,
          });

          let activeSub = subscriptions.data[0];
          if (!activeSub) {
            const trialingSubs = await stripe.subscriptions.list({
              customer: customerId, status: "trialing", limit: 1,
            });
            activeSub = trialingSubs.data[0];
          }

          if (activeSub) {
            hasStripeSub = true;
            subscriptionEnd = new Date(activeSub.current_period_end * 1000).toISOString();
            cancelAtPeriodEnd = activeSub.cancel_at_period_end;
          }
        }
      } catch (stripeErr) {
        console.error("Stripe check failed (non-fatal):", stripeErr);
      }
    }

    // 4. Determine final premium status
    const isPremium = hasStripeSub || hasManualPremium;
    const effectiveSource = hasStripeSub ? "stripe" : (hasManualPremium ? premiumSource : "none");

    // 5. Sync to user_profiles
    await supabaseClient.from("user_profiles").update({
      is_premium: isPremium,
      premium_source: effectiveSource,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    return new Response(JSON.stringify({
      subscribed: isPremium,
      premium_source: effectiveSource,
      premium_until: premiumUntil,
      role: userRole,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Check subscription error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
