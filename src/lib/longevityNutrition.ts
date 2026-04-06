/**
 * Longevity Nutrition Score System
 * Calculates a 0-100 score from nutrition logs with 6 weighted factors.
 */

import type { NutritionLogEntry } from '@/contexts/AppContext';

export interface NutritionScoreFactors {
  calorieAdherence: number;   // 0-100
  proteinDistribution: number; // 0-100
  antiInflammatory: number;    // 0-100
  foodDiversity: number;       // 0-100
  mealTiming: number;          // 0-100
  micronutrient: number;       // 0-100
}

export interface LongevityNutritionResult {
  score: number;
  factors: NutritionScoreFactors;
  factorLabels: { key: string; label: string; score: number; status: 'green' | 'yellow' | 'red' }[];
}

const ANTI_INFLAMMATORY_GOOD = /lachs|fisch|beeren|blaubeeren|spinat|brokkoli|gemüse|avocado|nüsse|walnüsse|kurkuma|ingwer|olivenöl|linsen|bohnen|grünkohl|salat|süßkartoffel|quinoa|haferflocken|skyr|joghurt|eier|hähnchen/i;
const ANTI_INFLAMMATORY_BAD = /pizza|burger|pommes|chips|süßigkeit|schoko|cola|limo|weißbrot|toast|croissant|kuchen|kekse|fertig|fast.?food|döner|kebab|wurst|alkohol|bier|wein/i;
const MICRONUTRIENT_RICH = /gemüse|salat|spinat|brokkoli|beeren|nüsse|fisch|lachs|eier|süßkartoffel|avocado|linsen|bohnen|quinoa|grünkohl|paprika/i;

export function calculateLongevityNutritionScore(
  todayLogs: NutritionLogEntry[],
  calorieMin: number,
  calorieMax: number,
  proteinTarget: number,
): LongevityNutritionResult {
  const allMeals = todayLogs.flatMap(l => l.meals);
  if (allMeals.length === 0) {
    const emptyFactors: NutritionScoreFactors = { calorieAdherence: 0, proteinDistribution: 0, antiInflammatory: 0, foodDiversity: 0, mealTiming: 0, micronutrient: 0 };
    return { score: 0, factors: emptyFactors, factorLabels: buildLabels(emptyFactors) };
  }

  const totalProtein = todayLogs.reduce((s, l) => s + l.estimatedProteinTotal, 0);
  const allDescriptions = allMeals.map(m => (m.description || m.name || '').toLowerCase());
  const joined = allDescriptions.join(' ');

  // 1. Calorie adherence (20%) — use estimatedCalories from logged meals when available
  const totalCals = allMeals.reduce((sum, m) => sum + ((m as any).estimatedCalories ?? (m as any).calories ?? 0), 0);
  const calTarget = (calorieMin + calorieMax) / 2 || 2000;
  const calorieAdherence = totalCals > 0
    ? Math.max(0, Math.min(100, Math.round(100 - Math.abs(totalCals - calTarget) / 8)))
    : 50; // neutral fallback if no calorie data

  // 2. Protein distribution (20%)
  const mealProteins = allMeals.map(m => m.estimatedProtein || 0);
  const proteinPct = Math.min(1, totalProtein / proteinTarget);
  const hasMultipleSources = mealProteins.filter(p => p > 10).length >= 2;
  const proteinDistribution = Math.round(proteinPct * 70 + (hasMultipleSources ? 30 : 10));

  // 3. Anti-inflammatory (20%)
  const goodCount = allDescriptions.filter(d => ANTI_INFLAMMATORY_GOOD.test(d)).length;
  const badCount = allDescriptions.filter(d => ANTI_INFLAMMATORY_BAD.test(d)).length;
  const antiInflammatory = Math.round(Math.max(0, Math.min(100, (goodCount * 25) - (badCount * 30) + 40)));

  // 4. Food diversity (15%)
  const uniqueWords = new Set(joined.split(/[\s,]+/).filter(w => w.length > 3));
  const foodDiversity = Math.round(Math.min(100, uniqueWords.size * 8));

  // 5. Meal timing (15%)
  const times = allMeals.map(m => m.time).filter(Boolean).map(t => {
    const parts = (t as string).split(':');
    return parts.length >= 2 ? parseInt(parts[0]) + parseInt(parts[1]) / 60 : 12;
  }).sort((a, b) => a - b);
  let mealTiming = 70;
  if (times.length >= 2) {
    const window = times[times.length - 1] - times[0];
    mealTiming = window <= 10 ? 100 : window <= 12 ? 70 : 40;
  }

  // 6. Micronutrient estimate (10%)
  const microCount = allDescriptions.filter(d => MICRONUTRIENT_RICH.test(d)).length;
  const micronutrient = Math.round(Math.min(100, microCount * 30));

  const factors: NutritionScoreFactors = {
    calorieAdherence, proteinDistribution, antiInflammatory,
    foodDiversity, mealTiming, micronutrient,
  };

  const score = Math.round(
    calorieAdherence * 0.20 +
    proteinDistribution * 0.20 +
    antiInflammatory * 0.20 +
    foodDiversity * 0.15 +
    mealTiming * 0.15 +
    micronutrient * 0.10,
  );

  return { score, factors, factorLabels: buildLabels(factors) };
}

function buildLabels(f: NutritionScoreFactors) {
  const status = (v: number): 'green' | 'yellow' | 'red' => v >= 66 ? 'green' : v >= 33 ? 'yellow' : 'red';
  return [
    { key: 'protein', label: 'Protein', score: f.proteinDistribution, status: status(f.proteinDistribution) },
    { key: 'inflammation', label: 'Entzündung', score: f.antiInflammatory, status: status(f.antiInflammatory) },
    { key: 'diversity', label: 'Vielfalt', score: f.foodDiversity, status: status(f.foodDiversity) },
    { key: 'timing', label: 'Timing', score: f.mealTiming, status: status(f.mealTiming) },
    { key: 'micro', label: 'Mikros', score: f.micronutrient, status: status(f.micronutrient) },
  ];
}

/** Generate contextual nutrition insight from score factors */
export function getNutritionInsight(result: LongevityNutritionResult, todayProtein: number, proteinTarget: number): string {
  const { factors } = result;
  const insights: string[] = [];

  if (factors.proteinDistribution >= 70 && factors.mealTiming <= 50) {
    insights.push(`Deine Proteinverteilung war heute gut über den Tag verteilt. Dein Essensfenster ist aber lang — versuch morgen das Frühstück etwas nach hinten zu schieben.`);
  }
  if (factors.foodDiversity <= 40) {
    insights.push(`Nur wenige verschiedene Lebensmittel heute — mehr Vielfalt unterstützt dein Mikrobiom.`);
  }
  if (factors.antiInflammatory <= 40) {
    insights.push(`Heute waren eher entzündungsfördernde Lebensmittel dabei. Morgen: mehr Gemüse, Fisch oder Nüsse einbauen.`);
  }
  if (todayProtein >= proteinTarget * 0.9) {
    insights.push(`Protein-Ziel fast erreicht — ${todayProtein}g von ${proteinTarget}g. Weiter so.`);
  }
  if (factors.mealTiming >= 80) {
    insights.push(`Dein Essensfenster war heute kompakt — das unterstützt deine Zellregeneration.`);
  }
  if (factors.micronutrient >= 70) {
    insights.push(`Gute Mikronährstoff-Abdeckung heute durch nährstoffreiche Lebensmittel.`);
  }

  if (insights.length === 0) {
    if (result.score >= 70) return 'Guter Ernährungstag — du bist auf Kurs.';
    return `Dein Longevity-Nutrition-Score liegt bei ${result.score}. Fokus morgen: mehr Vielfalt und Protein über den Tag verteilen.`;
  }

  return insights[0];
}

/** Calculate weekly nutrition summary */
export function calculateWeeklyNutritionSummary(
  logs: NutritionLogEntry[],
  calorieMin: number,
  calorieMax: number,
  proteinTarget: number,
): {
  avgScore: number;
  avgProteinAdherence: number;
  eatingWindowTrend: string;
  diversityTrend: string;
  recommendation: string;
} {
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  const dailyScores: number[] = [];
  const dailyProtein: number[] = [];

  for (const date of last7Days) {
    const dayLogs = logs.filter(l => l.date === date);
    if (dayLogs.length === 0) continue;
    const result = calculateLongevityNutritionScore(dayLogs, calorieMin, calorieMax, proteinTarget);
    dailyScores.push(result.score);
    dailyProtein.push(dayLogs.reduce((s, l) => s + l.estimatedProteinTotal, 0));
  }

  const avgScore = dailyScores.length > 0 ? Math.round(dailyScores.reduce((s, v) => s + v, 0) / dailyScores.length) : 0;
  const avgProtein = dailyProtein.length > 0 ? Math.round(dailyProtein.reduce((s, v) => s + v, 0) / dailyProtein.length) : 0;
  const avgProteinAdherence = Math.round((avgProtein / proteinTarget) * 100);

  const eatingWindowTrend = avgScore >= 70 ? 'Kompakt — unter 10h' : avgScore >= 40 ? 'Mittel — 10-12h' : 'Lang — über 12h';
  const diversityTrend = dailyScores.length >= 3 ? 'Stabil' : 'Zu wenig Daten';

  let recommendation = 'Logge regelmäßiger, um bessere Empfehlungen zu erhalten.';
  if (avgProteinAdherence < 70) recommendation = 'Protein-Ziel wird oft nicht erreicht. Baue einen Protein-Anker in jede Mahlzeit ein.';
  else if (avgScore < 50) recommendation = 'Mehr Vielfalt und weniger verarbeitete Lebensmittel würden deinen Score deutlich verbessern.';
  else if (avgScore >= 70) recommendation = 'Starke Woche! Halte dieses Niveau — Konsistenz ist der Schlüssel.';

  return { avgScore, avgProteinAdherence, eatingWindowTrend, diversityTrend, recommendation };
}
