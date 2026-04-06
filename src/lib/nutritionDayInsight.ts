/**
 * Nutrition Day Insight Generator
 * Creates a short, contextual longevity-style interpretation of the user's nutrition day.
 * Connected to: goal type, protein consistency, meal structure, food quality.
 */

import type { NutritionScoreFactors } from '@/lib/longevityNutrition';

/**
 * Generate a contextual nutrition day insight.
 * This is NOT a calorie tracker message. It connects nutrition to longevity, recovery, energy.
 */
export function generateNutritionDayInsight(
  meals: any[],
  todayProtein: number,
  proteinTarget: number,
  nutritionScore: number,
  factors: NutritionScoreFactors | null,
  goalType: string | null,
): string {
  if (meals.length < 2) return '';

  const insights: string[] = [];
  const proteinPct = Math.round((todayProtein / proteinTarget) * 100);
  const mealCount = meals.length;

  // 1. Protein consistency
  const mealProteins = meals.map((m: any) => m.estimatedProtein || 0);
  const highProteinMeals = mealProteins.filter(p => p >= 20).length;
  const hasGoodDistribution = highProteinMeals >= 2;

  if (proteinPct >= 90 && hasGoodDistribution) {
    insights.push('Protein-Ziel erreicht und gut verteilt \u2014 deine Muskeln und dein Stoffwechsel profitieren.');
  } else if (proteinPct >= 90) {
    insights.push('Protein-Ziel erreicht, aber ungleich verteilt. Versuch morgen, Protein gleichm\u00e4\u00dfiger \u00fcber den Tag zu verteilen.');
  } else if (proteinPct >= 70) {
    insights.push(`Protein bei ${proteinPct}% \u2014 noch ${Math.round(proteinTarget - todayProtein)}g f\u00fcr dein Ziel. Abends noch eine proteinreiche Mahlzeit einbauen.`);
  } else if (proteinPct < 50) {
    insights.push(`Nur ${proteinPct}% deines Protein-Ziels. Protein ist der wichtigste Makro f\u00fcr Longevity \u2014 morgen fr\u00fch mit 30g starten.`);
  }

  // 2. Meal structure
  if (mealCount >= 3 && mealCount <= 4) {
    insights.push('Gute Mahlzeiten-Struktur heute \u2014 regelm\u00e4\u00dfiges Essen stabilisiert deinen Blutzucker.');
  } else if (mealCount <= 1) {
    insights.push('Nur eine Mahlzeit geloggt. Regelm\u00e4\u00dfige Mahlzeiten sind wichtig f\u00fcr stabilen Blutzucker und Energielevel.');
  }

  // 3. Food quality from factors
  if (factors) {
    if (factors.antiInflammatory >= 70) {
      insights.push('Gute anti-inflammatorische Nahrungsauswahl \u2014 das unterst\u00fctzt deine Zellregeneration.');
    } else if (factors.antiInflammatory <= 35) {
      insights.push('Heute eher entz\u00fcndungsf\u00f6rdernde Lebensmittel. Morgen: mehr Gem\u00fcse, Fisch oder N\u00fcsse.');
    }

    if (factors.foodDiversity >= 70) {
      insights.push('Hohe Vielfalt \u2014 dein Mikrobiom freut sich.');
    }

    if (factors.mealTiming >= 80) {
      insights.push('Kompaktes Essensfenster \u2014 das unterst\u00fctzt deine zellul\u00e4re Autophagie.');
    }
  }

  // 4. Goal-specific connection
  if (goalType === 'fat_loss' && proteinPct >= 80) {
    insights.push('Hohe Protein-Zufuhr sch\u00fctzt deine Muskelmasse im Defizit.');
  } else if (goalType === 'muscle_gain' && proteinPct >= 90) {
    insights.push('Dein Protein war heute konsistent \u2014 das st\u00e4rkt deinen Fortschritt Richtung Muskelaufbau.');
  } else if (goalType === 'sleep' && mealCount >= 2) {
    insights.push('Tipp: Letzte Mahlzeit 3h vor dem Schlafen halten f\u00fcr bessere Schlafqualit\u00e4t.');
  } else if (goalType === 'energy' && hasGoodDistribution) {
    insights.push('Gleichm\u00e4\u00dfige Protein-Verteilung = stabilere Energie \u00fcber den Tag.');
  } else if (goalType === 'stress' && mealCount >= 3) {
    insights.push('Regelm\u00e4\u00dfiges Essen hilft, Cortisol niedrig zu halten.');
  }

  // 5. Overall score-based framing
  if (nutritionScore >= 75 && insights.length < 3) {
    insights.push('Starker Ern\u00e4hrungstag \u2014 genau so unterst\u00fctzt du deine biologische Verj\u00fcngung.');
  } else if (nutritionScore < 40 && insights.length < 3) {
    insights.push('Dein Ern\u00e4hrungs-Score ist noch niedrig. Fokus morgen: Protein und Vielfalt.');
  }

  // Return max 2 insights, joined
  return insights.slice(0, 2).join(' ');
}

/**
 * Generate a weekly nutrition summary text for the AI report prompt.
 */
export function generateWeeklyNutritionContext(
  weekNutritionLogs: any[],
  proteinTarget: number,
  mealLogDays: number,
): string {
  if (weekNutritionLogs.length === 0) return 'Keine Ern\u00e4hrungsdaten diese Woche.';

  const totalMeals = weekNutritionLogs.reduce((s, l) => s + (l.meals?.length || 0), 0);
  const avgProtein = Math.round(
    weekNutritionLogs.reduce((s, l) => s + (l.estimatedProteinTotal || 0), 0) / Math.max(1, mealLogDays),
  );
  const proteinAdherence = Math.round((avgProtein / proteinTarget) * 100);

  // Count meal types
  const allMeals = weekNutritionLogs.flatMap(l => l.meals || []);
  const swappedCount = allMeals.filter((m: any) => m.swappedFrom || m.status === 'swapped').length;
  const mealNames = allMeals.map((m: any) => (m.name || '').toLowerCase());
  const uniqueMeals = new Set(mealNames.filter(n => n.length > 3)).size;

  const parts: string[] = [];
  parts.push(`${totalMeals} Mahlzeiten an ${mealLogDays} Tagen geloggt.`);
  parts.push(`Protein-Durchschnitt: ${avgProtein}g/Tag (${proteinAdherence}% vom Ziel).`);
  if (swappedCount > 0) parts.push(`${swappedCount} Mahlzeiten intelligent getauscht.`);
  parts.push(`${uniqueMeals} verschiedene Mahlzeiten.`);

  return parts.join(' ');
}
