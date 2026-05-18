// ═══════════════════════════════════════════════════════════════════════════
// TAG 7 — DER PITCH (wichtigste Mail der Sequenz)
// Ziel: Klare Conversion zu App / Sprint / Coaching. Kein Druck, volle Klarheit.
// ═══════════════════════════════════════════════════════════════════════════

import {
  C, accentLine, heroHeadline, subHeadline, bodyText,
  signature, psBlock, wrapEmail,
} from "./shared.ts";

function offerCard(
  tag: string,
  title: string,
  description: string,
  bulletPoints: string[],
  price: string,
  priceNote: string,
  url: string,
  btnText: string,
  highlighted = false,
): string {
  const bg     = highlighted ? C.accentGlow   : C.surface;
  const border = highlighted ? C.accentBorder : C.border;

  const bullets = bulletPoints.map(b =>
    `<tr>
      <td width="16" valign="top" style="padding:0 10px 10px 0;color:${C.accent};font-family:${C.font};font-size:13px;font-weight:700;line-height:1.5;">✓</td>
      <td style="padding:0 0 10px;font-family:${C.font};font-size:13px;color:${C.dim};line-height:1.5;">${b}</td>
    </tr>`
  ).join("");

  const badge = highlighted
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
        <tr>
          <td style="background:${C.accent};border-radius:4px;padding:3px 10px;">
            <p style="font-family:${C.font};font-size:10px;font-weight:700;letter-spacing:1.5px;color:#080808;margin:0;text-transform:uppercase;">Empfohlen</p>
          </td>
        </tr>
      </table>`
    : "";

  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%"
    style="margin-bottom:14px;background-color:${bg};border:1px solid ${border};border-radius:14px;">
    <tr>
      <td style="padding:26px 28px;">
        ${badge}
        <p style="font-family:${C.font};font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${C.accent};margin:0 0 8px;">${tag}</p>
        <p style="font-family:${C.font};font-size:22px;font-weight:800;color:${C.white};margin:0 0 10px;letter-spacing:-0.4px;line-height:1.2;">${title}</p>
        <p style="font-family:${C.font};font-size:14px;color:${C.dim};margin:0 0 18px;line-height:1.65;">${description}</p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px;">
          ${bullets}
        </table>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px;border-top:1px solid ${C.border};padding-top:16px;">
          <tr>
            <td>
              <p style="font-family:${C.font};font-size:20px;font-weight:800;color:${C.white};margin:0 0 2px;letter-spacing:-0.3px;">${price}</p>
              <p style="font-family:${C.font};font-size:12px;color:${C.muted};margin:0;">${priceNote}</p>
            </td>
          </tr>
        </table>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="background-color:${highlighted ? C.accent : C.elevated};border-radius:8px;border:1px solid ${highlighted ? "transparent" : C.border};">
              <a href="${url}" target="_blank" rel="noopener noreferrer"
                style="display:block;padding:13px 24px;font-family:${C.font};font-size:13px;font-weight:700;color:${highlighted ? "#080808" : C.white};text-decoration:none;text-align:center;">${btnText}</a>
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
    <td style="padding:44px 40px 40px;">

      ${accentLine()}
      ${heroHeadline("Du bist durch.")}
      ${subHeadline("Jetzt die Frage, die alles entscheidet: Wie geht das in deinen Alltag?")}

      ${bodyText(`${name},`)}
      ${bodyText("7 Tage. Du hast sie durchgezogen. Das ist keine Kleinigkeit — die meisten hören nach Tag 2 auf.")}
      ${bodyText("Der Reset war die Demo. Du hast erlebt, wie dein System reagiert, wenn du es richtig angehst. Jetzt gibt es drei Wege, wie das dauerhaft bleibt — ich erkläre dir, welcher für wen passt.")}

      ${offerCard(
        "WEG 1 · SELF-STARTER",
        "CALINESS App",
        "Du weißt, was zu tun ist — du brauchst nur das richtige System. Die App gibt dir täglich deinen Plan, trackt deinen Longevity Score und zeigt dir genau, wo du stehst.",
        [
          "Täglicher Longevity-Plan, personalisiert",
          "Score-Tracking über alle 4 Säulen",
          "AI-Coach für Fragen & Anpassungen",
          "Gründerpreis: 9€/Monat lifetime statt 20€",
        ],
        "9€/Monat",
        "Lifetime-Preis · Nur in der Beta · Kein Abo-Risiko",
        "https://caliness-academy.de/app",
        "App sichern →",
        false,
      )}

      ${offerCard(
        "WEG 2 · BEGLEITUNG",
        "14-Tage Sprint",
        "Du willst Ergebnisse — und du willst nicht alleine raten, ob du auf dem richtigen Weg bist. Persönliche Begleitung, täglicher Check-in, individueller Plan. Dein schnellster Weg zu nachhaltiger Veränderung.",
        [
          "Start- und Abschlussgespräch mit David",
          "Täglicher Check-in & Feedback",
          "Individuell abgestimmter 14-Tage-Plan",
          "Direkte Antworten — kein generisches Coaching",
        ],
        "149€",
        "Einmalig · Kein Abo · 30 Tage Geld-zurück-Garantie",
        "https://caliness-academy.de/sprint",
        "Sprint starten →",
        true,
      )}

      ${offerCard(
        "WEG 3 · INTENSIV",
        "1:1 Coaching",
        "Du willst das ernsthaft angehen. Langfristige Begleitung, vollständige Analyse, wöchentliche Gespräche. Für Menschen, die in ihre Gesundheit investieren — nicht nur experimentieren.",
        [
          "Vollständige Biometrie & Analyse",
          "Wöchentliche 1:1 Gespräche mit David",
          "Langfristig, individuell, messbar",
          "Exklusive Teilnehmergruppe — limitierte Plätze",
        ],
        "Auf Anfrage",
        "Für langfristige Investoren in ihre Gesundheit",
        "https://caliness-academy.de/coaching",
        "Gespräch anfragen →",
        false,
      )}

      ${bodyText("Nicht sicher, welcher Weg passt? Antworte einfach auf diese Mail. Ich schreibe zurück.")}

      ${signature("David", "Caliness Academy · hallo@caliness-academy.de")}

      ${psBlock("Es gibt keinen falschen Weg. Es gibt nur keinen Weg wählen — und das wäre schade nach diesen 7 Tagen.")}

    </td>
  </tr>`;

  const text = `CALINESS ACADEMY — 7-TAGE RESET
TAG 7 · DU BIST DURCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Du bist durch.
Jetzt die Frage, die alles entscheidet: Wie geht das in deinen Alltag?

${name},

7 Tage. Du hast sie durchgezogen. Das ist keine Kleinigkeit — die meisten hören nach Tag 2 auf.

Der Reset war die Demo. Du hast erlebt, wie dein System reagiert, wenn du es richtig angehst. Jetzt gibt es drei Wege, wie das dauerhaft bleibt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WEG 1 · SELF-STARTER — CALINESS App
Preis: 9€/Monat (Lifetime · Nur in der Beta)
Täglicher Longevity-Plan, Score-Tracking, AI-Coach.
→ https://caliness-academy.de/app

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WEG 2 · BEGLEITUNG — 14-Tage Sprint ★ EMPFOHLEN
Preis: 149€ einmalig · 30 Tage Geld-zurück-Garantie
Persönliche Begleitung, täglicher Check-in, individueller Plan.
→ https://caliness-academy.de/sprint

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WEG 3 · INTENSIV — 1:1 Coaching
Preis: Auf Anfrage
Langfristige Begleitung, Biometrie-Analyse, wöchentliche Gespräche.
→ https://caliness-academy.de/coaching

Nicht sicher, welcher Weg passt? Antworte einfach auf diese Mail.

David
Caliness Academy · hallo@caliness-academy.de

PS: Es gibt keinen falschen Weg. Es gibt nur keinen Weg wählen — und das wäre schade nach diesen 7 Tagen.

—
Impressum: https://caliness-academy.de/impressum
Abmelden: https://caliness-academy.de/abmelden`;

  return {
    // Tag 7 ist reiner Pitch — kein separater Warteliste-Block
    html: wrapEmail(
      "TAG 7 · DU BIST DURCH",
      bodyRows,
      `${name}, dein Reset ist durch — und jetzt kommen die drei Wege, wie das bleibt.`,
      false,
    ),
    text,
  };
}
