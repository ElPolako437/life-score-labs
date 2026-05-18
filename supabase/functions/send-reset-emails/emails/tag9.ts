// ═══════════════════════════════════════════════════════════════════════════
// TAG 9 – LETZTE ERINNERUNG (App-Warteliste als Hauptthema)
// ═══════════════════════════════════════════════════════════════════════════

import { C, eyebrow, greenLine, headline, bodyText, checkList, wrapEmail } from "./shared.ts";

export function renderTag9(
  vorname: string | null,
): { html: string; text: string } {
  const name = vorname ?? "hey";

  const bodyRows = `
  <tr>
    <td style="padding:0 32px 40px;">
      ${eyebrow("LETZTE ERINNERUNG")}
      ${greenLine()}
      ${headline("Falls Sprint und Coaching gerade nicht passen — ein letzter Tipp.", 32)}

      ${bodyText(`${name},`)}
      ${bodyText("Nicht jeder Moment ist der richtige für intensive Begleitung. Das ist ok. Aber eins bleibt offen.")}

      <!-- Highlighted App Card -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;border:1px solid ${C.borderAccent};border-radius:12px;">
        <tr>
          <td style="padding:28px;">
            <p style="font-family:${C.font};font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${C.accent};margin:0 0 12px;">CALINESS APP — BETA</p>
            <p style="font-family:${C.font};font-size:24px;font-weight:800;color:${C.white};margin:0 0 16px;line-height:1.2;letter-spacing:-0.4px;">Gründerpreis<br/>9€/Monat lifetime</p>
            ${checkList([
              "Early Access vor allen anderen",
              "Lifetime-Preis statt 20€",
              "Direkter Einfluss auf Features",
            ])}
            <table cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
              <tr>
                <td style="background-color:${C.accent};border-radius:8px;">
                  <a href="https://caliness.academy/app" target="_blank" rel="noopener noreferrer"
                    style="display:inline-block;padding:16px 32px;font-family:${C.font};font-size:15px;font-weight:700;color:#080808;text-decoration:none;">Platz sichern →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="font-family:${C.font};font-size:13px;color:${C.muted};margin:0;line-height:1.6;text-align:center;">
        Trag dich ein — kein Spam, nur eine Nachricht beim Launch.
      </p>
    </td>
  </tr>`;

  const text = `LETZTE ERINNERUNG
━━━━━━━━━━━━━━━━━━━━━━━

Falls Sprint und Coaching gerade nicht passen — ein letzter Tipp.

${name},

Nicht jeder Moment ist der richtige für intensive Begleitung. Das ist ok. Aber eins bleibt offen.

CALINESS APP — BETA
Gründerpreis 9€/Monat lifetime

✓ Early Access vor allen anderen
✓ Lifetime-Preis statt 20€
✓ Direkter Einfluss auf Features

Platz sichern: https://caliness.academy/app

Trag dich ein — kein Spam, nur eine Nachricht beim Launch.

—
CALINESS ACADEMY · hallo@caliness.academy
Abmelden: https://caliness.academy/abmelden`;

  return {
    // Warteliste ist Hauptthema — kein doppelter Block im Footer
    html: wrapEmail(bodyRows, "gründerpreis sichern — letzte chance", false),
    text,
  };
}
