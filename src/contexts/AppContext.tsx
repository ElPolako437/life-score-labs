import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { calculatePillarScores, calculateLongevityScore, calculateRollingLongevityScore, getProfileLevel } from '@/lib/scoring';
import { computeCompanionState, computeEvolution } from '@/lib/companionState';
import type { NutritionTargets } from '@/lib/nutritionTargets';
import { toast } from 'sonner';
import { buildMealPreferenceProfile, persistPreferenceProfile } from '@/lib/mealPreferences';
import { RECIPE_TEMPLATES } from '@/lib/pillarPlans';

export interface UserProfile {
  name: string;
  age: number;
  gender: 'männlich' | 'weiblich' | 'divers';
  height: number;
  weight: number;
  goals: string[];
  activityLevel: string;
  sleepQuality: string;
  stressLevel: string;
  onboardingComplete: boolean;
}

export interface DailyCheckIn {
  date: string;
  sleepHours: number;
  sleepQuality: number;
  energy: number;
  stress: number;
  mood: number;
  training: boolean;
  steps: number;
  proteinQuality: string;
  hydration: string;
  recovery: number;
  alcohol: boolean;
  screenTimeNight: boolean;
}

export interface PillarScores {
  bewegung: number;
  ernaehrung: number;
  regeneration: number;
  mental: number;
}

export interface ProtocolProgress {
  protocolId: string;
  startDate: string;
  completedDays: number[];
  currentDay: number;
}

export interface ScoreHistoryEntry {
  date: string;
  score: number;
  pillars: PillarScores;
}

export interface TrainingExercise {
  name: string;
  sets: number;
  reps: string;
  weight: number;
}

export interface TrainingLog {
  date: string;
  exercises: TrainingExercise[];
  duration: number;
  type: string;
  source?: 'plan' | 'manual';
  planSessionType?: string;
  note?: string;
}

export interface MealLog {
  date: string;
  meals: { name: string; calories: number; protein: number; carbs: number; fat: number }[];
  totalCalories: number;
  totalProtein: number;
}

export interface WeightEntry {
  date: string;
  weight: number;
  bodyFat?: number;
}

export interface GeneratedPlan {
  id: string;
  type: 'training' | 'nutrition';
  plan: any;
  createdAt: string;
}

export interface WearableEntry {
  date: string;
  steps?: number;
  hrv?: number;
  restingHR?: number;
  sleepHours?: number;
  spo2?: number;
  source: string;
}

export interface HabitDefinition {
  id: string;
  label: string;
  icon: string;
}

export interface HabitDay {
  date: string;
  completedHabits: string[];
}

export interface GoalPlanData {
  goalType: string;
  goalDescription: string;
  targetDate: string;
  targetWeeks: number;
  createdAt: string;
  weeklyPlan: any;
  realismResult: any;
  completedBlocks: string[];
  remindersEnabled: boolean;
  secondaryGoal?: string;
  followUpAnswers?: Record<string, any>;
  pillarAssessment?: any;
  // Progressive pillar activation
  activePillars?: string[];
  pillarActivationDates?: Record<string, string>; // pillar → ISO date when activated
  lastUnlockPromptDate?: string; // last time we showed unlock prompt
  unlockPromptDeclined?: boolean; // user said "not yet"
  pillarActivationAnswers?: Record<string, Record<string, any>>; // pillar → answers
  // Pillar plan data (persisted)
  nutritionPlan?: any;
  trainingPlanData?: any;
  recoveryTips?: any[];
  mentalTips?: any[];
  // Plan check-in tracking
  planCheckInHistory?: Record<string, Record<string, 'done' | 'partial' | 'skipped'>>;
  // Activity logs
  activityLogs?: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  date: string;
  timestamp: string;
  pillar: 'bewegung' | 'ernaehrung' | 'regeneration' | 'mental';
  type: string;
  label: string;
  duration?: number;
  source: 'plan' | 'checkin' | 'manual';
  details?: any;
  intensity?: string;
  note?: string;
}

export interface BadgeDefinition {
  id: string;
  label: string;
  emoji: string;
  description: string;
  unlockedAt?: string;
}

export interface NutritionLogMealIngredient {
  name: string;
  amount: number;
  unit: 'g' | 'ml' | 'stk';
  protein_per_100: number;
  calories_per_100: number;
}

export interface NutritionLogMeal {
  name: string;
  type: string;
  description: string;
  proteinLevel: string;
  estimatedProtein: number;
  time: string;
  customIngredients?: NutritionLogMealIngredient[];
  estimatedCalories?: number;
  status?: 'eaten' | 'swapped' | 'skipped';
  swappedFrom?: string;
}

export interface NutritionLogEntry {
  date: string;
  meals: NutritionLogMeal[];
  estimatedProteinTotal: number;
  qualityRating: string;
}

interface PendingMilestone {
  oldTier: string;
  newTier: string;
}

export interface SubscriptionData {
  subscribed: boolean;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface AppState {
  loading: boolean;
  dataLoaded: boolean;
  profile: UserProfile;
  todayCheckIn: DailyCheckIn | null;
  checkInHistory: DailyCheckIn[];
  pillarScores: PillarScores;
  longevityScore: number;
  profileLevel: string;
  scoreTrend: 'up' | 'down' | 'stable';
  scoreWeeklyChange: number;
  protocolProgress: ProtocolProgress[];
  scoreHistory: ScoreHistoryEntry[];
  streak: number;
  weeklyConsistency: number;
  trainingLogs: TrainingLog[];
  mealLogs: MealLog[];
  weightEntries: WeightEntry[];
  generatedPlans: GeneratedPlan[];
  wearableEntries: WearableEntry[];
  habits: HabitDefinition[];
  habitHistory: HabitDay[];
  goalPlan: GoalPlanData | null;
  isPremium: boolean;
  premiumSource: string;
  userRole: string;
  isDevPreview: boolean;
  subscription: SubscriptionData;
  coachMemory: string[];
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
  nutritionTargets: NutritionTargets | null;
  nutritionLogs: NutritionLogEntry[];
  weeklyNutritionPlan: any;
  nutritionPatterns: any;
  pendingMilestone: PendingMilestone | null;
  dailyCoachMessages: number;
  canSendCoachMessage: boolean;
  badges: BadgeDefinition[];
  addBadge: (badge: BadgeDefinition) => void;
  clearMilestone: () => void;
  setProfile: (p: Partial<UserProfile>) => void;
  completeOnboarding: (p: Partial<UserProfile>) => void;
  submitCheckIn: (c: DailyCheckIn) => void;
  startProtocol: (protocolId: string) => void;
  toggleProtocolDay: (protocolId: string, day: number) => void;
  addTrainingLog: (log: TrainingLog) => void;
  addMealLog: (log: MealLog) => void;
  addWeightEntry: (entry: WeightEntry) => void;
  addGeneratedPlan: (plan: GeneratedPlan) => void;
  addWearableEntry: (entry: WearableEntry) => void;
  toggleHabit: (habitId: string, date: string) => void;
  addHabit: (habit: HabitDefinition) => void;
  removeHabit: (habitId: string) => void;
  togglePremium: () => void;
  startCheckout: () => void;
  openBillingPortal: () => void;
  incrementCoachMessage: () => void;
  addCoachMemory: (fact: string) => void;
  setChatHistory: (messages: { role: 'user' | 'assistant'; content: string }[]) => void;
  setGoalPlan: (plan: GoalPlanData | null | ((prev: GoalPlanData | null) => GoalPlanData | null)) => void;
  setNutritionTargets: (t: NutritionTargets) => void;
  addNutritionLog: (log: NutritionLogEntry) => void;
  setWeeklyNutritionPlan: (plan: any) => void;
  setNutritionPatterns: (patterns: any) => void;
  activityLog: ActivityLog[];
  addActivityLog: (entry: Omit<ActivityLog, 'id' | 'date' | 'timestamp'>) => void;
  focusChecked: boolean[];
  setFocusChecked: React.Dispatch<React.SetStateAction<boolean[]>>;
  toggleFocusChecked: (idx: number) => void;
  updateProtocolProgress: (protocolId: string, data: { started?: boolean; currentDay?: number; startDate?: string }) => void;
}

const defaultProfile: UserProfile = {
  name: '', age: 30, gender: 'männlich', height: 175, weight: 80,
  goals: [], activityLevel: 'moderat', sleepQuality: 'mittel', stressLevel: 'mittel',
  onboardingComplete: false,
};

const defaultHabits: HabitDefinition[] = [
  { id: 'protein', label: '30g Protein zum Frühstück', icon: 'Egg' },
  { id: 'movement', label: '10 Min Bewegung', icon: 'Footprints' },
  { id: 'water', label: '2L Wasser', icon: 'Droplets' },
  { id: 'screen', label: 'Kein Bildschirm ab 21 Uhr', icon: 'MonitorOff' },
  { id: 'breathe', label: '5 Min Atemübung', icon: 'Wind' },
];

const defaultPillars: PillarScores = { bewegung: 50, ernaehrung: 50, regeneration: 50, mental: 50 };

const AppContext = createContext<AppState | null>(null);

/* ─── Helpers ─── */

function dbCheckInToLocal(row: any): DailyCheckIn {
  return {
    date: row.date,
    sleepHours: Number(row.sleep_hours),
    sleepQuality: row.sleep_quality,
    energy: row.energy,
    stress: row.stress,
    mood: row.mood,
    training: row.training,
    steps: row.steps,
    proteinQuality: row.protein_quality,
    hydration: row.hydration,
    recovery: row.recovery,
    alcohol: row.alcohol,
    screenTimeNight: row.screen_time_night,
  };
}

function dbScoreToLocal(row: any): ScoreHistoryEntry {
  return {
    date: row.date,
    score: Number(row.score),
    pillars: {
      bewegung: Number(row.pillar_bewegung),
      ernaehrung: Number(row.pillar_ernaehrung),
      regeneration: Number(row.pillar_regeneration),
      mental: Number(row.pillar_mental),
    },
  };
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  // Streak must begin from today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  const offset = sorted[0] === yesterday ? 1 : 0;
  let streak = 0;
  for (const d of sorted) {
    const expected = new Date();
    expected.setDate(expected.getDate() - streak - offset);
    if (d === expected.toISOString().split('T')[0]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function loadLS<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

function upsertPreferences(userId: string, patch: Record<string, any>, prefsRef: React.MutableRefObject<Record<string, any>>) {
  const merged = { ...prefsRef.current, ...patch };
  prefsRef.current = merged;
  supabase.from('user_profiles').update({
    preferences: merged,
    updated_at: new Date().toISOString(),
  } as any).eq('id', userId).then(({ error }) => {
    if (error) { console.error('Supabase write failed:', error); toast.error('Sync-Fehler – Daten lokal gespeichert'); }
  });
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const loadedUserRef = useRef<string | null>(null);
  const goalPlanDbIdRef = useRef<string | null>(null);

  const [profile, setProfileState] = useState<UserProfile>(defaultProfile);
  const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckIn | null>(null);
  const [checkInHistory, setCheckInHistory] = useState<DailyCheckIn[]>([]);
  const [protocolProgress, setProtocolProgress] = useState<ProtocolProgress[]>(() => loadLS<ProtocolProgress[]>('caliness_protocol_progress', []));
  const [streak, setStreak] = useState(0);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>([]);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>(
    () => loadLS<TrainingLog[]>('caliness_training_logs', [])
  );
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [generatedPlans, setGeneratedPlans] = useState<GeneratedPlan[]>([]);
  const [wearableEntries, setWearableEntries] = useState<WearableEntry[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumSource, setPremiumSource] = useState('none');
  const [userRole, setUserRole] = useState('user');
  const [goalPlan, setGoalPlanState] = useState<GoalPlanData | null>(null);
  const [habits, setHabits] = useState<HabitDefinition[]>(defaultHabits);
  const [habitHistory, setHabitHistory] = useState<HabitDay[]>([]);
  const [coachMemory, setCoachMemory] = useState<string[]>([]);
  const [chatHistory, setChatHistoryState] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const coachMemoryRef = useRef<string[]>([]);
  const chatHistoryRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [nutritionTargets, setNutritionTargetsState] = useState<NutritionTargets | null>(() => loadLS('caliness_nutrition_targets', null));
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLogEntry[]>([]);
  const [weeklyNutritionPlan, setWeeklyNutritionPlanState] = useState<any>(() => loadLS('caliness_weekly_nutrition_plan', null));
  const [pendingMilestone, setPendingMilestone] = useState<PendingMilestone | null>(null);
  const clearMilestone = useCallback(() => setPendingMilestone(null), []);
  const [nutritionPatterns, setNutritionPatternsState] = useState<any>(() => loadLS('caliness_nutrition_patterns', null));
  const [activityLogState, setActivityLogState] = useState<ActivityLog[]>(() => loadLS<ActivityLog[]>('caliness_activity_log', []));
  const activityLogRef = useRef<ActivityLog[]>(activityLogState);
  const [badges, setBadges] = useState<BadgeDefinition[]>(() => loadLS<BadgeDefinition[]>('caliness_badges', []));
  const [focusChecked, setFocusCheckedState] = useState<boolean[]>(() => loadLS<boolean[]>('caliness_focus_checked', []));
  const preferencesRef = useRef<Record<string, any>>({});
  const [subscription, setSubscription] = useState<SubscriptionData>({
    subscribed: false, subscriptionEnd: null, cancelAtPeriodEnd: false,
  });
  const [dailyCoachMessages, setDailyCoachMessages] = useState(() => {
    const saved = loadLS<{ date: string; count: number }>('caliness_coach_msgs', { date: '', count: 0 });
    const today = new Date().toISOString().split('T')[0];
    return saved.date === today ? saved.count : 0;
  });

  /* ═══ LOAD DATA FROM SUPABASE ═══ */
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setDataLoaded(false);
      loadedUserRef.current = null;
      return;
    }
    if (loadedUserRef.current === user.id) return;
    loadedUserRef.current = user.id;

    (async () => {
      setLoading(true);
      try {
        const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const [profileRes, checkinsRes, scoresRes, nutritionRes, goalRes, coachRes, weightRes, wearableRes, habitRes, activityRes, trainingRes, badgesRes] = await Promise.all([
          supabase.from('user_profiles').select().eq('id', user.id).maybeSingle(),
          supabase.from('daily_checkins').select().eq('user_id', user.id).order('date', { ascending: true }),
          supabase.from('score_history').select().eq('user_id', user.id).order('date', { ascending: true }),
          supabase.from('nutrition_logs').select().eq('user_id', user.id).order('date', { ascending: true }),
          supabase.from('goal_plans').select().eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('coach_sessions').select().eq('user_id', user.id).maybeSingle(),
          supabase.from('weight_entries').select().eq('user_id', user.id).order('date', { ascending: true }),
          supabase.from('wearable_entries').select().eq('user_id', user.id).order('date', { ascending: true }),
          supabase.from('habit_data').select().eq('user_id', user.id).maybeSingle(),
          supabase.from('activity_logs').select().eq('user_id', user.id).gte('date', cutoff).order('date', { ascending: true }),
          supabase.from('training_logs').select().eq('user_id', user.id).gte('date', cutoff).order('date', { ascending: true }),
          supabase.from('badges').select().eq('user_id', user.id),
        ]);

        // Check individual query errors (Supabase JS never throws — returns { data: null, error })
        const criticalErrors: string[] = [];
        if (profileRes.error) { console.error('Load error [user_profiles]:', profileRes.error); criticalErrors.push('Profil'); }
        if (checkinsRes.error) { console.error('Load error [daily_checkins]:', checkinsRes.error); criticalErrors.push('Check-ins'); }
        if (goalRes.error) { console.error('Load error [goal_plans]:', goalRes.error); criticalErrors.push('Zielplan'); }
        if (scoresRes.error) console.error('Load error [score_history]:', scoresRes.error);
        if (nutritionRes.error) console.error('Load error [nutrition_logs]:', nutritionRes.error);
        if (coachRes.error) console.error('Load error [coach_sessions]:', coachRes.error);
        if (weightRes.error) console.error('Load error [weight_entries]:', weightRes.error);
        if (wearableRes.error) console.error('Load error [wearable_entries]:', wearableRes.error);
        if (habitRes.error) console.error('Load error [habit_data]:', habitRes.error);
        if (criticalErrors.length > 0) {
          loadedUserRef.current = null; // allow retry on next page load
          toast.error(`Daten konnten nicht geladen werden (${criticalErrors.join(', ')}). Bitte Seite neu laden.`);
        }

        // Profile
        if (profileRes.data) {
          const p = profileRes.data as any;
          setProfileState({
            name: p.name, age: p.age, gender: p.gender, height: p.height, weight: p.weight,
            goals: p.goals || [], activityLevel: p.activity_level, sleepQuality: p.sleep_quality,
            stressLevel: p.stress_level, onboardingComplete: p.onboarding_complete,
          });
          setIsPremium(p.is_premium || false);
          setPremiumSource(p.premium_source || 'none');
          setUserRole(p.role || 'user');
          setStreak(p.current_streak || 0);
          if (p.nutrition_targets) {
            setNutritionTargetsState(p.nutrition_targets as NutritionTargets);
            localStorage.setItem('caliness_nutrition_targets', JSON.stringify(p.nutrition_targets));
          }
          // Load preferences (protocol progress, focus checked, etc.)
          if (p.preferences && typeof p.preferences === 'object') {
            preferencesRef.current = p.preferences as Record<string, any>;
            if (Array.isArray((p.preferences as any).protocolProgress)) {
              setProtocolProgress((p.preferences as any).protocolProgress);
              localStorage.setItem('caliness_protocol_progress', JSON.stringify((p.preferences as any).protocolProgress));
            }
            if (Array.isArray((p.preferences as any).focusChecked)) {
              setFocusCheckedState((p.preferences as any).focusChecked);
              localStorage.setItem('caliness_focus_checked', JSON.stringify((p.preferences as any).focusChecked));
            }
          }
        }

        // Check-ins
        if (checkinsRes.data && checkinsRes.data.length > 0) {
          const checkins = (checkinsRes.data as any[]).map(dbCheckInToLocal);
          setCheckInHistory(checkins);
          const today = new Date().toISOString().split('T')[0];
          const todayCI = checkins.find(c => c.date === today);
          setTodayCheckIn(todayCI || null);
          // Recompute streak from actual check-in dates (the DB value may be stale if a day passed without check-in)
          const freshStreak = calculateStreak(checkins.map(c => c.date));
          setStreak(freshStreak);
        } else {
          // No check-ins at all → streak is 0, regardless of what the profile stored
          setStreak(0);
        }

        // Score history
        if (scoresRes.data && scoresRes.data.length > 0) {
          setScoreHistory((scoresRes.data as any[]).map(dbScoreToLocal));
        }

        // Nutrition logs
        if (nutritionRes.data && nutritionRes.data.length > 0) {
          setNutritionLogs((nutritionRes.data as any[]).map(r => ({
            date: r.date,
            meals: r.meals || [],
            estimatedProteinTotal: Number(r.estimated_protein_total),
            qualityRating: r.quality_rating,
          })));
        }

        // Goal plan
        if (goalRes.data) {
          const g = goalRes.data as any;
          goalPlanDbIdRef.current = g.id;   // persist DB row id for targeted upsert
          const wp = g.weekly_plan || {};
          setGoalPlanState({
            goalType: g.goal_type, goalDescription: g.goal_description,
            targetDate: g.target_date, targetWeeks: g.target_weeks,
            createdAt: g.created_at, weeklyPlan: g.weekly_plan,
            realismResult: g.realism_result, completedBlocks: g.completed_blocks || [],
            remindersEnabled: g.reminders_enabled,
            secondaryGoal: g.secondary_goal || '',
            followUpAnswers: g.follow_up_answers || {},
            pillarAssessment: (g.pillar_assessment && Object.keys(g.pillar_assessment).length > 0) ? g.pillar_assessment : null,
            nutritionPlan: wp.nutritionPlan || null,
            trainingPlanData: wp.trainingPlanData || null,
            recoveryTips: wp.recoveryTips || null,
            mentalTips: wp.mentalTips || null,
            planCheckInHistory: wp.planCheckInHistory || {},
            activityLogs: wp.activityLogs || [],
            activePillars: wp.activePillars || [],
            pillarActivationDates: wp.pillarActivationDates || {},
            lastUnlockPromptDate: wp.lastUnlockPromptDate || '',
            unlockPromptDeclined: wp.unlockPromptDeclined || false,
            pillarActivationAnswers: wp.pillarActivationAnswers || {},
          });
        }

        // Coach session
        if (coachRes.data) {
          const c = coachRes.data as any;
          setChatHistoryState(c.messages || []);
          setCoachMemory(c.memory_facts || []);
        }

        // Weight entries
        if (weightRes.data && weightRes.data.length > 0) {
          setWeightEntries((weightRes.data as any[]).map(r => ({
            date: r.date, weight: Number(r.weight), bodyFat: r.body_fat ? Number(r.body_fat) : undefined,
          })));
        }

        // Wearable entries
        if (wearableRes.data && wearableRes.data.length > 0) {
          setWearableEntries((wearableRes.data as any[]).map(r => ({
            date: r.date, steps: r.steps, hrv: r.hrv ? Number(r.hrv) : undefined,
            restingHR: r.resting_hr ? Number(r.resting_hr) : undefined,
            sleepHours: r.sleep_hours ? Number(r.sleep_hours) : undefined,
            spo2: r.spo2 ? Number(r.spo2) : undefined, source: r.source,
          })));
        }

        // Habits
        if (habitRes.data) {
          const h = habitRes.data as any;
          if (h.habits && Array.isArray(h.habits) && h.habits.length > 0) setHabits(h.habits);
          if (h.habit_history && Array.isArray(h.habit_history)) setHabitHistory(h.habit_history);
        }

        // Activity logs — Supabase is authoritative; localStorage is a same-session cache only
        if (activityRes.error) {
          console.error('Load error [activity_logs]:', activityRes.error);
          // Fall back to whatever localStorage has (already initialised in useState)
        } else if (activityRes.data && activityRes.data.length > 0) {
          const dbLogs: ActivityLog[] = (activityRes.data as any[]).map(r => ({
            id: r.id,
            date: r.date,
            timestamp: r.timestamp,
            pillar: r.pillar as ActivityLog['pillar'],
            type: r.type,
            label: r.label,
            duration: r.duration ?? undefined,
            source: r.source as ActivityLog['source'],
            details: r.details ?? undefined,
            intensity: r.intensity ?? undefined,
            note: r.note ?? undefined,
          }));
          setActivityLogState(dbLogs);
          localStorage.setItem('caliness_activity_log', JSON.stringify(dbLogs.slice(-200)));
        }

        // Training logs — Supabase is authoritative
        if (trainingRes.error) {
          console.error('Load error [training_logs]:', trainingRes.error);
        } else if (trainingRes.data && trainingRes.data.length > 0) {
          const dbTrainingLogs: TrainingLog[] = (trainingRes.data as any[]).map(r => ({
            date: r.date,
            type: r.type,
            duration: r.duration,
            exercises: r.exercises ?? [],
            source: r.source ?? 'manual',
            planSessionType: r.plan_session_type ?? undefined,
            note: r.note ?? undefined,
          }));
          setTrainingLogs(dbTrainingLogs);
          localStorage.setItem('caliness_training_logs', JSON.stringify(dbTrainingLogs.slice(-100)));
        }

        // Badges — Supabase is authoritative
        if (badgesRes.error) {
          console.error('Load error [badges]:', badgesRes.error);
        } else if (badgesRes.data && badgesRes.data.length > 0) {
          const dbBadges: BadgeDefinition[] = (badgesRes.data as any[]).map(r => ({
            id: r.badge_id,
            label: r.label,
            emoji: r.emoji,
            description: r.description,
            unlockedAt: r.unlocked_at,
          }));
          setBadges(dbBadges);
          localStorage.setItem('caliness_badges', JSON.stringify(dbBadges));
        }

        setDataLoaded(true);

        // Check subscription status (Stripe + manual) — enriches profile data
        try {
          const { data: subData, error: subError } = await supabase.functions.invoke('check-subscription');
          if (!subError && subData && !subData.error) {
            const subscribed = subData.subscribed === true;
            setSubscription({
              subscribed,
              subscriptionEnd: subData.subscription_end || null,
              cancelAtPeriodEnd: subData.cancel_at_period_end || false,
            });
            setIsPremium(subscribed);
            setPremiumSource(subData.premium_source || 'none');
            setUserRole(subData.role || 'user');
          }
        } catch (e) {
          // Non-fatal: profile data already loaded above with premium/role from DB
          console.warn('Subscription check failed (using profile data):', e);
        }
      } catch (err) {
        console.error('Failed to load user data:', err);
        toast.error('Daten konnten nicht geladen werden. Bitte Seite neu laden.');
        setDataLoaded(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  /* ═══ COMPUTED VALUES ═══ */
  const pillarScores = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayActivity = activityLogState.filter(l => l.date === todayStr);
    const todayLogs = nutritionLogs.filter(l => l.date === todayStr);

    if (!todayCheckIn) {
      // No check-in yet — if there are activity logs, compute scores using a neutral baseline check-in
      if (todayActivity.length === 0 && todayLogs.length === 0) return defaultPillars;
      const neutralCheckIn: DailyCheckIn = {
        date: todayStr, sleepHours: 7, sleepQuality: 5, energy: 5, stress: 5,
        mood: 5, training: false, steps: 0, proteinQuality: 'okay', hydration: 'okay',
        recovery: 5, alcohol: false, screenTimeNight: false,
      };
      return calculatePillarScores(
        neutralCheckIn,
        todayLogs.length > 0 ? todayLogs : undefined,
        nutritionTargets ?? undefined,
        todayActivity.length > 0 ? todayActivity : undefined,
      );
    }
    return calculatePillarScores(
      todayCheckIn,
      todayLogs.length > 0 ? todayLogs : undefined,
      nutritionTargets ?? undefined,
      todayActivity.length > 0 ? todayActivity : undefined,
    );
  }, [todayCheckIn, nutritionLogs, nutritionTargets, activityLogState]);
  const longevityScore = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayActivity = activityLogState.filter(l => l.date === todayStr);
    const todayLogs = nutritionLogs.filter(l => l.date === todayStr);
    return calculateRollingLongevityScore(
      checkInHistory, todayCheckIn,
      todayActivity.length > 0 ? todayActivity : undefined,
      todayLogs.length > 0 ? todayLogs : undefined,
      nutritionTargets ?? undefined,
    );
  }, [checkInHistory, todayCheckIn, activityLogState, nutritionLogs, nutritionTargets]);
  const profileLevel = useMemo(() => getProfileLevel(longevityScore), [longevityScore]);
  const weeklyConsistency = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
    const count = checkInHistory.filter(c => c.date >= sevenDaysAgo).length;
    return Math.round((Math.min(count, 7) / 7) * 100);
  }, [checkInHistory]);

  const scoreTrend = useMemo((): 'up' | 'down' | 'stable' => {
    if (scoreHistory.length < 2) return 'stable';
    const recent = scoreHistory.slice(-7);
    const older = scoreHistory.slice(-14, -7);
    if (older.length === 0) return 'stable';
    const recentAvg = recent.reduce((s, e) => s + e.score, 0) / recent.length;
    const olderAvg = older.reduce((s, e) => s + e.score, 0) / older.length;
    const diff = recentAvg - olderAvg;
    if (diff >= 3) return 'up';
    if (diff <= -3) return 'down';
    return 'stable';
  }, [scoreHistory]);

  const scoreWeeklyChange = useMemo(() => {
    if (scoreHistory.length < 2) return 0;
    const recent = scoreHistory.slice(-7);
    const older = scoreHistory.slice(-14, -7);
    if (older.length === 0) return 0;
    const recentAvg = recent.reduce((s, e) => s + e.score, 0) / recent.length;
    const olderAvg = older.reduce((s, e) => s + e.score, 0) / older.length;
    return Math.round(recentAvg - olderAvg);
  }, [scoreHistory]);

  /* ═══ MUTATIONS WITH SUPABASE PERSISTENCE ═══ */

  const setProfile = useCallback((p: Partial<UserProfile>) => {
    setProfileState(prev => {
      const next = { ...prev, ...p };
      if (user) {
        supabase.from('user_profiles').upsert({
          id: user.id, name: next.name, age: next.age, gender: next.gender,
          height: next.height, weight: next.weight, goals: next.goals,
          activity_level: next.activityLevel, sleep_quality: next.sleepQuality,
          stress_level: next.stressLevel, onboarding_complete: next.onboardingComplete,
          updated_at: new Date().toISOString(),
        } as any).then(({ error }) => {
          if (error) {
            console.error('Profile save error:', error);
            toast.error('Profil konnte nicht gespeichert werden.');
          }
        });
      }
      return next;
    });
  }, [user]);

  const completeOnboarding = useCallback((p: Partial<UserProfile>) => {
    setProfileState(prev => {
      const next = { ...prev, ...p, onboardingComplete: true };
      if (user) {
        supabase.from('user_profiles').upsert({
          id: user.id, name: next.name, age: next.age, gender: next.gender,
          height: next.height, weight: next.weight, goals: next.goals,
          activity_level: next.activityLevel, sleep_quality: next.sleepQuality,
          stress_level: next.stressLevel, onboarding_complete: true,
          updated_at: new Date().toISOString(),
        } as any).then(({ error }) => {
          if (error) {
            console.error('Onboarding save error:', error);
            toast.error('Onboarding konnte nicht gespeichert werden. Bitte versuche es erneut.');
          }
        });
      }
      return next;
    });
  }, [user]);

  const submitCheckIn = useCallback((c: DailyCheckIn) => {
    setTodayCheckIn(c);
    setCheckInHistory(prev => {
      const filtered = prev.filter(ci => ci.date !== c.date);
      return [...filtered, c];
    });
    const todayLogs = nutritionLogs.filter(l => l.date === c.date);
    const todayActivity = activityLogState.filter(l => l.date === c.date);
    const p = calculatePillarScores(
      c,
      todayLogs.length > 0 ? todayLogs : undefined,
      nutritionTargets ?? undefined,
      todayActivity.length > 0 ? todayActivity : undefined,
    );
    // Store the rolling score (same value the Home ring displays) so all views are consistent
    const prevHistory = checkInHistory.filter(ci => ci.date !== c.date);
    const s = calculateRollingLongevityScore(
      [...prevHistory, c], c,
      todayActivity.length > 0 ? todayActivity : undefined,
      todayLogs.length > 0 ? todayLogs : undefined,
      nutritionTargets ?? undefined,
    );
    setScoreHistory(prev => {
      const filtered = prev.filter(e => e.date !== c.date);
      return [...filtered, { date: c.date, score: s, pillars: p }];
    });

    if (user) {
      // Upsert check-in
      supabase.from('daily_checkins').upsert({
        user_id: user.id, date: c.date, sleep_hours: c.sleepHours,
        sleep_quality: c.sleepQuality, energy: c.energy, stress: c.stress,
        mood: c.mood, training: c.training, steps: c.steps,
        protein_quality: c.proteinQuality, hydration: c.hydration,
        recovery: c.recovery, alcohol: c.alcohol, screen_time_night: c.screenTimeNight,
      } as any, { onConflict: 'user_id,date' }).then(({ error }) => {
        if (error) {
          console.error('Check-in save error:', error);
          toast.error('Check-in konnte nicht gespeichert werden. Bitte versuche es erneut.');
        }
      });

      // Upsert score (rolling score = what user sees on Home ring)
      supabase.from('score_history').upsert({
        user_id: user.id, date: c.date, score: s,
        pillar_bewegung: p.bewegung, pillar_ernaehrung: p.ernaehrung,
        pillar_regeneration: p.regeneration, pillar_mental: p.mental,
      } as any, { onConflict: 'user_id,date' }).then(({ error }) => {
        if (error) { console.error('Supabase write failed:', error); toast.error('Sync-Fehler – Daten lokal gespeichert'); }
      });

      // Update streak + milestone detection (uses accurate newStreak from DB)
      const totalCheckins = checkInHistory.length + 1;
      const wc = Math.round((Math.min(checkInHistory.slice(-6).length + 1, 7) / 7) * 100);
      const vitality = Math.round(s * 0.7 + wc * 0.3);
      const pillarValues = [p.bewegung, p.ernaehrung, p.regeneration, p.mental];
      const harmonyScore = Math.max(0, 1 - ((Math.max(...pillarValues) - Math.min(...pillarValues)) / 100));

      supabase.from('daily_checkins').select('date').eq('user_id', user.id).order('date', { ascending: false })
        .then(({ data }) => {
          if (data) {
            const newStreak = calculateStreak(data.map((r: any) => r.date));
            setStreak(newStreak);
            supabase.from('user_profiles').update({ current_streak: newStreak, updated_at: new Date().toISOString() } as any)
              .eq('id', user.id);

            // Milestone detection with accurate newStreak
            const prevEvo = computeEvolution(vitality, Math.max(0, newStreak - 1), wc, totalCheckins - 1, harmonyScore);
            const newEvo = computeEvolution(vitality, newStreak, wc, totalCheckins, harmonyScore);
            if (newEvo.tier !== prevEvo.tier) {
              setPendingMilestone({ oldTier: prevEvo.tier, newTier: newEvo.tier });
            }

            // Save companion evolution
            supabase.from('companion_evolution').upsert({
              user_id: user.id,
              evolution_tier: newEvo.tier,
              evolution_progress: newEvo.progress,
              vitality,
              total_checkins: totalCheckins,
              best_streak: newStreak,
              updated_at: new Date().toISOString(),
            } as any, { onConflict: 'user_id' }).then(({ error }) => {
              if (error) console.error('Evolution save error:', error);
            });
          }
        });
    }
  }, [user, checkInHistory, streak, nutritionLogs, nutritionTargets, activityLogState]);

  const startProtocol = useCallback((protocolId: string) => {
    setProtocolProgress(prev => {
      const next = [...prev.filter(p => p.protocolId !== protocolId),
        { protocolId, startDate: new Date().toISOString().split('T')[0], completedDays: [], currentDay: 1 }];
      localStorage.setItem('caliness_protocol_progress', JSON.stringify(next));
      if (user) upsertPreferences(user.id, { protocolProgress: next }, preferencesRef);
      return next;
    });
  }, [user]);

  const toggleProtocolDay = useCallback((protocolId: string, day: number) => {
    setProtocolProgress(prev => {
      const next = prev.map(p => {
        if (p.protocolId !== protocolId) return p;
        const completed = p.completedDays.includes(day) ? p.completedDays.filter(d => d !== day) : [...p.completedDays, day];
        return { ...p, completedDays: completed };
      });
      localStorage.setItem('caliness_protocol_progress', JSON.stringify(next));
      if (user) upsertPreferences(user.id, { protocolProgress: next }, preferencesRef);
      return next;
    });
  }, [user]);

  const updateProtocolProgress = useCallback((protocolId: string, data: { started?: boolean; currentDay?: number; startDate?: string }) => {
    setProtocolProgress(prev => {
      let next: ProtocolProgress[];
      const existing = prev.find(p => p.protocolId === protocolId);
      if (existing) {
        next = prev.map(p => p.protocolId === protocolId ? { ...p, ...data } : p);
      } else {
        next = [...prev, { protocolId, startDate: data.startDate || new Date().toISOString().split('T')[0], completedDays: [], currentDay: data.currentDay || 1 }];
      }
      localStorage.setItem('caliness_protocol_progress', JSON.stringify(next));
      if (user) upsertPreferences(user.id, { protocolProgress: next }, preferencesRef);
      return next;
    });
  }, [user]);

  const addTrainingLog = useCallback((log: TrainingLog) => {
    setTrainingLogs(prev => {
      const next = [...prev, log];
      localStorage.setItem('caliness_training_logs', JSON.stringify(next.slice(-100)));
      return next;
    });
    if (user) {
      supabase.from('training_logs').insert({
        user_id: user.id,
        date: log.date,
        type: log.type,
        duration: log.duration,
        exercises: log.exercises as any,
        source: log.source || 'manual',
        note: log.note || null,
        plan_session_type: log.planSessionType || null,
      } as any).then(({ error }) => {
        if (error) { console.error('Supabase write failed:', error); toast.error('Sync-Fehler – Daten lokal gespeichert'); }
      });
    }
  }, [user]);
  const addMealLog = useCallback((log: MealLog) => setMealLogs(prev => [...prev, log]), []);

  const addWeightEntry = useCallback((entry: WeightEntry) => {
    setWeightEntries(prev => [...prev, entry]);
    if (user) {
      supabase.from('weight_entries').upsert({
        user_id: user.id, date: entry.date, weight: entry.weight,
        body_fat: entry.bodyFat || null,
      } as any, { onConflict: 'user_id,date' }).then(({ error }) => {
        if (error) console.error('Weight save error:', error);
      });
    }
  }, [user]);

  const addGeneratedPlan = useCallback((plan: GeneratedPlan) => setGeneratedPlans(prev => [...prev, plan]), []);

  const addWearableEntry = useCallback((entry: WearableEntry) => {
    setWearableEntries(prev => [...prev, entry]);
    if (user) {
      supabase.from('wearable_entries').upsert({
        user_id: user.id, date: entry.date, steps: entry.steps || null,
        hrv: entry.hrv || null, resting_hr: entry.restingHR || null,
        sleep_hours: entry.sleepHours || null, spo2: entry.spo2 || null,
        source: entry.source,
      } as any, { onConflict: 'user_id,date' }).then(({ error }) => {
        if (error) console.error('Wearable save error:', error);
      });
    }
  }, [user]);

  const togglePremium = useCallback(() => {
    // Legacy: now controlled via Stripe. This just calls startCheckout.
    startCheckout();
  }, []);

  const startCheckout = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Checkout error: User not logged in');
        window.location.href = '/auth';
        return;
      }
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (e) {
      console.error('Checkout error:', e);
      toast.error('Checkout konnte nicht gestartet werden. Bitte versuche es erneut.');
    }
  }, []);

  const openBillingPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      console.error('Portal error:', e);
    }
  }, []);

  const isDevPreview = userRole === 'admin' || premiumSource === 'developer';
  const devPreviewOff = typeof window !== 'undefined' && sessionStorage.getItem('caliness_dev_preview_off') === 'true';
  const effectiveIsPremium = isDevPreview && devPreviewOff ? false : isPremium;
  const canSendCoachMessage = effectiveIsPremium || dailyCoachMessages < 3;

  const incrementCoachMessage = useCallback(() => {
    setDailyCoachMessages(prev => {
      const next = prev + 1;
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('caliness_coach_msgs', JSON.stringify({ date: today, count: next }));
      return next;
    });
  }, []);

  const setGoalPlan = useCallback((planOrFn: GoalPlanData | null | ((prev: GoalPlanData | null) => GoalPlanData | null)) => {
    setGoalPlanState(prev => {
      const next = typeof planOrFn === 'function' ? planOrFn(prev) : planOrFn;
      // Persist to localStorage as backup
      if (next) localStorage.setItem('caliness_goal_plan', JSON.stringify(next));
      else localStorage.removeItem('caliness_goal_plan');
      if (user) {
        if (next) {
          supabase.from('goal_plans').upsert({
            // pass id if we have it → UPDATE; omit on first INSERT, then capture it
            ...(goalPlanDbIdRef.current ? { id: goalPlanDbIdRef.current } : {}),
            user_id: user.id, goal_type: next.goalType, goal_description: next.goalDescription,
            target_date: next.targetDate, target_weeks: next.targetWeeks,
            weekly_plan: {
              nutritionPlan: next.nutritionPlan,
              trainingPlanData: next.trainingPlanData,
              recoveryTips: next.recoveryTips,
              mentalTips: next.mentalTips,
              planCheckInHistory: next.planCheckInHistory,
              activityLogs: next.activityLogs,
              activePillars: next.activePillars,
              pillarActivationDates: next.pillarActivationDates,
              lastUnlockPromptDate: next.lastUnlockPromptDate,
              unlockPromptDeclined: next.unlockPromptDeclined,
              pillarActivationAnswers: next.pillarActivationAnswers,
            },
            realism_result: next.realismResult,
            completed_blocks: next.completedBlocks, reminders_enabled: next.remindersEnabled,
            secondary_goal: next.secondaryGoal || '',
            follow_up_answers: next.followUpAnswers || {},
            pillar_assessment: next.pillarAssessment || {},
            updated_at: new Date().toISOString(),
          } as any)
          .select('id')
          .then(({ data, error }) => {
            if (error) {
              console.error('Goal save error:', error);
              toast.error('Ziel konnte nicht gespeichert werden. Bitte Seite neu laden.');
            } else if (data?.[0]?.id && !goalPlanDbIdRef.current) {
              goalPlanDbIdRef.current = data[0].id;  // capture id from first INSERT
            }
          });
        } else {
          goalPlanDbIdRef.current = null;
          supabase.from('goal_plans').delete().eq('user_id', user.id)
            .then(({ error }) => { if (error) console.error('Goal delete error:', error); });
        }
      }
      return next;
    });
  }, [user]);

  const toggleHabit = useCallback((habitId: string, date: string) => {
    setHabitHistory(prev => {
      const existing = prev.find(d => d.date === date);
      let updated: HabitDay[];
      if (existing) {
        updated = prev.map(d => {
          if (d.date !== date) return d;
          const has = d.completedHabits.includes(habitId);
          return { ...d, completedHabits: has ? d.completedHabits.filter(id => id !== habitId) : [...d.completedHabits, habitId] };
        });
      } else {
        updated = [...prev, { date, completedHabits: [habitId] }];
      }
      if (user) {
        supabase.from('habit_data').upsert({
          user_id: user.id, habits, habit_history: updated, updated_at: new Date().toISOString(),
        } as any, { onConflict: 'user_id' }).then(({ error }) => { if (error) console.error('Habit save error:', error); });
      }
      return updated;
    });
  }, [user, habits]);

  const addHabit = useCallback((habit: HabitDefinition) => {
    setHabits(prev => {
      const u = [...prev, habit];
      if (user) {
        supabase.from('habit_data').upsert({
          user_id: user.id, habits: u, habit_history: habitHistory, updated_at: new Date().toISOString(),
        } as any, { onConflict: 'user_id' });
      }
      return u;
    });
  }, [user, habitHistory]);

  const removeHabit = useCallback((habitId: string) => {
    setHabits(prev => {
      const u = prev.filter(h => h.id !== habitId);
      if (user) {
        supabase.from('habit_data').upsert({
          user_id: user.id, habits: u, habit_history: habitHistory, updated_at: new Date().toISOString(),
        } as any, { onConflict: 'user_id' });
      }
      return u;
    });
  }, [user, habitHistory]);

  // Keep refs in sync so callbacks always see current values without stale closures
  coachMemoryRef.current = coachMemory;
  chatHistoryRef.current = chatHistory;
  activityLogRef.current = activityLogState;

  const addCoachMemory = useCallback((fact: string) => {
    setCoachMemory(prev => {
      const u = [...prev, fact].slice(-50);
      if (user) {
        supabase.from('coach_sessions').upsert({
          user_id: user.id, messages: chatHistoryRef.current, memory_facts: u, updated_at: new Date().toISOString(),
        } as any, { onConflict: 'user_id' });
      }
      return u;
    });
  }, [user]);

  const setChatHistory = useCallback((messages: { role: 'user' | 'assistant'; content: string }[]) => {
    const trimmed = messages.slice(-100);
    setChatHistoryState(trimmed);
    if (user) {
      supabase.from('coach_sessions').upsert({
        user_id: user.id, messages: trimmed, memory_facts: coachMemoryRef.current, updated_at: new Date().toISOString(),
      } as any, { onConflict: 'user_id' });
    }
  }, [user]);

  const setNutritionTargets = useCallback((t: NutritionTargets) => {
    setNutritionTargetsState(t);
    localStorage.setItem('caliness_nutrition_targets', JSON.stringify(t));
    if (user) {
      supabase.from('user_profiles').update({
        nutrition_targets: t as any, updated_at: new Date().toISOString(),
      } as any).eq('id', user.id).then(({ error }) => {
        if (error) console.error('nutritionTargets save error:', error);
      });
    }
  }, [user]);

  const addNutritionLog = useCallback((log: NutritionLogEntry) => {
    setNutritionLogs(prev => {
      const updatedLogs = [...prev, log];
      // Fire-and-forget: rebuild meal preference profile from all logs
      if (user) {
        try {
          const profile = buildMealPreferenceProfile(updatedLogs, RECIPE_TEMPLATES);
          persistPreferenceProfile(profile, user.id);
        } catch { /* silently ignore preference build errors */ }
      }
      return updatedLogs;
    });
    if (user) {
      supabase.from('nutrition_logs').insert({
        user_id: user.id, date: log.date, meals: log.meals as any,
        estimated_protein_total: log.estimatedProteinTotal, quality_rating: log.qualityRating,
      } as any).then(({ error }) => {
        if (error) { console.error('Supabase write failed:', error); toast.error('Sync-Fehler – Daten lokal gespeichert'); }
      });
    }
    // Recalculate and persist today's score so scoreHistory stays in sync
    {
      const todayStr = new Date().toISOString().split('T')[0];
      const updatedNutritionLogs = [...nutritionLogs, log].filter(l => l.date === todayStr);
      const todayActivity = activityLogRef.current.filter(l => l.date === todayStr);
      const effectiveCheckIn = todayCheckIn && todayCheckIn.date === todayStr ? todayCheckIn : {
        date: todayStr, sleepHours: 7, sleepQuality: 5, energy: 5, stress: 5,
        mood: 5, training: false, steps: 0, proteinQuality: 'okay' as const, hydration: 'okay' as const,
        recovery: 5, alcohol: false, screenTimeNight: false,
      };
      const newPillars = calculatePillarScores(
        effectiveCheckIn,
        updatedNutritionLogs.length > 0 ? updatedNutritionLogs : undefined,
        nutritionTargets ?? undefined,
        todayActivity.length > 0 ? todayActivity : undefined,
      );
      const newScore = calculateRollingLongevityScore(
        checkInHistory,
        effectiveCheckIn,
        todayActivity.length > 0 ? todayActivity : undefined,
        updatedNutritionLogs.length > 0 ? updatedNutritionLogs : undefined,
        nutritionTargets ?? undefined,
      );
      setScoreHistory(prev => {
        const filtered = prev.filter(e => e.date !== todayStr);
        return [...filtered, { date: todayStr, score: newScore, pillars: newPillars }];
      });
      if (user) {
        supabase.from('score_history').upsert({
          user_id: user.id, date: todayStr, score: newScore,
          pillar_bewegung: newPillars.bewegung, pillar_ernaehrung: newPillars.ernaehrung,
          pillar_regeneration: newPillars.regeneration, pillar_mental: newPillars.mental,
        } as any, { onConflict: 'user_id,date' }).then(({ error }) => {
          if (error) { console.error('Supabase write failed:', error); toast.error('Sync-Fehler – Daten lokal gespeichert'); }
        });
      }
    }
  }, [user, todayCheckIn, checkInHistory, nutritionLogs, nutritionTargets]);

  const setWeeklyNutritionPlan = useCallback((plan: any) => {
    setWeeklyNutritionPlanState(plan);
    localStorage.setItem('caliness_weekly_nutrition_plan', JSON.stringify(plan));
  }, []);

  const setNutritionPatterns = useCallback((patterns: any) => {
    setNutritionPatternsState(patterns);
    localStorage.setItem('caliness_nutrition_patterns', JSON.stringify(patterns));
  }, []);

  const addBadge = useCallback((badge: BadgeDefinition) => {
    setBadges(prev => {
      if (prev.some(b => b.id === badge.id)) return prev;
      const withTs = { ...badge, unlockedAt: new Date().toISOString() };
      const next = [...prev, withTs];
      localStorage.setItem('caliness_badges', JSON.stringify(next));
      if (user) {
        supabase.from('badges').insert({
          user_id: user.id,
          badge_id: badge.id,
          label: badge.label,
          emoji: badge.emoji,
          description: badge.description,
          unlocked_at: withTs.unlockedAt,
        } as any).then(({ error }) => { if (error) console.error('Badge save error:', error); });
      }
      return next;
    });
  }, [user]);

  const addActivityLog = useCallback((entry: Omit<ActivityLog, 'id' | 'date' | 'timestamp'>) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const full: ActivityLog = {
      ...entry,
      id: crypto.randomUUID(),
      date: todayStr,
      timestamp: now.toISOString(),
    };
    setActivityLogState(prev => {
      const next = [...prev, full];
      localStorage.setItem('caliness_activity_log', JSON.stringify(next.slice(-200)));
      return next;
    });
    // Persist to Supabase activity_logs table (primary durable store)
    if (user) {
      supabase.from('activity_logs').insert({
        id: full.id,
        user_id: user.id,
        date: full.date,
        timestamp: full.timestamp,
        pillar: full.pillar,
        type: full.type,
        label: full.label,
        duration: full.duration ?? null,
        source: full.source,
        details: full.details ?? null,
        intensity: full.intensity ?? null,
        note: full.note ?? null,
      } as any).then(({ error }) => {
        if (error) { console.error('Supabase write failed:', error); toast.error('Sync-Fehler – Daten lokal gespeichert'); }
      });
    }
    // Recalculate and persist today's score (use neutral baseline if no check-in)
    // Use ref to avoid stale closure when multiple logs are added quickly
    {
      const updatedActivity = [...activityLogRef.current, full].filter(l => l.date === todayStr);
      const todayNutritionLogs = nutritionLogs.filter(l => l.date === todayStr);
      const effectiveCheckIn = todayCheckIn && todayCheckIn.date === todayStr ? todayCheckIn : {
        date: todayStr, sleepHours: 7, sleepQuality: 5, energy: 5, stress: 5,
        mood: 5, training: false, steps: 0, proteinQuality: 'okay' as const, hydration: 'okay' as const,
        recovery: 5, alcohol: false, screenTimeNight: false,
      };
      const newPillars = calculatePillarScores(
        effectiveCheckIn,
        todayNutritionLogs.length > 0 ? todayNutritionLogs : undefined,
        nutritionTargets ?? undefined,
        updatedActivity.length > 0 ? updatedActivity : undefined,
      );
      const newScore = calculateRollingLongevityScore(
        checkInHistory,
        effectiveCheckIn,
        updatedActivity.length > 0 ? updatedActivity : undefined,
        todayNutritionLogs.length > 0 ? todayNutritionLogs : undefined,
        nutritionTargets ?? undefined,
      );
      setScoreHistory(prev => {
        const filtered = prev.filter(e => e.date !== todayStr);
        return [...filtered, { date: todayStr, score: newScore, pillars: newPillars }];
      });
      if (user) {
        supabase.from('score_history').upsert({
          user_id: user.id, date: todayStr, score: newScore,
          pillar_bewegung: newPillars.bewegung, pillar_ernaehrung: newPillars.ernaehrung,
          pillar_regeneration: newPillars.regeneration, pillar_mental: newPillars.mental,
        } as any, { onConflict: 'user_id,date' }).then(({ error }) => {
          if (error) { console.error('Supabase write failed:', error); toast.error('Sync-Fehler – Daten lokal gespeichert'); }
        });
      }
    }
  }, [setGoalPlan, todayCheckIn, checkInHistory, nutritionLogs, nutritionTargets, user]);

  const setFocusChecked: React.Dispatch<React.SetStateAction<boolean[]>> = useCallback((valOrFn) => {
    setFocusCheckedState(prev => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      localStorage.setItem('caliness_focus_checked', JSON.stringify(next));
      if (user) upsertPreferences(user.id, { focusChecked: next }, preferencesRef);
      return next;
    });
  }, [user]);

  const toggleFocusChecked = useCallback((idx: number) => {
    setFocusCheckedState(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      localStorage.setItem('caliness_focus_checked', JSON.stringify(next));
      if (user) upsertPreferences(user.id, { focusChecked: next }, preferencesRef);
      return next;
    });
  }, [user]);

  const value: AppState = {
    loading, dataLoaded,
    profile, todayCheckIn, checkInHistory, pillarScores, longevityScore, profileLevel,
    scoreTrend, scoreWeeklyChange,
    protocolProgress, scoreHistory, streak, weeklyConsistency,
    trainingLogs, mealLogs, weightEntries, generatedPlans, wearableEntries,
    habits, habitHistory, goalPlan, isPremium: effectiveIsPremium, premiumSource, userRole, isDevPreview,
    subscription, coachMemory, chatHistory,
    nutritionTargets, nutritionLogs, weeklyNutritionPlan, nutritionPatterns,
    pendingMilestone, clearMilestone,
    dailyCoachMessages, canSendCoachMessage,
    badges, addBadge,
    activityLog: activityLogState, addActivityLog,
    focusChecked, setFocusChecked, toggleFocusChecked, updateProtocolProgress,
    setProfile, completeOnboarding, submitCheckIn, startProtocol, toggleProtocolDay,
    addTrainingLog, addMealLog, addWeightEntry, addGeneratedPlan, addWearableEntry,
    toggleHabit, addHabit, removeHabit,
    togglePremium, startCheckout, openBillingPortal, incrementCoachMessage,
    addCoachMemory, setChatHistory, setGoalPlan,
    setNutritionTargets, addNutritionLog, setWeeklyNutritionPlan, setNutritionPatterns,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
