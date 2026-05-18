// ═══════════════════════════════════════════════════════════════════════════
// CALINESS — PREMIUM EMAIL DESIGN SYSTEM
// Dark, editorial, conversion-optimized. $100M brand aesthetic.
// ═══════════════════════════════════════════════════════════════════════════

export const C = {
  bg:            "#080808",
  surface:       "#0f0f0f",
  elevated:      "#151515",
  accent:        "#3DFF6E",
  accentGlow:    "rgba(61,255,110,0.12)",
  accentBorder:  "rgba(61,255,110,0.28)",
  white:         "#FFFFFF",
  dim:           "rgba(255,255,255,0.62)",
  muted:         "rgba(255,255,255,0.32)",
  faint:         "rgba(255,255,255,0.10)",
  border:        "rgba(255,255,255,0.07)",
  font:          "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
};

// ─── Logo Header ─────────────────────────────────────────────────────────────
export function emailHeader(tagLabel: string): string {
  return `
  <tr>
    <td align="center" style="padding:44px 40px 36px;border-bottom:1px solid ${C.border};">
      <img
        src="https://caliness-academy.de/images/caliness-logo-white.png"
        alt="CALINESS Academy"
        width="120" height="auto"
        style="display:block;border:0;outline:none;max-width:120px;opacity:0.92;"
      />
      <p style="font-family:${C.font};font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${C.accent};margin:14px 0 0;">${tagLabel}</p>
    </td>
  </tr>`;
}

// ─── Green accent line ────────────────────────────────────────────────────────
export function accentLine(): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
    <tr>
      <td width="36" height="2" style="background-color:${C.accent};font-size:0;line-height:0;border-radius:2px;">&nbsp;</td>
    </tr>
  </table>`;
}

// ─── Hero headline ────────────────────────────────────────────────────────────
export function heroHeadline(text: string, size = 40): string {
  return `<h1 style="font-family:${C.font};font-size:${size}px;font-weight:800;color:${C.white};margin:0 0 22px;line-height:1.12;letter-spacing:-0.8px;">${text}</h1>`;
}

// ─── Sub-headline ─────────────────────────────────────────────────────────────
export function subHeadline(text: string): string {
  return `<h2 style="font-family:${C.font};font-size:21px;font-weight:600;color:${C.white};margin:-6px 0 22px;line-height:1.35;letter-spacing:-0.2px;">${text}</h2>`;
}

// ─── Section label ────────────────────────────────────────────────────────────
export function sectionLabel(text: string): string {
  return `<p style="font-family:${C.font};font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${C.accent};margin:0 0 12px;">${text}</p>`;
}

// ─── Body text ────────────────────────────────────────────────────────────────
export function bodyText(html: string): string {
  return `<p style="font-family:${C.font};font-size:16px;color:${C.dim};margin:0 0 20px;line-height:1.72;">${html}</p>`;
}

// ─── Quote block ─────────────────────────────────────────────────────────────
export function quoteBlock(text: string): string {
  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 28px;">
    <tr>
      <td width="2" style="background:${C.accent};border-radius:2px;font-size:0;">&nbsp;</td>
      <td width="16" style="font-size:0;">&nbsp;</td>
      <td style="background:${C.accentGlow};padding:18px 22px;border-radius:0 10px 10px 0;">
        <p style="font-family:${C.font};font-size:17px;font-style:italic;color:${C.white};margin:0;line-height:1.65;letter-spacing:-0.1px;">${text}</p>
      </td>
    </tr>
  </table>`;
}

// ─── Check list ───────────────────────────────────────────────────────────────
export function checkList(items: string[]): string {
  const rows = items.map(item => `
    <tr>
      <td width="20" valign="top" style="padding:0 12px 14px 0;font-family:${C.font};font-size:15px;color:${C.accent};font-weight:700;line-height:1.6;">✓</td>
      <td style="padding:0 0 14px;font-family:${C.font};font-size:15px;color:${C.white};line-height:1.6;">${item}</td>
    </tr>`).join("");
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>`;
}

// ─── Surface card ─────────────────────────────────────────────────────────────
export function surfaceCard(content: string, accent = false): string {
  const bg     = accent ? C.accentGlow   : C.surface;
  const border = accent ? C.accentBorder : C.border;
  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;background-color:${bg};border:1px solid ${border};border-radius:12px;">
    <tr><td style="padding:24px 26px;">${content}</td></tr>
  </table>`;
}

// ─── Stat row ─────────────────────────────────────────────────────────────────
export function statRow(stats: { value: string; label: string }[]): string {
  const cells = stats.map(s => `
    <td align="center" style="padding:16px 12px;">
      <p style="font-family:${C.font};font-size:22px;font-weight:800;color:${C.accent};margin:0 0 4px;letter-spacing:-0.5px;">${s.value}</p>
      <p style="font-family:${C.font};font-size:11px;color:${C.muted};margin:0;letter-spacing:0.5px;text-transform:uppercase;">${s.label}</p>
    </td>`).join(`<td width="1" style="background:${C.border};font-size:0;">&nbsp;</td>`);

  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;background:${C.surface};border:1px solid ${C.border};border-radius:12px;">
    <tr>${cells}</tr>
  </table>`;
}

// ─── CTA button ───────────────────────────────────────────────────────────────
export function ctaButton(text: string, url: string, subText?: string): string {
  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:${subText ? "10px" : "28px"};">
    <tr>
      <td>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" style="background-color:${C.accent};border-radius:10px;padding:0;">
              <a href="${url}" target="_blank" rel="noopener noreferrer"
                style="display:block;padding:17px 32px;font-family:${C.font};font-size:15px;font-weight:700;color:#080808;text-decoration:none;letter-spacing:-0.1px;">${text}</a>
            </td>
          </tr>
        </table>
        ${subText ? `<p style="font-family:${C.font};font-size:12px;color:${C.muted};text-align:center;margin:10px 0 18px;">${subText}</p>` : ""}
      </td>
    </tr>
  </table>`;
}

// ─── Text link ────────────────────────────────────────────────────────────────
export function textLink(text: string, url: string): string {
  return `<a href="${url}" style="font-family:${C.font};font-size:14px;font-weight:600;color:${C.accent};text-decoration:none;">${text}</a>`;
}

// ─── Signature ────────────────────────────────────────────────────────────────
export function signature(name = "David", title = "Caliness Academy"): string {
  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;padding-top:24px;border-top:1px solid ${C.border};">
    <tr>
      <td>
        <p style="font-family:${C.font};font-size:15px;color:${C.white};font-weight:600;margin:0 0 2px;">${name}</p>
        <p style="font-family:${C.font};font-size:13px;color:${C.muted};margin:0;">${title}</p>
      </td>
    </tr>
  </table>`;
}

// ─── PS block ─────────────────────────────────────────────────────────────────
export function psBlock(html: string): string {
  return `<p style="font-family:${C.font};font-size:13px;color:${C.muted};margin:20px 0 0;line-height:1.65;">${html}</p>`;
}

// ─── Warteliste block (in alle außer Tag 9) ───────────────────────────────────
export function wartelisteBlock(): string {
  return `
  <tr>
    <td style="padding:0 40px 36px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${C.border};border-radius:12px;background-color:${C.surface};">
        <tr>
          <td style="padding:22px 24px;">
            <p style="font-family:${C.font};font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${C.accent};margin:0 0 8px;">PS · CALINESS APP</p>
            <p style="font-family:${C.font};font-size:17px;font-weight:700;color:${C.white};margin:0 0 8px;line-height:1.3;">Bald gibt's CALINESS als App.</p>
            <p style="font-family:${C.font};font-size:13px;color:${C.dim};margin:0 0 14px;line-height:1.65;">Täglicher Plan, Score-Tracking, AI-Coach. Beta-Anmelder: 9€/Monat lifetime statt 20€.</p>
            <a href="https://caliness-academy.de/app" style="font-family:${C.font};font-size:13px;font-weight:700;color:${C.accent};text-decoration:none;">Platz sichern →</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ─── Legal footer ─────────────────────────────────────────────────────────────
export function emailFooter(): string {
  return `
  <tr>
    <td style="padding:24px 40px 40px;border-top:1px solid ${C.border};">
      <p style="font-family:${C.font};font-size:11px;color:${C.muted};margin:0 0 6px;text-align:center;line-height:1.6;">
        Caliness Academy · David &amp; Sarah · hallo@caliness-academy.de
      </p>
      <p style="font-family:${C.font};font-size:11px;color:${C.faint};margin:0;text-align:center;line-height:1.6;">
        <a href="https://caliness-academy.de/impressum" style="color:${C.faint};text-decoration:underline;">Impressum</a>
        &nbsp;&middot;&nbsp;
        <a href="https://caliness-academy.de/datenschutz" style="color:${C.faint};text-decoration:underline;">Datenschutz</a>
        &nbsp;&middot;&nbsp;
        <a href="https://caliness-academy.de/abmelden" style="color:${C.faint};text-decoration:underline;">Abmelden</a>
      </p>
    </td>
  </tr>`;
}

// ─── Email wrapper ────────────────────────────────────────────────────────────
export function wrapEmail(
  tagLabel: string,
  bodyRows: string,
  preheader: string,
  includeWarteliste = true,
): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>CALINESS Reset</title>
  <!--[if mso]><style type="text/css">table{border-collapse:collapse;}a{color:#3DFF6E;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#080808;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#080808;line-height:1px;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#080808;min-width:320px;">
    <tr>
      <td align="center" style="padding:32px 12px 48px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#080808;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
          ${emailHeader(tagLabel)}
          ${bodyRows}
          ${includeWarteliste ? wartelisteBlock() : ""}
          ${emailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
