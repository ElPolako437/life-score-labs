import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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

const ICONS: Record<SaboteurKey, string> = {
  hunger: '🌙', sleep: '😴', stress: '🌀', protein: '🍗', movement: '🚶', chaos: '🧩',
};
const KEYS = Object.keys(SABOTEURS) as SaboteurKey[];

interface Day5Saved {
  saboteur: SaboteurKey;
  kippt: KipptTime;
  energy: EnergyLevel;
}

export default function Day5Saboteur() {
  const reduce = useReducedMotion();
  const { hurdle, baseline, tools, getDayData, setTool } = useReset();
  const saved = tools?.day5 as Day5Saved | undefined;
  const [editing, setEditing] = useState(false);
  const [kippt, setKippt] = useState<KipptTime | null>(saved?.kippt ?? null);
  const [energy, setEnergy] = useState<EnergyLevel | null>(saved?.energy ?? null);

  const [phase, setPhase] = useState<'input' | 'scanning'>('input');
  const [flash, setFlash] = useState(0);
  const flashTimer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => () => clearInterval(flashTimer.current), []);

  const runAnalysis = () => {
    if (!kippt || !energy) return;
    const sleepIssue = !!(tools?.day4 as { screw?: string } | undefined)?.screw
      && (tools!.day4 as { screw?: string }).screw !== 'none';
    let struggleDays = 0;
    for (let d = 1; d <= 5; d++) {
      const r = getDayData(d).rating;
      if (r === 'difficult' || r === 'failed') struggleDays++;
    }
    const saboteur = computeSaboteur({ hurdle, baseline, sleepIssue, struggleDays, kippt, energy });
    track('day5_saboteur', { saboteur });

    if (reduce) {
      setTool('day5', { saboteur, kippt, energy });
      return;
    }
    // Scanning anticipation → reveal
    setPhase('scanning');
    flashTimer.current = setInterval(() => setFlash(f => f + 1), 110);
    setTimeout(() => {
      clearInterval(flashTimer.current);
      setTool('day5', { saboteur, kippt, energy }); // re-render into result mode
    }, 1700);
  };

  // ─── Result mode ─────────────────────────────────────────────────────────
  if (saved && !editing && saved.saboteur && SABOTEURS[saved.saboteur]) {
    const sab = SABOTEURS[saved.saboteur];
    return (
      <div>
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Deine Saboteur-Analyse</p>
        <h2 className="font-outfit text-2xl font-bold text-foreground mb-5 leading-tight">
          Das blockiert dich gerade am wahrscheinlichsten.
        </h2>

        <motion.div
          className="relative p-6 rounded-2xl border border-primary/40 shadow-glow overflow-hidden text-center mb-3 [background:var(--gradient-glow)]"
          initial={reduce ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18 }}
        >
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
          <div className="text-4xl mb-2">{ICONS[saved.saboteur]}</div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">Wahrscheinlichster Saboteur</p>
          <p className="font-outfit text-2xl font-bold text-primary" style={{ textShadow: '0 0 24px hsl(142 76% 46% / 0.4)' }}>{sab.label}</p>
        </motion.div>

        <motion.div
          className="p-4 rounded-2xl border border-border/50 bg-card/60 mb-2"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">Dein Gegenhebel heute</p>
          <p className="text-sm text-foreground/85 leading-relaxed">{sab.counter}</p>
        </motion.div>

        <SprintHint>
          Im Sprint erkennen David & Sarah dein Muster gemeinsam mit dir — und bauen den Gegenhebel fest in deine Woche ein.
        </SprintHint>

        <button onClick={() => { setEditing(true); setPhase('input'); }} className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mt-4">
          Antworten ändern
        </button>
      </div>
    );
  }

  // ─── Scanning mode ───────────────────────────────────────────────────────
  if (phase === 'scanning') {
    const flashKey = KEYS[flash % KEYS.length];
    return (
      <div className="py-10 text-center min-h-[280px] flex flex-col items-center justify-center">
        <motion.div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'radial-gradient(circle, hsl(142 76% 46% / 0.25) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-4xl">{ICONS[flashKey]}</span>
        </motion.div>
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Analysiere dein Muster</p>
        <p className="font-outfit text-xl font-bold text-foreground/80 mb-6 h-7">{SABOTEURS[flashKey].label}</p>
        <div className="w-48 h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.7, ease: 'easeInOut' }}
            style={{ boxShadow: '0 0 10px hsl(142 76% 46% / 0.6)' }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground/40 mt-4">Aus 5 Tagen Daten + deinen Antworten</p>
      </div>
    );
  }

  // ─── Input mode ──────────────────────────────────────────────────────────
  return (
    <DayToolShell
      eyebrow="Tag 5 · Stress & Craving"
      title="Was hält dich gerade wirklich auf?"
      intro="Zwei kurze Fragen — kombiniert mit deinen 5 Tagen Daten deckt die Analyse deinen wahrscheinlichsten Blocker auf."
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
          onClick={runAnalysis}
          disabled={!kippt || !energy}
          className="w-full min-h-[52px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100"
          style={{ boxShadow: '0 0 20px hsl(142 76% 46% / 0.3)' }}
        >
          Analyse starten →
        </button>
      </div>
    </DayToolShell>
  );
}
