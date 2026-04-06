import { useState, useMemo, useCallback } from 'react';
import { type ExtendedGoal, type RealismData, type FullAssessment, EXTENDED_GOAL_OPTIONS, getWeeklyFocusSummary } from '@/lib/goalAssessment';
import { cn } from '@/lib/utils';
import CaliSpeechBubble from '@/components/app/CaliSpeechBubble';
import PillarPersonalizationModal from '@/components/goal/PillarPersonalizationModal';
import PillarCardExpanded from '@/components/goal/PillarCardExpanded';
import { Progress } from '@/components/ui/progress';
import {
  Target, ChevronDown, Activity, Apple, Moon, Brain,
  RefreshCw, Egg, ChevronRight, Check, TrendingUp, TrendingDown, Minus, ClipboardList, CalendarDays,
  Zap, AlertTriangle, Lightbulb, Eye, Settings2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { calculatePillarScores } from '@/lib/scoring';
import type { PillarKey } from '@/lib/focusPillar';

interface GoalSummaryDashboardProps {
  goal: ExtendedGoal;
  secondaryGoal?: ExtendedGoal;
  realism: RealismData;
  assessment: FullAssessment;
  answers: Record<string, any>;
  onReset: () => void;
  onOpenPillar?: (pillarKey: string) => void;
}

const PILLAR_ICONS: Record<string, typeof Activity> = {
  bewegung: Activity, ernaehrung: Apple, regeneration: Moon, mental: Brain,
};

const PILLAR_SHORT: Record<string, string> = {
  bewegung: 'Bewegung', ernaehrung: 'Ernährung', regeneration: 'Recovery', mental: 'Mental',
};

function getWeeklyPriorityText(weakestPillar: string, goalType?: string): string {
  const map: Record<string, Record<string, string>> = {
    bewegung: {
      fat_loss: 'Mehr Bewegung erhöht deinen Kalorienverbrauch am direktesten.',
      muscle_gain: 'Fehlende Trainings blockieren deinen Muskelaufbau direkt.',
      default: 'Bewegung ist dein größter Hebel diese Woche.',
    },
    ernaehrung: {
      fat_loss: 'Deine Ernährung ist der stärkste Faktor für dein Gewichtsziel.',
      muscle_gain: 'Ausreichend Protein ist Voraussetzung für Muskelwachstum.',
      default: 'Ernährung hat diese Woche den größten Einfluss auf deinen Score.',
    },
    regeneration: {
      fat_loss: 'Schlafmangel erhöht Cortisol und blockiert Fettabbau.',
      muscle_gain: 'Ohne Recovery baut dein Körper keine Muskeln auf.',
      default: 'Gute Regeneration ist die Basis für alles andere.',
    },
    mental: {
      fat_loss: 'Stress erhöht Cravings und torpediert dein Kalorienziel.',
      muscle_gain: 'Mentale Stabilität hält deine Trainingsroutine aufrecht.',
      default: 'Mentale Ausgeglichenheit ist dein unsichtbarer Hebel.',
    },
  };
  const pillarMap = map[weakestPillar] || {};
  return pillarMap[goalType || 'default'] || pillarMap['default'] || 'Fokus auf deine schwächste Säule diese Woche.';
}

function getWeeklyEvaluation(
  weeklyPillarData: WeeklyPillarData | null,
  goalType: string,
): { helped: string[]; hurt: string[] } {
  if (!weeklyPillarData) return { helped: [], hurt: [] };

  const helped: string[] = [];
  const hurt: string[] = [];
  const tw = weeklyPillarData.thisWeek;
  const lw = weeklyPillarData.lastWeek;

  const strongLabel = PILLAR_SHORT[weeklyPillarData.strongestPillar] || weeklyPillarData.strongestPillar;
  const strongScore = tw[weeklyPillarData.strongestPillar];
  helped.push(`${strongLabel} war stark (${strongScore}) und hat dich getragen.`);

  if (weeklyPillarData.daysCheckedIn >= 5) {
    helped.push(`${weeklyPillarData.daysCheckedIn}/7 Check-ins zeigen starke Konstanz.`);
  }

  if (lw) {
    for (const [key, score] of Object.entries(tw)) {
      const prev = lw[key];
      if (prev != null && score - prev > 5) {
        helped.push(`${PILLAR_SHORT[key] || key} hat sich um ${score - prev} Punkte verbessert.`);
      }
      if (prev != null && prev - score > 5) {
        hurt.push(`${PILLAR_SHORT[key] || key} ist um ${prev - score} Punkte gefallen.`);
      }
    }
  }

  const weakLabel = PILLAR_SHORT[weeklyPillarData.weakestPillar] || weeklyPillarData.weakestPillar;
  const weakScore = tw[weeklyPillarData.weakestPillar];
  if (weakScore < 50) {
    hurt.push(`${weakLabel} bei ${weakScore} bremst deinen Gesamtfortschritt.`);
  }

  if (weeklyPillarData.daysCheckedIn < 4) {
    hurt.push(`Nur ${weeklyPillarData.daysCheckedIn}/7 Check-ins -- fehlende Daten erschweren die Steuerung.`);
  }

  return { helped: helped.slice(0, 3), hurt: hurt.slice(0, 3) };
}

function getNextWeekRecommendations(
  weeklyPillarData: WeeklyPillarData | null,
  assessment: FullAssessment,
  goalType: string,
): string[] {
  const recs: string[] = [];

  if (weeklyPillarData) {
    const weakLabel = PILLAR_SHORT[weeklyPillarData.weakestPillar] || weeklyPillarData.weakestPillar;
    recs.push(`Hauptfokus: ${weakLabel} gezielt verbessern.`);

    if (weeklyPillarData.daysCheckedIn < 5) {
      recs.push('Check-in-Routine aufbauen -- tägliche Daten sind der Schlüssel.');
    }

    const strongLabel = PILLAR_SHORT[weeklyPillarData.strongestPillar] || weeklyPillarData.strongestPillar;
    recs.push(`${strongLabel} auf Autopilot halten -- Fokus auf Schwachstelle.`);
  } else {
    const weakest = assessment.pillars.reduce((w, p) => p.score < w.score ? p : w, assessment.pillars[0]);
    const weakLabel = PILLAR_SHORT[weakest.key] || weakest.key;
    recs.push(`Starte diese Woche mit ${weakLabel} als Hauptfokus.`);
    recs.push('Tägliche Check-ins machen, um deine Wochenform zu tracken.');
  }

  return recs.slice(0, 3);
}

function getGoalInterpretation(
  goal: ExtendedGoal,
  realism: RealismData,
  weakestPillar: string,
  currentWeek: number,
  timeframe: number,
): string {
  const weakLabel = PILLAR_SHORT[weakestPillar] || weakestPillar;
  const progress = Math.round((currentWeek / timeframe) * 100);

  if (progress < 20) {
    return `Guter Start. Dein größter Hebel gerade: ${weakLabel} stabilisieren -- das hebt alles.`;
  }
  if (progress < 50) {
    return `Woche ${currentWeek} von ${timeframe}. ${weakLabel} ist dein Engpass -- hier entscheidet sich dein Fortschritt.`;
  }
  if (progress < 80) {
    return `Du bist auf halber Strecke. ${realism.realismRating === 'sehr gut' ? 'Dein Plan geht auf' : 'Jetzt dranbleiben'} -- ${weakLabel} bleibt der Schlüssel.`;
  }
  return `Endspurt! ${weakLabel} noch einmal gezielt pushen, dann hast du es geschafft.`;
}

type WeeklyPillarData = {
  thisWeek: Record<string, number>;
  lastWeek: Record<string, number> | null;
  weakestPillar: string;
  strongestPillar: string;
  daysCheckedIn: number;
};

export default function GoalSummaryDashboard({ goal, secondaryGoal, realism, assessment, answers, onReset, onOpenPillar }: GoalSummaryDashboardProps) {
  const navigate = useNavigate();
  const { checkInHistory, goalPlan, scoreHistory, activityLog, nutritionLogs, focusChecked, toggleFocusChecked } = useApp();
  const goalOption = EXTENDED_GOAL_OPTIONS.find(g => g.type === goal);
  const secondaryOption = secondaryGoal ? EXTENDED_GOAL_OPTIONS.find(g => g.type === secondaryGoal) : null;
  const weeklyFocus = getWeeklyFocusSummary(goal, assessment, answers);
  const fitColor = realism.realismRating === 'sehr gut' ? 'text-primary' : realism.realismRating === 'mittel-gut' ? 'text-amber-400' : 'text-destructive';

  const timeframe = Number(answers.timeframe) || 12;
  const currentWeek = Math.max(1, Math.ceil((Date.now() - new Date(answers._createdAt || Date.now()).getTime()) / (7 * 86400000)));

  // Weekly focus items for interactive checklist
  const focusItems = useMemo(() => {
    const items: { label: string; target: number; current: number }[] = [];
    if (weeklyFocus.includes('Protein')) items.push({ label: 'Protein vor 14 Uhr an 5 Tagen', target: 5, current: 0 });
    if (weeklyFocus.includes('Bewegungsbl')) items.push({ label: `${answers.trainingDays || 3} Bewegungsblöcke diese Woche`, target: Number(answers.trainingDays) || 3, current: 0 });
    if (weeklyFocus.includes('Bildschirmzeit')) items.push({ label: 'Bildschirm aus 60 Min vor Schlaf', target: 5, current: 0 });
    if (weeklyFocus.includes('Schlaf')) items.push({ label: 'Schlaf-Routine einhalten', target: 5, current: 0 });
    if (items.length === 0) items.push({ label: 'Taglichen Check-in machen', target: 7, current: 0 });
    return items;
  }, [weeklyFocus, answers]);

  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  // Ensure focusChecked array matches focusItems length (pad with false if needed)
  const effectiveFocusChecked = useMemo(() => {
    const arr = [...focusChecked];
    while (arr.length < focusItems.length) arr.push(false);
    return arr.slice(0, focusItems.length);
  }, [focusChecked, focusItems.length]);
  const [focusCelebration, setFocusCelebration] = useState<number | null>(null);
  const [personalizationPillar, setPersonalizationPillar] = useState<PillarKey | null>(null);
  const [planCreatedPillar, setPlanCreatedPillar] = useState<string | null>(null);

  const handleCreatePlanWithHint = (pillar: PillarKey) => {
    setPersonalizationPillar(pillar);
    // After modal closes, show the "Dein Plan ist aktiv" hint
    const key = `caliness_plan_created_${pillar}`;
    localStorage.setItem(key, new Date().toISOString());
    setPlanCreatedPillar(PILLAR_SHORT[pillar] ?? pillar);
    setTimeout(() => setPlanCreatedPillar(null), 8000);
  };

  const toggleFocus = useCallback((idx: number) => {
    toggleFocusChecked(idx);
    if (!effectiveFocusChecked[idx]) {
      if (navigator.vibrate) navigator.vibrate([10]);
      setFocusCelebration(idx);
      setTimeout(() => setFocusCelebration(null), 3000);
    }
  }, [effectiveFocusChecked, toggleFocusChecked]);

  // Weekly real pillar data from check-in history
  const weeklyPillarData = useMemo<WeeklyPillarData | null>(() => {
    if (checkInHistory.length === 0) return null;
    const getDateNDaysAgo = (n: number) => {
      const d = new Date(); d.setDate(d.getDate() - n);
      return d.toISOString().split('T')[0];
    };
    const week1Start = getDateNDaysAgo(6);
    const week2Start = getDateNDaysAgo(13);
    const thisWeekCIs = checkInHistory.filter(c => c.date >= week1Start);
    const lastWeekCIs = checkInHistory.filter(c => c.date >= week2Start && c.date < week1Start);
    const avgPillars = (cis: typeof checkInHistory) => {
      if (cis.length === 0) return null;
      const ps = cis.map(c => calculatePillarScores(c));
      return {
        bewegung: Math.round(ps.reduce((s, p) => s + p.bewegung, 0) / ps.length),
        ernaehrung: Math.round(ps.reduce((s, p) => s + p.ernaehrung, 0) / ps.length),
        regeneration: Math.round(ps.reduce((s, p) => s + p.regeneration, 0) / ps.length),
        mental: Math.round(ps.reduce((s, p) => s + p.mental, 0) / ps.length),
      };
    };
    const tw = avgPillars(thisWeekCIs);
    const lw = avgPillars(lastWeekCIs);
    if (!tw) return null;
    const entries = Object.entries(tw) as [string, number][];
    const weakestKey = entries.reduce((a, b) => a[1] < b[1] ? a : b)[0];
    const strongestKey = entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
    return { thisWeek: tw, lastWeek: lw, daysCheckedIn: thisWeekCIs.length, weakestPillar: weakestKey, strongestPillar: strongestKey };
  }, [checkInHistory]);

  const weakestPillar = assessment.pillars.reduce((w, p) => p.score < w.score ? p : w, assessment.pillars[0]);

  // Weekly evaluation and next-week recommendations
  const weeklyEval = useMemo(() => getWeeklyEvaluation(weeklyPillarData, goal), [weeklyPillarData, goal]);
  const nextWeekRecs = useMemo(() => getNextWeekRecommendations(weeklyPillarData, assessment, goal), [weeklyPillarData, assessment, goal]);

  // AI interpretation line
  const interpretation = useMemo(() => {
    const effectiveWeakest = weeklyPillarData?.weakestPillar || weakestPillar.key;
    return getGoalInterpretation(goal, realism, effectiveWeakest, currentWeek, timeframe);
  }, [goal, realism, weeklyPillarData, weakestPillar.key, currentWeek, timeframe]);

  const focusDoneCount = effectiveFocusChecked.filter(Boolean).length;

  // Plan data from goalPlan
  const trainingPlan = goalPlan?.trainingPlanData;
  const nutritionPlan = goalPlan?.nutritionPlan;
  const storedRecoveryTips: any[] = goalPlan?.recoveryTips || [];
  const storedMentalTips: any[] = goalPlan?.mentalTips || [];
  const hasAnyPlan = !!(trainingPlan || nutritionPlan || storedRecoveryTips.length || storedMentalTips.length);

  // Personalization data from weeklyPlan
  const personalizationData = goalPlan?.weeklyPlan || {};

  // Today index for plan previews
  const dayOfWeek = new Date().getDay();
  const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  return (
    <div className="space-y-4 animate-enter">

      {/* ================================================================
          SECTION 1: ZIELSTATUS (compact header)
          ================================================================ */}
      <div className="rounded-2xl border border-border/20 p-4" style={{ background: 'var(--gradient-card)' }}>
        {/* Goal name + type */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{goalOption?.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground leading-tight font-outfit">{goalOption?.label}</p>
                <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-full', fitColor, 'bg-current/10 border border-current/20')}>
                  {realism.realismRating}
                </span>
              </div>
              {secondaryOption && <p className="text-[10px] text-muted-foreground">+ {secondaryOption.label}</p>}
            </div>
          </div>
          <button onClick={onReset} className="w-8 h-8 rounded-lg bg-secondary/30 border border-border/30 flex items-center justify-center">
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Compact status row: Engpass + Wochenhebel */}
        <div className="flex gap-2 mb-2.5">
          <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-400/5 border border-amber-400/15">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <div>
              <p className="text-[8px] text-amber-400/70 font-semibold uppercase tracking-wider">Engpass</p>
              <p className="text-[10px] font-semibold text-foreground truncate">{realism.biggestBottleneck.split(' ').slice(0, 3).join(' ')}</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/15">
            <Zap className="w-3 h-3 text-primary shrink-0" />
            <div>
              <p className="text-[8px] text-primary/70 font-semibold uppercase tracking-wider">Hebel</p>
              <p className="text-[10px] font-semibold text-foreground truncate">{PILLAR_SHORT[weeklyPillarData?.weakestPillar || weakestPillar.key] || 'Fokus'}</p>
            </div>
          </div>
        </div>

        {/* Progress + week */}
        <div className="flex items-center gap-2 mb-2">
          <Progress value={Math.min(100, (currentWeek / timeframe) * 100)} variant="neon" className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground font-semibold shrink-0">Woche {currentWeek}/{timeframe}</span>
        </div>

        {/* AI interpretation */}
        <p className="text-[11px] text-muted-foreground leading-relaxed italic">{interpretation}</p>
      </div>

      {/* ================================================================
          SECTION 2: WOCHENFOKUS (weekly focus checklist)
          ================================================================ */}
      <div className="rounded-2xl border border-primary/20 p-4" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--primary) / 0.01))' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Wochenfokus</span>
          </div>
          <span className="text-[10px] text-primary/60 font-semibold">
            {focusDoneCount}/{focusItems.length} erledigt
          </span>
        </div>

        <div className="space-y-2">
          {focusItems.map((item, idx) => (
            <div key={idx}>
              <button
                onClick={() => toggleFocus(idx)}
                className={cn(
                  'w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left active:scale-[0.98]',
                  effectiveFocusChecked[idx] ? 'border-primary/25 bg-primary/10' : 'border-border/20 bg-background/50',
                )}
                style={{ minHeight: '44px' }}
              >
                <div className={cn(
                  'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all',
                  effectiveFocusChecked[idx] ? 'bg-primary border-primary' : 'border-border/40',
                )}>
                  {effectiveFocusChecked[idx] && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className={cn(
                  'text-xs flex-1',
                  effectiveFocusChecked[idx] ? 'text-muted-foreground line-through' : 'text-foreground font-medium',
                )}>
                  {item.label}
                </span>
                <span className="text-[9px] text-muted-foreground">{item.current}/{item.target}</span>
              </button>
              {focusCelebration === idx && (
                <div className="animate-fade-in mt-1">
                  <CaliSpeechBubble message="Stark, weiter so!" compact />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================
          SECTION 3: AKTIVE PLANE (real plan preview cards)
          ================================================================ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground">Aktive Plane</span>
          </div>
          {hasAnyPlan && (
            <button
              onClick={() => navigate('/app/my-plans')}
              className="text-[10px] text-primary font-semibold flex items-center gap-0.5 active:scale-95 transition-transform"
            >
              Alle ansehen <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Post-plan-creation hint banner */}
        {planCreatedPillar && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground">Dein {planCreatedPillar}-Plan ist aktiv</p>
              <p className="text-[10px] text-muted-foreground">Du findest deine heutigen Aktionen in der Heute-Ansicht</p>
            </div>
            <button
              onClick={() => navigate('/app/heute')}
              className="text-[10px] font-bold text-primary shrink-0 active:scale-95 transition-transform"
            >
              Heute →
            </button>
          </div>
        )}

        {/* Training Plan Card */}
        <PlanPreviewCard
          icon={Activity}
          label="Training"
          pillarKey="bewegung"
          hasData={!!trainingPlan}
          onPersonalize={() => setPersonalizationPillar('bewegung')}
          onCreatePlan={() => handleCreatePlanWithHint('bewegung')}
          onCardClick={() => navigate('/app/my-plans?tab=bewegung')}
          isPersonalized={!!personalizationData.bewegungPersonalization}
        >
          {trainingPlan ? (
            <div className="space-y-1">
              {trainingPlan.days.slice(0, 3).filter((d: any) => d.isTraining).map((day: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{day.day?.slice(0, 2)} - {day.sessionType}</span>
                  <span className="text-[10px] text-primary font-semibold">{day.duration} Min</span>
                </div>
              ))}
              {trainingPlan.days.filter((d: any) => d.isTraining).length > 3 && (
                <p className="text-[9px] text-muted-foreground/60">+{trainingPlan.days.filter((d: any) => d.isTraining).length - 3} weitere Tage</p>
              )}
            </div>
          ) : null}
        </PlanPreviewCard>

        {/* Nutrition Plan Card */}
        <PlanPreviewCard
          icon={Apple}
          label="Ernährung"
          pillarKey="ernaehrung"
          hasData={!!nutritionPlan}
          onPersonalize={() => setPersonalizationPillar('ernaehrung')}
          onCreatePlan={() => handleCreatePlanWithHint('ernaehrung')}
          onCardClick={() => navigate('/app/my-plans?tab=ernaehrung')}
          isPersonalized={!!personalizationData.ernaehrungPersonalization}
        >
          {nutritionPlan ? (
            <div className="space-y-1">
              {nutritionPlan.days[todayIdx]?.meals?.slice(0, 2).map((meal: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground truncate flex-1 mr-2">{meal.name}</span>
                  <span className="text-[10px] text-primary font-semibold shrink-0">{meal.protein}g P</span>
                </div>
              ))}
              {(nutritionPlan.days[todayIdx]?.meals?.length || 0) > 2 && (
                <p className="text-[9px] text-muted-foreground/60">+{(nutritionPlan.days[todayIdx]?.meals?.length ?? 0) - 2} weitere Mahlzeiten</p>
              )}
              <div className="flex gap-2 mt-0.5">
                <span className="text-[9px] text-muted-foreground/60">{nutritionPlan.days[todayIdx]?.totalCalories} kcal</span>
                <span className="text-[9px] text-primary/70 font-semibold">{nutritionPlan.days[todayIdx]?.totalProtein}g Protein</span>
              </div>
            </div>
          ) : null}
        </PlanPreviewCard>

        {/* Recovery Plan Card */}
        <PlanPreviewCard
          icon={Moon}
          label="Recovery"
          pillarKey="regeneration"
          hasData={storedRecoveryTips.length > 0}
          onPersonalize={() => setPersonalizationPillar('regeneration')}
          onCreatePlan={() => handleCreatePlanWithHint('regeneration')}
          onCardClick={() => navigate('/app/my-plans?tab=regeneration')}
          isPersonalized={!!personalizationData.regenerationPersonalization}
        >
          {storedRecoveryTips.length > 0 ? (
            <div className="space-y-1">
              {storedRecoveryTips.slice(0, 2).map((tip: any, i: number) => (
                <div key={i} className="flex items-start gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className="text-[11px] text-muted-foreground leading-snug">{tip.title}</span>
                </div>
              ))}
              {storedRecoveryTips.length > 2 && (
                <p className="text-[9px] text-muted-foreground/60">+{storedRecoveryTips.length - 2} weitere Tipps</p>
              )}
            </div>
          ) : null}
        </PlanPreviewCard>

        {/* Mental Plan Card */}
        <PlanPreviewCard
          icon={Brain}
          label="Mental"
          pillarKey="mental"
          hasData={storedMentalTips.length > 0}
          onPersonalize={() => setPersonalizationPillar('mental')}
          onCreatePlan={() => handleCreatePlanWithHint('mental')}
          onCardClick={() => navigate('/app/my-plans?tab=mental')}
          isPersonalized={!!personalizationData.mentalPersonalization}
        >
          {storedMentalTips.length > 0 ? (
            <div className="space-y-1">
              {storedMentalTips.slice(0, 2).map((tip: any, i: number) => (
                <div key={i} className="flex items-start gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className="text-[11px] text-muted-foreground leading-snug">{tip.title}</span>
                </div>
              ))}
              {storedMentalTips.length > 2 && (
                <p className="text-[9px] text-muted-foreground/60">+{storedMentalTips.length - 2} weitere Tipps</p>
              )}
            </div>
          ) : null}
        </PlanPreviewCard>
      </div>

      {/* ================================================================
          SECTION 4: WOCHENFORM DER 4 SAULEN
          ================================================================ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground">Wochenform</span>
          </div>
          {weeklyPillarData && (
            <span className="text-[10px] text-muted-foreground/60">{weeklyPillarData.daysCheckedIn}/7 Tage erfasst</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {assessment.pillars.map(pillar => {
            const Icon = PILLAR_ICONS[pillar.key] || Activity;
            const isWeakest = pillar.key === weakestPillar.key;
            const isExpanded = expandedPillar === pillar.key;
            const assessmentScore = pillar.score;

            const liveScore = weeklyPillarData?.thisWeek?.[pillar.key];
            const lastScore = weeklyPillarData?.lastWeek?.[pillar.key];
            const displayScore = liveScore ?? assessmentScore;
            const trend = lastScore != null && liveScore != null
              ? (liveScore - lastScore > 3 ? 'up' : liveScore - lastScore < -3 ? 'down' : 'stable')
              : null;

            const statusText = displayScore >= 66 ? 'Stark' : displayScore >= 33 ? 'Achtung' : 'Kritisch';
            const barColor = displayScore >= 66 ? 'bg-primary' : displayScore >= 33 ? 'bg-amber-400' : 'bg-destructive/70';
            const isLiveWeakest = weeklyPillarData ? pillar.key === weeklyPillarData.weakestPillar : isWeakest;
            const isLiveStrongest = weeklyPillarData ? pillar.key === weeklyPillarData.strongestPillar : false;

            return (
              <div key={pillar.key} className={cn('col-span-1', isExpanded && 'col-span-2')}>
                <button
                  onClick={() => setExpandedPillar(isExpanded ? null : pillar.key)}
                  className={cn(
                    'w-full rounded-xl border p-3 text-left transition-all active:scale-[0.97]',
                    isLiveWeakest ? 'border-amber-400/35' : isLiveStrongest ? 'border-primary/25' : 'border-border/20',
                  )}
                  style={{
                    background: isLiveWeakest
                      ? 'linear-gradient(135deg, hsl(38 92% 50% / 0.07), transparent)'
                      : isLiveStrongest
                        ? 'linear-gradient(135deg, hsl(142 76% 46% / 0.05), transparent)'
                        : 'var(--gradient-card)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn('w-3.5 h-3.5', isLiveWeakest ? 'text-amber-400' : isLiveStrongest ? 'text-primary' : 'text-muted-foreground/60')} />
                      <span className="text-[10px] font-semibold text-muted-foreground">{PILLAR_SHORT[pillar.key]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {trend === 'up' && <TrendingUp className="w-3 h-3 text-primary" />}
                      {trend === 'down' && <TrendingDown className="w-3 h-3 text-destructive/70" />}
                      {trend === 'stable' && <Minus className="w-3 h-3 text-muted-foreground/30" />}
                      <ChevronDown className={cn('w-3 h-3 text-muted-foreground/40 transition-transform', isExpanded && 'rotate-180')} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className={cn('font-outfit text-xl font-bold', isLiveWeakest ? 'text-amber-400' : isLiveStrongest ? 'text-primary' : 'text-foreground')}>{displayScore}</span>
                    {lastScore != null && <span className="text-[9px] text-muted-foreground/40">vs {lastScore}</span>}
                    <span className={cn('text-[9px] font-medium ml-auto', displayScore >= 66 ? 'text-primary/70' : displayScore >= 33 ? 'text-amber-400/80' : 'text-destructive/70')}>
                      {statusText}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-secondary/40 overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all duration-700', barColor)} style={{ width: `${displayScore}%` }} />
                  </div>
                  {isLiveWeakest && (
                    <span className="text-[8px] font-semibold text-amber-400/80 uppercase tracking-wider mt-1.5 block">Engpass</span>
                  )}
                  {isLiveStrongest && !isLiveWeakest && (
                    <span className="text-[8px] font-semibold text-primary/70 uppercase tracking-wider mt-1.5 block">Trager</span>
                  )}
                </button>

                {isExpanded && (
                  <PillarCardExpanded
                    pillarKey={pillar.key as PillarKey}
                    displayScore={displayScore}
                    lastWeekScore={lastScore ?? null}
                    checkInHistory={checkInHistory}
                    scoreHistory={scoreHistory}
                    activityLog={activityLog}
                    nutritionLogs={nutritionLogs}
                    goalPlan={goalPlan}
                    onOpenPersonalization={(p) => setPersonalizationPillar(p)}
                    onOpenPillarDetail={(p) => onOpenPillar?.(p)}
                    onNavigateToPlans={() => navigate(`/app/my-plans?tab=${pillar.key}`)}
                  />
                )}
              </div>
            );
          })}
        </div>

        {weeklyPillarData && (
          <div className="rounded-xl border border-primary/15 p-3" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05), transparent)' }}>
            <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest mb-1">Hochste Prioritat diese Woche</p>
            <p className="text-xs font-semibold text-foreground leading-snug">
              {getWeeklyPriorityText(weeklyPillarData.weakestPillar, goal)}
            </p>
          </div>
        )}

        {!weeklyPillarData && (
          <div className="rounded-xl border border-border/20 p-3 flex items-center gap-3" style={{ background: 'var(--gradient-card)' }}>
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Starte mit dem taglichen Check-in, um echte Wochendaten zu sehen.
            </p>
          </div>
        )}
      </div>

      {/* ================================================================
          SECTION 5: ZIELBEREICH (compact macros)
          ================================================================ */}
      <div className="rounded-xl border border-border/20 p-3" style={{ background: 'var(--gradient-card)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Egg className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Zielbereich</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <MacroPill label={`${realism.calorieRange.min}\u2013${realism.calorieRange.max} kcal`} />
          <MacroPill label={`${realism.proteinTarget}g Protein`} accent />
          <MacroPill label={`${realism.fatTarget}g Fett`} />
          <MacroPill label={`${realism.carbRange.min}\u2013${realism.carbRange.max}g Carbs`} />
        </div>
      </div>

      {/* ================================================================
          SECTION 5b: WEEKLY EVALUATION
          ================================================================ */}
      {(weeklyEval.helped.length > 0 || weeklyEval.hurt.length > 0) && (
        <div className="rounded-2xl border border-border/20 p-4 space-y-3" style={{ background: 'var(--gradient-card)' }}>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">Wochenauswertung</span>
          </div>

          {weeklyEval.helped.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-bold text-primary/70 uppercase tracking-widest">Was hat geholfen</p>
              {weeklyEval.helped.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
                  <TrendingUp className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                  <p className="text-[11px] text-foreground leading-snug">{item}</p>
                </div>
              ))}
            </div>
          )}

          {weeklyEval.hurt.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-bold text-amber-400/80 uppercase tracking-widest">Was hat gebremst</p>
              {weeklyEval.hurt.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-400/5">
                  <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-foreground leading-snug">{item}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================
          SECTION 5c: NEXT WEEK FOCUS
          ================================================================ */}
      <div className="rounded-2xl border border-border/20 p-4 space-y-3" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.03), transparent)' }}>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-foreground">Fokus nachste Woche</span>
        </div>
        <div className="space-y-2">
          {nextWeekRecs.map((rec, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-primary">{i + 1}</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>


      {/* ================================================================
          FOOTER
          ================================================================ */}
      <button
        onClick={onReset}
        className="w-full text-center text-[10px] text-muted-foreground/60 py-2 active:text-muted-foreground transition-colors"
      >
        Ziel neu berechnen
      </button>

      <p className="text-[8px] text-muted-foreground/30 text-center">
        CALINESS Zielsystem -- Verhaltensbasiert -- kein medizinischer Rat
      </p>

      {/* Personalization Modal */}
      {personalizationPillar && (
        <PillarPersonalizationModal
          pillar={personalizationPillar}
          open={!!personalizationPillar}
          onClose={() => setPersonalizationPillar(null)}
          existingAnswers={personalizationData[`${personalizationPillar}Personalization`] as Record<string, string> | undefined}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════════════ */

function PlanPreviewCard({
  icon: Icon,
  label,
  pillarKey,
  hasData,
  onPersonalize,
  onCreatePlan,
  onCardClick,
  isPersonalized,
  children,
}: {
  icon: typeof Activity;
  label: string;
  pillarKey: string;
  hasData: boolean;
  onPersonalize: () => void;
  onCreatePlan: () => void;
  onCardClick?: () => void;
  isPersonalized: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      role={hasData && onCardClick ? 'button' : undefined}
      tabIndex={hasData && onCardClick ? 0 : undefined}
      onClick={hasData && onCardClick ? onCardClick : undefined}
      onKeyDown={hasData && onCardClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCardClick(); } } : undefined}
      className={cn(
        'rounded-xl border p-3 transition-all',
        hasData ? 'border-border/30 bg-card/60' : 'border-border/20 border-dashed',
        hasData && onCardClick && 'cursor-pointer hover:bg-white/5 active:scale-[0.99]',
      )}
      style={{ background: hasData ? undefined : 'var(--gradient-card)', minHeight: '44px' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', hasData ? 'bg-primary/10' : 'bg-secondary/20')}>
            <Icon className={cn('w-3.5 h-3.5', hasData ? 'text-primary' : 'text-muted-foreground/40')} />
          </div>
          <span className="text-xs font-semibold text-foreground">{label}</span>
          {isPersonalized && (
            <span className="text-[8px] text-primary/60 font-semibold bg-primary/8 px-1.5 py-0.5 rounded-full">Personalisiert</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {hasData ? (
            <button
              onClick={(e) => { e.stopPropagation(); onPersonalize(); }}
              className="flex items-center gap-1 text-[10px] text-primary font-semibold active:scale-95 transition-transform px-2 py-1 rounded-lg bg-primary/5 border border-primary/15"
              style={{ minHeight: '32px' }}
            >
              <Settings2 className="w-3 h-3" />
              Anpassen
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onCreatePlan(); }}
              className="flex items-center gap-1 text-[10px] text-primary font-semibold active:scale-95 transition-transform px-2 py-1 rounded-lg bg-primary/10 border border-primary/20"
              style={{ minHeight: '32px' }}
            >
              Plan erstellen
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          {hasData && onCardClick && (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
          )}
        </div>
      </div>

      {hasData && children ? (
        <div className="ml-8">{children}</div>
      ) : !hasData ? (
        <p className="text-[10px] text-muted-foreground/50 ml-8">Noch kein Plan -- personalisiere ihn jetzt</p>
      ) : null}
    </div>
  );
}

function MacroPill({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <div className={cn(
      'text-[11px] font-medium px-2.5 py-1.5 rounded-lg border text-center',
      accent ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-secondary/30 border-border/20 text-foreground',
    )}>
      {label}
    </div>
  );
}


