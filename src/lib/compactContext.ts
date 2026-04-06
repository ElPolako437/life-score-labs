/**
 * Compact Context Builder
 * Compresses raw weekly data into a minimal context object for AI calls.
 * Dramatically reduces token usage while preserving all decision-relevant info.
 */

import type { WeeklyAggregation } from '@/lib/weeklyAggregation';

export interface WeeklyContext {
  goalType: string;
  weekNumber: number;
  pillarScores: { bewegung: number; ernaehrung: number; regeneration: number; mental: number };
  weekOverWeek: { bewegung: number; ernaehrung: number; regeneration: number; mental: number };
  checkInSummary: { avgMood: number; avgEnergy: number; avgSleep: number; avgStress: number; daysCheckedIn: number };
  nutritionSummary: { avgProtein: number; proteinTarget: number; mealsLogged: number; mealsSwapped: number };
  activitySummary: { sessionsLogged: number; totalMinutes: number; pillarBreakdown: Record<string, number> };
  streak: number;
  topWin: string;
  topChallenge: string;
  // Optional enrichment
  userName?: string;
  userAge?: number;
  userGoals?: string[];
  habitCompletionRate?: number;
  weightDelta?: number | null;
  detectedPatterns?: string[];
  newBadges?: string[];
}

function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

/**
 * Determine the top win from aggregation data.
 */
function computeTopWin(agg: WeeklyAggregation): string {
  const wins: { score: number; text: string }[] = [];

  if (agg.checkInDays >= 6) wins.push({ score: 90, text: `${agg.checkInDays}/7 Check-ins — starke Konsistenz` });
  if (agg.proteinAdherenceDays >= 5) wins.push({ score: 85, text: `Protein an ${agg.proteinAdherenceDays}/7 Tagen im Ziel` });
  if (agg.trainingDays >= 4) wins.push({ score: 80, text: `${agg.trainingDays} Trainingstage diese Woche` });
  if (agg.goodSleepDays >= 5) wins.push({ score: 75, text: `Schlaf an ${agg.goodSleepDays}/7 Tagen über 7h` });
  if (agg.scoreTrend > 5) wins.push({ score: 95, text: `Score +${agg.scoreTrend} gegenüber Vorwoche` });
  if (agg.habitCompletionRate >= 80) wins.push({ score: 70, text: `Gewohnheiten zu ${agg.habitCompletionRate}% umgesetzt` });
  if (agg.newBadgesThisWeek.length > 0) wins.push({ score: 60, text: `Neues Badge: ${agg.newBadgesThisWeek[0]}` });

  wins.sort((a, b) => b.score - a.score);
  return wins[0]?.text || 'Du warst aktiv diese Woche';
}

/**
 * Determine the top challenge from aggregation data.
 */
function computeTopChallenge(agg: WeeklyAggregation): string {
  const challenges: { score: number; text: string }[] = [];

  if (agg.goodSleepDays <= 2 && agg.checkInDays >= 4) challenges.push({ score: 90, text: `Schlaf unter 7h an ${7 - agg.goodSleepDays} Tagen` });
  if (agg.avgStress >= 7) challenges.push({ score: 85, text: `Durchschnittlicher Stress bei ${agg.avgStress}/10` });
  if (agg.proteinAdherenceDays <= 2 && agg.checkInDays >= 4) challenges.push({ score: 80, text: `Protein nur an ${agg.proteinAdherenceDays}/7 Tagen im Ziel` });
  if (agg.checkInDays <= 3) challenges.push({ score: 75, text: `Nur ${agg.checkInDays}/7 Check-ins — wenig Daten` });
  if (agg.scoreTrend < -5) challenges.push({ score: 95, text: `Score ${agg.scoreTrend} gegenüber Vorwoche` });
  if (agg.screenNights >= 4) challenges.push({ score: 70, text: `Bildschirm vor dem Schlaf an ${agg.screenNights}/7 Abenden` });
  if (agg.alcoholDays >= 3) challenges.push({ score: 65, text: `Alkohol an ${agg.alcoholDays}/7 Tagen` });
  if (agg.trainingDays <= 1 && agg.checkInDays >= 4) challenges.push({ score: 60, text: `Nur ${agg.trainingDays} Trainingstag(e)` });

  challenges.sort((a, b) => b.score - a.score);
  return challenges[0]?.text || 'Keine grossen Auffaelligkeiten';
}

/**
 * Build compact context from weekly aggregation.
 * This is the ONLY thing that should be sent to AI for weekly reports.
 */
export function buildCompactWeeklyContext(
  agg: WeeklyAggregation,
  options?: {
    goalType?: string;
    userName?: string;
    userAge?: number;
    userGoals?: string[];
    streak?: number;
    prevPillarAvgs?: { bewegung: number; ernaehrung: number; regeneration: number; mental: number };
  },
): WeeklyContext {
  const prev = options?.prevPillarAvgs ?? agg.pillarAvgs;
  const weekOverWeek = {
    bewegung: agg.pillarAvgs.bewegung - prev.bewegung,
    ernaehrung: agg.pillarAvgs.ernaehrung - prev.ernaehrung,
    regeneration: agg.pillarAvgs.regeneration - prev.regeneration,
    mental: agg.pillarAvgs.mental - prev.mental,
  };

  return {
    goalType: options?.goalType || 'general',
    weekNumber: getWeekNumber(),
    pillarScores: { ...agg.pillarAvgs },
    weekOverWeek,
    checkInSummary: {
      avgMood: agg.avgMood,
      avgEnergy: agg.avgEnergy,
      avgSleep: agg.avgSleepHours,
      avgStress: agg.avgStress,
      daysCheckedIn: agg.checkInDays,
    },
    nutritionSummary: {
      avgProtein: agg.avgProtein,
      proteinTarget: agg.proteinTarget,
      mealsLogged: agg.totalMealsLogged,
      mealsSwapped: agg.swappedMeals,
    },
    activitySummary: {
      sessionsLogged: agg.trainingDays,
      totalMinutes: agg.totalActivityMinutes,
      pillarBreakdown: { ...agg.pillarConsistency },
    },
    streak: options?.streak ?? 0,
    topWin: computeTopWin(agg),
    topChallenge: computeTopChallenge(agg),
    userName: options?.userName,
    userAge: options?.userAge,
    userGoals: options?.userGoals,
    habitCompletionRate: agg.habitCompletionRate > 0 ? agg.habitCompletionRate : undefined,
    weightDelta: agg.weightDelta,
    detectedPatterns: agg.detectedPatterns.length > 0 ? agg.detectedPatterns : undefined,
    newBadges: agg.newBadgesThisWeek.length > 0 ? agg.newBadgesThisWeek : undefined,
  };
}
