// ═══════════════════════════════════════════════════════════════════════════
// RESET 5-DAY EMAIL NURTURE SEQUENCE — CALINESS
//
// Two entry points:
//   POST { trigger: "reset_signup", email, name }  → immediate welcome (day0)
//   POST { trigger: "cron" }                       → daily batch for day1–day4
//
// Sends via Brevo Transactional SMTP API.
// Idempotent: each (email, email_type) is sent at most once.
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ─── Config ──────────────────────────────────────────────────────────────

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Versand-Domain (Brevo-verifiziert) ist OHNE Bindestrich; Marken-Domain in Links + Footer
// bleibt MIT Bindestrich (caliness-academy.de).
const SENDER = { name: "CALI von CALINESS", email: "team@calinessacademy.de" };

const RESET_URL = "https://life-score-labs.lovable.app";
// App ist noch nicht live — URL führt zur Warteliste / Early Access.
const APP_TRIAL_URL = "https://caliness-academy.de/app";
const COACHING_URL = "https://calendly.com/team-calinessacademy/new-meeting";
const UNSUBSCRIBE_BASE = `${SUPABASE_URL}/functions/v1/send-reset-sequence`;
const IMPRESSUM_URL = "https://caliness-academy.de/impressum";
const DATENSCHUTZ_URL = "https://caliness-academy.de/datenschutz";
// Weißes Wortmark-Logo (transparent) — auf Lovable verifiziert erreichbar (200).
const LOGO_URL = `${RESET_URL}/images/caliness-logo-white.png`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Supabase client (service_role) ──────────────────────────────────────

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// ═══════════════════════════════════════════════════════════════════════════
// HTML EMAIL BUILDER — dark theme, green #22c55e, matching bioage design
// ═══════════════════════════════════════════════════════════════════════════

const C = {
  bg: "#08090b",
  card: "#0f1115",
  surface: "#15181f",
  border: "rgba(255,255,255,0.07)",
  hairline: "rgba(255,255,255,0.045)",
  borderAccent: "rgba(34,197,94,0.28)",
  accent: "#22c55e",
  accentSoft: "rgba(34,197,94,0.10)",
  text: "#f8fafc",
  textSec: "#aebacb",
  muted: "#6b7a8f",
  font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
};

function shell(preheader: string, content: string, unsubUrl: string): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="de">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
  <title>CALINESS Reset</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${C.bg};opacity:0;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.bg};">
    <tr><td align="center" style="padding:48px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background:${C.card};border-radius:22px;border:1px solid ${C.border};overflow:hidden;">

        <!-- Top accent line -->
        <tr><td style="height:4px;line-height:4px;font-size:0;background:${C.accent};">&nbsp;</td></tr>

        <!-- Header: wordmark logo + eyebrow -->
        <tr><td align="center" style="padding:40px 40px 30px;">
          <img src="${LOGO_URL}" width="168" alt="CALINESS" style="display:block;width:168px;max-width:168px;height:auto;border:0;outline:none;text-decoration:none;margin:0 auto;" />
          <p style="font-family:${C.font};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.muted};margin:20px 0 0;font-weight:600;">7-Tage Reset</p>
        </td></tr>

        <!-- Content -->
        <tr><td style="padding:8px 40px 40px;">${content}</td></tr>

        <!-- Footer -->
        <tr><td style="padding:34px 40px 36px;border-top:1px solid ${C.hairline};text-align:center;">
          <img src="${LOGO_URL}" width="120" alt="CALINESS" style="display:block;width:120px;max-width:120px;height:auto;border:0;outline:none;margin:0 auto 14px;opacity:0.85;" />
          <p style="font-family:${C.font};font-size:11px;color:${C.muted};margin:0 0 18px;line-height:1.6;letter-spacing:0.3px;">Evidence-based Longevity &nbsp;·&nbsp; Made in Germany</p>

          <!-- Social -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 18px;">
            <tr>
              <td style="padding:0 7px;"><a href="https://www.instagram.com/caliness_academy/" target="_blank" style="font-family:${C.font};font-size:11px;color:${C.textSec};text-decoration:none;font-weight:600;">Instagram</a></td>
              <td style="color:${C.muted};font-size:10px;">·</td>
              <td style="padding:0 7px;"><a href="${RESET_URL}" target="_blank" style="font-family:${C.font};font-size:11px;color:${C.textSec};text-decoration:none;font-weight:600;">7-Tage Reset</a></td>
            </tr>
          </table>

          <p style="font-family:${C.font};font-size:11px;color:${C.muted};margin:0;line-height:1.8;">
            <a href="${IMPRESSUM_URL}" style="color:${C.muted};text-decoration:none;border-bottom:1px solid ${C.border};">Impressum</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${DATENSCHUTZ_URL}" style="color:${C.muted};text-decoration:none;border-bottom:1px solid ${C.border};">Datenschutz</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${unsubUrl}" style="color:${C.muted};text-decoration:none;border-bottom:1px solid ${C.border};">Abmelden</a>
          </p>
          <p style="font-family:${C.font};font-size:10px;color:${C.muted};margin:16px 0 0;opacity:0.55;">© ${new Date().getFullYear()} Caliness Academy · Du bekommst diese Mail, weil du den CALINESS Reset gestartet hast.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function badge(text: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
    <tr><td style="padding:7px 15px;background:${C.accentSoft};border-radius:100px;border:1px solid ${C.borderAccent};">
      <p style="font-family:${C.font};font-size:11px;font-weight:700;color:${C.accent};margin:0;letter-spacing:1.2px;text-transform:uppercase;">${text}</p>
    </td></tr></table>`;
}

function headline(text: string): string {
  return `<p style="font-family:${C.font};font-size:26px;font-weight:700;color:${C.text};margin:0 0 18px;line-height:1.22;letter-spacing:-0.4px;">${text}</p>`;
}

function body(text: string): string {
  return `<p style="font-family:${C.font};font-size:15px;color:${C.textSec};margin:0 0 20px;line-height:1.72;">${text}</p>`;
}

function divider(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0;"><tr><td style="border-top:1px solid ${C.hairline};font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
}

function cta(label: string, url: string): string {
  // Bulletproof, full-width premium button with rounded corners + glow.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td align="center" style="border-radius:12px;background:${C.accent};box-shadow:0 8px 28px rgba(34,197,94,0.32);">
          <a href="${url}" target="_blank" style="font-family:${C.font};font-size:15px;font-weight:700;color:#08090b;text-decoration:none;display:block;padding:17px 28px;border-radius:12px;letter-spacing:0.2px;">${label}&nbsp;&rarr;</a>
        </td></tr>
      </table>
    </td></tr></table>`;
}

function checkRow(text: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:11px;">
    <tr>
      <td width="26" valign="top">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="18" height="18" align="center" valign="middle" style="width:18px;height:18px;background:${C.accentSoft};border:1px solid ${C.borderAccent};border-radius:50%;font-family:${C.font};font-size:10px;font-weight:700;color:${C.accent};line-height:18px;">&#10003;</td></tr></table>
      </td>
      <td style="font-family:${C.font};font-size:14px;color:${C.textSec};line-height:1.55;padding-top:0;">${text}</td>
    </tr></table>`;
}

function crossRow(text: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:11px;">
    <tr>
      <td width="26" valign="top">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="18" height="18" align="center" valign="middle" style="width:18px;height:18px;background:rgba(239,68,68,0.10);border:1px solid rgba(239,68,68,0.30);border-radius:50%;font-family:${C.font};font-size:10px;font-weight:700;color:#ef4444;line-height:18px;">&times;</td></tr></table>
      </td>
      <td style="font-family:${C.font};font-size:14px;color:${C.muted};line-height:1.55;">${text}</td>
    </tr></table>`;
}

function quote(text: string, author: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
    <tr><td style="padding:24px 26px;background:${C.surface};border-radius:16px;border:1px solid ${C.hairline};">
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:30px;color:${C.accent};margin:0;line-height:0.4;height:14px;">&ldquo;</p>
      <p style="font-family:${C.font};font-size:15px;color:${C.text};margin:0 0 12px;line-height:1.62;">${text}</p>
      <p style="font-family:${C.font};font-size:12px;color:${C.muted};margin:0;font-weight:600;letter-spacing:0.2px;">${author}</p>
    </td></tr></table>`;
}

function urgencyBanner(text: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
    <tr><td style="padding:16px 20px;background:${C.accentSoft};border-radius:14px;border:1px solid ${C.borderAccent};text-align:center;">
      <p style="font-family:${C.font};font-size:13px;font-weight:600;color:${C.accent};margin:0;line-height:1.5;">${text}</p>
    </td></tr></table>`;
}

function priceCard(title: string, price: string, features: string[]): string {
  const rows = features.map((f) => checkRow(f)).join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
    <tr><td style="padding:28px;background:${C.surface};border-radius:18px;border:1px solid ${C.borderAccent};">
      <p style="font-family:${C.font};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:${C.accent};margin:0 0 6px;">${title}</p>
      <p style="font-family:${C.font};font-size:30px;font-weight:700;color:${C.text};margin:0 0 22px;letter-spacing:-0.5px;">${price}</p>
      ${rows}
    </td></tr></table>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 5 EMAIL CONTENTS
// ═══════════════════════════════════════════════════════════════════════════

interface EmailDef {
  type: string;
  subject: (name: string) => string;
  html: (name: string, unsubUrl: string) => string;
}

const SEQUENCE: EmailDef[] = [
  // ─── DAY 0: Welcome (sofort) ───────────────────────────────────────────
  {
    type: "reset_day0",
    subject: (name) => `${name}, dein 7-Tage Reset startet jetzt`,
    html: (name, unsub) =>
      shell(
        "Willkommen zum CALINESS Reset — 7 Tage, die zählen.",
        [
          badge("Willkommen"),
          headline(`Hey ${name}, schön, dass du da bist.`),
          body(
            `Du hast dich für den <strong>CALINESS 7-Tage Reset</strong> angemeldet — 7 Tage, in denen du herausfindest, was für deinen Körper wirklich funktioniert. Kein starrer Plan, keine leeren Versprechen.`
          ),
          body(`<strong>Was dich erwartet:</strong>`),
          checkRow("Tag 1 — dein persönlicher Startpunkt (Kalorien, Protein, Hebel)"),
          checkRow("Tag 2–5 — interaktive Mini-Tools für Ernährung, Bewegung, Schlaf"),
          checkRow("Tag 6 — dein Wochengerüst"),
          checkRow("Tag 7 — persönliche Auswertung + nächster Schritt"),
          body(
            `Jeden Tag bekommst du eine kurze Mail mit einem konkreten Impuls. Kein Spam, kein Verkauf — nur Substanz.`
          ),
          cta("Reset starten", RESET_URL),
          body(
            `<span style="color:${C.muted};font-size:12px;">Antworte gerne auf diese Mail, wenn du Fragen hast. Wir lesen alles.</span>`
          ),
        ].join(""),
        unsub
      ),
  },

  // ─── DAY 1: Quick Win ──────────────────────────────────────────────────
  {
    type: "reset_day1",
    subject: (name) => `${name}, Tag 1 — dein erster Reset-Schritt`,
    html: (name, unsub) =>
      shell(
        "Dein erster konkreter Schritt. Kein Raten mehr.",
        [
          badge("Tag 1 · Quick Win"),
          headline(`${name}, eine Sache heute.`),
          body(
            `Gestern hast du deinen Reset gestartet. Heute kommt der erste echte Schritt — klein, machbar, spürbar.`
          ),
          body(
            `<strong>Dein Mini-Reset für heute:</strong><br>Starte den Tag mit einer proteinreichen Mahlzeit — mindestens 30 g. Klingt banal, verändert aber deinen ganzen Tag: stabilerer Blutzucker, weniger Heißhunger, besserer Fokus.`
          ),
          checkRow("Skyr + Beeren + Nüsse = ~35 g Protein"),
          checkRow("3 Eier + Vollkornbrot = ~30 g Protein"),
          checkRow("Protein-Shake + Banane = ~28 g Protein"),
          body(
            `Das ist kein Ernährungsplan — das ist ein Experiment. Probier es heute und achte darauf, wie du dich bis 12 Uhr fühlst.`
          ),
          cta("Tag 1 im Reset öffnen", `${RESET_URL}/day/1`),
        ].join(""),
        unsub
      ),
  },

  // ─── DAY 2: Aha-Moment + sanfte App-Erwähnung ─────────────────────────
  {
    type: "reset_day2",
    subject: (name) => `${name}, warum Willenskraft überschätzt ist`,
    html: (name, unsub) =>
      shell(
        "Die Wissenschaft hinter deinem Nachmittagstief.",
        [
          badge("Tag 2 · Insight"),
          headline(`${name}, das ist der Grund.`),
          body(
            `Die meisten Leute scheitern nicht an Disziplin — sie scheitern an Systemen. Genauer: an der Abwesenheit davon.`
          ),
          body(
            `<strong>Der wissenschaftliche Aha-Moment:</strong><br>Studien zeigen, dass Willenskraft ein endlicher Tagevorrat ist (<em>Ego Depletion</em>). Je mehr Mikro-Entscheidungen du morgens triffst ("Was esse ich?", "Gehe ich trainieren?"), desto weniger bleibt für den Nachmittag übrig. Heißhunger um 16 Uhr ist kein Versagen — es ist ein leerer Tank.`
          ),
          body(
            `<strong>Die Lösung:</strong> Weniger Entscheidungen. Feste Mahlzeiten-Slots, vorbereitete Optionen, ein klarer Tagesanker. Genau das baust du im Reset auf.`
          ),
          cta("Tag 2 im Reset öffnen", `${RESET_URL}/day/2`),
          divider(),
          body(
            `<span style="font-size:13px;color:${C.muted};">💡 Übrigens: In der <strong>CALINESS App</strong> bauen wir genau solche Systeme für dich — automatisch, basierend auf deinen echten Daten. Aber dazu später mehr.</span>`
          ),
        ].join(""),
        unsub
      ),
  },

  // ─── DAY 3: Transformation + Social Proof ──────────────────────────────
  {
    type: "reset_day3",
    subject: (name) => `${name}, eine Geschichte, die du kennen solltest`,
    html: (name, unsub) =>
      shell(
        "Wie ein 7-Tage-Reset den Unterschied gemacht hat.",
        [
          badge("Tag 3 · Perspektive"),
          headline(`${name}, kommt dir das bekannt vor?`),
          body(
            `"Ich weiß eigentlich, was ich tun müsste. Aber ich schaffe es nicht, dranzubleiben."<br><br>Das sagen 9 von 10 Menschen, die den Reset starten. Der Punkt ist: <strong>Wissen ist nicht das Problem. Struktur ist das Problem.</strong>`
          ),
          quote(
            "Ich dachte, ich brauche einen strengen Plan. Tatsächlich brauchte ich nur 3 feste Ankerpunkte am Tag. Der Reset hat mir gezeigt, welche das bei mir sind.",
            "Sarah, 34 — nach 7-Tage-Reset"
          ),
          body(
            `Du bist jetzt bei Tag 3. Das heißt: du hast schon länger durchgehalten als die Hälfte der Leute, die einen "Neustart" probieren. Das ist nicht trivial.`
          ),
          cta("Tag 3 im Reset öffnen", `${RESET_URL}/day/3`),
          divider(),
          body(
            `<span style="font-size:13px;color:${C.muted};">🔒 <strong>Fortschritt sichern:</strong> Dein Reset-Profil baut sich Tag für Tag auf. In der CALINESS App wird daraus ein angepasster Plan — mit Check-ins, die sich an dein Leben anpassen.</span>`
          ),
        ].join(""),
        unsub
      ),
  },

  // ─── DAY 4: Conversion — Reset endet, Brücke zur App/Coaching ─────────
  {
    type: "reset_day4",
    subject: (name) => `${name}, so geht's nach dem Reset weiter`,
    html: (name, unsub) =>
      shell(
        "Dein Reset endet bald. So sicherst du deinen Fortschritt.",
        [
          badge("Tag 5 · Dein nächster Schritt"),
          headline(`${name}, die Frage nach Tag 7.`),
          body(
            `In wenigen Tagen ist dein Reset abgeschlossen. Du hast deinen Startpunkt, deine Stellschrauben, dein Wochensystem. <strong>Die Frage ist: Was passiert danach?</strong>`
          ),
          body(
            `Hier ist die ehrliche Antwort: Ein Reset zeigt dir <em>was</em> funktioniert. Aber Veränderung passiert in den Wochen danach — wenn der Alltag zurückkommt, wenn die Motivation nachlässt, wenn das System getestet wird.`
          ),
          crossRow("Alleine weitermachen und hoffen, dass es hält"),
          checkRow("Mit einem System arbeiten, das sich an dein Leben anpasst"),
          divider(),
          body(`<strong>Option 1: Die CALINESS App (bald verfügbar)</strong>`),
          body(
            `Dein Reset-Profil wird zum Ausgangspunkt. Die App erstellt dir einen personalisierten Plan über die 4 Säulen (Ernährung, Bewegung, Schlaf, Mindset) — mit täglichen Check-ins, die sich an deine echte Woche anpassen.`
          ),
          priceCard("CALINESS App · ab 9 €/Monat", "7 Tage kostenlos testen", [
            "Personalisierter 4-Säulen-Plan",
            "Tägliche Check-ins + KI-Coaching",
            "Wöchentliche Auswertung + Anpassung",
            "Basiert auf deinem Reset-Profil",
          ]),
          cta("Auf die Warteliste — Frühzugang sichern", APP_TRIAL_URL),
          body(
            `<span style="color:${C.muted};font-size:12px;">Die App startet in den nächsten Wochen. Wer jetzt auf der Warteliste ist, bekommt den ersten Zugang und die ersten Monate vergünstigt.</span>`
          ),
          divider(),
          body(`<strong>Option 2: Persönliches Coaching (sofort verfügbar)</strong>`),
          body(
            `Du möchtest jetzt starten, nicht warten? In einem kostenlosen Strategiegespräch (30 Min) schauen wir uns dein Reset-Ergebnis gemeinsam an und bauen einen konkreten Plan für die nächsten 4 Wochen.`
          ),
          cta("Strategiegespräch buchen", COACHING_URL),
          urgencyBanner(
            "Dein Reset-Profil bleibt 14 Tage aktiv — danach werden die Daten gelöscht."
          ),
          divider(),
          body(
            `<span style="font-size:13px;color:${C.muted};">Kein Druck. Wenn der Reset dir gereicht hat, ist das völlig okay. Diese Mail ist die letzte in der Serie.</span>`
          ),
        ].join(""),
        unsub
      ),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// BREVO TRANSACTIONAL EMAIL SEND
// ═══════════════════════════════════════════════════════════════════════════

async function sendViaBre(
  to: { email: string; name?: string },
  subject: string,
  html: string
): Promise<{ messageId?: string; error?: string }> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: to.email, name: to.name || to.email }],
      subject,
      htmlContent: html,
      replyTo: { email: "team@calinessacademy.de", name: "CALINESS Team" },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[reset-seq] Brevo error:", data);
    return { error: JSON.stringify(data) };
  }
  return { messageId: data.messageId };
}

// ═══════════════════════════════════════════════════════════════════════════
// IDEMPOTENT SEND — check email_sends, send, log
// ═══════════════════════════════════════════════════════════════════════════

async function sendIfNotSent(
  supabase: ReturnType<typeof createClient>,
  subscriber: { email: string; name: string | null },
  emailDef: EmailDef
): Promise<boolean> {
  const emailType = emailDef.type;

  // Already sent?
  const { data: existing } = await supabase
    .from("reset_email_sends")
    .select("id")
    .eq("email", subscriber.email)
    .eq("email_type", emailType)
    .maybeSingle();

  if (existing) {
    console.log(`[reset-seq] SKIP ${emailType} → ${subscriber.email} (already sent)`);
    return false;
  }

  const name = subscriber.name || "du";
  const unsubUrl = `${UNSUBSCRIBE_BASE}?action=unsubscribe&email=${encodeURIComponent(subscriber.email)}`;
  const subject = emailDef.subject(name);
  const html = emailDef.html(name, unsubUrl);

  const result = await sendViaBre({ email: subscriber.email, name: name }, subject, html);

  if (result.error) {
    console.error(`[reset-seq] FAIL ${emailType} → ${subscriber.email}: ${result.error}`);
    return false;
  }

  // Log the send (idempotency)
  await supabase.from("reset_email_sends").insert({
    email: subscriber.email,
    email_type: emailType,
    message_id: result.messageId || null,
  });

  console.log(`[reset-seq] SENT ${emailType} → ${subscriber.email} (msgId: ${result.messageId})`);
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

async function handleSignup(
  supabase: ReturnType<typeof createClient>,
  email: string,
  name: string | null
): Promise<Response> {
  const cleanEmail = email.trim().toLowerCase();

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return new Response(JSON.stringify({ error: "Invalid email" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Upsert subscriber (ignore conflict on existing email)
  const { error: subErr } = await supabase
    .from("reset_subscribers")
    .upsert(
      { email: cleanEmail, name: name?.trim() || null, source: "reset_webapp" },
      { onConflict: "email" }
    );

  if (subErr) {
    console.error("[reset-seq] subscriber upsert error:", subErr);
    return new Response(JSON.stringify({ error: "DB error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Send welcome email immediately (day0)
  const sent = await sendIfNotSent(supabase, { email: cleanEmail, name }, SEQUENCE[0]);

  return new Response(
    JSON.stringify({ success: true, welcomed: sent }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCron(
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  // Fetch all active subscribers within the 5-day window (day 0–4)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 5);

  const { data: subs, error } = await supabase
    .from("reset_subscribers")
    .select("email, name, created_at")
    .eq("unsubscribed", false)
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[reset-seq] cron fetch error:", error);
    return new Response(JSON.stringify({ error: "DB error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`[reset-seq] CRON processing ${subs?.length ?? 0} subscribers`);

  let sentCount = 0;

  for (const sub of subs ?? []) {
    const createdAt = new Date(sub.created_at);
    const ageDays = Math.floor(
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // day0 is sent on signup, cron handles day1..day4
    // ageDays=1 → day1, ageDays=2 → day2, etc.
    if (ageDays >= 1 && ageDays <= 4) {
      const emailDef = SEQUENCE[ageDays]; // index 1–4
      if (emailDef) {
        const sent = await sendIfNotSent(supabase, sub, emailDef);
        if (sent) sentCount++;
      }
    }
  }

  console.log(`[reset-seq] CRON done. Sent ${sentCount} emails.`);

  return new Response(
    JSON.stringify({ success: true, processed: subs?.length ?? 0, sent: sentCount }),
    { headers: { "Content-Type": "application/json" } }
  );
}

async function handleUnsubscribe(email: string): Promise<Response> {
  const supabase = getSupabase();
  const cleanEmail = email.trim().toLowerCase();

  const { error } = await supabase
    .from("reset_subscribers")
    .update({ unsubscribed: true })
    .eq("email", cleanEmail);

  if (error) {
    console.error("[reset-seq] unsubscribe error:", error);
  }

  // Always show a friendly page, even on error
  return new Response(
    `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Abgemeldet</title></head>
    <body style="margin:0;padding:60px 20px;background:${C.bg};font-family:${C.font};text-align:center;">
      <p style="color:${C.text};font-size:18px;font-weight:600;">Du wurdest abgemeldet.</p>
      <p style="color:${C.muted};font-size:14px;margin-top:12px;">Du erhältst keine weiteren Reset-Mails mehr.</p>
    </body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // GET with ?action=unsubscribe → unsubscribe page
  const url = new URL(req.url);
  if (req.method === "GET" && url.searchParams.get("action") === "unsubscribe") {
    const email = url.searchParams.get("email") || "";
    return handleUnsubscribe(email);
  }

  // POST handler
  try {
    const body = await req.json();
    const supabase = getSupabase();

    if (body.trigger === "reset_signup") {
      console.log(`[reset-seq] SIGNUP trigger: ${body.email}`);
      return handleSignup(supabase, body.email, body.name || null);
    }

    if (body.trigger === "cron") {
      console.log("[reset-seq] CRON trigger");
      return handleCron(supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Unknown trigger. Use "reset_signup" or "cron".' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[reset-seq] ERROR:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
