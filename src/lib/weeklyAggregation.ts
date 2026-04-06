import type { DailyCheckIn, ActivityLog, NutritionLogEntry, WeightEntry, BadgeDefinition } from '@/contexts/AppContext';
import type { ScoreHistoryEntry } from '@/contexts/AppContext';

export interface WeeklyAggregation {
  // Score
  avgScore: number;
  scoreTrend: number; // vs prev week avg
  bestDay: string;   // e.g. "Mi · 74"
  worstDay: string;  // e.g. "Mo · 48"
  checkInDays: number; // out of 7

  // Pillars
  pillarAvgs: { bewegung: number; ernaehrung: number; regeneration: number; mental: number };
  pillarConsistency: { bewegung: number; ernaehrung: number; regeneration: number; mental: number }; // days active

  // Bewegung
  trainingDays: number;
  totalActivityMinutes: number;
  totalSteps: number;

  // Ernährung
  avgProtein: number;
  proteinTarget: number;
  proteinAdherenceDays: number; // days >= 80% of target
  mealLogDays: number;
  alcoholDays: number;
  totalMealsLogged: number;
  swappedMeals: number;
  uniqueMealCount: number;
  nutritionContext: string; // summary text for AI report

  // Regeneration
  avgSleepHours: number;
  avgSleepQuality: number;
  goodSleepDays: number; // sleepHours >= 7
  screenNights: number;

  // Mental
  avgStress: number;
  avgMood: number;
  avgEnergy: number;

  // Habits
  habitCompletionRate: number; // 0-100
  topHabit: string;
  habitLogDays: number;

  // Weight
  weightDelta: number | null; // kg this week
  weightStart: number | null;
  weightEnd: number | null;

  // Badges
  newBadgesThisWeek: string[]; // badge labels

  // Patterns (simple detected patterns)
  detectedPatterns: string[];
}

const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function dayLabel(dateStr: string): string {
  return DAY_LABELS[new Date(dateStr).getDay()];
}

export function computeWeeklyAggregation(
  last7CheckIns: DailyCheckIn[],
  prev7CheckIns: DailyCheckIn[],
  last7ScoreHistory: ScoreHistoryEntry[],
  prev7ScoreHistory: ScoreHistoryEntry[],
  weekActivityLog: ActivityLog[],
  weekNutritionLogs: NutritionLogEntry[],
  weekWeightEntries: WeightEntry[],
  badges: BadgeDefinition[],
  habitHistory: { date: string; completedHabits?: string[]; completions?: Record<string, boolean> }[],
  proteinTarget: number,
): WeeklyAggregation {
  const weekDates = new Set(last7CheckIns.map(c => c.date));

  // ── Scores ─────────────────────────────────────────────────────────────────
  const avgScore = last7ScoreHistory.length > 0
    ? Math.round(last7ScoreHistory.reduce((s, e) => s + e.score, 0) / last7ScoreHistory.length)
    : 50;
  const prevAvgScore = prev7ScoreHistory.length > 0
    ? Math.round(prev7ScoreHistory.reduce((s, e) => s + e.score, 0) / prev7ScoreHistory.length)
    : avgScore;
  const scoreTrend = avgScore - prevAvgScore;

  const bestEntry = last7ScoreHistory.reduce((a, b) => a.score > b.score ? a : b, last7ScoreHistory[0]);
  const worstEntry = last7ScoreHistory.reduce((a, b) => a.score < b.score ? a : b, last7ScoreHistory[0]);
  const bestDay = bestEntry ? `${dayLabel(bestEntry.date)} · ${Math.round(bestEntry.score)}` : '–';
  const worstDay = worstEntry ? `${dayLabel(worstEntry.date)} · ${Math.round(worstEntry.score)}` : '–';

  // ── Pillar averages from score history ─────────────────────────────────────
  const pillarAvgs = { bewegung: 50, ernaehrung: 50, regeneration: 50, mental: 50 };
  if (last7ScoreHistory.length > 0) {
    const keys = ['bewegung', 'ernaehrung', 'regeneration', 'mental'] as const;
    for (const k of keys) {
      const vals = last7ScoreHistory.map(e => e.pillars?.[k] ?? 50);
      pillarAvgs[k] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    }
  }

  // ── Per-pillar activity consistency (days with ≥1 activity log) ─────────────
  const pillarDays: Record<string, Set<string>> = {
    bewegung: new Set(), ernaehrung: new Set(), regeneration: new Set(), mental: new Set(),
  };
  for (const log of weekActivityLog) {
    if (pillarDays[log.pillar]) pillarDays[log.pillar].add(log.date);
  }
  const pillarConsistency = {
    bewegung: pillarDays.bewegung.size,
    ernaehrung: pillarDays.ernaehrung.size,
    regeneration: pillarDays.regeneration.size,
    mental: pillarDays.mental.size,
  };

  // ── Bewegung ───────────────────────────────────────────────────────────────
  const trainingDays = last7CheckIns.filter(c => c.training).length
    + (pillarDays.bewegung.size > 0 ? Math.max(0, pillarDays.bewegung.size - last7CheckIns.filter(c => c.training).length) : 0);
  const totalActivityMinutes = weekActivityLog
    .filter(l => l.pillar === 'bewegung')
    .reduce((s, l) => s + (l.duration || 0), 0);
  const totalSteps = last7CheckIns.reduce((s, c) => s + (c.steps || 0), 0);

  // ── Ernährung ──────────────────────────────────────────────────────────────
  const avgProtein = weekNutritionLogs.length > 0
    ? Math.round(weekNutritionLogs.reduce((s, l) => s + l.estimatedProteinTotal, 0) / Math.max(1, last7CheckIns.length))
    : Math.round(last7CheckIns.reduce((s, c) => {
        const map: Record<string, number> = { schlecht: 40, okay: 80, gut: 110, sehr_gut: 140 };
        return s + (map[c.proteinQuality] || 80);
      }, 0) / Math.max(1, last7CheckIns.length));
  const proteinAdherenceDays = weekNutritionLogs.length > 0
    ? new Set(weekNutritionLogs.filter(l => l.estimatedProteinTotal >= proteinTarget * 0.8).map(l => l.date)).size
    : 0;
  const mealLogDays = new Set(weekNutritionLogs.map(l => l.date)).size;
  const alcoholDays = last7CheckIns.filter(c => c.alcohol).length;

  // Extended nutrition metrics
  const allWeekMeals = weekNutritionLogs.flatMap(l => l.meals || []);
  const totalMealsLogged = allWeekMeals.length;
  const swappedMeals = allWeekMeals.filter((m: any) => m.swappedFrom || m.status === 'swapped').length;
  const uniqueMealNames = new Set(allWeekMeals.map((m: any) => (m.name || '').toLowerCase().trim()).filter((n: string) => n.length > 3));
  const uniqueMealCount = uniqueMealNames.size;

  // Build nutrition context summary for AI report
  const nutritionContextParts: string[] = [];
  if (totalMealsLogged > 0) {
    nutritionContextParts.push(`${totalMealsLogged} Mahlzeiten an ${mealLogDays} Tagen geloggt.`);
    nutritionContextParts.push(`Protein-Durchschnitt: ${avgProtein}g/Tag (${Math.round((avgProtein / proteinTarget) * 100)}% vom Ziel).`);
    if (swappedMeals > 0) nutritionContextParts.push(`${swappedMeals} Mahlzeiten wurden intelligent getauscht.`);
    nutritionContextParts.push(`${uniqueMealCount} verschiedene Mahlzeiten -- ${uniqueMealCount >= 8 ? 'gute Vielfalt' : 'wenig Abwechslung'}.`);
  } else {
    nutritionContextParts.push('Keine Mahlzeiten diese Woche geloggt.');
  }
  const nutritionContext = nutritionContextParts.join(' ');

  // ── Regeneration ───────────────────────────────────────────────────────────
  const avgSleepHours = last7CheckIns.length > 0
    ? Math.round((last7CheckIns.reduce((s, c) => s + c.sleepHours, 0) / last7CheckIns.length) * 10) / 10
    : 0;
  const avgSleepQuality = last7CheckIns.length > 0
    ? Math.round((last7CheckIns.reduce((s, c) => s + c.sleepQuality, 0) / last7CheckIns.length) * 10) / 10
    : 0;
  const goodSleepDays = last7CheckIns.filter(c => c.sleepHours >= 7).length;
  const screenNights = last7CheckIns.filter(c => c.screenTimeNight).length;

  // ── Mental ─────────────────────────────────────────────────────────────────
  const avgStress = last7CheckIns.length > 0
    ? Math.round((last7CheckIns.reduce((s, c) => s + c.stress, 0) / last7CheckIns.length) * 10) / 10
    : 5;
  const avgMood = last7CheckIns.length > 0
    ? Math.round((last7CheckIns.reduce((s, c) => s + c.mood, 0) / last7CheckIns.length) * 10) / 10
    : 5;
  const avgEnergy = last7CheckIns.length > 0
    ? Math.round((last7CheckIns.reduce((s, c) => s + c.energy, 0) / last7CheckIns.length) * 10) / 10
    : 5;

  // ── Habits ─────────────────────────────────────────────────────────────────
  // Support both data shapes: { completedHabits: string[] } (AppContext HabitDay) and { completions: Record<string, boolean> }
  const weekHabitDays = habitHistory.filter(h => weekDates.has(h.date));
  const habitLogDays = weekHabitDays.length;

  // Normalize each habit day to a completions record
  function getCompletions(h: { completedHabits?: string[]; completions?: Record<string, boolean> }): Record<string, boolean> {
    if (h.completions && typeof h.completions === 'object') return h.completions;
    if (h.completedHabits && Array.isArray(h.completedHabits)) {
      const rec: Record<string, boolean> = {};
      h.completedHabits.forEach(id => { rec[id] = true; });
      return rec;
    }
    return {};
  }

  const habitCompletionRate = habitLogDays > 0
    ? Math.round(weekHabitDays.reduce((s, h) => {
        const vals = Object.values(getCompletions(h));
        return s + (vals.length > 0 ? vals.filter(Boolean).length / vals.length : 0);
      }, 0) / habitLogDays * 100)
    : 0;

  // Compute top habit by completion count
  const habitCounts: Record<string, number> = {};
  for (const day of weekHabitDays) {
    for (const [k, v] of Object.entries(getCompletions(day))) {
      if (v) habitCounts[k] = (habitCounts[k] || 0) + 1;
    }
  }
  const topHabit = Object.entries(habitCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  // ── Weight ─────────────────────────────────────────────────────────────────
  const weightDelta = weekWeightEntries.length >= 2
    ? Math.round((weekWeightEntries[weekWeightEntries.length - 1].weight - weekWeightEntries[0].weight) * 10) / 10
    : null;
  const weightStart = weekWeightEntries[0]?.weight ?? null;
  const weightEnd = weekWeightEntries[weekWeightEntries.length - 1]?.weight ?? null;

  // ── Badges this week ───────────────────────────────────────────────────────
  const weekAgoStr = new Date(Date.now() - 7 * 86400000).toISOString();
  const newBadgesThisWeek = badges
    .filter(b => b.unlockedAt && b.unlockedAt >= weekAgoStr)
    .map(b => `${b.emoji} ${b.label}`);

  // ── Simple pattern detection ───────────────────────────────────────────────
  const detectedPatterns: string[] = [];

  // Sleep degrades mid-week
  if (last7CheckIns.length >= 5) {
    const sorted = [...last7CheckIns].sort((a, b) => a.date.localeCompare(b.date));
    const earlyHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const lateHalf = sorted.slice(Math.ceil(sorted.length / 2));
    const earlyAvgSleep = earlyHalf.reduce((s, c) => s + c.sleepHours, 0) / earlyHalf.length;
    const lateAvgSleep = lateHalf.reduce((s, c) => s + c.sleepHours, 0) / lateHalf.length;
    if (earlyAvgSleep - lateAvgSleep >= 0.8) {
      detectedPatterns.push(`Schlaf verschlechtert sich im Wochenverlauf: ${earlyAvgSleep.toFixed(1)}h → ${lateAvgSleep.toFixed(1)}h`);
    }
  }

  // Alcohol correlates with lower scores
  if (alcoholDays >= 2 && last7ScoreHistory.length >= 3) {
    const alcoholDates = new Set(last7CheckIns.filter(c => c.alcohol).map(c => c.date));
    const alcoholScores = last7ScoreHistory.filter(e => alcoholDates.has(e.date)).map(e => e.score);
    const noAlcoholScores = last7ScoreHistory.filter(e => !alcoholDates.has(e.date)).map(e => e.score);
    if (alcoholScores.length > 0 && noAlcoholScores.length > 0) {
      const alcoholAvg = alcoholScores.reduce((a, b) => a + b, 0) / alcoholScores.length;
      const noAlcoholAvg = noAlcoholScores.reduce((a, b) => a + b, 0) / noAlcoholScores.length;
      if (noAlcoholAvg - alcoholAvg >= 8) {
        detectedPatterns.push(`Alkohol-Tage lagen ${Math.round(noAlcoholAvg - alcoholAvg)} Punkte unter deinem Ø Score`);
      }
    }
  }

  // Weekday vs weekend stress
  if (last7CheckIns.length >= 4) {
    const weekdays = last7CheckIns.filter(c => { const d = new Date(c.date).getDay(); return d >= 1 && d <= 5; });
    const weekends = last7CheckIns.filter(c => { const d = new Date(c.date).getDay(); return d === 0 || d === 6; });
    if (weekdays.length > 0 && weekends.length > 0) {
      const wdStress = weekdays.reduce((s, c) => s + c.stress, 0) / weekdays.length;
      const weStress = weekends.reduce((s, c) => s + c.stress, 0) / weekends.length;
      if (wdStress - weStress >= 2) {
        detectedPatterns.push(`Stress deutlich höher an Wochentagen (${wdStress.toFixed(1)}) als am Wochenende (${weStress.toFixed(1)})`);
      }
    }
  }

  // Low check-in consistency
  if (last7CheckIns.length < 4) {
    detectedPatterns.push(`Nur ${last7CheckIns.length}/7 Check-ins diese Woche — weniger Daten bedeuten weniger Genauigkeit`);
  }

  return {
    avgScore, scoreTrend, bestDay, worstDay,
    checkInDays: last7CheckIns.length,
    pillarAvgs, pillarConsistency,
    trainingDays, totalActivityMinutes, totalSteps,
    avgProtein, proteinTarget, proteinAdherenceDays, mealLogDays, alcoholDays,
    totalMealsLogged, swappedMeals, uniqueMealCount, nutritionContext,
    avgSleepHours, avgSleepQuality, goodSleepDays, screenNights,
    avgStress, avgMood, avgEnergy,
    habitCompletionRate, topHabit, habitLogDays,
    weightDelta, weightStart, weightEnd,
    newBadgesThisWeek,
    detectedPatterns,
  };
}
