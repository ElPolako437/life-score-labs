import { DAY_CONTENT } from '@/lib/dayContent';
import type { ResetState, StartProfile, DayData, Rating, Goal, Hurdle, Sex, Activity, Daily, LeverKey, BaselineData } from '@/contexts/ResetContext';
import type { RestorePayload } from '@/lib/resetBackend';

/** DB speichert Rating als 3/2/1 → zurück auf die Labels. */
const RATING_LABEL: Record<number, Rating> = { 3: 'good', 2: 'difficult', 1: 'failed' };

/**
 * Baut aus dem serverseitig erfassten Fortschritt (Profil, Tage, Teilnehmer)
 * einen Teil-ResetState, mit dem der Nutzer nahtlos weitermachen kann. Bewusst
 * defensiv — fehlende/kaputte Felder werden übersprungen, nie geworfen.
 */
export function reconstructState(payload: RestorePayload): Partial<ResetState> {
  const out: Partial<ResetState> = {};
  const p = payload.participant ?? undefined;
  const prof = (payload.profile ?? undefined) as Record<string, unknown> | undefined;
  const daysArr = Array.isArray(payload.days) ? payload.days : [];

  if (p?.vorname) out.name = p.vorname;
  if (p?.ziel) out.goal = p.ziel as Goal;

  if (prof) {
    if (prof.hurdle) out.hurdle = prof.hurdle as Hurdle;
    if (!out.goal && prof.goal) out.goal = prof.goal as Goal;
    if (prof.baseline && typeof prof.baseline === 'object' && Object.keys(prof.baseline as object).length) {
      out.baseline = prof.baseline as BaselineData;
    }
    // Vollständiges Startprofil nur, wenn die Kernwerte da sind.
    if (prof.cal_low != null && prof.protein_low != null && prof.sex) {
      const profile: StartProfile = {
        sex: prof.sex as Sex,
        age: Number(prof.age) || 0,
        height: Number(prof.height) || 0,
        weight: Number(prof.weight) || 0,
        activity: (prof.activity as Activity) ?? 'moderate',
        daily: (prof.daily as Daily) ?? 'mixed',
        bmr: Number(prof.bmr) || 0,
        tdee: Number(prof.tdee) || 0,
        calLow: Number(prof.cal_low) || 0,
        calHigh: Number(prof.cal_high) || 0,
        proteinLow: Number(prof.protein_low) || 0,
        proteinHigh: Number(prof.protein_high) || 0,
        mealCount: Number(prof.meal_count) || 3,
        mainLever: (prof.main_lever as LeverKey) ?? 'protein',
        createdAt: prof.created_at ? Date.parse(String(prof.created_at)) : Date.now(),
      };
      out.profile = profile;
      out.sex = profile.sex;
      out.weight = profile.weight;
    }
  }

  const days: Record<string, DayData> = {};
  const tools: Record<string, unknown> = {};
  let maxCompleted = 0;

  for (const d of daysArr) {
    const dayNum = Number((d as Record<string, unknown>).day);
    if (!dayNum || dayNum < 1 || dayNum > 7) continue;
    const row = d as Record<string, unknown>;
    const content = DAY_CONTENT[dayNum - 1];
    const taskCount = content ? content.tasks.length : 3;
    const completed = !!row.completed_at;
    const done = completed || row.task_done === true;

    days[String(dayNum)] = {
      tasks: new Array(taskCount).fill(done),
      rating: typeof row.rating === 'number' ? (RATING_LABEL[row.rating] ?? null) : null,
      note: (row.freetext as string) ?? null,
      completed,
      completedAt: row.completed_at ? Date.parse(String(row.completed_at)) : null,
    };
    if (completed) maxCompleted = Math.max(maxCompleted, dayNum);

    // Tool-Ergebnis der Tage 2–6 zurückspielen (Tag 1 = Profil, kein setTool-Tool).
    if (dayNum >= 2 && content?.toolId && row.tool_result && typeof row.tool_result === 'object' && Object.keys(row.tool_result as object).length) {
      tools[content.toolId] = row.tool_result;
    }
  }

  if (Object.keys(days).length) out.days = days;
  if (Object.keys(tools).length) out.tools = tools;

  const lastDay = Math.max(maxCompleted, Number(p?.last_day_reached) || 0);
  out.currentDay = lastDay >= 1 ? Math.min(7, lastDay + 1) : 1;

  return out;
}
