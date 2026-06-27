import { useState } from 'react';
import { useReset, type StartProfile } from '@/contexts/ResetContext';
import { computeMovement, MOVEMENT_BLOCKS, type DayType } from '@/lib/movement';
import DayToolShell from '@/components/reset/DayToolShell';
import SegmentedControl from '@/components/reset/SegmentedControl';
import GoalGauge from '@/components/reset/GoalGauge';
import SprintHint from '@/components/reset/SprintHint';
import { track } from '@/lib/analytics';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAY_TYPES: { value: DayType; label: string }[] = [
  { value: 'office', label: 'Bürotag' },
  { value: 'out', label: 'Unterwegs' },
  { value: 'free', label: 'Freier Tag' },
];

const fmtSteps = (v: number) => Math.round(v).toLocaleString('de-DE');

interface Day3Saved {
  dayType: DayType;
  target: number;
  picked: string[];
  total: number;
  walkMin: number;
}

export default function Day3Movement() {
  const { profile, goal, tools, setTool } = useReset();
  const saved = tools?.day3 as Day3Saved | undefined;
  const [editing, setEditing] = useState(false);

  const [dayType, setDayType] = useState<DayType | null>(saved?.dayType ?? null);
  const [picked, setPicked] = useState<string[]>(saved?.picked ?? []);

  const movement = dayType ? computeMovement((profile as StartProfile) ?? null, goal, dayType) : null;
  const target = movement?.stepTarget ?? saved?.target ?? 8000;
  // Everyday baseline steps before deliberate NEAT (~45% of target just existing).
  const baseSteps = Math.round(target * 0.45 / 100) * 100;
  const blockSteps = MOVEMENT_BLOCKS.filter(b => picked.includes(b.id)).reduce((s, b) => s + b.steps, 0);
  const total = baseSteps + blockSteps;
  const reached = total >= target;

  const toggle = (id: string) => setPicked(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const handleSave = () => {
    if (!dayType) return;
    setTool('day3', { dayType, target, stepTarget: target, picked, total, walkMin: movement?.walkMin ?? 10 });
    track('day3_movement', { dayType, target, total, reached, blocks: picked.length });
    setEditing(false);
  };

  // ─── Result mode ─────────────────────────────────────────────────────────
  if (saved && !editing) {
    const blocks = MOVEMENT_BLOCKS.filter(b => saved.picked.includes(b.id));
    return (
      <div className="animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Dein Bewegungstag</p>
        <h2 className="font-outfit text-2xl font-bold text-foreground mb-4 leading-tight">
          {saved.total >= saved.target ? 'Dein Ziel — ganz ohne Gym.' : 'So nah dran, nur mit Alltag.'}
        </h2>

        <div className="p-5 rounded-2xl border border-primary/25 [background:var(--gradient-card)] shadow-card mb-4">
          <GoalGauge total={saved.total} target={saved.target} unit="Schritte" format={fmtSteps} />
        </div>

        <div className="space-y-2 mb-2">
          {blocks.map(b => (
            <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card/50">
              <span className="text-sm text-foreground/85"><span className="mr-2">{b.icon}</span>{b.label}</span>
              <span className="text-xs font-bold text-primary tabular-nums">+{fmtSteps(b.steps)}</span>
            </div>
          ))}
        </div>

        <SprintHint>
          Im Sprint wird dein Bewegungsziel an deine echte Woche angepasst — nicht pauschal, sondern nach deinem Alltag.
        </SprintHint>

        <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mt-4">
          Tag neu planen
        </button>
      </div>
    );
  }

  // ─── Builder mode ────────────────────────────────────────────────────────
  return (
    <DayToolShell
      eyebrow="Tag 3 · Bewegung"
      title="Stapel deinen Tag — und sieh, wie wenig zum Ziel fehlt."
      intro="Nicht Training. Kleine Alltags-Momente. Tippe an, was du heute schaffst, und beobachte deine Schritte klettern."
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm text-foreground font-medium mb-2">Was für ein Tag ist heute?</p>
          <SegmentedControl options={DAY_TYPES} value={dayType} onChange={setDayType} columns={3} />
        </div>

        {dayType && (
          <>
            <div className="sticky top-2 z-20 rounded-2xl border border-primary/25 [background:var(--gradient-card)] shadow-card p-4">
              <GoalGauge total={total} target={target} unit="Schritte" format={fmtSteps} compact />
              <p className="text-[11px] text-muted-foreground/45 mt-2">Start: ~{fmtSteps(baseSteps)} Schritte hast du im Alltag ohnehin. Der Rest kommt von hier:</p>
            </div>

            <div className="space-y-2">
              {MOVEMENT_BLOCKS.map(b => {
                const active = picked.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggle(b.id)}
                    className={cn(
                      'relative w-full text-left px-4 py-3.5 rounded-2xl border overflow-hidden flex items-center justify-between gap-3',
                      'transition-[transform,border-color,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]',
                      active
                        ? 'border-primary/80 scale-[1.02] shadow-glow [background:var(--gradient-glow)]'
                        : 'border-border/50 bg-card/70 hover:border-primary/40 hover:-translate-y-0.5 shadow-inner-light'
                    )}
                  >
                    {active && <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />}
                    <span className="text-sm font-medium text-foreground"><span className="mr-2.5">{b.icon}</span>{b.label}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className={cn('text-xs font-bold tabular-nums transition-colors', active ? 'text-primary' : 'text-muted-foreground/60')}>+{fmtSteps(b.steps)}</span>
                      <span className={cn('w-5 h-5 rounded-full border flex items-center justify-center transition-colors', active ? 'border-primary bg-primary/20' : 'border-border/50')}>
                        {active && <Check className="w-3 h-3 text-primary" strokeWidth={3} />}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSave}
              disabled={picked.length === 0}
              className="w-full min-h-[52px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100"
              style={{ boxShadow: '0 0 20px hsl(142 76% 46% / 0.3)' }}
            >
              {reached ? 'Ziel getroffen — Tag speichern' : picked.length ? 'Tag speichern' : 'Wähle deine Bewegungs-Momente'}
            </button>
          </>
        )}
      </div>
    </DayToolShell>
  );
}
