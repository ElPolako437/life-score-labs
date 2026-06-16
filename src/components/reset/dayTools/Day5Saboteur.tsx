import { useState } from 'react';
import { useReset } from '@/contexts/ResetContext';
import { computeSaboteur, SABOTEURS, type SaboteurKey, type KipptTime, type EnergyLevel } from '@/lib/saboteur';
import DayToolShell from '@/components/reset/DayToolShell';
import SegmentedControl from '@/components/reset/SegmentedControl';
import SprintHint from '@/components/reset/SprintHint';
import { track } from '@/lib/analytics';

const KIPPT_OPTS: { value: KipptTime; label: string }[] = [
  { value: 'morning', label: 'Morgens' },
  { value: 'afternoon', label: 'Nachmittags' },
  { value: 'evening', label: 'Abends' },
];
const ENERGY_OPTS: { value: EnergyLevel; label: string }[] = [
  { value: 'high', label: 'Hoch' },
  { value: 'mid', label: 'Mittel' },
  { value: 'low', label: 'Niedrig' },
];

interface Day5Saved {
  saboteur: SaboteurKey;
  kippt: KipptTime;
  energy: EnergyLevel;
}

export default function Day5Saboteur() {
  const { hurdle, baseline, tools, getDayData, setTool } = useReset();
  const saved = tools?.day5 as Day5Saved | undefined;
  const [editing, setEditing] = useState(false);
  const [kippt, setKippt] = useState<KipptTime | null>(saved?.kippt ?? null);
  const [energy, setEnergy] = useState<EnergyLevel | null>(saved?.energy ?? null);

  const handleCompute = () => {
    if (!kippt || !energy) return;
    const sleepIssue = !!(tools?.day4 as { screw?: string } | undefined)?.screw
      && (tools!.day4 as { screw?: string }).screw !== 'none';
    let struggleDays = 0;
    for (let d = 1; d <= 5; d++) {
      const r = getDayData(d).rating;
      if (r === 'difficult' || r === 'failed') struggleDays++;
    }
    const saboteur = computeSaboteur({ hurdle, baseline, sleepIssue, struggleDays, kippt, energy });
    setTool('day5', { saboteur, kippt, energy });
    track('day5_saboteur', { saboteur });
    setEditing(false);
  };

  const result = saved && !editing ? saved : null;

  if (result) {
    const sab = SABOTEURS[result.saboteur];
    return (
      <div className="animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Deine Saboteur-Analyse</p>
        <h2 className="font-outfit text-2xl font-bold text-foreground mb-5 leading-tight">
          Das blockiert dich gerade am wahrscheinlichsten.
        </h2>

        <div className="p-5 rounded-2xl border border-primary/25 bg-primary/5 shadow-glow-subtle mb-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">Wahrscheinlichster Saboteur</p>
          <p className="text-lg font-bold text-foreground">{sab.label}</p>
        </div>

        <div className="p-4 rounded-2xl border border-border/50 bg-card/60 mb-2">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">Dein Gegenhebel heute</p>
          <p className="text-sm text-foreground/85 leading-relaxed">{sab.counter}</p>
        </div>

        <SprintHint>
          Im Sprint erkennen David & Sarah dein Muster gemeinsam mit dir — und bauen den Gegenhebel fest in deine Woche ein.
        </SprintHint>

        <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mt-4">
          Antworten ändern
        </button>
      </div>
    );
  }

  return (
    <DayToolShell
      eyebrow="Tag 5 · Stress & Craving"
      title="Was hält dich gerade wirklich auf?"
      intro="Zwei kurze Fragen — kombiniert mit deinen bisherigen Antworten finden wir deinen wahrscheinlichsten Blocker."
    >
      <div className="space-y-5">
        <div>
          <p className="text-sm text-foreground font-medium mb-2">Wann kippt dein Tag meistens?</p>
          <SegmentedControl options={KIPPT_OPTS} value={kippt} onChange={setKippt} columns={3} />
        </div>
        <div>
          <p className="text-sm text-foreground font-medium mb-2">Wie ist deine Energie heute?</p>
          <SegmentedControl options={ENERGY_OPTS} value={energy} onChange={setEnergy} columns={3} />
        </div>

        <button
          onClick={handleCompute}
          disabled={!kippt || !energy}
          className="w-full min-h-[52px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100"
          style={{ boxShadow: '0 0 20px hsl(142 76% 46% / 0.3)' }}
        >
          Meinen Saboteur aufdecken →
        </button>
      </div>
    </DayToolShell>
  );
}
