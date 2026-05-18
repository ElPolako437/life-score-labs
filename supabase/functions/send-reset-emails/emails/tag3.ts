// ═══════════════════════════════════════════════════════════════════════════
// TAG 3 – MID-RESET CHECK-IN
// ═══════════════════════════════════════════════════════════════════════════

import { eyebrow, greenLine, headline, bodyText, label, quoteBlock, checkList, card, psText, wrapEmail } from "./shared.ts";

export function renderTag3(
  vorname: string | null,
): { html: string; text: string } {
  const name = vorname ?? "hey";

  const bodyRows = `
  <tr>
    <td style="padding:0 32px 40px;">
      ${eyebrow("TAG 3 · KLEINER CHECK")}
      ${greenLine()}
      ${headline("Wie fühlt sich der Rhythmus an?")}

      ${bodyText(`${name},`)}
      ${bodyText("Tag 3 ist der erste Punkt, an dem der Körper anfängt zu reagieren. Schlaf wird stabiler, Hunger reguliert sich, Energie steigt subtil — meistens unbemerkt, weil wir nicht danach schauen.")}

      ${quoteBlock("„Wenn jetzt etwas schwer fällt — das ist normal. Es ist der Moment, an dem die alten Muster Widerstand leisten."")}

      ${label("Was du vielleicht gerade merkst:")}
      ${card(checkList([
        "Schlafqualität: tiefere Phasen, weniger Aufwachen",
        "Energie: gleichmäßiger über den Tag, weniger Crashes",
        "Mentale Ruhe: weniger Reizüberflutung am Morgen",
      ]))}

      ${bodyText("Wenn du eine dieser drei Sachen schon spürst — du bist auf Kurs. Wenn nicht: Tag 5 wird der Punkt, an dem es klickt.")}

      ${psText("Tag 5 schickt einen Wendepunkt-Trigger. Sei bereit.")}
    </td>
  </tr>`;

  const text = `TAG 3 · KLEINER CHECK
━━━━━━━━━━━━━━━━━━━━━━━

Wie fühlt sich der Rhythmus an?

${name},

Tag 3 ist der erste Punkt, an dem der Körper anfängt zu reagieren. Schlaf wird stabiler, Hunger reguliert sich, Energie steigt subtil — meistens unbemerkt, weil wir nicht danach schauen.

„Wenn jetzt etwas schwer fällt — das ist normal. Es ist der Moment, an dem die alten Muster Widerstand leisten."

Was du vielleicht gerade merkst:
✓ Schlafqualität: tiefere Phasen, weniger Aufwachen
✓ Energie: gleichmäßiger über den Tag, weniger Crashes
✓ Mentale Ruhe: weniger Reizüberflutung am Morgen

Wenn du eine dieser drei Sachen schon spürst — du bist auf Kurs. Wenn nicht: Tag 5 wird der Punkt, an dem es klickt.

PS: Tag 5 schickt einen Wendepunkt-Trigger. Sei bereit.

—
CALINESS ACADEMY · hallo@caliness.academy
Abmelden: https://caliness.academy/abmelden`;

  return {
    html: wrapEmail(bodyRows, "Tag 3 — was der Körper schon spürt.", true),
    text,
  };
}
