// ═══════════════════════════════════════════════════════════════════════════
// REGISTER RESET PARTICIPANT
// Schritt 1: DB upsert + Resend Audience
// Schritt 2: DB whatsapp update + ManyChat findByPhone → sendFlow
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY            = Deno.env.get("RESEND_API_KEY") as string;
const SUPABASE_URL              = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const MANYCHAT_API_KEY          = Deno.env.get("MANYCHAT_API_KEY") ?? "";
const MANYCHAT_FLOW_NS          = Deno.env.get("MANYCHAT_FLOW_NS") ?? "";

const RESEND_AUDIENCE_ID = "a5efa272-2dff-4913-9676-0c17ca1760ef";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Resend: add contact to audience ────────────────────────────────────────
async function addToResendAudience(email: string, vorname: string | null): Promise<void> {
  const res = await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      email,
      first_name: vorname ?? "",
      unsubscribed: false,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.warn("register-reset-participant: Resend audience error:", JSON.stringify(err));
  } else {
    console.log("register-reset-participant: Added to Resend audience →", email);
  }
}

// ─── ManyChat: find subscriber by phone number ───────────────────────────────
async function manyChatFindByPhone(phone: string): Promise<string | null> {
  if (!MANYCHAT_API_KEY) {
    console.log("register-reset-participant: MANYCHAT_API_KEY not set — skipping");
    return null;
  }

  const res = await fetch("https://api.manychat.com/whatsapp/subscribers/findByPhone", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MANYCHAT_API_KEY}`,
    },
    body: JSON.stringify({ phone }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.warn("register-reset-participant: ManyChat findByPhone failed:", JSON.stringify(err));
    return null;
  }

  const data = await res.json();
  const subscriberId = data?.data?.id ?? null;

  if (subscriberId) {
    console.log("register-reset-participant: ManyChat subscriber found →", subscriberId);
  } else {
    console.log("register-reset-participant: ManyChat subscriber not found for phone:", phone);
  }

  return subscriberId ? String(subscriberId) : null;
}

// ─── ManyChat: trigger flow for subscriber ───────────────────────────────────
async function manyChatSendFlow(subscriberId: string): Promise<void> {
  if (!MANYCHAT_FLOW_NS) {
    console.log("register-reset-participant: MANYCHAT_FLOW_NS not set — skipping sendFlow");
    return;
  }

  const res = await fetch("https://api.manychat.com/fb/sending/sendFlow", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MANYCHAT_API_KEY}`,
    },
    body: JSON.stringify({
      subscriber_id: subscriberId,
      flow_ns: MANYCHAT_FLOW_NS,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.warn("register-reset-participant: ManyChat sendFlow failed:", JSON.stringify(err));
  } else {
    console.log("register-reset-participant: ManyChat flow triggered →", MANYCHAT_FLOW_NS);
  }
}

// ─── Main handler ────────────────────────────────────────────────────────────
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { step, email, vorname, ziel, whatsapp_nummer, start_datum } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const today = new Date().toISOString().split("T")[0];

    // ── SCHRITT 1: Registrierung ─────────────────────────────────────────────
    if (!step || step === "register") {
      const { error: dbErr } = await supabase
        .from("reset_participants")
        .upsert(
          {
            email: email.toLowerCase().trim(),
            vorname: vorname?.trim() || null,
            start_datum: today,
            ziel: ziel ?? null,
          },
          { onConflict: "email", ignoreDuplicates: false }
        );

      if (dbErr) {
        console.error("register-reset-participant: DB upsert error:", dbErr.message);
      }

      // Resend Audience — fire-and-forget
      addToResendAudience(email, vorname ?? null).catch(console.error);

      return new Response(JSON.stringify({ success: true, step: "register" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── GOAL UPDATE: nach Onboarding ziel in DB schreiben ───────────────────
    if (step === "update_goal" && ziel) {
      await supabase
        .from("reset_participants")
        .update({ ziel })
        .eq("email", email.toLowerCase().trim())
        .catch((e: Error) => console.warn("register-reset-participant: ziel update error:", e.message));

      return new Response(JSON.stringify({ success: true, step: "update_goal" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── SCHRITT 2: WhatsApp-Nummer + ManyChat ────────────────────────────────
    if (step === "whatsapp" && whatsapp_nummer) {
      const cleanedNumber = whatsapp_nummer.trim();

      // 1. WhatsApp-Nummer in DB speichern
      const { error: updateErr } = await supabase
        .from("reset_participants")
        .update({ whatsapp_nummer: cleanedNumber })
        .eq("email", email.toLowerCase().trim());

      if (updateErr) {
        console.warn("register-reset-participant: WhatsApp DB update error:", updateErr.message);
      }

      // 2. ManyChat: Subscriber per Telefonnummer suchen
      const subscriberId = await manyChatFindByPhone(cleanedNumber).catch(e => {
        console.error("register-reset-participant: findByPhone exception:", e);
        return null;
      });

      if (subscriberId) {
        // 3. subscriber_id in DB persistieren
        await supabase
          .from("reset_participants")
          .update({ manychat_subscriber_id: subscriberId })
          .eq("email", email.toLowerCase().trim())
          .catch(console.error);

        // 4. Flow triggern (nur wenn MANYCHAT_FLOW_NS gesetzt)
        manyChatSendFlow(subscriberId).catch(console.error);
      }

      return new Response(
        JSON.stringify({ success: true, step: "whatsapp", manychat_found: !!subscriberId }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // step=whatsapp ohne Nummer → User hat übersprungen
    return new Response(JSON.stringify({ success: true, step: "skipped" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("register-reset-participant: Unexpected error:", msg);
    // Immer 200 — User-Erlebnis wird nie durch technische Fehler geblockt
    return new Response(JSON.stringify({ success: true, error: msg }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
