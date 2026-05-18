// ═══════════════════════════════════════════════════════════════════════════
// SEND RESET EMAILS – CALINESS ACADEMY
// Cron-driven Edge Function: täglich 08:00 UTC
// Sendet Tag-1/5/7/9-Mails an aktive Reset-Participants via Resend
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") as string;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Mail schedule: which days trigger which mail
const MAIL_SCHEDULE: Record<number, string> = {
  1: "tag-1",
  3: "tag-3",
  5: "tag-5",
  7: "tag-7",
  9: "tag-9",
};

interface Participant {
  id: string;
  email: string;
  vorname: string | null;
  start_datum: string;
  ziel: string | null;
  mails_sent: string[];
}

// ─── Email content placeholders ─────────────────────────────────────────────
// Mail-Inhalte werden separat geliefert und hier eingesetzt.
// Bis dahin werden strukturierte Platzhalter verwendet.

function buildEmailHtml(mailKey: string, vorname: string | null): string {
  const name = vorname || "du";
  const dayNum = mailKey.replace("tag-", "");

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>7-Tage Reset – Tag ${dayNum}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0c0e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0a0c0e;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#111318;border-radius:16px;border:1px solid rgba(255,255,255,0.06);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:40px 32px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <img src="https://caliness-academy.de/images/caliness-logo-white.png" alt="Caliness Academy" width="140" style="display:block;max-width:140px;height:auto;">
              <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b7a8f;margin:12px 0 0;">7-Tage Reset · Tag ${dayNum}</p>
            </td>
          </tr>
          <!-- Body – PLACEHOLDER: wird durch echten Inhalt ersetzt -->
          <tr>
            <td style="padding:32px;">
              <p style="font-size:15px;font-weight:500;color:#f8fafc;margin:0 0 16px;">Hallo ${name},</p>
              <p style="font-size:14px;color:#b8c4d4;line-height:1.7;margin:0 0 24px;">
                [Inhalt für ${mailKey} folgt – wird separat befüllt]
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <a href="mailto:team@caliness-academy.de" style="font-size:12px;color:#2dd36f;text-decoration:none;">team@caliness-academy.de</a>
              <p style="font-size:11px;color:#6b7a8f;margin:12px 0 0;">© ${new Date().getFullYear()} Caliness Academy</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildEmailText(mailKey: string, vorname: string | null): string {
  const name = vorname || "du";
  const dayNum = mailKey.replace("tag-", "");
  return `CALINESS ACADEMY – 7-TAGE RESET · TAG ${dayNum}\n\nHallo ${name},\n\n[Inhalt für ${mailKey} folgt – wird separat befüllt]\n\nBei Fragen: team@caliness-academy.de\n© ${new Date().getFullYear()} Caliness Academy`;
}

function buildSubject(mailKey: string, vorname: string | null): string {
  const name = vorname ? `, ${vorname}` : "";
  const subjects: Record<string, string> = {
    "tag-1": `Dein Reset beginnt heute${name} — das ist dein erster Schritt`,
    "tag-3": `Tag 3${name} — wie läuft es bisher?`,
    "tag-5": `Tag 5${name} — du bist auf Kurs`,
    "tag-7": `Tag 7${name} — du hast es durchgezogen`,
    "tag-9": `Wie war dein Reset${name}? Und wie geht es weiter?`,
  };

  return subjects[mailKey] ?? `7-Tage Reset – ${mailKey}`;
}

// ─── Send a single email via Resend ─────────────────────────────────────────

async function sendEmail(
  email: string,
  vorname: string | null,
  mailKey: string,
): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Caliness Academy <noreply@caliness-academy.de>",
      to: [email],
      subject: buildSubject(mailKey, vorname),
      html: buildEmailHtml(mailKey, vorname),
      text: buildEmailText(mailKey, vorname),
      reply_to: "team@caliness-academy.de",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Resend error for ${email}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  console.log(`send-reset-emails: Sent ${mailKey} to ${email} → id=${data.id}`);
}

// ─── Main handler ────────────────────────────────────────────────────────────

const handler = async (_req: Request): Promise<Response> => {
  console.log("send-reset-emails: Cron triggered at", new Date().toISOString());

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Fetch all active participants
  const { data: participants, error } = await supabase
    .from("reset_participants")
    .select("id, email, vorname, start_datum, ziel, mails_sent")
    .eq("status", "active");

  if (error) {
    console.error("send-reset-emails: DB fetch error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!participants || participants.length === 0) {
    console.log("send-reset-emails: No active participants.");
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let sent = 0;
  let errors = 0;

  for (const p of participants as Participant[]) {
    const start = new Date(p.start_datum);
    start.setUTCHours(0, 0, 0, 0);

    // Day difference: start_datum = day 1, so +0 days = day 1
    const diffMs = today.getTime() - start.getTime();
    const dayNumber = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    const mailKey = MAIL_SCHEDULE[dayNumber];

    // Skip if no mail scheduled today or already sent
    if (!mailKey) continue;
    if (p.mails_sent.includes(mailKey)) {
      console.log(`send-reset-emails: ${p.email} already received ${mailKey} – skip`);
      continue;
    }

    try {
      await sendEmail(p.email, p.vorname, mailKey);

      // Mark mail as sent
      const updatedMailsSent = [...p.mails_sent, mailKey];
      await supabase
        .from("reset_participants")
        .update({ mails_sent: updatedMailsSent })
        .eq("id", p.id);

      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`send-reset-emails: Failed for ${p.email}:`, msg);
      errors++;
    }
  }

  console.log(`send-reset-emails: Done. sent=${sent}, errors=${errors}, checked=${participants.length}`);
  return new Response(JSON.stringify({ sent, errors, checked: participants.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

serve(handler);
