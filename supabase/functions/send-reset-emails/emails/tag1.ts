// ═══════════════════════════════════════════════════════════════════════════
// TAG 1 – DEIN START
// ═══════════════════════════════════════════════════════════════════════════

import { C, eyebrow, greenLine, headline, bodyText, label, quoteBlock, checkList, card, ctaButton, psText, wrapEmail } from "./shared.ts";

export function renderTag1(
  vorname: string | null,
  resetAppUrl: string,
): { html: string; text: string } {
  const name = vorname ?? "hey";

  const bodyRows = `
  <tr>
    <td style="padding:0 32px 40px;">
      ${eyebrow("TAG 1 · DEIN START")}
      ${greenLine()}
      ${headline("Heute geht's nicht ums Mehr. Sondern ums Richtige.")}

      ${bodyText(`${name},`)}
      ${bodyText("Die ersten 7 Tage funktionieren anders als alles, was du bisher versucht hast — weil sie nicht auf Disziplin setzen, sondern auf Regulation. Dein System braucht keine Push-Energie. Es braucht Stabilität.")}

      ${quoteBlock("„Stabilität ist kein Stillstand — sie ist die Grundlage."")}

      ${label("Heute — deine 3 Punkte:")}
      ${card(checkList([
        "30 Min ruhige Bewegung an der frischen Luft",
        "2 proteinreiche Mahlzeiten (Frühstück + Abendessen)",
        "Schlafenszeit festlegen — heute & alle nächsten 6 Tage gleich",
      ]))}

      ${ctaButton("Tag 1 in der App öffnen →", resetAppUrl)}

      ${psText(`Auf WhatsApp begleite ich dich täglich kurz. Falls du noch nicht eingetragen bist: <a href="https://caliness.academy/whatsapp" style="color:${C.accent};text-decoration:none;">hier eintragen →</a>`)}
    </td>
  </tr>`;

  const text = `TAG 1 · DEIN START
━━━━━━━━━━━━━━━━━━━━━━━

Heute geht's nicht ums Mehr. Sondern ums Richtige.

${name},

Die ersten 7 Tage funktionieren anders als alles, was du bisher versucht hast — weil sie nicht auf Disziplin setzen, sondern auf Regulation. Dein System braucht keine Push-Energie. Es braucht Stabilität.

„Stabilität ist kein Stillstand — sie ist die Grundlage."

Heute — deine 3 Punkte:
✓ 30 Min ruhige Bewegung an der frischen Luft
✓ 2 proteinreiche Mahlzeiten (Frühstück + Abendessen)
✓ Schlafenszeit festlegen — heute & alle nächsten 6 Tage gleich

App öffnen: ${resetAppUrl}

PS: Auf WhatsApp begleite ich dich täglich kurz. Falls du noch nicht eingetragen bist: https://caliness.academy/whatsapp

—
CALINESS ACADEMY · hallo@caliness.academy
Abmelden: https://caliness.academy/abmelden`;

  return {
    html: wrapEmail(bodyRows, "Tag 1 ist da — 3 Punkte für heute.", true),
    text,
  };
}
