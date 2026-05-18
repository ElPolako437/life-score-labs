// ═══════════════════════════════════════════════════════════════════════════
// TAG 9 — LETZTE CHANCE (App-Warteliste als Hauptthema)
// Ziel: Low-friction Conversion für alle, die Sprint/Coaching noch nicht bereit
// ═══════════════════════════════════════════════════════════════════════════

import {
  C, accentLine, heroHeadline, bodyText, sectionLabel,
  checkList, ctaButton, signature, psBlock, wrapEmail,
} from "./shared.ts";

export function renderTag9(
  vorname: string | null,
): { html: string; text: string } {
  const name = vorname ?? "hey";

  const bodyRows = `
  <tr>
    <td style="padding:44px 40px 40px;">

      ${accentLine()}
      ${heroHeadline("Falls Sprint und Coaching gerade nicht passen — das hier schon.", 34)}

      ${bodyText(`${name},`)}
      ${bodyText("Nicht jeder Moment ist der richtige für intensive Begleitung. Manchmal stimmt das Timing nicht, manchmal das Budget — das ist ok.")}
      ${bodyText("Aber eines lasse ich dir nicht durchgehen: den Reset zu machen, Ergebnisse zu spüren — und dann wieder zum alten Rhythmus zurückzukehren, weil kein System da ist.")}

      <!-- Highlighted App Offer -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="margin-bottom:28px;background-color:${C.accentGlow};border:1px solid ${C.accentBorder};border-radius:14px;">
        <tr>
          <td style="padding:30px 28px;">
            <p style="font-family:${C.font};font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${C.accent};margin:0 0 10px;">CALINESS APP — BETA</p>
            <p style="font-family:${C.font};font-size:28px;font-weight:800;color:${C.white};margin:0 0 6px;letter-spacing:-0.6px;line-height:1.1;">9€/Monat<br/><span style="font-size:16px;font-weight:500;color:${C.dim};letter-spacing:0;">lifetime — statt 20€</span></p>
            <p style="font-family:${C.font};font-size:13px;color:${C.muted};margin:0 0 22px;">Nur für Beta-Anmelder · Preis gilt dauerhaft · Kein Abo-Risiko</p>

            ${sectionLabel("Was du bekommst")}
            ${checkList([
              "Early Access vor allen anderen — du formst das Produkt mit",
              "Täglicher Longevity-Plan & Score-Tracking",
              "AI-Coach für Fragen, Anpassungen, Protokolle",
              "Lifetime-Preis — du zahlst nie mehr als 9€/Monat",
            ])}
          </td>
        </tr>
      </table>

      ${ctaButton("Platz sichern — 9€/Monat lifetime →", "https://caliness-academy.de/app", "Jetzt anmelden · Preis steigt nach Beta-Phase auf 20€/Monat")}

      ${bodyText("Trag dich ein. Du bekommst nur eine Nachricht: wenn die App live geht — und das ist dein Moment.")}

      ${signature("David", "Caliness Academy · hallo@caliness-academy.de")}

      ${psBlock("Das hier ist die letzte Mail dieser Sequenz. Falls du Fragen hast oder nicht sicher bist welcher Weg passt — antworte einfach. Ich lese und antworte persönlich.")}

    </td>
  </tr>`;

  const text = `CALINESS ACADEMY — 7-TAGE RESET
LETZTE ERINNERUNG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Falls Sprint und Coaching gerade nicht passen — das hier schon.

${name},

Nicht jeder Moment ist der richtige für intensive Begleitung. Das ist ok.

Aber eines lasse ich dir nicht durchgehen: den Reset zu machen, Ergebnisse zu spüren — und dann wieder zum alten Rhythmus zurückzukehren, weil kein System da ist.

CALINESS APP — BETA
9€/Monat lifetime — statt 20€
Nur für Beta-Anmelder · Preis gilt dauerhaft · Kein Abo-Risiko

✓ Early Access vor allen anderen — du formst das Produkt mit
✓ Täglicher Longevity-Plan & Score-Tracking
✓ AI-Coach für Fragen, Anpassungen, Protokolle
✓ Lifetime-Preis — du zahlst nie mehr als 9€/Monat

→ Platz sichern: https://caliness-academy.de/app

Trag dich ein. Du bekommst nur eine Nachricht: wenn die App live geht.

David
Caliness Academy · hallo@caliness-academy.de

PS: Das hier ist die letzte Mail dieser Sequenz. Falls du Fragen hast — antworte einfach. Ich lese und antworte persönlich.

—
Impressum: https://caliness-academy.de/impressum
Abmelden: https://caliness-academy.de/abmelden`;

  return {
    // Warteliste ist Hauptthema — kein doppelter Footer-Block
    html: wrapEmail(
      "LETZTE ERINNERUNG",
      bodyRows,
      `${name}, ein letzter Hinweis — und dann lass ich dich in Ruhe.`,
      false,
    ),
    text,
  };
}
