// ═══════════════════════════════════════════════════════════════════════════
// SEND RESET EMAILS – CALINESS ACADEMY
// Cron-driven Edge Function: täglich 08:00 UTC
// Sendet Tag-1/3/5/7/9-Mails an aktive Reset-Participants via Resend
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderTag1 } from "./emails/tag1.ts";
import { renderTag3 } from "./emails/tag3.ts";
import { renderTag5 } from "./emails/tag5.ts";
import { renderTag7 } from "./emails/tag7.ts";
import { renderTag9 } from "./emails/tag9.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") as string;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const RESET_APP_URL = Deno.env.get("RESET_APP_URL") || "https://caliness.academy/reset";

// Mail schedule: day number → mail key
const MAIL_SCHEDULE: Record<number, string> = {
  1: "tag-1",
  3: "tag-3",
  5: "tag-5",
  7: "tag-7",
  9: "tag-9",
};

// Subject lines — lowercase brand voice, curiosity over clickbait
const SUBJECTS: Record<string, (name: string | null) => string> = {
  "tag-1": (n) => n ? `${n}, tag 1 — los geht's` : "tag 1 — los geht's",
  "tag-3": (n) => n ? `${n}, tag 3 — kurz reingrätschen` : "tag 3 — kurz reingrätschen",
  "tag-5": (n) => n ? `${n}, was dein körper gerade macht` : "was dein körper gerade macht",
  "tag-7": (n) => n ? `${n}, dein reset ist durch — drei wege wie's weitergeht` : "dein reset ist durch — drei wege wie's weitergeht",
  "tag-9": (n) => n ? `${n}, ein letzter hinweis` : "ein letzter hinweis",
};

interface Participant {
  id: string;
  email: string;
  vorname: string | null;
  start_datum: string;
  mails_sent: string[];
}

// ─── Render correct template per day ────────────────────────────────────────

function renderEmail(
  mailKey: string,
  vorname: string | null,
): { html: string; text: string } {
  switch (mailKey) {
    case "tag-1": return renderTag1(vorname, RESET_APP_URL);
    case "tag-3": return renderTag3(vorname);
    case "tag-5": return renderTag5(vorname);
    case "tag-7": return renderTag7(vorname);
    case "tag-9": return renderTag9(vorname);
    default: return { html: "", text: "" };
  }
}

// ─── Send single email via Resend ───────────────────────────────────────────

async function sendEmail(
  email: string,
  vorname: string | null,
  mailKey: string,
): Promise<void> {
  const { html, text } = renderEmail(mailKey, vorname);
  const subjectFn = SUBJECTS[mailKey];
  const subject = subjectFn ? subjectFn(vorname) : `CALINESS Reset – ${mailKey}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "David von Caliness Academy <hallo@caliness-academy.de>",
      to: [email],
      subject,
      html,
      text,
      reply_to: "hallo@caliness-academy.de",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Resend error: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  console.log(`send-reset-emails: Sent ${mailKey} to ${email} → id=${data.id}`);
}

// ─── Main handler ────────────────────────────────────────────────────────────

const handler = async (_req: Request): Promise<Response> => {
  console.log("send-reset-emails: Cron triggered at", new Date().toISOString());

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: participants, error } = await supabase
    .from("reset_participants")
    .select("id, email, vorname, start_datum, mails_sent")
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

    // Day 1 = start_datum, Day 2 = +1 day, etc.
    const dayNumber = Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1;
    const mailKey = MAIL_SCHEDULE[dayNumber];

    if (!mailKey) continue;
    if (p.mails_sent.includes(mailKey)) {
      console.log(`send-reset-emails: ${p.email} already received ${mailKey} — skip`);
      continue;
    }

    try {
      await sendEmail(p.email, p.vorname, mailKey);

      await supabase
        .from("reset_participants")
        .update({ mails_sent: [...p.mails_sent, mailKey] })
        .eq("id", p.id);

      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`send-reset-emails: Failed for ${p.email}:`, msg);
      errors++;
    }
  }

  console.log(`send-reset-emails: Done. sent=${sent} errors=${errors} checked=${participants.length}`);
  return new Response(
    JSON.stringify({ sent, errors, checked: participants.length }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

serve(handler);
