import { useState } from 'react';
import { useReset, type StartProfile } from '@/contexts/ResetContext';
import { buildWeekStructure, trainingTargetFor, WEEKDAYS, type Weekday, type WeekPlan } from '@/lib/weekStructure';
import DayToolShell from '@/components/reset/DayToolShell';
import SprintHint from '@/components/reset/SprintHint';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export default function Day6WeekBuilder() {
  const { profile, goal, tools, setTool } = useReset();
  const saved = tools?.day6 as WeekPlan | undefined;
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Weekday[]>(
    saved ? saved.days.filter(d => d.training).map(d => d.day) : []
  );

  const target = trainingTargetFor((profile as StartProfile) ?? null);

  const toggle = (d: Weekday) =>
    setSelected(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]));

  const handleBuild = () => {
    if (!selected.length) return;
    const plan = buildWeekStructure((profile as StartProfile) ?? null, goal, selected);
    setTool('day6', plan);
    track('day6_week', { trainingDays: selected.length });
    setEditing(false);
  };

  const plan = saved && !editing ? saved : null;

  if (plan) {
    return (
      <div className="animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Deine Wochenstruktur</p>
        <h2 className="font-outfit text-2xl font-bold text-foreground mb-2 leading-tight">
          Dein Gerüst für die nächste Woche.
        </h2>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Jeden Tag dieselben Anker — Training nur an deinen Tagen. Konstanz schlägt Intensität.
        </p>

        {/* Constant anchors */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: '🚶', label: `${plan.walkMin} Min Spaziergang` },
            { icon: '🍽️', label: `~${plan.proteinTarget} g Protein/Mahlzeit` },
            { icon: '😴', label: 'Feste Schlafenszeit' },
          ].map(a => (
            <div key={a.label} className="p-3 rounded-xl border border-border/40 bg-card/50 text-center">
              <div className="text-lg mb-1">{a.icon}</div>
              <p className="text-[11px] text-muted-foreground/80 leading-tight">{a.label}</p>
            </div>
          ))}
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {plan.days.map(d => (
            <div
              key={d.day}
              className={cn(
                'rounded-xl border py-2.5 text-center',
                d.training ? 'border-primary/50 bg-primary/10' : 'border-border/30 bg-card/30'
              )}
            >
              <p className="text-[11px] font-semibold text-foreground/70">{d.day}</p>
              <p className="text-sm mt-1">{d.training ? '🏋️' : '·'}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/50 mb-2">🏋️ Training · jeden Tag: Spaziergang, Protein-Anker, Schlafanker</p>

        <SprintHint>
          Das ist dein Gerüst. Im Sprint wird daraus eine Woche mit Check-ins, die sich anpasst, wenn das Leben dazwischenkommt.
        </SprintHint>

        <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mt-4">
          Trainingstage ändern
        </button>
      </div>
    );
  }

  return (
    <DayToolShell
      eyebrow="Tag 6 · Wochenstruktur"
      title="Bau dir deine nächste Woche."
      intro={`Wähle deine Trainingstage — ${target} passen zu deinem Level. Die täglichen Anker baust du drumherum.`}
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm text-foreground font-medium mb-2">Trainingstage ({selected.length}/{target} empfohlen)</p>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map(d => {
              const active = selected.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggle(d)}
                  className={cn(
                    'rounded-xl border py-3 text-xs font-semibold transition-all duration-200 active:scale-[0.96]',
                    active
                      ? 'border-primary bg-primary/10 text-foreground shadow-glow-subtle'
                      : 'border-border/60 bg-card text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleBuild}
          disabled={!selected.length}
          className="w-full min-h-[52px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100"
          style={{ boxShadow: '0 0 20px hsl(142 76% 46% / 0.3)' }}
        >
          Meine Wochenstruktur erstellen →
        </button>
      </div>
    </DayToolShell>
  );
}
