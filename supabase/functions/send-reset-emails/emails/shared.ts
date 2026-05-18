// ═══════════════════════════════════════════════════════════════════════════
// CALINESS RESET – SHARED EMAIL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

export const C = {
  bg: "#080808",
  accent: "#3DFF6E",
  white: "#FFFFFF",
  dim: "rgba(255,255,255,0.60)",
  muted: "rgba(255,255,255,0.30)",
  border: "rgba(255,255,255,0.08)",
  borderAccent: "rgba(61,255,110,0.30)",
  font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
};

export function emailHeader(): string {
  return `
  <tr>
    <td align="center" style="padding:48px 32px 40px;">
      <img src="https://caliness.academy/logo-white.png" alt="CALINESS" width="110" height="auto"
        style="display:block;border:0;outline:none;text-decoration:none;max-width:110px;" />
    </td>
  </tr>`;
}

export function eyebrow(text: string): string {
  return `<p style="font-family:${C.font};font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${C.accent};margin:0 0 16px;line-height:1;">${text}</p>`;
}

export function greenLine(): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;"><tr><td width="40" height="1" style="background-color:${C.accent};font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
}

export function headline(text: string, size = 36): string {
  return `<h1 style="font-family:${C.font};font-size:${size}px;font-weight:800;color:${C.white};margin:0 0 24px;line-height:1.15;letter-spacing:-0.5px;">${text}</h1>`;
}

export function subHeadline(text: string): string {
  return `<h2 style="font-family:${C.font};font-size:22px;font-weight:600;color:${C.white};margin:-8px 0 24px;line-height:1.3;letter-spacing:-0.2px;">${text}</h2>`;
}

export function bodyText(text: string): string {
  return `<p style="font-family:${C.font};font-size:16px;color:${C.dim};margin:0 0 20px;line-height:1.65;">${text}</p>`;
}

export function label(text: string): string {
  return `<p style="font-family:${C.font};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.white};margin:0 0 14px;">${text}</p>`;
}

export function quoteBlock(text: string): string {
  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
    <tr>
      <td width="3" style="background-color:${C.accent};border-radius:3px 0 0 3px;font-size:0;">&nbsp;</td>
      <td style="background-color:rgba(61,255,110,0.04);padding:20px 24px;border-radius:0 8px 8px 0;">
        <p style="font-family:${C.font};font-size:17px;font-style:italic;color:${C.white};margin:0;line-height:1.6;letter-spacing:-0.1px;">${text}</p>
      </td>
    </tr>
  </table>`;
}

export function checkList(items: string[]): string {
  const rows = items.map(item => `
    <tr>
      <td width="22" valign="top" style="padding:0 10px 12px 0;font-family:${C.font};font-size:15px;color:${C.accent};line-height:1.65;font-weight:700;">✓</td>
      <td style="padding:0 0 12px;font-family:${C.font};font-size:15px;color:${C.white};line-height:1.65;">${item}</td>
    </tr>`).join("");
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>`;
}

export function card(content: string, accentBorder = false): string {
  const border = accentBorder ? C.borderAccent : C.border;
  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;border:1px solid ${border};border-radius:12px;">
    <tr>
      <td style="padding:24px;">
        ${content}
      </td>
    </tr>
  </table>`;
}

export function ctaButton(text: string, url: string): string {
  return `
  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
    <tr>
      <td style="background-color:${C.accent};border-radius:8px;">
        <a href="${url}" target="_blank" rel="noopener noreferrer"
          style="display:inline-block;padding:16px 32px;font-family:${C.font};font-size:15px;font-weight:700;color:#080808;text-decoration:none;letter-spacing:-0.1px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

export function psText(html: string): string {
  return `<p style="font-family:${C.font};font-size:13px;color:${C.muted};margin:24px 0 0;line-height:1.65;border-top:1px solid ${C.border};padding-top:20px;">${html}</p>`;
}

export function wartelisteBlock(): string {
  return `
  <tr>
    <td style="padding:0 32px 32px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${C.border};border-radius:12px;">
        <tr>
          <td style="padding:24px;">
            <p style="font-family:${C.font};font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${C.accent};margin:0 0 10px;">PS · CALINESS APP</p>
            <p style="font-family:${C.font};font-size:18px;font-weight:700;color:${C.white};margin:0 0 10px;line-height:1.3;">Bald gibt's CALINESS als App.</p>
            <p style="font-family:${C.font};font-size:14px;color:${C.dim};margin:0 0 16px;line-height:1.65;">Dein persönliches Longevity-System — täglicher Plan, Score-Tracking, AI-Coach. Beta-Anmelder sichern sich 9€/Monat lifetime statt 20€.</p>
            <a href="https://caliness.academy/app" style="font-family:${C.font};font-size:14px;font-weight:700;color:${C.accent};text-decoration:none;">Platz auf der Warteliste sichern →</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

export function emailFooter(): string {
  return `
  <tr>
    <td style="padding:28px 32px;border-top:1px solid ${C.border};">
      <p style="font-family:${C.font};font-size:12px;color:${C.muted};margin:0 0 6px;text-align:center;line-height:1.5;">
        Caliness Academy · hallo@caliness.academy
      </p>
      <p style="font-family:${C.font};font-size:12px;color:${C.muted};margin:0;text-align:center;line-height:1.5;">
        <a href="https://caliness.academy/impressum" style="color:${C.muted};text-decoration:underline;">Impressum</a>
        &nbsp;&middot;&nbsp;
        <a href="https://caliness.academy/datenschutz" style="color:${C.muted};text-decoration:underline;">Datenschutz</a>
        &nbsp;&middot;&nbsp;
        <a href="https://caliness.academy/abmelden" style="color:${C.muted};text-decoration:underline;">Abmelden</a>
      </p>
    </td>
  </tr>`;
}

export function wrapEmail(
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
  <!--[if mso]><style>table{border-collapse:collapse;}a{color:#3DFF6E;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#080808;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#080808;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#080808;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;">
          ${emailHeader()}
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
