/**
 * Rules Engine — Deterministic, rules-first responses.
 * Returns confident answers WITHOUT AI for common patterns.
 * If no rule matches confidently, returns null so the caller can fall back to AI.
 */

import type { PillarScores, DailyCheckIn } from '@/contexts/AppContext';
import type { WeeklyAggregation } from '@/lib/weeklyAggregation';

// ── Nutrition Day Insight (rules-first) ─────────────────────────────────────────

export interface NutritionRuleInput {
  todayProtein: number;
  proteinTarget: number;
  mealCount: number;
  hasGoodDistribution: boolean;
  nutritionScore: number;
}

export function rulesNutritionDayInsight(input: NutritionRuleInput): string | null {
  const { todayProtein, proteinTarget, mealCount, hasGoodDistribution, nutritionScore } = input;
  const proteinPct = proteinTarget > 0 ? Math.round((todayProtein / proteinTarget) * 100) : 0;

  const parts: string[] = [];

  // Protein rules
  if (proteinPct >= 100 && hasGoodDistribution) {
    parts.push('Dein Protein war heute stark und gut verteilt — weiter so.');
  } else if (proteinPct >= 90) {
    parts.push(`Protein bei ${proteinPct}% — fast am Ziel. ${hasGoodDistribution ? 'Gute Verteilung.' : 'Morgen gleichmaessiger verteilen.'}`);
  } else if (proteinPct >= 70) {
    parts.push(`Protein bei ${proteinPct}% — noch ${Math.round(proteinTarget - todayProtein)}g fuers Ziel. Abends noch eine proteinreiche Mahlzeit.`);
  } else if (proteinPct < 50 && proteinPct > 0) {
    parts.push('Heute wenig Protein — morgen frueh mit 30g starten.');
  }

  // Meal structure rules
  if (mealCount >= 3 && mealCount <= 4) {
    parts.push('Gute Mahlzeiten-Struktur — stabiler Blutzucker.');
  } else if (mealCount <= 1 && mealCount > 0) {
    parts.push('Nur eine Mahlzeit geloggt. Regelmäßiges Essen stabilisiert Energie und Blutzucker.');
  }

  // Score-based
  if (nutritionScore >= 75 && parts.length < 2) {
    parts.push('Starker Ernährungstag — genau so unterstützt du deine Gesundheit.');
  } else if (nutritionScore < 40 && parts.length < 2) {
    parts.push('Ernährungs-Score noch niedrig. Fokus morgen: Protein und Vielfalt.');
  }

  if (parts.length === 0) return null;
  return parts.slice(0, 2).join(' ');
}

// ── Check-in Feedback (rules-based) ─────────────────────────────────────────────

export function rulesCheckInFeedback(checkIn: DailyCheckIn, pillarScores: PillarScores, goals: string[]): string | null {
  const parts: string[] = [];

  // Sleep observation
  if (checkIn.sleepHours < 5.5) {
    parts.push(`Nur ${checkIn.sleepHours}h Schlaf — dein Körper braucht Erholung. Heute Abend früh zur Ruhe kommen.`);
  } else if (checkIn.sleepHours >= 8 && checkIn.sleepQuality >= 7) {
    parts.push(`${checkIn.sleepHours}h Schlaf mit guter Qualität — starke Grundlage für den Tag.`);
  }

  // Stress observation
  if (checkIn.stress >= 8) {
    parts.push('Hohes Stresslevel heute. Eine kurze Atempause von 2 Minuten kann den Pegel senken.');
  } else if (checkIn.stress <= 2 && checkIn.energy >= 7) {
    parts.push('Niedriger Stress und hohe Energie — nutze diese Form heute.');
  }

  // Energy + recovery combo
  if (checkIn.energy <= 3 && checkIn.recovery <= 4) {
    parts.push('Energie und Recovery sind niedrig. Heute bewusst schonen und früh regenerieren.');
  }

  // Training + sleep combo
  if (checkIn.training && checkIn.sleepHours < 6) {
    parts.push('Training trotz wenig Schlaf — höre auf deinen Körper und gehe es heute leichter an.');
  }

  // Pillar-specific hint
  const pillarEntries = Object.entries(pillarScores).sort((a, b) => a[1] - b[1]);
  const weakest = pillarEntries[0];
  if (weakest[1] < 35 && parts.length < 2) {
    const labels: Record<string, string> = {
      bewegung: 'Bewegung', ernaehrung: 'Ernährung', regeneration: 'Regeneration', mental: 'Mentale Balance',
    };
    parts.push(`${labels[weakest[0]] || weakest[0]} ist heute dein größter Hebel — ein kleiner Schritt dort zählt am meisten.`);
  }

  if (parts.length === 0) return null;
  return parts.slice(0, 2).join(' ');
}

// ── Weekly Trend Summary (purely computed) ──────────────────────────────────────

export function rulesWeeklyTrendSummary(agg: WeeklyAggregation): string {
  const parts: string[] = [];

  // Training
  if (agg.trainingDays > 0) {
    parts.push(`${agg.trainingDays} Trainingstage`);
  }

  // Protein
  if (agg.proteinAdherenceDays > 0) {
    parts.push(`Protein an ${agg.proteinAdherenceDays}/7 Tagen stark`);
  }

  // Sleep
  if (agg.goodSleepDays >= 5) {
    parts.push(`Schlaf an ${agg.goodSleepDays}/7 Tagen gut`);
  } else if (agg.goodSleepDays <= 2 && agg.checkInDays >= 4) {
    parts.push(`Schlaf nur an ${agg.goodSleepDays} Tagen über 7h`);
  }

  // Score trend
  if (agg.scoreTrend > 3) {
    parts.push(`Score +${agg.scoreTrend} zur Vorwoche`);
  } else if (agg.scoreTrend < -3) {
    parts.push(`Score ${agg.scoreTrend} zur Vorwoche`);
  }

  // Streak/consistency
  if (agg.checkInDays >= 6) {
    parts.push('starke Konsistenz');
  } else if (agg.checkInDays <= 3) {
    parts.push(`nur ${agg.checkInDays}/7 Check-ins`);
  }

  if (parts.length === 0) return 'Diese Woche: wenige Daten verfügbar.';
  return 'Diese Woche: ' + parts.join(', ') + '.';
}

// ── Simple Coach Question Rules ─────────────────────────────────────────────────

export interface CoachRuleInput {
  question: string;
  pillarScores: PillarScores;
  todayCheckIn: DailyCheckIn | null;
  streak: number;
  goalType?: string;
}

/**
 * Attempts to answer simple, common coach questions with deterministic rules.
 * Returns null if the question is too complex or requires AI.
 */
export function rulesCoachAnswer(input: CoachRuleInput): string | null {
  const q = input.question.toLowerCase();
  const { pillarScores, todayCheckIn, streak, goalType } = input;

  const pillarEntries = Object.entries(pillarScores).sort((a, b) => a[1] - b[1]);
  const weakest = pillarEntries[0];
  const strongest = pillarEntries[pillarEntries.length - 1];
  const labels: Record<string, string> = {
    bewegung: 'Bewegung', ernaehrung: 'Ernährung', regeneration: 'Regeneration', mental: 'Mentale Balance',
  };

  // "What is my biggest lever?"
  if (q.match(/groesster?\s*hebel|wichtigst|wo\s*ansetzen|was\s*zuerst/i)) {
    return `Dein größter Hebel ist gerade ${labels[weakest[0]]}: Score bei ${Math.round(weakest[1])}. Ein kleiner Fortschritt hier hebt dein gesamtes System. ${labels[strongest[0]]} läuft mit ${Math.round(strongest[1])} schon gut.`;
  }

  // "How is my score?"
  if (q.match(/wie\s*(ist|steht|geht)\s*(mein|der)\s*score/i)) {
    const avg = Math.round(Object.values(pillarScores).reduce((s, v) => s + v, 0) / 4);
    return `Dein Durchschnitt liegt bei ${avg}. ${labels[strongest[0]]} ist mit ${Math.round(strongest[1])} am stärksten, ${labels[weakest[0]]} mit ${Math.round(weakest[1])} hat am meisten Potenzial.`;
  }

  // Streak question
  if (q.match(/streak|serie|tage\s*am\s*stueck/i)) {
    if (streak >= 7) return `Du bist bei ${streak} Tagen in Folge — das ist echte Konsistenz. Bleib dran, der Rhythmus trägt dich.`;
    if (streak >= 3) return `${streak} Tage in Folge — guter Start. Ab 7 Tagen wird es zur Gewohnheit.`;
    return `Streak bei ${streak}. Jeder Tag zählt — starte heute neu.`;
  }

  // Too complex or unknown: return null for AI fallback
  return null;
}
