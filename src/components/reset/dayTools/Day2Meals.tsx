import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useReset, type StartProfile } from '@/contexts/ResetContext';
import { suggestMeals, SLOT_LABELS, type MealSlot, type MealTag, type Meal } from '@/lib/mealBank';
import DayToolShell from '@/components/reset/DayToolShell';
import SegmentedControl from '@/components/reset/SegmentedControl';
import SprintHint from '@/components/reset/SprintHint';
import { track } from '@/lib/analytics';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PREFS: { value: MealTag; label: string }[] = [
  { value: 'fast', label: 'Schnell' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Kalt' },
  { value: 'veg', label: 'Veggie' },
];

interface Day2Result {
  selected: Partial<Record<MealSlot, string>>;
  total: number;
  target: number;
  pref: MealTag | null;
}

export default function Day2Meals() {
  const reduce = useReducedMotion();
  const { profile, tools, setTool } = useReset();
  const saved = tools?.day2 as Day2Result | undefined;
  const [editing, setEditing] = useState(false);

  const p = profile as StartProfile | null;
  // Personal daily protein goal from Tag 1 (low end = the "hit this" floor).
  const target = p ? p.proteinLow : 130;
  const slotsForDay: MealSlot[] = (p?.mealCount ?? 3) >= 3
    ? ['breakfast', 'lunch', 'dinner', 'snack']
    : ['breakfast', 'dinner', 'snack'];

  const [pref, setPref] = useState<MealTag | null>(saved?.pref ?? null);
  // selected meal name per slot
  const [picked, setPicked] = useState<Partial<Record<MealSlot, Meal>>>(() => {
    if (!saved?.selected) return {};
    const out: Partial<Record<MealSlot, Meal>> = {};
    for (const slot of Object.keys(saved.selected) as MealSlot[]) {
      const name = saved.selected[slot];
      const m = suggestMeals(slot, null, 8).find(x => x.name === name);
      if (m) out[slot] = m;
    }
    return out;
  });

  const total = Object.values(picked).reduce((s, m) => s + (m?.protein ?? 0), 0);
  const reached = total >= target;
  const pickedCount = Object.values(picked).filter(Boolean).length;

  const pick = (slot: MealSlot, meal: Meal) =>
    setPicked(prev => ({ ...prev, [slot]: prev[slot]?.name === meal.name ? undefined : meal }));

  const handleSave = () => {
    const selected: Partial<Record<MealSlot, string>> = {};
    for (const slot of Object.keys(picked) as MealSlot[]) {
      if (picked[slot]) selected[slot] = picked[slot]!.name;
    }
    setTool('day2', { selected, total, target, pref });
    track('day2_meals', { picked: pickedCount, total, target, reached, pref });
    setEditing(false);
  };

  // ─── Result mode ─────────────────────────────────────────────────────────
  // Guard against legacy save shapes (pre-builder) — fall through to builder.
  if (saved && !editing && saved.selected && typeof saved.total === 'number') {
    return (
      <div className="animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Dein Tag steht</p>
        <h2 className="font-outfit text-2xl font-bold text-foreground mb-4 leading-tight">
          {saved.total >= saved.target ? 'Du triffst dein Proteinziel.' : 'So nah bist du dran.'}
        </h2>

        <ProteinGauge total={saved.total} target={saved.target} reduce={reduce} />

        <div className="space-y-2.5 mt-5">
          {(Object.keys(saved.selected) as MealSlot[]).map(slot => (
            <div key={slot} className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-card/50">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">{SLOT_LABELS[slot]}</p>
                <p className="text-sm text-foreground/90 truncate">{saved.selected[slot]}</p>
              </div>
              <span className="text-xs font-bold text-primary tabular-nums shrink-0 ml-3">
                ~{suggestMeals(slot, null, 8).find(m => m.name === saved.selected[slot])?.protein ?? '–'} g
              </span>
            </div>
          ))}
        </div>

        <SprintHint>
          Im Sprint kommt dein Tagesplan automatisch — abgestimmt auf das, was du magst und im Haus hast. Du musst nie wieder selbst rechnen.
        </SprintHint>

        <button
          onClick={() => setEditing(true)}
          className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mt-4"
        >
          Tag neu zusammenstellen
        </button>
      </div>
    );
  }

  // ─── Builder mode ────────────────────────────────────────────────────────
  return (
    <DayToolShell
      eyebrow="Tag 2 · Bau deinen Tag"
      title="Stell deinen Tag zusammen — und sieh live, wie du dein Ziel triffst."
      intro="Tippe pro Mahlzeit eine Option an. Die Leiste füllt sich zu deinem persönlichen Proteinziel aus Tag 1."
    >
      {/* Sticky live gauge */}
      <div className="sticky top-2 z-20 mb-6 rounded-2xl border border-primary/25 [background:var(--gradient-card)] shadow-card p-4 backdrop-blur-sm">
        <ProteinGauge total={total} target={target} reduce={reduce} compact />
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-sm text-foreground font-medium mb-2">Vorliebe (optional)</p>
          <SegmentedControl options={PREFS} value={pref} onChange={setPref} columns={4} />
        </div>

        {slotsForDay.map(slot => (
          <div key={slot}>
            <p className="text-sm text-foreground font-medium mb-2.5">
              {SLOT_LABELS[slot]}
              {slot === 'snack' && <span className="text-muted-foreground/40 font-normal"> · optional</span>}
            </p>
            <div className="space-y-2">
              {suggestMeals(slot, pref, 3).map(meal => {
                const active = picked[slot]?.name === meal.name;
                return (
                  <button
                    key={meal.name}
                    type="button"
                    onClick={() => pick(slot, meal)}
                    className={cn(
                      'relative w-full text-left px-4 py-3.5 rounded-2xl border overflow-hidden flex items-center justify-between gap-3',
                      'transition-[transform,border-color,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]',
                      active
                        ? 'border-primary/80 scale-[1.02] shadow-glow [background:var(--gradient-glow)]'
                        : 'border-border/50 bg-card/70 hover:border-primary/40 hover:-translate-y-0.5 shadow-inner-light'
                    )}
                  >
                    {active && <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />}
                    <span className={cn('text-sm font-medium transition-colors', active ? 'text-foreground' : 'text-card-foreground')}>{meal.name}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className={cn('text-xs font-bold tabular-nums transition-colors', active ? 'text-primary' : 'text-muted-foreground/60')}>~{meal.protein} g</span>
                      <span className={cn('w-5 h-5 rounded-full border flex items-center justify-center transition-colors', active ? 'border-primary bg-primary/20' : 'border-border/50')}>
                        {active && <Check className="w-3 h-3 text-primary" strokeWidth={3} />}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={pickedCount === 0}
          className="w-full min-h-[52px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100"
          style={{ boxShadow: '0 0 20px hsl(142 76% 46% / 0.3)' }}
        >
          {reached ? 'Ziel getroffen — Tag speichern' : pickedCount ? 'Tag speichern' : 'Wähle deine Mahlzeiten'}
        </button>
      </div>
    </DayToolShell>
  );
}

// ─── Live protein gauge ──────────────────────────────────────────────────
function ProteinGauge({ total, target, reduce, compact }: { total: number; target: number; reduce: boolean | null; compact?: boolean }) {
  const pct = Math.min(100, (total / target) * 100);
  const reached = total >= target;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-1.5">
          <motion.span
            key={total}
            initial={reduce ? false : { scale: 1.25 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className={cn('font-outfit font-bold tabular-nums leading-none', compact ? 'text-2xl' : 'text-3xl', reached ? 'text-primary' : 'text-foreground')}
            style={reached ? { textShadow: '0 0 24px hsl(142 76% 46% / 0.5)' } : undefined}
          >
            {total}
          </motion.span>
          <span className="text-sm font-semibold text-muted-foreground">/ {target} g Protein</span>
        </div>
        {reached && (
          <motion.span
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 14 }}
            className="flex items-center gap-1 text-xs font-bold text-primary"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={3} /> Ziel erreicht
          </motion.span>
        )}
      </div>
      <div className="relative h-3 rounded-full bg-secondary/80 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: reached
              ? 'linear-gradient(90deg, hsl(142 76% 46%), hsl(142 80% 55%))'
              : 'linear-gradient(90deg, hsl(142 60% 38%), hsl(142 76% 46%))',
            boxShadow: reached ? '0 0 16px hsl(142 76% 46% / 0.6)' : '0 0 8px hsl(142 76% 46% / 0.3)',
          }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      {!reached && (
        <p className="text-[11px] text-muted-foreground/50 mt-1.5">Noch {Math.max(0, target - total)} g bis zu deinem Ziel.</p>
      )}
    </div>
  );
}
