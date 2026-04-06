import { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { NutritionLogMealIngredient } from '@/contexts/AppContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, Apple, Moon, Brain, Plus, Check, ChevronDown, ChevronUp, ClipboardList, Lock, Sparkles, Dumbbell, SlidersHorizontal, X, ArrowLeftRight, MoreHorizontal, Egg, Flame } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ActivityLogSheet from '@/components/app/ActivityLogSheet';
import QuickTrackSheet from '@/components/app/QuickTrackSheet';
import PillarActivationSheet from '@/components/app/PillarActivationSheet';
import ExerciseDetailForm, { createEmptyExercise, exerciseEntriesToTrainingExercises, type ExerciseEntry } from '@/components/app/ExerciseDetailForm';
import { recommendNextPillar, type PillarKey, type NextPillarRecommendation } from '@/lib/focusPillar';
import { generatePillarPlan } from '@/lib/pillarPlanHelpers';
import { calcMealNutrition, type MealIngredient } from '@/lib/pillarPlans';
import MealSwapSheet from '@/components/app/MealSwapSheet';
import MealCustomizeSheet from '@/components/app/MealCustomizeSheet';
import type { SwapCandidate } from '@/lib/mealSwap';
import { loadPreferenceProfile } from '@/lib/mealPreferences';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PILLAR_META = [
  { key: 'bewegung' as PillarKey, label: 'Bewegung', icon: Activity },
  { key: 'ernaehrung' as PillarKey, label: 'Ernährung', icon: Apple },
  { key: 'regeneration' as PillarKey, label: 'Recovery', icon: Moon },
  { key: 'mental' as PillarKey, label: 'Mental', icon: Brain },
];

export default function AppMyPlans() {
  const { goalPlan, setGoalPlan, pillarScores, activityLog, addActivityLog, addNutritionLog, addTrainingLog, trainingLogs } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep-link tab support: read ?tab= param on mount
  const tabParam = searchParams.get('tab') as PillarKey | null;
  const [activeTab, setActiveTab] = useState<string>(tabParam || '');

  // Once activePillars are known, resolve the initial tab and consume the URL param
  const resolvedTab = useMemo(() => {
    const validTabs: PillarKey[] = ['bewegung', 'ernaehrung', 'regeneration', 'mental'];
    if (activeTab && validTabs.includes(activeTab as PillarKey)) return activeTab;
    return '';
  }, [activeTab]);

  // Consume the ?tab= param from URL so back-navigation works naturally
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
      setSearchParams({}, { replace: true });
    }
  }, [tabParam, setSearchParams]);

  const [activityOpen, setActivityOpen] = useState(false);
  const [quickTrackPillar, setQuickTrackPillar] = useState<PillarKey | null>(null);
  const [activationSheetOpen, setActivationSheetOpen] = useState(false);
  const [activationPillar, setActivationPillar] = useState<PillarKey | null>(null);
  const [expandedTraining, setExpandedTraining] = useState<number | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [expandedNutritionDay, setExpandedNutritionDay] = useState<number | null>(null);
  // Swap & customize sheet state for nutrition tab
  const [swapMealState, setSwapMealState] = useState<{ dayIdx: number; mealIdx: number } | null>(null);
  const [customizeMealState, setCustomizeMealState] = useState<{ dayIdx: number; mealIdx: number } | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();
  const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const activePillars = useMemo<PillarKey[]>(() => {
    if (!goalPlan?.activePillars || goalPlan.activePillars.length === 0) {
      return ['bewegung', 'ernaehrung', 'regeneration', 'mental'] as PillarKey[];
    }
    return goalPlan.activePillars as PillarKey[];
  }, [goalPlan?.activePillars]);

  const inactivePillars = useMemo(() => {
    const all: PillarKey[] = ['bewegung', 'ernaehrung', 'regeneration', 'mental'];
    return all.filter(p => !activePillars.includes(p));
  }, [activePillars]);

  const hasProgressiveSystem = goalPlan?.activePillars && goalPlan.activePillars.length > 0 && goalPlan.activePillars.length < 4;

  const checkIns: Record<string, string> = (goalPlan?.planCheckInHistory?.[today] as any) || {};
  const trainingPlan = goalPlan?.trainingPlanData;
  const nutritionPlan = goalPlan?.nutritionPlan;
  const recoveryTips: any[] = goalPlan?.recoveryTips || [];
  const mentalTips: any[] = goalPlan?.mentalTips || [];

  const toggleCheck = useCallback((key: string) => {
    const currentlyChecked = checkIns[key] === 'done';
    setGoalPlan(prev => {
      if (!prev) return prev;
      const history = { ...(prev.planCheckInHistory || {}) };
      const dayChecks = { ...(history[today] || {}) } as Record<string, 'done' | 'partial' | 'skipped'>;
      if (dayChecks[key] === 'done') {
        delete dayChecks[key];
      } else {
        dayChecks[key] = 'done';
      }
      history[today] = dayChecks;
      return { ...prev, planCheckInHistory: history };
    });
    // Log to activityLog only when marking done, not when undoing
    if (!currentlyChecked) {
      if (key.startsWith('training_')) {
        const idx = parseInt(key.replace('training_', ''));
        const day = trainingPlan?.days?.[idx];
        if (day?.isTraining) {
          addActivityLog({ pillar: 'bewegung', type: 'plan_training', label: day.sessionType || 'Training', duration: day.duration || 45, source: 'plan' });
        }
      } else if (key.startsWith('meal_')) {
        const parts = key.split('_');
        const dayIdx = parseInt(parts[1]);
        const mealIdx = parseInt(parts[2]);
        const meal = nutritionPlan?.days?.[dayIdx]?.meals?.[mealIdx];
        if (meal) {
          addActivityLog({ pillar: 'ernaehrung', type: 'plan_meal', label: meal.name || 'Mahlzeit', duration: 0, source: 'plan' });
          // Also log nutrition data so the ernaehrung pillar score reacts via protein tracking
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
              status: 'eaten' as const,
            }],
            estimatedProteinTotal: meal.protein || 0,
            qualityRating: 'gut',
          });
        }
      } else if (key.startsWith('recovery_')) {
        const idx = parseInt(key.replace('recovery_', ''));
        const tip = recoveryTips[idx];
        if (tip) {
          addActivityLog({ pillar: 'regeneration', type: 'plan_recovery', label: tip.title || 'Recovery', duration: 20, source: 'plan' });
        }
      } else if (key.startsWith('mental_')) {
        const idx = parseInt(key.replace('mental_', ''));
        const tip = mentalTips[idx];
        if (tip) {
          addActivityLog({ pillar: 'mental', type: 'plan_mental', label: tip.title || 'Mental', duration: 10, source: 'plan' });
        }
      }
    }
    if (navigator.vibrate) navigator.vibrate([10]);
  }, [checkIns, today, trainingPlan, nutritionPlan, recoveryTips, mentalTips, setGoalPlan, addActivityLog, addNutritionLog]);

  // Save training with exercise details (Tier 2 logging)
  const handleSaveTrainingDetails = useCallback((dayIndex: number, exerciseEntries: ExerciseEntry[], duration: number) => {
    const day = trainingPlan?.days?.[dayIndex];
    if (!day?.isTraining) return;

    // 1. Mark as checked (same as toggleCheck for training)
    const currentlyChecked = checkIns[`training_${dayIndex}`] === 'done';
    if (!currentlyChecked) {
      setGoalPlan(prev => {
        if (!prev) return prev;
        const history = { ...(prev.planCheckInHistory || {}) };
        const dayChecks = { ...(history[today] || {}) } as Record<string, 'done' | 'partial' | 'skipped'>;
        dayChecks[`training_${dayIndex}`] = 'done';
        history[today] = dayChecks;
        return { ...prev, planCheckInHistory: history };
      });

      // 2. Log activity for pillar scoring
      addActivityLog({ pillar: 'bewegung', type: 'plan_training', label: day.sessionType || 'Training', duration: duration, source: 'plan' });
    }

    // 3. Save detailed training log
    const validExercises = exerciseEntriesToTrainingExercises(exerciseEntries);
    if (validExercises.length > 0) {
      addTrainingLog({
        date: today,
        exercises: validExercises,
        duration,
        type: day.sessionType || 'Kraft',
        source: 'plan',
        planSessionType: day.sessionType,
      });
      toast.success('Training mit Details gespeichert!');
    } else {
      toast.success('Training als erledigt markiert!');
    }

    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
  }, [checkIns, today, trainingPlan, setGoalPlan, addActivityLog, addTrainingLog]);

  // Custom meal log with edited ingredients (Tier 3)
  const handleCustomMealLog = useCallback((dayIdx: number, mealIdx: number, ingredients: MealIngredient[], protein: number, calories: number) => {
    const meal = nutritionPlan?.days?.[dayIdx]?.meals?.[mealIdx];
    if (!meal) return;

    const mealKey = `meal_${dayIdx}_${mealIdx}`;
    const currentlyChecked = checkIns[mealKey] === 'done';

    // Mark as checked
    if (!currentlyChecked) {
      setGoalPlan(prev => {
        if (!prev) return prev;
        const history = { ...(prev.planCheckInHistory || {}) };
        const dayChecks = { ...(history[today] || {}) } as Record<string, 'done' | 'partial' | 'skipped'>;
        dayChecks[mealKey] = 'done';
        history[today] = dayChecks;
        return { ...prev, planCheckInHistory: history };
      });

      // Log activity
      addActivityLog({ pillar: 'ernaehrung', type: 'plan_meal', label: meal.name || 'Mahlzeit', duration: 0, source: 'plan' });

      // Log nutrition with custom values
      const customIngredients: NutritionLogMealIngredient[] = ingredients.map(ing => ({
        name: ing.name, amount: ing.amount, unit: ing.unit,
        protein_per_100: ing.protein_per_100, calories_per_100: ing.calories_per_100,
      }));

      addNutritionLog({
        date: today,
        meals: [{
          name: meal.name || 'Mahlzeit',
          type: mealIdx === 0 ? 'breakfast' : mealIdx === 1 ? 'lunch' : mealIdx === 2 ? 'dinner' : 'snack',
          description: meal.name || '',
          proteinLevel: protein >= 30 ? 'hoch' : protein >= 15 ? 'mittel' : 'niedrig',
          estimatedProtein: protein,
          time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          customIngredients,
          estimatedCalories: calories,
          status: 'eaten' as const,
        }],
        estimatedProteinTotal: protein,
        qualityRating: protein >= 30 ? 'sehr_gut' : protein >= 15 ? 'gut' : 'okay',
      });

      toast.success(`${meal.name} mit angepassten Werten gespeichert`);
    }

    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
  }, [checkIns, today, nutritionPlan, setGoalPlan, addActivityLog, addNutritionLog]);

  // Swap a planned meal for an alternative
  const handleSwapMeal = useCallback((dayIdx: number, mealIdx: number, recipe: SwapCandidate['recipe']) => {
    const meal = nutritionPlan?.days?.[dayIdx]?.meals?.[mealIdx];
    if (!meal) return;
    const mt = mealIdx === 0 ? 'breakfast' : mealIdx === 1 ? 'lunch' : mealIdx === 2 ? 'dinner' : 'snack';
    addNutritionLog({
      date: today,
      meals: [{
        name: recipe.name, type: mt, description: recipe.name,
        proteinLevel: recipe.protein >= 30 ? 'hoch' : recipe.protein >= 15 ? 'mittel' : 'niedrig',
        estimatedProtein: recipe.protein, estimatedCalories: recipe.calories,
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        status: 'swapped' as const, swappedFrom: meal.name,
      }],
      estimatedProteinTotal: recipe.protein,
      qualityRating: 'gut',
    });
    const mealKey = `meal_${dayIdx}_${mealIdx}`;
    setGoalPlan(prev => {
      if (!prev) return prev;
      const history = { ...(prev.planCheckInHistory || {}) };
      const dayChecks = { ...(history[today] || {}) } as Record<string, 'done' | 'partial' | 'skipped'>;
      dayChecks[mealKey] = 'done';
      history[today] = dayChecks;
      return { ...prev, planCheckInHistory: history };
    });
    addActivityLog({ pillar: 'ernaehrung', type: 'plan_meal', label: recipe.name, duration: 0, source: 'plan' });
    setSwapMealState(null);
    toast.success(`Getauscht: ${recipe.name}`);
    if (navigator.vibrate) navigator.vibrate([10]);
  }, [nutritionPlan, today, addNutritionLog, setGoalPlan, addActivityLog]);

  // Customize sheet complete handler for nutrition tab
  const handleCustomizeSheetComplete = useCallback((dayIdx: number, mealIdx: number, ingredients: MealIngredient[], totals: { protein: number; calories: number }) => {
    handleCustomMealLog(dayIdx, mealIdx, ingredients, Math.round(totals.protein), Math.round(totals.calories));
    setCustomizeMealState(null);
  }, [handleCustomMealLog]);

  // Skip a planned meal
  const handleSkipMeal = useCallback((dayIdx: number, mealIdx: number) => {
    const mealKey = `meal_${dayIdx}_${mealIdx}`;
    setGoalPlan(prev => {
      if (!prev) return prev;
      const history = { ...(prev.planCheckInHistory || {}) };
      const dayChecks = { ...(history[today] || {}) } as Record<string, 'done' | 'partial' | 'skipped'>;
      dayChecks[mealKey] = 'skipped';
      history[today] = dayChecks;
      return { ...prev, planCheckInHistory: history };
    });
    toast('Mahlzeit übersprungen');
  }, [today, setGoalPlan]);

  const isChecked = (key: string) => checkIns[key] === 'done';
  const isSkipped = (key: string) => checkIns[key] === 'skipped';

  const hasAnyPlan = !!(trainingPlan || nutritionPlan || recoveryTips.length || mentalTips.length);

  // Stats per pillar
  const trainingDone = trainingPlan ? trainingPlan.days.filter((_d: any, i: number) => _d.isTraining && isChecked(`training_${i}`)).length : 0;
  const trainingTotal = trainingPlan ? trainingPlan.days.filter((d: any) => d.isTraining).length : 0;
  const recoveryDone = recoveryTips.filter((_: any, i: number) => isChecked(`recovery_${i}`)).length;
  const mentalDone = mentalTips.filter((_: any, i: number) => isChecked(`mental_${i}`)).length;

  // Nutrition stats for today
  const todayNutritionDay = nutritionPlan?.days?.[todayIdx];
  const todayMealsDone = todayNutritionDay ? todayNutritionDay.meals.filter((_: any, mi: number) => isChecked(`meal_${todayIdx}_${mi}`)).length : 0;
  const todayMealsTotal = todayNutritionDay?.meals?.length || 0;

  // Tab completion counts for badges
  const pillarCompletionCounts = useMemo(() => {
    return {
      bewegung: trainingDone,
      ernaehrung: todayMealsDone,
      regeneration: recoveryDone,
      mental: mentalDone,
    };
  }, [trainingDone, todayMealsDone, recoveryDone, mentalDone]);

  // Pillar activation handler
  const handlePillarActivate = useCallback((pillar: PillarKey, answers: Record<string, any>) => {
    // Inject meal preferences for nutrition plan generation
    const enrichedAnswers = pillar === 'ernaehrung' && user?.id
      ? { ...answers, mealPrefs: loadPreferenceProfile(user.id) ?? undefined }
      : answers;

    setGoalPlan(prev => {
      if (!prev) return prev;
      const newActivePillars = [...(prev.activePillars || []), pillar];
      const newDates = { ...(prev.pillarActivationDates || {}), [pillar]: new Date().toISOString() };
      const newAnswers = { ...(prev.pillarActivationAnswers || {}), [pillar]: answers };
      const planUpdates = generatePillarPlan(pillar, enrichedAnswers, pillarScores[pillar], prev.goalType);

      return {
        ...prev,
        ...planUpdates,
        activePillars: newActivePillars,
        pillarActivationDates: newDates,
        pillarActivationAnswers: newAnswers,
      };
    });
    toast.success(`${PILLAR_META.find(p => p.key === pillar)?.label} aktiviert!`);
  }, [setGoalPlan, pillarScores, user]);

  // Get recommendation for inactive pillars
  const nextRecommendation = useMemo<NextPillarRecommendation | null>(() => {
    if (inactivePillars.length === 0 || !goalPlan?.goalType) return null;
    return recommendNextPillar(activePillars, pillarScores, goalPlan.goalType, activityLog);
  }, [inactivePillars, goalPlan, activePillars, pillarScores, activityLog]);

  // Auto-expand today's nutrition day
  const effectiveExpandedNutritionDay = expandedNutritionDay !== null ? expandedNutritionDay : todayIdx;

  if (!hasAnyPlan && inactivePillars.length === 0) {
    return (
      <div className="px-4 pt-6 pb-24 animate-enter">
        <h1 className="font-outfit text-xl font-bold text-foreground mb-6">Meine Pläne</h1>
        <div className="rounded-2xl border border-border/30 p-8 text-center space-y-4" style={{ background: 'var(--gradient-card)' }}>
          <ClipboardList className="w-12 h-12 text-primary/20 mx-auto" />
          <p className="text-sm text-muted-foreground">Erstelle deinen ersten Plan im Ziel-Tab</p>
          <button onClick={() => navigate('/app/zielsystem')} className="text-sm text-primary font-semibold active:scale-95 transition-transform">
            Zum Zielsystem
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24 animate-enter">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-outfit text-xl font-bold text-foreground">Meine Pläne</h1>
        {hasProgressiveSystem && (
          <span className="text-[10px] text-primary font-semibold bg-primary/10 px-2 py-1 rounded-full">
            {activePillars.length}/4 Säulen aktiv
          </span>
        )}
      </div>

      {/* Active Pillars Overview */}
      {hasProgressiveSystem && (
        <div className="flex gap-2 mb-4">
          {PILLAR_META.map(p => {
            const isActive = activePillars.includes(p.key);
            const Icon = p.icon;
            const score = pillarScores[p.key];
            return (
              <div
                key={p.key}
                className={cn(
                  'flex-1 rounded-xl border p-2 text-center transition-all',
                  isActive ? 'border-primary/25' : 'border-border/20 opacity-40',
                )}
                style={{ background: 'var(--gradient-card)', borderStyle: !isActive ? 'dashed' : undefined }}
              >
                <Icon className={cn('w-3.5 h-3.5 mx-auto mb-0.5', isActive ? 'text-primary' : 'text-muted-foreground/40')} />
                <p className="text-[9px] text-muted-foreground">{p.label}</p>
                {isActive ? (
                  <p className="font-outfit text-sm font-bold text-foreground">{score}</p>
                ) : (
                  <Lock className="w-2.5 h-2.5 text-muted-foreground/30 mx-auto mt-0.5" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pillar Tabs */}
      <Tabs value={resolvedTab || activePillars[0] || 'bewegung'} onValueChange={setActiveTab} className="space-y-3">
        <TabsList className={cn('w-full bg-secondary/30 border border-border/20 rounded-xl h-10', { 'grid-cols-1': activePillars.length === 1, 'grid-cols-2': activePillars.length === 2, 'grid-cols-3': activePillars.length === 3, 'grid-cols-4': activePillars.length >= 4 }, 'grid')}>
          {PILLAR_META.filter(p => activePillars.includes(p.key)).map(p => {
            const count = pillarCompletionCounts[p.key] || 0;
            return (
              <TabsTrigger key={p.key} value={p.key} className="text-[10px] gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg relative">
                <p.icon className="w-3 h-3" />{p.label}
                {count > 0 && (
                  <span className="absolute -top-1 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* BEWEGUNG TAB */}
        {activePillars.includes('bewegung') && (
          <TabsContent value="bewegung">
            {trainingPlan ? (
              <div className="space-y-3">
                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted-foreground">{trainingPlan.title}</span>
                    <span className="text-[10px] text-primary font-semibold">{trainingDone}/{trainingTotal}</span>
                  </div>
                  <div className="h-1 rounded-full bg-secondary/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: trainingTotal > 0 ? `${(trainingDone / trainingTotal) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                {/* Heute section */}
                {trainingPlan.days[todayIdx] && (
                  <>
                    <SectionLabel label="Heute" />
                    <TrainingDayCard
                      day={trainingPlan.days[todayIdx]}
                      index={todayIdx}
                      isToday={true}
                      isChecked={isChecked(`training_${todayIdx}`)}
                      isExpanded={expandedTraining === todayIdx}
                      onToggleCheck={() => toggleCheck(`training_${todayIdx}`)}
                      onToggleExpand={() => setExpandedTraining(expandedTraining === todayIdx ? null : todayIdx)}
                      onSaveDetails={(ex, dur) => handleSaveTrainingDetails(todayIdx, ex, dur)}
                      trainingLogs={trainingLogs}
                    />
                  </>
                )}

                {/* Diese Woche section */}
                {trainingPlan.days.filter((_: any, i: number) => i !== todayIdx).length > 0 && (
                  <>
                    <SectionLabel label="Diese Woche" />
                    {trainingPlan.days.map((day: any, i: number) => {
                      if (i === todayIdx) return null;
                      return (
                        <TrainingDayCard
                          key={i}
                          day={day}
                          index={i}
                          isToday={false}
                          isChecked={isChecked(`training_${i}`)}
                          isExpanded={expandedTraining === i}
                          onToggleCheck={() => toggleCheck(`training_${i}`)}
                          onToggleExpand={() => setExpandedTraining(expandedTraining === i ? null : i)}
                          onSaveDetails={(ex, dur) => handleSaveTrainingDetails(i, ex, dur)}
                          trainingLogs={trainingLogs}
                        />
                      );
                    })}
                  </>
                )}
              </div>
            ) : <EmptyPillar pillar="bewegung" onNavigate={() => navigate('/app/zielsystem')} />}
          </TabsContent>
        )}

        {/* ERNAEHRUNG TAB */}
        {activePillars.includes('ernaehrung') && (
          <TabsContent value="ernaehrung">
            {nutritionPlan ? (
              <div className="space-y-3">
                {/* Progress bar for today */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted-foreground">{nutritionPlan.title}</span>
                    <span className="text-[10px] text-primary font-semibold">Heute: {todayMealsDone}/{todayMealsTotal}</span>
                  </div>
                  <div className="h-1 rounded-full bg-secondary/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-400 transition-all duration-500"
                      style={{ width: todayMealsTotal > 0 ? `${(todayMealsDone / todayMealsTotal) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                {/* Heute section - always expanded */}
                {todayNutritionDay && (
                  <>
                    <SectionLabel label="Heute" />
                    <NutritionDayCard
                      day={todayNutritionDay}
                      dayIdx={todayIdx}
                      isToday={true}
                      isExpanded={true}
                      isChecked={isChecked}
                      isSkipped={isSkipped}
                      expandedMeal={expandedMeal}
                      onToggleCheck={toggleCheck}
                      onToggleMeal={(key) => setExpandedMeal(expandedMeal === key ? null : key)}
                      onToggleDay={() => {}}
                      onCustomLog={handleCustomMealLog}
                      onSwap={(dayIdx, mealIdx) => setSwapMealState({ dayIdx, mealIdx })}
                      onCustomize={(dayIdx, mealIdx) => setCustomizeMealState({ dayIdx, mealIdx })}
                      onSkip={handleSkipMeal}
                    />
                  </>
                )}

                {/* Diese Woche - collapsed by default */}
                {nutritionPlan.days.filter((_: any, i: number) => i !== todayIdx).length > 0 && (
                  <>
                    <SectionLabel label="Diese Woche" />
                    {nutritionPlan.days.map((day: any, dayIdx: number) => {
                      if (dayIdx === todayIdx) return null;
                      const isExpanded = effectiveExpandedNutritionDay === dayIdx;
                      return (
                        <NutritionDayCard
                          key={dayIdx}
                          day={day}
                          dayIdx={dayIdx}
                          isToday={false}
                          isExpanded={isExpanded}
                          isChecked={isChecked}
                          isSkipped={isSkipped}
                          expandedMeal={expandedMeal}
                          onToggleCheck={toggleCheck}
                          onToggleMeal={(key) => setExpandedMeal(expandedMeal === key ? null : key)}
                          onToggleDay={() => setExpandedNutritionDay(isExpanded ? null : dayIdx)}
                          onCustomLog={handleCustomMealLog}
                          onSwap={(dayIdx, mealIdx) => setSwapMealState({ dayIdx, mealIdx })}
                          onCustomize={(dayIdx, mealIdx) => setCustomizeMealState({ dayIdx, mealIdx })}
                          onSkip={handleSkipMeal}
                        />
                      );
                    })}
                  </>
                )}
              </div>
            ) : <EmptyPillar pillar="ernaehrung" onNavigate={() => navigate('/app/zielsystem')} />}
          </TabsContent>
        )}

        {/* REGENERATION TAB */}
        {activePillars.includes('regeneration') && (
          <TabsContent value="regeneration">
            {recoveryTips.length > 0 ? (
              <div className="space-y-3">
                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted-foreground">Taegliche Recovery-Tipps</span>
                    <span className="text-[10px] text-blue-400 font-semibold">{recoveryDone}/{recoveryTips.length}</span>
                  </div>
                  <div className="h-1 rounded-full bg-secondary/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-400 transition-all duration-500"
                      style={{ width: recoveryTips.length > 0 ? `${(recoveryDone / recoveryTips.length) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                {recoveryTips.map((tip: any, i: number) => (
                  <ChecklistCard key={tip.id || i} label={tip.title} description={tip.text} category={tip.category} checked={isChecked(`recovery_${i}`)} onToggle={() => toggleCheck(`recovery_${i}`)} accentColor="blue" />
                ))}
              </div>
            ) : <EmptyPillar pillar="regeneration" onNavigate={() => navigate('/app/zielsystem')} />}
          </TabsContent>
        )}

        {/* MENTAL TAB */}
        {activePillars.includes('mental') && (
          <TabsContent value="mental">
            {mentalTips.length > 0 ? (
              <div className="space-y-3">
                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted-foreground">Taegliche Mental-Tipps</span>
                    <span className="text-[10px] text-purple-400 font-semibold">{mentalDone}/{mentalTips.length}</span>
                  </div>
                  <div className="h-1 rounded-full bg-secondary/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-400 transition-all duration-500"
                      style={{ width: mentalTips.length > 0 ? `${(mentalDone / mentalTips.length) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                {mentalTips.map((tip: any, i: number) => (
                  <ChecklistCard key={tip.id || i} label={tip.title} description={tip.text} category={tip.category} checked={isChecked(`mental_${i}`)} onToggle={() => toggleCheck(`mental_${i}`)} accentColor="purple" />
                ))}
              </div>
            ) : <EmptyPillar pillar="mental" onNavigate={() => navigate('/app/zielsystem')} />}
          </TabsContent>
        )}
      </Tabs>

      {/* Locked Pillars Section */}
      {inactivePillars.length > 0 && (
        <div className="mt-6 space-y-3">
          <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Noch nicht aktiv</span>
          {inactivePillars.map(pillarKey => {
            const meta = PILLAR_META.find(p => p.key === pillarKey)!;
            const Icon = meta.icon;
            const score = pillarScores[pillarKey];
            const isRecommended = nextRecommendation?.recommended === pillarKey;
            return (
              <div
                key={pillarKey}
                className="rounded-xl border border-border/20 p-4 opacity-60"
                style={{ background: 'var(--gradient-card)', borderStyle: 'dashed' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground/50" />
                      <span className="text-xs font-semibold text-muted-foreground">{meta.label}</span>
                      <span className="text-[10px] text-muted-foreground/50">Score: {score}</span>
                    </div>
                    {isRecommended && nextRecommendation && (
                      <p className="text-[10px] text-primary/70 mt-0.5 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        CALI empfiehlt diese Saeule als naechstes
                      </p>
                    )}
                    {!isRecommended && (
                      <p className="text-[10px] text-muted-foreground/40 mt-0.5">Wird freigeschaltet wenn du bereit bist</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7"
                    onClick={() => {
                      setActivationPillar(pillarKey);
                      setActivationSheetOpen(true);
                    }}
                  >
                    Jetzt aktivieren
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating + button */}
      <button
        onClick={() => setActivityOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-90 transition-transform z-40"
        style={{ boxShadow: '0 4px 20px hsl(142 76% 46% / 0.3)' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      <ActivityLogSheet open={activityOpen} onOpenChange={setActivityOpen} />

      {/* Meal Swap Sheet */}
      {swapMealState && (() => {
        const meal = nutritionPlan?.days?.[swapMealState.dayIdx]?.meals?.[swapMealState.mealIdx];
        if (!meal) return null;
        return (
          <MealSwapSheet
            open={true}
            onOpenChange={open => { if (!open) setSwapMealState(null); }}
            mealName={meal.name || ''}
            mealId={meal.id || ''}
            mealIndex={swapMealState.mealIdx}
            protein={meal.protein || 0}
            calories={meal.calories || 0}
            onSwap={recipe => handleSwapMeal(swapMealState.dayIdx, swapMealState.mealIdx, recipe)}
          />
        );
      })()}

      {/* Meal Customize Sheet */}
      {customizeMealState && (() => {
        const meal = nutritionPlan?.days?.[customizeMealState.dayIdx]?.meals?.[customizeMealState.mealIdx];
        if (!meal?.nutritionIngredients?.length) { setCustomizeMealState(null); return null; }
        return (
          <MealCustomizeSheet
            open={true}
            onOpenChange={open => { if (!open) setCustomizeMealState(null); }}
            mealName={meal.name || ''}
            ingredients={meal.nutritionIngredients}
            originalProtein={meal.protein || 0}
            originalCalories={meal.calories || 0}
            onConfirm={(ings, totals) => handleCustomizeSheetComplete(customizeMealState.dayIdx, customizeMealState.mealIdx, ings, totals)}
          />
        );
      })()}

      {quickTrackPillar && (
        <QuickTrackSheet
          open={!!quickTrackPillar}
          onOpenChange={(open) => { if (!open) setQuickTrackPillar(null); }}
          pillar={quickTrackPillar}
        />
      )}

      {activationPillar && (
        <PillarActivationSheet
          open={activationSheetOpen}
          onOpenChange={(open) => { if (!open) { setActivationSheetOpen(false); setActivationPillar(null); } }}
          pillar={activationPillar}
          onActivate={handlePillarActivate}
          recommendation={nextRecommendation?.recommended === activationPillar ? nextRecommendation : null}
        />
      )}
    </div>
  );
}

/* ─── Section Label ─── */
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-border/20" />
    </div>
  );
}

/* ─── Training Day Card ─── */
function TrainingDayCard({ day, index, isToday, isChecked, isExpanded, onToggleCheck, onToggleExpand, onSaveDetails, trainingLogs: tLogs }: {
  day: any; index: number; isToday: boolean; isChecked: boolean; isExpanded: boolean;
  onToggleCheck: () => void; onToggleExpand: () => void;
  onSaveDetails?: (exercises: ExerciseEntry[], duration: number) => void;
  trainingLogs?: import('@/contexts/AppContext').TrainingLog[];
}) {
  const [showDetailForm, setShowDetailForm] = useState(false);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([createEmptyExercise()]);
  const [duration, setDuration] = useState(day.duration || 45);

  const handleSaveDetails = () => {
    if (onSaveDetails) {
      onSaveDetails(exercises, duration);
    }
    setShowDetailForm(false);
    setExercises([createEmptyExercise()]);
  };

  // Pre-fill exercises from plan when opening detail form
  const openDetailForm = () => {
    if (day.exercises && day.exercises.length > 0) {
      setExercises(day.exercises.map((ex: any) => ({
        name: ex.name || '',
        sets: ex.sets || 3,
        reps: ex.reps || '10',
        weight: '',
        unit: 'kg' as const,
        note: '',
      })));
    }
    setDuration(day.duration || 45);
    setShowDetailForm(true);
  };

  return (
    <div className={cn(
      'rounded-xl border p-3 transition-all',
      isToday ? 'border-primary/30' : 'border-border/20',
      isChecked && 'opacity-60',
    )} style={{ background: day.isTraining ? 'linear-gradient(135deg, hsl(var(--primary) / 0.04), hsl(var(--primary) / 0.01))' : 'var(--gradient-card)' }}>
      <div className="flex items-center gap-3">
        {day.isTraining && (
          <button
            onClick={onToggleCheck}
            className={cn(
              'w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-200',
              isChecked ? 'bg-primary border-primary' : 'border-border/40 active:scale-90',
            )}
            style={{ minWidth: '28px', minHeight: '28px' }}
          >
            {isChecked && <Check className="w-4 h-4 text-primary-foreground animate-in zoom-in-50 duration-200" />}
          </button>
        )}
        <button onClick={onToggleExpand} className="flex-1 flex items-center gap-2 text-left min-w-0">
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0',
            day.isTraining ? 'bg-primary/10 text-primary' : 'bg-secondary/30 text-muted-foreground',
          )}>
            {day.day.slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-xs font-semibold truncate', isChecked ? 'line-through text-muted-foreground/60' : 'text-foreground')}>{day.sessionType}</p>
            {day.isTraining && (
              <span className="text-[10px] text-muted-foreground/70">{day.duration} Min</span>
            )}
          </div>
          {isToday && !isChecked && (
            <span className="text-[9px] bg-primary/15 text-primary font-semibold px-2 py-0.5 rounded-full shrink-0">Heute</span>
          )}
          {day.isTraining && (
            isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
          )}
        </button>
      </div>
      {isExpanded && day.isTraining && (
        <div className="mt-2.5 space-y-1 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {day.exercises.map((ex: any, j: number) => (
            <div key={j} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-secondary/20">
              <span className="text-[11px] text-foreground">{ex.name}</span>
              <span className="text-[10px] text-primary font-semibold">{ex.sets}x{ex.reps}</span>
            </div>
          ))}

          {/* Detail entry section */}
          {!isChecked && day.isTraining && (
            <>
              {!showDetailForm ? (
                <button
                  onClick={openDetailForm}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-primary/20 text-[11px] text-primary/70 font-medium hover:bg-primary/5 transition-all active:scale-[0.98]"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  Details eintragen
                </button>
              ) : (
                <div className="mt-3 space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                  <div className="rounded-xl border border-border/30 bg-card/60 p-3 space-y-3">
                    {/* Duration */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Dauer</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDuration(Math.max(5, duration - 5))}
                          className="w-6 h-6 rounded bg-secondary/30 text-muted-foreground text-xs flex items-center justify-center active:scale-90"
                        >-</button>
                        <span className="text-xs font-semibold text-primary w-12 text-center">{duration} Min</span>
                        <button
                          onClick={() => setDuration(Math.min(180, duration + 5))}
                          className="w-6 h-6 rounded bg-secondary/30 text-muted-foreground text-xs flex items-center justify-center active:scale-90"
                        >+</button>
                      </div>
                    </div>

                    {/* Exercise form */}
                    <ExerciseDetailForm
                      exercises={exercises}
                      onChange={setExercises}
                      trainingLogs={tLogs || []}
                      compact
                    />

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { onToggleCheck(); setShowDetailForm(false); }}
                        className="flex-1 py-2 rounded-lg border border-border/30 text-[11px] text-muted-foreground font-medium hover:bg-secondary/20 transition-all"
                      >
                        Ohne Details speichern
                      </button>
                      <button
                        onClick={handleSaveDetails}
                        className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-all active:scale-[0.98]"
                      >
                        Training speichern
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {!day.isTraining && day.movementSuggestion && (
        <p className="text-[10px] text-muted-foreground mt-1 pl-9">{day.movementSuggestion}</p>
      )}
    </div>
  );
}

/* ─── Nutrition Day Card ─── */
function NutritionDayCard({ day, dayIdx, isToday, isExpanded, isChecked, isSkipped, expandedMeal, onToggleCheck, onToggleMeal, onToggleDay, onCustomLog, onSwap, onCustomize, onSkip }: {
  day: any; dayIdx: number; isToday: boolean; isExpanded: boolean;
  isChecked: (key: string) => boolean; isSkipped?: (key: string) => boolean; expandedMeal: string | null;
  onToggleCheck: (key: string) => void; onToggleMeal: (key: string) => void; onToggleDay: () => void;
  onCustomLog?: (dayIdx: number, mealIdx: number, ingredients: MealIngredient[], protein: number, calories: number) => void;
  onSwap?: (dayIdx: number, mealIdx: number) => void;
  onCustomize?: (dayIdx: number, mealIdx: number) => void;
  onSkip?: (dayIdx: number, mealIdx: number) => void;
}) {
  const mealsDone = day.meals.filter((_: any, mi: number) => isChecked(`meal_${dayIdx}_${mi}`)).length;
  const [customizingMeal, setCustomizingMeal] = useState<number | null>(null);
  const [mealActionsOpen, setMealActionsOpen] = useState<number | null>(null);

  return (
    <div className={cn('rounded-xl border transition-all', isToday ? 'border-primary/30' : 'border-border/20')} style={{ background: 'var(--gradient-card)' }}>
      {/* Day header - clickable to expand/collapse for non-today */}
      <button
        onClick={!isToday ? onToggleDay : undefined}
        className={cn('w-full flex items-center justify-between p-3', !isToday && 'cursor-pointer')}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{day.day}</span>
          {isToday && <span className="text-[9px] bg-primary/15 text-primary font-semibold px-2 py-0.5 rounded-full">Heute</span>}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{day.totalCalories} kcal</span>
          <span className="text-orange-400 font-semibold">{day.totalProtein}g P</span>
          <span className={cn(mealsDone === day.meals.length && mealsDone > 0 && 'text-primary font-semibold')}>{mealsDone}/{day.meals.length}</span>
          {!isToday && (isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
        </div>
      </button>

      {/* Meals - shown when expanded */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {day.meals.map((meal: any, mealIdx: number) => {
            const mealKey = `meal_${dayIdx}_${mealIdx}`;
            const mealChecked = isChecked(mealKey);
            const mealSkipped = isSkipped ? isSkipped(mealKey) : false;
            const detailKey = `${dayIdx}-${mealIdx}`;
            const showDetail = expandedMeal === detailKey;
            const isCustomizing = customizingMeal === mealIdx;
            const actionsOpen = mealActionsOpen === mealIdx;
            const hasIngredients = !!(meal.nutritionIngredients && meal.nutritionIngredients.length > 0);
            return (
              <div key={mealIdx} className={cn(
                'rounded-lg border p-2.5 transition-all',
                mealChecked ? 'border-orange-400/20 bg-orange-400/5 opacity-60'
                  : mealSkipped ? 'border-border/10 opacity-40'
                  : 'border-border/15',
              )}>
                <div className="flex items-center gap-2">
                  {/* Left: meal info */}
                  <button onClick={() => onToggleMeal(detailKey)} className="flex-1 text-left min-w-0">
                    <p className={cn('text-[11px] font-medium truncate',
                      mealChecked ? 'line-through text-muted-foreground/60'
                        : mealSkipped ? 'line-through text-muted-foreground/40'
                        : 'text-foreground'
                    )}>{meal.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" />{meal.calories} kcal
                      </span>
                      <span className="text-[9px] text-primary font-medium flex items-center gap-0.5">
                        <Egg className="w-2.5 h-2.5" />{meal.protein}g
                      </span>
                    </div>
                  </button>
                  {/* Right: status */}
                  {mealChecked ? (
                    <Check className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                  ) : mealSkipped ? (
                    <span className="text-[9px] text-muted-foreground/50 shrink-0 italic">Übersprungen</span>
                  ) : (
                    <button
                      onClick={() => onToggleCheck(mealKey)}
                      className="text-[9px] text-primary font-semibold px-2.5 py-1 rounded-lg border border-primary/20 active:scale-95 transition-transform shrink-0"
                    >
                      Gegessen
                    </button>
                  )}
                </div>
                {showDetail && !isCustomizing && (
                  <div className="mt-2 space-y-2 animate-in fade-in-0 duration-200 pl-1">
                    {meal.prepTime && <p className="text-[10px] text-muted-foreground">{meal.prepTime} Min Zubereitung</p>}
                    {meal.ingredientAmounts && (
                      <div className="flex flex-wrap gap-1">
                        {meal.ingredientAmounts.map((ing: any, ii: number) => (
                          <span key={ii} className="text-[9px] bg-secondary/40 text-muted-foreground px-1.5 py-0.5 rounded-full">{ing.amount} {ing.name}</span>
                        ))}
                      </div>
                    )}
                    {meal.steps && meal.steps.map((step: string, si: number) => (
                      <p key={si} className="text-[10px] text-muted-foreground"><span className="text-orange-400 font-bold">{si + 1}.</span> {step}</p>
                    ))}
                    {meal.longevityBenefit && <p className="text-[10px] text-orange-400/70 italic">{meal.longevityBenefit}</p>}
                  </div>
                )}
                {/* Inline ingredient editor (fallback for cases without sheet) */}
                {isCustomizing && !mealChecked && (
                  <MealIngredientEditor
                    meal={meal}
                    dayIdx={dayIdx}
                    mealIdx={mealIdx}
                    onClose={() => setCustomizingMeal(null)}
                    onQuickLog={() => { onToggleCheck(mealKey); setCustomizingMeal(null); }}
                    onCustomLog={(ingredients, protein, calories) => {
                      if (onCustomLog) onCustomLog(dayIdx, mealIdx, ingredients, protein, calories);
                      setCustomizingMeal(null);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Meal Ingredient Editor (Tier 3) ─── */
function MealIngredientEditor({ meal, dayIdx, mealIdx, onClose, onQuickLog, onCustomLog }: {
  meal: any; dayIdx: number; mealIdx: number;
  onClose: () => void;
  onQuickLog: () => void;
  onCustomLog: (ingredients: MealIngredient[], protein: number, calories: number) => void;
}) {
  const sourceIngredients: MealIngredient[] = meal.nutritionIngredients || [];
  const [editedIngredients, setEditedIngredients] = useState<MealIngredient[]>(
    () => sourceIngredients.map(ing => ({ ...ing }))
  );

  const totals = useMemo(() => calcMealNutrition(editedIngredients), [editedIngredients]);

  const updateAmount = useCallback((index: number, newAmount: number) => {
    setEditedIngredients(prev => prev.map((ing, i) =>
      i === index ? { ...ing, amount: Math.max(0, newAmount) } : ing
    ));
  }, []);

  const mealTypeLabel = mealIdx === 0 ? 'Frühstück' : mealIdx === 1 ? 'Mittagessen' : mealIdx === 2 ? 'Abendessen' : 'Snack';

  if (editedIngredients.length === 0) return null;

  return (
    <div className="mt-3 animate-in fade-in-0 slide-in-from-top-2 duration-300">
      <div className="rounded-xl border border-border/30 bg-card/60 p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {mealTypeLabel} anpassen
          </span>
          <button onClick={onClose} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ingredient rows */}
        <div className="space-y-1.5">
          {editedIngredients.map((ing, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[11px] text-foreground flex-1 min-w-0 truncate">{ing.name}</span>
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  inputMode="decimal"
                  value={ing.amount || ''}
                  onChange={(e) => updateAmount(i, parseFloat(e.target.value) || 0)}
                  className="w-14 h-7 text-right text-[11px] font-medium text-foreground bg-secondary/30 border border-border/30 rounded-md px-1.5 focus:outline-none focus:border-primary/40 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[9px] text-muted-foreground/50 w-4">{ing.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live totals */}
        <div className="flex items-center justify-between px-1 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
          <span className="text-[10px] text-muted-foreground">Berechnet:</span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-primary">{Math.round(totals.protein)}g Protein</span>
            <span className="text-[11px] font-medium text-muted-foreground">{Math.round(totals.calories)} kcal</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onQuickLog}
            className="flex-1 py-2 rounded-lg border border-border/30 text-[11px] text-muted-foreground font-medium hover:bg-secondary/20 transition-all"
          >
            Ohne Details
          </button>
          <button
            onClick={() => onCustomLog(editedIngredients, Math.round(totals.protein), Math.round(totals.calories))}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            Speichern & Loggen
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty Pillar ─── */
function EmptyPillar({ pillar, onNavigate }: { pillar: string; onNavigate: () => void }) {
  const messages: Record<string, string> = {
    bewegung: 'Kein Trainingsplan aktiv -- erstelle deinen Plan im Zielbereich',
    ernaehrung: 'Kein Ernährungsplan aktiv -- erstelle deinen Plan im Zielbereich',
    regeneration: 'Kein Recovery-Plan aktiv -- erstelle deinen Plan im Zielbereich',
    mental: 'Kein Mental-Plan aktiv -- erstelle deinen Plan im Zielbereich',
  };
  return (
    <div className="rounded-2xl border border-border/30 p-6 text-center space-y-3" style={{ background: 'var(--gradient-card)' }}>
      <ClipboardList className="w-8 h-8 text-primary/15 mx-auto" />
      <p className="text-xs text-muted-foreground">{messages[pillar] || 'Noch kein Plan erstellt'}</p>
      <button onClick={onNavigate} className="text-xs text-primary font-semibold">Zum Zielsystem</button>
    </div>
  );
}

/* ─── Checklist Card (Recovery / Mental) ─── */
function ChecklistCard({ label, description, category, checked, onToggle, accentColor }: {
  label: string; description: string; category?: string; checked: boolean; onToggle: () => void; accentColor?: 'blue' | 'purple';
}) {
  const [showDetail, setShowDetail] = useState(false);
  const colorClasses = accentColor === 'blue'
    ? { bg: 'bg-blue-400', border: 'border-blue-400', activeBg: 'bg-blue-400/5', activeBorder: 'border-blue-400/20' }
    : accentColor === 'purple'
    ? { bg: 'bg-purple-400', border: 'border-purple-400', activeBg: 'bg-purple-400/5', activeBorder: 'border-purple-400/20' }
    : { bg: 'bg-primary', border: 'border-primary', activeBg: 'bg-primary/5', activeBorder: 'border-primary/20' };

  return (
    <div className={cn(
      'rounded-xl border p-3 transition-all',
      checked ? `${colorClasses.activeBorder} ${colorClasses.activeBg} opacity-60` : 'border-border/20',
    )} style={{ background: checked ? undefined : 'var(--gradient-card)' }}>
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggle}
          className={cn(
            'w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-200',
            checked ? `${colorClasses.bg} ${colorClasses.border}` : 'border-border/40 active:scale-90',
          )}
          style={{ minWidth: '28px', minHeight: '28px' }}
        >
          {checked && <Check className="w-4 h-4 text-white animate-in zoom-in-50 duration-200" />}
        </button>
        <button onClick={() => setShowDetail(!showDetail)} className="flex-1 text-left min-w-0">
          <p className={cn('text-xs font-medium truncate', checked ? 'line-through text-muted-foreground/60' : 'text-foreground')}>{label}</p>
          {category && <span className="text-[9px] text-muted-foreground/60">{category}</span>}
        </button>
        {!checked && (
          <ChevronDown className={cn('w-3 h-3 text-muted-foreground/40 shrink-0 transition-transform', showDetail && 'rotate-180')} />
        )}
      </div>
      {showDetail && (
        <p className="text-[11px] text-muted-foreground mt-2 pl-9 leading-relaxed animate-in fade-in-0 duration-200">{description}</p>
      )}
    </div>
  );
}
