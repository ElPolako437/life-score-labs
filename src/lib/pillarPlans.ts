/**
 * CALINESS Pillar Plan Generators
 * Placeholder generators structured for future LLM API replacement.
 */

import type { RealismData, FullAssessment, ExtendedGoal } from './goalAssessment';
import { scoreMealByPreferences, type MealPreferenceProfile } from './mealPreferences';

/* ═══ Nutrition Plan ═══ */

export interface MealIngredient {
  name: string;
  amount: number;       // default amount in grams (or units for 'stk')
  unit: 'g' | 'ml' | 'stk';
  protein_per_100: number; // grams of protein per 100g
  calories_per_100: number; // kcal per 100g
}

/** Calculate totals from ingredient list */
export function calcMealNutrition(ingredients: MealIngredient[]): { protein: number; calories: number } {
  return ingredients.reduce((acc, ing) => ({
    protein: acc.protein + (ing.protein_per_100 * ing.amount / 100),
    calories: acc.calories + (ing.calories_per_100 * ing.amount / 100),
  }), { protein: 0, calories: 0 });
}

export interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  ingredients: string[];
  tip?: string;
  ingredientAmounts?: { name: string; amount: string }[];
  nutritionIngredients?: MealIngredient[]; // structured ingredient data for customization
  steps?: string[];
  prepTime?: number;
  longevityBenefit?: string;
  carbs?: number;
  fat?: number;
}

export interface NutritionDay {
  day: string;
  totalCalories: number;
  totalProtein: number;
  meals: MealItem[];
}

export interface NutritionPlan {
  title: string;
  days: NutritionDay[];
  generatedAt: string;
}

function pickRandom<T>(arr: T[], exclude?: string): T {
  const filtered = exclude ? arr.filter((item: any) => item.id !== exclude) : arr;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

/* ═══ Ingredient Nutrition Database ═══ */
const INGREDIENT_DB: Record<string, { protein_per_100: number; calories_per_100: number; defaultUnit: 'g' | 'ml' | 'stk' }> = {
  'Haferflocken':        { protein_per_100: 13,   calories_per_100: 370,  defaultUnit: 'g' },
  'Whey Protein':        { protein_per_100: 75,   calories_per_100: 380,  defaultUnit: 'g' },
  'Proteinpulver':       { protein_per_100: 75,   calories_per_100: 380,  defaultUnit: 'g' },
  'Blaubeeren':          { protein_per_100: 1,    calories_per_100: 45,   defaultUnit: 'g' },
  'Mandeln':             { protein_per_100: 21,   calories_per_100: 580,  defaultUnit: 'g' },
  'Eier':                { protein_per_100: 13,   calories_per_100: 155,  defaultUnit: 'stk' },
  'Vollkornbrot':        { protein_per_100: 9,    calories_per_100: 247,  defaultUnit: 'g' },
  'Avocado':             { protein_per_100: 2,    calories_per_100: 160,  defaultUnit: 'g' },
  'Tomate':              { protein_per_100: 0.9,  calories_per_100: 18,   defaultUnit: 'g' },
  'Skyr':                { protein_per_100: 11,   calories_per_100: 63,   defaultUnit: 'g' },
  'Walnüsse':            { protein_per_100: 15,   calories_per_100: 654,  defaultUnit: 'g' },
  'Honig':               { protein_per_100: 0.3,  calories_per_100: 304,  defaultUnit: 'g' },
  'Leinsamen':           { protein_per_100: 18,   calories_per_100: 534,  defaultUnit: 'g' },
  'Spinat':              { protein_per_100: 2.9,  calories_per_100: 23,   defaultUnit: 'g' },
  'Feta':                { protein_per_100: 14,   calories_per_100: 264,  defaultUnit: 'g' },
  'Olivenöl':            { protein_per_100: 0,    calories_per_100: 884,  defaultUnit: 'ml' },
  'Chia-Samen':          { protein_per_100: 17,   calories_per_100: 486,  defaultUnit: 'g' },
  'Kokosmilch':          { protein_per_100: 2.3,  calories_per_100: 230,  defaultUnit: 'ml' },
  'Mango':               { protein_per_100: 0.8,  calories_per_100: 60,   defaultUnit: 'g' },
  'Hähnchenbrust':       { protein_per_100: 31,   calories_per_100: 165,  defaultUnit: 'g' },
  'Reis':                { protein_per_100: 2.5,  calories_per_100: 130,  defaultUnit: 'g' },
  'Brokkoli':            { protein_per_100: 2.8,  calories_per_100: 34,   defaultUnit: 'g' },
  'Süßkartoffel':        { protein_per_100: 1.6,  calories_per_100: 86,   defaultUnit: 'g' },
  'Lachs-Filet':         { protein_per_100: 25,   calories_per_100: 208,  defaultUnit: 'g' },
  'Quinoa':              { protein_per_100: 4.4,  calories_per_100: 120,  defaultUnit: 'g' },
  'Gurke':               { protein_per_100: 0.7,  calories_per_100: 16,   defaultUnit: 'g' },
  'Rote Linsen':         { protein_per_100: 9,    calories_per_100: 116,  defaultUnit: 'g' },
  'Thunfisch (Dose)':    { protein_per_100: 26,   calories_per_100: 116,  defaultUnit: 'g' },
  'Vollkorn-Tortilla':   { protein_per_100: 9,    calories_per_100: 290,  defaultUnit: 'stk' },
  'Rucola':              { protein_per_100: 2.6,  calories_per_100: 25,   defaultUnit: 'g' },
  'Putenbrust':          { protein_per_100: 29,   calories_per_100: 157,  defaultUnit: 'g' },
  'Putensteak':          { protein_per_100: 29,   calories_per_100: 157,  defaultUnit: 'g' },
  'Kichererbsen':        { protein_per_100: 9,    calories_per_100: 164,  defaultUnit: 'g' },
  'Paprika':             { protein_per_100: 1,    calories_per_100: 31,   defaultUnit: 'g' },
  'Zucchini':            { protein_per_100: 1.2,  calories_per_100: 17,   defaultUnit: 'g' },
  'Garnelen':            { protein_per_100: 24,   calories_per_100: 99,   defaultUnit: 'g' },
  'Pak Choi':            { protein_per_100: 1.5,  calories_per_100: 13,   defaultUnit: 'g' },
  'Ingwer':              { protein_per_100: 1.8,  calories_per_100: 80,   defaultUnit: 'g' },
  'Sesam':               { protein_per_100: 18,   calories_per_100: 573,  defaultUnit: 'g' },
  'Pesto':               { protein_per_100: 4,    calories_per_100: 387,  defaultUnit: 'g' },
  'Parmesan':            { protein_per_100: 38,   calories_per_100: 431,  defaultUnit: 'g' },
  'Banane':              { protein_per_100: 1.2,  calories_per_100: 89,   defaultUnit: 'g' },
  'Mandelmilch':         { protein_per_100: 0.4,  calories_per_100: 13,   defaultUnit: 'ml' },
  'Griech. Joghurt':     { protein_per_100: 10,   calories_per_100: 58,   defaultUnit: 'g' },
  'Cottage Cheese':      { protein_per_100: 11,   calories_per_100: 98,   defaultUnit: 'g' },
  'Edamame (TK)':        { protein_per_100: 11,   calories_per_100: 122,  defaultUnit: 'g' },
  'Meersalz':            { protein_per_100: 0,    calories_per_100: 0,    defaultUnit: 'g' },
  'Datteln':             { protein_per_100: 2.5,  calories_per_100: 282,  defaultUnit: 'g' },
  'Kokosraspeln':        { protein_per_100: 5.6,  calories_per_100: 660,  defaultUnit: 'g' },
  'Kakao':               { protein_per_100: 20,   calories_per_100: 228,  defaultUnit: 'g' },
  'Oliven':              { protein_per_100: 0.8,  calories_per_100: 115,  defaultUnit: 'g' },
  'Gurke & Tomate':      { protein_per_100: 0.8,  calories_per_100: 17,   defaultUnit: 'g' },
  'Rosmarin':            { protein_per_100: 3.3,  calories_per_100: 131,  defaultUnit: 'g' },
  'Pfeffer':             { protein_per_100: 10,   calories_per_100: 251,  defaultUnit: 'g' },
  // Extended DB
  'Rindfleisch':         { protein_per_100: 26,   calories_per_100: 250,  defaultUnit: 'g' },
  'Tofu':                { protein_per_100: 8,    calories_per_100: 76,   defaultUnit: 'g' },
  'Tempeh':              { protein_per_100: 19,   calories_per_100: 193,  defaultUnit: 'g' },
  'Mozzarella':          { protein_per_100: 22,   calories_per_100: 280,  defaultUnit: 'g' },
  'Vollkorn-Pasta':      { protein_per_100: 13,   calories_per_100: 348,  defaultUnit: 'g' },
  'Hirse':               { protein_per_100: 11,   calories_per_100: 378,  defaultUnit: 'g' },
  'Buchweizen':          { protein_per_100: 13,   calories_per_100: 343,  defaultUnit: 'g' },
  'Couscous':            { protein_per_100: 3.8,  calories_per_100: 112,  defaultUnit: 'g' },
  'Karotte':             { protein_per_100: 0.9,  calories_per_100: 41,   defaultUnit: 'g' },
  'Blumenkohl':          { protein_per_100: 2,    calories_per_100: 25,   defaultUnit: 'g' },
  'Aubergine':           { protein_per_100: 1,    calories_per_100: 25,   defaultUnit: 'g' },
  'Champignons':         { protein_per_100: 3.1,  calories_per_100: 22,   defaultUnit: 'g' },
  'Himbeeren':           { protein_per_100: 1.2,  calories_per_100: 52,   defaultUnit: 'g' },
  'Erdbeeren':           { protein_per_100: 0.8,  calories_per_100: 32,   defaultUnit: 'g' },
  'Apfel':               { protein_per_100: 0.3,  calories_per_100: 52,   defaultUnit: 'g' },
  'Kürbiskerne':         { protein_per_100: 30,   calories_per_100: 559,  defaultUnit: 'g' },
  'Sonnenblumenkerne':   { protein_per_100: 21,   calories_per_100: 584,  defaultUnit: 'g' },
  'Erdnussbutter':       { protein_per_100: 25,   calories_per_100: 588,  defaultUnit: 'g' },
  'Sojasauce':           { protein_per_100: 5.6,  calories_per_100: 53,   defaultUnit: 'ml' },
  'Zitrone':             { protein_per_100: 1.1,  calories_per_100: 29,   defaultUnit: 'stk' },
  'Knoblauch':           { protein_per_100: 6.4,  calories_per_100: 149,  defaultUnit: 'g' },
  'Zwiebel':             { protein_per_100: 1.1,  calories_per_100: 40,   defaultUnit: 'g' },
  'Petersilie':          { protein_per_100: 3,    calories_per_100: 36,   defaultUnit: 'g' },
  'Kurkuma':             { protein_per_100: 8,    calories_per_100: 312,  defaultUnit: 'g' },
  'Grünkohl':            { protein_per_100: 4.3,  calories_per_100: 49,   defaultUnit: 'g' },
  'Rote Bete':           { protein_per_100: 1.6,  calories_per_100: 43,   defaultUnit: 'g' },
  'Sellerie':            { protein_per_100: 0.7,  calories_per_100: 14,   defaultUnit: 'g' },
  'Spargel':             { protein_per_100: 2.2,  calories_per_100: 20,   defaultUnit: 'g' },
  'Schwarze Bohnen':     { protein_per_100: 8.9,  calories_per_100: 132,  defaultUnit: 'g' },
  'Kidneybohnen':        { protein_per_100: 8.7,  calories_per_100: 127,  defaultUnit: 'g' },
  'Hüttenkäse':          { protein_per_100: 11,   calories_per_100: 98,   defaultUnit: 'g' },
  'Milch':               { protein_per_100: 3.4,  calories_per_100: 64,   defaultUnit: 'ml' },
  'Sahne':               { protein_per_100: 2.1,  calories_per_100: 195,  defaultUnit: 'ml' },
  'Butter':              { protein_per_100: 0.9,  calories_per_100: 717,  defaultUnit: 'g' },
  'Vollkornmehl':        { protein_per_100: 14,   calories_per_100: 340,  defaultUnit: 'g' },
  'Naturjoghurt':        { protein_per_100: 3.5,  calories_per_100: 61,   defaultUnit: 'g' },
  'Tahini':              { protein_per_100: 17,   calories_per_100: 595,  defaultUnit: 'g' },
  'Räucherlachs':        { protein_per_100: 18,   calories_per_100: 117,  defaultUnit: 'g' },
  'Forelle':             { protein_per_100: 20,   calories_per_100: 119,  defaultUnit: 'g' },
  'Sardinen':            { protein_per_100: 25,   calories_per_100: 208,  defaultUnit: 'g' },
};

/** Parse recipe ingredient amount string into numeric grams */
function parseIngredientAmount(amountStr: string): { amount: number; unit: 'g' | 'ml' | 'stk' } {
  const s = amountStr.toLowerCase().trim();
  // Match patterns like "80g", "200ml", "3 Stück", "1", "½", "1 TL", "1 EL"
  if (s.includes('stück') || s.includes('stk')) {
    const num = parseFloat(s) || 1;
    // Convert pieces to approx grams: egg ~55g, tortilla ~65g
    return { amount: num * 55, unit: 'stk' };
  }
  if (s.includes('tl')) return { amount: 5, unit: 'g' };
  if (s.includes('el')) return { amount: 15, unit: 'g' };
  if (s.includes('zweig') || s.includes('prise') || s.includes('nach bedarf')) return { amount: 2, unit: 'g' };
  if (s === '½' || s === '1/2') return { amount: 80, unit: 'g' };

  const numMatch = s.match(/[\d.]+/);
  const num = numMatch ? parseFloat(numMatch[0]) : 100;

  if (s.includes('ml')) return { amount: num, unit: 'ml' };
  if (s.includes('g')) return { amount: num, unit: 'g' };

  // Bare number — assume grams or one piece (~100g)
  return { amount: num > 10 ? num : num * 100, unit: 'g' };
}

function buildNutritionIngredients(recipe: Recipe): MealIngredient[] {
  return recipe.ingredients.map(ing => {
    const db = INGREDIENT_DB[ing.name];
    const parsed = parseIngredientAmount(ing.amount);
    if (db) {
      return {
        name: ing.name,
        amount: parsed.amount,
        unit: db.defaultUnit,
        protein_per_100: db.protein_per_100,
        calories_per_100: db.calories_per_100,
      };
    }
    // Fallback: estimate from recipe totals divided by ingredient count
    return {
      name: ing.name,
      amount: parsed.amount,
      unit: parsed.unit,
      protein_per_100: 5,
      calories_per_100: 100,
    };
  });
}

function recipeToMealItem(r: Recipe): MealItem {
  return {
    id: r.id, name: r.name, calories: r.calories, protein: r.protein,
    carbs: r.carbs, fat: r.fat,
    ingredients: r.ingredients.map(i => `${i.amount} ${i.name}`),
    ingredientAmounts: r.ingredients,
    nutritionIngredients: buildNutritionIngredients(r),
    steps: r.steps, prepTime: r.prepTime,
    longevityBenefit: r.longevityBenefit,
  };
}

function pickRecipe(mealType: string, excludeId?: string): MealItem {
  const candidates = RECIPE_TEMPLATES.filter(r => r.mealType === mealType && r.id !== excludeId);
  const recipe = candidates[Math.floor(Math.random() * candidates.length)] || RECIPE_TEMPLATES[0];
  return recipeToMealItem(recipe);
}

/* ═══ Intolerance Ingredient Filters ═══ */
const INTOLERANCE_INGREDIENTS: Record<string, RegExp> = {
  lactose: /milch|joghurt|käse|skyr|quark|sahne|butter|mozzarella|feta|parmesan|cottage|hüttenkäse/i,
  gluten: /haferflocken|brot|vollkorn|pasta|couscous|tortilla|mehl|buchweizen/i,
  nuts: /mandeln|walnüsse|erdnuss|kürbiskerne|sonnenblumenkerne|nüsse|cashew/i,
  eggs: /eier|ei\b/i,
};

/** Activity level calorie multiplier */
function activityCalorieMultiplier(level?: string): number {
  switch (level) {
    case 'sedentary': return 0.85;
    case 'light': return 0.95;
    case 'moderate': return 1.0;
    case 'active': return 1.1;
    case 'very_active': return 1.2;
    default: return 1.0;
  }
}

export function generateNutritionPlan(realism: RealismData, _goal: ExtendedGoal, personalization?: Record<string, any>): NutritionPlan {
  const mainGoal = personalization?.mainGoal;
  const challenge = personalization?.challenge;
  const style = personalization?.style;
  const intolerances: string[] = personalization?.intolerances || [];
  const activityLevel = personalization?.activityLevel;
  const mealPrefs: import('@/lib/mealPreferences').MealPreferenceProfile | undefined = personalization?.mealPrefs;

  // Calorie target from realism data, adjusted by activity level
  const baseCals = (realism.calorieRange.min + realism.calorieRange.max) / 2;
  const dailyCalTarget = Math.round(baseCals * activityCalorieMultiplier(activityLevel));

  // Dietary style filter: use isMeat flag instead of hardcoded ID set
  const isVeg = style === 'vegetarisch' || style === 'vegan';

  // Build a base filtered pool
  const filterRecipes = (recipes: Recipe[]): Recipe[] => {
    let pool = recipes;
    // Vegetarian filter
    if (isVeg) pool = pool.filter(r => !r.isMeat);
    // Intolerance filter
    for (const intol of intolerances) {
      const pattern = INTOLERANCE_INGREDIENTS[intol];
      if (pattern) {
        pool = pool.filter(r => !r.ingredients.some(ing => pattern.test(ing.name)));
      }
    }
    return pool;
  };

  // Prefer high-protein recipes when muscle_gain or no_protein challenge
  const preferHighProtein = mainGoal === 'muscle_gain' || challenge === 'no_protein';

  // Goal-specific scoring for candidate ranking
  const goalScore = (r: Recipe, mealType: string): number => {
    let score = 0;
    if (mainGoal === 'fat_loss') {
      if (r.protein > 25 && mealType !== 'snack') score += 10;
      if (r.calories < 500 && (mealType === 'lunch' || mealType === 'dinner')) score += 10;
    } else if (mainGoal === 'muscle_gain') {
      if (r.protein > 35) score += 15;
    } else if (mainGoal === 'sleep_improvement' || mainGoal === 'sleep') {
      if (mealType === 'dinner' && r.calories < 450) score += 5;
    } else if (mainGoal === 'stress_reduction' || mainGoal === 'stress') {
      if (r.tags?.includes('anti-inflammatory')) score += 10;
    } else if (mainGoal === 'energy' || mainGoal === 'energy_recovery') {
      if (r.carbs > 30 && r.protein > 20) score += 10;
    }
    return score;
  };

  // Deduplication tracker across the week (Improvement 2)
  const usedIds: Record<string, Set<string>> = {
    breakfast: new Set<string>(),
    lunch: new Set<string>(),
    dinner: new Set<string>(),
    snack: new Set<string>(),
  };

  const pickPersonalized = (mealType: string, caloriesBudget?: number): MealItem => {
    let pool = filterRecipes(RECIPE_TEMPLATES.filter(r => r.mealType === mealType));
    if (pool.length === 0) pool = RECIPE_TEMPLATES.filter(r => r.mealType === mealType);

    // Hard-exclude skipped recipes when preferences are available
    if (mealPrefs) {
      const filtered = pool.filter(r => {
        const prefScore = scoreMealByPreferences(r, mealPrefs);
        return prefScore !== -Infinity;
      });
      if (filtered.length > 0) pool = filtered;
    }

    // Deduplication: exclude already-used IDs for this meal type
    const available = pool.filter(r => !usedIds[mealType].has(r.id));
    const candidates = available.length > 0 ? available : pool; // fallback if exhausted

    // Score and sort candidates
    const scored = candidates.map(r => {
      // Base goal + calorie + protein scoring
      let score = goalScore(r, mealType)
        + (preferHighProtein ? Math.min(20, r.protein / 2) : 0)
        + (caloriesBudget !== undefined ? Math.max(0, 10 - Math.abs(r.calories - caloriesBudget) / 50) : 0)
        + Math.random() * 8; // add randomness to avoid determinism

      // Add preference score when available
      if (mealPrefs) {
        const prefScore = scoreMealByPreferences(r, mealPrefs);
        // For accepted recipes: only boost if not already used this week (avoid repetition)
        if (mealPrefs.acceptedRecipeIds.includes(r.id) && usedIds[mealType].has(r.id)) {
          score += Math.max(0, prefScore - 30); // remove the +30 accepted bonus for repeats
        } else {
          score += prefScore;
        }
      }

      return { recipe: r, score };
    });
    scored.sort((a, b) => b.score - a.score);

    // Pick from top candidates with some variance
    const topN = Math.min(4, scored.length);
    const pick = scored[Math.floor(Math.random() * topN)]?.recipe || scored[0]?.recipe || RECIPE_TEMPLATES[0];
    usedIds[mealType].add(pick.id);
    return recipeToMealItem(pick);
  };

  // Calorie-aware daily plan generation (Improvement 3)
  const days: NutritionDay[] = DAYS.map(day => {
    // Allocate calorie budget: breakfast ~25%, lunch ~35%, dinner ~30%, snack ~10%
    const bfBudget = Math.round(dailyCalTarget * 0.25);
    const lunchBudget = Math.round(dailyCalTarget * 0.35);
    const snackBudget = Math.round(dailyCalTarget * 0.10);

    const breakfast = pickPersonalized('breakfast', bfBudget);
    const lunch = pickPersonalized('lunch', lunchBudget);

    // Dinner: remaining calories minus snack budget
    const runningCals = breakfast.calories + lunch.calories;
    const dinnerBudget = Math.max(300, dailyCalTarget - runningCals - snackBudget);
    const dinner = pickPersonalized('dinner', dinnerBudget);

    // Snack: fill remaining gap
    const remainingCals = dailyCalTarget - breakfast.calories - lunch.calories - dinner.calories;
    const snack = pickPersonalized('snack', Math.max(100, remainingCals));

    const meals = [breakfast, lunch, dinner, snack];
    const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
    return {
      day,
      totalCalories,
      totalProtein: meals.reduce((s, m) => s + m.protein, 0),
      meals,
    };
  });

  // Build title with personalization context
  let titleExtra = '';
  if (mainGoal === 'fat_loss') titleExtra = ' · Defizit-Fokus';
  else if (mainGoal === 'muscle_gain') titleExtra = ' · High Protein';
  else if (mainGoal === 'energy') titleExtra = ' · Energie-Fokus';
  else if (mainGoal === 'structure') titleExtra = ' · Struktur-Plan';

  return { title: `Ernährungsplan · ${realism.calorieRange.min}–${realism.calorieRange.max} kcal${titleExtra}`, days, generatedAt: new Date().toISOString() };
}

export function swapMeal(plan: NutritionPlan, dayIdx: number, mealIdx: number): NutritionPlan {
  const meal = plan.days[dayIdx].meals[mealIdx];
  const category = mealIdx === 0 ? 'breakfast' : mealIdx === 1 ? 'lunch' : mealIdx === 2 ? 'dinner' : 'snack';
  const newMeal = pickRecipe(category, meal.id);
  const updated = { ...plan, days: plan.days.map((d, di) => di !== dayIdx ? d : {
    ...d,
    meals: d.meals.map((m, mi) => mi !== mealIdx ? m : newMeal),
    totalCalories: d.meals.reduce((s, m, mi) => s + (mi === mealIdx ? newMeal.calories : m.calories), 0),
    totalProtein: d.meals.reduce((s, m, mi) => s + (mi === mealIdx ? newMeal.protein : m.protein), 0),
  }) };
  return updated;
}

/* ═══ Training Plan ═══ */

export interface TrainingExercise {
  name: string;
  sets: number;
  reps: string;
  formCue: string;
}

export interface TrainingDay {
  day: string;
  isTraining: boolean;
  sessionType: string;
  duration: number;
  exercises: TrainingExercise[];
  movementSuggestion?: string;
}

export interface TrainingPlan {
  title: string;
  days: TrainingDay[];
  generatedAt: string;
}

/* ═══ Exercise Banks by Location ═══ */

const GYM_EXERCISES: Record<string, TrainingExercise[]> = {
  upper: [
    { name: 'Bankdrücken', sets: 4, reps: '8-10', formCue: 'Schulterblätter zusammen, kontrolliertes Absenken' },
    { name: 'Kurzhantel-Rudern', sets: 4, reps: '10-12', formCue: 'Ellbogen eng am Körper, Rücken gerade' },
    { name: 'Schulterdrücken', sets: 3, reps: '10-12', formCue: 'Keine Überstreckung im unteren Rücken' },
    { name: 'Bizeps-Curls', sets: 3, reps: '12-15', formCue: 'Langsame Negativphase, kein Schwung' },
    { name: 'Trizeps-Dips', sets: 3, reps: '10-12', formCue: 'Kontrollierte Bewegung, 90° Beugung' },
  ],
  lower: [
    { name: 'Kniebeugen', sets: 4, reps: '8-10', formCue: 'Knie über Zehen, Brust raus, tief gehen' },
    { name: 'Rumänisches Kreuzheben', sets: 4, reps: '10-12', formCue: 'Hüfte nach hinten, Stange nah am Körper' },
    { name: 'Ausfallschritte', sets: 3, reps: '12 pro Seite', formCue: 'Oberkörper aufrecht, großer Schritt' },
    { name: 'Beinpresse', sets: 3, reps: '12-15', formCue: 'Füße schulterbreit, Knie nicht über Zehen' },
    { name: 'Wadenheben', sets: 3, reps: '15-20', formCue: 'Volle Bewegungsamplitude, Pause oben' },
  ],
  hiit: [
    { name: 'Rudergerät Intervall', sets: 4, reps: '500m Sprint', formCue: 'Voller Einsatz, 1 Min Pause dazwischen' },
    { name: 'Kettlebell Swings', sets: 4, reps: '15', formCue: 'Kraft aus der Hüfte, Arme passiv' },
    { name: 'Box Jumps', sets: 3, reps: '10', formCue: 'Weiche Landung, Knie leicht gebeugt' },
    { name: 'Battle Ropes', sets: 4, reps: '30 Sek', formCue: 'Aus der Schulter, Rumpf stabil' },
  ],
  fullbody: [
    { name: 'Kreuzheben', sets: 4, reps: '6-8', formCue: 'Rücken gerade, Hüfte und Knie gleichzeitig strecken' },
    { name: 'Klimmzüge', sets: 3, reps: '8-10', formCue: 'Volle Streckung unten, Kinn über Stange' },
    { name: 'Kniebeugen', sets: 3, reps: '10-12', formCue: 'Tief gehen, Brust raus' },
    { name: 'Schulterdrücken', sets: 3, reps: '10-12', formCue: 'Kontrolliert, kein Schwung' },
    { name: 'Plank', sets: 3, reps: '45 Sek', formCue: 'Körper in einer Linie, Bauch aktiv' },
  ],
  mobility: [
    { name: 'Hip 90/90 Stretch', sets: 3, reps: '30 Sek/Seite', formCue: 'Aufrechter Oberkörper, sanfter Druck' },
    { name: 'Cat-Cow', sets: 3, reps: '10', formCue: 'Langsam, bewusst atmen' },
    { name: 'World\'s Greatest Stretch', sets: 3, reps: '5 pro Seite', formCue: 'Jede Position 3 Sek halten' },
    { name: 'Foam Rolling Beine', sets: 2, reps: '60 Sek/Muskel', formCue: 'Langsam rollen, bei Triggerpunkten verweilen' },
    { name: 'Schulter-Dislocates', sets: 3, reps: '10', formCue: 'Mit Theraband oder Stock, kontrolliert' },
  ],
};

const HOME_EXERCISES: Record<string, TrainingExercise[]> = {
  upper: [
    { name: 'Liegestütze', sets: 4, reps: '12-15', formCue: 'Körper in einer Linie, Brust fast am Boden' },
    { name: 'Pike Push-ups', sets: 3, reps: '10-12', formCue: 'Hüfte hoch, Kopf zwischen den Armen' },
    { name: 'Trizeps-Dips (Stuhl)', sets: 3, reps: '12-15', formCue: 'Ellbogen nach hinten, nicht seitlich' },
    { name: 'Plank Shoulder Taps', sets: 3, reps: '20', formCue: 'Hüfte stabil, kein Wackeln' },
    { name: 'Superman Holds', sets: 3, reps: '30 Sek', formCue: 'Arme und Beine gleichzeitig heben' },
  ],
  lower: [
    { name: 'Goblet Squats', sets: 4, reps: '15', formCue: 'Gewicht vor der Brust, tief gehen' },
    { name: 'Bulgarian Split Squats', sets: 3, reps: '12 pro Seite', formCue: 'Hinterer Fuß erhöht, Knie über Zehen' },
    { name: 'Glute Bridges', sets: 3, reps: '15', formCue: 'Gesäß fest anspannen, Hüfte ganz strecken' },
    { name: 'Step-Ups', sets: 3, reps: '12 pro Seite', formCue: 'Stuhl oder stabiler Stufe, kontrolliert' },
    { name: 'Wadenheben einbeinig', sets: 3, reps: '15 pro Seite', formCue: 'Voller Range of Motion' },
  ],
  hiit: [
    { name: 'Burpees', sets: 4, reps: '30 Sek', formCue: 'Explosive Bewegung, kontrollierte Landung' },
    { name: 'Mountain Climbers', sets: 4, reps: '30 Sek', formCue: 'Hüfte stabil, schnelle Beinwechsel' },
    { name: 'Jump Squats', sets: 4, reps: '12', formCue: 'Tief gehen, explosiv springen' },
    { name: 'High Knees', sets: 3, reps: '30 Sek', formCue: 'Knie hoch, schnelle Frequenz' },
  ],
  fullbody: [
    { name: 'Liegestütze', sets: 3, reps: '12-15', formCue: 'Körper in einer Linie' },
    { name: 'Kniebeugen', sets: 4, reps: '15-20', formCue: 'Tief gehen, Brust raus' },
    { name: 'Plank', sets: 3, reps: '45 Sek', formCue: 'Körper in einer Linie, Bauch aktiv' },
    { name: 'Ausfallschritte', sets: 3, reps: '12 pro Seite', formCue: 'Oberkörper aufrecht' },
    { name: 'Superman Holds', sets: 3, reps: '30 Sek', formCue: 'Langsam und kontrolliert' },
  ],
  mobility: [
    { name: 'Hip 90/90 Stretch', sets: 3, reps: '30 Sek/Seite', formCue: 'Aufrechter Oberkörper' },
    { name: 'Cat-Cow', sets: 3, reps: '10', formCue: 'Langsam, bewusst atmen' },
    { name: 'Deep Squat Hold', sets: 3, reps: '30 Sek', formCue: 'Fersen am Boden, Brust raus' },
    { name: 'Pigeon Stretch', sets: 2, reps: '45 Sek/Seite', formCue: 'Sanft in die Dehnung sinken' },
    { name: 'Thoracic Rotation', sets: 3, reps: '8 pro Seite', formCue: 'Langsam drehen, Blick folgt der Hand' },
  ],
};

const OUTDOOR_EXERCISES: Record<string, TrainingExercise[]> = {
  upper: [
    { name: 'Liegestütze (Parkbank)', sets: 4, reps: '15', formCue: 'Hände auf der Bank, Körper gerade' },
    { name: 'Dips (Parkbank)', sets: 3, reps: '12', formCue: 'Ellbogen nach hinten, kontrolliert' },
    { name: 'Inverted Rows (Stange)', sets: 3, reps: '10', formCue: 'Brust zur Stange ziehen' },
    { name: 'Bear Crawl', sets: 3, reps: '20m', formCue: 'Knie knapp über dem Boden' },
  ],
  lower: [
    { name: 'Box Jumps (Parkbank)', sets: 4, reps: '10', formCue: 'Weiche Landung, Knie leicht gebeugt' },
    { name: 'Sprint-Intervalle', sets: 6, reps: '50m Sprint', formCue: 'Voller Einsatz, 30 Sek Pause' },
    { name: 'Step-Ups (Parkbank)', sets: 3, reps: '12 pro Seite', formCue: 'Kontrolliert, voller Fußkontakt' },
    { name: 'Hill Sprints', sets: 4, reps: '30 Sek bergauf', formCue: 'Arme einsetzen, kurze Schritte' },
  ],
  hiit: [
    { name: 'Sprint-Intervalle', sets: 6, reps: '30 Sek Sprint', formCue: '30 Sek gehen, dann Sprint' },
    { name: 'Burpees', sets: 4, reps: '30 Sek', formCue: 'Explosive Bewegung' },
    { name: 'Bear Crawl', sets: 3, reps: '20m', formCue: 'Knie über dem Boden' },
    { name: 'Jumping Lunges', sets: 4, reps: '20', formCue: 'Wechselsprünge, Knie 90°' },
  ],
  fullbody: [
    { name: 'Liegestütze', sets: 3, reps: '15', formCue: 'Körper in einer Linie' },
    { name: 'Kniebeugen', sets: 4, reps: '20', formCue: 'Tief und kontrolliert' },
    { name: 'Klimmzüge (Stange)', sets: 3, reps: '8', formCue: 'Volle Streckung unten' },
    { name: 'Sprint-Intervalle', sets: 4, reps: '30 Sek', formCue: 'Voller Einsatz' },
    { name: 'Plank', sets: 3, reps: '45 Sek', formCue: 'Bauch aktiv' },
  ],
  mobility: [
    { name: 'Walking Lunges', sets: 3, reps: '20m', formCue: 'Große Schritte, Oberkörper aufrecht' },
    { name: 'Inchworm', sets: 3, reps: '8', formCue: 'Beine möglichst gestreckt' },
    { name: 'Deep Squat Hold', sets: 3, reps: '30 Sek', formCue: 'Fersen am Boden' },
    { name: 'Hip Circles', sets: 2, reps: '10 pro Richtung', formCue: 'Große, kontrollierte Kreise' },
  ],
};

/* ═══ Focus-based Session Type Selection ═══ */

type SessionTemplate = { type: string; key: string; duration: number };

function getSessionSequence(focus: string, numDays: number, sessionMinutes: number): SessionTemplate[] {
  const dur = sessionMinutes || 45;

  const FOCUS_SESSIONS: Record<string, SessionTemplate[]> = {
    muscle_gain: [
      { type: 'Oberkörper Hypertrophie', key: 'upper', duration: dur },
      { type: 'Unterkörper Hypertrophie', key: 'lower', duration: dur },
      { type: 'Ganzkörper Kraft', key: 'fullbody', duration: dur },
      { type: 'Oberkörper Kraft', key: 'upper', duration: dur },
      { type: 'Unterkörper Kraft', key: 'lower', duration: dur },
    ],
    fat_loss: [
      { type: 'HIIT Fettabbau', key: 'hiit', duration: Math.min(dur, 35) },
      { type: 'Ganzkörper Kraft', key: 'fullbody', duration: dur },
      { type: 'HIIT Cardio', key: 'hiit', duration: Math.min(dur, 35) },
      { type: 'Unterkörper Kraft', key: 'lower', duration: dur },
      { type: 'Ganzkörper Kraft', key: 'fullbody', duration: dur },
    ],
    strength: [
      { type: 'Oberkörper Kraft', key: 'upper', duration: dur },
      { type: 'Unterkörper Kraft', key: 'lower', duration: dur },
      { type: 'Ganzkörper Kraft', key: 'fullbody', duration: dur },
      { type: 'Oberkörper Kraft', key: 'upper', duration: dur },
      { type: 'Unterkörper Kraft', key: 'lower', duration: dur },
    ],
    longevity: [
      { type: 'Ganzkörper Kraft', key: 'fullbody', duration: dur },
      { type: 'Mobilität & Stretching', key: 'mobility', duration: Math.min(dur, 30) },
      { type: 'Ausdauer-Cardio', key: 'hiit', duration: dur },
      { type: 'Ganzkörper Kraft', key: 'fullbody', duration: dur },
      { type: 'Mobilität & Stretching', key: 'mobility', duration: Math.min(dur, 30) },
    ],
    mobility: [
      { type: 'Mobilität & Stretching', key: 'mobility', duration: Math.min(dur, 30) },
      { type: 'Ganzkörper leicht', key: 'fullbody', duration: dur },
      { type: 'Mobilität & Stretching', key: 'mobility', duration: Math.min(dur, 30) },
      { type: 'Unterkörper leicht', key: 'lower', duration: dur },
      { type: 'Mobilität & Stretching', key: 'mobility', duration: Math.min(dur, 30) },
    ],
    fitness: [
      { type: 'Oberkörper Kraft', key: 'upper', duration: dur },
      { type: 'HIIT Cardio', key: 'hiit', duration: Math.min(dur, 35) },
      { type: 'Unterkörper Kraft', key: 'lower', duration: dur },
      { type: 'Ganzkörper Kraft', key: 'fullbody', duration: dur },
      { type: 'HIIT Cardio', key: 'hiit', duration: Math.min(dur, 35) },
    ],
  };

  const sessions = FOCUS_SESSIONS[focus] || FOCUS_SESSIONS.fitness;
  return sessions.slice(0, numDays);
}

const REST_SUGGESTIONS = [
  '20 Min Spaziergang an der frischen Luft',
  'Stretching & Mobility (15 Min)',
  'Leichte Yoga-Session (20 Min)',
  'Spaziergang + bewusstes Atmen',
];

export function generateTrainingPlan(answers: Record<string, any>, _goal: ExtendedGoal): TrainingPlan {
  const trainingDays = Number(answers.trainingDays) || 3;
  const sessionMinutes = Number(answers.sessionMinutes) || 45;
  const location = answers.trainingLocation || answers.location || 'gym';
  const focus = answers.mainFocus || 'fitness';

  // Pick exercise bank based on location
  const exerciseBank = location === 'home' ? HOME_EXERCISES
    : location === 'outdoor' ? OUTDOOR_EXERCISES
    : GYM_EXERCISES;

  const trainingDayIndices: number[] = [];
  if (trainingDays <= 3) {
    trainingDayIndices.push(0, 2, 4);
  } else if (trainingDays === 4) {
    trainingDayIndices.push(0, 1, 3, 4);
  } else {
    for (let i = 0; i < Math.min(trainingDays, 6); i++) trainingDayIndices.push(i);
  }

  // Get focus-specific session sequence
  const sessions = getSessionSequence(focus, trainingDays, sessionMinutes);

  let sessionIdx = 0;
  const days: TrainingDay[] = DAYS.map((day, i) => {
    const isTraining = trainingDayIndices.includes(i);
    if (isTraining && sessionIdx < sessions.length) {
      const session = sessions[sessionIdx];
      const exercises = exerciseBank[session.key] || exerciseBank.fullbody;
      sessionIdx++;
      return {
        day,
        isTraining: true,
        sessionType: session.type,
        duration: session.duration,
        exercises,
      };
    }
    return {
      day,
      isTraining: false,
      sessionType: 'Active Recovery',
      duration: 20,
      exercises: [],
      movementSuggestion: REST_SUGGESTIONS[i % REST_SUGGESTIONS.length],
    };
  });

  const locationLabel = location === 'home' ? 'Zuhause' : location === 'outdoor' ? 'Outdoor' : location === 'mixed' ? 'Mix' : 'Gym';
  return { title: `${locationLabel}-Plan · ${trainingDays}x ${sessionMinutes} Min`, days, generatedAt: new Date().toISOString() };
}

/* ═══ Recovery Tips ═══ */

export interface TipCard {
  id: string;
  title: string;
  text: string;
  category: 'Sleep' | 'Recovery' | 'Rest Day';
}

export interface RecoveryPlan {
  focusAction: string;
  tips: TipCard[];
  generatedAt: string;
}

const RECOVERY_TIPS: TipCard[] = [
  { id: 'r1', title: 'Abend Wind-Down', text: 'Dein Schlaf-Score zeigt: Recovery ist dein größter Hebel. Setze dir einen festen Wind-Down-Alarm um 22 Uhr — schon diese eine Änderung kann deine Energie spürbar verbessern.', category: 'Sleep' },
  { id: 'r2', title: 'Bildschirm-Pause', text: 'Blaues Licht nach 21 Uhr stört deine Melatonin-Produktion. Leg dein Handy 60 Minuten vor dem Schlafen weg — dein Nervensystem wird es dir danken.', category: 'Sleep' },
  { id: 'r3', title: 'Kälte-Protokoll', text: 'Eine 30-sekündige kalte Dusche am Morgen aktiviert dein Nervensystem und verbessert die Durchblutung. Starte sanft — auch 15 Sekunden sind ein guter Anfang.', category: 'Recovery' },
  { id: 'r4', title: 'Schlafkonsistenz', text: 'Dein Körper liebt Rhythmus. Geh diese Woche jeden Tag zur gleichen Zeit ins Bett — ±30 Minuten. Das allein kann deinen Schlaf dramatisch verbessern.', category: 'Sleep' },
  { id: 'r5', title: 'Aktive Recovery', text: 'Rest Days sind keine Faulheit — sie sind Trainingstage für dein Nervensystem. 20 Minuten Spaziergang + 10 Minuten Stretching reichen aus.', category: 'Rest Day' },
  { id: 'r6', title: 'Magnesium-Timing', text: 'Magnesium vor dem Schlafengehen kann deine Schlafqualität verbessern. 200-400mg Magnesium-Glycinat etwa 30 Minuten vor dem Bett.', category: 'Sleep' },
  { id: 'r7', title: 'Nachmittags-Pause', text: 'Ein 10-minütiger Power Nap zwischen 13 und 15 Uhr kann deine kognitive Leistung für den Rest des Tages deutlich verbessern.', category: 'Recovery' },
  { id: 'r8', title: 'Foam Rolling', text: 'Selbstmassage mit einer Faszienrolle nach dem Training reduziert Muskelspannung und beschleunigt die Regeneration. 5 Minuten reichen.', category: 'Rest Day' },
];

export function generateRecoveryTips(assessment: FullAssessment, answers: Record<string, any>): RecoveryPlan {
  const sleepPillar = assessment.pillars.find(p => p.key === 'regeneration');
  const sleepScore = sleepPillar?.score ?? 50;

  // Use personalization answers if available
  const mainProblem = answers.mainProblem;
  const mainCause = answers.mainCause;
  const routineTime = answers.routineTime;

  // Targeted focus action based on personalization
  let focusAction: string;
  if (mainProblem === 'falling_asleep' && mainCause === 'screen') {
    focusAction = 'Bildschirmzeit 60 Minuten vor dem Schlafen stoppen — dein Melatonin wird es dir danken.';
  } else if (mainProblem === 'falling_asleep' && mainCause === 'stress') {
    focusAction = '4-7-8 Atemtechnik vor dem Einschlafen: 4 Sek ein, 7 halten, 8 aus. Jeden Abend.';
  } else if (mainProblem === 'staying_asleep') {
    focusAction = 'Feste Schlafenszeit einführen und Temperatur im Schlafzimmer auf 18°C senken.';
  } else if (mainProblem === 'not_rested') {
    focusAction = 'Schlafkonsistenz ist dein Schlüssel — gleiche Uhrzeit, ±30 Min, jeden Tag.';
  } else if (mainProblem === 'energy_crash') {
    focusAction = '10-minütiger Power Nap zwischen 13–15 Uhr — besser als Kaffee für den Nachmittag.';
  } else if (sleepScore < 50) {
    focusAction = 'Bildschirmzeit 30 Minuten vor dem Schlafen reduzieren';
  } else {
    focusAction = 'Aktive Recovery an trainingsfreien Tagen priorisieren';
  }

  // Targeted tip selection based on personalization
  let selectedTips: TipCard[];
  if (mainProblem || mainCause) {
    // Prioritize relevant tips
    const sleepTips = RECOVERY_TIPS.filter(t => t.category === 'Sleep');
    const recoveryTips = RECOVERY_TIPS.filter(t => t.category === 'Recovery');
    const restTips = RECOVERY_TIPS.filter(t => t.category === 'Rest Day');

    if (mainProblem === 'falling_asleep' || mainProblem === 'staying_asleep') {
      selectedTips = [...sleepTips.sort(() => Math.random() - 0.5).slice(0, 4), ...recoveryTips.slice(0, 1)];
    } else if (mainProblem === 'energy_crash') {
      selectedTips = [...recoveryTips.sort(() => Math.random() - 0.5).slice(0, 3), ...sleepTips.slice(0, 2)];
    } else {
      selectedTips = [...sleepTips.slice(0, 2), ...recoveryTips.slice(0, 2), ...restTips.slice(0, 1)];
    }
  } else {
    selectedTips = [...RECOVERY_TIPS].sort(() => Math.random() - 0.5).slice(0, 5);
  }

  return { focusAction, tips: selectedTips.slice(0, 5), generatedAt: new Date().toISOString() };
}

export function getMoreRecoveryTips(existing: TipCard[]): TipCard[] {
  const existingIds = new Set(existing.map(t => t.id));
  const remaining = RECOVERY_TIPS.filter(t => !existingIds.has(t.id));
  if (remaining.length === 0) return [...RECOVERY_TIPS].sort(() => Math.random() - 0.5).slice(0, 3);
  return remaining.slice(0, 3);
}

/* ═══ Mental Tips ═══ */

export interface MentalTip {
  id: string;
  title: string;
  text: string;
  category: 'Stress' | 'Mindset' | 'Routine' | 'Emotional Eating';
}

export interface MentalPlan {
  focusAction: string;
  tips: MentalTip[];
  cravingCard?: { title: string; text: string };
  generatedAt: string;
}

const MENTAL_TIPS: MentalTip[] = [
  { id: 'm1', title: 'Atem-Anker', text: 'Nimm dir vor dem Abendessen 2 Minuten für bewusstes Atmen: 4 Sekunden ein, 7 halten, 8 aus. Das beruhigt dein Nervensystem und reduziert Impulsentscheidungen.', category: 'Stress' },
  { id: 'm2', title: 'Morgen-Intention', text: 'Starte jeden Morgen mit einer einzigen Intention: "Heute fokussiere ich mich auf..." — das gibt deinem Tag Richtung und reduziert Entscheidungsmüdigkeit.', category: 'Mindset' },
  { id: 'm3', title: 'Pause-Ritual', text: 'Baue 3 bewusste 5-Minuten-Pausen in deinen Tag ein. Keine Reize, kein Bildschirm — einfach kurz sein. Dein Stresslevel wird es dir danken.', category: 'Routine' },
  { id: 'm4', title: 'Emotionales Essen erkennen', text: 'Wenn der Griff zum Snack kommt: Frag dich "Bin ich hungrig oder brauche ich etwas anderes?" Oft ist es Langeweile, Stress oder Müdigkeit.', category: 'Emotional Eating' },
  { id: 'm5', title: 'Abend-Reflexion', text: 'Schreib abends 3 Dinge auf, die heute gut liefen. Das trainiert dein Gehirn, Positives zu bemerken — und das reduziert Stress nachweislich.', category: 'Mindset' },
  { id: 'm6', title: 'Digital Detox Fenster', text: 'Plane täglich ein 30-minütiges Fenster ohne Handy. Dein Nervensystem braucht echte Stille — nicht nur Bildschirm-Pause.', category: 'Routine' },
  { id: 'm7', title: 'Stress-Mapping', text: 'Schreibe deine 3 größten Stressoren auf. Dann markiere: Kann ich es ändern? Wenn ja → Plan machen. Wenn nein → bewusst loslassen üben.', category: 'Stress' },
  { id: 'm8', title: 'Craving Surf', text: 'Heißhunger kommt in Wellen und geht nach 8-12 Minuten. Beobachte ihn wie eine Welle — ohne zu reagieren. Meistens vergeht er von allein.', category: 'Emotional Eating' },
];

export function generateMentalTips(assessment: FullAssessment, answers: Record<string, any>): MentalPlan {
  const mentalPillar = assessment.pillars.find(p => p.key === 'mental');
  const mentalScore = mentalPillar?.score ?? 50;
  const stressLevel = Number(answers.stressLevel) || 3;
  const hasCravings = answers.eveningCravings === true || answers.copingMechanism === 'eating';

  // Use personalization answers if available
  const mainProblem = answers.mainProblem;
  const stressTiming = answers.stressTiming;
  const desiredEffect = answers.desiredEffect;

  // Build targeted focus action
  let focusAction: string;
  if (mainProblem === 'rumination') {
    focusAction = stressTiming === 'evening'
      ? 'Abends grübelst du am meisten — eine 5-Min Journaling-Routine vor dem Schlafengehen leert deinen Kopf.'
      : 'Gegen Grübeln hilft eine klare Unterbrechung — 2-Minuten Atemübung, sobald das Karussell startet.';
  } else if (mainProblem === 'overwhelm') {
    focusAction = 'Bei Overwhelm: Schreib die 3 wichtigsten Dinge auf. Nur 3. Der Rest wartet. Dann starte mit Nr. 1.';
  } else if (mainProblem === 'no_focus') {
    focusAction = stressTiming === 'daytime'
      ? 'Dein Fokus bricht während der Arbeit ein — probiere 25-Min Fokusblöcke mit 5-Min Pausen (Pomodoro).'
      : 'Fokus braucht klare Anfänge. Starte jeden Tag mit einer einzigen Priorität, bevor du dein Handy checkst.';
  } else if (mainProblem === 'no_breaks') {
    focusAction = 'Ohne Pausen brennst du aus. Setze dir 3 Alarm-Erinnerungen für bewusste 5-Minuten-Pausen.';
  } else if (mainProblem === 'emotional') {
    focusAction = 'Emotionale Reaktivität reduzierst du durch einen Puffer: Bevor du reagierst, nimm 3 tiefe Atemzüge.';
  } else if (hasCravings) {
    focusAction = 'Dein Heißhunger ist stressbedingt — fokussiere dich diese Woche auf eine 5-Minuten Atempause vor dem Abendessen';
  } else if (stressLevel >= 4) {
    focusAction = 'Dein Stresslevel ist hoch — baue diese Woche einen festen Ruhepunkt in deinen Nachmittag ein';
  } else {
    focusAction = 'Stärke deine mentale Basis: eine feste Morgenroutine von nur 5 Minuten';
  }

  // Targeted tip selection
  let tips: MentalTip[];
  if (mainProblem) {
    const stressTips = MENTAL_TIPS.filter(t => t.category === 'Stress');
    const mindsetTips = MENTAL_TIPS.filter(t => t.category === 'Mindset');
    const routineTips = MENTAL_TIPS.filter(t => t.category === 'Routine');
    const emoTips = MENTAL_TIPS.filter(t => t.category === 'Emotional Eating');

    if (mainProblem === 'rumination' || mainProblem === 'emotional') {
      tips = [...stressTips.slice(0, 2), ...mindsetTips.slice(0, 2), ...emoTips.slice(0, 1)];
    } else if (mainProblem === 'overwhelm') {
      tips = [...stressTips.slice(0, 2), ...routineTips.slice(0, 2), ...mindsetTips.slice(0, 1)];
    } else if (mainProblem === 'no_focus' || mainProblem === 'no_breaks') {
      tips = [...routineTips.slice(0, 2), ...mindsetTips.slice(0, 2), ...stressTips.slice(0, 1)];
    } else {
      tips = [...MENTAL_TIPS].sort(() => Math.random() - 0.5).slice(0, 5);
    }
  } else {
    tips = [...MENTAL_TIPS].sort(() => Math.random() - 0.5).slice(0, 5);
  }

  const cravingCard = (hasCravings || mainProblem === 'emotional') ? {
    title: 'Craving-Moment',
    text: 'Trink ein Glas Wasser, warte 10 Minuten, dann entscheide — die meisten Cravings vergehen nach 8 Minuten. Du bist stärker als der Impuls.',
  } : undefined;

  return { focusAction, tips: tips.slice(0, 5), cravingCard, generatedAt: new Date().toISOString() };
}

export function getMoreMentalTips(existing: MentalTip[]): MentalTip[] {
  const existingIds = new Set(existing.map(t => t.id));
  const remaining = MENTAL_TIPS.filter(t => !existingIds.has(t.id));
  if (remaining.length === 0) return [...MENTAL_TIPS].sort(() => Math.random() - 0.5).slice(0, 3);
  return remaining.slice(0, 3);
}

/* ═══ Recipe System ═══ */

export interface Recipe {
  id: string;
  name: string;
  prepTime: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: { name: string; amount: string }[];
  steps: string[];
  longevityBenefit: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  isVegetarian?: boolean;
  isMeat?: boolean;
  tags?: string[];
}

export interface NutritionPreferences {
  goalType?: string;
  isVegetarian?: boolean;
  preferHighProtein?: boolean;
  calorieTarget?: number;
  intolerances?: string[]; // 'gluten', 'lactose', 'nuts', 'eggs'
  activityLevel?: string;
  mealPrefs?: import('@/lib/mealPreferences').MealPreferenceProfile;
}

export const RECIPE_TEMPLATES: Recipe[] = [
  // Breakfast
  { id: 'r1', name: 'Protein-Oats mit Beeren', prepTime: 10, calories: 420, protein: 32, carbs: 48, fat: 12, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Haferflocken', amount: '80g' }, { name: 'Whey Protein', amount: '30g' }, { name: 'Blaubeeren', amount: '100g' }, { name: 'Mandeln', amount: '15g' }],
    steps: ['Haferflocken mit 200ml Wasser oder Milch aufkochen.', 'Protein-Pulver einrühren.', 'Mit Beeren und Mandeln toppen.'],
    longevityBenefit: 'Blaubeeren sind reich an Anthocyanen — starke Antioxidantien, die Entzündungen reduzieren und die kognitive Funktion unterstützen.' },
  { id: 'r2', name: 'Rührei mit Avocado-Toast', prepTime: 12, calories: 450, protein: 28, carbs: 30, fat: 24, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Eier', amount: '3 Stück' }, { name: 'Vollkornbrot', amount: '2 Scheiben' }, { name: 'Avocado', amount: '½' }, { name: 'Tomate', amount: '1' }],
    steps: ['Eier verquirlen und bei mittlerer Hitze rühren.', 'Brot toasten, Avocado zerdrücken und aufstreichen.', 'Rührei auf den Toast geben, Tomate dazu.'],
    longevityBenefit: 'Eier liefern Cholin — essentiell für Gehirngesundheit. Avocado bietet herzgesunde Fette.' },
  { id: 'r3', name: 'Skyr-Bowl mit Walnüssen', prepTime: 5, calories: 380, protein: 35, carbs: 28, fat: 14, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Skyr', amount: '250g' }, { name: 'Walnüsse', amount: '20g' }, { name: 'Honig', amount: '1 TL' }, { name: 'Leinsamen', amount: '10g' }],
    steps: ['Skyr in eine Schüssel geben.', 'Walnüsse grob hacken und mit Leinsamen drüberstreuen.', 'Mit Honig beträufeln.'],
    longevityBenefit: 'Walnüsse sind eine der besten pflanzlichen Omega-3-Quellen. Leinsamen unterstützen die Darmgesundheit.' },
  { id: 'r4', name: 'Spinat-Omelett', prepTime: 10, calories: 350, protein: 30, carbs: 8, fat: 22, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Eier', amount: '3 Stück' }, { name: 'Spinat', amount: '80g' }, { name: 'Feta', amount: '30g' }, { name: 'Olivenöl', amount: '1 TL' }],
    steps: ['Spinat in Olivenöl kurz anbraten.', 'Eier verquirlen und über den Spinat gießen.', 'Feta zerbröseln und drüberstreuen, zuklappen.'],
    longevityBenefit: 'Spinat liefert Folsäure, Eisen und Nitrate — verbessert die Durchblutung und senkt den Blutdruck.' },
  { id: 'r5', name: 'Chia-Pudding mit Mango', prepTime: 5, calories: 340, protein: 18, carbs: 38, fat: 14, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Chia-Samen', amount: '30g' }, { name: 'Kokosmilch', amount: '200ml' }, { name: 'Mango', amount: '100g' }, { name: 'Proteinpulver', amount: '15g' }],
    steps: ['Chia mit Kokosmilch und Protein verrühren.', 'Über Nacht im Kühlschrank quellen lassen.', 'Morgens mit Mango-Stücken toppen.'],
    longevityBenefit: 'Chia-Samen liefern Omega-3-Fettsäuren und Ballaststoffe — unterstützen Herzgesundheit und Verdauung.' },
  // Lunch
  { id: 'r6', name: 'Hähnchen-Gemüse-Bowl', prepTime: 25, calories: 550, protein: 42, carbs: 52, fat: 14, mealType: 'lunch', isMeat: true,
    ingredients: [{ name: 'Hähnchenbrust', amount: '150g' }, { name: 'Reis', amount: '80g' }, { name: 'Brokkoli', amount: '100g' }, { name: 'Süßkartoffel', amount: '100g' }],
    steps: ['Reis kochen. Süßkartoffel in Würfel schneiden und im Ofen bei 200°C backen.', 'Hähnchenbrust in Streifen schneiden und anbraten.', 'Brokkoli dünsten. Alles in einer Bowl anrichten.'],
    longevityBenefit: 'Brokkoli enthält Sulforaphan — aktiviert körpereigene Entgiftungsmechanismen und wirkt anti-karzinogen.' },
  { id: 'r7', name: 'Lachs mit Quinoa-Salat', prepTime: 20, calories: 520, protein: 38, carbs: 40, fat: 20, mealType: 'lunch', isMeat: true,
    ingredients: [{ name: 'Lachs-Filet', amount: '150g' }, { name: 'Quinoa', amount: '70g' }, { name: 'Gurke', amount: '100g' }, { name: 'Feta', amount: '30g' }],
    steps: ['Quinoa nach Packungsanweisung kochen.', 'Lachs bei mittlerer Hitze braten (4 Min pro Seite).', 'Gurke würfeln, mit Quinoa und Feta mischen.'],
    longevityBenefit: 'Lachs ist eine der besten Omega-3-Quellen — reduziert systemische Entzündungen und unterstützt Gehirnfunktion.' },
  { id: 'r8', name: 'Linsen-Curry mit Reis', prepTime: 25, calories: 480, protein: 28, carbs: 62, fat: 10, mealType: 'lunch', isVegetarian: true,
    ingredients: [{ name: 'Rote Linsen', amount: '100g' }, { name: 'Kokosmilch', amount: '100ml' }, { name: 'Reis', amount: '70g' }, { name: 'Spinat', amount: '60g' }],
    steps: ['Linsen mit Kokosmilch und Currypaste kochen (15 Min).', 'Reis separat kochen.', 'Spinat unterheben, mit Reis servieren.'],
    longevityBenefit: 'Linsen sind Protein-Kraftpakete mit niedrigem glykämischen Index — stabilisieren den Blutzucker langfristig.' },
  { id: 'r9', name: 'Thunfisch-Salat-Wrap', prepTime: 10, calories: 400, protein: 36, carbs: 30, fat: 16, mealType: 'lunch', isMeat: true,
    ingredients: [{ name: 'Thunfisch (Dose)', amount: '150g' }, { name: 'Vollkorn-Tortilla', amount: '1' }, { name: 'Rucola', amount: '30g' }, { name: 'Avocado', amount: '½' }],
    steps: ['Thunfisch abtropfen und mit zerdrückter Avocado mischen.', 'Auf Tortilla verteilen, Rucola dazu.', 'Einrollen und diagonal halbieren.'],
    longevityBenefit: 'Thunfisch liefert Selen — ein Mineral, das oxidativen Stress reduziert und die Schilddrüse unterstützt.' },
  { id: 'r10', name: 'Puten-Salat mit Kichererbsen', prepTime: 15, calories: 460, protein: 40, carbs: 35, fat: 16, mealType: 'lunch', isMeat: true,
    ingredients: [{ name: 'Putenbrust', amount: '150g' }, { name: 'Kichererbsen', amount: '100g' }, { name: 'Paprika', amount: '1' }, { name: 'Olivenöl', amount: '1 EL' }],
    steps: ['Putenbrust braten und in Streifen schneiden.', 'Kichererbsen abspülen, Paprika würfeln.', 'Alles mischen, mit Olivenöl und Zitrone anmachen.'],
    longevityBenefit: 'Kichererbsen liefern Ballaststoffe und pflanzliches Protein — senken Cholesterin und unterstützen das Mikrobiom.' },
  // Dinner
  { id: 'r11', name: 'Lachs mit gedünstetem Gemüse', prepTime: 20, calories: 480, protein: 36, carbs: 18, fat: 28, mealType: 'dinner', isMeat: true,
    ingredients: [{ name: 'Lachs-Filet', amount: '150g' }, { name: 'Zucchini', amount: '100g' }, { name: 'Paprika', amount: '1' }, { name: 'Olivenöl', amount: '1 EL' }],
    steps: ['Lachs würzen und in Olivenöl braten.', 'Gemüse in Streifen schneiden und dünsten.', 'Zusammen anrichten, mit Zitrone beträufeln.'],
    longevityBenefit: 'Leichtes Abendessen unterstützt besseren Schlaf. Lachs liefert auch Vitamin D — wichtig für Immunsystem und Knochen.' },
  { id: 'r12', name: 'Puten-Steak mit Ofengemüse', prepTime: 30, calories: 440, protein: 40, carbs: 28, fat: 16, mealType: 'dinner', isMeat: true,
    ingredients: [{ name: 'Putensteak', amount: '160g' }, { name: 'Süßkartoffel', amount: '100g' }, { name: 'Brokkoli', amount: '100g' }, { name: 'Rosmarin', amount: '1 Zweig' }],
    steps: ['Süßkartoffel und Brokkoli mit Rosmarin bei 200°C 20 Min backen.', 'Putensteak in der Pfanne braten.', 'Zusammen servieren.'],
    longevityBenefit: 'Süßkartoffel ist reich an Beta-Carotin — schützt Haut und Augen und wirkt antioxidativ.' },
  { id: 'r13', name: 'Griechischer Salat mit Hähnchen', prepTime: 15, calories: 420, protein: 34, carbs: 12, fat: 26, mealType: 'dinner', isMeat: true,
    ingredients: [{ name: 'Hähnchenbrust', amount: '130g' }, { name: 'Feta', amount: '50g' }, { name: 'Oliven', amount: '30g' }, { name: 'Gurke & Tomate', amount: 'je 100g' }],
    steps: ['Hähnchen braten und in Streifen schneiden.', 'Gemüse würfeln, mit Feta und Oliven mischen.', 'Mit Olivenöl und Oregano anmachen.'],
    longevityBenefit: 'Die mediterrane Ernährung ist die am besten erforschte Longevity-Diät. Olivenöl und Gemüse senken Entzündungsmarker.' },
  { id: 'r14', name: 'Asiatische Garnelen-Pfanne', prepTime: 15, calories: 380, protein: 32, carbs: 20, fat: 18, mealType: 'dinner', isMeat: true,
    ingredients: [{ name: 'Garnelen', amount: '150g' }, { name: 'Pak Choi', amount: '100g' }, { name: 'Ingwer', amount: '10g' }, { name: 'Sesam', amount: '1 EL' }],
    steps: ['Ingwer fein reiben, Garnelen anbraten.', 'Pak Choi hinzufügen und 3 Min mitgaren.', 'Mit Sojasauce und Sesam abschmecken.'],
    longevityBenefit: 'Ingwer ist ein starkes Anti-Entzündungsmittel. Garnelen liefern Astaxanthin — eines der stärksten natürlichen Antioxidantien.' },
  { id: 'r15', name: 'Zucchini-Nudeln mit Pesto & Hähnchen', prepTime: 15, calories: 400, protein: 35, carbs: 12, fat: 24, mealType: 'dinner', isMeat: true,
    ingredients: [{ name: 'Zucchini', amount: '200g' }, { name: 'Hähnchenbrust', amount: '130g' }, { name: 'Pesto', amount: '2 EL' }, { name: 'Parmesan', amount: '15g' }],
    steps: ['Zucchini mit Spiralschneider zu Nudeln formen.', 'Hähnchen braten und in Streifen schneiden.', 'Zoodles kurz anbraten, mit Pesto und Hähnchen mischen.'],
    longevityBenefit: 'Zucchini statt Pasta reduziert die Kohlenhydratlast drastisch — hält den Blutzucker stabil und fördert Fettverbrennung.' },
  // Snacks
  { id: 'r16', name: 'Protein-Shake mit Banane', prepTime: 3, calories: 220, protein: 25, carbs: 22, fat: 4, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Whey Protein', amount: '30g' }, { name: 'Banane', amount: '1' }, { name: 'Mandelmilch', amount: '200ml' }],
    steps: ['Alle Zutaten in einen Mixer geben.', 'Mixen bis cremig.', 'Sofort trinken.'],
    longevityBenefit: 'Schnelle Protein-Versorgung nach dem Training beschleunigt die Muskelregeneration.' },
  { id: 'r17', name: 'Griechischer Joghurt mit Nüssen', prepTime: 3, calories: 200, protein: 18, carbs: 12, fat: 10, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Griech. Joghurt', amount: '150g' }, { name: 'Walnüsse', amount: '15g' }, { name: 'Honig', amount: '1 TL' }],
    steps: ['Joghurt in eine Schale geben.', 'Walnüsse grob hacken und drüberstreuen.', 'Mit Honig beträufeln.'],
    longevityBenefit: 'Griechischer Joghurt liefert Probiotika — unterstützt die Darmgesundheit, die 70% deines Immunsystems beherbergt.' },
  { id: 'r18', name: 'Cottage Cheese mit Gurke', prepTime: 3, calories: 160, protein: 20, carbs: 6, fat: 6, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Cottage Cheese', amount: '150g' }, { name: 'Gurke', amount: '100g' }, { name: 'Pfeffer', amount: 'nach Bedarf' }],
    steps: ['Gurke in Scheiben schneiden.', 'Mit Cottage Cheese anrichten.', 'Pfeffern.'],
    longevityBenefit: 'Cottage Cheese liefert Kasein-Protein — wird langsam verdaut und hält dich länger satt.' },
  { id: 'r19', name: 'Edamame mit Meersalz', prepTime: 5, calories: 180, protein: 16, carbs: 10, fat: 8, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Edamame (TK)', amount: '150g' }, { name: 'Meersalz', amount: '1 Prise' }],
    steps: ['Edamame 3-4 Min in kochendem Wasser garen.', 'Abgießen und mit Meersalz bestreuen.', 'Aus der Hülse essen.'],
    longevityBenefit: 'Edamame sind reich an Isoflavonen — pflanzliche Östrogene, die Knochengesundheit und Herz schützen.' },
  { id: 'r20', name: 'Nuss-Mix Energy Balls', prepTime: 10, calories: 240, protein: 12, carbs: 18, fat: 14, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Datteln', amount: '4 Stück' }, { name: 'Mandeln', amount: '30g' }, { name: 'Kokosraspeln', amount: '15g' }, { name: 'Kakao', amount: '1 TL' }],
    steps: ['Datteln und Mandeln im Mixer zerkleinern.', 'Mit Kakao mischen und zu Kugeln formen.', 'In Kokosraspeln wälzen, kühlen.'],
    longevityBenefit: 'Datteln liefern natürliche Energie ohne Blutzucker-Spike. Kakao enthält Flavonoide — gut für Herz und Gefäße.' },

  // ── Extended Breakfast ──
  { id: 'r21', name: 'Buchweizen-Porridge mit Beeren', prepTime: 12, calories: 390, protein: 22, carbs: 52, fat: 10, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Buchweizen', amount: '60g' }, { name: 'Proteinpulver', amount: '20g' }, { name: 'Himbeeren', amount: '80g' }, { name: 'Kürbiskerne', amount: '10g' }],
    steps: ['Buchweizen in Wasser weich kochen (15 Min).', 'Proteinpulver unterrühren.', 'Mit Beeren und Kürbiskernen toppen.'],
    longevityBenefit: 'Buchweizen ist glutenfrei und reich an Rutin — stärkt die Blutgefäße und senkt den Blutdruck.' },
  { id: 'r22', name: 'Räucherlachs auf Vollkornbrot', prepTime: 5, calories: 410, protein: 30, carbs: 28, fat: 20, mealType: 'breakfast', isMeat: true,
    ingredients: [{ name: 'Räucherlachs', amount: '80g' }, { name: 'Vollkornbrot', amount: '2 Scheiben' }, { name: 'Avocado', amount: '½' }, { name: 'Zitrone', amount: '½' }],
    steps: ['Brot toasten.', 'Avocado zerdrücken und aufstreichen.', 'Lachs auflegen, mit Zitrone beträufeln.'],
    longevityBenefit: 'Räucherlachs liefert Omega-3 direkt am Morgen — optimal für Gehirnfunktion und Entzündungshemmung.' },
  { id: 'r23', name: 'Protein-Pancakes', prepTime: 15, calories: 440, protein: 34, carbs: 40, fat: 14, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Haferflocken', amount: '60g' }, { name: 'Eier', amount: '2 Stück' }, { name: 'Proteinpulver', amount: '25g' }, { name: 'Blaubeeren', amount: '60g' }],
    steps: ['Haferflocken, Eier und Protein mixen.', 'In einer Pfanne kleine Pancakes ausbacken.', 'Mit Blaubeeren servieren.'],
    longevityBenefit: 'Hoher Proteinstart am Morgen stabilisiert den Blutzucker für Stunden und unterstützt Muskelerhalt.' },
  { id: 'r24', name: 'Hüttenkäse-Bowl mit Nüssen', prepTime: 5, calories: 360, protein: 32, carbs: 20, fat: 16, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Hüttenkäse', amount: '200g' }, { name: 'Walnüsse', amount: '15g' }, { name: 'Honig', amount: '1 TL' }, { name: 'Erdbeeren', amount: '80g' }],
    steps: ['Hüttenkäse in Schüssel geben.', 'Erdbeeren vierteln.', 'Mit Walnüssen und Honig toppen.'],
    longevityBenefit: 'Kasein-Protein aus Hüttenkäse wird langsam verdaut — hält dich satt und versorgt Muskeln über Stunden.' },
  { id: 'r25', name: 'Grünkohl-Smoothie-Bowl', prepTime: 8, calories: 350, protein: 26, carbs: 36, fat: 10, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Grünkohl', amount: '50g' }, { name: 'Banane', amount: '1' }, { name: 'Proteinpulver', amount: '25g' }, { name: 'Mandelmilch', amount: '150ml' }],
    steps: ['Alle Zutaten im Mixer pürieren.', 'In eine Schüssel gießen.', 'Optional mit Samen toppen.'],
    longevityBenefit: 'Grünkohl ist eines der nährstoffreichsten Lebensmittel — reich an Vitamin K, C und Antioxidantien.' },

  // ── Extended Lunch ──
  { id: 'r26', name: 'Buddha-Bowl mit Tofu', prepTime: 20, calories: 480, protein: 28, carbs: 50, fat: 18, mealType: 'lunch', isVegetarian: true,
    ingredients: [{ name: 'Tofu', amount: '150g' }, { name: 'Quinoa', amount: '60g' }, { name: 'Avocado', amount: '½' }, { name: 'Karotte', amount: '100g' }],
    steps: ['Tofu würfeln und anbraten.', 'Quinoa kochen, Karotten raspeln.', 'Alles in Bowl anrichten, Avocado dazu.'],
    longevityBenefit: 'Tofu enthält Isoflavone — pflanzliche Verbindungen, die Herz und Knochen schützen.' },
  { id: 'r27', name: 'Vollkorn-Pasta mit Garnelen', prepTime: 20, calories: 520, protein: 38, carbs: 55, fat: 14, mealType: 'lunch', isMeat: true,
    ingredients: [{ name: 'Vollkorn-Pasta', amount: '80g' }, { name: 'Garnelen', amount: '120g' }, { name: 'Knoblauch', amount: '5g' }, { name: 'Spinat', amount: '60g' }],
    steps: ['Pasta al dente kochen.', 'Garnelen mit Knoblauch anbraten.', 'Spinat unterheben, mit Pasta mischen.'],
    longevityBenefit: 'Vollkorn-Pasta hat einen niedrigeren GI als weiße Pasta — bessere Blutzuckerkontrolle.' },
  { id: 'r28', name: 'Rote-Bete-Salat mit Forelle', prepTime: 15, calories: 440, protein: 34, carbs: 28, fat: 20, mealType: 'lunch', isMeat: true,
    ingredients: [{ name: 'Forelle', amount: '130g' }, { name: 'Rote Bete', amount: '100g' }, { name: 'Rucola', amount: '40g' }, { name: 'Walnüsse', amount: '15g' }],
    steps: ['Forelle braten oder grillen.', 'Rote Bete kochen und würfeln.', 'Mit Rucola und Walnüssen anrichten.'],
    longevityBenefit: 'Rote Bete ist reich an Nitraten — verbessert die Durchblutung und senkt den Blutdruck.' },
  { id: 'r29', name: 'Couscous-Salat mit Kichererbsen', prepTime: 15, calories: 460, protein: 22, carbs: 58, fat: 14, mealType: 'lunch', isVegetarian: true,
    ingredients: [{ name: 'Couscous', amount: '80g' }, { name: 'Kichererbsen', amount: '100g' }, { name: 'Paprika', amount: '1' }, { name: 'Petersilie', amount: '10g' }],
    steps: ['Couscous mit heißem Wasser quellen lassen.', 'Kichererbsen und Paprika untermischen.', 'Mit Petersilie und Olivenöl anmachen.'],
    longevityBenefit: 'Kichererbsen und Couscous zusammen liefern ein vollständiges Aminosäureprofil — ideal für pflanzliches Protein.' },
  { id: 'r30', name: 'Tempeh-Gemüse-Pfanne', prepTime: 20, calories: 430, protein: 32, carbs: 30, fat: 20, mealType: 'lunch', isVegetarian: true,
    ingredients: [{ name: 'Tempeh', amount: '130g' }, { name: 'Brokkoli', amount: '100g' }, { name: 'Paprika', amount: '1' }, { name: 'Sojasauce', amount: '1 EL' }],
    steps: ['Tempeh in Scheiben schneiden und anbraten.', 'Gemüse hinzufügen und mitbraten.', 'Mit Sojasauce abschmecken.'],
    longevityBenefit: 'Tempeh ist fermentiert — liefert Probiotika und ist leichter verdaulich als unfermentiertes Soja.' },

  // ── Extended Dinner ──
  { id: 'r31', name: 'Blumenkohl-Steak mit Tahini', prepTime: 25, calories: 380, protein: 18, carbs: 28, fat: 22, mealType: 'dinner', isVegetarian: true,
    ingredients: [{ name: 'Blumenkohl', amount: '200g' }, { name: 'Tahini', amount: '20g' }, { name: 'Kichererbsen', amount: '80g' }, { name: 'Kurkuma', amount: '1 TL' }],
    steps: ['Blumenkohl in Scheiben schneiden, mit Kurkuma würzen.', 'Bei 200°C im Ofen 20 Min backen.', 'Mit Kichererbsen und Tahini-Dressing servieren.'],
    longevityBenefit: 'Kurkuma enthält Curcumin — einer der stärksten natürlichen Entzündungshemmer.' },
  { id: 'r32', name: 'Lachs-Teriyaki mit Reis', prepTime: 20, calories: 520, protein: 38, carbs: 48, fat: 16, mealType: 'dinner', isMeat: true,
    ingredients: [{ name: 'Lachs-Filet', amount: '150g' }, { name: 'Reis', amount: '70g' }, { name: 'Sojasauce', amount: '1 EL' }, { name: 'Ingwer', amount: '5g' }],
    steps: ['Lachs mit Sojasauce und Ingwer marinieren.', 'In der Pfanne braten (4 Min pro Seite).', 'Mit Reis servieren.'],
    longevityBenefit: 'Die Kombination aus Omega-3-Fettsäuren und Ingwer wirkt doppelt entzündungshemmend.' },
  { id: 'r33', name: 'Auberginen-Gratin', prepTime: 30, calories: 420, protein: 24, carbs: 22, fat: 26, mealType: 'dinner', isVegetarian: true,
    ingredients: [{ name: 'Aubergine', amount: '200g' }, { name: 'Mozzarella', amount: '60g' }, { name: 'Tomate', amount: '100g' }, { name: 'Olivenöl', amount: '1 EL' }],
    steps: ['Aubergine in Scheiben schneiden und anbraten.', 'Schichtweise mit Tomaten und Mozzarella in eine Form legen.', 'Bei 200°C 15 Min überbacken.'],
    longevityBenefit: 'Auberginen enthalten Nasunin — ein Antioxidans, das Zellmembranen und Gehirnzellen schützt.' },
  { id: 'r34', name: 'Forelle mit Spargel', prepTime: 20, calories: 400, protein: 36, carbs: 12, fat: 24, mealType: 'dinner', isMeat: true,
    ingredients: [{ name: 'Forelle', amount: '150g' }, { name: 'Spargel', amount: '150g' }, { name: 'Butter', amount: '10g' }, { name: 'Zitrone', amount: '½' }],
    steps: ['Spargel schälen und in Salzwasser garen.', 'Forelle in Butter braten.', 'Mit Zitrone und Spargel servieren.'],
    longevityBenefit: 'Spargel ist reich an Folsäure und Glutathion — unterstützt die Entgiftung und den Zellschutz.' },
  { id: 'r35', name: 'Champignon-Quinoa-Bowl', prepTime: 20, calories: 410, protein: 22, carbs: 44, fat: 16, mealType: 'dinner', isVegetarian: true,
    ingredients: [{ name: 'Champignons', amount: '150g' }, { name: 'Quinoa', amount: '70g' }, { name: 'Spinat', amount: '60g' }, { name: 'Knoblauch', amount: '5g' }],
    steps: ['Quinoa kochen.', 'Champignons mit Knoblauch anbraten.', 'Spinat unterheben, mit Quinoa servieren.'],
    longevityBenefit: 'Champignons enthalten Beta-Glucane — stärken das Immunsystem und haben anti-tumorale Eigenschaften.' },

  // ── Extended Snacks ──
  { id: 'r36', name: 'Apfel mit Erdnussbutter', prepTime: 2, calories: 250, protein: 10, carbs: 24, fat: 14, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Apfel', amount: '1' }, { name: 'Erdnussbutter', amount: '20g' }],
    steps: ['Apfel in Spalten schneiden.', 'Mit Erdnussbutter dippen.'],
    longevityBenefit: 'Äpfel enthalten Quercetin — ein Flavonoid, das seneszente Zellen reduziert und die Zellgesundheit fördert.' },
  { id: 'r37', name: 'Skyr mit Kürbiskernen', prepTime: 2, calories: 210, protein: 24, carbs: 14, fat: 8, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Skyr', amount: '150g' }, { name: 'Kürbiskerne', amount: '15g' }, { name: 'Honig', amount: '1 TL' }],
    steps: ['Skyr in Schale geben.', 'Kürbiskerne drüberstreuen.', 'Mit Honig beträufeln.'],
    longevityBenefit: 'Kürbiskerne liefern Zink und Magnesium — essentiell für Immunfunktion und Schlafqualität.' },
  { id: 'r38', name: 'Hummus mit Gemüsesticks', prepTime: 5, calories: 190, protein: 10, carbs: 18, fat: 10, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Kichererbsen', amount: '80g' }, { name: 'Tahini', amount: '10g' }, { name: 'Karotte', amount: '80g' }, { name: 'Gurke', amount: '80g' }],
    steps: ['Kichererbsen mit Tahini pürieren.', 'Gemüse in Sticks schneiden.', 'Dippen und genießen.'],
    longevityBenefit: 'Hummus kombiniert pflanzliches Protein mit gesunden Fetten — sättigend und entzündungshemmend.' },
  { id: 'r39', name: 'Proteinriegel selbstgemacht', prepTime: 15, calories: 230, protein: 20, carbs: 20, fat: 10, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Proteinpulver', amount: '30g' }, { name: 'Haferflocken', amount: '30g' }, { name: 'Erdnussbutter', amount: '15g' }, { name: 'Honig', amount: '1 EL' }],
    steps: ['Alle Zutaten mischen.', 'Zu Riegeln formen.', '30 Min kühlen.'],
    longevityBenefit: 'Selbstgemachte Riegel ohne Zusatzstoffe — kontrollierte Zutaten für optimale Nährstoffversorgung.' },
  { id: 'r40', name: 'Sardinen auf Toast', prepTime: 5, calories: 280, protein: 22, carbs: 18, fat: 14, mealType: 'snack', isMeat: true,
    ingredients: [{ name: 'Sardinen', amount: '80g' }, { name: 'Vollkornbrot', amount: '1 Scheibe' }, { name: 'Zitrone', amount: '½' }],
    steps: ['Brot toasten.', 'Sardinen darauf verteilen.', 'Mit Zitrone beträufeln.'],
    longevityBenefit: 'Sardinen sind eine der besten Quellen für Omega-3, Vitamin D und Kalzium — optimal für Knochen und Herz.' },

  // ── New Breakfasts (r41-r49) ──
  { id: 'r41', name: 'Quark-Müsli mit Apfel', prepTime: 5, calories: 370, protein: 30, carbs: 38, fat: 10, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Hüttenkäse', amount: '200g' }, { name: 'Haferflocken', amount: '40g' }, { name: 'Apfel', amount: '1' }, { name: 'Honig', amount: '1 TL' }],
    steps: ['Quark in eine Schüssel geben.', 'Haferflocken und geriebenen Apfel untermischen.', 'Mit Honig beträufeln.'],
    longevityBenefit: 'Quark liefert Kasein-Protein für langanhaltende Sättigung. Äpfel enthalten Pektin — gut für die Darmgesundheit.', tags: ['high-protein', 'vegetarian', 'quick'] },
  { id: 'r42', name: 'Vollkorn-Bagel mit Lachs & Frischkäse', prepTime: 8, calories: 460, protein: 32, carbs: 38, fat: 18, mealType: 'breakfast', isMeat: true,
    ingredients: [{ name: 'Vollkornbrot', amount: '2 Scheiben' }, { name: 'Räucherlachs', amount: '60g' }, { name: 'Hüttenkäse', amount: '40g' }, { name: 'Gurke', amount: '50g' }],
    steps: ['Brot toasten.', 'Hüttenkäse aufstreichen.', 'Lachs und Gurkenscheiben darauflegen.'],
    longevityBenefit: 'Omega-3 aus Lachs kombiniert mit Vollkornballaststoffen — stabilisiert Blutzucker und Entzündungswerte.', tags: ['high-protein'] },
  { id: 'r43', name: 'Hirse-Porridge mit Zimt', prepTime: 15, calories: 380, protein: 20, carbs: 56, fat: 10, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Hirse', amount: '60g' }, { name: 'Mandelmilch', amount: '200ml' }, { name: 'Banane', amount: '1' }, { name: 'Mandeln', amount: '10g' }],
    steps: ['Hirse mit Mandelmilch aufkochen und 15 Min köcheln.', 'Banane in Scheiben schneiden.', 'Mit Mandeln und Zimt toppen.'],
    longevityBenefit: 'Hirse ist glutenfrei und reich an Silizium — stärkt Bindegewebe, Haare und Nägel.', tags: ['vegetarian', 'anti-inflammatory'] },
  { id: 'r44', name: 'Tofu-Scramble mit Gemüse', prepTime: 12, calories: 320, protein: 24, carbs: 14, fat: 18, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Tofu', amount: '200g' }, { name: 'Paprika', amount: '1' }, { name: 'Spinat', amount: '50g' }, { name: 'Kurkuma', amount: '1 TL' }],
    steps: ['Tofu zerbröseln und mit Kurkuma anbraten.', 'Paprika und Spinat hinzufügen.', 'Würzen und servieren.'],
    longevityBenefit: 'Kurkuma aktiviert entzündungshemmende Signalwege. Tofu liefert pflanzliches Protein mit allen Aminosäuren.', tags: ['vegetarian', 'anti-inflammatory', 'low-calorie'] },
  { id: 'r45', name: 'Overnight Oats mit Erdbeeren', prepTime: 5, calories: 400, protein: 28, carbs: 48, fat: 12, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Haferflocken', amount: '60g' }, { name: 'Skyr', amount: '100g' }, { name: 'Erdbeeren', amount: '100g' }, { name: 'Leinsamen', amount: '10g' }],
    steps: ['Haferflocken mit Skyr und etwas Milch mischen.', 'Über Nacht im Kühlschrank quellen lassen.', 'Morgens mit Erdbeeren und Leinsamen toppen.'],
    longevityBenefit: 'Erdbeeren liefern Ellagsäure — ein Polyphenol, das Zellschäden repariert und Alterungsprozesse verlangsamt.', tags: ['high-protein', 'vegetarian'] },
  { id: 'r46', name: 'Rührei mit Champignons', prepTime: 10, calories: 310, protein: 26, carbs: 6, fat: 20, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Eier', amount: '3 Stück' }, { name: 'Champignons', amount: '100g' }, { name: 'Petersilie', amount: '5g' }, { name: 'Olivenöl', amount: '1 TL' }],
    steps: ['Champignons in Olivenöl anbraten.', 'Eier verquirlen und dazugeben.', 'Sanft rühren, mit Petersilie bestreuen.'],
    longevityBenefit: 'Champignons sind eine der wenigen pflanzlichen Vitamin-D-Quellen und stärken das Immunsystem.', tags: ['high-protein', 'vegetarian', 'low-calorie'] },
  { id: 'r47', name: 'Skyr-Smoothie mit Spinat', prepTime: 5, calories: 340, protein: 32, carbs: 32, fat: 8, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Skyr', amount: '200g' }, { name: 'Spinat', amount: '40g' }, { name: 'Banane', amount: '1' }, { name: 'Leinsamen', amount: '10g' }],
    steps: ['Alle Zutaten in den Mixer geben.', 'Cremig pürieren.', 'Sofort trinken.'],
    longevityBenefit: 'Spinat enthält Nitrate, die die Durchblutung verbessern. Skyr liefert mehr Protein als normaler Joghurt.', tags: ['high-protein', 'vegetarian', 'quick'] },
  { id: 'r48', name: 'Ei-Muffins mit Gemüse', prepTime: 25, calories: 290, protein: 24, carbs: 10, fat: 16, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Eier', amount: '4 Stück' }, { name: 'Paprika', amount: '1' }, { name: 'Brokkoli', amount: '60g' }, { name: 'Feta', amount: '30g' }],
    steps: ['Gemüse kleinschneiden und in Muffinformen verteilen.', 'Eier verquirlen, würzen, über das Gemüse gießen.', 'Bei 180°C 20 Min backen. Feta darüber bröseln.'],
    longevityBenefit: 'Meal-Prep-freundlich — vorkochen und morgens schnell genießen. Eier liefern Cholin für die Gehirnfunktion.', tags: ['high-protein', 'vegetarian', 'meal-prep'] },
  { id: 'r49', name: 'Erdnussbutter-Bananen-Toast', prepTime: 5, calories: 420, protein: 18, carbs: 44, fat: 20, mealType: 'breakfast', isVegetarian: true,
    ingredients: [{ name: 'Vollkornbrot', amount: '2 Scheiben' }, { name: 'Erdnussbutter', amount: '25g' }, { name: 'Banane', amount: '1' }, { name: 'Chia-Samen', amount: '5g' }],
    steps: ['Brot toasten.', 'Erdnussbutter aufstreichen.', 'Bananenscheiben und Chia-Samen darauflegen.'],
    longevityBenefit: 'Erdnussbutter liefert Resveratrol und gesunde Fette. Chia-Samen sind reich an Omega-3 und Ballaststoffen.', tags: ['vegetarian', 'quick'] },

  // ── New Lunches (r50-r59) ──
  { id: 'r50', name: 'Schwarze-Bohnen-Bowl', prepTime: 15, calories: 460, protein: 26, carbs: 52, fat: 14, mealType: 'lunch', isVegetarian: true,
    ingredients: [{ name: 'Schwarze Bohnen', amount: '120g' }, { name: 'Reis', amount: '70g' }, { name: 'Avocado', amount: '½' }, { name: 'Paprika', amount: '1' }],
    steps: ['Reis kochen.', 'Bohnen mit Gewürzen erwärmen.', 'Bowl anrichten mit Avocado und Paprika.'],
    longevityBenefit: 'Schwarze Bohnen sind reich an Anthocyanen und Ballaststoffen — senken Cholesterin und füttern gute Darmbakterien.', tags: ['vegetarian', 'anti-inflammatory'] },
  { id: 'r51', name: 'Hähnchen-Wrap mit Hummus', prepTime: 15, calories: 490, protein: 40, carbs: 36, fat: 18, mealType: 'lunch', isMeat: true,
    ingredients: [{ name: 'Hähnchenbrust', amount: '130g' }, { name: 'Vollkorn-Tortilla', amount: '1' }, { name: 'Kichererbsen', amount: '50g' }, { name: 'Rucola', amount: '30g' }],
    steps: ['Hähnchen braten und in Streifen schneiden.', 'Kichererbsen pürieren (Hummus).', 'Wrap belegen und einrollen.'],
    longevityBenefit: 'Vollkorn-Tortilla hat niedrigen GI. Hummus liefert pflanzliches Protein und gesunde Fette.', tags: ['high-protein'] },
  { id: 'r52', name: 'Brokkoli-Quinoa-Salat', prepTime: 20, calories: 420, protein: 22, carbs: 46, fat: 14, mealType: 'lunch', isVegetarian: true,
    ingredients: [{ name: 'Quinoa', amount: '70g' }, { name: 'Brokkoli', amount: '120g' }, { name: 'Sonnenblumenkerne', amount: '15g' }, { name: 'Zitrone', amount: '½' }],
    steps: ['Quinoa kochen, Brokkoli dünsten.', 'Abkühlen lassen und mischen.', 'Mit Zitronendressing und Kernen anrichten.'],
    longevityBenefit: 'Brokkoli-Sprossen enthalten 50x mehr Sulforaphan als reifer Brokkoli — ein starker Zellschützer.', tags: ['vegetarian', 'anti-inflammatory'] },
  { id: 'r53', name: 'Rindfleisch-Reis-Bowl', prepTime: 25, calories: 580, protein: 44, carbs: 50, fat: 18, mealType: 'lunch', isMeat: true,
    ingredients: [{ name: 'Rindfleisch', amount: '150g' }, { name: 'Reis', amount: '80g' }, { name: 'Brokkoli', amount: '80g' }, { name: 'Sojasauce', amount: '1 EL' }],
    steps: ['Reis kochen.', 'Rindfleisch in Streifen schneiden und scharf anbraten.', 'Brokkoli dünsten, mit Sojasauce ablöschen.'],
    longevityBenefit: 'Rindfleisch liefert hochwertiges Eisen und B12 — wichtig für Blutbildung und Nervensystem.', tags: ['high-protein'] },
  { id: 'r54', name: 'Süßkartoffel-Linsen-Suppe', prepTime: 25, calories: 390, protein: 22, carbs: 54, fat: 8, mealType: 'lunch', isVegetarian: true,
    ingredients: [{ name: 'Süßkartoffel', amount: '150g' }, { name: 'Rote Linsen', amount: '80g' }, { name: 'Ingwer', amount: '5g' }, { name: 'Kokosmilch', amount: '50ml' }],
    steps: ['Süßkartoffel würfeln, mit Linsen und Ingwer kochen.', 'Pürieren und Kokosmilch einrühren.', 'Würzen und servieren.'],
    longevityBenefit: 'Süßkartoffel und Linsen zusammen liefern komplexe Kohlenhydrate und Protein — stabil über Stunden.', tags: ['vegetarian', 'anti-inflammatory', 'low-calorie'] },
  { id: 'r55', name: 'Grünkohl-Salat mit Hähnchen', prepTime: 15, calories: 470, protein: 38, carbs: 24, fat: 22, mealType: 'lunch', isMeat: true,
    ingredients: [{ name: 'Grünkohl', amount: '80g' }, { name: 'Hähnchenbrust', amount: '130g' }, { name: 'Avocado', amount: '½' }, { name: 'Kürbiskerne', amount: '15g' }],
    steps: ['Grünkohl waschen und massieren.', 'Hähnchen braten und in Streifen schneiden.', 'Mit Avocado und Kürbiskernen anrichten.'],
    longevityBenefit: 'Grünkohl ist eines der Superfoods der Blue Zones — reich an Vitamin K, C und Kalzium.', tags: ['high-protein'] },
  { id: 'r56', name: 'Kichererbsen-Curry', prepTime: 20, calories: 440, protein: 20, carbs: 50, fat: 16, mealType: 'lunch', isVegetarian: true,
    ingredients: [{ name: 'Kichererbsen', amount: '150g' }, { name: 'Kokosmilch', amount: '100ml' }, { name: 'Spinat', amount: '60g' }, { name: 'Reis', amount: '60g' }],
    steps: ['Kichererbsen mit Kokosmilch und Currypaste kochen.', 'Spinat unterheben.', 'Mit Reis servieren.'],
    longevityBenefit: 'Kichererbsen senken den Cholesterinspiegel und stabilisieren den Blutzucker durch lösliche Ballaststoffe.', tags: ['vegetarian', 'anti-inflammatory'] },
  { id: 'r57', name: 'Lachs-Salat mit Avocado', prepTime: 15, calories: 500, protein: 36, carbs: 12, fat: 34, mealType: 'lunch', isMeat: true,
    ingredients: [{ name: 'Lachs-Filet', amount: '130g' }, { name: 'Avocado', amount: '½' }, { name: 'Rucola', amount: '40g' }, { name: 'Olivenöl', amount: '1 EL' }],
    steps: ['Lachs braten und in Stücke teilen.', 'Avocado schneiden, Rucola waschen.', 'Anrichten und mit Olivenöl beträufeln.'],
    longevityBenefit: 'Die Kombination aus Omega-3 und einfach ungesättigten Fetten ist optimal für Herz-Kreislauf-Gesundheit.', tags: ['high-protein'] },
  { id: 'r58', name: 'Rote-Linsen-Dal', prepTime: 20, calories: 400, protein: 24, carbs: 50, fat: 10, mealType: 'lunch', isVegetarian: true,
    ingredients: [{ name: 'Rote Linsen', amount: '100g' }, { name: 'Tomate', amount: '100g' }, { name: 'Kurkuma', amount: '1 TL' }, { name: 'Reis', amount: '60g' }],
    steps: ['Linsen mit Tomaten und Kurkuma kochen.', 'Reis separat kochen.', 'Zusammen servieren, mit Koriander garnieren.'],
    longevityBenefit: 'Rote Linsen sind eine der proteinreichsten Hülsenfrüchte und senken langfristig den Blutdruck.', tags: ['vegetarian', 'anti-inflammatory', 'low-calorie'] },
  { id: 'r59', name: 'Putenbrust-Salat mit Kidneybohnen', prepTime: 15, calories: 450, protein: 42, carbs: 28, fat: 16, mealType: 'lunch', isMeat: true,
    ingredients: [{ name: 'Putenbrust', amount: '140g' }, { name: 'Kidneybohnen', amount: '80g' }, { name: 'Paprika', amount: '1' }, { name: 'Olivenöl', amount: '1 EL' }],
    steps: ['Putenbrust braten und in Streifen schneiden.', 'Kidneybohnen abspülen, Paprika würfeln.', 'Alles mischen und mit Olivenöl anmachen.'],
    longevityBenefit: 'Kidneybohnen liefern resistente Stärke — nährt die Darmbakterien und verbessert die Insulinsensitivität.', tags: ['high-protein'] },

  // ── New Dinners (r60-r69) ──
  { id: 'r60', name: 'Tofu-Gemüse-Curry', prepTime: 20, calories: 380, protein: 22, carbs: 32, fat: 18, mealType: 'dinner', isVegetarian: true,
    ingredients: [{ name: 'Tofu', amount: '150g' }, { name: 'Zucchini', amount: '100g' }, { name: 'Kokosmilch', amount: '80ml' }, { name: 'Reis', amount: '50g' }],
    steps: ['Tofu würfeln und anbraten.', 'Zucchini hinzufügen, mit Kokosmilch ablöschen.', 'Mit Reis servieren.'],
    longevityBenefit: 'Leichtes Abendessen mit pflanzlichem Protein — belastet die Verdauung nicht vor dem Schlafen.', tags: ['vegetarian', 'anti-inflammatory'] },
  { id: 'r61', name: 'Hähnchen mit Ratatouille', prepTime: 30, calories: 440, protein: 36, carbs: 20, fat: 22, mealType: 'dinner', isMeat: true,
    ingredients: [{ name: 'Hähnchenbrust', amount: '140g' }, { name: 'Aubergine', amount: '80g' }, { name: 'Zucchini', amount: '80g' }, { name: 'Tomate', amount: '100g' }],
    steps: ['Gemüse würfeln und im Ofen rösten.', 'Hähnchen braten.', 'Zusammen anrichten mit frischen Kräutern.'],
    longevityBenefit: 'Mediterrane Gemüsevielfalt liefert ein breites Spektrum an Polyphenolen — die stärksten Alterungsschützer.', tags: ['high-protein'] },
  { id: 'r62', name: 'Linsen-Bolognese mit Pasta', prepTime: 25, calories: 470, protein: 28, carbs: 56, fat: 12, mealType: 'dinner', isVegetarian: true,
    ingredients: [{ name: 'Rote Linsen', amount: '80g' }, { name: 'Vollkorn-Pasta', amount: '70g' }, { name: 'Tomate', amount: '100g' }, { name: 'Karotte', amount: '60g' }],
    steps: ['Linsen mit Tomaten und geraspelter Karotte kochen.', 'Pasta al dente kochen.', 'Linsen-Sauce über die Pasta geben.'],
    longevityBenefit: 'Linsen ersetzen Hackfleisch mit mehr Ballaststoffen und weniger gesättigtem Fett — besser für Herz und Darm.', tags: ['vegetarian'] },
  { id: 'r63', name: 'Gebratener Lachs mit Fenchel', prepTime: 20, calories: 460, protein: 36, carbs: 14, fat: 28, mealType: 'dinner', isMeat: true,
    ingredients: [{ name: 'Lachs-Filet', amount: '150g' }, { name: 'Sellerie', amount: '80g' }, { name: 'Zitrone', amount: '½' }, { name: 'Olivenöl', amount: '1 EL' }],
    steps: ['Fenchel/Sellerie in Scheiben schneiden und anbraten.', 'Lachs von beiden Seiten braten.', 'Mit Zitronensaft beträufeln.'],
    longevityBenefit: 'Fenchel enthält Anethol — ein Stoff mit entzündungshemmenden und verdauungsfördernden Eigenschaften.', tags: ['high-protein', 'anti-inflammatory'] },
  { id: 'r64', name: 'Tempeh-Bowl mit Süßkartoffel', prepTime: 25, calories: 430, protein: 28, carbs: 42, fat: 16, mealType: 'dinner', isVegetarian: true,
    ingredients: [{ name: 'Tempeh', amount: '120g' }, { name: 'Süßkartoffel', amount: '120g' }, { name: 'Spinat', amount: '50g' }, { name: 'Sesam', amount: '1 EL' }],
    steps: ['Süßkartoffel würfeln und im Ofen backen.', 'Tempeh in Scheiben braten.', 'Bowl mit Spinat und Sesam anrichten.'],
    longevityBenefit: 'Fermentiertes Tempeh liefert Probiotika und mehr bioverfügbares Eisen als unfermentiertes Soja.', tags: ['vegetarian'] },
  { id: 'r65', name: 'Putenpfanne mit Paprika', prepTime: 15, calories: 390, protein: 38, carbs: 16, fat: 18, mealType: 'dinner', isMeat: true,
    ingredients: [{ name: 'Putenbrust', amount: '150g' }, { name: 'Paprika', amount: '1' }, { name: 'Champignons', amount: '80g' }, { name: 'Olivenöl', amount: '1 EL' }],
    steps: ['Putenbrust in Streifen schneiden.', 'Mit Paprika und Champignons anbraten.', 'Würzen und servieren.'],
    longevityBenefit: 'Mageres Putenprotein belastet die Verdauung minimal — ideal als leichtes Abendessen.', tags: ['high-protein', 'low-calorie'] },
  { id: 'r66', name: 'Rote-Bete-Risotto', prepTime: 30, calories: 420, protein: 16, carbs: 54, fat: 14, mealType: 'dinner', isVegetarian: true,
    ingredients: [{ name: 'Rote Bete', amount: '120g' }, { name: 'Reis', amount: '80g' }, { name: 'Parmesan', amount: '15g' }, { name: 'Zwiebel', amount: '50g' }],
    steps: ['Zwiebel anschwitzen, Reis dazugeben.', 'Rote Bete raspeln und mitkochen.', 'Parmesan unterrühren.'],
    longevityBenefit: 'Rote Bete erhöht die Stickoxid-Produktion — verbessert Durchblutung und sportliche Leistung.', tags: ['vegetarian'] },
  { id: 'r67', name: 'Garnelen mit Buchweizen', prepTime: 20, calories: 420, protein: 34, carbs: 40, fat: 12, mealType: 'dinner', isMeat: true,
    ingredients: [{ name: 'Garnelen', amount: '130g' }, { name: 'Buchweizen', amount: '60g' }, { name: 'Spinat', amount: '60g' }, { name: 'Knoblauch', amount: '5g' }],
    steps: ['Buchweizen kochen.', 'Garnelen mit Knoblauch anbraten.', 'Spinat unterheben, mit Buchweizen servieren.'],
    longevityBenefit: 'Buchweizen ist glutenfrei und enthält Rutin — stärkt die Blutgefäße. Garnelen liefern Selen.', tags: ['high-protein'] },
  { id: 'r68', name: 'Gefüllte Paprika vegetarisch', prepTime: 30, calories: 400, protein: 22, carbs: 40, fat: 16, mealType: 'dinner', isVegetarian: true,
    ingredients: [{ name: 'Paprika', amount: '2' }, { name: 'Quinoa', amount: '60g' }, { name: 'Kidneybohnen', amount: '80g' }, { name: 'Mozzarella', amount: '40g' }],
    steps: ['Quinoa kochen, mit Bohnen mischen.', 'Paprika aushöhlen und füllen.', 'Mit Mozzarella bestreuen und bei 200°C 15 Min überbacken.'],
    longevityBenefit: 'Quinoa und Bohnen zusammen liefern alle essentiellen Aminosäuren — vollständiges pflanzliches Protein.', tags: ['vegetarian'] },
  { id: 'r69', name: 'Lachsfilet mit Grünkohl', prepTime: 20, calories: 480, protein: 38, carbs: 16, fat: 28, mealType: 'dinner', isMeat: true,
    ingredients: [{ name: 'Lachs-Filet', amount: '150g' }, { name: 'Grünkohl', amount: '80g' }, { name: 'Knoblauch', amount: '5g' }, { name: 'Olivenöl', amount: '1 EL' }],
    steps: ['Lachs in der Pfanne braten.', 'Grünkohl mit Knoblauch kurz anbraten.', 'Zusammen anrichten.'],
    longevityBenefit: 'Grünkohl und Lachs — die Longevity-Kombination: Omega-3 plus Vitamin K für Knochen und Gefäße.', tags: ['high-protein', 'anti-inflammatory'] },

  // ── New Snacks (r70-r79) ──
  { id: 'r70', name: 'Hüttenkäse mit Sonnenblumenkernen', prepTime: 3, calories: 200, protein: 22, carbs: 8, fat: 10, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Hüttenkäse', amount: '150g' }, { name: 'Sonnenblumenkerne', amount: '15g' }, { name: 'Pfeffer', amount: 'nach Bedarf' }],
    steps: ['Hüttenkäse in Schale geben.', 'Sonnenblumenkerne drüberstreuen.', 'Pfeffern.'],
    longevityBenefit: 'Sonnenblumenkerne liefern Vitamin E — ein starkes Antioxidans, das Zellmembranen schützt.', tags: ['high-protein', 'vegetarian', 'quick', 'low-calorie'] },
  { id: 'r71', name: 'Grüner Protein-Smoothie', prepTime: 5, calories: 230, protein: 24, carbs: 20, fat: 6, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Spinat', amount: '30g' }, { name: 'Proteinpulver', amount: '25g' }, { name: 'Banane', amount: '½' }, { name: 'Mandelmilch', amount: '200ml' }],
    steps: ['Alle Zutaten in den Mixer.', 'Cremig mixen.', 'Sofort trinken.'],
    longevityBenefit: 'Grüne Smoothies liefern Chlorophyll — unterstützt die Entgiftung und bindet freie Radikale.', tags: ['high-protein', 'vegetarian', 'quick'] },
  { id: 'r72', name: 'Quark mit Beeren', prepTime: 3, calories: 180, protein: 22, carbs: 16, fat: 4, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Hüttenkäse', amount: '150g' }, { name: 'Blaubeeren', amount: '60g' }, { name: 'Honig', amount: '1 TL' }],
    steps: ['Quark in Schale geben.', 'Blaubeeren darübergeben.', 'Mit Honig beträufeln.'],
    longevityBenefit: 'Blaubeeren sind das Longevity-Superfood schlechthin — senken Blutdruck und verbessern die Kognition.', tags: ['high-protein', 'vegetarian', 'quick', 'low-calorie'] },
  { id: 'r73', name: 'Reiswaffel mit Avocado', prepTime: 3, calories: 180, protein: 4, carbs: 20, fat: 10, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Vollkornbrot', amount: '2 Scheiben' }, { name: 'Avocado', amount: '½' }, { name: 'Meersalz', amount: '1 Prise' }],
    steps: ['Avocado zerdrücken.', 'Auf Reiswaffeln streichen.', 'Mit Meersalz würzen.'],
    longevityBenefit: 'Avocado liefert Oleinsäure — eine entzündungshemmende Fettsäure, die die Herzgesundheit fördert.', tags: ['vegetarian', 'quick'] },
  { id: 'r74', name: 'Edamame-Hummus', prepTime: 8, calories: 210, protein: 16, carbs: 14, fat: 10, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Edamame (TK)', amount: '100g' }, { name: 'Tahini', amount: '10g' }, { name: 'Karotte', amount: '60g' }, { name: 'Zitrone', amount: '½' }],
    steps: ['Edamame kochen und pürieren.', 'Tahini und Zitronensaft unterrühren.', 'Mit Karottensticks dippen.'],
    longevityBenefit: 'Edamame liefern Isoflavone und hochwertiges pflanzliches Protein — besonders gut für Knochengesundheit.', tags: ['vegetarian'] },
  { id: 'r75', name: 'Trail-Mix selbstgemacht', prepTime: 5, calories: 260, protein: 10, carbs: 20, fat: 16, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Mandeln', amount: '15g' }, { name: 'Walnüsse', amount: '15g' }, { name: 'Kürbiskerne', amount: '10g' }, { name: 'Datteln', amount: '2 Stück' }],
    steps: ['Nüsse und Kerne mischen.', 'Datteln kleinschneiden und dazugeben.', 'In kleine Portionen aufteilen.'],
    longevityBenefit: 'Nüsse sind das Longevity-Lebensmittel Nr. 1 — wer täglich Nüsse isst, lebt nachweislich länger.', tags: ['vegetarian', 'quick'] },
  { id: 'r76', name: 'Skyr-Eis am Stiel', prepTime: 10, calories: 150, protein: 18, carbs: 14, fat: 2, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Skyr', amount: '200g' }, { name: 'Erdbeeren', amount: '80g' }, { name: 'Honig', amount: '1 TL' }],
    steps: ['Skyr mit Erdbeeren und Honig pürieren.', 'In Eisformen füllen.', 'Mindestens 4 Stunden einfrieren.'],
    longevityBenefit: 'Gesunde Eis-Alternative mit hohem Proteingehalt — stillt den Süßhunger ohne leere Kalorien.', tags: ['high-protein', 'vegetarian', 'low-calorie'] },
  { id: 'r77', name: 'Selleriesticks mit Erdnussbutter', prepTime: 3, calories: 200, protein: 8, carbs: 6, fat: 16, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Sellerie', amount: '100g' }, { name: 'Erdnussbutter', amount: '20g' }],
    steps: ['Sellerie in Sticks schneiden.', 'Mit Erdnussbutter füllen.', 'Genießen.'],
    longevityBenefit: 'Sellerie enthält Apigenin — ein Flavonoid, das Entzündungen hemmt und die Schlafqualität verbessern kann.', tags: ['vegetarian', 'quick', 'low-calorie'] },
  { id: 'r78', name: 'Protein-Pudding', prepTime: 5, calories: 220, protein: 28, carbs: 18, fat: 4, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Proteinpulver', amount: '30g' }, { name: 'Skyr', amount: '100g' }, { name: 'Kakao', amount: '1 TL' }, { name: 'Mandelmilch', amount: '50ml' }],
    steps: ['Protein mit Skyr und Kakao verrühren.', 'Mandelmilch nach Wunschkonsistenz hinzufügen.', 'Kurz kühlen und genießen.'],
    longevityBenefit: 'Kakao liefert Flavonoide, die Blutdruck senken und die Gehirndurchblutung verbessern.', tags: ['high-protein', 'vegetarian', 'quick'] },
  { id: 'r79', name: 'Gekochte Eier mit Avocado', prepTime: 10, calories: 250, protein: 18, carbs: 4, fat: 18, mealType: 'snack', isVegetarian: true,
    ingredients: [{ name: 'Eier', amount: '2 Stück' }, { name: 'Avocado', amount: '½' }, { name: 'Meersalz', amount: '1 Prise' }],
    steps: ['Eier 8 Min kochen und schälen.', 'Avocado aufschneiden.', 'Zusammen mit Meersalz genießen.'],
    longevityBenefit: 'Eier sind eine der nährstoffreichsten Lebensmittel — Cholin, Lutein und hochwertiges Protein.', tags: ['high-protein', 'vegetarian', 'quick'] },
];

export function getTodayRecipeSuggestion(
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  proteinRemaining?: number,
): Recipe {
  const h = new Date().getHours();
  const type = mealType || (h < 10 ? 'breakfast' : h < 14 ? 'lunch' : h < 17 ? 'snack' : 'dinner');
  const candidates = RECIPE_TEMPLATES.filter(r => r.mealType === type);
  // Prefer high-protein recipes if user still needs protein
  if (proteinRemaining && proteinRemaining > 20) {
    const sorted = [...candidates].sort((a, b) => b.protein - a.protein);
    return sorted[0] || candidates[0];
  }
  // Random from type
  return candidates[Math.floor(Math.random() * candidates.length)] || RECIPE_TEMPLATES[0];
}

/* ═══ Today Micro-Summary ═══ */

export function getTodayMicroSummary(
  realism: RealismData | null,
  trainingPlan: TrainingPlan | null,
  recoveryPlan: RecoveryPlan | null,
  mentalPlan: MentalPlan | null,
): string {
  const parts: string[] = [];
  if (realism) parts.push(`${realism.calorieRange.min}–${realism.calorieRange.max} kcal Ziel`);
  
  if (trainingPlan) {
    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const today = trainingPlan.days[todayIdx];
    if (today?.isTraining) parts.push(today.sessionType);
    else if (today?.movementSuggestion) parts.push(today.movementSuggestion.split('(')[0].trim());
  }
  
  if (recoveryPlan) parts.push(recoveryPlan.focusAction.split('—')[0].trim());
  if (mentalPlan?.focusAction) {
    const short = mentalPlan.focusAction.split('—')[0].trim();
    if (short.length < 40) parts.push(short);
  }
  
  return parts.length > 0 ? `Heute: ${parts.join(' — ')}` : 'Richte dein Ziel ein für personalisierte Tagespläne';
}
