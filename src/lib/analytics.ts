import posthog from 'posthog-js';

const CONSENT_KEY = 'caliness_cookie_consent';

/** Reads stored analytics consent. Defaults to FALSE (opt-out) until the user accepts. */
function hasStoredConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    return !!JSON.parse(raw)?.accepted;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Initialise PostHog — EU cloud, called once at module load.
// DSGVO: capturing is OPTED OUT by default and only enabled after explicit
// cookie consent. No analytics cookies / events fire before the user accepts.
// ---------------------------------------------------------------------------
posthog.init('phc_yx1VeXfZ38hsx3K49MrYHYhXPhQZZG19kg2wLxKCsjgK', {
  api_host: 'https://eu.i.posthog.com',
  ui_host: 'https://eu.posthog.com',
  capture_pageview: false,
  disable_session_recording: true,
  respect_dnt: true,
  persistence: 'localStorage+cookie',
  opt_out_capturing_by_default: true,
  loaded: (ph) => {
    if (hasStoredConsent()) ph.opt_in_capturing();
  },
});

/**
 * Records the user's cookie/analytics choice and flips PostHog accordingly.
 * Call from the consent banner. While denied, all track()/identify calls below
 * are silent no-ops (PostHog stays opted out).
 */
export function setAnalyticsConsent(granted: boolean): void {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: granted, timestamp: new Date().toISOString() }));
    if (granted) posthog.opt_in_capturing();
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
      }),
    }).catch(() => {});
  } catch {
    // fire-and-forget
  }
}
