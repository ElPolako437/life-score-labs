/**
 * Meal Preference Learning System
 * Learns from nutrition logs to build a preference profile that progressively
 * personalizes meal plan generation.
 */

import type { NutritionLogEntry } from '@/contexts/AppContext';
import type { Recipe } from '@/lib/pillarPlans';

/* ═══ Types ═══ */

export interface MealPreferenceProfile {
  acceptedRecipeIds: string[];    // eaten as-is (positive signal)
  skippedRecipeIds: string[];     // skipped (negative signal)
  swappedRecipeIds: string[];     // swapped away from (mild negative)
  acceptedMealTypes: string[];    // e.g. ['bowl', 'wrap', 'salat'] — inferred from recipe names
  preferredProteinRange: { min: number; max: number }; // from accepted meals
  preferredCalorieRange: { min: number; max: number }; // from accepted meals
  prepTimePreference: 'quick' | 'medium' | 'any'; // inferred from accepted vs skipped
  lastUpdated: string; // ISO date
}

/* ═══ Meal type keywords for name-based classification ═══ */

const MEAL_TYPE_KEYWORDS = [
  'bowl', 'wrap', 'salat', 'shake', 'oats', 'smoothie',
  'suppe', 'curry', 'pfanne', 'auflauf', 'toast', 'brot',
  'porridge', 'müsli', 'joghurt', 'ei', 'omelett', 'lachs',
  'hähnchen', 'quinoa', 'reis', 'pasta', 'nudel',
];

function inferMealTypes(names: string[]): string[] {
  const found = new Set<string>();
  for (const name of names) {
    const lower = name.toLowerCase();
    for (const kw of MEAL_TYPE_KEYWORDS) {
      if (lower.includes(kw)) found.add(kw);
    }
  }
  return Array.from(found);
}

function matchRecipeByName(mealName: string, recipes: Recipe[]): Recipe | undefined {
  const lower = mealName.toLowerCase().trim();
  return recipes.find(r => r.name.toLowerCase().trim() === lower);
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}

function stddev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const variance = nums.reduce((s, v) => s + (v - m) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

/* ═══ Build preference profile from nutrition logs ═══ */

export function buildMealPreferenceProfile(
  nutritionLogs: NutritionLogEntry[],
  allRecipes: Recipe[],
): MealPreferenceProfile {
  const accepted: Map<string, number> = new Map(); // recipeId → count
  const skipped: Map<string, number> = new Map();
  const swapped: Map<string, number> = new Map();
  const acceptedNames: string[] = [];
  const acceptedProteins: number[] = [];
  const acceptedCalories: number[] = [];
  const acceptedPrepTimes: number[] = [];

  for (const log of nutritionLogs) {
    for (const meal of log.meals) {
      const status = meal.status || 'eaten'; // default to eaten if no status
      const mealName = meal.name || meal.description || '';
      const recipe = matchRecipeByName(mealName, allRecipes);

      if (status === 'eaten') {
        if (recipe) {
          accepted.set(recipe.id, (accepted.get(recipe.id) || 0) + 1);
          acceptedPrepTimes.push(recipe.prepTime);
          acceptedProteins.push(recipe.protein);
          acceptedCalories.push(recipe.calories);
        }
        acceptedNames.push(mealName);
        // Also use inline data if recipe not found
        if (!recipe && meal.estimatedProtein > 0) {
          acceptedProteins.push(meal.estimatedProtein);
        }
        if (!recipe && meal.estimatedCalories && meal.estimatedCalories > 0) {
          acceptedCalories.push(meal.estimatedCalories);
        }
      } else if (status === 'skipped') {
        if (recipe) {
          skipped.set(recipe.id, (skipped.get(recipe.id) || 0) + 1);
        }
      } else if (status === 'swapped') {
        // swappedFrom holds the original meal name
        const origName = meal.swappedFrom || '';
        const origRecipe = origName ? matchRecipeByName(origName, allRecipes) : undefined;
        if (origRecipe) {
          swapped.set(origRecipe.id, (swapped.get(origRecipe.id) || 0) + 1);
        }
        // The current meal is the accepted replacement
        if (recipe) {
          accepted.set(recipe.id, (accepted.get(recipe.id) || 0) + 1);
          acceptedPrepTimes.push(recipe.prepTime);
          acceptedProteins.push(recipe.protein);
          acceptedCalories.push(recipe.calories);
        }
        acceptedNames.push(mealName);
      }
    }
  }

  // Preferred protein range: mean ± 1 stddev
  const protMean = mean(acceptedProteins);
  const protStd = stddev(acceptedProteins);
  const preferredProteinRange = {
    min: Math.max(0, Math.round(protMean - protStd)),
    max: Math.round(protMean + protStd) || 999,
  };

  // Preferred calorie range: mean ± 1 stddev
  const calMean = mean(acceptedCalories);
  const calStd = stddev(acceptedCalories);
  const preferredCalorieRange = {
    min: Math.max(0, Math.round(calMean - calStd)),
    max: Math.round(calMean + calStd) || 9999,
  };

  // Prep time preference
  const avgPrepTime = mean(acceptedPrepTimes);
  let prepTimePreference: 'quick' | 'medium' | 'any' = 'any';
  if (acceptedPrepTimes.length > 0) {
    if (avgPrepTime < 15) prepTimePreference = 'quick';
    else if (avgPrepTime < 30) prepTimePreference = 'medium';
  }

  // Infer accepted meal type keywords
  const acceptedMealTypes = inferMealTypes(acceptedNames);

  return {
    acceptedRecipeIds: Array.from(accepted.entries()).filter(([, c]) => c >= 1).map(([id]) => id),
    skippedRecipeIds: Array.from(skipped.entries()).filter(([, c]) => c >= 2).map(([id]) => id),
    swappedRecipeIds: Array.from(swapped.entries()).filter(([, c]) => c >= 1).map(([id]) => id),
    acceptedMealTypes,
    preferredProteinRange,
    preferredCalorieRange,
    prepTimePreference,
    lastUpdated: new Date().toISOString(),
  };
}

/* ═══ Score a recipe by user preferences ═══ */

export function scoreMealByPreferences(recipe: Recipe, prefs: MealPreferenceProfile): number {
  // Hard exclude: skipped 2+ times
  if (prefs.skippedRecipeIds.includes(recipe.id)) return -Infinity;

  let score = 0;

  // Accepted recipe bonus
  if (prefs.acceptedRecipeIds.includes(recipe.id)) score += 30;

  // Swapped away penalty
  if (prefs.swappedRecipeIds.includes(recipe.id)) score -= 15;

  // Protein range match
  if (
    recipe.protein >= prefs.preferredProteinRange.min &&
    recipe.protein <= prefs.preferredProteinRange.max
  ) {
    score += 20;
  }

  // Prep time match
  if (
    (prefs.prepTimePreference === 'quick' && recipe.prepTime <= 15) ||
    (prefs.prepTimePreference === 'medium' && recipe.prepTime <= 30) ||
    prefs.prepTimePreference === 'any'
  ) {
    score += 10;
  }

  // Meal type keyword match
  const nameLower = recipe.name.toLowerCase();
  for (const kw of prefs.acceptedMealTypes) {
    if (nameLower.includes(kw)) {
      score += 15;
      break; // only one bonus per recipe
    }
  }

  return score;
}

/* ═══ Persistence (localStorage) ═══ */

export function persistPreferenceProfile(profile: MealPreferenceProfile, userId: string): void {
  try {
    localStorage.setItem(`caliness_meal_prefs_${userId}`, JSON.stringify(profile));
  } catch {
    // Silently fail if storage is full
  }
}

export function loadPreferenceProfile(userId: string): MealPreferenceProfile | null {
  try {
    const raw = localStorage.getItem(`caliness_meal_prefs_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPreferenceProfile(userId: string): void {
  try {
    localStorage.removeItem(`caliness_meal_prefs_${userId}`);
  } catch {
    // Silently fail
  }
}

/* ═══ Nutrition Settings Persistence ═══ */

export interface NutritionSettings {
  dietaryStyle: 'vegetarisch' | 'flexitarisch' | 'alles';
  intolerances: string[]; // 'lactose', 'gluten', 'nuts', 'eggs'
  mealComplexity: 'quick' | 'medium' | 'any';
}

const DEFAULT_SETTINGS: NutritionSettings = {
  dietaryStyle: 'alles',
  intolerances: [],
  mealComplexity: 'any',
};

export function persistNutritionSettings(settings: NutritionSettings, userId: string): void {
  try {
    localStorage.setItem(`caliness_nutrition_settings_${userId}`, JSON.stringify(settings));
  } catch {
    // Silently fail
  }
}

export function loadNutritionSettings(userId: string): NutritionSettings {
  try {
    const raw = localStorage.getItem(`caliness_nutrition_settings_${userId}`);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}
