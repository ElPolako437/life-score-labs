/**
 * Meal Swap System
 * Provides intelligent meal alternatives that stay aligned with the original meal's
 * nutritional profile (calorie direction, protein level, meal type).
 */

import { RECIPE_TEMPLATES, type Recipe } from '@/lib/pillarPlans';

export interface SwapCandidate {
  recipe: Recipe;
  matchScore: number; // 0-100 how close to original
  matchReason: string;
}

/**
 * Find swap candidates for a meal, scored by similarity to the original.
 * Returns up to `max` alternatives sorted by match score.
 * Filters by meal type and excludes the original meal by both ID and name.
 */
export function findSwapCandidates(
  originalMealId: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  targetProtein: number,
  targetCalories: number,
  max = 3,
  originalName?: string,
): SwapCandidate[] {
  const nameLower = originalName?.toLowerCase().trim() || '';
  const candidates = RECIPE_TEMPLATES.filter(r =>
    r.mealType === mealType && r.id !== originalMealId
    && (!nameLower || r.name.toLowerCase().trim() !== nameLower)
  );

  const scored = candidates.map(recipe => {
    let score = 50; // base
    const reasons: string[] = [];

    // Protein similarity (within 10g = perfect, within 20g = good)
    const proteinDiff = Math.abs(recipe.protein - targetProtein);
    if (proteinDiff <= 5) { score += 25; reasons.push('Protein passt'); }
    else if (proteinDiff <= 10) { score += 15; reasons.push('Protein aehnlich'); }
    else if (proteinDiff <= 20) { score += 5; }

    // Calorie similarity (within 50 = perfect, within 100 = good)
    const calDiff = Math.abs(recipe.calories - targetCalories);
    if (calDiff <= 50) { score += 20; reasons.push('Kalorien passen'); }
    else if (calDiff <= 100) { score += 10; }
    else if (calDiff <= 150) { score += 5; }

    // Prep time bonus (quick meals get slight boost)
    if (recipe.prepTime <= 10) { score += 5; reasons.push('Schnell'); }

    return {
      recipe,
      matchScore: Math.min(100, score),
      matchReason: reasons.length > 0 ? reasons.join(' · ') : 'Alternative',
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, max);
}

/**
 * Get the meal type from a meal index within a day.
 */
export function getMealTypeFromIndex(mealIdx: number): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  if (mealIdx === 0) return 'breakfast';
  if (mealIdx === 1) return 'lunch';
  if (mealIdx === 2) return 'dinner';
  return 'snack';
}

/**
 * Meal status types for the daily feed.
 */
export type MealStatus = 'planned' | 'eaten' | 'swapped' | 'skipped';

export interface DailyMealEntry {
  id: string;
  mealIndex: number;
  dayIndex: number;
  originalName: string;
  actualName: string;
  status: MealStatus;
  protein: number;
  calories: number;
  time?: string;
  swappedFrom?: string;
  longevityBenefit?: string;
}
