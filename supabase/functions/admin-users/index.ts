import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { action, sessionToken, userId, updates, search } = await req.json();

    // === AUTH: Support both old admin session token AND Supabase JWT ===
    let isAuthorized = false;

    // Method 1: Supabase JWT — check if user has role=admin in user_profiles
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      // Skip if the token is the anon key (not a user JWT)
      if (token.length > 200) {
        const { data: userData } = await supabaseClient.auth.getUser(token);
        if (userData?.user) {
          const { data: profile } = await supabaseClient
            .from("user_profiles")
            .select("role")
            .eq("id", userData.user.id)
            .maybeSingle();
          if (profile?.role === "admin") {
            isAuthorized = true;
          }
        }
      }
    }

    // Method 2: Old admin session token (backwards compatible)
    if (!isAuthorized && sessionToken) {
      const { data: session, error: sessionError } = await supabaseClient
        .from("admin_sessions")
        .select("*")
        .eq("session_token", sessionToken)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (!sessionError && session) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new Error("Nicht autorisiert — Admin-Zugang erforderlich");
    }

    // === ACTIONS ===

    if (action === "list") {
      const { data: profiles, error: profileError } = await supabaseClient
        .from("user_profiles")
        .select("id, name, is_premium, premium_source, premium_until, role, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (profileError) throw profileError;

      const usersWithEmail: any[] = [];
      for (const profile of (profiles || [])) {
        const { data: authUser } = await supabaseClient.auth.admin.getUserById(profile.id);
        usersWithEmail.push({
          ...profile,
          email: authUser?.user?.email || "—",
        });
      }

      return new Response(JSON.stringify({ users: usersWithEmail }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "search_by_email") {
      const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers({ perPage: 1000 });
      if (authError) throw authError;

      const filtered = (authUsers?.users || []).filter(
        (u: any) => u.email?.toLowerCase().includes((search || "").toLowerCase())
      );

      const results: any[] = [];
      for (const authUser of filtered.slice(0, 50)) {
        const { data: profile } = await supabaseClient
          .from("user_profiles")
          .select("id, name, is_premium, premium_source, premium_until, role, created_at")
          .eq("id", authUser.id)
          .maybeSingle();

        results.push({
          id: authUser.id,
          email: authUser.email || "—",
          name: profile?.name || "—",
          is_premium: profile?.is_premium || false,
          premium_source: profile?.premium_source || "none",
          premium_until: profile?.premium_until || null,
          role: profile?.role || "user",
          created_at: profile?.created_at || authUser.created_at,
        });
      }

      return new Response(JSON.stringify({ users: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "search_by_name") {
      let query = supabaseClient
        .from("user_profiles")
        .select("id, name, is_premium, premium_source, premium_until, role, created_at")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data: profiles, error } = await query.limit(100);
      if (error) throw error;

      const usersWithEmail: any[] = [];
      for (const profile of (profiles || [])) {
        const { data: authUser } = await supabaseClient.auth.admin.getUserById(profile.id);
        usersWithEmail.push({
          ...profile,
          email: authUser?.user?.email || "—",
        });
      }

      return new Response(JSON.stringify({ users: usersWithEmail }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      if (!userId || !updates) throw new Error("Missing userId or updates");

      const allowedFields = ["is_premium", "premium_source", "premium_until", "role"];
      const safeUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
      for (const key of allowedFields) {
        if (key in updates) safeUpdates[key] = updates[key];
      }

      const { error: updateError } = await supabaseClient
        .from("user_profiles")
        .update(safeUpdates)
        .eq("id", userId);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("Admin users error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
