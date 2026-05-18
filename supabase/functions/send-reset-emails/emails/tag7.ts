// ═══════════════════════════════════════════════════════════════════════════
// TAG 7 – DER PITCH (wichtigste Mail)
// ═══════════════════════════════════════════════════════════════════════════

import { C, eyebrow, greenLine, headline, subHeadline, bodyText, psText, wrapEmail } from "./shared.ts";

function wegCard(
  eyebrowText: string,
  title: string,
  description: string,
  price: string,
  url: string,
  buttonText: string,
  accentBorder = false,
): string {
  const border = accentBorder ? C.borderAccent : C.border;
  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;border:1px solid ${border};border-radius:12px;">
    <tr>
      <td style="padding:24px;">
        <p style="font-family:${C.font};font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${C.accent};margin:0 0 10px;">${eyebrowText}</p>
        <p style="font-family:${C.font};font-size:20px;font-weight:800;color:${C.white};margin:0 0 10px;line-height:1.25;letter-spacing:-0.3px;">${title}</p>
        <p style="font-family:${C.font};font-size:14px;color:${C.dim};margin:0 0 14px;line-height:1.65;">${description}</p>
        <p style="font-family:${C.font};font-size:13px;font-weight:700;color:${C.accent};margin:0 0 20px;">${price}</p>
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background-color:${C.accent};border-radius:6px;">
              <a href="${url}" target="_blank" rel="noopener noreferrer"
                style="display:inline-block;padding:12px 24px;font-family:${C.font};font-size:13px;font-weight:700;color:#080808;text-decoration:none;">${buttonText}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

export function renderTag7(
  vorname: string | null,
): { html: string; text: string } {
  const name = vorname ?? "hey";

  const bodyRows = `
  <tr>
    <td style="padding:0 32px 40px;">
      ${eyebrow("TAG 7 · DREI WEGE")}
      ${greenLine()}
      ${headline("Du bist durch. Jetzt die Frage, die alles entscheidet:")}
      ${subHeadline("Wie übersetzt du das in deinen Alltag?")}

      ${bodyText(`${name},`)}
      ${bodyText("Der Reset ist nicht das Ziel — er ist die Demo. Du hast 7 Tage lang erlebt, wie dein System reagiert, wenn du es richtig angehst. Jetzt gibt es drei Wege, wie das weitergeht — je nachdem wie du tickst.")}

      ${wegCard(
        "WEG 1 · SELF-STARTER",
        "CALINESS App",
        "Dein persönlicher Longevity-Plan, tägliche Aufgaben, Score-Tracking. Du machst es selbst, mit Struktur.",
        "9€/Monat lifetime (Beta-Preis, statt 20€)",
        "https://caliness.academy/app",
        "Mehr erfahren →",
      )}

      ${wegCard(
        "WEG 2 · BEGLEITUNG",
        "14-Tage Sprint",
        "Persönliche Begleitung mit Start- und Abschlussgespräch, täglichem Check-in, individuellem Plan.",
        "149€ einmalig",
        "https://caliness.academy/sprint",
        "Mehr erfahren →",
        true,
      )}

      ${wegCard(
        "WEG 3 · INTENSIV",
        "1:1 Coaching",
        "Langfristige Begleitung. Wenn du das ernsthaft angehen willst und bereit bist, in deine Gesundheit zu investieren.",
        "Auf Anfrage",
        "https://caliness.academy/coaching",
        "Mehr erfahren →",
      )}

      ${psText("Welcher Weg passt zu dir? Antworte einfach auf diese Mail — wir sind erreichbar.")}
    </td>
  </tr>`;

  const text = `TAG 7 · DREI WEGE
━━━━━━━━━━━━━━━━━━━━━━━

Du bist durch. Jetzt die Frage, die alles entscheidet:
Wie übersetzt du das in deinen Alltag?

${name},

Der Reset ist nicht das Ziel — er ist die Demo. Du hast 7 Tage lang erlebt, wie dein System reagiert, wenn du es richtig angehst. Jetzt gibt es drei Wege, wie das weitergeht.

WEG 1 · SELF-STARTER — CALINESS App
Dein persönlicher Longevity-Plan, tägliche Aufgaben, Score-Tracking. Du machst es selbst, mit Struktur.
Preis: 9€/Monat lifetime (Beta-Preis, statt 20€)
→ https://caliness.academy/app

WEG 2 · BEGLEITUNG — 14-Tage Sprint
Persönliche Begleitung mit Start- und Abschlussgespräch, täglichem Check-in, individuellem Plan.
Preis: 149€ einmalig
→ https://caliness.academy/sprint

WEG 3 · INTENSIV — 1:1 Coaching
Langfristige Begleitung. Wenn du das ernsthaft angehen willst und bereit bist, in deine Gesundheit zu investieren.
Preis: Auf Anfrage
→ https://caliness.academy/coaching

Welcher Weg passt zu dir? Antworte einfach auf diese Mail — wir sind erreichbar.

—
CALINESS ACADEMY · hallo@caliness.academy
Abmelden: https://caliness.academy/abmelden`;

  return {
    // Tag 7 ist reiner Pitch — kein Warteliste-Block, würde stören
    html: wrapEmail(bodyRows, "dein reset ist durch — drei wege wie's weitergeht", false),
    text,
  };
}
