import { useState } from 'react';
import { useReset, type StartProfile } from '@/contexts/ResetContext';
import { computeMovement, type DayType, type MovementResult } from '@/lib/movement';
import DayToolShell from '@/components/reset/DayToolShell';
import SegmentedControl from '@/components/reset/SegmentedControl';
import SprintHint from '@/components/reset/SprintHint';
import CountUp from '@/components/reset/CountUp';
import { track } from '@/lib/analytics';

const DAY_TYPES: { value: DayType; label: string }[] = [
  { value: 'office', label: 'Bürotag' },
  { value: 'out', label: 'Unterwegs' },
  { value: 'free', label: 'Freier Tag' },
];

interface Day3Saved extends MovementResult {
  dayType: DayType;
}

export default function Day3Movement() {
  const { profile, goal, tools, setTool } = useReset();
  const saved = tools?.day3 as Day3Saved | undefined;
  const [editing, setEditing] = useState(false);
  const [dayType, setDayType] = useState<DayType | null>(saved?.dayType ?? null);

  const handleCompute = () => {
    if (!dayType) return;
    const res = computeMovement((profile as StartProfile) ?? null, goal, dayType);
    setTool('day3', { dayType, ...res });
    track('day3_movement', { dayType, steps: res.stepTarget });
    setEditing(false);
  };

  const result = saved && !editing ? saved : null;

  if (result) {
    return (
      <div className="animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Dein Bewegungsziel heute</p>
        <h2 className="font-outfit text-2xl font-bold text-foreground mb-5 leading-tight">
          Dein Minimum für heute.
        </h2>

        <div className="p-5 rounded-2xl border border-primary/25 bg-primary/5 shadow-glow-subtle mb-3">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">Schrittziel</p>
          <div className="flex items-baseline gap-1.5">
            <CountUp to={result.stepTarget} duration={1.2} format={v => Math.round(v).toLocaleString('de-DE')} className="font-outfit text-3xl font-bold text-foreground tabular-nums" />
            <span className="text-base font-semibold text-muted-foreground ml-1">Schritte</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/50 bg-card/60 mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Dein wichtigster Hebel</p>
          <p className="text-sm font-semibold text-foreground mb-1">1 Spaziergang · {result.walkMin} Min nach der größten Mahlzeit</p>
          <p className="text-sm text-foreground/75 leading-relaxed">{result.line}</p>
        </div>

        <SprintHint>
          Im Sprint wird dein Bewegungsziel an deine echte Woche angepasst — nicht pauschal, sondern nach deinem Alltag.
        </SprintHint>

        <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mt-4">
          Tagestyp ändern
        </button>
      </div>
    );
  }

  return (
    <DayToolShell
      eyebrow="Tag 3 · Bewegung"
      title="Wie sieht dein Tag heute aus?"
      intro="Nicht Training — Alltagsbewegung. Daraus berechnen wir dein realistisches Minimum für heute."
    >
      <div className="space-y-6">
        <SegmentedControl options={DAY_TYPES} value={dayType} onChange={setDayType} columns={3} />
        <button
          onClick={handleCompute}
          disabled={!dayType}
          className="w-full min-h-[52px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100"
          style={{ boxShadow: '0 0 20px hsl(142 76% 46% / 0.3)' }}
        >
          Mein Bewegungsziel berechnen →
        </button>
      </div>
    </DayToolShell>
  );
}
