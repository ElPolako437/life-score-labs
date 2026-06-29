// ═══════════════════════════════════════════════════════════════════════════
// RESET ADMIN — geschützte Read/Write-API fürs Reset-Admin-Backend.
// Auth: Session-Token aus admin-auth (admin_sessions, 24h). Service-Role liest
// die RLS-gesperrten Reset-Tabellen → nichts ist öffentlich erreichbar.
// Actions: dashboard | leads | lead | note | set_status
// ═══════════════════════════════════════════════════════════════════════════
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// ── Session-Token gegen admin_sessions prüfen ──────────────────────────────
async function verifySession(supabase: SupabaseClient, token?: string): Promise<boolean> {
  if (!token) return false;
  const { data } = await supabase
    .from("admin_sessions")
    .select("expires_at")
    .eq("session_token", token)
    .maybeSingle();
  return !!data && new Date(data.expires_at as string) > new Date();
}

// ── Transparenter Coaching-Readiness-Score (0–100) + Begründungen ──────────
interface Agg { avgRating: number | null; daysCompleted: number; hasProfile: boolean; baselineLow: boolean; }
function scoreLead(p: Record<string, unknown>, a: Agg): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let s = 0;
  if (p.reset_status === "completed") { s += 25; reasons.push("Reset abgeschlossen (+25)"); }
  if (a.hasProfile)                   { s += 15; reasons.push("Tag-1 Profil berechnet (+15)"); }
  if (a.avgRating !== null && a.avgRating >= 4) { s += 10; reasons.push(`Hohe Ratings (Ø ${a.avgRating.toFixed(1)}) (+10)`); }
  if (a.baselineLow)                  { s += 10; reasons.push("Niedrige Baseline / hoher Bedarf (+10)"); }
  if (((p.last_day_reached as number) ?? 0) >= 3) { s += 10; reasons.push("Mehrfach aktiv (Tag ≥3) (+10)"); }
  if (p.app_interest === "high")      { s += 15; reasons.push("App-Interesse (CTA) (+15)"); }
  if (p.coaching_interest === "high") { s += 20; reasons.push("Coaching-Interesse (CTA) (+20)"); }
  if (s > 100) s = 100;
  return { score: s, reasons };
}
const temperature = (s: number) => (s >= 70 ? "hot" : s >= 40 ? "warm" : "cold");

function baselineIsLow(baseline: unknown): boolean {
  if (!baseline || typeof baseline !== "object") return false;
  const vals = Object.values(baseline as Record<string, unknown>).filter(v => typeof v === "number") as number[];
  if (!vals.length) return false;
  return vals.reduce((n, v) => n + v, 0) / vals.length <= 2.2; // Slider 1–5
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const body = await req.json();
    const { action, sessionToken } = body;

    if (!(await verifySession(supabase, sessionToken))) {
      return json({ error: "unauthorized" }, 401);
    }

    // ── LEADS-Liste (+ Aggregate + Score) ────────────────────────────────────
    if (action === "leads" || action === "dashboard") {
      const [{ data: parts }, { data: profiles }, { data: progress }] = await Promise.all([
        supabase.from("reset_participants").select("*").order("last_seen_at", { ascending: false, nullsFirst: false }),
        supabase.from("reset_profiles").select("email, goal, hurdle, main_lever, protein_low, protein_high, cal_low, cal_high, baseline"),
        supabase.from("reset_day_progress").select("email, day, rating, completed_at"),
      ]);

      const profByEmail = new Map<string, Record<string, unknown>>();
      (profiles ?? []).forEach(p => profByEmail.set(p.email as string, p));

      const aggByEmail = new Map<string, { ratings: number[]; daysCompleted: number }>();
      (progress ?? []).forEach(r => {
        const e = r.email as string;
        const g = aggByEmail.get(e) ?? { ratings: [], daysCompleted: 0 };
        if (typeof r.rating === "number") g.ratings.push(r.rating);
        if (r.completed_at) g.daysCompleted += 1;
        aggByEmail.set(e, g);
      });

      const leads = (parts ?? []).map(p => {
        const prof = profByEmail.get(p.email as string);
        const g = aggByEmail.get(p.email as string) ?? { ratings: [], daysCompleted: 0 };
        const avgRating = g.ratings.length ? g.ratings.reduce((n, v) => n + v, 0) / g.ratings.length : null;
        const agg: Agg = {
          avgRating, daysCompleted: g.daysCompleted,
          hasProfile: !!prof, baselineLow: baselineIsLow(prof?.baseline),
        };
        const { score, reasons } = scoreLead(p, agg);
        return {
          email: p.email, vorname: p.vorname, start_datum: p.start_datum, created_at: p.created_at,
          last_seen_at: p.last_seen_at, last_day_reached: p.last_day_reached ?? 0,
          reset_status: p.reset_status, contact_status: p.contact_status,
          coaching_interest: p.coaching_interest, app_interest: p.app_interest,
          consent: p.consent, ziel: p.ziel ?? prof?.goal ?? null,
          main_lever: prof?.main_lever ?? null,
          protein_low: prof?.protein_low ?? null, protein_high: prof?.protein_high ?? null,
          avg_rating: avgRating, has_profile: !!prof,
          readiness_score: score, readiness_reasons: reasons, temperature: temperature(score),
        };
      });

      if (action === "leads") return json({ leads });

      // ── DASHBOARD-KPIs ──────────────────────────────────────────────────────
      const todayStr = new Date().toISOString().split("T")[0];
      const total = leads.length;
      const newToday = leads.filter(l => String(l.created_at).startsWith(todayStr)).length;
      const active = leads.filter(l => l.reset_status === "active").length;
      const completed = leads.filter(l => l.reset_status === "completed").length;
      const coachingReady = leads.filter(l => l.temperature === "hot" || l.coaching_interest === "high").length;
      const allRatings = (progress ?? []).filter(r => typeof r.rating === "number").map(r => r.rating as number);
      const avgRating = allRatings.length ? allRatings.reduce((n, v) => n + v, 0) / allRatings.length : null;
      // Funnel: wie viele haben mindestens Tag N erreicht
      const reachedAtLeast = (d: number) => leads.filter(l => (l.last_day_reached ?? 0) >= d).length;
      const funnel = [1, 2, 3, 4, 5, 6, 7].map(d => ({ day: d, reached: reachedAtLeast(d) }));
      // Abbruchrate je Tag = (erreichten Tag d) - (erreichten Tag d+1)
      const dropoff = [1, 2, 3, 4, 5, 6].map(d => ({ day: d, dropped: reachedAtLeast(d) - reachedAtLeast(d + 1) }));

      return json({
        kpis: {
          total, newToday, active, completed,
          completionRate: total ? Math.round((completed / total) * 100) : 0,
          avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
          coachingReady,
        },
        funnel, dropoff,
      });
    }

    // ── EINZELNER LEAD (Detailseite) ─────────────────────────────────────────
    if (action === "lead" && body.email) {
      const email = String(body.email).toLowerCase().trim();
      const [{ data: part }, { data: profile }, { data: days }, { data: events }, { data: notes }] = await Promise.all([
        supabase.from("reset_participants").select("*").eq("email", email).maybeSingle(),
        supabase.from("reset_profiles").select("*").eq("email", email).maybeSingle(),
        supabase.from("reset_day_progress").select("*").eq("email", email).order("day"),
        supabase.from("reset_events").select("*").eq("email", email).order("created_at", { ascending: false }).limit(200),
        supabase.from("admin_notes").select("*").eq("email", email).order("created_at", { ascending: false }),
      ]);
      if (!part) return json({ error: "not found" }, 404);

      const ratings = (days ?? []).filter(d => typeof d.rating === "number").map(d => d.rating as number);
      const avgRating = ratings.length ? ratings.reduce((n, v) => n + v, 0) / ratings.length : null;
      const { score, reasons } = scoreLead(part, {
        avgRating, daysCompleted: (days ?? []).filter(d => d.completed_at).length,
        hasProfile: !!profile, baselineLow: baselineIsLow(profile?.baseline),
      });

      return json({
        participant: part, profile, days: days ?? [], events: events ?? [], notes: notes ?? [],
        avg_rating: avgRating, readiness_score: score, readiness_reasons: reasons, temperature: temperature(score),
      });
    }

    // ── NOTIZ hinzufügen ─────────────────────────────────────────────────────
    if (action === "note" && body.email && body.note) {
      const { error } = await supabase.from("admin_notes").insert({
        email: String(body.email).toLowerCase().trim(),
        note: String(body.note).slice(0, 4000),
        author: body.author ? String(body.author).slice(0, 80) : "admin",
      });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    // ── STATUS / Flags setzen (contact_status, interests) ───────────────────
    if (action === "set_status" && body.email) {
      const upd: Record<string, unknown> = {};
      if (body.contact_status) upd.contact_status = String(body.contact_status);
      if (body.coaching_interest) upd.coaching_interest = String(body.coaching_interest);
      if (body.app_interest) upd.app_interest = String(body.app_interest);
      if (!Object.keys(upd).length) return json({ error: "nothing to update" }, 400);
      const { error } = await supabase.from("reset_participants").update(upd).eq("email", String(body.email).toLowerCase().trim());
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("reset-admin error:", msg);
    return json({ error: msg }, 500);
  }
});
