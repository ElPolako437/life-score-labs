import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import ScoreRing from '@/components/app/ScoreRing';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity, Apple, Moon, Brain, Sparkles, AlertTriangle,
  Trophy, Target, TrendingUp, TrendingDown, Lock, Crown,
  ArrowLeft, RefreshCw, Minus, CalendarDays, CheckCircle2,
  Mail, Heart, Eye, ChevronRight, Clock,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { calculatePillarScores } from '@/lib/scoring';
import { calculateBioAgeDelta, formatBioAgeDelta } from '@/lib/bioAge';
import { getWeeklyFocusPillar, recommendNextPillar, type PillarKey } from '@/lib/focusPillar';
import { computeWeeklyAggregation } from '@/lib/weeklyAggregation';
import { buildCompactWeeklyContext } from '@/lib/compactContext';
import { callAI, buildCacheKey, getCached, setCache } from '@/lib/aiWrapper';
import ShareCard from '@/components/app/ShareCard';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { ActivityLog } from '@/contexts/AppContext';

interface WeeklyReport {
  weekLabel: string;
  introSentence: string;
  coachObservations?: string[];
  scoreSummary: { avg: number; trend: number; bestDay: string; weakestDay: string; explanation: string };
  strongestPillar: { name: string; score: number; explanation: string };
  weakestPillar: { name: string; score: number; explanation: string };
  patterns: string[];
  bottleneck: string;
  weeklyWin: string;
  nextWeekFocus: string[];
  closingNote?: string;
  goalPlanReview?: { adherencePercent: number; planRealistic: string; missedPattern: string; adjustment: string } | null;
  nutritionReview?: { proteinConsistency: string; mealStructure: string; topPattern: string; nextWeekNutritionFocus: string } | null;
  comparison?: { scoreDiff: number; improvement: string; decline: string; consistencyChange: string } | null;
}

const PILLAR_META: { key: string; label: string; icon: React.ElementType }[] = [
  { key: 'bewegung', label: 'Bewegung', icon: Activity },
  { key: 'ernaehrung', label: 'Ernährung', icon: Apple },
  { key: 'regeneration', label: 'Recovery', icon: Moon },
  { key: 'mental', label: 'Mental', icon: Brain },
];

const PILLAR_ICONS: Record<string, React.ElementType> = {
  'Bewegung': Activity, 'Ernährung': Apple, 'Regeneration': Moon, 'Mentale Balance': Brain,
};

function getWeekKey() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const weekNum = Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
  return 'KW' + weekNum + '_' + now.getFullYear();
}

function getWeekDateRange(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return format(monday, 'd. MMM', { locale: de }) + ' – ' + format(sunday, 'd. MMM yyyy', { locale: de });
}

function getDayName(dateStr: string) {
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  return days[new Date(dateStr).getDay()];
}

function generateWeeklyInsight(
  weekActivityLog: ActivityLog[],
  avgScore: number,
  scoreTrend: number,
  focusPillar: string,
  pillarAvgs: Record<string, number>,
  proteinAvg: number,
  proteinTarget: number,
  avgSleep: number,
): string {
  const focusLabel = PILLAR_META.find(p => p.key === focusPillar)?.label || focusPillar;
  const focusScore = pillarAvgs[focusPillar] || 50;
  const totalActivities = weekActivityLog.length;
  const parts: string[] = [];

  // Focus pillar insight
  if (focusScore >= 65) {
    parts.push(`Dein Fokus auf ${focusLabel} hat sich ausgezahlt — Score bei ${Math.round(focusScore)}.`);
  } else {
    parts.push(`${focusLabel} war dein Fokus, aber bei ${Math.round(focusScore)} ist noch Luft.`);
  }

  // Protein insight
  if (proteinAvg > 0) {
    const pct = Math.round((proteinAvg / proteinTarget) * 100);
    if (pct >= 90) parts.push(`Protein bei ${Math.round(proteinAvg)}g/Tag — stark.`);
    else if (pct >= 60) parts.push(`Protein-Durchschnitt ${Math.round(proteinAvg)}g — noch ${Math.round(proteinTarget - proteinAvg)}g fehlen zum Ziel.`);
  }

  // Sleep insight
  if (avgSleep > 0) {
    if (avgSleep < 6.5) parts.push(`Schlaf-Durchschnitt nur ${avgSleep.toFixed(1)}h — dein Engpass.`);
    else if (avgSleep >= 7.5) parts.push(`Schlaf stabil bei ${avgSleep.toFixed(1)}h — gute Basis.`);
  }

  // Activity volume
  if (totalActivities >= 15) parts.push(`${totalActivities} Aktivitäten geloggt — beeindruckende Konsistenz.`);
  else if (totalActivities < 5) parts.push('Wenig getrackt — nächste Woche mehr loggen für bessere Insights.');

  // Trend
  if (scoreTrend > 3) parts.push('Tendenz steigend — bleib dran!');
  else if (scoreTrend < -3) parts.push('Nächste Woche setzen wir den Turnaround.');

  return parts.slice(0, 4).join(' ');
}

export default function AppWeeklyReport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    isPremium, checkInHistory, scoreHistory, trainingLogs, wearableEntries, coachMemory,
    profile, protocolProgress, goalPlan, nutritionTargets, nutritionLogs, nutritionPatterns: savedPatterns,
    streak, weeklyConsistency, pillarScores, activityLog,
    weightEntries, badges, habitHistory,
  } = useApp();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const weekKey = getWeekKey();
  const last7CheckIns = checkInHistory.slice(-7);
  const prev7CheckIns = checkInHistory.slice(-14, -7);
  const last7Scores = scoreHistory.slice(-7);
  const prev7Scores = scoreHistory.slice(-14, -7);

  // Compute weekly aggregation (single source of truth for UI + AI)
  const weekAgg = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const wkActivity = activityLog.filter(l => new Date(l.date) >= weekAgo);
    const wkNutrition = nutritionLogs.filter(l => new Date(l.date) >= weekAgo);
    const wkWeight = weightEntries.filter(e => new Date(e.date) >= weekAgo);
    const wkHabitHistory = habitHistory.filter(h => new Date(h.date) >= weekAgo);
    return computeWeeklyAggregation(
      last7CheckIns, prev7CheckIns,
      last7Scores, prev7Scores,
      wkActivity, wkNutrition, wkWeight,
      badges, wkHabitHistory,
      nutritionTargets?.proteinTarget ?? 130,
    );
  }, [last7CheckIns, prev7CheckIns, last7Scores, prev7Scores, activityLog, nutritionLogs,
      weightEntries, badges, habitHistory, nutritionTargets]);

  const chartData = last7Scores.map(s => ({
    day: getDayName(s.date),
    score: Math.round(s.score),
  }));

  // Progressive pillar data
  const activePillars = useMemo(() => {
    if (!goalPlan?.activePillars || goalPlan.activePillars.length === 0) {
      return ['bewegung', 'ernaehrung', 'regeneration', 'mental'];
    }
    return goalPlan.activePillars as string[];
  }, [goalPlan?.activePillars]);

  const inactivePillars = useMemo(() => {
    const all = ['bewegung', 'ernaehrung', 'regeneration', 'mental'];
    return all.filter(p => !activePillars.includes(p));
  }, [activePillars]);

  const hasProgressiveSystem = goalPlan?.activePillars && goalPlan.activePillars.length > 0 && goalPlan.activePillars.length < 4;

  // Week's activity log
  const weekActivityLog = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return activityLog.filter(l => new Date(l.date) >= weekAgo);
  }, [activityLog]);

  // Pillar stats — sourced from weekAgg (single source of truth)
  const pillarStats = useMemo(() => {
    const stats: Record<string, { count: number; totalMinutes: number; avgScore: number }> = {};
    for (const p of PILLAR_META) {
      const logs = weekActivityLog.filter(l => l.pillar === p.key);
      stats[p.key] = {
        count: logs.length,
        totalMinutes: logs.reduce((s, l) => s + (l.duration || 0), 0),
        avgScore: weekAgg.pillarAvgs[p.key as keyof typeof weekAgg.pillarAvgs] ?? 50,
      };
    }
    return stats;
  }, [weekActivityLog, weekAgg]);

  // Focus pillar
  const focusResult = useMemo(() => getWeeklyFocusPillar(pillarScores, goalPlan), [pillarScores, goalPlan]);

  // CALI summary (template-based)
  const caliSummary = useMemo(() => {
    const avgScore = last7Scores.length > 0 ? Math.round(last7Scores.reduce((s, e) => s + e.score, 0) / last7Scores.length) : 50;
    const trend = last7Scores.length >= 2 ? last7Scores[last7Scores.length - 1].score - last7Scores[0].score : 0;
    const proteinAvg = (() => {
      const weekLogs = nutritionLogs.filter(l => { const d = new Date(l.date); const ago = new Date(); ago.setDate(ago.getDate() - 7); return d >= ago; });
      if (weekLogs.length === 0) return 0;
      return weekLogs.reduce((s, l) => s + l.estimatedProteinTotal, 0) / Math.min(7, weekLogs.length);
    })();
    const avgSleep = last7CheckIns.length > 0 ? last7CheckIns.reduce((s, c) => s + c.sleepHours, 0) / last7CheckIns.length : 0;
    const pillarAvgs: Record<string, number> = {};
    for (const p of PILLAR_META) pillarAvgs[p.key] = pillarStats[p.key]?.avgScore || 50;
    return generateWeeklyInsight(weekActivityLog, avgScore, trend, focusResult.focusPillar, pillarAvgs, proteinAvg, nutritionTargets?.proteinTarget || 130, avgSleep);
  }, [last7Scores, last7CheckIns, weekActivityLog, focusResult, pillarStats, nutritionLogs, nutritionTargets]);

  // Next week focus
  const nextWeekFocus = useMemo(() => getWeeklyFocusPillar(pillarScores, goalPlan), [pillarScores, goalPlan]);

  const cacheReport = useCallback(async (reportData: WeeklyReport) => {
    if (!user?.id) return;
    try {
      await (supabase as any).from('weekly_reports').upsert({
        user_id: user.id, week_key: weekKey, report_json: reportData, generated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,week_key' });
    } catch (e) { console.error('Failed to cache report:', e); }
  }, [user?.id, weekKey]);

  const loadCachedReport = useCallback(async (): Promise<WeeklyReport | null> => {
    if (!user?.id) return null;
    try {
      const { data } = await (supabase as any)
        .from('weekly_reports').select('report_json')
        .eq('user_id', user.id).eq('week_key', weekKey).maybeSingle();
      if (data?.report_json) return data.report_json as WeeklyReport;
    } catch (e) { console.error('Failed to load cached report:', e); }
    return null;
  }, [user?.id, weekKey]);

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError('');

    // Build compact context (dramatically reduces token usage)
    const compactCtx = buildCompactWeeklyContext(weekAgg, {
      goalType: goalPlan?.goalType,
      userName: profile.name,
      userAge: profile.age,
      userGoals: profile.goals,
      streak,
    });

    // Build the userContext for the edge function — use compact context + weeklyAggregation
    const userContext = {
      name: profile.name, age: profile.age, goals: profile.goals, activityLevel: profile.activityLevel,
      weeklyAggregation: weekAgg,
      compactContext: compactCtx,
      goalPlan: goalPlan ? {
        goalType: goalPlan.goalType, goalDescription: goalPlan.goalDescription,
        targetDate: goalPlan.targetDate, weeklyFocus: goalPlan.weeklyPlan?.focusPillar,
        activePillars: activePillars,
        adherence: (() => {
          if (!goalPlan.weeklyPlan?.weeklyBlocks) return 0;
          const total = goalPlan.weeklyPlan.weeklyBlocks.reduce((s: number, d: any) => s + d.blocks.length, 0);
          const done = goalPlan.weeklyPlan.weeklyBlocks.reduce((s: number, d: any) => s + d.blocks.filter((b: any) => b.completed).length, 0);
          return total > 0 ? Math.round((done / total) * 100) : 0;
        })(),
        totalBlocks: goalPlan.weeklyPlan?.weeklyBlocks?.reduce((s: number, d: any) => s + d.blocks.length, 0) || 0,
        completedBlocks: goalPlan.weeklyPlan?.weeklyBlocks?.reduce((s: number, d: any) => s + d.blocks.filter((b: any) => b.completed).length, 0) || 0,
      } : null,
      nutritionData: nutritionTargets ? {
        proteinTarget: nutritionTargets.proteinTarget,
        avgDailyProtein: weekAgg.avgProtein,
        mealLogDays: weekAgg.mealLogDays,
        totalMealsLogged: weekAgg.totalMealsLogged,
        proteinAdherenceDays: weekAgg.proteinAdherenceDays,
        nutritionContext: weekAgg.nutritionContext,
      } : null,
      streakDays: streak,
    };

    try {
      const reportJson = await callAI(
        'weekly_report',
        { weekKey, compactCtx },
        async () => {
          const { data, error: fnError } = await supabase.functions.invoke('weekly-report', { body: { userContext } });
          if (fnError) throw new Error(fnError.message);
          if (data?.error) throw new Error(data.error);
          if (!data?.report) throw new Error('Kein Report erhalten');
          return JSON.stringify(data.report);
        },
        { ttl: 24 * 60 * 60 * 1000 },
      );
      const parsedReport = JSON.parse(reportJson);
      if (typeof parsedReport?.scoreSummary?.avg !== 'number') throw new Error('Ungültiger Report (fehlende scoreSummary)');
      parsedReport.scoreSummary.trend = Number(parsedReport.scoreSummary.trend) || 0;
      setReport(parsedReport);
      cacheReport(parsedReport);
    } catch (e) {
      console.error('Report generation failed:', e);
      setError(e instanceof Error ? e.message : 'Report konnte nicht generiert werden.');
    } finally {
      setLoading(false);
    }
  }, [profile, weekKey, goalPlan, nutritionTargets, cacheReport, weekAgg, streak, activePillars]);

  // Track whether we've already attempted generation this mount to avoid re-fire loops
  const hasInitRef = useRef<string | null>(null);
  const generateReportRef = useRef(generateReport);
  generateReportRef.current = generateReport;
  const loadCachedReportRef = useRef(loadCachedReport);
  loadCachedReportRef.current = loadCachedReport;

  useEffect(() => {
    if (hasInitRef.current === weekKey) return;
    hasInitRef.current = weekKey;
    const init = async () => {
      const cached = await loadCachedReportRef.current();
      if (cached) { setReport(cached); return; }
      const lsCached = localStorage.getItem('caliness_weekly_report_' + weekKey);
      if (lsCached) { try { setReport(JSON.parse(lsCached)); return; } catch { /* ignore */ } }
      generateReportRef.current();
    };
    init();
  }, [weekKey]);

  // Group activity log by day (before any early returns to satisfy hooks rules)
  const activityByDay = useMemo(() => {
    const grouped: Record<string, ActivityLog[]> = {};
    weekActivityLog.forEach(l => {
      if (!grouped[l.date]) grouped[l.date] = [];
      grouped[l.date].push(l);
    });
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  }, [weekActivityLog]);

  const TrendIcon = report?.scoreSummary?.trend
    ? (report.scoreSummary.trend > 0 ? TrendingUp : report.scoreSummary.trend < 0 ? TrendingDown : Minus)
    : Minus;
  const trendColor = report?.scoreSummary?.trend
    ? (report.scoreSummary.trend > 0 ? 'text-primary' : report.scoreSummary.trend < 0 ? 'text-destructive' : 'text-muted-foreground')
    : 'text-muted-foreground';

  // ═══ FREE USER TEASER ═══
  if (!isPremium && report) {
    const StrongIcon = PILLAR_ICONS[report.strongestPillar.name] || Activity;
    return (
      <div className="px-5 pt-8 pb-24 space-y-6 animate-enter">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <img src="/images/caliness-logo-white.png" alt="" className="w-6 h-6 object-contain" />
            <span className="text-xs font-semibold text-foreground tracking-wider">CALINESS</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Wochenbericht · {report.weekLabel}</span>
        </div>
        <div className="h-px bg-border/30 mb-4" />
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="font-outfit text-2xl font-bold text-foreground">Deine Woche, {profile.name || 'du'}.</h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed italic">„{report.introSentence}"</p>
        <div className="card-elegant rounded-2xl p-6 space-y-3">
          <span className="text-xs font-medium text-primary tracking-wider uppercase">Wochen-Score</span>
          <div className="flex items-center gap-6">
            <ScoreRing score={report.scoreSummary.avg} size={90} strokeWidth={7} label="Ø Score" />
            <div className="flex-1">{chartData.length > 1 && (
              <div className="h-16 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
            )}</div>
          </div>
        </div>
        <div className="relative rounded-2xl overflow-hidden">
          <div className="space-y-4 blur-[6px] select-none pointer-events-none">
            <div className="card-elegant p-5 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">Coach-Analyse, Muster, Aktivitäts-Timeline...</p>
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/40 backdrop-blur-sm">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
              <img src="/images/caliness-logo-white.png" alt="" className="w-8 h-8 object-contain" />
            </div>
            <div className="text-center space-y-1 px-8">
              <p className="font-outfit text-lg font-bold text-foreground">Mit Premium den vollen Bericht lesen</p>
              <p className="text-xs text-muted-foreground">Coach-Beobachtungen, Aktivitäts-Timeline, Fokus-Analyse und Vorwoche-Vergleich.</p>
            </div>
            <Button variant="premium" size="lg" onClick={() => navigate('/app/profile')}>Premium freischalten</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isPremium && !report) {
    return (
      <div className="px-5 pt-8 pb-24 space-y-6 animate-enter">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="font-outfit text-2xl font-bold text-foreground">Dein Wochenbrief</h1>
            <p className="text-xs text-muted-foreground">{getWeekDateRange()}</p>
          </div>
        </div>
        <div className="text-center py-12 space-y-3">
          <p className="text-sm text-muted-foreground">Dein Wochenbrief wird erstellt...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-5 pt-8 pb-24 space-y-6 animate-enter">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div><Skeleton className="h-6 w-48 mb-1" /><Skeleton className="h-4 w-64" /></div>
        </div>
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="flex items-center justify-center gap-2 pt-4">
          <RefreshCw className="w-4 h-4 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">Dein Coach schreibt deinen Wochenbrief…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 pt-8 pb-24 space-y-6 animate-enter">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="font-outfit text-2xl font-bold text-foreground">Wochenbrief</h1>
        </div>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-5 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={generateReport}>Erneut versuchen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  if (!report) return null;

  const StrongIcon = PILLAR_ICONS[report.strongestPillar.name] || Activity;
  const WeakIcon = PILLAR_ICONS[report.weakestPillar.name] || Brain;
  const FocusPillarMeta = PILLAR_META.find(p => p.key === focusResult.focusPillar);
  const FocusIcon = FocusPillarMeta?.icon || Activity;

  return (
    <div className="px-5 pt-8 pb-24 space-y-6 animate-enter">

      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <img src="/images/caliness-logo-white.png" alt="" className="w-6 h-6 object-contain" />
          <span className="text-xs font-semibold text-foreground tracking-wider">CALINESS</span>
        </div>
        <span className="text-[10px] text-muted-foreground">Wochenbericht · {report.weekLabel}</span>
      </div>
      <div className="h-px bg-border/30 mb-4" />

      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={generateReport} className="text-xs text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5 mr-1" />Aktualisieren
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="font-outfit text-3xl font-bold text-foreground leading-tight">
          Deine Woche, {profile.name || 'du'}.
        </h1>
        <p className="text-xs text-muted-foreground/60">{getWeekDateRange()}</p>
      </div>

      {/* ═══ SCORE STORY ═══ */}
      <div className="card-elegant rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">Score-Verlauf</span>
          </div>
          <div className={'flex items-center gap-1 ' + trendColor}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-xs font-semibold">
              {report.scoreSummary.trend > 0 ? '+' : ''}{report.scoreSummary.trend} zur Vorwoche
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <ScoreRing score={report.scoreSummary.avg} size={110} strokeWidth={9} label="Ø Score" />
          <div className="flex-1 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Bester Tag</span>
              <span className="font-medium text-primary">{report.scoreSummary.bestDay}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Schwächster Tag</span>
              <span className="font-medium text-foreground">{report.scoreSummary.weakestDay}</span>
            </div>
          </div>
        </div>
        {chartData.length > 1 && (
          <div className="h-20 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--primary))', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {isPremium && (() => {
          const delta = calculateBioAgeDelta(report.scoreSummary.avg, streak, weeklyConsistency, pillarScores as any, checkInHistory.length);
          const display = formatBioAgeDelta(delta);
          return (
            <div className="flex items-center gap-2 pt-1">
              <span className={cn('text-xs font-semibold', display.isPositive ? 'text-primary' : 'text-amber-400')}>{display.text}</span>
              <span className="text-[8px] text-muted-foreground/60">· Verhaltensbasierte Schätzung</span>
            </div>
          );
        })()}
      </div>

      {/* ═══ CALI SUMMARY ═══ */}
      <div className="card-elegant rounded-2xl p-5 border-l-4 border-l-primary space-y-2">
        <div className="flex items-center gap-2">
          <img src="/images/caliness-logo-white.png" alt="" className="w-5 h-5 object-contain" />
          <span className="text-sm font-semibold text-foreground">CALI's Wochenanalyse</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{caliSummary}</p>
      </div>

      {/* ═══ ACTIVE PILLAR CARDS ═══ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">Säulen-Übersicht</span>
          {hasProgressiveSystem && (
            <span className="text-[10px] text-primary font-semibold">{activePillars.length}/4 aktiv</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PILLAR_META.filter(p => activePillars.includes(p.key)).map(p => {
            const stat = pillarStats[p.key];
            const Icon = p.icon;
            const trend = stat.avgScore >= 60 ? 'text-primary' : stat.avgScore >= 40 ? 'text-amber-400' : 'text-destructive';
            return (
              <div key={p.key} className="card-elegant rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">{p.label}</span>
                </div>
                <p className={cn('font-outfit text-xl font-bold', trend)}>{stat.avgScore}</p>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{stat.count} Aktivitäten</span>
                  <span>{stat.totalMinutes} Min</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Inactive pillars as small pills */}
        {inactivePillars.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {inactivePillars.map(key => {
              const meta = PILLAR_META.find(p => p.key === key);
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <div key={key} className="flex items-center gap-1 rounded-full border border-border/20 px-2.5 py-1 opacity-40" style={{ borderStyle: 'dashed' }}>
                  <Icon className="w-2.5 h-2.5 text-muted-foreground/50" />
                  <span className="text-[9px] text-muted-foreground/60">{meta.label}</span>
                  <Lock className="w-2 h-2 text-muted-foreground/30" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ FOCUS PILLAR HIGHLIGHT ═══ */}
      <div className="rounded-2xl border border-primary/25 p-5 space-y-3" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.02))' }}>
        <div className="flex items-center gap-2">
          <FocusIcon className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Fokus-Säule: {FocusPillarMeta?.label}</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{focusResult.reason}</p>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="font-outfit text-lg font-bold text-foreground">{pillarStats[focusResult.focusPillar]?.count || 0}</p>
            <p className="text-[9px] text-muted-foreground">Aktivitäten</p>
          </div>
          <div className="text-center">
            <p className="font-outfit text-lg font-bold text-foreground">{pillarStats[focusResult.focusPillar]?.avgScore || '?'}</p>
            <p className="text-[9px] text-muted-foreground">Ø Score</p>
          </div>
        </div>
      </div>

      {/* ═══ COACH OBSERVATIONS ═══ */}
      {report.coachObservations && report.coachObservations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Coach-Beobachtungen</span>
          </div>
          <div className="space-y-3 pl-1">
            {report.coachObservations.map((obs, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed italic">„{obs}"</p>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Win */}
      <div className="card-elegant rounded-2xl p-5 space-y-2 border-l-4 border-l-primary">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Dein Wochensieg</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{report.weeklyWin}</p>
      </div>

      {/* ═══ ACTIVITY TIMELINE ═══ */}
      {activityByDay.length > 0 && (
        <div className="space-y-3">
          <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">Aktivitäts-Timeline</span>
          <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
            {activityByDay.map(([date, logs]) => (
              <div key={date} className="space-y-1">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                  {getDayName(date)} · {format(new Date(date), 'd. MMM', { locale: de })}
                </p>
                {logs.map((log, i) => {
                  const PillarIcon = PILLAR_META.find(p => p.key === log.pillar)?.icon || Activity;
                  return (
                    <div key={i} className="flex items-center gap-2 py-1 pl-2 border-l-2 border-primary/15">
                      <PillarIcon className="w-3 h-3 text-primary shrink-0" />
                      <span className="text-xs text-foreground flex-1 truncate">{log.label}</span>
                      {log.duration && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />{log.duration}m
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground/50">
                        {log.timestamp ? format(new Date(log.timestamp), 'HH:mm') : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Week Focus */}
      <div className="space-y-3 pl-1">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Nächste Woche: Fokus {PILLAR_META.find(p => p.key === nextWeekFocus.focusPillar)?.label}</span>
        </div>
        <p className="text-xs text-muted-foreground">{nextWeekFocus.reason}</p>
        <p className="text-xs text-muted-foreground italic">„{nextWeekFocus.caliAnnouncement}"</p>

        {/* Pillar unlock recommendation */}
        {hasProgressiveSystem && inactivePillars.length > 0 && goalPlan?.goalType && (() => {
          const rec = recommendNextPillar(
            activePillars as PillarKey[],
            pillarScores as any,
            goalPlan.goalType,
            activityLog,
          );
          const recMeta = PILLAR_META.find(p => p.key === rec.recommended);
          return (
            <div className="rounded-xl border border-primary/20 p-3 mt-2 space-y-1" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--primary) / 0.02))' }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  {recMeta?.label} aktivieren?
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{rec.reason}</p>
            </div>
          );
        })()}
      </div>

      {/* Patterns */}
      {report.patterns.length > 0 && (
        <div className="space-y-2 pl-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Erkannte Muster</span>
          </div>
          {report.patterns.map((pattern, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">{pattern}</p>
            </div>
          ))}
        </div>
      )}

      {/* Closing */}
      {report.closingNote && (
        <div className="card-elegant rounded-2xl p-5 border-l-4 border-l-muted-foreground/30">
          <p className="text-sm text-muted-foreground leading-relaxed italic">Eine letzte Sache: {report.closingNote}</p>
        </div>
      )}

      {/* ═══ CONSISTENCY MAP ═══ */}
      {last7CheckIns.length > 0 && (() => {
        const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        return (
          <div className="space-y-3">
            <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">Konsistenz-Karte</span>
            <div className="card-elegant rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-7 gap-1 text-center">
                {days.map((d, i) => {
                  const date = new Date(monday);
                  date.setDate(monday.getDate() + i);
                  const dateStr = date.toISOString().split('T')[0];
                  const score = last7Scores.find(s => s.date === dateStr)?.score;
                  const hasCheckIn = last7CheckIns.some(c => c.date === dateStr);
                  const hasActivity = weekActivityLog.some(l => l.date === dateStr);
                  const dot = !hasCheckIn && !hasActivity
                    ? 'bg-secondary/30 text-muted-foreground/30'
                    : score !== undefined && score >= 60
                    ? 'bg-primary/20 text-primary'
                    : 'bg-amber-500/20 text-amber-400';
                  return (
                    <div key={d} className="flex flex-col items-center gap-1">
                      <span className="text-[9px] text-muted-foreground/60">{d}</span>
                      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold', dot)}>
                        {score !== undefined ? Math.round(score) : hasActivity ? '·' : '–'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 justify-center text-[9px] text-muted-foreground/60">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/20 inline-block" />Score ≥ 60</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500/20 inline-block" />Score &lt; 60</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-secondary/30 inline-block" />Kein Check-in</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ GOAL PLAN REVIEW ═══ */}
      {report.goalPlanReview && (
        <div className="card-elegant rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Zielplan-Analyse</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-secondary/20 p-3">
              <p className="font-outfit text-xl font-bold text-primary">{report.goalPlanReview.adherencePercent}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Umsetzung</p>
            </div>
            <div className="rounded-xl bg-secondary/20 p-3">
              <p className="font-outfit text-sm font-semibold text-foreground leading-tight">{report.goalPlanReview.planRealistic}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Plan-Realismus</p>
            </div>
          </div>
          {report.goalPlanReview.missedPattern && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Muster: </span>{report.goalPlanReview.missedPattern}
            </p>
          )}
          {report.goalPlanReview.adjustment && (
            <p className="text-xs text-primary leading-relaxed">
              <span className="font-medium">Anpassung: </span>{report.goalPlanReview.adjustment}
            </p>
          )}
        </div>
      )}

      {/* ═══ NUTRITION REVIEW ═══ */}
      {report.nutritionReview && (
        <div className="card-elegant rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Apple className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Ernährungs-Review</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-0.5">Protein-Konsistenz</p>
              <p>{report.nutritionReview.proteinConsistency}</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-0.5">Mahlzeit-Struktur</p>
              <p>{report.nutritionReview.mealStructure}</p>
            </div>
          </div>
          {/* Extended nutrition metrics */}
          {weekAgg.totalMealsLogged > 0 && (
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border/20 pt-2">
              <span>{weekAgg.totalMealsLogged} Mahlzeiten</span>
              {weekAgg.swappedMeals > 0 && <span>{weekAgg.swappedMeals} getauscht</span>}
              <span>{weekAgg.uniqueMealCount} verschiedene</span>
            </div>
          )}
          {report.nutritionReview.topPattern && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Top-Muster: </span>{report.nutritionReview.topPattern}
            </p>
          )}
          {report.nutritionReview.nextWeekNutritionFocus && (
            <p className="text-xs text-primary">
              <span className="font-medium">Naechste Woche: </span>{report.nutritionReview.nextWeekNutritionFocus}
            </p>
          )}
        </div>
      )}

      {/* ═══ VORWOCHE VERGLEICH ═══ */}
      {report.comparison && (
        <div className="card-elegant rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Vorwoche-Vergleich</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn('flex items-center gap-1 text-sm font-bold font-outfit',
              report.comparison.scoreDiff > 0 ? 'text-primary' : report.comparison.scoreDiff < 0 ? 'text-destructive' : 'text-muted-foreground')}>
              {report.comparison.scoreDiff > 0 ? <TrendingUp className="w-4 h-4" /> : report.comparison.scoreDiff < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              {report.comparison.scoreDiff > 0 ? '+' : ''}{report.comparison.scoreDiff} Punkte
            </div>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {report.comparison.improvement && (
              <p><span className="text-primary font-medium">↑ </span>{report.comparison.improvement}</p>
            )}
            {report.comparison.decline && (
              <p><span className="text-amber-400 font-medium">↓ </span>{report.comparison.decline}</p>
            )}
            {report.comparison.consistencyChange && (
              <p className="pt-1 italic">{report.comparison.consistencyChange}</p>
            )}
          </div>
        </div>
      )}

      {/* ═══ WEIGHT TREND ═══ */}
      {weekAgg.weightDelta !== null && (
        <div className="card-elegant rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Körpergewicht diese Woche</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="font-outfit text-lg font-bold text-foreground">{weekAgg.weightStart?.toFixed(1)} kg</p>
              <p className="text-[9px] text-muted-foreground">Start</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <span className={cn('font-outfit text-xl font-bold', weekAgg.weightDelta < 0 ? 'text-primary' : weekAgg.weightDelta > 0 ? 'text-amber-400' : 'text-muted-foreground')}>
                {weekAgg.weightDelta > 0 ? '+' : ''}{weekAgg.weightDelta?.toFixed(1)} kg
              </span>
            </div>
            <div className="text-center">
              <p className="font-outfit text-lg font-bold text-foreground">{weekAgg.weightEnd?.toFixed(1)} kg</p>
              <p className="text-[9px] text-muted-foreground">Ende</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ NEUE BADGES ═══ */}
      {weekAgg.newBadgesThisWeek.length > 0 && (
        <div className="card-elegant rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Diese Woche freigeschaltet</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {weekAgg.newBadgesThisWeek.map((b, i) => (
              <span key={i} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary font-medium">{b}</span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ FOOTER ═══ */}
      <div className="h-px bg-border/20 mt-6 mb-4" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 opacity-30">
          <img src="/images/caliness-logo-white.png" alt="" className="w-4 h-4 object-contain" />
          <span className="text-[9px] text-muted-foreground tracking-wider">CALINESS · Longevity Intelligence</span>
        </div>
        <ShareCard score={report.scoreSummary.avg} streak={streak} weekLabel={report.weekLabel} name={profile.name || 'du'} />
      </div>
    </div>
  );
}
