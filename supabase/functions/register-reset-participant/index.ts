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
    const { step, email, vorname, ziel, whatsapp_nummer, consent, utm, last_day_reached, signal } = body;

    // E-Mail ist Pflicht — außer für anonyme Events (Funnel vor dem Signup).
    if (!email && step !== "event") {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const today = new Date().toISOString().split("T")[0];

    const cleanEmail = email ? email.toLowerCase().trim() : "";

    // ── SCHRITT 1: Registrierung ─────────────────────────────────────────────
    if (!step || step === "register") {
      const row: Record<string, unknown> = {
        email: cleanEmail,
        vorname: vorname?.trim() || null,
        start_datum: today,
        ziel: ziel ?? null,
        last_seen_at: new Date().toISOString(),
      };
      // Consent (DSGVO) — nur setzen wenn explizit übergeben
      if (consent === true) {
        row.consent = true;
        row.consent_at = new Date().toISOString();
      }
      // UTM-Attribution — nur beim Erstkontakt sinnvoll
      if (utm && typeof utm === "object" && Object.keys(utm).length > 0) {
        row.utm = utm;
      }

      const { error: dbErr } = await supabase
        .from("reset_participants")
        .upsert(row, { onConflict: "email", ignoreDuplicates: false });

      if (dbErr) {
        console.error("register-reset-participant: DB upsert error:", dbErr.message);
      }

      // Consent-Wortlaut (DSGVO-Nachweis) bewusst als SEPARATES Update: fehlt die
      // Spalte noch, scheitert nur dieser Schritt — der Lead ist trotzdem gesichert.
      if (consent === true && typeof body.consent_text === "string" && body.consent_text.trim()) {
        const { error: ctErr } = await supabase
          .from("reset_participants")
          .update({ consent_text: String(body.consent_text).slice(0, 500) })
          .eq("email", cleanEmail);
        if (ctErr) console.warn("register-reset-participant: consent_text skipped:", ctErr.message);
      }

      // Resend Audience — fire-and-forget
      addToResendAudience(email, vorname ?? null).catch(console.error);

      return new Response(JSON.stringify({ success: true, step: "register" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── PROGRESS: Fortschritt + Ziel serverseitig spiegeln ───────────────────
    if (step === "progress") {
      const { data: current } = await supabase
        .from("reset_participants")
        .select("last_day_reached")
        .eq("email", cleanEmail)
        .maybeSingle();

      const prevDay = (current?.last_day_reached as number) ?? 0;
      const nextDay = Math.max(prevDay, Number(last_day_reached) || 0);

      const upd: Record<string, unknown> = {
        last_day_reached: nextDay,
        last_seen_at: new Date().toISOString(),
      };
      if (ziel) upd.ziel = ziel;

      // Upsert so progress is captured even if the email never hit "register"
      // (e.g. signup race) — keyed on email.
      await supabase
        .from("reset_participants")
        .upsert({ email: cleanEmail, start_datum: today, ...upd }, { onConflict: "email", ignoreDuplicates: false })
        .then(({ error }) => { if (error) console.warn("progress error:", error.message); });

      return new Response(JSON.stringify({ success: true, step: "progress", last_day_reached: nextDay }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── INTENT: High-Intent-Signal anhängen (app_cta / coaching_cta / whatsapp) ─
    if (step === "intent" && signal) {
      const { data: current } = await supabase
        .from("reset_participants")
        .select("high_intent")
        .eq("email", cleanEmail)
        .maybeSingle();

      const arr = Array.isArray(current?.high_intent) ? current!.high_intent as unknown[] : [];
      arr.push({ signal: String(signal), at: new Date().toISOString() });

      // Signal → Interesse ableiten (für Lead-Priorisierung im Admin)
      const sig = String(signal).toLowerCase();
      const intentRow: Record<string, unknown> = {
        email: cleanEmail, start_datum: today, high_intent: arr, last_seen_at: new Date().toISOString(),
      };
      if (sig.includes("app")) intentRow.app_interest = "high";
      if (sig.includes("coaching") || sig.includes("sprint")) intentRow.coaching_interest = "high";

      await supabase
        .from("reset_participants")
        .upsert(intentRow, { onConflict: "email", ignoreDuplicates: false })
        .then(({ error }) => { if (error) console.warn("intent error:", error.message); });

      return new Response(JSON.stringify({ success: true, step: "intent", signal }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── PROFILE: Tag-1 Startprofil speichern ─────────────────────────────────
    if (step === "profile" && body.profile && typeof body.profile === "object") {
      const p = body.profile as Record<string, unknown>;
      const prow = {
        email: cleanEmail,
        sex: p.sex ?? null, age: p.age ?? null, height: p.height ?? null, weight: p.weight ?? null,
        activity: p.activity ?? null, daily: p.daily ?? null, goal: p.goal ?? null, hurdle: p.hurdle ?? null,
        baseline: p.baseline ?? {},
        bmr: p.bmr ?? null, tdee: p.tdee ?? null,
        cal_low: p.calLow ?? null, cal_high: p.calHigh ?? null,
        protein_low: p.proteinLow ?? null, protein_high: p.proteinHigh ?? null,
        meal_count: p.mealCount ?? null, main_lever: p.mainLever ?? null,
      };
      await supabase.from("reset_profiles")
        .upsert(prow, { onConflict: "email", ignoreDuplicates: false })
        .then(({ error }) => { if (error) console.warn("profile error:", error.message); });
      await supabase.from("reset_participants")
        .upsert({ email: cleanEmail, start_datum: today, reset_status: "active", last_seen_at: new Date().toISOString() }, { onConflict: "email", ignoreDuplicates: false })
        .then(({ error }) => { if (error) console.warn("profile participant error:", error.message); });
      return new Response(JSON.stringify({ success: true, step: "profile" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── DAY: Tagesfortschritt + Rating + Tool-Ergebnis ───────────────────────
    if (step === "day" && typeof body.day === "number") {
      const dayNum = Number(body.day);
      const dprow: Record<string, unknown> = {
        email: cleanEmail,
        day: dayNum,
        task_done: body.task_done === true,
        tool_result: (body.tool_result && typeof body.tool_result === "object") ? body.tool_result : {},
      };
      // Rating kommt vom Frontend als Label ('good'|'difficult'|'failed') → auf
      // 3/2/1 mappen (numerisch für Admin-Ø; beim restore-Step zurück gemappt).
      const RMAP: Record<string, number> = { good: 3, difficult: 2, failed: 1 };
      const rNum = typeof body.rating === "number" ? body.rating : RMAP[String(body.rating)];
      if (typeof rNum === "number") dprow.rating = rNum;
      if (body.freetext) dprow.freetext = String(body.freetext).slice(0, 2000);
      if (body.completed === true) dprow.completed_at = new Date().toISOString();

      await supabase.from("reset_day_progress")
        .upsert(dprow, { onConflict: "email,day", ignoreDuplicates: false })
        .then(({ error }) => { if (error) console.warn("day progress error:", error.message); });

      // Funnel-Status am Teilnehmer spiegeln
      const { data: cur } = await supabase
        .from("reset_participants").select("last_day_reached").eq("email", cleanEmail).maybeSingle();
      const prevDay = (cur?.last_day_reached as number) ?? 0;
      const partUpd: Record<string, unknown> = {
        email: cleanEmail, start_datum: today,
        last_day_reached: Math.max(prevDay, dayNum),
        reset_status: dayNum >= 7 ? "completed" : "active",
        last_seen_at: new Date().toISOString(),
      };
      if (dayNum >= 7) partUpd.completed_at = new Date().toISOString();
      await supabase.from("reset_participants")
        .upsert(partUpd, { onConflict: "email", ignoreDuplicates: false })
        .then(({ error }) => { if (error) console.warn("day participant error:", error.message); });

      return new Response(JSON.stringify({ success: true, step: "day", day: dayNum }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── EVENT: eigenes Funnel-/CTA-Event-Log (auch anonym via anon_id) ───────
    if (step === "event" && body.event) {
      const ev = String(body.event).slice(0, 80);
      await supabase.from("reset_events").insert({
        email: cleanEmail || null,
        anon_id: body.anon_id ? String(body.anon_id).slice(0, 80) : null,
        event: ev,
        payload: (body.payload && typeof body.payload === "object") ? body.payload : {},
      }).then(({ error }) => { if (error) console.warn("event error:", error.message); });

      return new Response(JSON.stringify({ success: true, step: "event", event: ev }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── RESTORE: Fortschritt per E-Mail zurückgeben (Cross-Device / Homescreen) ─
    // Behebt die iOS-Falle: die Standalone-App startet mit leerem localStorage →
    // hier holt sie den serverseitig erfassten Stand zurück. found=false, wenn es
    // noch keinen echten Fortschritt gibt (dann normaler Neu-Nutzer-Flow).
    if (step === "restore") {
      const [{ data: part }, { data: profile }, { data: days }] = await Promise.all([
        supabase.from("reset_participants")
          .select("vorname, ziel, last_day_reached, reset_status").eq("email", cleanEmail).maybeSingle(),
        supabase.from("reset_profiles").select("*").eq("email", cleanEmail).maybeSingle(),
        supabase.from("reset_day_progress")
          .select("day, rating, tool_result, completed_at, task_done, freetext").eq("email", cleanEmail).order("day"),
      ]);

      const hasProgress = !!profile || (Array.isArray(days) && days.some((d) => d.completed_at));
      if (!hasProgress) {
        return new Response(JSON.stringify({ found: false }), {
          status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      return new Response(JSON.stringify({ found: true, participant: part, profile, days: days ?? [] }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
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

      // 1. WhatsApp-Nummer in DB speichern (upsert → geht nie verloren, auch wenn
      //    die Signup-Zeile durch ein Timing-Race noch nicht da ist)
      const { error: updateErr } = await supabase
        .from("reset_participants")
        .upsert(
          { email: cleanEmail, start_datum: today, whatsapp_nummer: cleanedNumber, last_seen_at: new Date().toISOString() },
          { onConflict: "email", ignoreDuplicates: false },
        );

      if (updateErr) {
        console.warn("register-reset-participant: WhatsApp DB upsert error:", updateErr.message);
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
