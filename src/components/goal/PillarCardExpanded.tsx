/**
 * PillarCardExpanded — Context-aware expanded content for each pillar card.
 * Shows data-driven observations, goal relevance, plan preview, and next action.
 */
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, Minus, ChevronRight, Settings2,
} from 'lucide-react';
import type { PillarKey } from '@/lib/focusPillar';
import type {
  DailyCheckIn, ScoreHistoryEntry, ActivityLog, NutritionLogEntry, GoalPlanData,
} from '@/contexts/AppContext';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

interface PillarCardExpandedProps {
  pillarKey: PillarKey;
  displayScore: number;
  lastWeekScore: number | null;
  checkInHistory: DailyCheckIn[];
  scoreHistory: ScoreHistoryEntry[];
  activityLog: ActivityLog[];
  nutritionLogs: NutritionLogEntry[];
  goalPlan: GoalPlanData | null;
  onOpenPersonalization: (pillar: PillarKey) => void;
  onOpenPillarDetail: (pillar: string) => void;
  onNavigateToPlans: () => void;
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

const PILLAR_LABELS: Record<PillarKey, string> = {
  bewegung: 'Bewegung',
  ernaehrung: 'Ernährung',
  regeneration: 'Recovery',
  mental: 'Mental',
};

// Goal type -> primary/secondary pillar relevance
const GOAL_PILLAR_RELEVANCE: Record<string, { primary: PillarKey[]; secondary: PillarKey[] }> = {
  fat_loss: { primary: ['bewegung', 'ernaehrung'], secondary: ['regeneration'] },
  recomp: { primary: ['bewegung', 'ernaehrung'], secondary: ['regeneration'] },
  muscle_gain: { primary: ['bewegung', 'ernaehrung'], secondary: ['regeneration'] },
  sleep_improvement: { primary: ['regeneration'], secondary: ['mental'] },
  stress_reduction: { primary: ['mental'], secondary: ['regeneration'] },
  energy_recovery: { primary: ['regeneration'], secondary: ['bewegung', 'ernaehrung'] },
  routine_building: { primary: ['bewegung', 'ernaehrung', 'regeneration', 'mental'], secondary: [] },
};

// Goal-pillar relevance text
const GOAL_RELEVANCE_TEXT: Record<string, Record<PillarKey, string>> = {
  fat_loss: {
    bewegung: 'Für Fettabbau ist Bewegung dein stärkster Hebel -- regelmäßiges Training erhöht deinen Grundumsatz direkt.',
    ernaehrung: 'Deine Ernährung ist bei Fettabbau 70% der Gleichung -- Proteinziel erreichen bedeutet weniger Heißhunger.',
    regeneration: 'Schlafmangel erhöht Cortisol und blockiert Fettabbau -- Recovery ist dein stiller Verstärker.',
    mental: 'Stress erhöht Heißhunger und torpediert dein Kalorienziel -- mentale Balance hält dich auf Kurs.',
  },
  muscle_gain: {
    bewegung: 'Für Muskelaufbau ist Training der primäre Reiz -- ohne Belastung kein Wachstum.',
    ernaehrung: 'Ohne ausreichend Protein kann dein Körper keine Muskeln aufbauen -- Ernährung ist der Baustoff.',
    regeneration: 'Muskeln wachsen in der Ruhephase -- ohne gute Recovery verschenkst du Trainingseffekte.',
    mental: 'Mentale Konstanz hält deine Trainingsroutine aufrecht -- das ist dein langfristiger Vorteil.',
  },
  sleep_improvement: {
    bewegung: 'Moderate Bewegung verbessert nachweislich die Schlafqualität -- aber nicht zu spät am Abend.',
    ernaehrung: 'Schweres Essen am Abend stört den Schlaf -- leichte Abendmahlzeiten unterstützen deine Recovery.',
    regeneration: 'Für besseren Schlaf ist das dein wichtigster Bereich diese Woche.',
    mental: 'Stress und Grübeln sind Schlafkiller -- mentale Entlastung am Abend ist entscheidend.',
  },
  stress_reduction: {
    bewegung: 'Bewegung baut Stresshormone ab -- schon 20 Minuten Gehen senkt Cortisol messbar.',
    ernaehrung: 'Blutzuckerschwankungen verstärken Stress -- stabile Ernährung stabilisiert auch deinen Kopf.',
    regeneration: 'Schlafmangel macht stressanfälliger -- guter Schlaf ist dein Stresspuffer.',
    mental: 'Stress-Reduktion beginnt mit mentaler Entlastung -- dieser Bereich ist dein #1 Hebel.',
  },
  energy_recovery: {
    bewegung: 'Moderate Bewegung gibt Energie -- paradox, aber es funktioniert nachweislich.',
    ernaehrung: 'Stabile Energieversorgung kommt aus regelmäßiger, proteinreicher Ernährung.',
    regeneration: 'Für mehr Energie ist Schlafqualität der größte Hebel -- Recovery ist dein Fundament.',
    mental: 'Mentale Erschöpfung fühlt sich wie körperliche Müde an -- Pausen sind produktiv.',
  },
  routine_building: {
    bewegung: 'Feste Trainingszeiten sind das Rückgrat jeder Routine -- Konsistenz schlägt Intensität.',
    ernaehrung: 'Regelmäßige Mahlzeitenstruktur gibt deinem Tag einen Anker.',
    regeneration: 'Eine feste Schlafenszeit ist die kräftigste Gewohnheit, die du aufbauen kannst.',
    mental: 'Mentale Routinen wie eine Morgenübung verankern den ganzen Tag.',
  },
  recomp: {
    bewegung: 'Bei Body Recomposition brauchst du beides: Krafttraining als Reiz und Kaloriensteuerung.',
    ernaehrung: 'Hohes Protein bei moderatem Defizit -- Ernährung steuert, ob du Fett oder Muskeln verlierst.',
    regeneration: 'Recovery entscheidet, ob dein Körper Muskeln aufbaut oder abbaut -- priorisiere Schlaf.',
    mental: 'Recomp ist ein langer Prozess -- mentale Geduld und Konstanz sind entscheidend.',
  },
};

/* ═══════════════════════════════════════════════════════════
   HELPER: compute pillar-specific context from check-in data
   ═══════════════════════════════════════════════════════════ */

interface PillarContext {
  weeklyScore: number;
  prevWeekScore: number | null;
  trend: number; // positive = improving
  isStrong: boolean;
  isWeak: boolean;
  isCritical: boolean;
  hasPlan: boolean;
  isGoalPrimary: boolean;
  isGoalSecondary: boolean;
  dayActivityCount: number;
  isConsistent: boolean;
  // Pillar-specific metrics
  trainingDays: number;
  totalSteps: number;
  avgSleepHours: number;
  avgSleepQuality: number;
  avgStress: number;
  avgMood: number;
  avgEnergy: number;
  mealLogDays: number;
  proteinAdherenceDays: number; // not exact, but estimated
  checkInDays: number;
}

function computePillarContext(
  pillarKey: PillarKey,
  checkInHistory: DailyCheckIn[],
  scoreHistory: ScoreHistoryEntry[],
  activityLog: ActivityLog[],
  nutritionLogs: NutritionLogEntry[],
  goalPlan: GoalPlanData | null,
): PillarContext {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  // Score history for this pillar
  const thisWeekScores = scoreHistory.filter(e => e.date >= weekAgoStr && e.date <= todayStr);
  const prevWeekScores = scoreHistory.filter(e => e.date >= twoWeeksAgoStr && e.date < weekAgoStr);

  const pillarField = pillarKey as keyof typeof thisWeekScores[0]['pillars'];
  const thisWeekPillarScores = thisWeekScores.map(e => e.pillars?.[pillarField] ?? 50);
  const prevWeekPillarScores = prevWeekScores.map(e => e.pillars?.[pillarField] ?? 50);

  const weeklyScore = thisWeekPillarScores.length > 0
    ? Math.round(thisWeekPillarScores.reduce((a, b) => a + b, 0) / thisWeekPillarScores.length)
    : 50;
  const prevWeekScore = prevWeekPillarScores.length > 0
    ? Math.round(prevWeekPillarScores.reduce((a, b) => a + b, 0) / prevWeekPillarScores.length)
    : null;
  const trend = prevWeekScore != null ? weeklyScore - prevWeekScore : 0;

  // Check-in data for this week
  const thisWeekCheckIns = checkInHistory.filter(c => c.date >= weekAgoStr && c.date <= todayStr);

  // Activity logs for this pillar this week
  const weekActivities = activityLog.filter(l => l.pillar === pillarKey && l.date >= weekAgoStr && l.date <= todayStr);
  const dayActivityCount = new Set(weekActivities.map(l => l.date)).size;

  // Nutrition logs this week
  const weekNutrition = nutritionLogs.filter(l => l.date >= weekAgoStr && l.date <= todayStr);

  // Plan detection
  const hasPlan = (() => {
    if (!goalPlan) return false;
    switch (pillarKey) {
      case 'bewegung': return !!goalPlan.trainingPlanData;
      case 'ernaehrung': return !!goalPlan.nutritionPlan;
      case 'regeneration': return !!(goalPlan.recoveryTips && (goalPlan.recoveryTips as any[]).length > 0);
      case 'mental': return !!(goalPlan.mentalTips && (goalPlan.mentalTips as any[]).length > 0);
      default: return false;
    }
  })();

  // Goal relevance
  const goalType = goalPlan?.goalType || '';
  const relevance = GOAL_PILLAR_RELEVANCE[goalType];
  const isGoalPrimary = relevance?.primary.includes(pillarKey) || false;
  const isGoalSecondary = relevance?.secondary.includes(pillarKey) || false;

  // Pillar-specific metrics from check-ins
  const trainingDays = thisWeekCheckIns.filter(c => c.training).length;
  const totalSteps = thisWeekCheckIns.reduce((s, c) => s + (c.steps || 0), 0);
  const avgSleepHours = thisWeekCheckIns.length > 0
    ? Math.round((thisWeekCheckIns.reduce((s, c) => s + c.sleepHours, 0) / thisWeekCheckIns.length) * 10) / 10
    : 0;
  const avgSleepQuality = thisWeekCheckIns.length > 0
    ? Math.round((thisWeekCheckIns.reduce((s, c) => s + c.sleepQuality, 0) / thisWeekCheckIns.length) * 10) / 10
    : 0;
  const avgStress = thisWeekCheckIns.length > 0
    ? Math.round((thisWeekCheckIns.reduce((s, c) => s + c.stress, 0) / thisWeekCheckIns.length) * 10) / 10
    : 5;
  const avgMood = thisWeekCheckIns.length > 0
    ? Math.round((thisWeekCheckIns.reduce((s, c) => s + c.mood, 0) / thisWeekCheckIns.length) * 10) / 10
    : 5;
  const avgEnergy = thisWeekCheckIns.length > 0
    ? Math.round((thisWeekCheckIns.reduce((s, c) => s + c.energy, 0) / thisWeekCheckIns.length) * 10) / 10
    : 5;
  const mealLogDays = new Set(weekNutrition.map(l => l.date)).size;

  // Estimate protein adherence (rough: count days with 'gut' or 'sehr_gut' quality)
  const proteinAdherenceDays = thisWeekCheckIns.filter(c =>
    c.proteinQuality === 'gut' || c.proteinQuality === 'sehr_gut'
  ).length;

  return {
    weeklyScore,
    prevWeekScore,
    trend,
    isStrong: weeklyScore >= 65,
    isWeak: weeklyScore < 50,
    isCritical: weeklyScore < 35,
    hasPlan,
    isGoalPrimary,
    isGoalSecondary,
    dayActivityCount,
    isConsistent: dayActivityCount >= 4,
    trainingDays,
    totalSteps,
    avgSleepHours,
    avgSleepQuality,
    avgStress,
    avgMood,
    avgEnergy,
    mealLogDays,
    proteinAdherenceDays,
    checkInDays: thisWeekCheckIns.length,
  };
}

/* ═══════════════════════════════════════════════════════════
   CONTENT GENERATORS
   ═══════════════════════════════════════════════════════════ */

function getStatusText(ctx: PillarContext, pillarKey: PillarKey): string {
  if (ctx.checkInDays === 0) return 'Noch keine Daten diese Woche -- starte mit dem Check-in.';

  switch (pillarKey) {
    case 'bewegung': {
      const stepsK = Math.round(ctx.totalSteps / 1000);
      if (ctx.trainingDays > 0 && stepsK > 0) {
        return `${ctx.trainingDays} Trainingstage, ${stepsK}k Schritte gesamt`;
      }
      if (ctx.trainingDays > 0) return `${ctx.trainingDays} Trainingstage diese Woche`;
      return `Kein Training geloggt, ${stepsK > 0 ? `${stepsK}k Schritte` : 'wenig Schrittdaten'}`;
    }
    case 'ernaehrung': {
      if (ctx.mealLogDays > 0) {
        return `${ctx.mealLogDays} Tage mit Mahlzeiten-Log, ${ctx.proteinAdherenceDays}x gutes Protein`;
      }
      if (ctx.proteinAdherenceDays > 0) {
        return `Protein an ${ctx.proteinAdherenceDays}/${ctx.checkInDays} Tagen gut bewertet`;
      }
      return `Kaum Ernahrungsdaten -- mehr Logs verbessern die Analyse`;
    }
    case 'regeneration': {
      if (ctx.avgSleepHours > 0) {
        const qualLabel = ctx.avgSleepQuality >= 7 ? 'gute Qualitat' : ctx.avgSleepQuality >= 5 ? 'maisige Qualitat' : 'niedrige Qualitat';
        return `${ctx.avgSleepHours}h Schlaf im Schnitt, ${qualLabel}`;
      }
      return 'Noch keine Schlafdaten diese Woche';
    }
    case 'mental': {
      return `Stress ${ctx.avgStress}/10, Stimmung ${ctx.avgMood}/10, Energie ${ctx.avgEnergy}/10`;
    }
    default: return '';
  }
}

function getObservation(ctx: PillarContext, pillarKey: PillarKey): string {
  if (ctx.checkInDays === 0) {
    return 'Ohne Check-in-Daten kann ich diese Woche keine Beobachtung machen. Ein taglicher Check-in dauert 30 Sekunden.';
  }
  if (ctx.checkInDays < 3) {
    return `Nur ${ctx.checkInDays} Check-ins diese Woche -- die Analyse basiert auf wenig Daten. Mehr Tage ergeben ein genaueres Bild.`;
  }

  switch (pillarKey) {
    case 'bewegung': {
      if (ctx.trainingDays >= 4) return `Du hast an ${ctx.trainingDays}/7 Tagen trainiert -- das ist stark und zeigt sich direkt in deinem Score.`;
      if (ctx.trainingDays >= 2) return `${ctx.trainingDays} Trainingstage sind ein solider Anfang. Ein weiterer Tag wurde deinen Trend stabilisieren.`;
      if (ctx.trainingDays === 1) return `Nur 1 Trainingstag diese Woche -- dein Körper braucht mehr regelmäßige Reize, um Fortschritt zu machen.`;
      return 'Kein Training diese Woche geloggt. Auch 20 Minuten Bewegung zählen -- der erste Schritt ist der wichtigste.';
    }
    case 'ernaehrung': {
      if (ctx.mealLogDays >= 5) return `An ${ctx.mealLogDays} Tagen Mahlzeiten geloggt -- das gibt ein klares Bild deiner Ernährung.`;
      if (ctx.mealLogDays >= 2) return `An ${ctx.mealLogDays} Tagen Mahlzeiten geloggt -- die Ernährungsauswertung ist deshalb lückenhaft.`;
      if (ctx.proteinAdherenceDays >= 3) return `Dein Protein war an ${ctx.proteinAdherenceDays} Tagen gut -- das trägt deinen Fortschritt.`;
      return 'Wenig Ernährungsdaten diese Woche -- ohne Logs fährt dein Plan blind.';
    }
    case 'regeneration': {
      if (ctx.avgSleepHours >= 7.5) return `Dein Schlaf lag diese Woche bei ${ctx.avgSleepHours}h im Schnitt -- das ist ausgezeichnet und trägt deine gesamte Performance.`;
      if (ctx.avgSleepHours >= 7) return `${ctx.avgSleepHours}h Schlaf im Schnitt -- solide Basis, aber 30 Minuten mehr würden spürbar helfen.`;
      if (ctx.avgSleepHours >= 6) return `Dein Schlaf lag diese Woche bei ${ctx.avgSleepHours}h -- unter dem empfohlenen Minimum von 7h. Das bremst Recovery und Leistung.`;
      if (ctx.avgSleepHours > 0) return `${ctx.avgSleepHours}h Schlaf im Schnitt ist deutlich zu wenig. Schlafmangel beeinträchtigt alles -- Training, Ernährung, mentale Stärke.`;
      return 'Keine Schlafdaten verfügbar -- trage deinen Schlaf im Check-in ein.';
    }
    case 'mental': {
      if (ctx.avgStress >= 7) return `Dein Stress lag bei ${ctx.avgStress}/10 -- das ist hoch und beeinflusst Recovery, Fokus und Essverhalten messbar.`;
      if (ctx.avgStress >= 5) return `Stress bei ${ctx.avgStress}/10 -- im mittleren Bereich. Gezielte Pausen könnten hier den Unterschied machen.`;
      if (ctx.avgMood >= 7) return `Stimmung bei ${ctx.avgMood}/10 und Stress bei ${ctx.avgStress}/10 -- mentale Balance ist diese Woche stark.`;
      return `Stress ${ctx.avgStress}/10, Stimmung ${ctx.avgMood}/10 -- insgesamt stabil, aber Verbesserungspotenzial vorhanden.`;
    }
    default: return '';
  }
}

function getGoalRelevanceText(ctx: PillarContext, pillarKey: PillarKey, goalType: string): string | null {
  if (!goalType) return null;
  const goalTexts = GOAL_RELEVANCE_TEXT[goalType];
  if (!goalTexts) return null;
  return goalTexts[pillarKey] || null;
}

function getNoPlanText(ctx: PillarContext, pillarKey: PillarKey, goalType: string): string {
  switch (pillarKey) {
    case 'bewegung':
      return 'Ein personalisierter Trainingsplan würde deine Bewegungskonsistenz sofort erhöhen. Du brauchst nur 3 Minuten, um ihn einzurichten.';
    case 'ernaehrung':
      return ctx.mealLogDays > 0
        ? `Ein Ernährungsplan würde dir helfen, dein Proteinziel an mehr Tagen zu treffen -- aktuell schaffst du es an ${ctx.proteinAdherenceDays} Tagen.`
        : 'Ein personalisierter Ernährungsplan gibt dir Struktur und Mahlzeiten, die zu deinem Ziel passen.';
    case 'regeneration':
      return ctx.avgSleepHours > 0 && ctx.avgSleepHours < 7
        ? `Dein Schlaf liegt bei ${ctx.avgSleepHours}h -- ein Recovery-Plan mit Abendroutine könnte das direkt verbessern.`
        : 'Ein Recovery-Plan gibt dir eine konkrete Abendroutine und Regenerationsstrategie.';
    case 'mental':
      return ctx.avgStress >= 6
        ? `Dein Stresslevel ist bei ${ctx.avgStress}/10 -- ein Mental-Plan mit Atemübungen und Pausen würde direkt wirken.`
        : 'Ein Mental-Plan gibt dir tägliche Praktiken für klareren Fokus und weniger Stress.';
    default:
      return 'Ein personalisierter Plan wurde dir hier gezielte Struktur geben.';
  }
}

interface NextAction {
  label: string;
  type: 'personalize' | 'detail' | 'plans';
}

function getNextAction(ctx: PillarContext, pillarKey: PillarKey): NextAction {
  if (ctx.isWeak && !ctx.hasPlan) {
    return { label: 'Plan in 3 Min erstellen', type: 'personalize' };
  }
  if (ctx.isWeak && ctx.hasPlan) {
    const actionMap: Record<PillarKey, string> = {
      bewegung: 'Training anpassen',
      ernaehrung: 'Ernährung anpassen',
      regeneration: 'Recovery-Plan anpassen',
      mental: 'Mental-Plan anpassen',
    };
    return { label: actionMap[pillarKey], type: 'personalize' };
  }
  if (ctx.isStrong && ctx.hasPlan) {
    return { label: 'Pläne ansehen', type: 'plans' };
  }
  if (ctx.isStrong && !ctx.hasPlan) {
    return { label: 'Struktur hinzufügen', type: 'personalize' };
  }
  // Mid-range
  if (ctx.hasPlan) {
    return { label: 'Plan ansehen & anpassen', type: 'personalize' };
  }
  return { label: 'Plan erstellen', type: 'personalize' };
}

function getPlanPreview(pillarKey: PillarKey, goalPlan: GoalPlanData): string[] {
  switch (pillarKey) {
    case 'bewegung': {
      const plan = goalPlan.trainingPlanData;
      if (!plan?.days) return [];
      const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
      const today = plan.days[todayIdx];
      if (!today) return [];
      if (today.isTraining) {
        const exercises = today.exercises?.slice(0, 3).map((e: any) => e.name) || [];
        return [`${today.day}: ${today.sessionType} (${today.duration} Min)`, ...exercises.map((e: string) => `  ${e}`)];
      }
      return [`${today.day}: ${today.movementSuggestion || 'Active Recovery'}`];
    }
    case 'ernaehrung': {
      const plan = goalPlan.nutritionPlan;
      if (!plan?.days) return [];
      const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
      const day = plan.days[todayIdx];
      if (!day) return [];
      const meals = day.meals?.slice(0, 2).map((m: any) => `${m.name} (${m.protein}g P)`) || [];
      return [`Heute: ${day.totalCalories} kcal, ${day.totalProtein}g Protein`, ...meals];
    }
    case 'regeneration': {
      const tips: any[] = goalPlan.recoveryTips || [];
      if (tips.length === 0) return [];
      return tips.slice(0, 2).map((t: any) => t.title);
    }
    case 'mental': {
      const tips: any[] = goalPlan.mentalTips || [];
      if (tips.length === 0) return [];
      return tips.slice(0, 2).map((t: any) => t.title);
    }
    default: return [];
  }
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function PillarCardExpanded({
  pillarKey,
  displayScore,
  lastWeekScore,
  checkInHistory,
  scoreHistory,
  activityLog,
  nutritionLogs,
  goalPlan,
  onOpenPersonalization,
  onOpenPillarDetail,
  onNavigateToPlans,
}: PillarCardExpandedProps) {
  const ctx = useMemo(() => computePillarContext(
    pillarKey, checkInHistory, scoreHistory, activityLog, nutritionLogs, goalPlan,
  ), [pillarKey, checkInHistory, scoreHistory, activityLog, nutritionLogs, goalPlan]);

  const goalType = goalPlan?.goalType || '';
  const goalRelevance = useMemo(() => getGoalRelevanceText(ctx, pillarKey, goalType), [ctx, pillarKey, goalType]);
  const planPreview = useMemo(() => ctx.hasPlan && goalPlan ? getPlanPreview(pillarKey, goalPlan) : [], [ctx.hasPlan, pillarKey, goalPlan]);
  const nextAction = useMemo(() => getNextAction(ctx, pillarKey), [ctx, pillarKey]);

  const trendVal = ctx.trend;
  const TrendIcon = trendVal > 3 ? TrendingUp : trendVal < -3 ? TrendingDown : Minus;
  const trendColor = trendVal > 3 ? 'text-primary' : trendVal < -3 ? 'text-destructive/70' : 'text-muted-foreground/40';
  const trendLabel = trendVal > 3 ? `+${trendVal}` : trendVal < -3 ? `${trendVal}` : '~';

  const handleAction = () => {
    if (nextAction.type === 'personalize') {
      onOpenPersonalization(pillarKey);
    } else if (nextAction.type === 'detail') {
      onOpenPillarDetail(pillarKey);
    } else {
      onNavigateToPlans();
    }
  };

  return (
    <div
      className="mt-1 rounded-xl border border-border/20 p-3 space-y-0 animate-fade-in"
      style={{ background: 'var(--gradient-card)' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── WOCHENSTATUS ── */}
      <div className="pb-2.5">
        <p className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-1.5">Wochenstatus</p>
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold',
            ctx.isStrong ? 'border-primary/25 bg-primary/8 text-primary' :
            ctx.isCritical ? 'border-destructive/25 bg-destructive/8 text-destructive' :
            ctx.isWeak ? 'border-amber-400/25 bg-amber-400/8 text-amber-400' :
            'border-border/25 bg-secondary/20 text-foreground',
          )}>
            {displayScore}
            <TrendIcon className={cn('w-3 h-3', trendColor)} />
            <span className={cn('text-[9px] font-semibold', trendColor)}>{trendLabel}</span>
          </div>
          <p className="text-[11px] text-foreground/80 leading-snug flex-1">{getStatusText(ctx, pillarKey)}</p>
        </div>
      </div>

      {/* ── HAUPT-BEOBACHTUNG ── */}
      <div className="border-t border-border/15 py-2.5">
        <p className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-1">Beobachtung</p>
        <p className="text-xs text-foreground/90 leading-relaxed">{getObservation(ctx, pillarKey)}</p>
      </div>

      {/* ── ZIEL-RELEVANZ ── */}
      {goalRelevance && (
        <div className="border-t border-border/15 py-2.5">
          <p className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-1">
            Ziel-Relevanz
            {ctx.isGoalPrimary && <span className="ml-1.5 text-[8px] text-primary font-semibold normal-case tracking-normal">#1 Hebel</span>}
          </p>
          <p className="text-xs text-foreground/90 leading-relaxed">{goalRelevance}</p>
        </div>
      )}

      {/* ── AKTIVER PLAN ── */}
      {ctx.hasPlan && planPreview.length > 0 && (
        <div className="border-t border-border/15 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground/60">Aktiver Plan</p>
            <button
              onClick={(e) => { e.stopPropagation(); onNavigateToPlans(); }}
              className="text-[9px] text-primary font-semibold flex items-center gap-0.5 active:scale-95 transition-transform"
            >
              Alle Plane <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="space-y-1">
            {planPreview.map((line, i) => (
              <p key={i} className={cn(
                'text-[11px] leading-snug',
                i === 0 ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}>{line}</p>
            ))}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenPersonalization(pillarKey); }}
            className="mt-2 flex items-center gap-1 text-[10px] text-primary font-semibold active:scale-95 transition-transform px-2 py-1 rounded-lg bg-primary/5 border border-primary/15"
          >
            <Settings2 className="w-3 h-3" />
            Anpassen
          </button>
        </div>
      )}

      {/* ── KEIN PLAN ── */}
      {!ctx.hasPlan && (
        <div className="border-t border-border/15 py-2.5">
          <p className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-1">Empfehlung</p>
          <p className="text-xs text-foreground/90 leading-relaxed mb-2">{getNoPlanText(ctx, pillarKey, goalType)}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenPersonalization(pillarKey); }}
            className="flex items-center gap-1.5 text-[11px] text-primary font-semibold active:scale-95 transition-transform px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20"
          >
            Plan erstellen
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── NACHSTE AKTION ── */}
      <div className="border-t border-border/15 pt-2.5">
        <button
          onClick={(e) => { e.stopPropagation(); handleAction(); }}
          className={cn(
            'w-full rounded-lg text-xs font-semibold py-2 active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5',
            ctx.isWeak && !ctx.hasPlan
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/10 border border-primary/20 text-primary',
          )}
        >
          {nextAction.label}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
