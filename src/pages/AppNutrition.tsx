import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { calculateNutritionTargets, type NutritionTargets } from '@/lib/nutritionTargets';
import { evaluateMealLongevity, mapGoalTypeToZiel, type ZielGoal } from '@/lib/zielsystem';
import { calculateLongevityNutritionScore, getNutritionInsight, calculateWeeklyNutritionSummary } from '@/lib/longevityNutrition';
import {
  loadPreferenceProfile, clearPreferenceProfile,
  loadNutritionSettings, persistNutritionSettings,
  type MealPreferenceProfile, type NutritionSettings,
} from '@/lib/mealPreferences';
import { generatePillarPlan } from '@/lib/pillarPlanHelpers';
import ScoreRing from '@/components/app/ScoreRing';
import CaliSpeechBubble from '@/components/app/CaliSpeechBubble';
import NutritionDayFeed from '@/components/app/NutritionDayFeed';
import MealSwapSheet from '@/components/app/MealSwapSheet';
import MealCustomizeSheet from '@/components/app/MealCustomizeSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import PremiumPaywall from '@/components/app/PremiumPaywall';
import QuickMealLog from '@/components/app/QuickMealLog';
import QuickMealLogSheet, { type QuickMealLogData } from '@/components/app/QuickMealLogSheet';
import type { MealIngredient } from '@/lib/pillarPlans';
import type { SwapCandidate } from '@/lib/mealSwap';
import {
  Apple, ArrowLeft, ChevronRight, ChevronDown, ChevronUp, Clock, Flame,
  Loader2, Plus, RefreshCw, Sparkles, Target, Utensils, Egg,
  TrendingUp, AlertTriangle, CheckCircle2, ShoppingCart, Lightbulb, Lock,
  ArrowLeftRight, X, SlidersHorizontal, MoreHorizontal, Settings2, Star, RotateCcw,
} from 'lucide-react';

/* ─── Types ─── */
type NutritionView = 'dashboard' | 'day-plan' | 'week-plan' | 'log-meal' | 'patterns';

interface MealEntry {
  id: string;
  name: string;
  type: 'frühstück' | 'mittag' | 'abend' | 'snack';
  description: string;
  proteinLevel: 'niedrig' | 'mittel' | 'hoch';
  estimatedProtein: number;
  time: string;
}

interface DayPlanMeal {
  name: string;
  time: string;
  description: string;
  proteinAnchor: string;
  estimatedProtein: number;
  estimatedCalories: number;
  alternatives?: string[];
}

interface DayPlan {
  dailyFocus: string;
  meals: DayPlanMeal[];
  tips: string[];
  totalEstimatedProtein: number;
  totalEstimatedCalories: number;
}

interface WeekPlanDay {
  dayName: string;
  meals: { name: string; time?: string; description: string; proteinAnchor: string; alternatives?: string[] }[];
  dayTip: string;
}

interface WeekPlan {
  weeklyFocus: string;
  days: WeekPlanDay[];
  weeklyTips: string[];
  groceryHighlights: string[];
}

interface NutritionPatterns {
  patterns: string[];
  topBottleneck: string;
  bestNextStep: string;
  proteinConsistency: string;
  mealStructure: string;
}

const MEAL_TYPES = [
  { value: 'frühstück' as const, label: 'Frühstück', icon: '🌅' },
  { value: 'mittag' as const, label: 'Mittagessen', icon: '☀️' },
  { value: 'abend' as const, label: 'Abendessen', icon: '🌙' },
  { value: 'snack' as const, label: 'Snack', icon: '🥜' },
];

const PROTEIN_LEVELS = [
  { value: 'niedrig' as const, label: 'Niedrig', grams: '0–15g', color: 'text-destructive' },
  { value: 'mittel' as const, label: 'Mittel', grams: '15–30g', color: 'text-yellow-400' },
  { value: 'hoch' as const, label: 'Hoch', grams: '30g+', color: 'text-primary' },
];

const NUTRITION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nutrition-ai`;

/* ─── Component ─── */
export default function AppNutrition() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    profile, nutritionTargets, setNutritionTargets,
    nutritionLogs, addNutritionLog,
    weeklyNutritionPlan, setWeeklyNutritionPlan,
    nutritionPatterns, setNutritionPatterns,
    isPremium, goalPlan, setGoalPlan,
    pillarScores,
  } = useApp();

  const [view, setView] = useState<NutritionView>('dashboard');
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null);
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [patterns, setPatterns] = useState<NutritionPatterns | null>(null);

  // Meal logging state
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<MealEntry['type']>('mittag');
  const [mealProtein, setMealProtein] = useState<MealEntry['proteinLevel']>('mittel');
  const [estimatingProtein, setEstimatingProtein] = useState(false);

  // Personalization state
  const [mealPrefs, setMealPrefs] = useState<MealPreferenceProfile | null>(null);
  const [nutritionSettings, setNutritionSettings] = useState<NutritionSettings>({ dietaryStyle: 'alles', intolerances: [], mealComplexity: 'any' });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load preference profile and settings on mount / user change
  useEffect(() => {
    if (user?.id) {
      setMealPrefs(loadPreferenceProfile(user.id));
      setNutritionSettings(loadNutritionSettings(user.id));
    }
  }, [user?.id]);

  // Re-load preferences when nutritionLogs change (they get rebuilt in addNutritionLog)
  useEffect(() => {
    if (user?.id && nutritionLogs.length > 0) {
      setMealPrefs(loadPreferenceProfile(user.id));
    }
  }, [user?.id, nutritionLogs.length]);

  // Expanded week plan day
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // Calculate targets from profile
  useEffect(() => {
    if (!nutritionTargets && profile.height && profile.weight) {
      const targets = calculateNutritionTargets(
        profile.age, profile.gender, profile.height, profile.weight,
        profile.activityLevel, profile.goals,
      );
      setNutritionTargets(targets);
    }
  }, [profile, nutritionTargets, setNutritionTargets]);

  // Restore cached plans
  useEffect(() => {
    if (weeklyNutritionPlan) setWeekPlan(weeklyNutritionPlan as WeekPlan);
    if (nutritionPatterns) setPatterns(nutritionPatterns as NutritionPatterns);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = useMemo(() => nutritionLogs.filter(l => l.date === today), [nutritionLogs, today]);
  const todayProtein = useMemo(() => todayLogs.reduce((s, l) => s + l.estimatedProteinTotal, 0), [todayLogs]);
  const proteinPercent = useMemo(() => {
    if (!nutritionTargets) return 0;
    return Math.min(100, Math.round((todayProtein / nutritionTargets.proteinTarget) * 100));
  }, [todayProtein, nutritionTargets]);

  const targets = nutritionTargets || { calorieMin: 1800, calorieMax: 2200, proteinTarget: 130, goal: '', explanation: '' };

  const buildUserContext = useCallback(() => ({
    name: profile.name, age: profile.age, gender: profile.gender,
    height: profile.height, weight: profile.weight,
    activityLevel: profile.activityLevel, goals: profile.goals,
    calorieMin: targets.calorieMin, calorieMax: targets.calorieMax,
    proteinTarget: targets.proteinTarget,
    nutritionLogs: nutritionLogs.slice(-21),
    activeGoal: goalPlan ? { goalType: goalPlan.goalType, goalDescription: goalPlan.goalDescription } : null,
  }), [profile, targets, nutritionLogs, goalPlan]);

  const callNutritionAI = useCallback(async (mode: string, extra?: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('nutrition-ai', {
        body: { mode, userContext: { ...buildUserContext(), ...extra } },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    } catch (e: any) {
      console.error(`nutrition-ai ${mode} error:`, e);
      toast.error(e.message || 'Fehler bei der KI-Verarbeitung');
      return null;
    } finally {
      setLoading(false);
    }
  }, [buildUserContext]);

  const generateDayPlan = useCallback(async () => {
    const data = await callNutritionAI('day-plan');
    if (data) setDayPlan(data);
  }, [callNutritionAI]);

  const generateWeekPlan = useCallback(async () => {
    const data = await callNutritionAI('week-plan');
    if (data) {
      setWeekPlan(data);
      setWeeklyNutritionPlan(data);
    }
  }, [callNutritionAI, setWeeklyNutritionPlan]);

  const detectPatterns = useCallback(async () => {
    if (nutritionLogs.length < 3) {
      toast.error('Mindestens 3 Mahlzeiten loggen für Muster-Erkennung');
      return;
    }
    const data = await callNutritionAI('patterns');
    if (data) {
      setPatterns(data);
      setNutritionPatterns(data);
    }
  }, [callNutritionAI, nutritionLogs.length, setNutritionPatterns]);

  const estimateProtein = useCallback(async (description: string) => {
    if (!description.trim()) return;
    setEstimatingProtein(true);
    try {
      const data = await callNutritionAI('estimate-protein', {
        userMessage: `Schätze das Protein für: ${description} (Mahlzeittyp: ${mealType})`,
      });
      if (data) {
        setMealProtein(data.level);
        toast.success(`~${data.estimatedGrams}g Protein (${data.level})`);
      }
    } finally {
      setEstimatingProtein(false);
    }
  }, [callNutritionAI, mealType]);

  const logMeal = useCallback(() => {
    if (!mealName.trim()) { toast.error('Mahlzeit beschreiben'); return; }
    const proteinEstimates: Record<string, Record<string, number>> = {
      niedrig: { frühstück: 5, mittag: 10, abend: 10, snack: 3 },
      mittel: { frühstück: 15, mittag: 25, abend: 25, snack: 8 },
      hoch: { frühstück: 30, mittag: 40, abend: 40, snack: 15 },
    };
    const ep = proteinEstimates[mealProtein]?.[mealType] || 15;

    addNutritionLog({
      date: today,
      meals: [{ name: mealName, type: mealType, description: mealName, proteinLevel: mealProtein, estimatedProtein: ep, time: new Date().toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' }) }],
      estimatedProteinTotal: ep,
      qualityRating: mealProtein === 'hoch' ? 'gut' : mealProtein === 'mittel' ? 'okay' : 'schlecht',
    });
    toast.success('Mahlzeit geloggt');
    setMealName('');
    setMealProtein('mittel');
    setView('dashboard');
  }, [mealName, mealType, mealProtein, addNutritionLog, today]);

  /* ═══ Longevity Nutrition Score ═══ */
  const nutritionScore = useMemo(() => {
    if (todayLogs.length === 0) return null;
    return calculateLongevityNutritionScore(todayLogs, targets.calorieMin, targets.calorieMax, targets.proteinTarget);
  }, [todayLogs, targets]);

  const nutritionInsight = useMemo(() => {
    if (!nutritionScore) return null;
    return getNutritionInsight(nutritionScore, todayProtein, targets.proteinTarget);
  }, [nutritionScore, todayProtein, targets]);

  const weeklySummary = useMemo(() => {
    if (nutritionLogs.length < 3) return null;
    return calculateWeeklyNutritionSummary(nutritionLogs, targets.calorieMin, targets.calorieMax, targets.proteinTarget);
  }, [nutritionLogs, targets]);

  /* ═══ "Wie geplant gegessen" helpers ═══ */
  const todayDayIdx = useMemo(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }, []);

  const todayPlannedMeals = useMemo(() => {
    if (!goalPlan?.nutritionPlan?.days) return [];
    return goalPlan.nutritionPlan.days[todayDayIdx]?.meals || [];
  }, [goalPlan, todayDayIdx]);

  const planCheckIns = useMemo(() => {
    return (goalPlan?.planCheckInHistory?.[today] || {}) as Record<string, string>;
  }, [goalPlan, today]);

  // Meal action state for swap/customize/actions menu
  const [swapMealIdx, setSwapMealIdx] = useState<number | null>(null);
  const [customizeMealIdx, setCustomizeMealIdx] = useState<number | null>(null);
  const [mealActionsOpenIdx, setMealActionsOpenIdx] = useState<number | null>(null);
  const [quickMealIdx, setQuickMealIdx] = useState<number | null>(null);
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);

  const logPlannedMeal = useCallback((meal: any, mealIdx: number) => {
    const mt = mealIdx === 0 ? 'breakfast' : mealIdx === 1 ? 'lunch' : mealIdx === 2 ? 'dinner' : 'snack';
    addNutritionLog({
      date: today,
      meals: [{ name: meal.name, type: mt, description: meal.name, proteinLevel: meal.protein >= 30 ? 'hoch' : meal.protein >= 15 ? 'mittel' : 'niedrig', estimatedProtein: meal.protein, estimatedCalories: meal.calories, time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }), status: 'eaten' as const }],
      estimatedProteinTotal: meal.protein,
      qualityRating: meal.protein >= 30 ? 'gut' : 'okay',
    });
    if (setGoalPlan) {
      setGoalPlan((prev: any) => {
        if (!prev) return prev;
        const history = { ...(prev.planCheckInHistory || {}) };
        const dayChecks = { ...(history[today] || {}) } as Record<string, string>;
        dayChecks[`meal_${todayDayIdx}_${mealIdx}`] = 'done';
        history[today] = dayChecks;
        return { ...prev, planCheckInHistory: history };
      });
    }
    setMealActionsOpenIdx(null);
    toast.success(`${meal.name} geloggt`);
    if (navigator.vibrate) navigator.vibrate([10]);
  }, [addNutritionLog, today, todayDayIdx, setGoalPlan]);

  const skipPlannedMeal = useCallback((mealIdx: number) => {
    if (setGoalPlan) {
      setGoalPlan((prev: any) => {
        if (!prev) return prev;
        const history = { ...(prev.planCheckInHistory || {}) };
        const dayChecks = { ...(history[today] || {}) } as Record<string, string>;
        dayChecks[`meal_${todayDayIdx}_${mealIdx}`] = 'skipped';
        history[today] = dayChecks;
        return { ...prev, planCheckInHistory: history };
      });
    }
    setMealActionsOpenIdx(null);
    toast('Mahlzeit übersprungen');
  }, [today, todayDayIdx, setGoalPlan]);

  const handleSwapComplete = useCallback((mealIdx: number, recipe: SwapCandidate['recipe']) => {
    const meal = todayPlannedMeals[mealIdx];
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
    if (setGoalPlan) {
      setGoalPlan((prev: any) => {
        if (!prev) return prev;
        const history = { ...(prev.planCheckInHistory || {}) };
        const dayChecks = { ...(history[today] || {}) } as Record<string, string>;
        dayChecks[`meal_${todayDayIdx}_${mealIdx}`] = 'done';
        history[today] = dayChecks;
        return { ...prev, planCheckInHistory: history };
      });
    }
    setSwapMealIdx(null);
    toast.success(`Getauscht: ${recipe.name}`);
    if (navigator.vibrate) navigator.vibrate([10]);
  }, [todayPlannedMeals, addNutritionLog, today, todayDayIdx, setGoalPlan]);

  const handleCustomizeComplete = useCallback((mealIdx: number, ingredients: MealIngredient[], totals: { protein: number; calories: number }) => {
    const meal = todayPlannedMeals[mealIdx];
    if (!meal) return;
    const mt = mealIdx === 0 ? 'breakfast' : mealIdx === 1 ? 'lunch' : mealIdx === 2 ? 'dinner' : 'snack';
    addNutritionLog({
      date: today,
      meals: [{
        name: meal.name, type: mt, description: meal.name,
        proteinLevel: totals.protein >= 30 ? 'hoch' : totals.protein >= 15 ? 'mittel' : 'niedrig',
        estimatedProtein: Math.round(totals.protein), estimatedCalories: Math.round(totals.calories),
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        customIngredients: ingredients.map(ing => ({
          name: ing.name, amount: ing.amount, unit: ing.unit,
          protein_per_100: ing.protein_per_100, calories_per_100: ing.calories_per_100,
        })),
      }],
      estimatedProteinTotal: Math.round(totals.protein),
      qualityRating: totals.protein >= 25 ? 'gut' : 'okay',
    });
    if (setGoalPlan) {
      setGoalPlan((prev: any) => {
        if (!prev) return prev;
        const history = { ...(prev.planCheckInHistory || {}) };
        const dayChecks = { ...(history[today] || {}) } as Record<string, string>;
        dayChecks[`meal_${todayDayIdx}_${mealIdx}`] = 'done';
        history[today] = dayChecks;
        return { ...prev, planCheckInHistory: history };
      });
    }
    setCustomizeMealIdx(null);
    toast.success('Mit angepassten Zutaten geloggt');
    if (navigator.vibrate) navigator.vibrate([10]);
  }, [todayPlannedMeals, addNutritionLog, today, todayDayIdx, setGoalPlan]);

  // QuickMealLogSheet helpers
  const quickMealRaw = quickMealIdx !== null ? todayPlannedMeals[quickMealIdx] : null;
  const quickMealData = useMemo<QuickMealLogData | null>(() => {
    if (quickMealIdx === null || !quickMealRaw) return null;
    return {
      id: quickMealRaw.id,
      name: quickMealRaw.name || 'Mahlzeit',
      protein: quickMealRaw.protein || 0,
      calories: quickMealRaw.calories || 0,
      description: quickMealRaw.description,
      nutritionIngredients: quickMealRaw.nutritionIngredients,
      mealIndex: quickMealIdx,
      dayIndex: todayDayIdx,
      checkKey: `meal_${todayDayIdx}_${quickMealIdx}`,
    };
  }, [quickMealIdx, quickMealRaw, todayDayIdx]);

  const handleQuickEat = useCallback(() => {
    if (quickMealIdx === null || !quickMealRaw) return;
    logPlannedMeal(quickMealRaw, quickMealIdx);
  }, [quickMealIdx, quickMealRaw, logPlannedMeal]);

  const handleQuickSkip = useCallback(() => {
    if (quickMealIdx === null) return;
    skipPlannedMeal(quickMealIdx);
  }, [quickMealIdx, skipPlannedMeal]);

  const handleQuickSwap = useCallback((recipe: SwapCandidate['recipe']) => {
    if (quickMealIdx !== null) handleSwapComplete(quickMealIdx, recipe);
  }, [quickMealIdx, handleSwapComplete]);

  const handleQuickCustomize = useCallback(() => {
    if (quickMealIdx !== null) setCustomizeMealIdx(quickMealIdx);
  }, [quickMealIdx]);

  const openQuickSheet = useCallback((idx: number) => {
    setQuickMealIdx(idx);
    setQuickSheetOpen(true);
    setMealActionsOpenIdx(null);
  }, []);

  // Data for swap/customize sheets
  const swapMeal = swapMealIdx !== null ? todayPlannedMeals[swapMealIdx] : null;
  const customizeMeal = customizeMealIdx !== null ? todayPlannedMeals[customizeMealIdx] : null;

  // Count total logged meals for personalization indicator threshold
  const totalLoggedMeals = useMemo(() => nutritionLogs.reduce((s, l) => s + l.meals.length, 0), [nutritionLogs]);
  const hasPersonalization = !!(mealPrefs && mealPrefs.acceptedRecipeIds.length > 0 && totalLoggedMeals >= 5);

  // Check if a meal is a user favorite
  const isFavoriteMeal = useCallback((mealId: string) => {
    return mealPrefs?.acceptedRecipeIds.includes(mealId) ?? false;
  }, [mealPrefs]);

  // Regenerate nutrition plan with current preferences
  const regeneratePlan = useCallback(() => {
    if (!goalPlan) return;
    const existingAnswers = goalPlan.pillarActivationAnswers?.ernaehrung || {};
    const enrichedAnswers = {
      ...existingAnswers,
      calorieMin: nutritionTargets?.calorieMin,
      calorieMax: nutritionTargets?.calorieMax,
      proteinTarget: nutritionTargets?.proteinTarget,
      mealPrefs: user?.id ? loadPreferenceProfile(user.id) ?? undefined : undefined,
    };
    const planUpdates = generatePillarPlan('ernaehrung', enrichedAnswers, pillarScores.ernaehrung, goalPlan.goalType);
    setGoalPlan((prev: any) => {
      if (!prev) return prev;
      return { ...prev, ...planUpdates, planCheckInHistory: { ...(prev.planCheckInHistory || {}), [today]: {} } };
    });
    toast.success('Plan neu generiert');
  }, [goalPlan, nutritionTargets, user, pillarScores, setGoalPlan, today]);

  // Settings handlers
  const handleSettingsChange = useCallback((updates: Partial<NutritionSettings>) => {
    setNutritionSettings(prev => {
      const next = { ...prev, ...updates };
      if (user?.id) persistNutritionSettings(next, user.id);
      return next;
    });
  }, [user]);

  const handleToggleIntolerance = useCallback((intol: string) => {
    setNutritionSettings(prev => {
      const intolerances = prev.intolerances.includes(intol)
        ? prev.intolerances.filter(i => i !== intol)
        : [...prev.intolerances, intol];
      const next = { ...prev, intolerances };
      if (user?.id) persistNutritionSettings(next, user.id);
      return next;
    });
  }, [user]);

  const handleResetPreferences = useCallback(() => {
    if (user?.id) {
      clearPreferenceProfile(user.id);
      localStorage.removeItem(`caliness_nutrition_settings_${user.id}`);
      setMealPrefs(null);
      setNutritionSettings({ dietaryStyle: 'alles', intolerances: [], mealComplexity: 'any' });
      toast.success('Präferenzen zurückgesetzt');
    }
  }, [user]);

  /* ═══ RENDER HELPERS ═══ */
  const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
    <div className={cn('rounded-2xl border border-border/40 p-4', className)}
      style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}
      onClick={onClick}>{children}</div>
  );

  const BackButton = ({ to }: { to: NutritionView }) => (
    <button onClick={() => setView(to)} className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
      <ArrowLeft className="w-4 h-4" /> Zurück
    </button>
  );

  /* ═══════════════════════════════════════ */
  /* ═══ DASHBOARD ═══ */
  /* ═══════════════════════════════════════ */
  if (view === 'dashboard') return (
    <div className="px-4 pt-6 pb-24 space-y-4 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-xl font-bold text-foreground">Ernährung</h1>
          <p className="text-xs text-muted-foreground">{targets.goal || 'Dein Ernährungssystem'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(prev => !prev)}
            className={cn(
              'w-8 h-8 rounded-xl border flex items-center justify-center transition-all active:scale-90',
              settingsOpen ? 'bg-primary/10 border-primary/30' : 'bg-secondary/20 border-border/20'
            )}
            aria-label="Mahlzeit-Einstellungen"
          >
            <Settings2 className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Apple className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>

      {/* ═══ Personalization Settings (collapsed by default) ═══ */}
      {settingsOpen && (
        <Card>
          <p className="text-xs font-semibold text-foreground mb-3">Mahlzeit-Einstellungen</p>

          {/* Ernährungsstil */}
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Ernährungsstil</p>
            <div className="flex flex-wrap gap-1.5">
              {([
                { value: 'alles' as const, label: 'Alles' },
                { value: 'flexitarisch' as const, label: 'Flexitarisch' },
                { value: 'vegetarisch' as const, label: 'Vegetarisch' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSettingsChange({ dietaryStyle: opt.value })}
                  className={cn(
                    'text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all active:scale-95',
                    nutritionSettings.dietaryStyle === opt.value
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border/30 text-muted-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Unverträglichkeiten */}
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Unverträglichkeiten</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: 'lactose', label: 'Laktose' },
                { value: 'gluten', label: 'Gluten' },
                { value: 'nuts', label: 'Nüsse' },
                { value: 'eggs', label: 'Eier' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleToggleIntolerance(opt.value)}
                  className={cn(
                    'text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all active:scale-95',
                    nutritionSettings.intolerances.includes(opt.value)
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border/30 text-muted-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zubereitungszeit */}
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Zubereitungszeit</p>
            <div className="flex flex-wrap gap-1.5">
              {([
                { value: 'quick' as const, label: 'Schnell (<15 Min)' },
                { value: 'medium' as const, label: 'Mittel (<30 Min)' },
                { value: 'any' as const, label: 'Egal' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSettingsChange({ mealComplexity: opt.value })}
                  className={cn(
                    'text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all active:scale-95',
                    nutritionSettings.mealComplexity === opt.value
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border/30 text-muted-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset button */}
          <button
            onClick={handleResetPreferences}
            className="text-[10px] text-muted-foreground/60 font-medium flex items-center gap-1 active:text-muted-foreground transition-colors mt-1"
          >
            <RotateCcw className="w-3 h-3" />
            Präferenzen zurücksetzen
          </button>
        </Card>
      )}

      {/* Goal-aware nutrition hint */}
      {goalPlan && (
        <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 flex items-start gap-2.5">
          <Target className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-foreground">
              Ernährung für: {goalPlan.goalDescription}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {goalPlan.goalType === 'fat_loss' && 'Priorisiere Protein und halte dein Kaloriendefizit. Abends leichter essen.'}
              {goalPlan.goalType === 'sleep' && 'Letzte Mahlzeit 3h vor dem Schlafen. Magnesium-reiche Lebensmittel bevorzugen.'}
              {goalPlan.goalType === 'stress' && 'Regelmäßig essen, nicht skippen. Blutzucker-stabil halten senkt Cortisol.'}
              {goalPlan.goalType === 'energy' && 'Protein-Timing ist entscheidend: 30g zum Frühstück, regelmäßig über den Tag.'}
              {!['fat_loss', 'sleep', 'stress', 'energy'].includes(goalPlan.goalType) && 'Protein-Ziel erreichen und ausgewogen essen unterstützt dein Ziel.'}
            </p>
          </div>
        </div>
      )}

      {/* Longevity Nutrition Score */}
      {nutritionScore && nutritionScore.score > 0 && (
        <Card className="border-primary/20">
          <div className="flex items-center gap-4">
            <ScoreRing score={nutritionScore.score} size={70} strokeWidth={6} label="Longevity" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground mb-1.5">Longevity Nutrition Score</p>
              <div className="flex flex-wrap gap-1">
                {nutritionScore.factorLabels.map(f => (
                  <span key={f.key} className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded-full font-medium',
                    f.status === 'green' ? 'bg-primary/10 text-primary' :
                    f.status === 'yellow' ? 'bg-amber-400/10 text-amber-400' :
                    'bg-destructive/10 text-destructive'
                  )}>
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {nutritionInsight && (
            <CaliSpeechBubble message={nutritionInsight} compact className="mt-3" />
          )}
        </Card>
      )}

      {/* Planned meals — with eat/swap/customize/skip actions */}
      {todayPlannedMeals.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-foreground">Geplante Mahlzeiten</p>
            {goalPlan?.nutritionPlan && (
              <button
                onClick={regeneratePlan}
                className="text-[9px] text-muted-foreground/60 font-medium flex items-center gap-1 active:text-primary transition-colors"
                aria-label="Plan neu generieren"
              >
                <RefreshCw className="w-3 h-3" />Neu
              </button>
            )}
          </div>
          {hasPersonalization && (
            <div className="flex items-center gap-1 mb-2">
              <Sparkles className="w-3 h-3 text-primary/60" />
              <span className="text-[9px] text-muted-foreground/70 border border-border/20 rounded-full px-2 py-0.5">Basierend auf deinen Vorlieben</span>
            </div>
          )}
          <div className="space-y-2">
            {todayPlannedMeals.map((meal: any, i: number) => {
              const checkKey = `meal_${todayDayIdx}_${i}`;
              const isDone = planCheckIns[checkKey] === 'done';
              const isSkipped = planCheckIns[checkKey] === 'skipped';
              const actionsOpen = mealActionsOpenIdx === i;
              const hasIngredients = !!(meal.nutritionIngredients && meal.nutritionIngredients.length > 0);
              const isFav = meal.id && isFavoriteMeal(meal.id);
              return (
                <div key={i} className={cn(
                  'rounded-lg px-2.5 py-2 transition-all',
                  isDone ? 'opacity-60' : isSkipped ? 'opacity-40' : '',
                  !isDone && !isSkipped && 'cursor-pointer active:scale-[0.98] hover:bg-white/5',
                )}
                  onClick={!isDone && !isSkipped ? () => openQuickSheet(i) : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs text-foreground truncate flex items-center gap-1', isDone && 'line-through', isSkipped && 'line-through text-muted-foreground/60')}>
                        {meal.name}
                        {isFav && <Star className="w-3 h-3 text-green-500 fill-green-500 shrink-0" aria-label="Dein Favorit" />}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" />{meal.calories} kcal
                        </span>
                        <span className="text-[9px] text-primary font-medium flex items-center gap-0.5">
                          <Egg className="w-2.5 h-2.5" />{meal.protein}g
                        </span>
                      </div>
                    </div>
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                    ) : isSkipped ? (
                      <span className="text-[9px] text-muted-foreground/50 shrink-0 italic">Übersprungen</span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* QuickMealLogSheet */}
      <QuickMealLogSheet
        open={quickSheetOpen}
        onOpenChange={setQuickSheetOpen}
        meal={quickMealData}
        onEat={handleQuickEat}
        onSwap={handleQuickSwap}
        onCustomize={quickMealData?.nutritionIngredients?.length ? handleQuickCustomize : undefined}
        onSkip={handleQuickSkip}
      />

      {/* Meal Swap Sheet */}
      {swapMeal && swapMealIdx !== null && (
        <MealSwapSheet
          open={swapMealIdx !== null}
          onOpenChange={open => { if (!open) setSwapMealIdx(null); }}
          mealName={swapMeal.name || ''}
          mealId={swapMeal.id || ''}
          mealIndex={swapMealIdx}
          protein={swapMeal.protein || 0}
          calories={swapMeal.calories || 0}
          onSwap={recipe => handleSwapComplete(swapMealIdx, recipe)}
        />
      )}

      {/* Meal Customize Sheet */}
      {customizeMeal?.nutritionIngredients && customizeMealIdx !== null && (
        <MealCustomizeSheet
          open={customizeMealIdx !== null}
          onOpenChange={open => { if (!open) setCustomizeMealIdx(null); }}
          mealName={customizeMeal.name || ''}
          ingredients={customizeMeal.nutritionIngredients}
          originalProtein={customizeMeal.protein || 0}
          originalCalories={customizeMeal.calories || 0}
          onConfirm={(ings, totals) => handleCustomizeComplete(customizeMealIdx, ings, totals)}
        />
      )}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Dein Zielbereich</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Kalorien</p>
            <p className="font-outfit text-lg font-bold text-foreground">
              {targets.calorieMin.toLocaleString()}–{targets.calorieMax.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">kcal / Tag</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Protein</p>
            <p className="font-outfit text-lg font-bold text-primary">{targets.proteinTarget}g</p>
            <p className="text-[10px] text-muted-foreground">pro Tag</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{targets.explanation}</p>
      </Card>

      {/* Today's Protein Progress */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Egg className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Protein heute</span>
          </div>
          <span className="font-outfit text-sm font-bold text-foreground">{todayProtein}g / {targets.proteinTarget}g</span>
        </div>
        <Progress value={proteinPercent} variant="neon" className="h-2.5" />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">{todayLogs.length} Mahlzeit{todayLogs.length !== 1 ? 'en' : ''} geloggt</span>
          <span className={cn('text-[10px] font-semibold',
            proteinPercent >= 80 ? 'text-primary' : proteinPercent >= 50 ? 'text-yellow-400' : 'text-muted-foreground'
          )}>
            {proteinPercent >= 80 ? 'Auf Kurs' : proteinPercent >= 50 ? 'Weiter so' : `Noch ${targets.proteinTarget - todayProtein}g`}
          </span>
        </div>

        {/* Today's logged meals */}
        {todayLogs.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-border/20 pt-3">
            {todayLogs.flatMap(l => l.meals).map((m: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{m.time}</span>
                  <span className="text-foreground">{m.name}</span>
                </div>
                <span className={cn('font-medium',
                  m.proteinLevel === 'hoch' ? 'text-primary' : m.proteinLevel === 'mittel' ? 'text-yellow-400' : 'text-destructive'
                )}>~{m.estimatedProtein}g</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Daily Nutrition Feed - "What I ate today" */}
      <NutritionDayFeed />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Mahlzeit loggen', icon: Plus, action: () => setQuickLogOpen(true), primary: true, free: true },
          { label: 'Tagesplan', icon: Utensils, action: () => { setView('day-plan'); if (!dayPlan) generateDayPlan(); }, free: false },
          { label: 'Wochenplan', icon: ShoppingCart, action: () => { setView('week-plan'); if (!weekPlan) generateWeekPlan(); }, free: false },
          { label: 'Muster', icon: TrendingUp, action: () => { setView('patterns'); if (!patterns) detectPatterns(); }, free: false },
        ].map((a, i) => (
          <button
            key={i}
            onClick={a.free || isPremium ? a.action : undefined}
            className={cn(
              'rounded-xl border p-3 flex items-center gap-2.5 transition-all active:scale-[0.98] relative',
              a.primary
                ? 'border-primary/30 bg-primary/10 text-primary'
                : !a.free && !isPremium
                  ? 'border-border/40 text-muted-foreground/50 opacity-60'
                  : 'border-border/40 text-foreground hover:border-border/60'
            )}
            style={!a.primary ? { background: 'var(--gradient-card)' } : undefined}
          >
            <a.icon className="w-4 h-4" />
            <span className="text-xs font-medium">{a.label}</span>
            {!a.free && !isPremium && <Lock className="w-3 h-3 absolute top-1.5 right-1.5 text-muted-foreground/40" />}
          </button>
        ))}
      </div>

      {!isPremium && (
        <PremiumPaywall feature="KI-Ernährungspläne & Muster-Erkennung" compact />
      )}

      {/* Pattern Insight (if exists) */}
      {patterns && (
        <Card className="border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Ernährungs-Insight</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{patterns.topBottleneck}</p>
          <p className="text-xs text-primary mt-2 font-medium">{patterns.bestNextStep}</p>
        </Card>
      )}

      {/* Weekly Nutrition Summary */}
      {weeklySummary && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Wochenüberblick</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Ø Nutrition Score</p>
              <p className="font-outfit text-lg font-bold text-foreground">{weeklySummary.avgScore}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Protein-Adhärenz</p>
              <p className={cn('font-outfit text-lg font-bold', weeklySummary.avgProteinAdherence >= 80 ? 'text-primary' : 'text-amber-400')}>{weeklySummary.avgProteinAdherence}%</p>
            </div>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Essensfenster: {weeklySummary.eatingWindowTrend}</p>
            <p>Vielfalt: {weeklySummary.diversityTrend}</p>
          </div>
          <p className="text-xs text-foreground mt-2 font-medium">{weeklySummary.recommendation}</p>
        </Card>
      )}

      <QuickMealLog open={quickLogOpen} onOpenChange={setQuickLogOpen} />
    </div>
  );

  /* ═══════════════════════════════════════ */
  /* ═══ MEAL LOG ═══ */
  /* ═══════════════════════════════════════ */
  if (view === 'log-meal') return (
    <div className="px-4 pt-6 pb-24 space-y-5 animate-enter">
      <BackButton to="dashboard" />
      <div>
        <h1 className="font-outfit text-xl font-bold text-foreground">Mahlzeit loggen</h1>
        <p className="text-xs text-muted-foreground mt-1">Einfach. Schnell. Ohne Stress.</p>
      </div>

      {/* Meal type selector */}
      <div>
        <span className="text-sm text-foreground block mb-2">Mahlzeit-Typ</span>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map(t => (
            <button key={t.value} onClick={() => setMealType(t.value)}
              className={cn('rounded-xl border p-2.5 text-center transition-all',
                mealType === t.value ? 'border-primary bg-primary/10' : 'border-border/50'
              )}>
              <span className="block text-lg">{t.icon}</span>
              <span className="text-[10px] font-medium text-foreground">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Meal description */}
      <div>
        <span className="text-sm text-foreground block mb-2">Was hast du gegessen?</span>
        <Input
          value={mealName}
          onChange={e => setMealName(e.target.value)}
          placeholder="z.B. Rührei mit Brot und Avocado"
          className="text-sm"
        />
        <button
          onClick={() => estimateProtein(mealName)}
          disabled={!mealName.trim() || estimatingProtein}
          className="mt-2 flex items-center gap-1.5 text-xs text-primary font-medium disabled:opacity-40"
        >
          {estimatingProtein ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Protein automatisch schätzen
        </button>
      </div>

      {/* Protein level */}
      <div>
        <span className="text-sm text-foreground block mb-2">Protein-Level</span>
        <div className="grid grid-cols-3 gap-2">
          {PROTEIN_LEVELS.map(l => (
            <button key={l.value} onClick={() => setMealProtein(l.value)}
              className={cn('rounded-xl border p-3 text-center transition-all',
                mealProtein === l.value ? 'border-primary bg-primary/10' : 'border-border/50'
              )}>
              <span className={cn('text-sm font-semibold', l.color)}>{l.label}</span>
              <span className="block text-[10px] text-muted-foreground mt-0.5">{l.grams}</span>
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full glow-neon" size="lg" onClick={logMeal}>
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Mahlzeit loggen
      </Button>
    </div>
  );

  /* ═══════════════════════════════════════ */
  /* ═══ DAY PLAN ═══ */
  /* ═══════════════════════════════════════ */
  if (view === 'day-plan') return (
    <div className="px-4 pt-6 pb-24 space-y-4 animate-enter">
      <BackButton to="dashboard" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-xl font-bold text-foreground">Tagesplan Ernährung</h1>
          <p className="text-xs text-muted-foreground">Dein strukturierter Tag</p>
        </div>
        <Button variant="ghost" size="icon" onClick={generateDayPlan} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {loading && !dayPlan ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : dayPlan ? (
        <>
          <Card className="border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Fokus heute</span>
            </div>
            <p className="text-sm text-muted-foreground">{dayPlan.dailyFocus}</p>
          </Card>

          <div className="space-y-2.5">
            {dayPlan.meals.map((meal, i) => (
              <Card key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{meal.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />{meal.time}
                      </span>
                      <span className="text-[10px] text-primary font-medium">{meal.estimatedProtein}g Protein</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{meal.estimatedCalories} kcal</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{meal.description}</p>
                <p className="text-xs text-primary mt-1.5 font-medium">
                  <Egg className="w-3 h-3 inline mr-1" />{meal.proteinAnchor}
                </p>
                {meal.alternatives && meal.alternatives.length > 0 && (
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    Alternativ: {meal.alternatives.join(' · ')}
                  </p>
                )}
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <span>Gesamt: ~{dayPlan.totalEstimatedCalories} kcal</span>
            <span className="text-primary font-semibold">~{dayPlan.totalEstimatedProtein}g Protein</span>
          </div>

          {dayPlan.tips.length > 0 && (
            <Card>
              <span className="text-xs font-semibold text-foreground block mb-2">Tipps</span>
              {dayPlan.tips.map((tip, i) => (
                <div key={i} className="flex gap-2 mb-1.5 last:mb-0">
                  <span className="text-primary text-xs">•</span>
                  <p className="text-xs text-muted-foreground">{tip}</p>
                </div>
              ))}
            </Card>
          )}
        </>
      ) : null}
    </div>
  );

  /* ═══════════════════════════════════════ */
  /* ═══ WEEK PLAN ═══ */
  /* ═══════════════════════════════════════ */
  if (view === 'week-plan') return (
    <div className="px-4 pt-6 pb-24 space-y-4 animate-enter">
      <BackButton to="dashboard" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-xl font-bold text-foreground">7-Tage Ernährungsplan</h1>
          <p className="text-xs text-muted-foreground">Deine Wochenstruktur</p>
        </div>
        <Button variant="ghost" size="icon" onClick={generateWeekPlan} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {loading && !weekPlan ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : weekPlan ? (
        <>
          <Card className="border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Wochenfokus</span>
            </div>
            <p className="text-sm text-muted-foreground">{weekPlan.weeklyFocus}</p>
          </Card>

          <div className="space-y-2">
            {weekPlan.days.map((day, di) => (
              <Card key={di} className="cursor-pointer" onClick={() => setExpandedDay(expandedDay === di ? null : di)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{day.dayName}</p>
                    <p className="text-[10px] text-muted-foreground">{day.meals.length} Mahlzeiten</p>
                  </div>
                  {expandedDay === di ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
                {expandedDay === di && (
                  <div className="mt-3 space-y-2.5 border-t border-border/20 pt-3">
                    {day.meals.map((meal, mi) => (
                      <div key={mi}>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-foreground">{meal.name}</p>
                          {meal.time && <span className="text-[10px] text-muted-foreground">{meal.time}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{meal.description}</p>
                        <p className="text-[10px] text-primary mt-0.5">
                          <Egg className="w-2.5 h-2.5 inline mr-0.5" />{meal.proteinAnchor}
                        </p>
                        {meal.alternatives && meal.alternatives.length > 0 && (
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">↔ {meal.alternatives.join(' · ')}</p>
                        )}
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground/70 italic pt-1">{day.dayTip}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Grocery Highlights */}
          {weekPlan.groceryHighlights?.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Einkaufs-Basics</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {weekPlan.groceryHighlights.map((item, i) => (
                  <span key={i} className="text-[10px] bg-secondary/60 border border-border/40 rounded-full px-2 py-0.5 text-muted-foreground">
                    {item}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {weekPlan.weeklyTips?.length > 0 && (
            <Card>
              <span className="text-xs font-semibold text-foreground block mb-2">Wochen-Tipps</span>
              {weekPlan.weeklyTips.map((tip, i) => (
                <div key={i} className="flex gap-2 mb-1.5 last:mb-0">
                  <span className="text-primary text-xs">•</span>
                  <p className="text-xs text-muted-foreground">{tip}</p>
                </div>
              ))}
            </Card>
          )}
        </>
      ) : null}
    </div>
  );

  /* ═══════════════════════════════════════ */
  /* ═══ PATTERNS ═══ */
  /* ═══════════════════════════════════════ */
  if (view === 'patterns') return (
    <div className="px-4 pt-6 pb-24 space-y-4 animate-enter">
      <BackButton to="dashboard" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-xl font-bold text-foreground">Ernährungs-Muster</h1>
          <p className="text-xs text-muted-foreground">Deine erkannten Muster</p>
        </div>
        <Button variant="ghost" size="icon" onClick={detectPatterns} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {loading && !patterns ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : patterns ? (
        <>
          {patterns.patterns.map((p, i) => (
            <Card key={i}>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">{p}</p>
              </div>
            </Card>
          ))}

          <Card className="border-destructive/20 bg-destructive/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold text-foreground">Haupt-Engpass</span>
            </div>
            <p className="text-sm text-muted-foreground">{patterns.topBottleneck}</p>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Bester nächster Schritt</span>
            </div>
            <p className="text-sm text-muted-foreground">{patterns.bestNextStep}</p>
          </Card>

          <div className="grid grid-cols-2 gap-2.5">
            <Card>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Protein</span>
              <p className="text-xs text-foreground mt-1 font-medium">{patterns.proteinConsistency}</p>
            </Card>
            <Card>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Struktur</span>
              <p className="text-xs text-foreground mt-1 font-medium">{patterns.mealStructure}</p>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <p className="text-sm text-muted-foreground text-center py-4">
            Logge mindestens 3 Mahlzeiten, um Muster zu erkennen.
          </p>
        </Card>
      )}
    </div>
  );

  return null;
}
