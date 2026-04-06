// ═══════════════════════════════════════════════════════════════════════════
// ZENTRALE KONFIGURATION – CALINESS ACADEMY
// Alle URLs, Texte und Konstanten an einem Ort für Konsistenz
// ═══════════════════════════════════════════════════════════════════════════

// Public base URL
// IMPORTANT: Never hardcode a lovable.* domain here.
// - In the browser we can derive it from the current origin (works with custom domains).
// - Keep URLs in the app mostly relative; only emails need absolute URLs.
export const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";

// Logo URL - use the dedicated images folder (NOT lovable-uploads)
export const LOGO_URL = `/images/caliness-logo-white.png`;

// PDF URLs – direct public paths (no auth required)
// These are static HTML files in the public folder, optimized for print-to-PDF
// SECURITY: Always use relative paths - they work on any domain without Lovable login
export const PDF_URLS = {
  foundation: "/pdfs/caliness-grundlagen-guide.html",
  awakening: "/pdfs/caliness-prioritaeten-framework.html",
  mastery: "/pdfs/caliness-gespraech-onepager.html",
  longevity: "/pdfs/caliness-longevity-framework.html",
} as const;

// Helper to validate URLs are not pointing to Lovable
export function isProductionSafeUrl(url: string): boolean {
  const blockedPatterns = ['lovable.dev', 'lovable.app', 'lovableproject.com', 'gptengineer.app'];
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  return !blockedPatterns.some(p => hostname.includes(p) || url.includes(p));
}

// ═══════════════════════════════════════════════════════════════════════════
// CALENDLY / STRATEGIEGESPRÄCH
// ═══════════════════════════════════════════════════════════════════════════

export const CALENDLY_URL = "https://calendly.com/team-calinessacademy/new-meeting";

// ═══════════════════════════════════════════════════════════════════════════
// EINHEITLICHE CTA-SPRACHE (wird überall identisch verwendet)
// Medizinisch-seriös, nicht pushy, ruhig
// ═══════════════════════════════════════════════════════════════════════════

export const CTA_COPY = {
  // Haupttext für Strategiegespräch
  headline: "Persönliche Einordnung",
  
  // Der exakte CTA-Text (überall identisch)
  description: "Wenn du dein Ergebnis besser einordnen und verstehen möchtest, kann ein Strategie-Gespräch sinnvoll sein.",
  
  // Button-Text
  buttonText: "Ergebnis einordnen lassen",
  
  // Hinweis unter dem Button
  disclaimer: "Das Gespräch ist freiwillig und dient ausschließlich der persönlichen Einordnung deines Testergebnisses.",
  
  // Alternativer, kürzerer Hinweis
  disclaimerShort: "Keine Verpflichtung – nur Orientierung.",
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SUPPORT-HINWEIS FÜR TESTSEITE
// ═══════════════════════════════════════════════════════════════════════════

export const SUPPORT_COPY = {
  headline: "Brauchst du Unterstützung?",
  description: "Falls du dir bei einer Frage unsicher bist oder Orientierung brauchst – wir helfen gerne.",
  buttonText: "Hilfe anfordern",
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// RECHTLICHE HINWEISE (DSGVO-KONFORM)
// ═══════════════════════════════════════════════════════════════════════════

export const LEGAL_COPY = {
  // Kurzer Disclaimer
  short: "Dieser Test ersetzt keine ärztliche Diagnose. Er dient der Orientierung im Kontext von Gesundheit und Longevity.",
  
  // Ausführlicher Disclaimer
  full: "Dieser Longevity Score ersetzt keine ärztliche Untersuchung oder Diagnose. Die Ergebnisse dienen ausschließlich der persönlichen Orientierung und Einordnung im Kontext von Gesundheit und Langlebigkeit. Bei gesundheitlichen Beschwerden wenden Sie sich bitte an einen Arzt.",
  
  // Kein Heilversprechen
  noHealing: "Wir geben keine Heilversprechen, keine medizinische Diagnose und keine Therapieempfehlungen.",
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// E-MAIL KONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const EMAIL_CONFIG = {
  fromName: "Caliness Academy",
  fromEmail: "noreply@caliness-academy.de",
  replyTo: "team@caliness-academy.de",
  subjectPrefix: "",
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE TITLES (konsistent überall)
// ═══════════════════════════════════════════════════════════════════════════

export const PROFILE_TITLES = {
  foundation: {
    title: "Fundament",
    subtitle: "Ein klarer Ausgangspunkt",
  },
  awakening: {
    title: "Erwachung", 
    subtitle: "Zwischen Wissen und Umsetzung",
  },
  momentum: {
    title: "Momentum",
    subtitle: "Auf stabilem Fundament",
  },
  mastery: {
    title: "Meisterschaft",
    subtitle: "Bemerkenswerte Stabilität",
  },
} as const;

export type ProfileLevel = keyof typeof PROFILE_TITLES;
