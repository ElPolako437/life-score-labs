import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useReset } from '@/contexts/ResetContext';
import { SLEEP_QUESTIONS, SLEEP_SCREWS, computeSleepScrew, computeSleepScore, type SleepScrew } from '@/lib/sleepCheck';
import DayToolShell from '@/components/reset/DayToolShell';
import SegmentedControl from '@/components/reset/SegmentedControl';
import ProgressRing from '@/components/reset/ProgressRing';
import SprintHint from '@/components/reset/SprintHint';
import { track } from '@/lib/analytics';

interface Day4Saved {
  answers: Record<string, string>;
  screw: SleepScrew;
  score: number;
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Starke Basis';
  if (score >= 70) return 'Solide, mit Luft nach oben';
  if (score >= 55) return 'Da geht mehr';
  return 'Hier liegt dein Hebel';
}

export default function Day4Sleep() {
  const reduce = useReducedMotion();
  const { tools, setTool } = useReset();
  const saved = tools?.day4 as Day4Saved | undefined;
  const [editing, setEditing] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>(saved?.answers ?? {});

  const answeredCount = SLEEP_QUESTIONS.filter(q => answers[q.key]).length;
  const allAnswered = answeredCount === SLEEP_QUESTIONS.length;
  const score = computeSleepScore(answers);

  const handleCompute = () => {
    if (!allAnswered) return;
    const screw = computeSleepScrew(answers);
    setTool('day4', { answers, screw, score });
    track('day4_sleep', { screw, score });
    setEditing(false);
  };

  // ─── Result mode ─────────────────────────────────────────────────────────
  if (saved && !editing && saved.screw && SLEEP_SCREWS[saved.screw]) {
    const screw = SLEEP_SCREWS[saved.screw];
    return (
      <div className="animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Dein Schlaf-Check</p>
        <h2 className="font-outfit text-2xl font-bold text-foreground mb-5 leading-tight">
          Eine Sache für heute Nacht.
        </h2>

        <div className="flex items-center gap-5 p-5 rounded-2xl border border-primary/25 [background:var(--gradient-card)] shadow-card mb-3">
          <ProgressRing progress={(saved.score ?? score) / 100} size={96} stroke={7}>
            <span className="font-outfit text-2xl font-bold text-foreground tabular-nums leading-none">{saved.score ?? score}</span>
            <span className="text-[9px] text-muted-foreground/50 mt-0.5">Schlaf-Score</span>
          </ProgressRing>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">Dein größter Schlaf-Räuber</p>
            <p className="text-base font-bold text-primary leading-snug">{screw.label}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/50 bg-card/60 mb-2">
          <p className="text-sm text-foreground/85 leading-relaxed">{screw.line}</p>
        </div>

        <SprintHint>
          In der CALINESS App verfolgt CALI deinen Schlaf über Wochen und justiert Stellschraube für Stellschraube — bis dein Rhythmus steht.
        </SprintHint>

        <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mt-4">
          Antworten ändern
        </button>
      </div>
    );
  }

  // ─── Builder mode ────────────────────────────────────────────────────────
  return (
    <DayToolShell
      eyebrow="Tag 4 · Schlafanker"
      title="Beantworte 5 Fragen — dein Schlaf-Score baut sich live auf."
      intro="Mit jeder Antwort siehst du, wie dein Schlaf wirklich dasteht. Am Ende: die eine Stellschraube, die heute Nacht am meisten bringt."
    >
      {/* Live score ring */}
      <div className="sticky top-2 z-20 mb-6 flex items-center gap-5 rounded-2xl border border-primary/25 [background:var(--gradient-card)] shadow-card p-4">
        <ProgressRing progress={answeredCount === 0 ? 0 : score / 100} size={92} stroke={7}>
          <motion.span
            key={score}
            initial={reduce ? false : { scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="font-outfit text-2xl font-bold text-foreground tabular-nums leading-none"
          >
            {answeredCount === 0 ? '–' : score}
          </motion.span>
          <span className="text-[9px] text-muted-foreground/50 mt-0.5">Schlaf-Score</span>
        </ProgressRing>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">{answeredCount}/{SLEEP_QUESTIONS.length} beantwortet</p>
          <p className="text-sm font-semibold text-foreground leading-snug">{answeredCount === 0 ? 'Beantworte die Fragen unten' : scoreLabel(score)}</p>
        </div>
      </div>

      <div className="space-y-5">
        {SLEEP_QUESTIONS.map(q => (
          <div key={q.key}>
            <p className="text-sm text-foreground font-medium mb-2">{q.label}</p>
            <SegmentedControl
              options={q.options.map(o => ({ value: o.value, label: o.label }))}
              value={answers[q.key] ?? null}
              onChange={v => setAnswers(prev => ({ ...prev, [q.key]: v }))}
              columns={q.columns}
            />
          </div>
        ))}

        <button
          onClick={handleCompute}
          disabled={!allAnswered}
          className="w-full min-h-[52px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100"
          style={{ boxShadow: '0 0 20px hsl(142 76% 46% / 0.3)' }}
        >
          {allAnswered ? 'Meinen Schlaf-Räuber aufdecken →' : `Noch ${SLEEP_QUESTIONS.length - answeredCount} Fragen`}
        </button>
      </div>
    </DayToolShell>
  );
}
