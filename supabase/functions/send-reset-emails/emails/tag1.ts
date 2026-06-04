// ═══════════════════════════════════════════════════════════════════════════
// TAG 1 — DEIN START
// Ziel: Erster Eindruck, Vertrauen aufbauen, App-Öffnung triggern
// ═══════════════════════════════════════════════════════════════════════════

import {
  C, accentLine, heroHeadline, sectionLabel, bodyText,
  quoteBlock, checkList, surfaceCard, statRow, ctaButton,
  signature, psBlock, wrapEmail,
} from "./shared.ts";

export function renderTag1(
  vorname: string | null,
  resetAppUrl: string,
): { html: string; text: string } {
  const name = vorname ?? "hey";

  const bodyRows = `
  <tr>
    <td style="padding:44px 40px 40px;">

      ${accentLine()}
      ${heroHeadline("Heute geht's nicht ums Mehr.<br/>Sondern ums Richtige.")}

      ${bodyText(`${name},`)}
      ${bodyText("Du hast es wahrscheinlich schon mit früher schlafen, weniger Essen, mehr Disziplin versucht. Nichts hat dauerhaft geholfen. Das liegt nicht an dir — es liegt daran, dass das System falsch angesetzt hat.")}
      ${bodyText(`Die nächsten 7 Tage sind anders. Nicht weil sie härter sind. Sondern weil sie <strong style="color:${C.white}">an der richtigen Stelle</strong> ansetzen.`)}

      ${quoteBlock("„Stabilität ist kein Stillstand — sie ist die Grundlage, auf der alles andere aufbaut."")}

      ${statRow([
        { value: "7", label: "Tage" },
        { value: "~10 Min", label: "täglich" },
        { value: "200+", label: "Teilnehmer" },
      ])}

      ${sectionLabel("Deine 3 Aufgaben für heute")}
      ${surfaceCard(checkList([
        `<strong style="color:${C.white}">30 Min Bewegung</strong> — ruhig, draußen, ohne Kopfhörer`,
        `<strong style="color:${C.white}">2 proteinreiche Mahlzeiten</strong> — Frühstück und Abendessen`,
        `<strong style="color:${C.white}">Schlafenszeit festlegen</strong> — heute, und die nächsten 6 Tage gleich`,
      ]))}

      ${ctaButton("Tag 1 jetzt öffnen →", resetAppUrl, "Kein Konto erforderlich · Kostenlos · direkt im Browser")}

      ${signature("David", "Caliness Academy · hallo@caliness-academy.de")}

      ${psBlock(`Auf WhatsApp begleite ich dich täglich mit einem kurzen Impuls. Falls du noch nicht dabei bist: <a href="https://caliness-academy.de/whatsapp" style="color:${C.accent};text-decoration:none;font-weight:600;">hier eintragen →</a>`)}

    </td>
  </tr>`;

  const text = `CALINESS ACADEMY — 7-TAGE RESET
TAG 1 · DEIN START
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Heute geht's nicht ums Mehr. Sondern ums Richtige.

${name},

Du hast es wahrscheinlich schon mit früher schlafen, weniger Essen, mehr Disziplin versucht. Nichts hat dauerhaft geholfen. Das liegt nicht an dir — es liegt daran, dass das System falsch angesetzt hat.

Die nächsten 7 Tage sind anders. Nicht weil sie härter sind. Sondern weil sie an der richtigen Stelle ansetzen.

„Stabilität ist kein Stillstand — sie ist die Grundlage, auf der alles andere aufbaut."

7 Tage · ~10 Min täglich · 200+ Teilnehmer

DEINE 3 AUFGABEN FÜR HEUTE:
✓ 30 Min Bewegung — ruhig, draußen, ohne Kopfhörer
✓ 2 proteinreiche Mahlzeiten — Frühstück und Abendessen
✓ Schlafenszeit festlegen — heute, und die nächsten 6 Tage gleich

→ Tag 1 öffnen: ${resetAppUrl}

David
Caliness Academy · hallo@caliness-academy.de

PS: Auf WhatsApp begleite ich dich täglich mit einem kurzen Impuls.
Falls du noch nicht dabei bist: https://caliness-academy.de/whatsapp

—
Impressum: https://caliness-academy.de/impressum
Abmelden: https://caliness-academy.de/abmelden`;

  return {
    html: wrapEmail(
      "TAG 1 · DEIN START",
      bodyRows,
      `${name}, dein Reset beginnt heute — das ist Schritt 1.`,
      true,
    ),
    text,
  };
}
