import { useState } from 'react';
import { useReset, type Sex, type Activity, type Daily } from '@/contexts/ResetContext';
import { buildStartProfile, proteinPerMeal, LEVERS, type BodyInputs } from '@/lib/nutritionEngine';
import DayToolShell from '@/components/reset/DayToolShell';
import SegmentedControl from '@/components/reset/SegmentedControl';
import NumberField from '@/components/reset/NumberField';
import StatReveal from '@/components/reset/StatReveal';
import SprintHint from '@/components/reset/SprintHint';
import { track } from '@/lib/analytics';
import { recordProfile, recordEvent } from '@/lib/resetBackend';

const ACTIVITY_OPTS: { value: Activity; label: string; hint: string }[] = [
  { value: 'low', label: 'Wenig', hint: '0–1× Sport' },
  { value: 'moderate', label: 'Mittel', hint: '2–3× Sport' },
  { value: 'high', label: 'Viel', hint: '4×+ Sport' },
];

const DAILY_OPTS: { value: Daily; label: string; hint: string }[] = [
  { value: 'sedentary', label: 'Sitzend', hint: 'Büro' },
  { value: 'mixed', label: 'Gemischt', hint: 'mal so, mal so' },
  { value: 'active', label: 'Aktiv', hint: 'viel auf den Beinen' },
];

export default function Day1Calculator() {
  const { goal, hurdle, baseline, sex, weight, profile, setProfile, email } = useReset();
  const [editing, setEditing] = useState(false);

  // Inputs — prefilled from any legacy values.
  const [selSex, setSelSex] = useState<Sex | null>(sex);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [w, setW] = useState(weight ? String(weight) : '');
  const [activity, setActivity] = useState<Activity | null>(null);
  const [daily, setDaily] = useState<Daily | null>(null);

  const ageN = Number(age), heightN = Number(height), weightN = Number(w.replace(',', '.'));
  const valid =
    selSex && activity && daily &&
    ageN >= 14 && ageN <= 100 &&
    heightN >= 120 && heightN <= 220 &&
    weightN >= 35 && weightN <= 250;

  const handleCompute = () => {
    if (!valid) return;
    const inputs: BodyInputs = {
      sex: selSex!, age: ageN, height: heightN, weight: Math.round(weightN),
      activity: activity!, daily: daily!,
    };
    const p = buildStartProfile(inputs, goal, hurdle, baseline);
    setProfile(p);
    track('profile_computed', { goal, activity: activity!, daily: daily!, lever: p.mainLever });
    // Server-side capture: full Tag-1 profile + goal/hurdle/baseline context.
    recordProfile(email, { ...p, goal, hurdle, baseline });
    recordEvent(email, 'profile_calculated', { lever: p.mainLever, goal });
    setEditing(false);
  };

  // ---- Result mode ---------------------------------------------------------
  if (profile && !editing) {
    const perMeal = proteinPerMeal(profile);
    const lever = LEVERS[profile.mainLever];
    return (
      <div className="animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Dein Startprofil</p>
        <h2 className="font-outfit text-2xl font-bold text-foreground mb-5 leading-tight">
          Das ist dein persönlicher Startpunkt.
        </h2>

        <div className="space-y-3 mb-5">
          <div className="relative p-5 rounded-2xl border border-primary/40 shadow-glow overflow-hidden [background:var(--gradient-glow)]">
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            <StatReveal
              hero
              eyebrow="Dein Kalorienbereich"
              low={profile.calLow}
              high={profile.calHigh}
              unit="kcal / Tag"
              sublabel="Richtwert zur Orientierung — kein medizinischer Rat."
            />
          </div>
          <div className="p-5 rounded-2xl border border-border/50 bg-card/60">
            <StatReveal
              eyebrow="Dein Proteinziel"
              low={profile.proteinLow}
              high={profile.proteinHigh}
              unit="g / Tag"
              sublabel={`~${perMeal} g pro Mahlzeit bei ${profile.mealCount} Mahlzeiten`}
            />
          </div>
        </div>

        {/* Simple meal structure */}
        <div className="p-4 rounded-2xl border border-border/40 bg-card/40 mb-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Deine einfache Tagesstruktur</p>
          <div className="space-y-2">
            {['Mahlzeit 1', 'Mahlzeit 2', 'Mahlzeit 3'].slice(0, profile.mealCount).map((m, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                <span className="text-sm text-foreground/80">{m}</span>
                <span className="text-xs font-semibold text-primary tabular-nums">~{perMeal} g Protein</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/50 mt-3">Keine Snacks dazwischen — das gibt deinem Blutzucker Pausen.</p>
        </div>

        {/* Main lever */}
        <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 mb-2">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">Dein größter Hebel jetzt</p>
          <p className="text-sm font-semibold text-foreground mb-1">{lever.label}</p>
          <p className="text-sm text-foreground/75 leading-relaxed">{lever.line}</p>
        </div>

        <SprintHint>
          Das ist deine Startschätzung aus 6 Werten. In der CALINESS App wird daraus ab Dezember ein Plan, der sich jede Woche an deine echten Daten anpasst.
        </SprintHint>

        <button
          onClick={() => setEditing(true)}
          className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mt-4"
        >
          Werte anpassen
        </button>
      </div>
    );
  }

  // ---- Input mode ----------------------------------------------------------
  return (
    <DayToolShell
      eyebrow="Tag 1 · Dein Reset-Start"
      title="Lass uns deinen persönlichen Startpunkt berechnen."
      intro="6 kurze Angaben — daraus bekommst du sofort deinen Kalorienbereich, dein Proteinziel und deinen größten Hebel. Bleibt auf deinem Gerät."
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm text-foreground font-medium mb-2">Geschlecht</p>
          <SegmentedControl
            options={[{ value: 'female', label: 'Weiblich' }, { value: 'male', label: 'Männlich' }]}
            value={selSex}
            onChange={setSelSex}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Alter" value={age} onChange={setAge} unit="J." placeholder="z.B. 34" maxLength={3} />
          <NumberField label="Größe" value={height} onChange={setHeight} unit="cm" placeholder="z.B. 178" maxLength={3} />
        </div>

        <NumberField label="Gewicht" value={w} onChange={setW} unit="kg" placeholder="z.B. 82" />

        <div>
          <p className="text-sm text-foreground font-medium mb-2">Wie aktiv trainierst du?</p>
          <SegmentedControl options={ACTIVITY_OPTS} value={activity} onChange={setActivity} columns={3} />
        </div>

        <div>
          <p className="text-sm text-foreground font-medium mb-2">Wie ist dein Alltag?</p>
          <SegmentedControl options={DAILY_OPTS} value={daily} onChange={setDaily} columns={3} />
        </div>

        <button
          onClick={handleCompute}
          disabled={!valid}
          className="w-full min-h-[52px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100"
          style={{ boxShadow: '0 0 20px hsl(142 76% 46% / 0.3)' }}
        >
          Mein Startprofil berechnen →
        </button>
      </div>
    </DayToolShell>
  );
}
