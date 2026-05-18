// ═══════════════════════════════════════════════════════════════════════════
// TAG 3 — MID-RESET CHECK-IN
// Ziel: Engagement halten, Körperreaktion bestätigen, Vorfreude auf Tag 5
// ═══════════════════════════════════════════════════════════════════════════

import {
  C, accentLine, heroHeadline, bodyText,
  quoteBlock, sectionLabel, surfaceCard, checkList,
  signature, psBlock, wrapEmail,
} from "./shared.ts";

export function renderTag3(
  vorname: string | null,
): { html: string; text: string } {
  const name = vorname ?? "hey";

  const bodyRows = `
  <tr>
    <td style="padding:44px 40px 40px;">

      ${accentLine()}
      ${heroHeadline("Wie fühlt sich der Rhythmus an?")}

      ${bodyText(`${name},`)}
      ${bodyText("Tag 3 ist der erste Punkt, an dem dein Körper anfängt zu reagieren — meistens subtil, fast unbemerkt. Schlaf wird stabiler. Hunger reguliert sich. Die Energie kommt gleichmäßiger.")}
      ${bodyText("Das ist kein Zufall. Das Nervensystem braucht genau diese Zeit, um aus dem Alarmzustand in die Regulation zu wechseln.")}

      ${quoteBlock("„Wenn jetzt etwas schwer fällt — das ist normal. Es ist der Moment, in dem die alten Muster Widerstand leisten. Genau hier trennt sich, wer durchhält."")}

      ${sectionLabel("Was du vielleicht gerade schon merkst")}
      ${surfaceCard(checkList([
        "<strong style=\"color:${C.white}\">Schlaf:</strong> Tiefere Phasen, weniger Aufwachen in der Nacht",
        "<strong style=\"color:${C.white}\">Energie:</strong> Gleichmäßiger über den Tag, weniger Nachmittags-Crash",
        "<strong style=\"color:${C.white}\">Kopf:</strong> Weniger Reizüberflutung, ruhigere Morgende",
      ]))}

      ${bodyText("Wenn du <em>eine</em> dieser drei Sachen schon spürst — du bist auf Kurs. Wenn noch nicht: Tag 5 wird der Punkt sein, an dem es klickt.")}

      ${signature("David", "Caliness Academy · hallo@caliness-academy.de")}

      ${psBlock("Tag 5 bekommst du einen Wendepunkt-Trigger — den schicke ich dir persönlich. Sei bereit.")}

    </td>
  </tr>`;

  const text = `CALINESS ACADEMY — 7-TAGE RESET
TAG 3 · KLEINER CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Wie fühlt sich der Rhythmus an?

${name},

Tag 3 ist der erste Punkt, an dem dein Körper anfängt zu reagieren — meistens subtil, fast unbemerkt. Schlaf wird stabiler. Hunger reguliert sich. Die Energie kommt gleichmäßiger.

Das ist kein Zufall. Das Nervensystem braucht genau diese Zeit, um aus dem Alarmzustand in die Regulation zu wechseln.

„Wenn jetzt etwas schwer fällt — das ist normal. Es ist der Moment, in dem die alten Muster Widerstand leisten. Genau hier trennt sich, wer durchhält."

WAS DU VIELLEICHT GERADE SCHON MERKST:
✓ Schlaf: Tiefere Phasen, weniger Aufwachen in der Nacht
✓ Energie: Gleichmäßiger über den Tag, weniger Nachmittags-Crash
✓ Kopf: Weniger Reizüberflutung, ruhigere Morgende

Wenn du eine dieser drei Sachen schon spürst — du bist auf Kurs. Wenn noch nicht: Tag 5 wird der Punkt sein, an dem es klickt.

David
Caliness Academy · hallo@caliness-academy.de

PS: Tag 5 bekommst du einen Wendepunkt-Trigger — den schicke ich dir persönlich. Sei bereit.

—
Impressum: https://caliness-academy.de/impressum
Abmelden: https://caliness-academy.de/abmelden`;

  return {
    html: wrapEmail(
      "TAG 3 · KLEINER CHECK",
      bodyRows,
      `${name}, Tag 3 — was dein Körper gerade schon verarbeitet.`,
      true,
    ),
    text,
  };
}
