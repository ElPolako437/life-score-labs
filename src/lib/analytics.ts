import posthog from 'posthog-js';
import { getResetSource } from './attribution';

const CONSENT_KEY = 'caliness_cookie_consent';
/** Consent expires after ~6 months → the banner re-asks (DSGVO-konforme Erneuerung). */
const CONSENT_TTL_MS = 1000 * 60 * 60 * 24 * 182;

interface ConsentRecord {
  accepted: boolean;
  timestamp: string;
}

/**
 * Single source of truth for the stored consent record. Returns null on a
 * missing, malformed, or expired value — so a corrupt entry can never silently
 * suppress the banner or be mistaken for a valid decision.
 */
function readStoredConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.accepted !== 'boolean' || typeof parsed.timestamp !== 'string') return null;
    const ts = Date.parse(parsed.timestamp);
    if (Number.isNaN(ts) || Date.now() - ts > CONSENT_TTL_MS) return null; // abgelaufen → wie „keine Entscheidung"
    return { accepted: parsed.accepted, timestamp: parsed.timestamp };
  } catch {
    return null;
  }
}

/** True only if the user actively accepted analytics and that consent is still fresh. */
export function hasAnalyticsConsent(): boolean {
  return readStoredConsent()?.accepted === true;
}

/**
 * True when no valid (well-formed, non-expired) decision is on record →
 * the consent banner should be shown. Covers missing, corrupt, and expired.
 */
export function needsConsentDecision(): boolean {
  return readStoredConsent() === null;
}

/**
 * Switches PostHog from in-memory to persisted storage and opts capturing in.
 * Only ever called AFTER the user has accepted analytics — so no cookies or
 * localStorage keys (distinct_id, device_id, session) exist before consent.
 */
function enablePersistedAnalytics(): void {
  posthog.set_config({ persistence: 'localStorage+cookie' });
  posthog.opt_in_capturing();
}

// ---------------------------------------------------------------------------
// Initialise PostHog — EU cloud, called once at module load.
// DSGVO: persistence defaults to 'memory' and capturing is OPTED OUT, so
// PostHog writes NOTHING to disk (no cookies, no localStorage) and fires no
// events before the user explicitly accepts. On accept we switch to
// localStorage+cookie persistence (enablePersistedAnalytics).
// ---------------------------------------------------------------------------
posthog.init('phc_yx1VeXfZ38hsx3K49MrYHYhXPhQZZG19kg2wLxKCsjgK', {
  api_host: 'https://eu.i.posthog.com',
  ui_host: 'https://eu.posthog.com',
  capture_pageview: false,
  disable_session_recording: true,
  respect_dnt: true,
  persistence: 'memory',
  opt_out_capturing_by_default: true,
  loaded: () => {
    if (hasAnalyticsConsent()) enablePersistedAnalytics();
  },
});

/**
 * Records the user's cookie/analytics choice and flips PostHog accordingly.
 * Call from the consent banner. While denied, all track()/identify calls below
 * are silent no-ops (PostHog stays opted out, in-memory only — no persistence).
 */
export function setAnalyticsConsent(granted: boolean): void {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: granted, timestamp: new Date().toISOString() }));
    if (granted) enablePersistedAnalytics();
    else posthog.opt_out_capturing();
  } catch {
    /* never crash the app over consent storage */
  }
}

// ---------------------------------------------------------------------------
// Event catalogue — every funnel step that matters for conversion analysis
//
// ACQUISITION
//   reset_started          { hasName, hasEmail }
//   reset_resumed          { hasName }
//
// ONBOARDING
//   goal_selected          { goal }
//   hurdle_selected        { hurdle, goal }
//
// RETENTION — daily loop
//   day_started            { day, goal, hurdle }
//   task_completed         { day, goal, taskIndex, completedCount }
//   day_completed          { day, goal, rating }
//   checkin_viewed         { day, goal }
//   wa_reminder_clicked    { day }
//   install_prompt_shown   { trigger }          e.g. "day1_checkin" | "streak_d3"
//   app_installed          {}
//
// CONVERSION
//   reflection_submitted   { energy, sleep, calm, eating, body, hardest, easiest }
//   sprint_cta_clicked     { channel, goal }    "instagram" | "whatsapp"
//   result_shared          {}
// ---------------------------------------------------------------------------

/**
 * Drop-in replacement for the old localStorage-only track().
 * All existing call-sites work without any changes.
 */
export function track(event: string, properties?: Record<string, unknown>): void {
  try {
    posthog.capture(event, properties ?? {});
  } catch {
    // analytics must never crash the app
  }
}

/**
 * Identify a lead by email so PostHog can link all their events
 * to a single person profile.
 */
export async function captureLead(email: string, name?: string | null): Promise<void> {
  if (!email.trim()) return;
  try {
    posthog.identify(email.trim().toLowerCase(), {
      email: email.trim().toLowerCase(),
      name: name?.trim() || undefined,
    });
    posthog.capture('lead_captured', {
      has_name: !!name?.trim(),
    });
  } catch {
    // fail silently
  }
}

const SUPABASE_FUNCTIONS_URL = 'https://zlmldahbtrwbemndclwm.supabase.co/functions/v1';

/**
 * Trigger the Reset email nurture sequence (day0 = welcome, sent immediately).
 * Fire-and-forget — must never block the user flow.
 */
export function triggerResetSignup(email: string, name?: string | null): void {
  if (!email.trim()) return;
  try {
    fetch(`${SUPABASE_FUNCTIONS_URL}/send-reset-sequence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trigger: 'reset_signup',
        email: email.trim().toLowerCase(),
        name: name?.trim() || undefined,
        // First-Touch-Kanal, z.B. 'ig:reel-42' — Server fällt auf 'reset_webapp' zurück.
        source: getResetSource() ?? undefined,
      }),
    }).catch(() => {});
  } catch {
    // fire-and-forget
  }
}
