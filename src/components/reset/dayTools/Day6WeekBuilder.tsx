import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useReset, type StartProfile } from '@/contexts/ResetContext';
import { buildWeekStructure, trainingTargetFor, WEEKDAYS, type Weekday, type WeekPlan } from '@/lib/weekStructure';
import DayToolShell from '@/components/reset/DayToolShell';
import ProgressRing from '@/components/reset/ProgressRing';
import SprintHint from '@/components/reset/SprintHint';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const BIOAGE_URL = 'https://caliness-academy.de';

// The four longevity pillars, each fed by which reset-tools the user engaged with.
function computePillars(tools: Record<string, unknown> | undefined) {
  const t = tools ?? {};
  const ernaehrung = (t.day1 ? 1 : 0) + (t.day2 ? 1 : 0); // 0–2
  const bewegung = t.day3 ? 1 : 0;
  const schlaf = t.day4 ? 1 : 0;
  const mental = t.day5 ? 1 : 0;
  const pillars = [
    { key: 'food', label: 'Ernährung', icon: '🍽️', fill: ernaehrung / 2 },
    { key: 'move', label: 'Bewegung', icon: '🚶', fill: bewegung },
    { key: 'sleep', label: 'Schlaf', icon: '😴', fill: schlaf },
    { key: 'mind', label: 'Mental', icon: '🧠', fill: mental },
  ];
  const engaged = pillars.reduce((s, p) => s + Math.min(1, p.fill), 0); // 0–4
  // Momentum: at day 6 you've built real momentum — 55 base + engagement.
  const momentum = Math.round(55 + (engaged / 4) * 45);
  return { pillars, momentum, engaged };
}

function momentumLabel(score: number): string {
  if (score >= 90) return 'Starkes Momentum';
  if (score >= 75) return 'Spürbares Momentum';
  return 'Momentum baut sich auf';
}

export default function Day6WeekBuilder() {
  const reduce = useReducedMotion();
  const { profile, goal, tools, setTool } = useReset();
  const saved = tools?.day6 as WeekPlan | undefined;
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Weekday[]>(
    saved ? saved.days.filter(d => d.training).map(d => d.day) : []
  );

  const target = trainingTargetFor((profile as StartProfile) ?? null);
  const { pillars, momentum } = computePillars(tools);

  const toggle = (d: Weekday) =>
    setSelected(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]));

  const handleBuild = () => {
    if (!selected.length) return;
    const plan = buildWeekStructure((profile as StartProfile) ?? null, goal, selected);
    setTool('day6', plan);
    track('day6_week', { trainingDays: selected.length, momentum });
    setEditing(false);
  };

  // ─── Result mode ─────────────────────────────────────────────────────────
  if (saved && !editing && Array.isArray(saved.days)) {
    return (
      <div>
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Dein Longevity-Momentum</p>
        <h2 className="font-outfit text-2xl font-bold text-foreground mb-1 leading-tight">
          6 Tage zeigen Wirkung.
        </h2>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Nicht die Waage zählt — die Richtung. So steht dein System nach 6 Tagen.
        </p>

        {/* Momentum ring + pillars */}
        <motion.div
          className="relative p-5 rounded-2xl border border-primary/30 [background:var(--gradient-glow)] shadow-glow overflow-hidden mb-4"
          initial={reduce ? false : { scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
          <div className="flex items-center gap-5">
            <ProgressRing progress={momentum / 100} size={104} stroke={7}>
              <span className="font-outfit text-3xl font-bold text-primary tabular-nums leading-none" style={{ textShadow: '0 0 22px hsl(142 76% 46% / 0.5)' }}>{momentum}</span>
              <span className="text-[9px] text-muted-foreground/50 mt-0.5">Momentum</span>
            </ProgressRing>
            <div className="flex-1 min-w-0 space-y-2">
              {pillars.map((p, i) => (
                <motion.div key={p.key}
                  initial={reduce ? false : { opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] text-foreground/70">{p.icon} {p.label}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary/80 overflow-hidden">
                    <motion.div className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(8, p.fill * 100)}%` }}
                      transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 120, damping: 20 }}
                      style={{ boxShadow: '0 0 8px hsl(142 76% 46% / 0.4)' }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <p className="text-sm font-semibold text-primary mt-4">{momentumLabel(momentum)}</p>
        </motion.div>

        {/* Week structure — the actionable gerüst */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Dein Gerüst für die nächste Woche</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { icon: '🚶', label: `${saved.walkMin} Min Spaziergang` },
            { icon: '🍽️', label: `~${saved.proteinTarget} g Protein/Mahlzeit` },
            { icon: '😴', label: 'Feste Schlafenszeit' },
          ].map(a => (
            <div key={a.label} className="p-3 rounded-xl border border-border/40 bg-card/50 text-center">
              <div className="text-lg mb-1">{a.icon}</div>
              <p className="text-[11px] text-muted-foreground/80 leading-tight">{a.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {saved.days.map((d, i) => (
            <motion.div key={d.day}
              initial={reduce ? false : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.04, type: 'spring', stiffness: 400, damping: 20 }}
              className={cn('rounded-xl border py-2.5 text-center', d.training ? 'border-primary/50 bg-primary/10' : 'border-border/30 bg-card/30')}
            >
              <p className="text-[11px] font-semibold text-foreground/70">{d.day}</p>
              <p className="text-sm mt-1">{d.training ? '🏋️' : '·'}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/50 mb-2">🏋️ Training · jeden Tag: Spaziergang, Protein-Anker, Schlafanker</p>

        <SprintHint>
          Das ist dein Gerüst. Im Sprint wird daraus eine Woche mit Check-ins, die sich anpasst, wenn das Leben dazwischenkommt.
        </SprintHint>

        {/* Soft, optional BioAge offer — no compulsion */}
        <div className="mt-4 p-3.5 rounded-xl border border-border/30 bg-card/40">
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            Neugierig, wo du langfristig stehst? Unser kurzer <a href={BIOAGE_URL} target="_blank" rel="noopener noreferrer" className="text-primary/80 underline">Bio-Age-Test</a> gibt dir eine erste Longevity-Einordnung — ganz ohne Verpflichtung.
          </p>
        </div>

        <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mt-4">
          Trainingstage ändern
        </button>
      </div>
    );
  }

  // ─── Builder mode ────────────────────────────────────────────────────────
  return (
    <DayToolShell
      eyebrow="Tag 6 · Körpergefühl & Longevity"
      title="Mach aus 6 Tagen ein System."
      intro={`Wähle deine Trainingstage — ${target} passen zu deinem Level. Die täglichen Anker baust du drumherum. Daraus entsteht dein Longevity-Momentum.`}
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
                    'relative rounded-xl border py-3 text-xs font-semibold overflow-hidden',
                    'transition-[transform,border-color,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.94]',
                    active
                      ? 'border-primary/80 text-foreground scale-[1.06] shadow-glow [background:var(--gradient-glow)]'
                      : 'border-border/50 bg-card/70 text-muted-foreground hover:border-primary/40 shadow-inner-light'
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
          Mein Longevity-Momentum zeigen →
        </button>
      </div>
    </DayToolShell>
  );
}
