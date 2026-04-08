import posthog from 'posthog-js';

// ---------------------------------------------------------------------------
// Initialise PostHog — EU cloud, called once at module load
// ---------------------------------------------------------------------------
posthog.init('phc_yx1VeXfZ38hsx3K49MrYHYhXPhQZZG19kg2wLxKCsjgK', {
  api_host: 'https://eu.i.posthog.com',
  ui_host: 'https://eu.posthog.com',
  // Don't track pageviews automatically — we fire explicit funnel events instead
  capture_pageview: false,
  // Session recordings off by default (enable in PostHog dashboard if wanted)
  disable_session_recording: true,
  // Respect DNT headers + no cross-site cookies
  respect_dnt: true,
  persistence: 'localStorage+cookie',
});

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
