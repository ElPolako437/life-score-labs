// ═══════════════════════════════════════════════════════════════════════════
// RESET 7-DAY EMAIL NURTURE SEQUENCE — CALINESS
//
// Two entry points:
//   POST { trigger: "reset_signup", email, name }  → immediate welcome (day0)
//   POST { trigger: "cron" }                       → daily batch for day1–day7
//
// One themed mail per reset day (Start · Ernährung · Bewegung · Schlaf ·
// Stress · Longevity · Auswertung). Sends via Brevo Transactional SMTP API.
// Idempotent: each (email, email_type) is sent at most once.
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ─── Config ──────────────────────────────────────────────────────────────

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Versand-Domain (in Brevo per DKIM/SPF authentifiziert) ist calinessacademy.de OHNE
// Bindestrich → korrekte Signatur = Inbox statt Spam. Marken-Domain in Links/Footer
// bleibt MIT Bindestrich (caliness-academy.de) = die Website-Domain.
const SENDER = { name: "CALI von CALINESS", email: "team@calinessacademy.de" };

const RESET_URL = "https://life-score-labs.lovable.app";
// App ist noch nicht live — URL führt zur Warteliste / Early Access.
const APP_TRIAL_URL = "https://caliness-academy.de/app";
const COACHING_URL = "https://calendly.com/team-calinessacademy/new-meeting";
const UNSUBSCRIBE_BASE = `${SUPABASE_URL}/functions/v1/send-reset-sequence`;
const IMPRESSUM_URL = "https://caliness-academy.de/impressum";
const DATENSCHUTZ_URL = "https://caliness-academy.de/datenschutz";
// Mail-Bilder über jsDelivr (GitHub-CDN, fester Commit) — unabhängig vom Lovable-Deploy,
// damit Logo + Coach-Avatare immer laden (Repo ist öffentlich). Commit-Pin = unveränderlich.
const IMG_CDN = "https://cdn.jsdelivr.net/gh/ElPolako437/life-score-labs@2dc07bb/public/images";
const LOGO_URL = `${IMG_CDN}/caliness-logo-white.png`;

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

function signature(): string {
  // Personal sign-off with David & Sarah's photo — warmth + brand trust on every mail.
  return `<tr><td style="padding:6px 40px 30px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${C.surface}" class="cl-surface" style="background:${C.surface};border:1px solid ${C.border};border-radius:16px;">
      <tr><td style="padding:15px 18px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="98" valign="middle">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td><img src="${IMG_CDN}/david-sm.jpg" width="46" height="46" alt="David" style="display:block;width:46px;height:46px;border-radius:50%;border:2px solid ${C.surface};outline:none;text-decoration:none;" /></td>
                <td style="padding-left:6px;"><img src="${IMG_CDN}/sarah-sm.jpg" width="46" height="46" alt="Sarah" style="display:block;width:46px;height:46px;border-radius:50%;border:2px solid ${C.surface};outline:none;text-decoration:none;" /></td>
              </tr></table>
            </td>
            <td valign="middle" style="padding-left:14px;">
              <p class="cl-text" style="font-family:${C.font};font-size:15px;font-weight:700;color:${C.text};margin:0;letter-spacing:-0.2px;">David &amp; Sarah</p>
              <p class="cl-muted" style="font-family:${C.font};font-size:13px;color:${C.muted};margin:3px 0 0;line-height:1.5;">Deine Coaches — wir begleiten dich durch den Reset.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>`;
}

function shell(preheader: string, content: string, unsubUrl: string): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="de">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
  <title>CALINESS Reset</title>
  <style>
    :root { color-scheme: dark; supported-color-schemes: dark; }
    /* Re-assert the brand-dark palette when a client applies its own dark-mode
       recoloring, so the mail stays dark instead of being washed out / lightened. */
    @media (prefers-color-scheme: dark) {
      .cl-bg { background:#08090b !important; }
      .cl-card { background:#0f1115 !important; }
      .cl-surface { background:#15181f !important; }
      .cl-text { color:#f8fafc !important; }
      .cl-textsec { color:#aebacb !important; }
      .cl-muted { color:#6b7a8f !important; }
    }
    /* Outlook.com dark mode injects [data-ogsc]/[data-ogsb] — counter its recoloring. */
    [data-ogsc] .cl-text { color:#f8fafc !important; }
    [data-ogsc] .cl-textsec { color:#aebacb !important; }
    [data-ogsc] .cl-muted { color:#6b7a8f !important; }
    [data-ogsb] .cl-bg { background:#08090b !important; }
    [data-ogsb] .cl-card { background:#0f1115 !important; }
    [data-ogsb] .cl-surface { background:#15181f !important; }
  </style>
</head>
<body class="cl-bg" style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${C.bg};opacity:0;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${C.bg}" class="cl-bg" style="background:${C.bg};">
    <tr><td align="center" style="padding:48px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${C.card}" class="cl-card" style="max-width:600px;background:${C.card};border-radius:22px;border:1px solid ${C.border};overflow:hidden;">

        <!-- Top accent line -->
        <tr><td style="height:4px;line-height:4px;font-size:0;background:${C.accent};">&nbsp;</td></tr>

        <!-- Header: wordmark logo + eyebrow -->
        <tr><td align="center" style="padding:40px 40px 30px;">
          <img src="${LOGO_URL}" width="168" alt="CALINESS" style="display:block;width:168px;max-width:168px;height:auto;border:0;outline:none;text-decoration:none;margin:0 auto;" />
          <p class="cl-muted" style="font-family:${C.font};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.muted};margin:20px 0 0;font-weight:600;">7-Tage Reset</p>
        </td></tr>

        <!-- Content -->
        <tr><td style="padding:8px 40px 36px;">${content}</td></tr>

        ${signature()}

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
  return `<p class="cl-text" style="font-family:${C.font};font-size:26px;font-weight:700;color:${C.text};margin:0 0 18px;line-height:1.22;letter-spacing:-0.4px;">${text}</p>`;
}

function body(text: string): string {
  return `<p class="cl-textsec" style="font-family:${C.font};font-size:15px;color:${C.textSec};margin:0 0 20px;line-height:1.72;">${text}</p>`;
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
// 8 EMAIL CONTENTS — Welcome (day0) + ein themed Mail pro Reset-Tag (day1–7)
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
          checkRow("Tag 1 — dein persönlicher Startpunkt: Kalorien, Protein, dein größter Hebel"),
          checkRow("Tag 2–5 — Ernährung, Bewegung, Schlaf und Stress, je ein Mini-Tool"),
          checkRow("Tag 6 — dein Körpergefühl & Longevity-Blick"),
          checkRow("Tag 7 — persönliche Auswertung + dein nächster Schritt"),
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

  // ─── DAY 1: Startpunkt — Kalorien & Protein ────────────────────────────
  {
    type: "reset_day1",
    subject: (name) => `${name}, Tag 1 — deine echten Zahlen`,
    html: (name, unsub) =>
      shell(
        "Schluss mit Raten. Heute kennst du deinen Startpunkt.",
        [
          badge("Tag 1 · Startpunkt"),
          headline(`${name}, hör auf zu raten.`),
          body(
            `Die meisten essen „nach Gefühl" und wundern sich, warum nichts passiert. Heute drehst du das um: In 2 Minuten berechnest du deinen <strong>persönlichen Kalorien- und Proteinbereich</strong> — kein Kalorienzählen, nur Orientierung.`
          ),
          body(
            `<strong>Dein erster Mini-Reset:</strong> Bau in jede Mahlzeit eine Handfläche Protein ein. Das ist der eine Hebel, der bei fast jedem sofort wirkt — stabiler Blutzucker, weniger Heißhunger, mehr Fokus.`
          ),
          checkRow("Skyr + Beeren + Nüsse — ca. 35 g Protein"),
          checkRow("3 Eier + Vollkornbrot — ca. 30 g Protein"),
          checkRow("Hähnchen-Bowl mittags — ca. 45 g Protein"),
          cta("Tag 1 berechnen", `${RESET_URL}/day/1`),
        ].join(""),
        unsub
      ),
  },

  // ─── DAY 2: Ernährung — Struktur statt Verbote ────────────────────────
  {
    type: "reset_day2",
    subject: (name) => `${name}, Ernährung ohne Verbote`,
    html: (name, unsub) =>
      shell(
        "Warum dein Nachmittagstief kein Disziplinproblem ist.",
        [
          badge("Tag 2 · Ernährung"),
          headline(`${name}, es liegt nicht an Disziplin.`),
          body(
            `Heißhunger um 16 Uhr ist kein Versagen — es ist ein leerer Tank. Wer morgens zu wenig isst und Mahlzeiten dem Zufall überlässt, zahlt am Nachmittag drauf. Nicht mit Willenskraft, sondern mit Cravings.`
          ),
          body(
            `<strong>Die Lösung ist unspektakulär:</strong> feste Mahlzeiten-Slots statt Dauer-Entscheidungen. 2–3 Mahlzeiten, jede mit Protein, grob zur gleichen Zeit. Dein Körper hört auf zu kämpfen, wenn er weiß, was kommt.`
          ),
          checkRow("Plane heute 2–3 Mahlzeiten — Zeit, Ort, was. Egal was, Hauptsache fest."),
          checkRow("Eine proteinreiche Option vorbereiten, die du magst und im Haus hast."),
          cta("Tag 2 im Reset öffnen", `${RESET_URL}/day/2`),
          divider(),
          body(
            `<span style="font-size:13px;color:${C.muted};">In der <strong>CALINESS App</strong> kommen diese Vorschläge täglich automatisch — abgestimmt auf das, was du magst. Aber dazu später mehr.</span>`
          ),
        ].join(""),
        unsub
      ),
  },

  // ─── DAY 3: Bewegung — NEAT schlägt HIIT ──────────────────────────────
  {
    type: "reset_day3",
    subject: (name) => `${name}, warum Spazieren unterschätzt wird`,
    html: (name, unsub) =>
      shell(
        "Ein ruhiger Spaziergang bringt mehr, als die meisten glauben.",
        [
          badge("Tag 3 · Bewegung"),
          headline(`${name}, du musst dich nicht quälen.`),
          body(
            `Die Idee, dass nur schweißtreibendes Training „zählt", hält viele vom Anfangen ab. Dabei kommt der größte Hebel im Alltag von <strong>NEAT</strong> — der Bewegung neben dem Sport: gehen, stehen, Treppen, ein Spaziergang nach dem Essen.`
          ),
          body(
            `<strong>Heute:</strong> ein 10–15-Minuten-Spaziergang nach deiner größten Mahlzeit. Das senkt den Blutzucker-Peak spürbar — und ist sofort umsetzbar, ohne Gym, ohne Umziehen.`
          ),
          checkRow("Nach der größten Mahlzeit kurz raus — 10 Minuten reichen."),
          checkRow("Dein Schrittziel im Reset checken — realistisch, nicht pauschal."),
          cta("Tag 3 im Reset öffnen", `${RESET_URL}/day/3`),
        ].join(""),
        unsub
      ),
  },

  // ─── DAY 4: Schlaf — der eigentliche Reset-Knopf ──────────────────────
  {
    type: "reset_day4",
    subject: (name) => `${name}, dein Reset-Knopf heißt Schlaf`,
    html: (name, unsub) =>
      shell(
        "Wenn Schlaf passt, holt sich der Körper den Rest.",
        [
          badge("Tag 4 · Schlaf"),
          headline(`${name}, hier entscheidet sich das meiste.`),
          body(
            `Du kannst Ernährung und Bewegung perfekt machen — wenn der Schlaf nicht stimmt, bremst alles. Schlechter Schlaf heißt mehr Hunger am nächsten Tag, weniger Energie, schwächere Regeneration. Es ist der stillste, aber stärkste Hebel.`
          ),
          body(
            `<strong>Die gute Nachricht:</strong> Du brauchst keine perfekte Nacht. Eine Sache besser zu machen reicht — meistens ist es eine: Koffein-Stopp am Nachmittag, Bildschirm-Pause vor dem Bett oder eine feste Zubettgeh-Zeit.`
          ),
          checkRow("Im Schlaf-Check findest du deine größte Stellschraube — nicht alle, eine."),
          checkRow("Diese eine Sache heute Abend umsetzen. Mehr nicht."),
          cta("Tag 4 im Reset öffnen", `${RESET_URL}/day/4`),
        ].join(""),
        unsub
      ),
  },

  // ─── DAY 5: Stress — das Abend-Problem ist ein Nachmittags-Problem ────
  {
    type: "reset_day5",
    subject: (name) => `${name}, warum dein Abend kippt`,
    html: (name, unsub) =>
      shell(
        "Dein Abend-Problem entscheidet sich am Nachmittag.",
        [
          badge("Tag 5 · Stress & Muster"),
          headline(`${name}, es ist selten der Abend.`),
          body(
            `Das Snacken vor dem Fernseher, der Stress-Hunger um 21 Uhr — das fühlt sich wie ein Abend-Problem an. Meistens ist es aber ein Nachmittags-Problem: zu wenig gegessen, zu viel Stress angesammelt, kein Ventil gehabt.`
          ),
          body(
            `<strong>Heute findest du dein Muster:</strong> Was kippt deinen Tag wirklich? Hunger, Schlaf, Stress oder fehlende Struktur? Wenn du den Auslöser kennst, brauchst du keine Disziplin mehr — nur einen Gegenhebel.`
          ),
          quote(
            "Ich dachte immer, mir fehlt Willenskraft. Tatsächlich hatte ich nachmittags einfach zu wenig Protein. Ein Snack um 15 Uhr — und der Abend war kein Thema mehr.",
            "Markus, 38 — nach dem Reset"
          ),
          cta("Tag 5 im Reset öffnen", `${RESET_URL}/day/5`),
        ].join(""),
        unsub
      ),
  },

  // ─── DAY 6: Körpergefühl & Longevity ──────────────────────────────────
  {
    type: "reset_day6",
    subject: (name) => `${name}, was dein Alltag über dein Alter verrät`,
    html: (name, unsub) =>
      shell(
        "Nicht das Gewicht zählt — das System dahinter.",
        [
          badge("Tag 6 · Körpergefühl & Longevity"),
          headline(`${name}, denk in Jahrzehnten, nicht in Wochen.`),
          body(
            `Die meisten optimieren für die Waage. Dabei ist die spannendere Frage: Wie fühlst du dich in deinem Körper — und was sagt dein Alltag über deine nächsten 20, 30 Jahre? Energie, Schlaf, Bewegung und Stress sind nicht nur „Diät-Themen". Sie sind die Stellschrauben für ein langes, vitales Leben.`
          ),
          body(
            `<strong>Heute:</strong> Spür bewusst hin. Wo stehst du gerade — und in welche Richtung zeigt dein aktueller Alltag? Das ist kein Urteil, sondern eine Standortbestimmung.`
          ),
          checkRow("Dein Wochengerüst bauen — damit aus 7 Tagen ein System wird."),
          cta("Tag 6 im Reset öffnen", `${RESET_URL}/day/6`),
          divider(),
          body(
            `<span style="font-size:13px;color:${C.muted};">Neugierig auf deinen Longevity-Status? Unser kurzer Bio-Age-Test gibt dir eine erste Einordnung — ganz ohne Verpflichtung, wenn du magst.</span>`
          ),
        ].join(""),
        unsub
      ),
  },

  // ─── DAY 7: Auswertung + zwei Wege (App / Coaching) ───────────────────
  {
    type: "reset_day7",
    subject: (name) => `${name}, dein Reset ist durch — so geht's weiter`,
    html: (name, unsub) =>
      shell(
        "7 Tage geschafft. Jetzt entscheidet sich, ob es bleibt.",
        [
          badge("Tag 7 · Auswertung"),
          headline(`${name}, du hast es durchgezogen.`),
          body(
            `Das ziehen die wenigsten durch. Du kennst jetzt deinen Startpunkt, deine Stellschrauben und dein Wochengerüst. Die ehrliche Frage ist: Was passiert in den nächsten Wochen, wenn der Alltag zurückkommt?`
          ),
          body(
            `Ein Reset zeigt dir <em>was</em> funktioniert. Veränderung entsteht danach — und dafür gibt es zwei Wege. Beide bauen auf deinen 7 Tagen auf, keiner fängt bei null an.`
          ),
          divider(),
          body(`<strong>Weg 1 — selbstständig mit der CALINESS App</strong>`),
          body(
            `Für Selbststarter, die täglich Klarheit, Struktur und einen KI-Coach in der Tasche wollen. Dein Reset-Profil wird zum lebenden Dashboard — Plan, Auswertung und Fortschritt, jede Woche neu justiert.`
          ),
          cta("Frühzugang zur App sichern", APP_TRIAL_URL),
          divider(),
          body(`<strong>Weg 2 — begleitet mit dem Coaching</strong>`),
          body(
            `Für Menschen, die persönliche Strategie, Accountability und individuelle Umsetzung wollen. In einem kostenlosen Strategiegespräch (30 Min) schauen David & Sarah sich dein Ergebnis an und bauen mit dir einen konkreten Plan.`
          ),
          cta("Strategiegespräch buchen", COACHING_URL),
          divider(),
          body(
            `<span style="font-size:13px;color:${C.muted};">Kein Druck. Wenn der Reset dir gereicht hat, ist das völlig okay — du hast echt etwas über deinen Körper gelernt. Das gehört dir, egal wie es weitergeht.</span>`
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
  // Fetch all active subscribers within the 8-day window (day 0–7)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 8);

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

    // day0 is sent on signup, cron handles day1..day7
    // ageDays=1 → day1, ageDays=2 → day2, …, ageDays=7 → day7
    if (ageDays >= 1 && ageDays <= 7) {
      const emailDef = SEQUENCE[ageDays]; // index 1–7
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

    // Preview: send one specific mail to one explicit address (no idempotency log).
    // Used to review the design; harmless since it only targets the given email.
    if (body.trigger === "preview" && body.email) {
      const def = SEQUENCE.find((e) => e.type === body.type) ?? SEQUENCE[0];
      const name = (body.name || "David").trim();
      const unsubUrl = `${UNSUBSCRIBE_BASE}?action=unsubscribe&email=${encodeURIComponent(body.email)}`;
      const r = await sendViaBre({ email: body.email, name }, `[Preview] ${def.subject(name)}`, def.html(name, unsubUrl));
      return new Response(
        JSON.stringify({ success: !r.error, type: def.type, error: r.error ?? null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown trigger. Use "reset_signup", "cron" or "preview".' }),
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
