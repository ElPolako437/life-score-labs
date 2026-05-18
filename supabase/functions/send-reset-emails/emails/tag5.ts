// ═══════════════════════════════════════════════════════════════════════════
// TAG 5 – DER WENDEPUNKT
// ═══════════════════════════════════════════════════════════════════════════

import { eyebrow, greenLine, headline, bodyText, label, quoteBlock, checkList, card, psText, wrapEmail } from "./shared.ts";

export function renderTag5(
  vorname: string | null,
): { html: string; text: string } {
  const name = vorname ?? "hey";

  const bodyRows = `
  <tr>
    <td style="padding:0 32px 40px;">
      ${eyebrow("TAG 5 · DER WENDEPUNKT")}
      ${greenLine()}
      ${headline("Wenn die ersten Tage seltsam schwer waren — und es jetzt leichter wird.")}

      ${bodyText(`${name},`)}
      ${bodyText("Was zwischen Tag 1 und Tag 5 passiert, hat einen Namen: Downregulation. Das Nervensystem kommt aus dem Alarmzustand. Cortisolmuster stabilisieren sich. Das ist kein Wille — das ist Biologie.")}

      ${quoteBlock("„Das ist kein Zufall — das ist Regulation."")}

      ${label("Was jetzt anders sein sollte:")}
      ${card(checkList([
        "Schlaf wird tiefer, auch wenn Stunden gleich bleiben",
        "Morgens weniger Reizüberflutung",
        "Entscheidungen fühlen sich leichter an",
      ]))}

      ${bodyText("In zwei Tagen ist der Reset durch. Ich zeig dir dann drei Wege, wie das in deinen Alltag kommt — je nachdem wie du tickst.")}

      ${psText("Tag 7 morgen. Bleib dran.")}
    </td>
  </tr>`;

  const text = `TAG 5 · DER WENDEPUNKT
━━━━━━━━━━━━━━━━━━━━━━━

Wenn die ersten Tage seltsam schwer waren — und es jetzt leichter wird.

${name},

Was zwischen Tag 1 und Tag 5 passiert, hat einen Namen: Downregulation. Das Nervensystem kommt aus dem Alarmzustand. Cortisolmuster stabilisieren sich. Das ist kein Wille — das ist Biologie.

„Das ist kein Zufall — das ist Regulation."

Was jetzt anders sein sollte:
✓ Schlaf wird tiefer, auch wenn Stunden gleich bleiben
✓ Morgens weniger Reizüberflutung
✓ Entscheidungen fühlen sich leichter an

In zwei Tagen ist der Reset durch. Ich zeig dir dann drei Wege, wie das in deinen Alltag kommt — je nachdem wie du tickst.

PS: Tag 7 morgen. Bleib dran.

—
CALINESS ACADEMY · hallo@caliness.academy
Abmelden: https://caliness.academy/abmelden`;

  return {
    html: wrapEmail(bodyRows, "Tag 5 — was im Nervensystem gerade passiert.", true),
    text,
  };
}
