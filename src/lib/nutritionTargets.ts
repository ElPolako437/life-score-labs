/**
 * CALINESS Nutrition Target Calculator
 * Uses Mifflin-St Jeor equation for BMR, then applies activity multiplier and goal adjustment.
 */

export interface NutritionTargets {
  calorieMin: number;
  calorieMax: number;
  proteinTarget: number;
  goal: string;
  explanation: string;
}

type Gender = 'männlich' | 'weiblich' | 'divers';
type ActivityLevel = string;
type Goal = string;

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentär: 1.2,
  leicht: 1.375,
  moderat: 1.55,
  aktiv: 1.725,
  sehr_aktiv: 1.9,
};

function getActivityMultiplier(level: ActivityLevel): number {
  if (level.includes('seden') || level.includes('kaum')) return 1.2;
  if (level.includes('leicht') || level.includes('wenig')) return 1.375;
  if (level.includes('aktiv') && level.includes('sehr')) return 1.9;
  if (level.includes('aktiv') || level.includes('hoch')) return 1.725;
  return 1.55; // moderat default
}

function getGoalAdjustment(goals: string[]): { deficitMin: number; deficitMax: number; proteinPerKg: number; label: string } {
  const joined = goals.join(' ').toLowerCase();
  if (joined.includes('fett') || joined.includes('abnehm') || joined.includes('gewicht')) {
    return { deficitMin: 300, deficitMax: 500, proteinPerKg: 1.8, label: 'Fettverlust' };
  }
  if (joined.includes('muskel')) {
    return { deficitMin: 150, deficitMax: 300, proteinPerKg: 2.0, label: 'Muskelerhalt + Fettverlust' };
  }
  if (joined.includes('energie') || joined.includes('recovery') || joined.includes('regenerat')) {
    return { deficitMin: -50, deficitMax: 100, proteinPerKg: 1.6, label: 'Energie & Recovery' };
  }
  // Maintenance / longevity
  return { deficitMin: 0, deficitMax: 100, proteinPerKg: 1.5, label: 'Nachhaltige Balance' };
}

export function calculateNutritionTargets(
  age: number,
  gender: Gender,
  height: number, // cm
  weight: number, // kg
  activityLevel: ActivityLevel,
  goals: string[],
): NutritionTargets {
  // Mifflin-St Jeor BMR
  let bmr: number;
  if (gender === 'weiblich') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  }

  const multiplier = getActivityMultiplier(activityLevel);
  const tdee = Math.round(bmr * multiplier);
  const goalAdj = getGoalAdjustment(goals);

  const calorieMax = tdee - goalAdj.deficitMin;
  const calorieMin = tdee - goalAdj.deficitMax;
  const proteinTarget = Math.round(weight * goalAdj.proteinPerKg);

  // Round to nearest 50
  const roundedMin = Math.round(calorieMin / 50) * 50;
  const roundedMax = Math.round(calorieMax / 50) * 50;

  let explanation: string;
  if (goalAdj.label === 'Fettverlust') {
    explanation = 'Moderates Defizit für nachhaltigen Fettabbau. Protein ist aktuell wichtiger als Kalorien-Perfektion.';
  } else if (goalAdj.label === 'Muskelerhalt + Fettverlust') {
    explanation = 'Leichtes Defizit mit hohem Proteinanteil — schützt die Muskulatur während des Fettabbaus.';
  } else if (goalAdj.label === 'Energie & Recovery') {
    explanation = 'Nahe am Erhaltungsbedarf — Fokus auf Nährstoffqualität und Timing.';
  } else {
    explanation = 'Dein Erhaltungsbereich für langfristige Gesundheit. Qualität vor Quantität.';
  }

  return {
    calorieMin: roundedMin,
    calorieMax: roundedMax,
    proteinTarget,
    goal: goalAdj.label,
    explanation,
  };
}

export function estimateProteinFromLevel(level: 'niedrig' | 'mittel' | 'hoch', mealType: string): number {
  const base: Record<string, Record<string, number>> = {
    niedrig: { frühstück: 5, mittag: 10, abend: 10, snack: 3 },
    mittel: { frühstück: 15, mittag: 25, abend: 25, snack: 8 },
    hoch: { frühstück: 30, mittag: 40, abend: 40, snack: 15 },
  };
  return base[level]?.[mealType] || base[level]?.mittag || 15;
}
