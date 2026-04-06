/**
 * TodaysPlanSection -- focused "Heute aus deinen Planen" spotlight.
 * Shows max 1 primary + 2 secondary items. Meal items are tappable -> QuickMealLogSheet.
 * No inline action buttons -- all meal actions happen inside QuickMealLogSheet.
 * Uses planCheckInHistory + addActivityLog + addNutritionLog pipeline.
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { getTodaysPlanItems, prioritizePlanItems, type DailyPlanItem } from '@/lib/dailyPlanItems';
import { Activity, Apple, Moon, Brain, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import MealCustomizeSheet from '@/components/app/MealCustomizeSheet';
import QuickMealLogSheet, { type QuickMealLogData } from '@/components/app/QuickMealLogSheet';
import type { MealIngredient } from '@/lib/pillarPlans';
import type { Recipe } from '@/lib/pillarPlans';
import type { SwapCandidate } from '@/lib/mealSwap';

const PILLAR_ICONS: Record<string, typeof Activity> = {
  bewegung: Activity,
  ernaehrung: Apple,
  regeneration: Moon,
  mental: Brain,
};

const PILLAR_ACCENT: Record<string, string> = {
  bewegung: 'border-l-primary',
  ernaehrung: 'border-l-orange-400',
  regeneration: 'border-l-blue-400',
  mental: 'border-l-purple-400',
};

const PILLAR_ICON_COLOR: Record<string, string> = {
  bewegung: 'text-primary',
  ernaehrung: 'text-orange-400',
  regeneration: 'text-blue-400',
  mental: 'text-purple-400',
};

const PILLAR_LABEL: Record<string, string> = {
  bewegung: 'Trainingsplan',
  ernaehrung: 'Ernährungsplan',
  regeneration: 'Recoveryplan',
  mental: 'Mentalplan',
};

interface TodaysPlanSectionProps {
  showFirstUseHint?: boolean;
}

export default function TodaysPlanSection({ showFirstUseHint = false }: TodaysPlanSectionProps) {
  const navigate = useNavigate();
  const { goalPlan, setGoalPlan, addActivityLog, addNutritionLog } = useApp();

  const allItems = useMemo(() => getTodaysPlanItems(goalPlan), [goalPlan]);
  const items = useMemo(() => prioritizePlanItems(allItems, 3), [allItems]);

  const today = new Date().toISOString().split('T')[0];

  const trainingPlan = goalPlan?.trainingPlanData;
  const nutritionPlan = goalPlan?.nutritionPlan;
  const recoveryTips: any[] = goalPlan?.recoveryTips || [];
  const mentalTips: any[] = goalPlan?.mentalTips || [];

  // Meal action state
  const [customizeItem, setCustomizeItem] = useState<DailyPlanItem | null>(null);

  // QuickMealLogSheet state
  const [quickMealItem, setQuickMealItem] = useState<DailyPlanItem | null>(null);
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);

  // Get meal data for a meal item
  const getMealData = useCallback((item: DailyPlanItem) => {
    if (item.dayIndex == null || item.mealIndex == null) return null;
    return nutritionPlan?.days?.[item.dayIndex]?.meals?.[item.mealIndex] || null;
  }, [nutritionPlan]);

  // Build QuickMealLogData from DailyPlanItem
  const quickMealData = useMemo<QuickMealLogData | null>(() => {
    if (!quickMealItem) return null;
    const meal = getMealData(quickMealItem);
    if (!meal) return null;
    return {
      id: meal.id,
      name: meal.name || quickMealItem.title,
      protein: meal.protein || 0,
      calories: meal.calories || 0,
      description: meal.description,
      nutritionIngredients: meal.nutritionIngredients,
      mealIndex: quickMealItem.mealIndex ?? 0,
      dayIndex: quickMealItem.dayIndex ?? 0,
      checkKey: quickMealItem.checkKey,
    };
  }, [quickMealItem, getMealData]);

  // Open quick sheet for a meal item
  const handleMealTap = useCallback((item: DailyPlanItem) => {
    if (item.isLogged || item.isSkipped) return;
    setQuickMealItem(item);
    setQuickSheetOpen(true);
  }, []);

  const handleLog = useCallback((item: DailyPlanItem) => {
    if (item.isLogged) return;

    // 1. Update planCheckInHistory
    setGoalPlan(prev => {
      if (!prev) return prev;
      const history = { ...(prev.planCheckInHistory || {}) };
      const dayChecks = { ...(history[today] || {}) } as Record<string, 'done' | 'partial' | 'skipped'>;
      dayChecks[item.checkKey] = 'done';
      history[today] = dayChecks;
      return { ...prev, planCheckInHistory: history };
    });

    // 2. Add to activityLog
    if (item.checkKey.startsWith('training_')) {
      const idx = parseInt(item.checkKey.replace('training_', ''));
      const day = trainingPlan?.days?.[idx];
      if (day?.isTraining) {
        addActivityLog({ pillar: 'bewegung', type: 'plan_training', label: day.sessionType || 'Training', duration: day.duration || 45, source: 'plan' });
      } else if (day) {
        addActivityLog({ pillar: 'bewegung', type: 'plan_recovery_movement', label: 'Active Recovery', duration: day.duration || 20, source: 'plan' });
      }
    } else if (item.checkKey.startsWith('meal_')) {
      const meal = getMealData(item);
      if (meal) {
        const mealIdx = item.mealIndex ?? 0;
        addActivityLog({ pillar: 'ernaehrung', type: 'plan_meal', label: meal.name || 'Mahlzeit', duration: 0, source: 'plan' });
        addNutritionLog({
          date: today,
          meals: [{
            name: meal.name || 'Mahlzeit',
            type: mealIdx === 0 ? 'breakfast' : mealIdx === 1 ? 'lunch' : mealIdx === 2 ? 'dinner' : 'snack',
            description: meal.name || '',
            proteinLevel: meal.protein >= 30 ? 'hoch' : meal.protein >= 15 ? 'mittel' : 'niedrig',
            estimatedProtein: meal.protein || 0,
            estimatedCalories: meal.calories || 0,
            time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            status: 'eaten',
          }],
          estimatedProteinTotal: meal.protein || 0,
          qualityRating: 'gut',
        });
      }
    } else if (item.checkKey.startsWith('recovery_')) {
      const idx = parseInt(item.checkKey.replace('recovery_', ''));
      const tip = recoveryTips[idx];
      if (tip) {
        addActivityLog({ pillar: 'regeneration', type: 'plan_recovery', label: tip.title || 'Recovery', duration: 20, source: 'plan' });
      }
    } else if (item.checkKey.startsWith('mental_')) {
      const idx = parseInt(item.checkKey.replace('mental_', ''));
      const tip = mentalTips[idx];
      if (tip) {
        addActivityLog({ pillar: 'mental', type: 'plan_mental', label: tip.title || 'Mental', duration: 10, source: 'plan' });
      }
    }

    toast.success('Erledigt');
    if (navigator.vibrate) navigator.vibrate([10]);
  }, [today, trainingPlan, nutritionPlan, recoveryTips, mentalTips, setGoalPlan, addActivityLog, addNutritionLog, getMealData]);

  // Quick eat handler (from QuickMealLogSheet)
  const handleQuickEat = useCallback(() => {
    if (!quickMealItem) return;
    handleLog(quickMealItem);
  }, [quickMealItem, handleLog]);

  // Quick skip handler
  const handleQuickSkip = useCallback(() => {
    if (!quickMealItem) return;
    setGoalPlan(prev => {
      if (!prev) return prev;
      const history = { ...(prev.planCheckInHistory || {}) };
      const dayChecks = { ...(history[today] || {}) } as Record<string, 'done' | 'partial' | 'skipped'>;
      dayChecks[quickMealItem.checkKey] = 'skipped';
      history[today] = dayChecks;
      return { ...prev, planCheckInHistory: history };
    });
    toast('Mahlzeit übersprungen', { description: 'Du kannst sie später noch loggen.' });
  }, [quickMealItem, today, setGoalPlan]);

  // Quick swap handler - receives the selected recipe directly
  const handleQuickSwap = useCallback((recipe: SwapCandidate['recipe']) => {
    if (!quickMealItem) return;
    // Log the swapped meal as eaten
    setGoalPlan(prev => {
      if (!prev) return prev;
      const history = { ...(prev.planCheckInHistory || {}) };
      const dayChecks = { ...(history[today] || {}) } as Record<string, 'done' | 'partial' | 'skipped'>;
      dayChecks[quickMealItem.checkKey] = 'done';
      history[today] = dayChecks;
      return { ...prev, planCheckInHistory: history };
    });

    const mealIdx = quickMealItem.mealIndex ?? 0;
    const originalMeal = getMealData(quickMealItem);
    addActivityLog({ pillar: 'ernaehrung', type: 'plan_meal_swap', label: recipe.name, duration: 0, source: 'plan' });
    addNutritionLog({
      date: today,
      meals: [{
        name: recipe.name,
        type: mealIdx === 0 ? 'breakfast' : mealIdx === 1 ? 'lunch' : mealIdx === 2 ? 'dinner' : 'snack',
        description: recipe.name,
        proteinLevel: recipe.protein >= 30 ? 'hoch' : recipe.protein >= 15 ? 'mittel' : 'niedrig',
        estimatedProtein: recipe.protein,
        estimatedCalories: recipe.calories,
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        status: 'swapped',
        swappedFrom: originalMeal?.name || quickMealItem.title,
      }],
      estimatedProteinTotal: recipe.protein,
      qualityRating: 'gut',
    });

    toast.success(`Getauscht: ${recipe.name}`);
    if (navigator.vibrate) navigator.vibrate([10]);
  }, [quickMealItem, today, setGoalPlan, addActivityLog, addNutritionLog, getMealData]);

  // Quick customize -> opens customize sheet
  const handleQuickCustomize = useCallback(() => {
    if (quickMealItem) setCustomizeItem(quickMealItem);
  }, [quickMealItem]);

  // Customize and log a meal
  const handleCustomizeComplete = useCallback((item: DailyPlanItem, ingredients: MealIngredient[], totals: { protein: number; calories: number }) => {
    setGoalPlan(prev => {
      if (!prev) return prev;
      const history = { ...(prev.planCheckInHistory || {}) };
      const dayChecks = { ...(history[today] || {}) } as Record<string, 'done' | 'partial' | 'skipped'>;
      dayChecks[item.checkKey] = 'done';
      history[today] = dayChecks;
      return { ...prev, planCheckInHistory: history };
    });

    const meal = getMealData(item);
    const mealIdx = item.mealIndex ?? 0;
    addActivityLog({ pillar: 'ernaehrung', type: 'plan_meal_custom', label: meal?.name || item.title, duration: 0, source: 'plan' });
    addNutritionLog({
      date: today,
      meals: [{
        name: meal?.name || item.title,
        type: mealIdx === 0 ? 'breakfast' : mealIdx === 1 ? 'lunch' : mealIdx === 2 ? 'dinner' : 'snack',
        description: meal?.name || item.title,
        proteinLevel: totals.protein >= 30 ? 'hoch' : totals.protein >= 15 ? 'mittel' : 'niedrig',
        estimatedProtein: Math.round(totals.protein),
        estimatedCalories: Math.round(totals.calories),
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        customIngredients: ingredients.map(ing => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          protein_per_100: ing.protein_per_100,
          calories_per_100: ing.calories_per_100,
        })),
      }],
      estimatedProteinTotal: Math.round(totals.protein),
      qualityRating: totals.protein >= 25 ? 'gut' : 'okay',
    });

    toast.success('Mit angepassten Zutaten geloggt');
    if (navigator.vibrate) navigator.vibrate([10]);
  }, [today, setGoalPlan, addActivityLog, addNutritionLog, getMealData]);

  // Don't render if no plan items
  if (items.length === 0) return null;

  const allDone = allItems.length > 0 && allItems.every(i => i.isLogged || i.isSkipped);

  // All done: collapsed confirmation
  if (allDone) {
    return (
      <div className="flex items-center gap-2 px-1 py-2">
        <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
          <Check className="w-3 h-3 text-primary" />
        </div>
        <span className="text-xs font-medium text-muted-foreground/70">
          Heutige Pläne erledigt
        </span>
        <button
          onClick={() => navigate('/app/zielsystem')}
          className="ml-auto text-[10px] text-muted-foreground/40 hover:text-primary transition-colors flex items-center gap-0.5"
        >
          Alle Pläne
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const primary = items[0];
  const secondary = items.slice(1);

  // Meal data for customize sheet
  const customizeMealData = customizeItem ? getMealData(customizeItem) : null;

  // Check if user has ever logged anything (for first-use hint)
  const hasNeverLogged = showFirstUseHint && allItems.every(i => !i.isLogged && !i.isSkipped);

  return (
    <div className="space-y-2.5">
      {/* Section header */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
          Heute aus deinen Plänen
        </span>
        <button
          onClick={() => navigate('/app/zielsystem')}
          className="text-[10px] text-muted-foreground/40 hover:text-primary transition-colors flex items-center gap-0.5"
        >
          Alle Pläne
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Primary item -- tappable for meals, loggen button for non-meals */}
      <PrimaryPlanItem
        item={primary}
        onLog={handleLog}
        onNavigate={() => navigate(`/app/zielsystem?pillar=${primary.pillar}`)}
        onMealTap={primary.type === 'meal' ? () => handleMealTap(primary) : undefined}
        showHint={hasNeverLogged && primary.type === 'meal'}
      />

      {/* Secondary items -- tappable for meals */}
      {secondary.length > 0 && (
        <div className="space-y-1">
          {secondary.map(item => (
            <SecondaryPlanItem
              key={item.id}
              item={item}
              onLog={handleLog}
              onMealTap={item.type === 'meal' ? () => handleMealTap(item) : undefined}
              onNavigate={() => navigate(`/app/zielsystem?pillar=${item.pillar}`)}
            />
          ))}
        </div>
      )}

      {/* QuickMealLogSheet -- canonical meal logging */}
      <QuickMealLogSheet
        open={quickSheetOpen}
        onOpenChange={setQuickSheetOpen}
        meal={quickMealData}
        onEat={handleQuickEat}
        onSwap={handleQuickSwap}
        onCustomize={quickMealData?.nutritionIngredients?.length ? handleQuickCustomize : undefined}
        onSkip={handleQuickSkip}
      />

      {/* Meal Customize Sheet (one level deep from QuickMealLogSheet) */}
      {customizeItem && customizeMealData?.nutritionIngredients && (
        <MealCustomizeSheet
          open={!!customizeItem}
          onOpenChange={open => { if (!open) setCustomizeItem(null); }}
          mealName={customizeMealData.name || customizeItem.title}
          ingredients={customizeMealData.nutritionIngredients}
          originalProtein={customizeMealData.protein || 0}
          originalCalories={customizeMealData.calories || 0}
          onConfirm={(ings, totals) => handleCustomizeComplete(customizeItem, ings, totals)}
        />
      )}
    </div>
  );
}

// Primary item -- meal cards are tappable (no inline action buttons)
function PrimaryPlanItem({ item, onLog, onNavigate, onMealTap, showHint }: {
  item: DailyPlanItem;
  onLog: (i: DailyPlanItem) => void;
  onNavigate: () => void;
  onMealTap?: () => void;
  showHint?: boolean;
}) {
  const Icon = PILLAR_ICONS[item.pillar] || Activity;
  const accentBorder = PILLAR_ACCENT[item.pillar] || 'border-l-primary';
  const iconColor = PILLAR_ICON_COLOR[item.pillar] || 'text-primary';
  const sourceLabel = PILLAR_LABEL[item.pillar] || 'Plan';
  const isMeal = item.type === 'meal';
  const isDone = item.isLogged || item.isSkipped;

  return (
    <div
      className={cn(
        'rounded-xl border-l-[3px] p-3.5 transition-all',
        isDone
          ? 'border-l-primary/30 bg-primary/5 opacity-70'
          : item.isSkipped
            ? 'border-l-muted/30 opacity-50'
            : accentBorder,
        !isDone && 'cursor-pointer active:scale-[0.98]',
      )}
      style={!isDone ? { background: 'var(--gradient-card)' } : undefined}
      onClick={!isDone ? (isMeal && onMealTap ? onMealTap : () => onLog(item)) : undefined}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn('w-4.5 h-4.5 shrink-0', isDone ? 'text-muted-foreground/50' : iconColor)} />

        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-[13px] font-semibold leading-tight truncate',
            isDone ? 'line-through text-muted-foreground/60' : 'text-foreground',
          )}>
            {item.title}
          </p>
          {item.subtitle && (
            <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{item.subtitle}</p>
          )}
          {/* First-use hint */}
          {showHint && !isDone && (
            <p className="text-[9px] text-primary/70 mt-1 animate-pulse">Tippe zum Loggen</p>
          )}
        </div>

        {/* Duration chip */}
        {item.duration && item.duration > 0 && !isDone && (
          <span className="text-[9px] text-muted-foreground/50 bg-secondary/30 px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
            {item.duration} Min
          </span>
        )}

        {/* Done indicator */}
        {isDone && (
          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-primary" />
          </div>
        )}

        {/* Chevron for tappable items */}
        {!isDone && (
          <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
        )}
      </div>

      {/* Source label */}
      <button
        onClick={(e) => { e.stopPropagation(); onNavigate(); }}
        className="text-[9px] text-muted-foreground/40 hover:text-primary mt-1.5 ml-7.5 transition-colors"
      >
        Aus deinem {sourceLabel}
      </button>
    </div>
  );
}

// Secondary item: compact inline row -- meal rows tappable (no inline buttons)
function SecondaryPlanItem({ item, onLog, onMealTap, onNavigate }: {
  item: DailyPlanItem;
  onLog: (i: DailyPlanItem) => void;
  onMealTap?: () => void;
  onNavigate: () => void;
}) {
  const Icon = PILLAR_ICONS[item.pillar] || Activity;
  const iconColor = PILLAR_ICON_COLOR[item.pillar] || 'text-primary';
  const isMeal = item.type === 'meal';
  const isDone = item.isLogged || item.isSkipped;

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-1 py-1.5',
        !isDone && 'cursor-pointer active:scale-[0.98] transition-all hover:bg-white/5 rounded-lg',
      )}
      onClick={!isDone ? (isMeal && onMealTap ? onMealTap : () => onLog(item)) : undefined}
    >
      <Icon className={cn('w-3.5 h-3.5 shrink-0', isDone ? 'text-muted-foreground/40' : iconColor)} />

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-[11px] font-medium leading-tight truncate',
          isDone ? 'line-through text-muted-foreground/50' : 'text-foreground/80',
        )}>
          {item.title}
        </p>
      </div>

      {/* Duration */}
      {item.duration && item.duration > 0 && !isDone && (
        <span className="text-[8px] text-muted-foreground/40 shrink-0 whitespace-nowrap">
          {item.duration} Min
        </span>
      )}

      {/* Status */}
      {isDone ? (
        <Check className="w-3 h-3 text-primary/60 shrink-0" />
      ) : (
        <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />
      )}
    </div>
  );
}
