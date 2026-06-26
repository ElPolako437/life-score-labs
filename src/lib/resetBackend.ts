import { supabase } from '@/integrations/supabase/client';

/**
 * Server-side funnel persistence via the register-reset-participant Edge Function.
 * All calls are fire-and-forget — they must never block or break the user flow.
 * Only fires when an email is known (anonymous users are tracked via PostHog only).
 */

function invoke(body: Record<string, unknown>): void {
  try {
    supabase.functions.invoke('register-reset-participant', { body }).catch(() => {});
  } catch {
    /* never throw */
  }
}

/** Reads UTM params off the current URL (empty object if none). */
export function getUtm(): Record<string, string> {
  const utm: Record<string, string> = {};
  try {
    const p = new URLSearchParams(window.location.search);
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const v = p.get(k);
      if (v) utm[k] = v.slice(0, 120);
    }
  } catch {
    /* ignore */
  }
  return utm;
}

/** Signup: create/update participant with consent + UTM attribution. */
export function recordSignup(email: string, vorname: string | null, consent: boolean): void {
  if (!email?.trim()) return;
  invoke({ step: 'register', email, vorname, consent, utm: getUtm() });
}

/** Mirror funnel progress (highest day reached) + optionally the goal. */
export function recordProgress(email: string | null, lastDay: number, ziel?: string | null): void {
  if (!email?.trim()) return;
  invoke({ step: 'progress', email, last_day_reached: lastDay, ziel: ziel ?? null });
}

/** Append a high-intent signal (app_cta | coaching_cta | whatsapp | ...). */
export function recordIntent(email: string | null, signal: string): void {
  if (!email?.trim()) return;
  invoke({ step: 'intent', email, signal });
}
