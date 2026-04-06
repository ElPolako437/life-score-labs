/**
 * NutritionDayFeed -- premium "What I ate today" daily feed.
 * Shows each meal with status (eaten/swapped/skipped), protein, time.
 * Planned meals are tappable -> QuickMealLogSheet for instant logging.
 * All actions go through QuickMealLogSheet (no inline buttons).
 */

import { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { calculateLongevityNutritionScore } from '@/lib/longevityNutrition';
import { generateNutritionDayInsight } from '@/lib/nutritionDayInsight';
import { cn } from '@/lib/utils';
import { Apple, Check, ArrowLeftRight, X, Egg, Clock, Sparkles, CircleDashed, ChevronRight } from 'lucide-react';
import QuickMealLogSheet, { type QuickMealLogData } from '@/components/app/QuickMealLogSheet';
import MealCustomizeSheet from '@/components/app/MealCustomizeSheet';
import type { MealIngredient } from '@/lib/pillarPlans';
import type { SwapCandidate } from '@/lib/mealSwap';
import { toast } from 'sonner';

const MEAL_TYPE_LABELS: Record<string, string> = {
  'fruehstueck': 'Frühstück', 'breakfast': 'Frühstück', 'frühstück': 'Frühstück',
  'mittag': 'Mittagessen', 'lunch': 'Mittagessen',
  'abend': 'Abendessen', 'dinner': 'Abendessen',
  'snack': 'Snack',
};

const MEAL_STATUS_CONFIG: Record<string, { icon: typeof Check; color: string; label: string; bg: string }> = {
  eaten: { icon: Check, color: 'text-primary', label: 'Gegessen', bg: 'bg-primary/10' },
  swapped: { icon: ArrowLeftRight, color: 'text-amber-400', label: 'Getauscht', bg: 'bg-amber-400/10' },
  skipped: { icon: X, color: 'text-muted-foreground/60', label: 'Übersprungen', bg: 'bg-secondary/40' },
  planned: { icon: CircleDashed, color: 'text-muted-foreground/40', label: 'Geplant', bg: 'bg-secondary/20' },
};

interface Props {
  className?: string;
  compact?: boolean;
}

export default function NutritionDayFeed({ className, compact = false }: Props) {
  const { nutritionLogs, nutritionTargets, goalPlan, addNutritionLog, setGoalPlan, addActivityLog } = useApp();

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = useMemo(() => nutritionLogs.filter(l => l.date === today), [nutritionLogs, today]);
  const allMeals = useMemo(() => todayLogs.flatMap(l => l.meals), [todayLogs]);

  const todayProtein = useMemo(() =>
    todayLogs.reduce((s, l) => s + l.estimatedProteinTotal, 0), [todayLogs]);

  const targets = nutritionTargets || { calorieMin: 1800, calorieMax: 2200, proteinTarget: 130 };

  // Check plan context for today's planned meals
  const todayIdx = useMemo(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }, []);

  const plannedMeals = useMemo(() => {
    if (!goalPlan?.nutritionPlan?.days?.[todayIdx]) return [];
    return goalPlan.nutritionPlan.days[todayIdx].meals || [];
  }, [goalPlan, todayIdx]);

  const planCheckIns = useMemo(() => {
    return (goalPlan?.planCheckInHistory?.[today] || {}) as Record<string, string>;
  }, [goalPlan, today]);

  // Longevity nutrition score for today
  const nutritionScore = useMemo(() => {
    if (todayLogs.length === 0) return null;
    return calculateLongevityNutritionScore(todayLogs, targets.calorieMin, targets.calorieMax, targets.proteinTarget);
  }, [todayLogs, targets]);

  // Day insight
  const dayInsight = useMemo(() => {
    if (allMeals.length < 2) return null;
    return generateNutritionDayInsight(
      allMeals,
      todayProtein,
      targets.proteinTarget,
      nutritionScore?.score || 0,
      nutritionScore?.factors || null,
      goalPlan?.goalType || null,
    );
  }, [allMeals, todayProtein, targets, nutritionScore, goalPlan]);

  // QuickMealLogSheet state
  const [quickMeal, setQuickMeal] = useState<QuickMealLogData | null>(null);
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);
  const [customizeMeal, setCustomizeMeal] = useState<QuickMealLogData | null>(null);

  // Open quick sheet for a planned meal
  const openQuickSheet = useCallback((mealIdx: number) => {
    const meal = plannedMeals[mealIdx];
    if (!meal) return;
    const checkKey = `meal_${todayIdx}_${mealIdx}`;
    setQuickMeal({
      id: meal.id,
      name: meal.name || 'Mahlzeit',
      protein: meal.protein || 0,
      calories: meal.calories || 0,
      description: meal.description,
      nutritionIngredients: meal.nutritionIngredients,
      mealIndex: mealIdx,
      dayIndex: todayIdx,
      checkKey,
    });
    setQuickSheetOpen(true);
  }, [plannedMeals, todayIdx]);

  // Eat handler
  const handleQuickEat = useCallback(() => {
    if (!quickMeal) return;
    const mi = quickMeal.mealIndex;
    const mt = mi === 0 ? 'breakfast' : mi === 1 ? 'lunch' : mi === 2 ? 'dinner' : 'snack';
    addNutritionLog({
      date: today,
      meals: [{
        name: quickMeal.name,
        type: mt,
        description: quickMeal.name,
        proteinLevel: quickMeal.protein >= 30 ? 'hoch' : quickMeal.protein >= 15 ? 'mittel' : 'niedrig',
        estimatedProtein: quickMeal.protein,
        estimatedCalories: quickMeal.calories,
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        status: 'eaten',
      }],
      estimatedProteinTotal: quickMeal.protein,
      qualityRating: quickMeal.protein >= 30 ? 'gut' : 'okay',
    });
    addActivityLog({ pillar: 'ernaehrung', type: 'plan_meal', label: quickMeal.name, duration: 0, source: 'plan' });
    setGoalPlan(prev => {
      if (!prev) return prev;
      const history = { ...(prev.planCheckInHistory || {}) };
      const dayChecks = { ...(history[today] || {}) } as Record<string, 'done' | 'partial' | 'skipped'>;
      dayChecks[quickMeal.checkKey] = 'done';
      history[today] = dayChecks;
      return { ...prev, planCheckInHistory: history };
    });
    toast.success(`${quickMeal.name} geloggt`);
    if (navigator.vibrate) navigator.vibrate([10]);
  }, [quickMeal, today, addNutritionLog, addActivityLog, setGoalPlan]);

  // Skip handler
  const handleQuickSkip = useCallback(() => {
    if (!quickMeal) return;
    setGoalPlan(prev => {
      if (!prev) return prev;
      const history = { ...(prev.planCheckInHistory || {}) };
      const dayChecks = { ...(history[today] || {}) } as Record<string, 'done' | 'partial' | 'skipped'>;
      dayChecks[quickMeal.checkKey] = 'skipped';
      history[today] = dayChecks;
      return { ...prev, planCheckInHistory: history };
    });
    toast('Mahlzeit übersprungen', { description: 'Du kannst sie später noch loggen.' });
  }, [quickMeal, today, setGoalPlan]);

  // Swap handler - receives selected recipe directly from QuickMealLogSheet
  const handleSwapComplete = useCallback((recipe: SwapCandidate['recipe']) => {
    if (!quickMeal) return;
    const mi = quickMeal.mealIndex;
    const mt = mi === 0 ? 'breakfast' : mi === 1 ? 'lunch' : mi === 2 ? 'dinner' : 'snack';
    addNutritionLog({
      date: today,
      meals: [{
        name: recipe.name,
        type: mt,
        description: recipe.name,
        proteinLevel: recipe.protein >= 30 ? 'hoch' : recipe.protein >= 15 ? 'mittel' : 'niedrig',
        estimatedProtein: recipe.protein,
        estimatedCalories: recipe.calories,
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        status: 'swapped',
        swappedFrom: quickMeal.name,
      }],
      estimatedProteinTotal: recipe.protein,
      qualityRating: 'gut',
    });
    addActivityLog({ pillar: 'ernaehrung', type: 'plan_meal_swap', label: recipe.name, duration: 0, source: 'plan' });
    setGoalPlan(prev => {
      if (!prev) return prev;
      const history = { ...(prev.planCheckInHistory || {}) };
      const dayChecks = { ...(history[today] || {}) } as Record<string, 'done' | 'partial' | 'skipped'>;
      dayChecks[quickMeal.checkKey] = 'done';
      history[today] = dayChecks;
      return { ...prev, planCheckInHistory: history };
    });
    toast.success(`Getauscht: ${recipe.name}`);
    if (navigator.vibrate) navigator.vibrate([10]);
  }, [quickMeal, today, addNutritionLog, addActivityLog, setGoalPlan]);

  // Customize open
  const handleOpenCustomize = useCallback(() => {
    if (quickMeal) setCustomizeMeal(quickMeal);
  }, [quickMeal]);

  // Customize complete
  const handleCustomizeComplete = useCallback((ingredients: MealIngredient[], totals: { protein: number; calories: number }) => {
    if (!customizeMeal) return;
    const mi = customizeMeal.mealIndex;
    const mt = mi === 0 ? 'breakfast' : mi === 1 ? 'lunch' : mi === 2 ? 'dinner' : 'snack';
    addNutritionLog({
      date: today,
      meals: [{
        name: customizeMeal.name,
        type: mt,
        description: customizeMeal.name,
        proteinLevel: totals.protein >= 30 ? 'hoch' : totals.protein >= 15 ? 'mittel' : 'niedrig',
        estimatedProtein: Math.round(totals.protein),
        estimatedCalories: Math.round(totals.calories),
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        customIngredients: ingredients.map(ing => ({
          name: ing.name, amount: ing.amount, unit: ing.unit,
          protein_per_100: ing.protein_per_100, calories_per_100: ing.calories_per_100,
        })),
      }],
      estimatedProteinTotal: Math.round(totals.protein),
      qualityRating: totals.protein >= 25 ? 'gut' : 'okay',
    });
    addActivityLog({ pillar: 'ernaehrung', type: 'plan_meal_custom', label: customizeMeal.name, duration: 0, source: 'plan' });
    setGoalPlan(prev => {
      if (!prev) return prev;
      const history = { ...(prev.planCheckInHistory || {}) };
      const dayChecks = { ...(history[today] || {}) } as Record<string, 'done' | 'partial' | 'skipped'>;
      dayChecks[customizeMeal.checkKey] = 'done';
      history[today] = dayChecks;
      return { ...prev, planCheckInHistory: history };
    });
    setCustomizeMeal(null);
    toast.success('Mit angepassten Zutaten geloggt');
    if (navigator.vibrate) navigator.vibrate([10]);
  }, [customizeMeal, today, addNutritionLog, addActivityLog, setGoalPlan]);

  if (allMeals.length === 0 && plannedMeals.length === 0) return null;

  // Build feed entries from actual logs + plan status + pending planned meals
  const feedEntries: {
    key: string; name: string; type: string; protein: number;
    calories: number; time: string; status: 'eaten' | 'swapped' | 'skipped' | 'planned';
    swappedFrom?: string; mealIndex?: number;
  }[] = [];

  // Add logged meals
  allMeals.forEach((m: any, i: number) => {
    const mealStatus: 'eaten' | 'swapped' | 'skipped' = m.status === 'swapped' || m.swappedFrom ? 'swapped' : 'eaten';
    feedEntries.push({
      key: `${m.name}-${i}`,
      name: m.name || 'Mahlzeit',
      type: m.type || 'mittag',
      protein: m.estimatedProtein || 0,
      calories: m.estimatedCalories || 0,
      time: m.time || '',
      status: mealStatus,
      swappedFrom: m.swappedFrom,
    });
  });

  // Add skipped and pending planned meals
  plannedMeals.forEach((meal: any, mi: number) => {
    const checkKey = `meal_${todayIdx}_${mi}`;
    const checkStatus = planCheckIns[checkKey];

    if (checkStatus === 'skipped') {
      feedEntries.push({
        key: `skipped-${mi}`,
        name: meal.name || 'Mahlzeit',
        type: mi === 0 ? 'breakfast' : mi === 1 ? 'lunch' : mi === 2 ? 'dinner' : 'snack',
        protein: 0, calories: 0, time: '',
        status: 'skipped' as const,
        mealIndex: mi,
      });
    } else if (checkStatus === 'done') {
      // already in logged meals
    } else {
      // Pending -- not yet acted on
      feedEntries.push({
        key: `planned-${mi}`,
        name: meal.name || 'Mahlzeit',
        type: mi === 0 ? 'breakfast' : mi === 1 ? 'lunch' : mi === 2 ? 'dinner' : 'snack',
        protein: meal.protein || 0,
        calories: meal.calories || 0,
        time: '',
        status: 'planned' as const,
        mealIndex: mi,
      });
    }
  });

  if (feedEntries.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-0.5">
        <Apple className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
          Heute gegessen
        </span>
        <span className="text-[10px] text-primary font-semibold ml-auto">
          {Math.round(todayProtein)}g Protein
        </span>
      </div>

      {/* Feed entries -- tappable for planned meals, no inline buttons */}
      <div className="space-y-1">
        {feedEntries.map(entry => {
          const statusConfig = MEAL_STATUS_CONFIG[entry.status];
          const StatusIcon = statusConfig?.icon || Check;
          const isInactive = entry.status === 'skipped' || entry.status === 'planned';
          const isPlanned = entry.status === 'planned' && entry.mealIndex != null;

          return (
            <div
              key={entry.key}
              onClick={isPlanned ? () => openQuickSheet(entry.mealIndex!) : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2',
                entry.status === 'skipped' && 'opacity-50',
                entry.status === 'planned' && 'opacity-80',
                isPlanned && 'cursor-pointer active:scale-[0.98] transition-all hover:bg-white/5',
              )}
              style={!isInactive ? { background: 'var(--gradient-card)' } : isPlanned ? { background: 'var(--gradient-card)' } : undefined}
            >
              {/* Status icon */}
              <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0', statusConfig?.bg)}>
                <StatusIcon className={cn('w-3 h-3', statusConfig?.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-xs font-medium truncate',
                  entry.status === 'skipped' ? 'line-through text-muted-foreground/60'
                    : entry.status === 'planned' ? 'text-foreground/80'
                    : 'text-foreground',
                )}>
                  {entry.name}
                </p>
                {entry.swappedFrom && (
                  <p className="text-[9px] text-amber-400/70">statt {entry.swappedFrom}</p>
                )}
                {entry.status === 'planned' && (
                  <p className="text-[9px] text-muted-foreground/50">Tippen zum Loggen</p>
                )}
              </div>

              {/* Time */}
              {entry.time && (
                <span className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5 shrink-0">
                  <Clock className="w-2.5 h-2.5" />{entry.time}
                </span>
              )}

              {/* Protein */}
              {entry.status !== 'skipped' && entry.protein > 0 && (
                <span className={cn(
                  'text-[10px] font-semibold shrink-0',
                  entry.status === 'planned' ? 'text-muted-foreground/50'
                    : entry.protein >= 25 ? 'text-primary'
                    : entry.protein >= 12 ? 'text-amber-400'
                    : 'text-muted-foreground'
                )}>
                  {entry.protein}g
                </span>
              )}

              {/* Arrow hint for planned */}
              {isPlanned && (
                <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Longevity Day Insight */}
      {dayInsight && !compact && (
        <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 mt-1">
          <div className="flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">
                Ernährungs-Insight
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {dayInsight}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QuickMealLogSheet -- canonical */}
      <QuickMealLogSheet
        open={quickSheetOpen}
        onOpenChange={setQuickSheetOpen}
        meal={quickMeal}
        onEat={handleQuickEat}
        onSwap={handleSwapComplete}
        onCustomize={quickMeal?.nutritionIngredients?.length ? handleOpenCustomize : undefined}
        onSkip={handleQuickSkip}
      />

      {/* Customize Sheet (one level deep) */}
      {customizeMeal && customizeMeal.nutritionIngredients?.length && (
        <MealCustomizeSheet
          open={!!customizeMeal}
          onOpenChange={open => { if (!open) setCustomizeMeal(null); }}
          mealName={customizeMeal.name}
          ingredients={customizeMeal.nutritionIngredients as MealIngredient[]}
          originalProtein={customizeMeal.protein}
          originalCalories={customizeMeal.calories}
          onConfirm={handleCustomizeComplete}
        />
      )}
    </div>
  );
}
