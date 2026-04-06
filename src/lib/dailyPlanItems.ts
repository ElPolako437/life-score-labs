/**
 * Extracts today's plan items from GoalPlanData for display on Home screen.
 * Prioritizes: training session > mental practice > recovery > meals.
 */

import type { GoalPlanData, ActivityLog } from '@/contexts/AppContext';

const GERMAN_DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

export interface DailyPlanItem {
  id: string; // deterministic: pillar + checkKey
  pillar: 'bewegung' | 'ernaehrung' | 'regeneration' | 'mental';
  type: string;
  title: string;
  subtitle?: string;
  duration?: number;
  checkKey: string; // maps to planCheckInHistory key
  isLogged: boolean;
  isSkipped?: boolean;
  mealIndex?: number; // for meal items: index within the day's meals
  dayIndex?: number;  // for meal items: index of the day in the plan
}

/**
 * Get today's day index (0=Montag .. 6=Sonntag) matching the DAYS array used in pillarPlans.ts
 */
function getTodayPlanIdx(): number {
  const jsDay = new Date().getDay(); // 0=Sunday
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * Extract today's plan items from goalPlan, cross-referencing with planCheckInHistory
 * to determine which items are already logged.
 */
export function getTodaysPlanItems(goalPlan: GoalPlanData | null): DailyPlanItem[] {
  if (!goalPlan) return [];

  const todayIdx = getTodayPlanIdx();
  const today = new Date().toISOString().split('T')[0];
  const checkIns: Record<string, string> = (goalPlan.planCheckInHistory?.[today] as any) || {};

  const items: DailyPlanItem[] = [];

  // 1. Training session for today
  const trainingPlan = goalPlan.trainingPlanData;
  if (trainingPlan?.days?.[todayIdx]) {
    const day = trainingPlan.days[todayIdx];
    if (day.isTraining) {
      const checkKey = `training_${todayIdx}`;
      items.push({
        id: `bewegung_${checkKey}`,
        pillar: 'bewegung',
        type: 'training',
        title: day.sessionType || 'Training',
        subtitle: `${day.exercises?.length || 0} Übungen`,
        duration: day.duration || 45,
        checkKey,
        isLogged: checkIns[checkKey] === 'done',
      });
    } else if (day.movementSuggestion) {
      const checkKey = `training_${todayIdx}`;
      items.push({
        id: `bewegung_${checkKey}`,
        pillar: 'bewegung',
        type: 'active_recovery',
        title: 'Active Recovery',
        subtitle: day.movementSuggestion,
        duration: day.duration || 20,
        checkKey,
        isLogged: checkIns[checkKey] === 'done',
      });
    }
  }

  // 2. Mental tips (pick first unlogged, or first)
  const mentalTips: any[] = goalPlan.mentalTips || [];
  if (mentalTips.length > 0) {
    const unloggedIdx = mentalTips.findIndex((_: any, i: number) => checkIns[`mental_${i}`] !== 'done');
    const idx = unloggedIdx >= 0 ? unloggedIdx : 0;
    const tip = mentalTips[idx];
    const checkKey = `mental_${idx}`;
    items.push({
      id: `mental_${checkKey}`,
      pillar: 'mental',
      type: 'mental_practice',
      title: tip.title || 'Mental-Übung',
      subtitle: tip.category || undefined,
      duration: 5,
      checkKey,
      isLogged: checkIns[checkKey] === 'done',
    });
  }

  // 3. Recovery tips (pick first unlogged, or first)
  const recoveryTips: any[] = goalPlan.recoveryTips || [];
  if (recoveryTips.length > 0) {
    const unloggedIdx = recoveryTips.findIndex((_: any, i: number) => checkIns[`recovery_${i}`] !== 'done');
    const idx = unloggedIdx >= 0 ? unloggedIdx : 0;
    const tip = recoveryTips[idx];
    const checkKey = `recovery_${idx}`;
    items.push({
      id: `regeneration_${checkKey}`,
      pillar: 'regeneration',
      type: 'recovery',
      title: tip.title || 'Recovery',
      subtitle: tip.category || undefined,
      duration: 15,
      checkKey,
      isLogged: checkIns[checkKey] === 'done',
    });
  }

  // 4. Nutrition — show all today's meals (not just first unlogged)
  const nutritionPlan = goalPlan.nutritionPlan;
  if (nutritionPlan?.days?.[todayIdx]) {
    const meals = nutritionPlan.days[todayIdx].meals || [];
    meals.forEach((meal: any, mealIdx: number) => {
      const checkKey = `meal_${todayIdx}_${mealIdx}`;
      const status = checkIns[checkKey];
      items.push({
        id: `ernaehrung_${checkKey}`,
        pillar: 'ernaehrung',
        type: 'meal',
        title: meal.name || 'Mahlzeit',
        subtitle: `${meal.calories || '–'} kcal · ${meal.protein || '–'}g P`,
        checkKey,
        isLogged: status === 'done',
        isSkipped: status === 'skipped',
        mealIndex: mealIdx,
        dayIndex: todayIdx,
      });
    });
  }

  return items;
}

/**
 * Priority sort: training first, then mental, recovery, nutrition.
 * Already-logged items sink to the bottom.
 * Enforces pillar diversity — no two items from the same pillar (except meals).
 */
export function prioritizePlanItems(items: DailyPlanItem[], maxItems = 3): DailyPlanItem[] {
  const pillarOrder: Record<string, number> = {
    bewegung: 0,
    mental: 1,
    regeneration: 2,
    ernaehrung: 3,
  };

  // Separate meals from other items — meals get their own treatment
  const nonMealItems = items.filter(i => i.type !== 'meal');
  const mealItems = items.filter(i => i.type === 'meal');

  const sorted = [...nonMealItems].sort((a, b) => {
    if (a.isLogged !== b.isLogged) return a.isLogged ? 1 : -1;
    return (pillarOrder[a.pillar] ?? 9) - (pillarOrder[b.pillar] ?? 9);
  });

  const result: DailyPlanItem[] = [];
  const seenPillars = new Set<string>();

  for (const item of sorted) {
    if (result.length >= maxItems) break;
    if (seenPillars.has(item.pillar)) continue;
    seenPillars.add(item.pillar);
    result.push(item);
  }

  // Add first unlogged meal if ernaehrung not yet included and space remains
  if (!seenPillars.has('ernaehrung') && result.length < maxItems) {
    const nextMeal = mealItems.find(m => !m.isLogged && !m.isSkipped) || mealItems[0];
    if (nextMeal) result.push(nextMeal);
  }

  return result;
}

/**
 * Get ALL today's meal items for the nutrition daily feed.
 */
export function getTodaysMealItems(goalPlan: GoalPlanData | null): DailyPlanItem[] {
  if (!goalPlan) return [];
  return getTodaysPlanItems(goalPlan).filter(i => i.type === 'meal');
}
