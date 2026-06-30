/**
 * Admin-API-Client fürs Reset-Backend. Login läuft über die bestehende
 * admin-auth Edge Function (PBKDF2-Passwort → 24h-Session-Token); alle Daten-
 * Calls gehen an reset-admin (Service-Role, liest die RLS-gesperrten Tabellen).
 * Beide auf dem aktiven Projekt (zlmldahbtrwbemndclwm).
 */

const FN = 'https://zlmldahbtrwbemndclwm.supabase.co/functions/v1';
const TOKEN_KEY = 'caliness_admin_token';

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function clearToken(): void {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* noop */ }
}

/** First login sets the admin password (≥12 Z., Groß/Klein/Zahl). Danach prüft es. */
export async function adminLogin(password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${FN}/admin-auth`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.sessionToken) return { ok: false, error: data?.error || 'Login fehlgeschlagen' };
    localStorage.setItem(TOKEN_KEY, data.sessionToken);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Netzwerkfehler' };
  }
}

export async function adminLogout(): Promise<void> {
  const sessionToken = getToken();
  clearToken();
  if (!sessionToken) return;
  try {
    await fetch(`${FN}/admin-auth`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout', sessionToken }),
    });
  } catch { /* noop */ }
}

/** Generic reset-admin call. Returns { unauthorized: true } on 401 so the UI can redirect. */
async function call<T>(action: string, extra: Record<string, unknown> = {}): Promise<{ data?: T; unauthorized?: boolean; error?: string }> {
  const sessionToken = getToken();
  if (!sessionToken) return { unauthorized: true };
  try {
    const res = await fetch(`${FN}/reset-admin`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, sessionToken, ...extra }),
    });
    if (res.status === 401) { clearToken(); return { unauthorized: true }; }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data?.error || 'Fehler' };
    return { data: data as T };
  } catch {
    return { error: 'Netzwerkfehler' };
  }
}

// ── Typen ──────────────────────────────────────────────────────────────────
export interface Lead {
  email: string; vorname: string | null; whatsapp_nummer: string | null; start_datum: string; created_at: string;
  last_seen_at: string | null; last_day_reached: number;
  reset_status: string; contact_status: string;
  coaching_interest: string; app_interest: string; consent: boolean;
  ziel: string | null; main_lever: string | null;
  protein_low: number | null; protein_high: number | null;
  avg_rating: number | null; has_profile: boolean;
  readiness_score: number; readiness_reasons: string[]; temperature: 'hot' | 'warm' | 'cold';
}
export interface DashboardData {
  kpis: { total: number; newToday: number; active: number; completed: number; completionRate: number; avgRating: number | null; coachingReady: number };
  funnel: { day: number; reached: number }[];
  dropoff: { day: number; dropped: number }[];
}
export interface LeadDetail {
  participant: Record<string, unknown>;
  profile: Record<string, unknown> | null;
  days: Record<string, unknown>[];
  events: Record<string, unknown>[];
  notes: Record<string, unknown>[];
  avg_rating: number | null; readiness_score: number; readiness_reasons: string[]; temperature: 'hot' | 'warm' | 'cold';
}

export interface AnalyticsData {
  perDay: { day: number; reached: number; completed: number; completionRate: number; avgRating: number | null }[];
  topGoals: { key: string; count: number }[];
  topHurdles: { key: string; count: number }[];
  topLevers: { key: string; count: number }[];
  topSaboteurs: { key: string; count: number }[];
  ctaClicks: { sprint: number; app: number; coaching: number };
}

export const getDashboard = () => call<DashboardData>('dashboard');
export const getAnalytics = () => call<AnalyticsData>('analytics');
export const getLeads = () => call<{ leads: Lead[] }>('leads');
export const getLead = (email: string) => call<LeadDetail>('lead', { email });
export const addNote = (email: string, note: string) => call<{ success: boolean }>('note', { email, note });
export const setStatus = (email: string, fields: { contact_status?: string; coaching_interest?: string; app_interest?: string }) =>
  call<{ success: boolean }>('set_status', { email, ...fields });
