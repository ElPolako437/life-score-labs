import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { checkMilestones } from '@/lib/goalMilestones';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, differenceInDays, startOfWeek, isSameDay, isToday, isBefore, addWeeks } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Target, CalendarIcon, ChevronRight, ChevronLeft, Check, Sparkles, Clock,
  Flame, Moon, Brain, Apple, Activity, Zap, Shield, Sun, Coffee,
  AlertTriangle, TrendingUp, RefreshCw, Bell, BellOff, ArrowRight,
  CalendarDays, Eye, ListChecks, Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { staggerDelay, pillarBarStyle, EASINGS } from '@/lib/animations';
import PremiumPaywall from '@/components/app/PremiumPaywall';

/* ─── Types ─── */
type GoalType = 'fat_loss' | 'sleep' | 'stress' | 'energy' | 'training' | 'movement' | 'evening_routine' | 'morning_routine' | 'recovery' | 'longevity';
type PlanView = 'entry' | 'goal_setup' | 'constraints' | 'realism' | 'weekly_plan' | 'calendar' | 'dashboard' | 'today';

interface RealismResult {
  rating: string;
  ratingLabel: string;
  summary: string;
  keyInsight: string;
  adjustedWeeks: number;
  weeklyFocus: string;
  biggestLever: string;
  riskFactors: string[];
  recommendations: string[];
}

interface PlanBlock {
  type: string;
  label: string;
  time: string;
  duration: number;
  description: string;
  priority: string;
  completed?: boolean;
}

interface DayPlan {
  day: string;
  blocks: PlanBlock[];
  dayNote: string;
}

interface WeeklyPlan {
  weeklyBlocks: DayPlan[];
  weeklyMotivation: string;
  focusPillar: string;
}

/* ─── Goal Meta ─── */
const GOAL_OPTIONS: { type: GoalType; label: string; icon: typeof Target; desc: string }[] = [
  { type: 'fat_loss', label: 'Fettverlust', icon: Flame, desc: 'Körperfett nachhaltig reduzieren' },
  { type: 'sleep', label: 'Schlaf verbessern', icon: Moon, desc: 'Schlafqualität & Routine optimieren' },
  { type: 'stress', label: 'Stress reduzieren', icon: Brain, desc: 'Stressresistenz aufbauen' },
  { type: 'energy', label: 'Energie steigern', icon: Zap, desc: 'Mehr Vitalität im Alltag' },
  { type: 'training', label: 'Trainingsroutine', icon: Activity, desc: 'Konsistentes Training aufbauen' },
  { type: 'movement', label: 'Mehr Bewegung', icon: Activity, desc: 'Alltagsbewegung steigern' },
  { type: 'evening_routine', label: 'Abendroutine', icon: Moon, desc: 'Regenerative Abendroutine' },
  { type: 'morning_routine', label: 'Morgenroutine', icon: Sun, desc: 'Energetischer Tagesstart' },
  { type: 'recovery', label: 'Regeneration', icon: Shield, desc: 'Recovery-Qualität verbessern' },
  { type: 'longevity', label: 'Longevity-Basis', icon: Target, desc: 'Ganzheitliche Gesundheitsbasis' },
];

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const DAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const BLOCK_ICONS: Record<string, typeof Target> = {
  training: Activity, routine_morning: Sun, routine_evening: Moon,
  movement: Activity, recovery: Shield, checkin: Check,
  review: TrendingUp, meal_prep: Coffee, decompression: Brain,
};

const BLOCK_COLORS: Record<string, string> = {
  training: 'hsl(var(--primary))', routine_morning: 'hsl(45, 90%, 55%)',
  routine_evening: 'hsl(260, 60%, 60%)', movement: 'hsl(var(--primary))',
  recovery: 'hsl(200, 70%, 55%)', checkin: 'hsl(var(--primary))',
  review: 'hsl(var(--primary))', meal_prep: 'hsl(30, 80%, 55%)',
  decompression: 'hsl(280, 50%, 55%)',
};

const PILLAR_LABELS: Record<string, string> = {
  bewegung: 'Bewegung', ernaehrung: 'Ernährung', regeneration: 'Regeneration', mental: 'Mentale Balance',
};

const RATING_CONFIG: Record<string, { color: string; bg: string }> = {
  gut_realistisch: { color: 'text-primary', bg: 'bg-primary/10' },
  machbar_mit_struktur: { color: 'text-primary', bg: 'bg-primary/10' },
  ambitioniert: { color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  zu_aggressiv: { color: 'text-destructive', bg: 'bg-destructive/10' },
};

/* ─── Date helpers ─── */
function getWeekDates(refDate: Date): Date[] {
  const monday = startOfWeek(refDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function mapPlanToDate(weeklyPlan: WeeklyPlan, weekDates: Date[]): { date: Date; dayPlan: DayPlan }[] {
  return weekDates.map((date, i) => ({
    date,
    dayPlan: weeklyPlan.weeklyBlocks[i] || { day: DAYS[i], blocks: [], dayNote: '' },
  }));
}

/* ─── Component ─── */
export default function AppGoalPlanner() {
  const navigate = useNavigate();
  const {
    profile, longevityScore, pillarScores, streak, weeklyConsistency,
    goalPlan, setGoalPlan, isPremium, scoreHistory,
  } = useApp();

  const [view, setView] = useState<PlanView>(() => goalPlan ? 'dashboard' : 'entry');
  const [loading, setLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(null);
  const [goalDescription, setGoalDescription] = useState('');
  const [targetDate, setTargetDate] = useState<Date>(() => addWeeks(new Date(), 8));
  const [trainingDays, setTrainingDays] = useState(3);
  const [availableDays, setAvailableDays] = useState<string[]>(['Montag', 'Mittwoch', 'Freitag']);
  const [sessionMinutes, setSessionMinutes] = useState(45);
  const [stressfulDays, setStressfulDays] = useState<string[]>([]);
  const [desiredRoutines, setDesiredRoutines] = useState<string[]>(['Abendroutine']);
  const [preferredTime, setPreferredTime] = useState('abends');
  const [biggestObstacle, setBiggestObstacle] = useState('');
  const [realismResult, setRealismResult] = useState<RealismResult | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(
    () => new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  );
  const [completedBlockAnim, setCompletedBlockAnim] = useState<string | null>(null);

  // Restore saved plan
  useEffect(() => {
    if (goalPlan) {
      setSelectedGoal(goalPlan.goalType as GoalType);
      setGoalDescription(goalPlan.goalDescription);
      setTargetDate(new Date(goalPlan.targetDate));
      if (goalPlan.weeklyPlan) setWeeklyPlan(goalPlan.weeklyPlan);
      if (goalPlan.realismResult) setRealismResult(goalPlan.realismResult);
    }
  }, []);

  const daysRemaining = useMemo(() => differenceInDays(targetDate, new Date()), [targetDate]);
  const weeksRemaining = useMemo(() => Math.ceil(daysRemaining / 7), [daysRemaining]);

  const weakestPillar = useMemo(() => {
    const entries = Object.entries(pillarScores).sort((a, b) => (a[1] as number) - (b[1] as number));
    return entries[0]?.[0] || 'bewegung';
  }, [pillarScores]);

  const strongestPillar = useMemo(() => {
    const entries = Object.entries(pillarScores).sort((a, b) => (b[1] as number) - (a[1] as number));
    return entries[0]?.[0] || 'bewegung';
  }, [pillarScores]);

  const currentWeekDates = useMemo(() => {
    const ref = addDays(new Date(), currentWeekOffset * 7);
    return getWeekDates(ref);
  }, [currentWeekOffset]);

  const calendarDays = useMemo(() => {
    if (!weeklyPlan) return [];
    return mapPlanToDate(weeklyPlan, currentWeekDates);
  }, [weeklyPlan, currentWeekDates]);

  const todayPlan = useMemo(() => {
    if (!weeklyPlan) return null;
    const todayIdx = new Date().getDay();
    const mappedIdx = todayIdx === 0 ? 6 : todayIdx - 1;
    return weeklyPlan.weeklyBlocks[mappedIdx] || null;
  }, [weeklyPlan]);

  const goalConfig = useMemo(() => ({
    type: selectedGoal || 'longevity',
    description: goalDescription,
    targetDate: targetDate.toISOString().split('T')[0],
    weeksToTarget: weeksRemaining,
    trainingDays,
    availableDays,
    sessionMinutes,
    stressfulDays,
    desiredRoutines,
    preferredTime,
    biggestObstacle,
  }), [selectedGoal, goalDescription, targetDate, weeksRemaining, trainingDays, availableDays, sessionMinutes, stressfulDays, desiredRoutines, preferredTime, biggestObstacle]);

  const userContext = useMemo(() => ({
    name: profile.name, age: profile.age, weight: profile.weight, height: profile.height,
    activityLevel: profile.activityLevel, sleepQuality: profile.sleepQuality, stressLevel: profile.stressLevel,
    longevityScore, weakestPillar: PILLAR_LABELS[weakestPillar], strongestPillar: PILLAR_LABELS[strongestPillar],
    streak, weeklyConsistency,
  }), [profile, longevityScore, weakestPillar, strongestPillar, streak, weeklyConsistency]);

  const adherence = useMemo(() => {
    if (!weeklyPlan) return 0;
    const total = weeklyPlan.weeklyBlocks.reduce((s, d) => s + d.blocks.length, 0);
    const done = weeklyPlan.weeklyBlocks.reduce((s, d) => s + d.blocks.filter(b => b.completed).length, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [weeklyPlan]);

  const nextBlock = useMemo(() => {
    if (!todayPlan) return null;
    const next = todayPlan.blocks.find(b => !b.completed);
    return next ? { ...next, day: todayPlan.day } : null;
  }, [todayPlan]);

  const runRealismCheck = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('goal-planner', {
        body: { mode: 'realism-check', goal: goalConfig, userContext },
      });
      if (error) throw error;
      setRealismResult(data);
      setView('realism');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [goalConfig, userContext]);

  const generateWeeklyPlan = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('goal-planner', {
        body: { mode: 'generate-plan', goal: goalConfig, userContext },
      });
      if (error) throw error;
      setWeeklyPlan(data);
      setGoalPlan({
        goalType: selectedGoal || 'longevity', goalDescription,
        targetDate: targetDate.toISOString().split('T')[0],
        targetWeeks: weeksRemaining, createdAt: new Date().toISOString(),
        weeklyPlan: data, realismResult, completedBlocks: [], remindersEnabled,
      });
      setView('dashboard');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [goalConfig, userContext, selectedGoal, goalDescription, targetDate, weeksRemaining, realismResult, remindersEnabled, setGoalPlan]);

  const toggleBlockComplete = useCallback((dayIdx: number, blockIdx: number) => {
    if (!weeklyPlan) return;
    const blockKey = `${dayIdx}-${blockIdx}`;
    setCompletedBlockAnim(blockKey);
    setTimeout(() => setCompletedBlockAnim(null), 600);

    setWeeklyPlan(prev => {
      if (!prev) return prev;
      const updated = { ...prev, weeklyBlocks: prev.weeklyBlocks.map((d, di) => {
        if (di !== dayIdx) return d;
        return { ...d, blocks: d.blocks.map((b, bi) => bi === blockIdx ? { ...b, completed: !b.completed } : b) };
      })};
      setGoalPlan(gp => gp ? { ...gp, weeklyPlan: updated } : gp);
      return updated;
    });
  }, [weeklyPlan, setGoalPlan]);

  /* ═══ Render Helpers ═══ */
  const Card = ({ children, className, onClick, style }: { children: React.ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) => (
    <div className={cn('card-elegant rounded-2xl border border-border/40 p-4', className)}
      style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)', ...style }}
      onClick={onClick}>{children}</div>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="font-outfit text-sm font-semibold text-foreground uppercase tracking-wider">{children}</h2>
  );

  const ChipToggle = ({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) => (
    <button onClick={onToggle}
      className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all checkin-option',
        active ? 'bg-primary/15 border-primary/30 text-primary selected' : 'bg-secondary/40 border-border/40 text-muted-foreground hover:border-border/60'
      )}>{label}</button>
  );

  const BlockItem = ({ block, onToggle, showDate, dateLabel, dayIdx, blockIdx }: { block: PlanBlock; onToggle: () => void; showDate?: boolean; dateLabel?: string; dayIdx?: number; blockIdx?: number }) => {
    const Icon = BLOCK_ICONS[block.type] || Target;
    const color = BLOCK_COLORS[block.type] || 'hsl(var(--primary))';
    const blockKey = dayIdx !== undefined && blockIdx !== undefined ? `${dayIdx}-${blockIdx}` : null;
    const isAnimating = blockKey === completedBlockAnim;

    return (
      <button onClick={onToggle}
        className={cn('w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left relative overflow-hidden',
          block.completed ? 'border-primary/20 bg-primary/5 opacity-60' : 'border-border/30 bg-secondary/20 hover:border-border/50'
        )}
        style={isAnimating ? { animation: `hapticShake 0.3s ${EASINGS.smooth}` } : {}}>
        {/* Ripple on complete */}
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-full bg-primary/20" style={{ animation: 'rippleExpand 0.6s ease-out forwards' }} />
          </div>
        )}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
          style={{ backgroundColor: `${color}12`, border: `1px solid ${color}25` }}>
          {block.completed ? (
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"
                style={{ strokeDasharray: 24, strokeDashoffset: isAnimating ? 0 : undefined, animation: isAnimating ? `checkDraw 0.4s ${EASINGS.smooth} forwards` : undefined }} />
            </svg>
          ) : <Icon className="w-4 h-4" style={{ color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', block.completed ? 'text-muted-foreground line-through' : 'text-foreground')}>{block.label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {showDate && dateLabel && <span className="text-[10px] text-muted-foreground">{dateLabel}</span>}
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{block.time}</span>
            <span className="text-[10px] text-muted-foreground">{block.duration} Min</span>
          </div>
        </div>
        {block.priority === 'hoch' && !block.completed && (
          <span className="text-[10px] text-primary font-semibold shrink-0 bg-primary/10 px-2 py-0.5 rounded-full">Priorität</span>
        )}
        {/* +1 badge on complete animation */}
        {isAnimating && !block.completed && (
          <span className="absolute top-1 right-3 text-xs font-bold text-primary" style={{ animation: 'confettiFloat 0.8s ease-out forwards' }}>+1</span>
        )}
      </button>
    );
  };

  /* ═══════════════════════════════════════════════ */
  /* ═══ ENTRY VIEW ═══ */
  /* ═══════════════════════════════════════════════ */
  if (view === 'entry') return (
    <div className="px-4 pt-6 pb-24 space-y-6 animate-enter">
      <div className="text-center space-y-3" style={staggerDelay(0)}>
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto"
          style={{ boxShadow: 'var(--shadow-glow-subtle)', animation: `glowPulseGreen 3s ease-in-out infinite` }}>
          <CalendarDays className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-outfit text-2xl font-bold text-foreground">Ziel- & Routinenkalender</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          Dein Ziel braucht Struktur. Plane Training und Routinen dort, wo sie wirklich stattfinden — in deinem echten Alltag.
        </p>
      </div>

      {goalPlan && (
        <Card className="cursor-pointer active:scale-[0.97] transition-transform" onClick={() => setView('dashboard')}
          style={staggerDelay(1)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Aktiver Plan</p>
              <p className="text-xs text-muted-foreground truncate">
                {goalPlan.goalDescription || GOAL_OPTIONS.find(g => g.type === goalPlan.goalType)?.label} · Ziel: {format(new Date(goalPlan.targetDate), 'd. MMM yyyy', { locale: de })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-outfit text-lg font-bold text-primary">{adherence}%</p>
              <p className="text-[10px] text-muted-foreground">Umsetzung</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {[
          { icon: CalendarIcon, title: 'Echte Termine', desc: 'Training & Routinen auf echte Tage & Uhrzeiten geplant' },
          { icon: Sparkles, title: 'KI-Realismus-Check', desc: 'Ist dein Ziel im Zeitrahmen erreichbar?' },
          { icon: RefreshCw, title: 'Adaptive Anpassung', desc: 'Der Plan passt sich deinem Leben an' },
        ].map((f, i) => (
          <div key={i} className="flex items-start gap-3 px-1" style={staggerDelay(i + 2)}>
            <div className="w-8 h-8 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center mt-0.5 shrink-0">
              <f.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={staggerDelay(5)}>
        <Button className="w-full glow-neon" size="lg" onClick={() => setView('goal_setup')}>
          <CalendarDays className="w-4 h-4 mr-2" />
          {goalPlan ? 'Neuen Plan erstellen' : 'Plan erstellen'}
        </Button>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════ */
  /* ═══ GOAL SETUP with Date Picker ═══ */
  /* ═══════════════════════════════════════════════ */
  if (view === 'goal_setup') return (
    <div className="px-4 pt-6 pb-24 space-y-5 animate-enter">
      <button onClick={() => setView('entry')} className="flex items-center gap-1 text-xs text-muted-foreground">
        <ChevronLeft className="w-4 h-4" /> Zurück
      </button>
      <div>
        <h1 className="font-outfit text-xl font-bold text-foreground">Was ist dein Ziel?</h1>
        <p className="text-sm text-muted-foreground mt-1">Wähle deinen Hauptfokus und ein echtes Zieldatum</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {GOAL_OPTIONS.map((g, i) => {
          const Icon = g.icon;
          const active = selectedGoal === g.type;
          return (
            <button key={g.type}
              onClick={() => { setSelectedGoal(g.type); if (!goalDescription) setGoalDescription(g.label); }}
              className={cn('rounded-xl border p-3 text-left transition-all checkin-option',
                active ? 'border-primary/40 bg-primary/8 selected' : 'border-border/40 bg-secondary/20 hover:border-border/60'
              )}
              style={{ ...staggerDelay(i, 50), ...(active ? { boxShadow: 'var(--shadow-glow-subtle)' } : {}) }}>
              <Icon className={cn('w-5 h-5 mb-1.5', active ? 'text-primary' : 'text-muted-foreground')} />
              <p className={cn('text-xs font-semibold', active ? 'text-foreground' : 'text-muted-foreground')}>{g.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{g.desc}</p>
            </button>
          );
        })}
      </div>

      <div className={cn('space-y-5', !selectedGoal && 'hidden')}>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Konkretisiere dein Ziel (optional)</label>
          <input
            className="w-full h-11 rounded-xl border border-border/60 bg-secondary/40 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all"
            placeholder="z.B. 5 kg verlieren, 3x/Woche trainieren..."
            value={goalDescription} onChange={e => setGoalDescription(e.target.value)}
          />
        </div>

        {/* ─── Real Date Picker ─── */}
        <Card>
          <p className="text-xs font-medium text-muted-foreground mb-3">Bis wann willst du dein Ziel erreichen?</p>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-secondary/30 hover:border-primary/30 transition-all text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{format(targetDate, 'd. MMMM yyyy', { locale: de })}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {daysRemaining > 0 ? `Noch ${daysRemaining} Tage · ${weeksRemaining} Wochen` : 'Datum wählen'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border/60" align="center">
              <Calendar
                mode="single"
                selected={targetDate}
                onSelect={(d) => { if (d) { setTargetDate(d); setDatePickerOpen(false); } }}
                disabled={(d) => isBefore(d, new Date())}
                locale={de}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {/* Quick select chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { label: '6 Wochen', weeks: 6 },
              { label: '8 Wochen', weeks: 8 },
              { label: '12 Wochen', weeks: 12 },
              { label: '16 Wochen', weeks: 16 },
            ].map(opt => (
              <button key={opt.weeks}
                onClick={() => setTargetDate(addWeeks(new Date(), opt.weeks))}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all checkin-option',
                  weeksRemaining === opt.weeks
                    ? 'bg-primary/15 border-primary/30 text-primary selected'
                    : 'bg-secondary/40 border-border/40 text-muted-foreground hover:border-border/60'
                )}>
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Timeline preview */}
        {daysRemaining > 0 && (
          <div className="px-1 space-y-2" style={staggerDelay(1)}>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Heute</span>
              <span>{format(targetDate, 'd. MMM', { locale: de })}</span>
            </div>
            <div className="relative h-2 rounded-full bg-secondary/60 overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/80 to-primary/40"
                style={{ width: '4%', animation: `pillarFill 0.8s ${EASINGS.smooth} both`, animationDelay: '300ms' }} />
              <div className="absolute inset-y-0 right-0 w-1 bg-primary rounded-full" />
            </div>
            <p className="text-[10px] text-muted-foreground text-center">{daysRemaining} Tage bis zum Ziel</p>
          </div>
        )}

        <Button className="w-full" onClick={() => setView('constraints')}>
          Weiter <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════ */
  /* ═══ CONSTRAINTS ═══ */
  /* ═══════════════════════════════════════════════ */
  if (view === 'constraints') return (
    <div className="px-4 pt-6 pb-24 space-y-5 animate-enter">
      <button onClick={() => setView('goal_setup')} className="flex items-center gap-1 text-xs text-muted-foreground">
        <ChevronLeft className="w-4 h-4" /> Zurück
      </button>
      <div>
        <h1 className="font-outfit text-xl font-bold text-foreground">Dein Alltag</h1>
        <p className="text-sm text-muted-foreground mt-1">Damit dein Plan wirklich zu dir passt</p>
      </div>

      <Card style={staggerDelay(0)}>
        <p className="text-xs font-medium text-muted-foreground mb-2">Wie oft kannst du trainieren?</p>
        <div className="flex gap-2">
          {[1,2,3,4,5,6].map(n => (
            <button key={n} onClick={() => setTrainingDays(n)}
              className={cn('w-10 h-10 rounded-xl text-sm font-semibold border transition-all checkin-option',
                trainingDays === n ? 'bg-primary/15 border-primary/30 text-primary selected' : 'bg-secondary/40 border-border/40 text-muted-foreground'
              )}>{n}x</button>
          ))}
        </div>
      </Card>

      <Card style={staggerDelay(1)}>
        <p className="text-xs font-medium text-muted-foreground mb-2">An welchen Tagen hast du Zeit?</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d, i) => (
            <ChipToggle key={d} label={DAYS_SHORT[i]} active={availableDays.includes(d)}
              onToggle={() => setAvailableDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])} />
          ))}
        </div>
      </Card>

      <Card style={staggerDelay(2)}>
        <p className="text-xs font-medium text-muted-foreground mb-2">Zeit pro Einheit: {sessionMinutes} Min</p>
        <input type="range" min={15} max={90} step={5} value={sessionMinutes}
          onChange={e => setSessionMinutes(Number(e.target.value))} className="w-full accent-primary" />
      </Card>

      <Card style={staggerDelay(3)}>
        <p className="text-xs font-medium text-muted-foreground mb-2">Stressigste Tage?</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d, i) => (
            <ChipToggle key={d} label={DAYS_SHORT[i]} active={stressfulDays.includes(d)}
              onToggle={() => setStressfulDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])} />
          ))}
        </div>
      </Card>

      <Card style={staggerDelay(4)}>
        <p className="text-xs font-medium text-muted-foreground mb-2">Gewünschte Routinen</p>
        <div className="flex flex-wrap gap-2">
          {['Morgenroutine', 'Abendroutine', 'Atemübung', 'Spaziergang', 'Meal Prep', 'Dekompressions-Pause'].map(r => (
            <ChipToggle key={r} label={r} active={desiredRoutines.includes(r)}
              onToggle={() => setDesiredRoutines(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])} />
          ))}
        </div>
      </Card>

      <Card style={staggerDelay(5)}>
        <p className="text-xs font-medium text-muted-foreground mb-2">Bevorzugte Trainingszeit</p>
        <div className="flex gap-2">
          {[{ v: 'morgens', l: 'Morgens' }, { v: 'mittags', l: 'Mittags' }, { v: 'abends', l: 'Abends' }, { v: 'flexibel', l: 'Flexibel' }].map(t => (
            <ChipToggle key={t.v} label={t.l} active={preferredTime === t.v} onToggle={() => setPreferredTime(t.v)} />
          ))}
        </div>
      </Card>

      <Card style={staggerDelay(6)}>
        <p className="text-xs font-medium text-muted-foreground mb-2">Dein größtes Hindernis?</p>
        <input
          className="w-full h-11 rounded-xl border border-border/60 bg-secondary/40 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all"
          placeholder="z.B. Zeitmangel, Motivation..." value={biggestObstacle}
          onChange={e => setBiggestObstacle(e.target.value)} />
      </Card>

      <div style={staggerDelay(7)}>
        {isPremium ? (
          <>
            <Button className="w-full glow-neon" size="lg" onClick={runRealismCheck} disabled={loading}>
              {loading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Analyse läuft...</> : <><Sparkles className="w-4 h-4 mr-2" /> KI-Realismus-Check</>}
            </Button>
            {loading && (
              <div className="flex items-center justify-center gap-1.5 mt-2 opacity-40">
                <img src="/images/caliness-logo-white.png" alt="" className="w-3.5 h-3.5 object-contain" />
                <span className="text-[9px] text-muted-foreground">CALINESS Intelligence</span>
              </div>
            )}
          </>
        ) : (
          <PremiumPaywall feature="KI-Realismus-Check & Wochenplan" compact />
        )}
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════ */
  /* ═══ REALISM CHECK ═══ */
  /* ═══════════════════════════════════════════════ */
  if (view === 'realism' && realismResult) {
    const rc = RATING_CONFIG[realismResult.rating] || RATING_CONFIG.machbar_mit_struktur;
    return (
      <div className="px-4 pt-6 pb-24 space-y-5 animate-enter">
        <button onClick={() => setView('constraints')} className="flex items-center gap-1 text-xs text-muted-foreground">
          <ChevronLeft className="w-4 h-4" /> Zurück
        </button>

        <div className="text-center space-y-2" style={staggerDelay(0)}>
          <h1 className="font-outfit text-xl font-bold text-foreground">KI-Einschätzung</h1>
          <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold', rc.bg, rc.color)}
            style={{ animation: `milestoneReveal 0.6s ${EASINGS.smooth} both`, animationDelay: '200ms' }}>
            {realismResult.rating === 'zu_aggressiv' ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {realismResult.ratingLabel}
          </div>
        </div>

        <Card style={staggerDelay(1)}>
          <p className="text-sm text-foreground leading-relaxed">{realismResult.summary}</p>
          <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
            <p className="text-xs font-medium text-primary">{realismResult.keyInsight}</p>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-2.5">
          <Card style={staggerDelay(2)}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Zieldatum</p>
            <p className="font-outfit text-lg font-bold text-foreground mt-1">{format(targetDate, 'd. MMM', { locale: de })}</p>
            <p className="text-[10px] text-muted-foreground">{daysRemaining} Tage</p>
          </Card>
          <Card style={staggerDelay(3)}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Größter Hebel</p>
            <p className="text-sm font-semibold text-foreground mt-1">{realismResult.biggestLever}</p>
          </Card>
        </div>

        <Card style={staggerDelay(4)}>
          <SectionTitle>Empfehlungen</SectionTitle>
          <div className="mt-3 space-y-2">
            {realismResult.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-2" style={staggerDelay(i, 400)}>
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                  <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{r}</p>
              </div>
            ))}
          </div>
        </Card>

        {realismResult.riskFactors.length > 0 && (
          <Card style={staggerDelay(5)}>
            <SectionTitle>Risikofaktoren</SectionTitle>
            <div className="mt-2 space-y-1.5">
              {realismResult.riskFactors.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">{r}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div style={staggerDelay(6)}>
          <Button className="w-full glow-neon" size="lg" onClick={generateWeeklyPlan} disabled={loading}>
            {loading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Plan wird erstellt...</> : <><CalendarDays className="w-4 h-4 mr-2" /> Kalender generieren</>}
          </Button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════ */
  /* ═══ TODAY VIEW ═══ */
  /* ═══════════════════════════════════════════════ */
  if (view === 'today' && todayPlan) {
    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const todayDate = new Date();
    const doneCount = todayPlan.blocks.filter(b => b.completed).length;
    const allDone = doneCount === todayPlan.blocks.length && todayPlan.blocks.length > 0;

    return (
      <div className="px-4 pt-6 pb-24 space-y-4 animate-enter">
        <div className="flex items-center justify-between">
          <button onClick={() => setView('dashboard')} className="flex items-center gap-1 text-xs text-muted-foreground">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="text-xs font-medium text-muted-foreground">{format(todayDate, 'EEEE, d. MMMM', { locale: de })}</span>
        </div>

        <div className="text-center space-y-1" style={staggerDelay(0)}>
          <h1 className="font-outfit text-xl font-bold text-foreground">Dein Plan heute</h1>
          <p className="text-sm text-muted-foreground">{doneCount} / {todayPlan.blocks.length} erledigt</p>
        </div>

        <div style={staggerDelay(1)}>
          <Progress value={(doneCount / Math.max(todayPlan.blocks.length, 1)) * 100} className="h-2" />
        </div>

        {todayPlan.dayNote && (
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/15" style={staggerDelay(2)}>
            <p className="text-xs text-primary font-medium italic">{todayPlan.dayNote}</p>
          </div>
        )}

        {/* All done celebration */}
        {allDone && (
          <div className="text-center py-4" style={{ animation: `milestoneReveal 0.8s ${EASINGS.overshoot} both` }}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30"
              style={{ animation: 'glowPulseGreen 2s ease-in-out infinite' }}>
              <Check className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Heute erledigt ✓</span>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative pl-6 space-y-3">
          <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border/40" />
          {todayPlan.blocks.map((block, bi) => (
            <div key={bi} className="relative" style={staggerDelay(bi + 2, 80)}>
              <div className={cn('absolute left-[-18px] top-4 w-3 h-3 rounded-full border-2 transition-all',
                block.completed ? 'bg-primary border-primary' : 'bg-card border-border/60'
              )} />
              <BlockItem block={block} onToggle={() => toggleBlockComplete(todayIdx, bi)} dayIdx={todayIdx} blockIdx={bi} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════ */
  /* ═══ CALENDAR VIEW (Real Dates) ═══ */
  /* ═══════════════════════════════════════════════ */
  if (view === 'calendar' && weeklyPlan) {
    return (
      <div className="px-4 pt-6 pb-24 space-y-4 animate-enter">
        <div className="flex items-center justify-between">
          <button onClick={() => setView('dashboard')} className="flex items-center gap-1 text-xs text-muted-foreground">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentWeekOffset(prev => prev - 1)}
              className="w-7 h-7 rounded-lg bg-secondary/40 border border-border/40 flex items-center justify-center active:scale-90 transition-transform">
              <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <span className="text-xs font-medium text-muted-foreground min-w-[100px] text-center">
              {format(currentWeekDates[0], 'd. MMM', { locale: de })} – {format(currentWeekDates[6], 'd. MMM', { locale: de })}
            </span>
            <button onClick={() => setCurrentWeekOffset(prev => prev + 1)}
              className="w-7 h-7 rounded-lg bg-secondary/40 border border-border/40 flex items-center justify-center active:scale-90 transition-transform">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {currentWeekOffset !== 0 && (
          <button onClick={() => setCurrentWeekOffset(0)}
            className="text-[10px] text-primary font-medium text-center w-full">
            ← Zur aktuellen Woche
          </button>
        )}

        {/* Week day strip with real dates */}
        <div className="flex gap-1.5">
          {calendarDays.map(({ date, dayPlan }, i) => {
            const done = dayPlan.blocks.filter(b => b.completed).length;
            const total = dayPlan.blocks.length;
            const isActive = selectedDayIdx === i;
            const dayIsToday = isToday(date);
            const allDayDone = done === total && total > 0;

            return (
              <button key={i} onClick={() => setSelectedDayIdx(i)}
                className={cn(
                  'flex-1 flex flex-col items-center py-2 rounded-xl border transition-all',
                  isActive ? 'bg-primary/15 border-primary/30' : 'bg-secondary/20 border-border/30',
                  dayIsToday && !isActive && 'border-primary/20'
                )}
                style={{ animation: `cardSlideUp 0.4s ${EASINGS.smooth} both`, animationDelay: `${i * 50}ms` }}>
                <span className={cn('text-[10px] font-medium', isActive ? 'text-primary' : 'text-muted-foreground')}>{DAYS_SHORT[i]}</span>
                <span className={cn('text-xs font-bold', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                  {format(date, 'd')}
                </span>
                {total > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: Math.min(total, 4) }).map((_, j) => (
                      <div key={j} className={cn('w-1 h-1 rounded-full transition-all',
                        j < done ? 'bg-primary' : 'bg-muted-foreground/30'
                      )}
                        style={j < done ? { animation: `pillarFill 0.4s ${EASINGS.smooth} both`, animationDelay: `${300 + j * 80}ms` } : {}} />
                    ))}
                  </div>
                )}
                {dayIsToday && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" style={{ animation: 'glowPulseGreen 2s ease-in-out infinite' }} />}
                {allDayDone && <Check className="w-2.5 h-2.5 text-primary mt-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Selected day content */}
        {calendarDays[selectedDayIdx] && (() => {
          const { date, dayPlan } = calendarDays[selectedDayIdx];
          const done = dayPlan.blocks.filter(b => b.completed).length;
          const allDone = done === dayPlan.blocks.length && dayPlan.blocks.length > 0;
          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-outfit text-lg font-bold text-foreground">
                  {isToday(date) ? 'Heute' : format(date, 'EEEE', { locale: de })}
                  <span className="text-sm text-muted-foreground font-normal ml-2">{format(date, 'd. MMMM', { locale: de })}</span>
                </h2>
                <span className="text-xs text-muted-foreground">{done}/{dayPlan.blocks.length}</span>
              </div>

              {/* Progress bar for selected day */}
              {dayPlan.blocks.length > 0 && (
                <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      '--pillar-width': `${(done / dayPlan.blocks.length) * 100}%`,
                      animation: `pillarFill 0.8s ${EASINGS.smooth} both`,
                      animationDelay: '200ms',
                    } as React.CSSProperties} />
                </div>
              )}

              {dayPlan.dayNote && (
                <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/15">
                  <p className="text-xs text-primary font-medium italic">{dayPlan.dayNote}</p>
                </div>
              )}

              {allDone && (
                <div className="text-center py-2" style={{ animation: `milestoneReveal 0.6s ${EASINGS.overshoot} both` }}>
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-semibold text-primary">
                    <Check className="w-3 h-3" /> Alles erledigt
                  </span>
                </div>
              )}

              {dayPlan.blocks.length === 0 ? (
                <div className="text-center py-8" style={staggerDelay(0)}>
                  <Moon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Kein geplanter Block</p>
                  <p className="text-xs text-muted-foreground/60">Ruhetag oder freier Tag</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-2.5">
                  <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border/40" />
                  {dayPlan.blocks.map((block, bi) => (
                    <div key={bi} className="relative" style={staggerDelay(bi, 60)}>
                      <div className={cn('absolute left-[-18px] top-4 w-3 h-3 rounded-full border-2 transition-all',
                        block.completed ? 'bg-primary border-primary' : 'bg-card border-border/60')} />
                      <BlockItem block={block} onToggle={() => toggleBlockComplete(selectedDayIdx, bi)}
                        showDate dateLabel={format(date, 'dd.MM.', { locale: de })}
                        dayIdx={selectedDayIdx} blockIdx={bi} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════ */
  /* ═══ WEEKLY PLAN OVERVIEW ═══ */
  /* ═══════════════════════════════════════════════ */
  if (view === 'weekly_plan' && weeklyPlan) return (
    <div className="px-4 pt-6 pb-24 space-y-4 animate-enter">
      <div className="flex items-center justify-between">
        <button onClick={() => setView('dashboard')} className="flex items-center gap-1 text-xs text-muted-foreground">
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </button>
        <span className="text-xs text-muted-foreground">Wochenstruktur</span>
      </div>

      <div className="p-3 rounded-xl bg-primary/5 border border-primary/15" style={staggerDelay(0)}>
        <p className="text-xs text-primary font-medium">{weeklyPlan.weeklyMotivation}</p>
      </div>

      <div className="space-y-3">
        {weeklyPlan.weeklyBlocks.map((day, di) => {
          const weekDate = currentWeekDates[di];
          const done = day.blocks.filter(b => b.completed).length;
          const dayIsToday = weekDate && isToday(weekDate);
          const allDone = done === day.blocks.length && day.blocks.length > 0;

          return (
            <Card key={day.day} className={dayIsToday ? 'border-primary/25' : ''} style={staggerDelay(di + 1, 60)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{day.day}</p>
                  {weekDate && <span className="text-[10px] text-muted-foreground">{format(weekDate, 'd. MMM', { locale: de })}</span>}
                  {dayIsToday && <span className="text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full">Heute</span>}
                  {allDone && <Check className="w-3.5 h-3.5 text-primary" />}
                </div>
                <span className="text-[10px] text-muted-foreground">{done}/{day.blocks.length}</span>
              </div>
              {/* Day progress bar */}
              {day.blocks.length > 0 && (
                <div className="h-1 rounded-full bg-secondary/60 overflow-hidden mb-2">
                  <div className="h-full rounded-full bg-primary/70 transition-all"
                    style={{
                      '--pillar-width': `${(done / day.blocks.length) * 100}%`,
                      animation: `pillarFill 0.6s ${EASINGS.smooth} both`,
                      animationDelay: `${200 + di * 80}ms`,
                    } as React.CSSProperties} />
                </div>
              )}
              {day.dayNote && <p className="text-[10px] text-muted-foreground mb-2 italic">{day.dayNote}</p>}
              <div className="space-y-1.5">
                {day.blocks.map((block, bi) => (
                  <BlockItem key={bi} block={block} onToggle={() => toggleBlockComplete(di, bi)} dayIdx={di} blockIdx={bi} />
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════ */
  /* ═══ DASHBOARD ═══ */
  /* ═══════════════════════════════════════════════ */
  if (view === 'dashboard' && (weeklyPlan || goalPlan)) {
    const plan = weeklyPlan || goalPlan?.weeklyPlan;
    const goalLabel = GOAL_OPTIONS.find(g => g.type === (selectedGoal || goalPlan?.goalType))?.label || 'Ziel';
    const GoalIcon = GOAL_OPTIONS.find(g => g.type === (selectedGoal || goalPlan?.goalType))?.icon || Target;
    const goalDateDisplay = targetDate || (goalPlan?.targetDate ? new Date(goalPlan.targetDate) : new Date());
    const progressPercent = daysRemaining > 0 ? Math.max(0, Math.min(100, ((differenceInDays(goalDateDisplay, new Date()) <= 0 ? 100 : (1 - daysRemaining / differenceInDays(goalDateDisplay, new Date(goalPlan?.createdAt || new Date().toISOString()))) * 100)))) : 100;

    return (
      <div className="px-4 pt-6 pb-24 space-y-4 animate-enter">
        <h1 className="font-outfit text-xl font-bold text-foreground" style={staggerDelay(0)}>Dein Plan</h1>

        {/* Goal summary with target date */}
        <Card style={staggerDelay(1)}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"
              style={{ boxShadow: 'var(--shadow-glow-subtle)' }}>
              <GoalIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{goalDescription || goalLabel}</p>
              <p className="text-[10px] text-muted-foreground">
                Ziel: {format(goalDateDisplay, 'd. MMMM yyyy', { locale: de })} · {daysRemaining > 0 ? `Noch ${daysRemaining} Tage` : 'Erreicht!'}
              </p>
            </div>
          </div>
          {/* Timeline bar */}
          <div className="space-y-1">
            <div className="relative h-2 rounded-full bg-secondary/60 overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                style={{
                  '--pillar-width': `${Math.min(100, Math.max(2, 100 - (daysRemaining / Math.max(1, differenceInDays(goalDateDisplay, new Date(goalPlan?.createdAt || new Date().toISOString()))) * 100)))}%`,
                  animation: `pillarFill 1s ${EASINGS.smooth} both`,
                  animationDelay: '300ms',
                } as React.CSSProperties} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Start</span>
              <span>{format(goalDateDisplay, 'd. MMM', { locale: de })}</span>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: `${adherence}%`, label: 'Umsetzung', isPrimary: true },
            { value: `${streak}`, label: 'Streak', isPrimary: false },
            { value: `${plan?.weeklyBlocks?.reduce((s: number, d: DayPlan) => s + d.blocks.filter(b => b.completed).length, 0) || 0}`, label: 'Erledigt', isPrimary: false },
          ].map((stat, i) => (
            <Card key={i} className="text-center py-3" style={staggerDelay(i + 2, 80)}>
              <p className={cn('font-outfit text-xl font-bold', stat.isPrimary ? 'text-primary' : 'text-foreground')}
                style={{ animation: `countUp 0.6s ${EASINGS.smooth} both`, animationDelay: `${400 + i * 100}ms` }}>
                {stat.value}
              </p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              {/* Adherence bar */}
              {stat.isPrimary && (
                <div className="mt-1.5 h-1 rounded-full bg-secondary/60 overflow-hidden mx-2">
                  <div className="h-full rounded-full bg-primary"
                    style={{
                      '--pillar-width': `${adherence}%`,
                      animation: `pillarFill 0.8s ${EASINGS.smooth} both`,
                      animationDelay: '600ms',
                      boxShadow: adherence >= 70 ? '0 0 6px hsl(142 76% 46% / 0.4)' : 'none',
                    } as React.CSSProperties} />
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* ═══ MILESTONE TIMELINE ═══ */}
        {(() => {
          const milestoneData = checkMilestones(goalPlan, pillarScores, scoreHistory);
          if (!milestoneData.milestones.length) return null;
          return (
            <Card style={staggerDelay(4)}>
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Meilensteine</span>
              </div>
              <div className="relative pl-5 space-y-3">
                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border/40" />
                {milestoneData.milestones.map((m) => (
                  <div key={m.id} className="relative flex items-center gap-3">
                    <div
                      className={cn(
                        'absolute left-[-17px] w-3.5 h-3.5 rounded-full border-2 transition-all',
                        m.reached
                          ? 'bg-primary border-primary'
                          : 'bg-card border-border/60'
                      )}
                      style={m.reached ? { animation: 'glowPulseGreen 3s ease-in-out infinite' } : {}}
                    />
                    <div className="flex-1">
                      <p className={cn('text-xs font-medium', m.reached ? 'text-foreground' : 'text-muted-foreground')}>
                        {m.label}
                      </p>
                      <p className="text-[9px] text-muted-foreground/60">{m.description}</p>
                    </div>
                    {m.reached && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </div>
                ))}
              </div>
            </Card>
          );
        })()}

        {/* Today's plan preview */}
        {todayPlan && todayPlan.blocks.length > 0 && (
          <Card className="cursor-pointer active:scale-[0.97] transition-transform" onClick={() => setView('today')}
            style={staggerDelay(5)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Heute · {format(new Date(), 'd. MMM', { locale: de })}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {todayPlan.blocks.filter(b => b.completed).length}/{todayPlan.blocks.length} erledigt
              </span>
            </div>
            {/* Today progress */}
            <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden mb-2">
              <div className="h-full rounded-full bg-primary"
                style={{
                  '--pillar-width': `${(todayPlan.blocks.filter(b => b.completed).length / todayPlan.blocks.length) * 100}%`,
                  animation: `pillarFill 0.6s ${EASINGS.smooth} both`,
                  animationDelay: '400ms',
                } as React.CSSProperties} />
            </div>
            {nextBlock && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/30 border border-border/30">
                {(() => {
                  const Icon = BLOCK_ICONS[nextBlock.type] || Target;
                  const color = BLOCK_COLORS[nextBlock.type] || 'hsl(var(--primary))';
                  return (
                    <>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}12`, border: `1px solid ${color}25` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{nextBlock.label}</p>
                        <p className="text-[10px] text-muted-foreground">{nextBlock.time} · {nextBlock.duration} Min</p>
                      </div>
                      <span className="text-[10px] text-primary font-medium">Nächster</span>
                    </>
                  );
                })()}
              </div>
            )}
            <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-primary font-medium">
              <span>Tagesansicht öffnen</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </Card>
        )}

        {/* Reminders */}
        <Card className="flex items-center justify-between" style={staggerDelay(6)}>
          <div className="flex items-center gap-2">
            {remindersEnabled ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm text-foreground">Erinnerungen</span>
          </div>
          <button onClick={() => setRemindersEnabled(!remindersEnabled)}
            className={cn('w-11 h-6 rounded-full transition-all relative', remindersEnabled ? 'bg-primary' : 'bg-secondary')}>
            <div className={cn('w-5 h-5 rounded-full bg-foreground absolute top-0.5 transition-all', remindersEnabled ? 'left-[22px]' : 'left-0.5')} />
          </button>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2" style={staggerDelay(7)}>
          <Button variant="outline" className="h-11 text-xs active:scale-95 transition-transform" onClick={() => setView('today')}>
            <Eye className="w-3.5 h-3.5 mr-1" /> Heute
          </Button>
          <Button variant="outline" className="h-11 text-xs active:scale-95 transition-transform" onClick={() => setView('calendar')}>
            <CalendarDays className="w-3.5 h-3.5 mr-1" /> Kalender
          </Button>
          <Button variant="outline" className="h-11 text-xs active:scale-95 transition-transform" onClick={() => setView('weekly_plan')}>
            <ListChecks className="w-3.5 h-3.5 mr-1" /> Woche
          </Button>
        </div>

        <Button variant="outline" className="w-full" onClick={() => navigate('/app/coach')} style={staggerDelay(8)}>
          <Sparkles className="w-4 h-4 mr-2" /> Plan mit Coach besprechen
        </Button>

        {/* ═══ COACHING ESCALATION ═══ */}
        {goalPlan && adherence < 30 && daysRemaining > 0 && (() => {
          const daysSincePlan = goalPlan.createdAt
            ? Math.ceil((Date.now() - new Date(goalPlan.createdAt).getTime()) / 86400000)
            : 0;
          return daysSincePlan >= 21;
        })() && (
          <div className="rounded-xl border border-border/40 p-4 space-y-2"
               style={{ background: 'linear-gradient(165deg, hsl(45 60% 50% / 0.05), transparent)', ...staggerDelay(9) }}>
            <p className="text-xs font-medium text-foreground">
              Du hast ein gutes Ziel — aber etwas blockiert die Umsetzung.
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Manchmal braucht es ein echtes Gespräch, um den wahren Blocker zu finden.
              CALINESS 1:1 Coaching geht tiefer als die App.
            </p>
            <Button variant="outline" size="sm" className="w-full"
              onClick={() => window.open('https://calendly.com/team-calinessacademy/new-meeting', '_blank')}>
              Kostenloses Erstgespräch buchen
            </Button>
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={() => navigate('/app/coach')} style={staggerDelay(8)}>
          <Sparkles className="w-4 h-4 mr-2" /> Plan mit Coach besprechen
        </Button>

        <button onClick={() => { setGoalPlan(null); setWeeklyPlan(null); setRealismResult(null); setView('entry'); }}
          className="w-full text-center text-xs text-muted-foreground/60 py-2 hover:text-muted-foreground transition-colors">
          Plan zurücksetzen
        </button>
      </div>
    );
  }

  // Fallback
  return (
    <div className="px-4 pt-6 pb-24 text-center space-y-4 animate-enter">
      <p className="text-muted-foreground">Lade...</p>
      <Button onClick={() => setView('entry')}>Zum Zielplaner</Button>
    </div>
  );
}
