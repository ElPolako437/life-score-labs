import { useState } from 'react';
import { useReset, type StartProfile } from '@/contexts/ResetContext';
import { proteinPerMeal } from '@/lib/nutritionEngine';
import { suggestMeals, SLOT_LABELS, type MealSlot, type MealTag } from '@/lib/mealBank';
import DayToolShell from '@/components/reset/DayToolShell';
import SegmentedControl from '@/components/reset/SegmentedControl';
import SprintHint from '@/components/reset/SprintHint';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const PREFS: { value: MealTag; label: string }[] = [
  { value: 'fast', label: 'Schnell' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Kalt' },
  { value: 'veg', label: 'Vegetarisch' },
];

interface Day2Result {
  slots: MealSlot[];
  pref: MealTag | null;
}

export default function Day2Meals() {
  const { profile, tools, setTool } = useReset();
  const saved = tools?.day2 as Day2Result | undefined;
  const [editing, setEditing] = useState(false);

  const [slots, setSlots] = useState<MealSlot[]>(saved?.slots ?? []);
  const [pref, setPref] = useState<MealTag | null>(saved?.pref ?? null);

  const target = profile ? proteinPerMeal(profile as StartProfile) : 35;

  const toggleSlot = (s: MealSlot) =>
    setSlots(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]));

  const handleShow = () => {
    if (!slots.length) return;
    setTool('day2', { slots, pref });
    track('day2_meals', { slots: slots.length, pref });
    setEditing(false);
  };

  const result = saved && !editing ? saved : null;

  // ---- Result mode ---------------------------------------------------------
  if (result) {
    return (
      <div className="animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Dein Mahlzeiten-Plan heute</p>
        <h2 className="font-outfit text-2xl font-bold text-foreground mb-2 leading-tight">
          So triffst du dein Proteinziel.
        </h2>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Ziel: <span className="text-foreground font-semibold tabular-nums">~{target} g Protein</span> pro Mahlzeit. Hier sind einfache Varianten für deine Mahlzeiten:
        </p>

        <div className="space-y-3">
          {result.slots.map(slot => (
            <div key={slot} className="p-4 rounded-2xl border border-border/50 bg-card/60">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">{SLOT_LABELS[slot]}</p>
              <div className="space-y-2">
                {suggestMeals(slot, result.pref, 2).map(m => (
                  <div key={m.name} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-foreground/85">{m.name}</span>
                    <span className="text-xs font-semibold text-primary tabular-nums whitespace-nowrap">~{m.protein} g</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <SprintHint>
          Im Sprint kommen diese Vorschläge täglich automatisch — abgestimmt auf das, was du wirklich magst und im Haus hast.
        </SprintHint>

        <button
          onClick={() => setEditing(true)}
          className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mt-4"
        >
          Mahlzeiten anpassen
        </button>
      </div>
    );
  }

  // ---- Input mode ----------------------------------------------------------
  return (
    <DayToolShell
      eyebrow="Tag 2 · Protein umsetzen"
      title="Welche Mahlzeiten schaffst du heute realistisch?"
      intro="Kein neuer Plan — nur Umsetzung. Wähle, was heute machbar ist, und du bekommst passende proteinreiche Varianten."
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm text-foreground font-medium mb-2">Heutige Mahlzeiten</p>
          <div className="grid grid-cols-2 gap-2.5">
            {SLOTS.map(s => {
              const active = slots.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSlot(s)}
                  className={cn(
                    'rounded-2xl border px-3 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98]',
                    active
                      ? 'border-primary bg-primary/10 text-foreground shadow-glow-subtle'
                      : 'border-border/60 bg-card text-card-foreground hover:border-primary/40'
                  )}
                >
                  {SLOT_LABELS[s]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-sm text-foreground font-medium mb-2">Vorliebe (optional)</p>
          <SegmentedControl options={PREFS} value={pref} onChange={setPref} columns={4} />
        </div>

        <button
          onClick={handleShow}
          disabled={!slots.length}
          className="w-full min-h-[52px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100"
          style={{ boxShadow: '0 0 20px hsl(142 76% 46% / 0.3)' }}
        >
          Meine Vorschläge zeigen →
        </button>
      </div>
    </DayToolShell>
  );
}
