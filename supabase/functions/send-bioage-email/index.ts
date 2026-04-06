// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM BIOAGE RESULT EMAIL – CALINESS ACADEMY
// 5-Million-Dollar Longevity Brand Tonality
// Medizinisch-seriös, nicht pushy, ruhig, vertrauenswürdig
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════════════════
// ZENTRALE KONFIGURATION – ABSOLUTE URLS FÜR ZUVERLÄSSIGE ZUSTELLUNG
// IMPORTANT: Never hardcode a lovable.* domain here.
// We derive the public base URL from the incoming request so that:
// - on a custom domain the email points to the custom domain
// - no redirect to editor/preview URLs happens
// ═══════════════════════════════════════════════════════════════════════════

// Blocked domains that must NEVER appear in email links
const BLOCKED_DOMAINS = [
  'lovable.dev',
  'lovable.app', 
  'lovableproject.com',
  'gptengineer.app',
  'edge-runtime.supabase.com',
  'supabase.com',
  'supabase.co',
  'localhost',
  '127.0.0.1',
];

function isBlockedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return BLOCKED_DOMAINS.some(blocked => hostname.includes(blocked));
  } catch {
    return true; // Invalid URLs are blocked
  }
}

function getPublicBaseUrl(req: Request): string {
  // PRIORITY 1: Always prefer the configured PUBLIC_BASE_URL secret
  // This is the ONLY reliable way to ensure production URLs in emails
  const env = Deno.env.get("PUBLIC_BASE_URL");
  if (env && !isBlockedDomain(env)) {
    console.log(`Using PUBLIC_BASE_URL: ${env}`);
    return env;
  }

  // PRIORITY 2: Check Origin header (but BLOCK lovable.* domains)
  const origin = req.headers.get("origin");
  if (origin && !isBlockedDomain(origin)) {
    console.log(`Using Origin header: ${origin}`);
    return origin;
  }

  // PRIORITY 3: Check Referer header (but BLOCK lovable.* domains)
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (!isBlockedDomain(refOrigin)) {
        console.log(`Using Referer header: ${refOrigin}`);
        return refOrigin;
      }
    } catch {
      // ignore
    }
  }

  // PRIORITY 4: Forwarded host headers (but BLOCK lovable.* domains)
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host && !BLOCKED_DOMAINS.some(blocked => host.includes(blocked))) {
    const constructedUrl = `${proto}://${host}`;
    console.log(`Using forwarded host: ${constructedUrl}`);
    return constructedUrl;
  }

  // CRITICAL: No safe base URL found - log error and return empty
  console.error("CRITICAL: No safe base URL found! All detected URLs were blocked (lovable.* domain). Set PUBLIC_BASE_URL secret!");
  return "";
}


// Calendly Link (einheitlich überall)
const CALENDLY_URL = "https://calendly.com/team-calinessacademy/new-meeting";

// ═══════════════════════════════════════════════════════════════════════════
// EINHEITLICHE CTA-SPRACHE (identisch mit Frontend)
// ═══════════════════════════════════════════════════════════════════════════

const CTA_COPY = {
  headline: "Persönliche Einordnung",
  description: "Wenn du dein Ergebnis besser einordnen und verstehen möchtest, kann ein Strategie-Gespräch sinnvoll sein.",
  buttonText: "Ergebnis einordnen lassen",
  disclaimer: "Das Gespräch ist freiwillig und dient ausschließlich der persönlichen Einordnung deines Testergebnisses.",
};

const LEGAL_COPY = {
  short: "Dieser Test ersetzt keine ärztliche Diagnose. Er dient der Orientierung im Kontext von Gesundheit und Longevity.",
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface BioageRecord {
  id?: string;
  email: string;
  firstname: string;
  answers: number[] | Record<string, number> | unknown;
  score_total?: number;
  user_age?: number;
  self_assessment?: 'younger' | 'matching' | 'older' | 'unsure' | null;
  created_at?: string;
}

// Lifestyle Age Estimation (purely derived from score, NOT affecting score)
interface LifestyleAgeEstimation {
  chronologicalAge: number;
  lifestyleAgeMin: number;
  lifestyleAgeMax: number;
  tendencyLabel: string;
}

function calculateLifestyleAge(
  totalPoints: number,
  maxPoints: number,
  userAge: number,
  selfAssessment: 'younger' | 'matching' | 'older' | 'unsure' | null | undefined
): LifestyleAgeEstimation {
  const score0_100 = (totalPoints / maxPoints) * 100;
  const deltaCenterYears = Math.round(((50 - score0_100) / 50) * 6);
  
  let selfOffset = 0;
  if (selfAssessment === 'younger') selfOffset = -1;
  else if (selfAssessment === 'older') selfOffset = 1;
  
  const finalDeltaCenter = deltaCenterYears + selfOffset;
  const rangeWidth = 2;
  let lifestyleAgeMin = userAge + (finalDeltaCenter - rangeWidth);
  let lifestyleAgeMax = userAge + (finalDeltaCenter + rangeWidth);
  
  lifestyleAgeMin = Math.max(10, Math.min(110, lifestyleAgeMin));
  lifestyleAgeMax = Math.max(10, Math.min(110, lifestyleAgeMax));
  
  if (lifestyleAgeMin > lifestyleAgeMax) {
    [lifestyleAgeMin, lifestyleAgeMax] = [lifestyleAgeMax, lifestyleAgeMin];
  }
  
  let tendencyLabel: string;
  if (finalDeltaCenter <= -2) tendencyLabel = 'tendenziell jünger';
  else if (finalDeltaCenter >= 2) tendencyLabel = 'tendenziell älter';
  else tendencyLabel = 'ähnlich';
  
  return { chronologicalAge: userAge, lifestyleAgeMin, lifestyleAgeMax, tendencyLabel };
}

type ProfileLevel = 'foundation' | 'awakening' | 'momentum' | 'mastery';

interface ProfileData {
  level: ProfileLevel;
  title: string;
  subtitle: string;
  greeting: string;
  resultExplanation: string;
  whatThisMeans: string;
  nextStep: {
    type: 'pdf' | 'call' | 'both';
    pdfUrl?: string;
    pdfTitle?: string;
    pdfDescription?: string;
    showCall: boolean;
  };
  subjectLine: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE LEVEL DETERMINATION
// ═══════════════════════════════════════════════════════════════════════════

function getProfileLevel(totalPoints: number): ProfileLevel {
  if (totalPoints <= 15) return 'foundation';
  if (totalPoints <= 25) return 'awakening';
  if (totalPoints <= 34) return 'momentum';
  return 'mastery';
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE DATA – 5-MILLION-DOLLAR TONALITY
// Ruhig, sachlich, hochwertig, nicht motivierend, nicht verkäuferisch
// NOTE: pdfUrl is a relative path; we prefix with baseUrl at email-generation time
// ═══════════════════════════════════════════════════════════════════════════

interface ProfileDataTemplate extends Omit<ProfileData, 'nextStep'> {
  nextStep: {
    type: 'pdf' | 'call' | 'both';
    pdfPath?: string; // relative path, e.g. /pdfs/caliness-grundlagen-guide.html
    pdfTitle?: string;
    pdfDescription?: string;
    showCall: boolean;
  };
}

function getProfileDataTemplate(level: ProfileLevel, firstname: string): ProfileDataTemplate {
  const profiles: Record<ProfileLevel, ProfileDataTemplate> = {
    foundation: {
      level: 'foundation',
      title: 'Fundament',
      subtitle: 'Ein klarer Ausgangspunkt',
      subjectLine: `${firstname}, dein Longevity Score`,
      greeting: `Hallo ${firstname},`,
      resultExplanation: `dein Longevity Score liegt vor. Die Auswertung zeigt, dass bestimmte Lebensbereiche aktuell Aufmerksamkeit verdienen. Das ist keine Bewertung, sondern eine sachliche Bestandsaufnahme.`,
      whatThisMeans: `Dein Ergebnis deutet darauf hin, dass grundlegende Stellschrauben in den Bereichen Regeneration, Bewegung oder Stressregulation noch nicht optimal justiert sind. Viele Menschen befinden sich in dieser Situation – sie ist weder ungewöhnlich noch unveränderbar.`,
      nextStep: {
        type: 'both',
        pdfPath: '/pdfs/caliness-grundlagen-guide.html',
        pdfTitle: 'Grundlagen-Guide',
        pdfDescription: 'Ein strukturierter Überblick über die wichtigsten Stellschrauben für körperliches Gleichgewicht. Ohne Überforderung, ohne Dringlichkeit.',
        showCall: true,
      },
    },
    awakening: {
      level: 'awakening',
      title: 'Erwachung',
      subtitle: 'Zwischen Wissen und Umsetzung',
      subjectLine: `${firstname}, dein Longevity Score`,
      greeting: `Hallo ${firstname},`,
      resultExplanation: `dein Longevity Score liegt vor. Die Auswertung zeigt ein Profil, das bereits Bewusstsein für Gesundheit erkennen lässt. Einzelne Bereiche bieten noch Raum für gezielte Anpassungen.`,
      whatThisMeans: `Du hast bereits funktionierende Gewohnheiten entwickelt. Was jetzt zählt, ist nicht mehr Wissen, sondern Priorisierung und Konsistenz. Der Unterschied liegt oft nicht im Was, sondern im Wie und Wann.`,
      nextStep: {
        type: 'both',
        pdfPath: '/pdfs/caliness-prioritaeten-framework.html',
        pdfTitle: 'Prioritäten-Framework',
        pdfDescription: 'Identifiziere die wichtigsten Hebelpunkte für nachhaltige Veränderung.',
        showCall: true,
      },
    },
    momentum: {
      level: 'momentum',
      title: 'Momentum',
      subtitle: 'Auf stabilem Fundament',
      subjectLine: `${firstname}, dein Longevity Score`,
      greeting: `Hallo ${firstname},`,
      resultExplanation: `dein Longevity Score liegt vor. Die Auswertung zeigt ein Profil mit solidem Fundament. Deine Grundgewohnheiten funktionieren – einzelne Bereiche bieten Potenzial für Feinabstimmung.`,
      whatThisMeans: `Du machst vieles richtig. Der nächste Schritt ist nicht grundlegende Veränderung, sondern gezielte Optimierung in den Bereichen, die bisher weniger Aufmerksamkeit erhalten haben.`,
      nextStep: {
        type: 'call',
        showCall: true,
      },
    },
    mastery: {
      level: 'mastery',
      title: 'Meisterschaft',
      subtitle: 'Bemerkenswerte Stabilität',
      subjectLine: `${firstname}, dein Longevity Score`,
      greeting: `Hallo ${firstname},`,
      resultExplanation: `dein Longevity Score liegt vor. Die Auswertung zeigt ein Profil mit bemerkenswert stabilen Gewohnheiten. Du hast Systeme entwickelt, die nachhaltig funktionieren.`,
      whatThisMeans: `Bei diesem Niveau liegt die Herausforderung nicht mehr im Aufbau, sondern in der langfristigen Bewahrung und dem Erkennen blinder Flecken. Überoptimierung kann kontraproduktiv sein.`,
      nextStep: {
        type: 'both',
        pdfPath: '/pdfs/caliness-gespraech-onepager.html',
        pdfTitle: 'Das Longevity-Gespräch',
        pdfDescription: 'Was dich im Orientierungsgespräch erwartet – Struktur, Ablauf und Vorbereitung.',
        showCall: true,
      },
    },
  };

  return profiles[level];
}

// Convert template to ProfileData by resolving relative paths to absolute URLs
function resolveProfileData(template: ProfileDataTemplate, baseUrl: string): ProfileData {
  return {
    ...template,
    nextStep: {
      type: template.nextStep.type,
      pdfUrl: template.nextStep.pdfPath ? `${baseUrl}${template.nextStep.pdfPath}` : undefined,
      pdfTitle: template.nextStep.pdfTitle,
      pdfDescription: template.nextStep.pdfDescription,
      showCall: template.nextStep.showCall,
    },
  };
}

function normalizeAnswers(answers: BioageRecord["answers"]): number[] {
  if (Array.isArray(answers)) return answers.map((v) => Number(v ?? 0));
  if (answers && typeof answers === "object") {
    const obj = answers as Record<string, number>;
    const arr: number[] = [];
    for (let i = 0; i < 15; i++) {
      const idBasedValue = obj[i + 1] ?? obj[String(i + 1)];
      const indexBasedValue = obj[i] ?? obj[String(i)];
      arr.push(Number(idBasedValue ?? indexBasedValue ?? 0));
    }
    return arr;
  }
  return Array(15).fill(0);
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL HTML GENERATION – PREMIUM DESIGN
// Kompatibel mit Gmail, Apple Mail, Outlook, Mobile
// NOTE: logoUrl and downloadsUrl are passed in to avoid hardcoded domains
// ═══════════════════════════════════════════════════════════════════════════

interface EmailAssets {
  logoUrl: string;
  downloadsUrl: string;
}

function generateEmailHtml(profile: ProfileData, firstname: string, assets: EmailAssets, lifestyleAge?: LifestyleAgeEstimation): string {
  const colors = {
    background: "#0a0c0e",
    cardBg: "#111318",
    surfaceBg: "#161a21",
    border: "rgba(255,255,255,0.06)",
    borderAccent: "rgba(45,211,111,0.25)",
    accent: "#2dd36f",
    textPrimary: "#f8fafc",
    textSecondary: "#b8c4d4",
    textMuted: "#6b7a8f",
  };

  // Lifestyle Age Section (if available)
  const lifestyleAgeSection = lifestyleAge ? `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px; background-color: ${colors.surfaceBg}; border-radius: 12px; border: 1px solid ${colors.borderAccent};">
          <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${colors.textMuted}; margin: 0 0 16px 0;">
            📊 Lifestyle-Alter (Schätzung)
          </p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid ${colors.border};">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: ${colors.textMuted};">Chronologisches Alter</span>
              </td>
              <td style="padding: 8px 0; border-bottom: 1px solid ${colors.border}; text-align: right;">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; color: ${colors.textPrimary};">${lifestyleAge.chronologicalAge} Jahre</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid ${colors.border};">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: ${colors.textMuted};">Lifestyle-Alter (Schätzung)</span>
              </td>
              <td style="padding: 8px 0; border-bottom: 1px solid ${colors.border}; text-align: right;">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; color: ${colors.accent};">${lifestyleAge.lifestyleAgeMin}–${lifestyleAge.lifestyleAgeMax} Jahre</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: ${colors.textMuted};">Tendenz</span>
              </td>
              <td style="padding: 8px 0; text-align: right;">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 500; color: ${lifestyleAge.tendencyLabel === 'tendenziell jünger' ? colors.accent : lifestyleAge.tendencyLabel === 'tendenziell älter' ? '#f97316' : colors.textSecondary};">${lifestyleAge.tendencyLabel}</span>
              </td>
            </tr>
          </table>
          <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: ${colors.textMuted}; margin: 12px 0 0 0; line-height: 1.5;">
            Orientierung auf Basis deiner Selbstauskunft – keine medizinische Diagnose.
          </p>
        </td>
      </tr>
    </table>
  ` : '';

  // PDF Section (only if profile has PDF) - improved with better UX and fallback
  const pdfSection = profile.nextStep.pdfUrl ? `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px; background-color: ${colors.surfaceBg}; border-radius: 12px; border-left: 3px solid ${colors.accent};">
          <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; color: ${colors.textPrimary}; margin: 0 0 8px 0;">
            📄 ${profile.nextStep.pdfTitle}
          </p>
          <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: ${colors.textMuted}; margin: 0 0 16px 0; line-height: 1.6;">
            ${profile.nextStep.pdfDescription}
          </p>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 14px 28px; background-color: ${colors.accent}; border-radius: 8px;">
                <a href="${profile.nextStep.pdfUrl}" target="_blank" rel="noopener noreferrer" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; color: ${colors.background}; text-decoration: none; display: inline-block;">
                  Dokument öffnen →
                </a>
              </td>
            </tr>
          </table>
          <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: ${colors.textMuted}; margin: 16px 0 0 0; line-height: 1.6;">
            <strong>Tipp:</strong> Klicke auf "Als PDF speichern" oder nutze Strg+P / Cmd+P zum Speichern.
          </p>
          <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: ${colors.textMuted}; margin: 8px 0 0 0;">
            Link funktioniert nicht? 
            <a href="${assets.downloadsUrl}" target="_blank" rel="noopener noreferrer" style="color: ${colors.accent}; text-decoration: underline;">
              Zur Download-Seite
            </a>
          </p>
        </td>
      </tr>
    </table>
  ` : '';

  // Call CTA Section – EINHEITLICHE SPRACHE
  const callSection = profile.nextStep.showCall ? `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 28px; background-color: ${colors.surfaceBg}; border-radius: 12px; border: 1px solid ${colors.borderAccent}; text-align: center;">
          <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; color: ${colors.textPrimary}; margin: 0 0 8px 0;">
            ${CTA_COPY.headline}
          </p>
          <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: ${colors.textSecondary}; margin: 0 0 20px 0; line-height: 1.6;">
            ${CTA_COPY.description}
          </p>
          <table cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <td style="padding: 14px 28px; background-color: ${colors.accent}; border-radius: 8px;">
                <a href="${CALENDLY_URL}" target="_blank" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; color: ${colors.background}; text-decoration: none; display: inline-block;">
                  ${CTA_COPY.buttonText}
                </a>
              </td>
            </tr>
          </table>
          <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: ${colors.textMuted}; margin: 16px 0 0 0; line-height: 1.5;">
            ${CTA_COPY.disclaimer}
          </p>
        </td>
      </tr>
    </table>
  ` : '';

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Dein Longevity Score</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .fallback-font { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: ${colors.background};">
    Dein Longevity Score: ${profile.title} – ${profile.subtitle}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <!-- Email wrapper -->
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        
        <!-- Main container -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 560px; background-color: ${colors.cardBg}; border-radius: 16px; border: 1px solid ${colors.border};">
          
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 40px 32px 32px; border-bottom: 1px solid ${colors.border};">
              <img 
                src="${assets.logoUrl}" 
                alt="Caliness Academy – Evidence Based Longevity" 
                width="160" 
                height="auto"
                style="display: block; max-width: 160px; height: auto; border: 0; outline: none;"
              />
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: ${colors.textMuted}; margin: 16px 0 0 0;">
                Longevity Score
              </p>
            </td>
          </tr>
          
          <!-- Profile Badge -->
          <tr>
            <td align="center" style="padding: 32px 32px 24px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 8px 20px; background-color: ${colors.surfaceBg}; border-radius: 24px; border: 1px solid ${colors.borderAccent};">
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; color: ${colors.accent}; margin: 0; letter-spacing: 0.5px;">
                      ${profile.title}
                    </p>
                  </td>
                </tr>
              </table>
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: ${colors.textMuted}; margin: 12px 0 0 0;">
                ${profile.subtitle}
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 0 32px 32px;">
              
              <!-- Greeting -->
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 500; color: ${colors.textPrimary}; margin: 0 0 16px 0;">
                ${profile.greeting}
              </p>
              
              <!-- Result Explanation -->
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: ${colors.textSecondary}; margin: 0 0 24px 0; line-height: 1.7;">
                ${profile.resultExplanation}
              </p>
              
              <!-- What This Means -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; background-color: ${colors.surfaceBg}; border-radius: 12px;">
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ${colors.textMuted}; margin: 0 0 12px 0;">
                      Was das bedeutet
                    </p>
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: ${colors.textSecondary}; margin: 0; line-height: 1.7;">
                      ${profile.whatThisMeans}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Lifestyle Age Section -->
              ${lifestyleAgeSection}
              
              <!-- PDF Section -->
              ${pdfSection}
              
              <!-- Call CTA Section -->
              ${callSection}
              
              <!-- Legal Disclaimer -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; background-color: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid ${colors.border};">
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: ${colors.textMuted}; margin: 0; line-height: 1.6; text-align: center;">
                      ${LEGAL_COPY.short}
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid ${colors.border}; text-align: center;">
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: ${colors.textMuted}; margin: 0 0 8px 0;">
                Bei Fragen erreichst du uns unter
              </p>
              <a href="mailto:team@caliness-academy.de" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: ${colors.accent}; text-decoration: none;">
                team@caliness-academy.de
              </a>
              <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: ${colors.textMuted}; margin: 16px 0 0 0;">
                © ${new Date().getFullYear()} Caliness Academy
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAIN TEXT FALLBACK
// ═══════════════════════════════════════════════════════════════════════════

function generatePlainText(profile: ProfileData, firstname: string, downloadsUrl: string): string {
  let text = `CALINESS ACADEMY – LONGEVITY SCORE
========================================

${profile.title.toUpperCase()}
${profile.subtitle}

${profile.greeting}

${profile.resultExplanation}

WAS DAS BEDEUTET
${profile.whatThisMeans}

`;

  if (profile.nextStep.pdfUrl) {
    text += `DEIN DOKUMENT: ${profile.nextStep.pdfTitle}
${profile.nextStep.pdfDescription}

Dokument öffnen: ${profile.nextStep.pdfUrl}
Tipp: Klicke auf "Als PDF speichern" oder nutze Strg+P / Cmd+P.

Link funktioniert nicht? Alle Downloads: ${downloadsUrl}

`;
  }

  if (profile.nextStep.showCall) {
    text += `${CTA_COPY.headline.toUpperCase()}
${CTA_COPY.description}
Link: ${CALENDLY_URL}
${CTA_COPY.disclaimer}

`;
  }

  text += `RECHTLICHER HINWEIS
${LEGAL_COPY.short}

Bei Fragen: team@caliness-academy.de

© ${new Date().getFullYear()} Caliness Academy`;

  return text;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

const handler = async (req: Request): Promise<Response> => {
  console.log("send-bioage-email: Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { record } = (await req.json()) as { record: BioageRecord };
    console.log("send-bioage-email: Processing record for:", record.email);

    // Derive base URL from request (dynamic, works with custom domains)
    const baseUrl = getPublicBaseUrl(req);
    console.log("send-bioage-email: Using base URL:", baseUrl);

    // Build dynamic asset URLs - use /images/ path (NOT lovable-uploads)
    const assets: EmailAssets = {
      logoUrl: baseUrl ? `${baseUrl}/images/caliness-logo-white.png` : '',
      downloadsUrl: baseUrl ? `${baseUrl}/downloads` : '',
    };

    // Calculate score
    const answersArray = normalizeAnswers(record.answers);
    const totalPoints = record.score_total ?? answersArray.reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);
    const maxPoints = 45;
    
    // Determine profile level and resolve profile data with absolute URLs
    const level = getProfileLevel(totalPoints);
    const profileTemplate = getProfileDataTemplate(level, record.firstname);
    const profile = resolveProfileData(profileTemplate, baseUrl);
    
    // Calculate Lifestyle Age Estimation (purely derived from score)
    const userAge = record.user_age || 30;
    const lifestyleAge = calculateLifestyleAge(totalPoints, maxPoints, userAge, record.self_assessment);
    
    console.log("send-bioage-email: Profile level:", level, "Score:", totalPoints, "Lifestyle Age:", lifestyleAge);

    // Generate email content
    const html = generateEmailHtml(profile, record.firstname, assets, lifestyleAge);
    const text = generatePlainText(profile, record.firstname, assets.downloadsUrl);

    // Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Caliness Academy <noreply@caliness-academy.de>",
        to: [record.email],
        subject: profile.subjectLine,
        html,
        text,
        reply_to: "team@caliness-academy.de",
      }),
    });

    const resendData = await res.json();
    
    if (!res.ok) {
      console.error("send-bioage-email: Resend error:", resendData);
      throw new Error(resendData.message || "Failed to send email");
    }

    console.log("send-bioage-email: Email sent successfully:", resendData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: resendData.id,
        profile: level,
        score: totalPoints
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("send-bioage-email: Error:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
