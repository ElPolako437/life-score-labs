import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Tooltip } from 'recharts';
import { Flame, Trophy, TrendingUp, Dumbbell, Scale, ClipboardCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { calculatePillarScores } from '@/lib/scoring';
import { cn } from '@/lib/utils';

const PILLAR_LABELS: Record<string, string> = {
  bewegung: 'Bewegung', ernaehrung: 'Ernährung', regeneration: 'Regeneration', mental: 'Mentale Balance',
};

function useProgressSummary(scoreHistory: any[], checkInHistory: any[], goalPlan: any, activityLog: any[], nutritionLogs: any[], nutritionTargets: any) {
  return useMemo(() => {
    // Trend: compare avg of first half vs second half of last 14 days
    const recent = scoreHistory.slice(-14);
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendSentence = 'Dein Score ist diese Woche stabil geblieben.';
    if (recent.length >= 4) {
      const mid = Math.floor(recent.length / 2);
      const firstHalf = recent.slice(0, mid).reduce((s: number, e: any) => s + e.score, 0) / mid;
      const secondHalf = recent.slice(mid).reduce((s: number, e: any) => s + e.score, 0) / (recent.length - mid);
      const diff = secondHalf - firstHalf;
      if (diff >= 3) { trend = 'up'; trendSentence = `Dein Score ist in den letzten Tagen um ~${Math.round(diff)} Punkte gestiegen.`; }
      else if (diff <= -3) { trend = 'down'; trendSentence = `Dein Score ist in den letzten Tagen um ~${Math.round(Math.abs(diff))} Punkte gefallen.`; }
    }

    // Most consistently weak pillar over last 7 days
    let weakPillarSentence: string | null = null;
    const last7 = checkInHistory.slice(-7);
    if (last7.length >= 3) {
      const counts: Record<string, number> = { bewegung: 0, ernaehrung: 0, regeneration: 0, mental: 0 };
      last7.forEach((ci: any) => {
        const dayActivity = activityLog.filter((l: any) => l.date === ci.date);
        const dayNutrition = nutritionLogs.filter((l: any) => l.date === ci.date);
        const p = calculatePillarScores(ci, dayNutrition.length > 0 ? dayNutrition : undefined, nutritionTargets ?? undefined, dayActivity.length > 0 ? dayActivity : undefined);
        const w = Object.entries(p).sort((a, b) => a[1] - b[1])[0][0];
        if (counts[w] !== undefined) counts[w]++;
      });
      const [top, freq] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (freq >= 2) {
        weakPillarSentence = `${PILLAR_LABELS[top]} war die letzten ${freq} Tage dein schwächster Bereich.`;
      }
    }

    // Best pillar this week
    let strongPillarSentence: string | null = null;
    if (last7.length >= 3) {
      const totals: Record<string, number> = { bewegung: 0, ernaehrung: 0, regeneration: 0, mental: 0 };
      last7.forEach((ci: any) => {
        const dayActivity = activityLog.filter((l: any) => l.date === ci.date);
        const dayNutrition = nutritionLogs.filter((l: any) => l.date === ci.date);
        const p = calculatePillarScores(ci, dayNutrition.length > 0 ? dayNutrition : undefined, nutritionTargets ?? undefined, dayActivity.length > 0 ? dayActivity : undefined);
        Object.entries(p).forEach(([k, v]) => { totals[k] = (totals[k] || 0) + (v as number); });
      });
      const [best] = Object.entries(totals).sort((a, b) => b[1] - a[1]);
      strongPillarSentence = `Dein stärkster Bereich diese Woche: ${PILLAR_LABELS[best[0]]}.`;
    }

    // Goal reference
    let goalSentence: string | null = null;
    if (goalPlan?.goalDescription && recent.length >= 2) {
      const latest = recent[recent.length - 1]?.score ?? 0;
      goalSentence = latest >= 65
        ? `Dein Score unterstützt dein Ziel "${goalPlan.goalDescription}" — bleib konsistent.`
        : `Noch Potenzial für "${goalPlan.goalDescription}" — dein nächster Hebel liegt im Fokusbereich.`;
    }

    return { trend, trendSentence, weakPillarSentence, strongPillarSentence, goalSentence };
  }, [scoreHistory, checkInHistory, goalPlan, activityLog, nutritionLogs, nutritionTargets]);
}

export default function AppProgress() {
  const { scoreHistory, streak, weeklyConsistency, checkInHistory, weightEntries, trainingLogs, goalPlan, activityLog, nutritionLogs, nutritionTargets } = useApp();
  const navigate = useNavigate();
  const summary = useProgressSummary(scoreHistory, checkInHistory, goalPlan, activityLog, nutritionLogs, nutritionTargets);

  const scoreData = scoreHistory.slice(-14).map(e => ({
    date: e.date.slice(5),
    score: e.score,
  }));

  const pillarData = scoreHistory.slice(-14).map(e => ({
    date: e.date.slice(5),
    ...e.pillars,
  }));

  const sleepData = checkInHistory.slice(-14).map(c => ({
    date: c.date.slice(5),
    stunden: Math.round(c.sleepHours * 10) / 10,
    qualität: c.sleepQuality,
  }));

  const stressData = checkInHistory.slice(-14).map(c => ({
    date: c.date.slice(5),
    stress: c.stress,
    energie: c.energy,
  }));

  const weightData = weightEntries.slice(-14).map(w => ({
    date: w.date.slice(5),
    gewicht: Math.round(w.weight * 10) / 10,
  }));

  // Training frequency per week (last 4 weeks)
  const trainingFreqData = (() => {
    const weeks: { label: string; count: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const count = trainingLogs.filter(l => {
        const d = new Date(l.date);
        return d >= start && d < end;
      }).length;
      weeks.push({ label: `W${4 - i}`, count });
    }
    return weeks;
  })();

  const habitDays = checkInHistory.slice(-7);
  const trainingDays = habitDays.filter(c => c.training).length;
  const noAlcoholDays = habitDays.filter(c => !c.alcohol).length;

  const tooltipStyle = { background: 'hsl(220 16% 9%)', border: '1px solid hsl(220 14% 18%)', borderRadius: 12, fontSize: 12 };

  if (checkInHistory.length === 0) {
    return (
      <div className="px-5 pt-8 pb-4 space-y-6 animate-enter flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="font-outfit text-lg font-bold text-foreground mb-2">Noch keine Daten</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Mach deinen ersten Check-in, um deinen Fortschritt hier zu sehen.
          </p>
        </div>
        <Button className="glow-neon" onClick={() => navigate('/app/checkin')}>
          <ClipboardCheck className="w-4 h-4 mr-2" />Ersten Check-in starten
        </Button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-8 pb-4 space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <h1 className="font-outfit text-2xl font-bold text-foreground">Fortschritt</h1>
        <button
          onClick={() => navigate('/app/weekly-report')}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 active:scale-95 transition-transform"
        >
          <Trophy className="w-3 h-3" />
          Wochenbericht
        </button>
      </div>

      {/* Interpretation card */}
      <div
        className="rounded-2xl border border-primary/15 p-4 space-y-2 cursor-pointer active:scale-[0.99] transition-transform"
        style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--primary) / 0.02))' }}
        onClick={() => navigate('/app/coach')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[9px] font-bold text-primary/70 uppercase tracking-widest">CALI Analyse</span>
          </div>
          <span className={cn(
            'text-[9px] font-semibold px-2 py-0.5 rounded-full border',
            summary.trend === 'up' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
            summary.trend === 'down' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            'bg-primary/10 text-primary border-primary/20'
          )}>
            {summary.trend === 'up' ? '↑ steigt' : summary.trend === 'down' ? '↓ fällt' : '→ stabil'}
          </span>
        </div>
        <p className="text-xs text-foreground font-medium leading-relaxed">{summary.trendSentence}</p>
        {summary.weakPillarSentence && (
          <p className="text-xs text-amber-400/80">{summary.weakPillarSentence}</p>
        )}
        {summary.strongPillarSentence && (
          <p className="text-xs text-primary/70">{summary.strongPillarSentence}</p>
        )}
        {summary.goalSentence && (
          <p className="text-xs text-muted-foreground/60 italic">{summary.goalSentence}</p>
        )}
        <p className="text-[9px] text-primary/50 pt-0.5">Mehr mit CALI besprechen →</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Flame} label="Streak" value={`${streak} Tage`} />
        <StatCard icon={Trophy} label="Konsistenz" value={`${weeklyConsistency}%`} />
        <StatCard icon={TrendingUp} label="Trend" value={scoreHistory.length >= 2 && scoreHistory[scoreHistory.length - 1].score >= scoreHistory[scoreHistory.length - 2].score ? '↑' : '→'} />
      </div>

      {/* Longevity Score Trend */}
      <ChartCard title="Longevity Score">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={scoreData}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(220 14% 55%)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} hide />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="score" stroke="hsl(142 76% 46%)" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Weight Trend */}
      {weightData.length > 0 && (
        <ChartCard title="Gewichtsverlauf" icon={Scale}>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={weightData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(220 14% 55%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="gewicht" stroke="hsl(280 60% 60%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Training Frequency */}
      {trainingFreqData.some(w => w.count > 0) && (
        <ChartCard title="Trainingsfrequenz" icon={Dumbbell}>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={trainingFreqData}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(220 14% 55%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="hsl(142 76% 46%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Pillar Trends */}
      <ChartCard title="Säulen-Trends">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={pillarData}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(220 14% 55%)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} hide />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="bewegung" stroke="hsl(142 76% 46%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="ernaehrung" stroke="hsl(142 60% 40%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="regeneration" stroke="hsl(220 60% 60%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="mental" stroke="hsl(280 60% 60%)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Sleep Trend */}
      <ChartCard title="Schlaf">
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={sleepData}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(220 14% 55%)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="stunden" fill="hsl(220 60% 60%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Stress & Energy */}
      <ChartCard title="Stress & Energie">
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={stressData}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(220 14% 55%)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="stress" stroke="hsl(0 72% 51%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="energie" stroke="hsl(142 76% 46%)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Habit Summary */}
      <div className="card-elegant rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Wöchentliche Gewohnheiten</h3>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Training absolviert</span>
          <span className="text-foreground font-medium">{trainingDays}/7 Tage</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Kein Alkohol</span>
          <span className="text-foreground font-medium">{noAlcoholDays}/7 Tage</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Workouts geloggt</span>
          <span className="text-foreground font-medium">{trainingLogs.length} total</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="card-elegant rounded-2xl p-3 flex flex-col items-center gap-1.5">
      <Icon className="w-4 h-4 text-primary" />
      <span className="font-outfit text-lg font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function ChartCard({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="card-elegant rounded-2xl p-5 space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        {title}
      </h3>
      {children}
    </div>
  );
}
