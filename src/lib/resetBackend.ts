/**
 * Server-side Reset funnel + data capture via the register-reset-participant
 * Edge Function. All calls are fire-and-forget — they must never block or break
 * the user flow.
 *
 * WICHTIG: Wir rufen die Funktion bewusst über eine feste URL des aktiven
 * Projekts (zlmldahbtrwbemndclwm) auf — NICHT über den Frontend-Supabase-Client
 * (der auf ein anderes Projekt zeigt). So landen alle Reset-Daten in EINER DB.
 */

const FUNCTIONS_URL = 'https://zlmldahbtrwbemndclwm.supabase.co/functions/v1';

function invoke(body: Record<string, unknown>): void {
  try {
    fetch(`${FUNCTIONS_URL}/register-reset-participant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true, // feuert auch bei Navigation/Unload zuverlässig
    }).catch(() => {});
  } catch {
    /* never throw */
  }
}

/** Stable anonymous client id so Events vor dem Signup zuordenbar bleiben. */
function getAnonId(): string {
  try {
    let id = localStorage.getItem('caliness_anon_id');
    if (!id) {
      id = crypto?.randomUUID?.() ?? `a${Date.now()}${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('caliness_anon_id', id);
    }
    return id;
  } catch {
    return 'anon';
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

/** Persist the Tag-1 start profile (BMR/TDEE/kcal/Protein/Haupthebel …). */
export function recordProfile(email: string | null, profile: Record<string, unknown>): void {
  if (!email?.trim()) return;
  invoke({ step: 'profile', email, profile });
}

/** Persist a day's progress: rating, task-done, completion + the tool result. */
export function recordDay(
  email: string | null,
  day: number,
  data: { rating?: number | null; task_done?: boolean; completed?: boolean; tool_result?: unknown; freetext?: string | null },
): void {
  if (!email?.trim()) return;
  invoke({ step: 'day', email, day, ...data });
}

/** Owned funnel/CTA event log. Works anonymously (vor Signup) via anon_id. */
export function recordEvent(email: string | null, event: string, payload?: Record<string, unknown>): void {
  invoke({ step: 'event', email: email?.trim() || null, event, payload: payload ?? {}, anon_id: getAnonId() });
}
