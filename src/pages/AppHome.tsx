import { useMemo, useEffect, useState, useCallback, lazy, Suspense, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import SetupChecklist from '@/components/app/SetupChecklist';
import CompanionCreature from '@/components/app/CompanionCreature';
import ScoreRing from '@/components/app/ScoreRing';
import StreakCelebration from '@/components/app/StreakCelebration';
import CaliSpeechBubble from '@/components/app/CaliSpeechBubble';
import QuickMealLog from '@/components/app/QuickMealLog';
import QuickTrackSheet from '@/components/app/QuickTrackSheet';
import RecipeCard from '@/components/app/RecipeCard';
import RecipeDetail from '@/components/app/RecipeDetail';
import GuidedBlock from '@/components/app/GuidedBlock';
import PillarActivationSheet from '@/components/app/PillarActivationSheet';
import { computeCompanionState, getCompanionMood, getTierMeta } from '@/lib/companionState';
import { getCompanionSpeech, getTrackingReaction, getMilestoneReaction, getAllDoneReaction } from '@/lib/companionSpeech';
import { calculateNutritionTargets } from '@/lib/nutritionTargets';
import { calculatePillarScores, calculateLongevityScore } from '@/lib/scoring';
import { adaptTodayBlocks, type AdaptedBlock } from '@/lib/adaptPlan';
// TodaysPlanSection and NutritionDayFeed moved to Heute tab only
import { assembleDailyPlan, getSkippedPillarWarning, type DailyBlock } from '@/lib/assemblePlan';
import { getTodayRecipeSuggestion, type Recipe } from '@/lib/pillarPlans';
import { staggerDelay, streakFlameSpeed } from '@/lib/animations';
import {
  getWeeklyFocusPillar, getFocusDailyAction, getAutopilotAction,
  recommendNextPillar, isReadyForNextPillar, getInitialPillar,
  type PillarKey, type NextPillarRecommendation,
} from '@/lib/focusPillar';
import { generatePillarPlan } from '@/lib/pillarPlanHelpers';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import TrainingModal from '@/components/app/TrainingModal';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Activity, Apple, Moon, Brain, Flame, ClipboardCheck, CheckCircle2, ChevronRight, ChevronDown,
  Target, CalendarDays, Clock, Egg, Plus, Dumbbell, Zap, TrendingUp, MoreHorizontal,
  Award, UtensilsCrossed, Check, Lock, Sparkles, Share2, User,
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import NotificationBanner from '@/components/app/NotificationBanner';
import { scheduleNotificationsForToday, getInAppNotification, type AppNotificationContext } from '@/lib/notificationScheduler';
import { registerServiceWorker } from '@/lib/pushNotifications';
import type { NotificationPayload } from '@/lib/notificationEngine';

const EveningReflection = lazy(() => import('@/components/app/EveningReflection'));

const PILLAR_META = [
  { key: 'bewegung' as const, label: 'Bewegung', icon: Activity },
  { key: 'ernaehrung' as const, label: 'Ernährung', icon: Apple },
  { key: 'regeneration' as const, label: 'Recovery', icon: Moon },
  { key: 'mental' as const, label: 'Mental', icon: Brain },
] as const;

function getSmartGreeting(name: string): string {
  const day = format(new Date(), 'EEEE', { locale: de });
  return `${day}, ${name || 'du'}`;
}

const BLOCK_ICONS: Record<string, typeof Target> = {
  training: Activity, routine_morning: Moon, routine_evening: Moon,
  movement: Activity, recovery: Moon, checkin: ClipboardCheck,
  review: Target, meal_prep: Apple, decompression: Brain,
};

const BLOCK_PILLAR_COLOR: Record<string, string> = {
  training: 'bg-primary', movement: 'bg-primary', routine_morning: 'bg-amber-400',
  routine_evening: 'bg-amber-400', recovery: 'bg-blue-400', checkin: 'bg-primary',
  review: 'bg-primary', meal_prep: 'bg-orange-400', decompression: 'bg-purple-400',
};

export default function AppHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    loading, dataLoaded,
    profile, longevityScore, pillarScores, todayCheckIn,
    checkInHistory, streak, weeklyConsistency, goalPlan, setGoalPlan,
    nutritionTargets, setNutritionTargets, nutritionLogs, addNutritionLog,
    scoreTrend, scoreWeeklyChange, scoreHistory, isPremium,
    badges, addBadge, activityLog, addActivityLog,
  } = useApp();

  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [quickTrackPillar, setQuickTrackPillar] = useState<PillarKey | null>(null);
  const [blockMenuIdx, setBlockMenuIdx] = useState<number | null>(null);
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [trainingBlock, setTrainingBlock] = useState<{ label: string; time: string; duration: number; dayIdx: number; blockIdx: number } | null>(null);
  const [eveningOpen, setEveningOpen] = useState(false);
  const [lastCelebratedStreak, setLastCelebratedStreak] = useState<number>(() => {
    const stored = localStorage.getItem('caliness_last_celebrated_streak');
    return stored ? parseInt(stored) : 0;
  });
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [completedBlockIdx, setCompletedBlockIdx] = useState<number | null>(null);
  const [justCompletedBlock, setJustCompletedBlock] = useState<{ label: string; completedCount: number; totalBlocks: number } | null>(null);
  const [scoreBoost, setScoreBoost] = useState(0);
  const [miniChecked, setMiniChecked] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem(`caliness_mini_${new Date().toISOString().split('T')[0]}`);
    return stored ? JSON.parse(stored) : {};
  });

  // Collapsible detail section state
  const [detailExpanded, setDetailExpanded] = useState(false);

  // Recipe state
  const [recipeDetailOpen, setRecipeDetailOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Guided block state
  const [guidedBlockOpen, setGuidedBlockOpen] = useState(false);
  const [guidedBlockData, setGuidedBlockData] = useState<{ type: 'recovery' | 'decompression' | 'mental'; title: string; description: string; duration?: number; blockIdx: number } | null>(null);

  // Pillar activation state
  const [activationSheetOpen, setActivationSheetOpen] = useState(false);
  const [activationPillar, setActivationPillar] = useState<PillarKey | null>(null);
  const [unlockPromptDismissed, setUnlockPromptDismissed] = useState(false);

  // ═══ DOPAMINE FEEDBACK STATE ═══
  const [reactionSpeech, setReactionSpeech] = useState<string | null>(null);
  const [caliBouncing, setCaliBouncing] = useState(false);
  const [pillarFlash, setPillarFlash] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDailyBanner, setShowDailyBanner] = useState(false);
  const [showAllDoneShare, setShowAllDoneShare] = useState(false);
  const [showStreakShare, setShowStreakShare] = useState(false);

  // Score at session start for dopamine feedback
  const sessionStartScore = useRef<number | null>(null);
  const [scoreIncreased, setScoreIncreased] = useState(false);

  useEffect(() => {
    if (sessionStartScore.current === null && longevityScore > 0) {
      sessionStartScore.current = longevityScore;
    } else if (sessionStartScore.current !== null && longevityScore > sessionStartScore.current) {
      setScoreIncreased(true);
      const t = setTimeout(() => setScoreIncreased(false), 1500);
      return () => clearTimeout(t);
    }
  }, [longevityScore]);

  // Yesterday's pillar scores for comparison
  const yesterdayPillarScores = useMemo(() => {
    const stored = localStorage.getItem('caliness_yesterday_pillars');
    return stored ? JSON.parse(stored) : null;
  }, []);

  useEffect(() => {
    if (pillarScores.bewegung > 0) {
      const today = new Date().toISOString().split('T')[0];
      const storedDate = localStorage.getItem('caliness_pillar_date');
      if (storedDate !== today) {
        const currentStored = localStorage.getItem('caliness_today_pillars');
        if (currentStored) localStorage.setItem('caliness_yesterday_pillars', currentStored);
        localStorage.setItem('caliness_today_pillars', JSON.stringify(pillarScores));
        localStorage.setItem('caliness_pillar_date', today);
      }
    }
  }, [pillarScores]);

  useEffect(() => {
    if (!nutritionTargets && profile.height && profile.weight) {
      const targets = calculateNutritionTargets(profile.age, profile.gender, profile.height, profile.weight, profile.activityLevel, profile.goals);
      setNutritionTargets(targets);
    }
  }, [profile, nutritionTargets, setNutritionTargets]);

  useEffect(() => {
    const milestones = [7, 14, 21, 30, 60, 90];
    if (milestones.includes(streak) && streak > lastCelebratedStreak) {
      setShowStreakCelebration(true);
    }
  }, [streak, lastCelebratedStreak]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      window.history.replaceState({}, '', '/app/home');
      window.location.reload();
    }
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayNutritionLogs = useMemo(() => nutritionLogs.filter(l => l.date === today), [nutritionLogs, today]);
  const todayProtein = useMemo(() => todayNutritionLogs.reduce((s, l) => s + l.estimatedProteinTotal, 0), [todayNutritionLogs]);
  const proteinTarget = nutritionTargets?.proteinTarget || 130;
  const proteinPercent = Math.min(100, Math.round((todayProtein / proteinTarget) * 100));

  // ═══ PROGRESSIVE PILLAR SYSTEM ═══
  const activePillars = useMemo<PillarKey[]>(() => {
    if (!goalPlan?.activePillars || goalPlan.activePillars.length === 0) {
      return ['bewegung', 'ernaehrung', 'regeneration', 'mental'] as PillarKey[];
    }
    return goalPlan.activePillars as PillarKey[];
  }, [goalPlan?.activePillars]);

  const hasProgressiveSystem = useMemo(() => {
    return goalPlan?.activePillars && goalPlan.activePillars.length > 0 && goalPlan.activePillars.length < 4;
  }, [goalPlan?.activePillars]);

  // Check if ready for next pillar unlock
  const nextPillarRecommendation = useMemo<NextPillarRecommendation | null>(() => {
    if (!goalPlan?.activePillars || goalPlan.activePillars.length >= 4) return null;
    if (!goalPlan.goalType) return null;
    const ready = isReadyForNextPillar(
      activePillars,
      activityLog,
      goalPlan.pillarActivationDates?.[activePillars[activePillars.length - 1]],
    );
    if (!ready) return null;
    return recommendNextPillar(activePillars, pillarScores, goalPlan.goalType, activityLog);
  }, [goalPlan, activePillars, activityLog, pillarScores]);

  const showUnlockPrompt = useMemo(() => {
    if (!nextPillarRecommendation) return false;
    if (unlockPromptDismissed) return false;
    if (goalPlan?.unlockPromptDeclined) {
      // Check if 5 days have passed since decline
      const lastPrompt = goalPlan.lastUnlockPromptDate;
      if (lastPrompt) {
        const daysSince = Math.floor((Date.now() - new Date(lastPrompt).getTime()) / 86400000);
        if (daysSince < 5) return false;
      }
    }
    return true;
  }, [nextPillarRecommendation, unlockPromptDismissed, goalPlan]);

  const assembledBlocks = useMemo(() => assembleDailyPlan(goalPlan), [goalPlan]);

  const todayPlanData = useMemo(() => {
    if (!goalPlan?.weeklyPlan?.weeklyBlocks) return null;
    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    return goalPlan.weeklyPlan.weeklyBlocks[todayIdx] || null;
  }, [goalPlan]);

  const adaptedBlocks = useMemo<AdaptedBlock[]>(() => {
    const rawBlocks = todayPlanData?.blocks || [];
    const mergedBlocks = rawBlocks.length > 0 ? rawBlocks : assembledBlocks;
    if (!isPremium || !todayCheckIn || mergedBlocks.length === 0) return mergedBlocks;
    return adaptTodayBlocks(mergedBlocks, todayCheckIn);
  }, [todayPlanData, todayCheckIn, isPremium, assembledBlocks]);

  const allBlocksDone = adaptedBlocks.length > 0 && adaptedBlocks.every((b: any) => b.completed);
  const completedCount = adaptedBlocks.filter((b: any) => b.completed).length;

  const mood = useMemo(
    () => getCompanionMood(allBlocksDone, pillarScores, yesterdayPillarScores, undefined, !!justCompletedBlock),
    [allBlocksDone, pillarScores, yesterdayPillarScores, justCompletedBlock],
  );

  const companion = useMemo(
    () => computeCompanionState(longevityScore, pillarScores, todayCheckIn, streak, weeklyConsistency, goalPlan, checkInHistory.length, mood),
    [longevityScore, pillarScores, todayCheckIn, streak, weeklyConsistency, goalPlan, checkInHistory.length, mood],
  );

  // ═══ NOTIFICATION SYSTEM ═══
  const [bannerNotification, setBannerNotification] = useState<NotificationPayload | null>(null);

  useEffect(() => {
    if (!dataLoaded) return;
    // Register service worker for background notifications
    registerServiceWorker();

    const lastCheckInDate = checkInHistory.length > 0
      ? [...checkInHistory].sort((a, b) => b.date.localeCompare(a.date))[0].date
      : null;

    const notifCtx: AppNotificationContext = {
      pillarScores,
      goalPlan,
      streak,
      todayCheckIn,
      completedBlocksToday: completedCount,
      totalBlocksToday: adaptedBlocks.length,
      lastCheckInDate,
      prevWeekScores: yesterdayPillarScores,
      userId: user?.id,
    };

    // Schedule push notifications
    scheduleNotificationsForToday(notifCtx);

    // Get in-app banner notification
    const banner = getInAppNotification(notifCtx);
    setBannerNotification(banner);
  }, [dataLoaded]); // intentionally only on dataLoaded to run once

  const greeting = getSmartGreeting(profile.name || 'du');
  const hasCheckedIn = checkInHistory.some(c => c.date === today);
  const hour = new Date().getHours();

  // ═══ FOCUS PILLAR SYSTEM ═══
  const focusResult = useMemo(() => getWeeklyFocusPillar(pillarScores, goalPlan), [pillarScores, goalPlan]);
  const focusDailyAction = useMemo(() => getFocusDailyAction(focusResult.focusPillar, pillarScores, goalPlan?.goalType), [focusResult.focusPillar, pillarScores, goalPlan?.goalType]);

  // Persist focus completion per day — read from localStorage so it survives reloads
  const [focusCompletedLocal, setFocusCompletedLocal] = useState<boolean>(() => {
    const stored = localStorage.getItem(`caliness_focus_${new Date().toISOString().split('T')[0]}`);
    return stored === 'true';
  });

  // Track which pillars have been tracked today
  const todayActivityLog = useMemo(() => activityLog.filter(l => l.date === today), [activityLog, today]);

  // Also derive completion from persisted activityLog (covers cross-device / cleared-localStorage)
  // Defined AFTER todayActivityLog to avoid temporal dead zone
  const focusCompletedFromLog = useMemo(
    () => todayActivityLog.some(l => l.type === 'focus_action'),
    [todayActivityLog],
  );
  const focusCompleted = focusCompletedLocal || focusCompletedFromLog;
  const trackedPillars = useMemo(() => {
    const set = new Set<string>();
    todayActivityLog.forEach(l => set.add(l.pillar));
    if (todayCheckIn) { set.add('bewegung'); set.add('ernaehrung'); set.add('regeneration'); set.add('mental'); }
    if (todayNutritionLogs.length > 0) set.add('ernaehrung');
    return set;
  }, [todayActivityLog, todayCheckIn, todayNutritionLogs]);

  const todayActionCount = todayActivityLog.length;

  // Display speech: prioritize reaction speech over computed
  const computedSpeech = useMemo(
    () => getCompanionSpeech(
      longevityScore, pillarScores, todayCheckIn, streak, scoreTrend, scoreHistory, allBlocksDone, goalPlan,
      justCompletedBlock || undefined, todayProtein, proteinTarget, yesterdayPillarScores,
      trackedPillars.size, focusResult.focusPillar, focusCompleted,
    ),
    [longevityScore, pillarScores, todayCheckIn, streak, scoreTrend, scoreHistory, allBlocksDone, goalPlan, justCompletedBlock, todayProtein, proteinTarget, yesterdayPillarScores, trackedPillars.size, focusResult.focusPillar, focusCompleted],
  );
  const companionSpeech = reactionSpeech || computedSpeech;

  // ═══ DOPAMINE TRIGGER ═══
  const triggerDopamineFeedback = useCallback((pillar: PillarKey, type: 'focus' | 'mini' | 'workout' | 'meal' | 'recovery' | 'mental', miniLabel?: string) => {
    // 1. Score boost animation
    setScoreBoost(prev => prev + (type === 'focus' ? 5 : 3));
    setTimeout(() => setScoreBoost(0), 2000);

    // 2. CALI bounce + reaction speech
    setCaliBouncing(true);
    setTimeout(() => setCaliBouncing(false), 500);
    const speech = getTrackingReaction(pillar, type, todayProtein, proteinTarget, miniLabel);
    setReactionSpeech(speech);
    setTimeout(() => setReactionSpeech(null), 5000);

    // 3. Pillar card glow flash
    setPillarFlash(pillar);
    setTimeout(() => setPillarFlash(null), 600);

    // 4. Haptic
    if (navigator.vibrate) navigator.vibrate(10);

    // 5. Milestone checks (count after this action)
    const newCount = todayActionCount + 1;
    const milestoneMsg = getMilestoneReaction(newCount);
    if (milestoneMsg) {
      if (newCount === 1) {
        // First action confetti
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1500);
      }
      setTimeout(() => {
        setReactionSpeech(milestoneMsg);
        setTimeout(() => setReactionSpeech(null), 5000);
      }, 2500);
    }
  }, [todayActionCount, todayProtein, proteinTarget]);

  // Check all-done state for celebration
  const allFocusAndMiniDone = useMemo(() => {
    if (!focusCompleted) return false;
    const miniKeys = focusResult.miniActions.map(m => m.pillar);
    return miniKeys.every(k => miniChecked[k]);
  }, [focusCompleted, focusResult.miniActions, miniChecked]);

  useEffect(() => {
    if (allFocusAndMiniDone && !showAllDoneShare) {
      // Full celebration
      setShowDailyBanner(true);
      if (navigator.vibrate) navigator.vibrate([10, 30, 10, 30, 10]);
      setReactionSpeech(getAllDoneReaction());
      setTimeout(() => { setShowDailyBanner(false); setShowAllDoneShare(true); }, 3000);
      setTimeout(() => setReactionSpeech(null), 5000);
    }
  }, [allFocusAndMiniDone]);

  // Autopilot actions for non-focus active pillars
  const autopilotActions = useMemo(() => {
    if (!hasProgressiveSystem || activePillars.length <= 1) return [];
    // First pillar (oldest) goes to autopilot if we have 2+
    return activePillars.slice(0, -1).map(p => ({
      pillar: p,
      ...getAutopilotAction(p),
    }));
  }, [hasProgressiveSystem, activePillars]);

  const goalAdherence = useMemo(() => {
    if (!goalPlan?.weeklyPlan?.weeklyBlocks) return 0;
    const total = goalPlan.weeklyPlan.weeklyBlocks.reduce((s: number, d: any) => s + d.blocks.length, 0);
    const done = goalPlan.weeklyPlan.weeklyBlocks.reduce((s: number, d: any) => s + d.blocks.filter((b: any) => b.completed).length, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [goalPlan]);

  const daysRemaining = useMemo(() => {
    if (!goalPlan?.targetDate) return 0;
    return Math.max(0, Math.ceil((new Date(goalPlan.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }, [goalPlan]);

  const eveningReflectionDone = useMemo(() => !!localStorage.getItem(`caliness_evening_${today}`), [today]);
  const showEveningBanner = hasCheckedIn && hour >= 20 && !eveningReflectionDone;
  const showWeeklyReviewBanner = new Date().getDay() === 0 && hour >= 19;

  // Badge checking — only evaluate when data is actually loaded (not default pillar scores)
  useEffect(() => {
    if (!dataLoaded) return; // Don't award badges before real data loads
    if (!todayCheckIn && checkInHistory.length === 0) return; // No check-ins yet, scores are defaults

    if (streak >= 7 && !badges.some(b => b.id === '7-tage-streak')) {
      addBadge({ id: '7-tage-streak', label: '7-Tage-Streak', emoji: '🔥', description: '7 Tage in Folge eingecheckt' });
    }
    if (longevityScore >= 95 && !badges.some(b => b.id === 'full-ring')) {
      addBadge({ id: 'full-ring', label: 'Full Ring Day', emoji: '💯', description: 'Score über 95 erreicht' });
    }
    const allGreen = pillarScores.bewegung >= 66 && pillarScores.ernaehrung >= 66 && pillarScores.regeneration >= 66 && pillarScores.mental >= 66;
    if (allGreen && !badges.some(b => b.id === 'alle-saeulen-gruen')) {
      addBadge({ id: 'alle-saeulen-gruen', label: 'Alle Säulen Grün', emoji: '🌿', description: 'Alle 4 Säulen über 66' });
    }
  }, [streak, longevityScore, pillarScores, badges, addBadge, dataLoaded, todayCheckIn, checkInHistory.length]);

  const tomorrowBlock = useMemo(() => {
    if (!goalPlan?.weeklyPlan?.weeklyBlocks) return null;
    const tomorrowIdx = new Date().getDay() === 0 ? 0 : new Date().getDay();
    const tmr = goalPlan.weeklyPlan.weeklyBlocks[tomorrowIdx >= 7 ? 0 : tomorrowIdx];
    return tmr?.blocks?.[0]?.label || null;
  }, [goalPlan]);

  const pillarDots = useMemo(() => [
    { key: 'bewegung', score: pillarScores.bewegung },
    { key: 'ernaehrung', score: pillarScores.ernaehrung },
    { key: 'regeneration', score: pillarScores.regeneration },
    { key: 'mental', score: pillarScores.mental },
  ], [pillarScores]);

  const { weakest } = useMemo(() => {
    const entries = Object.entries(pillarScores).sort((a, b) => a[1] - b[1]);
    return { weakest: entries[0][0] };
  }, [pillarScores]);

  // Today's recipe suggestion
  const todayRecipe = useMemo(() => {
    if (goalPlan?.nutritionPlan) return null;
    const proteinRemaining = proteinTarget - todayProtein;
    return getTodayRecipeSuggestion(undefined, proteinRemaining);
  }, [goalPlan, proteinTarget, todayProtein]);

  const logRecipe = useCallback((recipe: Recipe) => {
    addNutritionLog({
      date: today,
      meals: [{
        name: recipe.name,
        type: recipe.mealType === 'breakfast' ? 'frühstück' : recipe.mealType === 'lunch' ? 'mittag' : recipe.mealType === 'dinner' ? 'abend' : 'snack',
        description: recipe.name,
        proteinLevel: recipe.protein >= 30 ? 'hoch' : recipe.protein >= 15 ? 'mittel' : 'niedrig',
        estimatedProtein: recipe.protein,
        time: new Date().toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' }),
      }],
      estimatedProteinTotal: recipe.protein,
      qualityRating: recipe.protein >= 30 ? 'gut' : 'okay',
    });
    if (navigator.vibrate) navigator.vibrate(10);
    toast.success(`${recipe.name} geloggt`);
  }, [addNutritionLog, today]);

  const toggleBlockFromHome = useCallback((blockIdx: number) => {
    if (!goalPlan?.weeklyPlan?.weeklyBlocks) return;
    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const block = todayPlanData?.blocks?.[blockIdx];

    if (block && !block.completed && (block.type === 'recovery' || block.type === 'decompression')) {
      setGuidedBlockData({
        type: block.type,
        title: block.label,
        description: block.description || (block.type === 'recovery' ? 'Nimm dir diese Zeit für aktive Regeneration.' : 'Finde einen ruhigen Moment. Schließe die Augen und atme bewusst.'),
        duration: block.duration ? Math.round(block.duration) : undefined,
        blockIdx,
      });
      setGuidedBlockOpen(true);
      return;
    }

    if (block && block.type === 'training' && !block.completed) {
      setTrainingBlock({ label: block.label, time: block.time, duration: block.duration, dayIdx: todayIdx, blockIdx });
      setTrainingModalOpen(true);
      return;
    }
    if (block && !block.completed) {
      setCompletedBlockIdx(blockIdx);
      setTimeout(() => setCompletedBlockIdx(null), 700);
      const newCompleted = completedCount + 1;
      setJustCompletedBlock({ label: block.label, completedCount: newCompleted, totalBlocks: adaptedBlocks.length });
      setTimeout(() => setJustCompletedBlock(null), 5000);
      const blockPillar: PillarKey = (block.type === 'training' || block.type === 'movement') ? 'bewegung' : block.type === 'recovery' ? 'regeneration' : block.type === 'decompression' ? 'mental' : 'bewegung';
      addActivityLog({ pillar: blockPillar, type: block.type, label: block.label, duration: block.duration, source: 'plan' });
      triggerDopamineFeedback(blockPillar, block.type === 'training' ? 'workout' : block.type === 'recovery' ? 'recovery' : 'mental');
    }
    setGoalPlan(prev => {
      if (!prev?.weeklyPlan?.weeklyBlocks) return prev;
      const updated = { ...prev };
      const blocks = [...(updated.weeklyPlan.weeklyBlocks[todayIdx]?.blocks || [])];
      if (blocks[blockIdx]) blocks[blockIdx] = { ...blocks[blockIdx], completed: !blocks[blockIdx].completed };
      updated.weeklyPlan = { ...updated.weeklyPlan, weeklyBlocks: updated.weeklyPlan.weeklyBlocks.map((d: any, idx: number) => idx === todayIdx ? { ...d, blocks } : d) };
      const completedLabels = blocks.filter((b: any) => b.completed).map((b: any) => today + '_' + b.label);
      updated.completedBlocks = [...new Set([...(updated.completedBlocks || []), ...completedLabels])];
      return updated;
    });
  }, [goalPlan, todayPlanData, setGoalPlan, today, completedCount, adaptedBlocks.length, addActivityLog]);

  const completeGuidedBlock = useCallback(() => {
    if (!guidedBlockData) return;
    toggleBlockFromHome(guidedBlockData.blockIdx);
    if (navigator.vibrate) navigator.vibrate(10);
  }, [guidedBlockData, toggleBlockFromHome]);

  const skipBlock = useCallback((blockIdx: number) => {
    if (!goalPlan?.weeklyPlan?.weeklyBlocks) return;
    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    setGoalPlan(prev => {
      if (!prev?.weeklyPlan?.weeklyBlocks) return prev;
      const updated = { ...prev };
      const blocks = [...(updated.weeklyPlan.weeklyBlocks[todayIdx]?.blocks || [])];
      if (blocks[blockIdx]) blocks[blockIdx] = { ...blocks[blockIdx], completed: true, skipped: true };
      updated.weeklyPlan = { ...updated.weeklyPlan, weeklyBlocks: updated.weeklyPlan.weeklyBlocks.map((d: any, idx: number) => idx === todayIdx ? { ...d, blocks } : d) };
      return updated;
    });
    setBlockMenuIdx(null);
  }, [goalPlan, setGoalPlan]);

  const handleFocusComplete = useCallback(() => {
    // Persist to localStorage (date-keyed) so it survives reloads
    localStorage.setItem(`caliness_focus_${today}`, 'true');
    setFocusCompletedLocal(true);
    addActivityLog({ pillar: focusResult.focusPillar, type: 'focus_action', label: focusDailyAction.title, source: 'plan' });
    triggerDopamineFeedback(focusResult.focusPillar, 'focus');
    toast.success('Fokus-Aktion erledigt! 💪');
  }, [today, focusResult.focusPillar, focusDailyAction.title, addActivityLog, triggerDopamineFeedback]);

  const handleMiniToggle = useCallback((pillarKey: string) => {
    setMiniChecked(prev => {
      const next = { ...prev, [pillarKey]: !prev[pillarKey] };
      localStorage.setItem(`caliness_mini_${today}`, JSON.stringify(next));
      if (!prev[pillarKey]) {
        const mini = focusResult.miniActions.find(m => m.pillar === pillarKey);
        if (mini) {
          addActivityLog({ pillar: pillarKey as PillarKey, type: 'mini_action', label: mini.label, source: 'plan' });
          triggerDopamineFeedback(pillarKey as PillarKey, 'mini', mini.label);
        }
      }
      return next;
    });
  }, [today, focusResult.miniActions, addActivityLog]);

  // Pillar activation handler
  const handlePillarActivate = useCallback((pillar: PillarKey, answers: Record<string, any>) => {
    setGoalPlan(prev => {
      if (!prev) return prev;
      const newActivePillars = [...(prev.activePillars || []), pillar];
      const newDates = { ...(prev.pillarActivationDates || {}), [pillar]: new Date().toISOString() };
      const newAnswers = { ...(prev.pillarActivationAnswers || {}), [pillar]: answers };
      const planUpdates = generatePillarPlan(pillar, answers, pillarScores[pillar], prev.goalType);

      return {
        ...prev,
        ...planUpdates,
        activePillars: newActivePillars,
        pillarActivationDates: newDates,
        pillarActivationAnswers: newAnswers,
        unlockPromptDeclined: false,
        lastUnlockPromptDate: undefined,
      };
    });
    toast.success(`${PILLAR_META.find(p => p.key === pillar)?.label} aktiviert! 🎉`);
  }, [setGoalPlan, pillarScores]);

  const handleUnlockDecline = useCallback(() => {
    setUnlockPromptDismissed(true);
    setGoalPlan(prev => {
      if (!prev) return prev;
      return { ...prev, unlockPromptDeclined: true, lastUnlockPromptDate: new Date().toISOString() };
    });
  }, [setGoalPlan]);

  const handleShare = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 1080; canvas.height = 1920;
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 1080, 1920);
    const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
    grad.addColorStop(0, 'rgba(0,178,9,0.08)'); grad.addColorStop(1, 'rgba(0,178,9,0.02)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 120px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(String(Math.min(100, longevityScore + scoreBoost)), 540, 800);
    ctx.fillStyle = '#8b949e'; ctx.font = '36px system-ui'; ctx.fillText('Longevity Score', 540, 860);
    ctx.fillStyle = '#00B209'; ctx.font = 'bold 48px system-ui'; ctx.fillText(`🔥 ${streak} Tage Streak`, 540, 960);
    ctx.fillStyle = '#8b949e'; ctx.font = '28px system-ui';
    ctx.fillText(`Fokus: ${PILLAR_META.find(p => p.key === focusResult.focusPillar)?.label || ''}`, 540, 1040);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = 'bold 24px system-ui';
    ctx.fillText('CALINESS · Dein Longevity Companion', 540, 1800);
    ctx.fillText('caliness.app', 540, 1840);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'caliness-daily.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          try { await navigator.share({ title: 'Mein CALINESS Score', files: [file] }); } catch {}
          return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'caliness-daily.png'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Bild heruntergeladen');
    }, 'image/png');
  }, [longevityScore, scoreBoost, streak, focusResult.focusPillar]);

  const tierMeta = getTierMeta(companion.evolutionTier);

  const speechBorderClass = mood === 'celebrating' ? 'border-primary/40 shadow-[0_0_8px_hsl(142_76%_46%/0.15)]'
    : mood === 'concerned' ? 'border-amber-400/30'
    : mood === 'sleepy' ? 'border-border/20 opacity-70'
    : 'border-primary/10';

  const showNutritionPulse = todayNutritionLogs.length === 0 && hour >= 10;
  const skippedWarning = useMemo(() => getSkippedPillarWarning(goalPlan?.planCheckInHistory), [goalPlan]);

  // Focus pillar icon
  const FocusIcon = PILLAR_META.find(p => p.key === focusResult.focusPillar)?.icon || Activity;

  if (loading && !dataLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <img src="/images/caliness-logo-white.png" alt="" className="w-12 h-12 object-contain"
          style={{ animation: 'glowPulseGreen 2s ease-in-out infinite' }} />
        <p className="text-xs text-muted-foreground">CALI wird geladen...</p>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40"
              style={{ animation: `floatParticle 1.2s ease-in-out infinite`, animationDelay: `${i * 200}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-36 space-y-4 relative">
      {/* ─── Celebrations ─── */}
      {/* ─── Notification Banner ─── */}
      <NotificationBanner notification={bannerNotification} />

      <StreakCelebration
        streak={streak}
        show={showStreakCelebration}
        onComplete={() => {
          setShowStreakCelebration(false);
          setLastCelebratedStreak(streak);
          localStorage.setItem('caliness_last_celebrated_streak', String(streak));
          setShowStreakShare(true);
        }}
      />
      {showDailyBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center" style={{ animation: 'tagZielBanner 3s ease-in-out forwards' }}>
          <div className="mt-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-outfit text-sm font-bold shadow-lg">
            🎯 Tagesziel erreicht
          </div>
        </div>
      )}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-primary"
              style={{ animation: `confettiDot 1.5s ease-out forwards`, animationDelay: `${i * 80}ms`, '--x-offset': `${(i - 2) * 16}px`, bottom: '50%' } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* BLOCK 1 — HERO: Companion · Score · 4 Säulen · Hebel  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="relative rounded-3xl border border-border/20 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 90% 55% at 50% 25%, ${
            companion.state === 'vital' ? 'hsl(142 76% 46% / 0.09)'
            : companion.state === 'erschoepft' ? 'hsl(0 60% 40% / 0.06)'
            : 'hsl(142 76% 46% / 0.05)'
          }, transparent 70%)`,
        }} />
        {/* Score boost ripple */}
        {scoreIncreased && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 rounded-full" style={{ border: '2px solid hsl(142 76% 46% / 0.3)', animation: 'rippleExpand 1s ease-out forwards' }} />
          </div>
        )}

        <div className="relative px-4 pt-4 pb-5 space-y-4">
          {/* Row 1 — Greeting + Streak + Profile */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-[0.18em]">CALINESS</span>
              <h1 className="font-outfit text-[15px] font-bold text-foreground leading-tight">{greeting}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
                <div style={{ animation: streak >= 3 ? `flameDance ${streakFlameSpeed(streak)}s ease-in-out infinite` : undefined, transformOrigin: 'bottom center' }}>
                  <Flame className={cn('w-3 h-3', streak >= 14 ? 'text-amber-400' : streak >= 7 ? 'text-primary' : 'text-primary/70')} />
                </div>
                <span className="text-[11px] font-bold text-primary">{streak}</span>
              </div>
              <button
                onClick={() => navigate('/app/profile')}
                className="w-7 h-7 rounded-full border border-border/40 bg-secondary/60 flex items-center justify-center hover:border-primary/30 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Row 2 — Companion + Score */}
          <div className="flex items-center gap-4">
            <div
              className="relative cursor-pointer shrink-0"
              onClick={() => navigate('/app/companion')}
              style={caliBouncing ? { animation: 'caliBounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' } : undefined}
            >
              <CompanionCreature companionState={companion} size={104} interactive />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative shrink-0" style={allFocusAndMiniDone ? { animation: 'ringPulseGreen 0.6s ease-in-out 3' } : undefined}>
                  <ScoreRing score={Math.min(100, longevityScore + scoreBoost)} size={52} strokeWidth={5} trend={scoreTrend} label="" pillarDots={pillarDots} />
                  {scoreBoost > 0 && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 font-outfit text-[10px] font-bold text-primary pointer-events-none" style={{ animation: 'scoreBoostFloat 1.2s ease-out forwards' }}>+{scoreBoost}</span>
                  )}
                </div>
                <div>
                  <p className="font-outfit text-3xl font-bold text-foreground leading-none">{Math.min(100, longevityScore + scoreBoost)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Longevity Score</p>
                </div>
              </div>
              {/* Status-Satz */}
              <p className={cn('text-xs leading-snug', reactionSpeech ? 'text-primary font-medium' : 'text-muted-foreground/80')}>
                {companionSpeech.length > 88 ? companionSpeech.slice(0, 86) + '…' : companionSpeech}
              </p>
            </div>
          </div>

          {/* Row 3 — 4 Säulen 2×2 Grid (alle gleichwertig) */}
          <div className="grid grid-cols-2 gap-2">
            {PILLAR_META.map((p) => {
              const score = pillarScores[p.key];
              const Icon = p.icon;
              const isActive = activePillars.includes(p.key);
              const isWeakest = p.key === weakest && isActive;
              const isDefault = score === 50 && !todayCheckIn && todayActivityLog.length === 0 && todayNutritionLogs.length === 0;
              const barColor = score >= 66 ? 'bg-primary' : score >= 33 ? 'bg-amber-400' : 'bg-destructive/70';
              const yesterdayScore = yesterdayPillarScores?.[p.key];
              const improved = yesterdayScore !== undefined && score > yesterdayScore;
              const trackedToday = trackedPillars.has(p.key);
              return (
                <button
                  key={p.key}
                  className={cn(
                    'flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left active:scale-[0.97] relative overflow-hidden',
                    !isActive ? 'border-border/15 opacity-35'
                      : isWeakest ? 'border-amber-400/30'
                      : 'border-border/20',
                  )}
                  style={{
                    background: !isActive ? 'var(--gradient-card)'
                      : isWeakest ? 'linear-gradient(135deg, hsl(38 92% 50% / 0.07), transparent)'
                      : 'var(--gradient-card)',
                    animation: pillarFlash === p.key ? 'pillarGlowFlash 0.6s ease-out' : undefined,
                  }}
                  onClick={() => {
                    if (!isActive && hasProgressiveSystem) { setActivationPillar(p.key); setActivationSheetOpen(true); }
                    else if (isActive) { setQuickTrackPillar(p.key); }
                    else { navigate('/app/zielsystem'); }
                  }}
                >
                  {!isActive && <Lock className="w-2.5 h-2.5 text-muted-foreground/25 absolute top-2 right-2" />}
                  {trackedToday && isActive && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />}
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', isActive ? (isWeakest ? 'bg-amber-400/12' : 'bg-primary/10') : 'bg-secondary/20')}>
                    <Icon className={cn('w-4 h-4', isActive ? (isWeakest ? 'text-amber-400' : 'text-primary') : 'text-muted-foreground/25')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className={cn('text-[10px] font-semibold', isActive ? 'text-muted-foreground' : 'text-muted-foreground/30')}>{p.label}</span>
                      <span className={cn('font-outfit text-sm font-bold', isActive && !isDefault ? (isWeakest ? 'text-amber-400' : 'text-foreground') : 'text-muted-foreground/30')}>
                        {isActive ? (isDefault ? '–' : score) : '–'}
                        {improved && !isDefault && <TrendingUp className="inline w-2.5 h-2.5 text-primary ml-0.5 align-middle" />}
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-secondary/40 overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-700', isActive && !isDefault ? barColor : 'bg-transparent')} style={{ width: isActive && !isDefault ? `${score}%` : '0%' }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Row 4 — Größter Hebel (nur wenn check-in erfolgt) */}
          {todayCheckIn && (
            <div className="flex items-center gap-2.5 pt-3 border-t border-border/15">
              {(() => {
                const WeakIcon = PILLAR_META.find(p => p.key === weakest)?.icon || Activity;
                const isLow = (pillarScores as any)[weakest] < 40;
                return (
                  <>
                    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0', isLow ? 'bg-destructive/10' : 'bg-amber-400/10')}>
                      <WeakIcon className={cn('w-3.5 h-3.5', isLow ? 'text-destructive' : 'text-amber-400')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Größter Hebel heute</p>
                      <p className="text-xs text-foreground font-semibold truncate">{focusDailyAction.title}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Share-Button */}
        <button
          onClick={handleShare}
          className="absolute top-4 right-16 w-7 h-7 rounded-full bg-secondary/25 border border-border/15 flex items-center justify-center active:scale-90 transition-transform"
          title="Score teilen"
        >
          <Share2 className="w-3 h-3 text-muted-foreground/50" />
        </button>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* SETUP CHECKLIST — guided intro for new users     */}
      {/* ══════════════════════════════════════════════════ */}
      <SetupChecklist
        checkInHistory={checkInHistory}
        goalPlan={goalPlan}
        userCreatedAt={user?.created_at}
      />

      {/* ══════════════════════════════════════════════════ */}
      {/* BLOCK 2 — HEUTE WICHTIG (dominante Hauptkarte)   */}
      {/* ══════════════════════════════════════════════════ */}
      {!hasCheckedIn ? (
        <div
          className="rounded-2xl border border-primary/35 p-5 cursor-pointer active:scale-[0.99] transition-transform"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.11), hsl(var(--primary) / 0.04))', animation: hour >= 7 ? 'glowPulseGreen 3s ease-in-out infinite' : undefined }}
          onClick={() => navigate('/app/checkin')}
        >
          <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-3">Heute wichtig</p>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-bold text-foreground leading-tight">Tages-Check-in</p>
              <p className="text-xs text-muted-foreground mt-0.5">Wie geht's dir heute? CALI zeigt dir was zählt.</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
              <ChevronRight className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
        </div>
      ) : focusCompleted ? (
          /* ── Completed state: premium "done" card ── */
          <div className="rounded-2xl border border-primary/25 p-5"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">Heute wichtig</p>
              <div className="flex items-center gap-1.5 bg-primary/15 border border-primary/25 rounded-full px-2.5 py-1">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold text-primary">Abgeschlossen</span>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <FocusIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-foreground leading-tight">{focusDailyAction.title}</p>
                <p className="text-xs text-primary/60 mt-0.5">Heute erledigt · gut gemacht</p>
              </div>
            </div>
            {/* Next leverage hint */}
            {todayCheckIn && (
              <div className="mt-3 pt-3 border-t border-primary/15">
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-1">Nächster Hebel</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{companion.actionSuggestion}</p>
              </div>
            )}
          </div>
        ) : (
          /* ── Open state: actionable card ── */
          <div className="rounded-2xl border border-primary/25 p-5"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.09), hsl(var(--primary) / 0.02))' }}>
            <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-3">Heute wichtig</p>
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <FocusIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-foreground leading-tight">{focusDailyAction.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{focusDailyAction.whyText}</p>
              </div>
            </div>
            <Button className="w-full glow-neon" onClick={handleFocusComplete}>
              <CheckCircle2 className="w-4 h-4 mr-2" />Erledigt
            </Button>
          </div>
      )}

      {/* ════════════════════════════════════════ */}
      {/* QUICK STATS STRIP — compact horizontal  */}
      {/* ════════════════════════════════════════ */}
      {hasCheckedIn && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {/* Streak chip */}
          <div className="flex items-center gap-1.5 rounded-full border border-border/20 bg-secondary/20 px-3 py-1.5 shrink-0">
            <Flame className={cn('w-3 h-3', streak >= 7 ? 'text-amber-400' : 'text-primary/70')} />
            <span className="text-[10px] font-bold text-foreground">{streak} Tage</span>
          </div>
          {/* Protein chip */}
          <button onClick={() => navigate('/app/nutrition')} className="flex items-center gap-1.5 rounded-full border border-border/20 bg-secondary/20 px-3 py-1.5 shrink-0 active:scale-95 transition-transform">
            <Egg className={cn('w-3 h-3', proteinPercent >= 80 ? 'text-primary' : proteinPercent >= 50 ? 'text-amber-400' : 'text-muted-foreground')} />
            <span className="text-[10px] font-bold text-foreground">{todayProtein}g/{proteinTarget}g</span>
          </button>
          {/* Focus pillar chip */}
          <div className="flex items-center gap-1.5 rounded-full border border-border/20 bg-secondary/20 px-3 py-1.5 shrink-0">
            <FocusIcon className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-foreground">{PILLAR_META.find(p => p.key === focusResult.focusPillar)?.label || ''}</span>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* DEIN TAG IM DETAIL — links to Heute tab         */}
      {/* ════════════════════════════════════════════════ */}
      {hasCheckedIn && (
        <button
          onClick={() => navigate('/app/heute')}
          className="w-full rounded-2xl border border-border/20 overflow-hidden active:scale-[0.99] transition-transform"
          style={{ background: 'var(--gradient-card)' }}
        >
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Dein Tag im Detail</span>
              <span className="text-[9px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                {(() => {
                  let count = 0;
                  if (autopilotActions.length > 0) count += autopilotActions.filter(a => !miniChecked[a.pillar]).length;
                  else count += focusResult.miniActions.filter(m => !miniChecked[m.pillar]).length;
                  return count > 0 ? `${count} offen` : 'Alles erledigt';
                })()}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
          </div>
        </button>
      )}

      {/* Unlock-Prompt */}
      {showUnlockPrompt && nextPillarRecommendation && (
        <div className="rounded-2xl border border-primary/30 p-4 space-y-3" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.02))' }}>
          <div className="flex items-start gap-2">
            <img src="/images/caliness-logo-white.png" alt="" className="w-4 h-4 object-contain mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground mb-1">Bereit für eine neue Säule?</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{nextPillarRecommendation.reason}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 glow-neon text-xs" onClick={() => { setActivationPillar(nextPillarRecommendation.recommended); setActivationSheetOpen(true); }}>
              <Sparkles className="w-3 h-3 mr-1" />Säule aktivieren
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={handleUnlockDecline}>Noch nicht</Button>
          </div>
        </div>
      )}

      {/* Abend- & Wochenreport-Banner — only when relevant */}
      {isPremium && showEveningBanner && (
        <button onClick={() => setEveningOpen(true)} className="w-full rounded-xl border border-border/40 p-3 flex items-center gap-3 text-left active:scale-[0.99]" style={{ background: 'linear-gradient(135deg, hsl(260, 40%, 15%) 0%, hsl(260, 30%, 10%) 100%)' }}>
          <span className="text-lg">🌙</span>
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">Tag abschließen</p>
            <p className="text-[9px] text-muted-foreground">Abendreflexion</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      )}
      {showWeeklyReviewBanner && (
        <button onClick={() => navigate('/app/weekly-report')} className="w-full rounded-xl border border-primary/20 p-3 flex items-center gap-3 text-left active:scale-[0.99] transition-transform" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--primary) / 0.02))' }}>
          <Award className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">Dein Wochenrückblick ist bereit</p>
            <p className="text-[9px] text-muted-foreground">Ergebnisse, Fortschritt & nächste Woche</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-primary" />
        </button>
      )}

      {/* ─── Quick Track Bar (fixed) ─── */}
      <div className="fixed bottom-16 left-0 right-0 z-40">
        <div className="max-w-lg mx-auto px-4">
          <div className="h-12 rounded-full border border-border/40 bg-card/95 backdrop-blur-xl flex items-center justify-around px-4 shadow-lg">
            {PILLAR_META.filter(p => activePillars.includes(p.key)).map(p => {
              const Icon = p.icon;
              const tracked = trackedPillars.has(p.key);
              return (
                <button key={p.key} onClick={() => setQuickTrackPillar(p.key)}
                  className={cn('w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 relative', tracked ? 'bg-primary/10' : 'bg-secondary/30')}
                  style={!tracked && todayActionCount === 0 ? { animation: 'glowPulseGreen 3s ease-in-out infinite' } : undefined}>
                  <Icon className={cn('w-4 h-4', tracked ? 'text-primary' : 'text-muted-foreground')} />
                  {tracked && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Modals & Sheets ─── */}
      {trainingBlock && (
        <TrainingModal open={trainingModalOpen} onClose={() => { setTrainingModalOpen(false); setTrainingBlock(null); }}
          blockLabel={trainingBlock.label} blockTime={trainingBlock.time} blockDuration={trainingBlock.duration}
          dayIdx={trainingBlock.dayIdx} blockIdx={trainingBlock.blockIdx} />
      )}
      {eveningOpen && (
        <Suspense fallback={null}>
          <EveningReflection open={eveningOpen} onClose={() => setEveningOpen(false)} companion={companion} tomorrowBlock={tomorrowBlock} goalPlan={goalPlan} />
        </Suspense>
      )}
      <QuickMealLog open={quickLogOpen} onOpenChange={setQuickLogOpen} />
      {quickTrackPillar && (
        <QuickTrackSheet open={!!quickTrackPillar} onOpenChange={(open) => { if (!open) setQuickTrackPillar(null); }} pillar={quickTrackPillar} />
      )}
      <RecipeDetail recipe={selectedRecipe} open={recipeDetailOpen} onOpenChange={setRecipeDetailOpen} onLog={selectedRecipe ? () => logRecipe(selectedRecipe) : undefined} />
      {activationPillar && (
        <PillarActivationSheet open={activationSheetOpen}
          onOpenChange={(open) => { if (!open) { setActivationSheetOpen(false); setActivationPillar(null); } }}
          pillar={activationPillar} onActivate={handlePillarActivate}
          recommendation={nextPillarRecommendation?.recommended === activationPillar ? nextPillarRecommendation : null} />
      )}
    </div>
  );
}
