// ═══════════════════════════════════════════════════════════════════════════
// TAG 5 — DER WENDEPUNKT
// Ziel: Wissenschaftliche Credibility, Neugier auf Tag 7 maximal aufbauen
// ═══════════════════════════════════════════════════════════════════════════

import {
  C, accentLine, heroHeadline, bodyText, sectionLabel,
  quoteBlock, surfaceCard, checkList,
  signature, psBlock, wrapEmail,
} from "./shared.ts";

export function renderTag5(
  vorname: string | null,
): { html: string; text: string } {
  const name = vorname ?? "hey";

  const bodyRows = `
  <tr>
    <td style="padding:44px 40px 40px;">

      ${accentLine()}
      ${heroHeadline("Wenn die ersten Tage schwer waren — und es jetzt leichter wird.")}

      ${bodyText(`${name},`)}
      ${bodyText("Was zwischen Tag 1 und Tag 5 passiert, hat einen Namen: <strong style=\"color:${C.white}\">Downregulation</strong>. Dein Nervensystem verlässt den Daueralarmzustand. Cortisol normalisiert sich. Dopaminrezeptoren erholen sich.")}
      ${bodyText("Das ist keine Motivationsfrage. Das ist Biologie — und du hast sie in Gang gesetzt.")}

      ${quoteBlock("„Das ist kein Zufall — das ist Regulation. Dein Körper hat begonnen, sich selbst zu korrigieren."")}

      ${sectionLabel("Was sich jetzt verändert haben sollte")}
      ${surfaceCard(checkList([
        "<strong style=\"color:${C.white}\">Schlaftiefe:</strong> Erholsamer, auch wenn die Stunden gleich sind",
        "<strong style=\"color:${C.white}\">Morgenenergie:</strong> Weniger Reizüberflutung, klarerer Start",
        "<strong style=\"color:${C.white}\">Entscheidungen:</strong> Fühlen sich leichter an — weniger Grübeln",
        "<strong style=\"color:${C.white}\">Hunger:</strong> Stabiler, weniger emotionaler Hunger am Abend",
      ]))}

      ${bodyText("Übermorgen ist der Reset durch. Ich zeige dir dann drei konkrete Wege, wie das dauerhaft in deinen Alltag kommt — abgestimmt auf deinen Typ.")}

      ${signature("David", "Caliness Academy · hallo@caliness-academy.de")}

      ${psBlock("Tag 7 ist die wichtigste Mail dieser Sequenz. Lies sie in Ruhe.")}

    </td>
  </tr>`;

  const text = `CALINESS ACADEMY — 7-TAGE RESET
TAG 5 · DER WENDEPUNKT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Wenn die ersten Tage schwer waren — und es jetzt leichter wird.

${name},

Was zwischen Tag 1 und Tag 5 passiert, hat einen Namen: Downregulation. Dein Nervensystem verlässt den Daueralarmzustand. Cortisol normalisiert sich. Dopaminrezeptoren erholen sich.

Das ist keine Motivationsfrage. Das ist Biologie — und du hast sie in Gang gesetzt.

„Das ist kein Zufall — das ist Regulation. Dein Körper hat begonnen, sich selbst zu korrigieren."

WAS SICH JETZT VERÄNDERT HABEN SOLLTE:
✓ Schlaftiefe: Erholsamer, auch wenn die Stunden gleich sind
✓ Morgenenergie: Weniger Reizüberflutung, klarerer Start
✓ Entscheidungen: Fühlen sich leichter an — weniger Grübeln
✓ Hunger: Stabiler, weniger emotionaler Hunger am Abend

Übermorgen ist der Reset durch. Ich zeige dir dann drei konkrete Wege, wie das dauerhaft in deinen Alltag kommt — abgestimmt auf deinen Typ.

David
Caliness Academy · hallo@caliness-academy.de

PS: Tag 7 ist die wichtigste Mail dieser Sequenz. Lies sie in Ruhe.

—
Impressum: https://caliness-academy.de/impressum
Abmelden: https://caliness-academy.de/abmelden`;

  return {
    html: wrapEmail(
      "TAG 5 · DER WENDEPUNKT",
      bodyRows,
      `${name}, was in deinem Nervensystem gerade passiert ist — und was als nächstes kommt.`,
      true,
    ),
    text,
  };
}
