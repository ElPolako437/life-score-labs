// ═══════════════════════════════════════════════════════════════════════════
// REGISTER RESET PARTICIPANT
// Schritt 1: DB upsert + Resend Audience
// Schritt 2: DB whatsapp update + ManyChat webhook
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY          = Deno.env.get("RESEND_API_KEY") as string;
const SUPABASE_URL            = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const MANYCHAT_WEBHOOK_URL    = Deno.env.get("MANYCHAT_WEBHOOK_URL") ?? "";

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

// ─── ManyChat webhook ────────────────────────────────────────────────────────
async function callManyChatWebhook(payload: {
  vorname: string | null;
  whatsapp_nummer: string;
  ziel: string | null;
  start_datum: string;
}): Promise<void> {
  if (!MANYCHAT_WEBHOOK_URL) {
    console.log("register-reset-participant: MANYCHAT_WEBHOOK_URL not set — skipping webhook");
    return;
  }
  const res = await fetch(MANYCHAT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.warn("register-reset-participant: ManyChat webhook failed:", res.status);
  } else {
    console.log("register-reset-participant: ManyChat webhook sent →", payload.whatsapp_nummer);
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

    // ── SCHRITT 1: Registrierung (email + optional vorname/ziel) ─────────────
    if (!step || step === "register") {
      // DB upsert — ignoriert Duplikate (gleiche email)
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
        console.error("register-reset-participant: DB error:", dbErr.message);
        // Fehler loggen aber nicht blockieren — User bekommt trotzdem Zugang
      }

      // Resend Audience (fire-and-forget, blockiert nicht)
      addToResendAudience(email, vorname ?? null).catch(console.error);

      return new Response(JSON.stringify({ success: true, step: "register" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── SCHRITT 2: WhatsApp-Nummer speichern + ManyChat ──────────────────────
    if (step === "whatsapp" && whatsapp_nummer) {
      const cleanedNumber = whatsapp_nummer.trim();

      // Update in DB
      const { error: updateErr } = await supabase
        .from("reset_participants")
        .update({ whatsapp_nummer: cleanedNumber })
        .eq("email", email.toLowerCase().trim());

      if (updateErr) {
        console.warn("register-reset-participant: WhatsApp update error:", updateErr.message);
      }

      // ManyChat Webhook (fire-and-forget)
      callManyChatWebhook({
        vorname: vorname ?? null,
        whatsapp_nummer: cleanedNumber,
        ziel: ziel ?? null,
        start_datum: start_datum ?? today,
      }).catch(console.error);

      return new Response(JSON.stringify({ success: true, step: "whatsapp" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // step=whatsapp aber keine Nummer → skip (User hat übersprungen)
    return new Response(JSON.stringify({ success: true, step: "skipped" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("register-reset-participant: Unexpected error:", msg);
    // Immer 200 zurückgeben — User-Erlebnis darf nicht blockiert werden
    return new Response(JSON.stringify({ success: true, error: msg }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
