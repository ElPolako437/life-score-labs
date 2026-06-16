import { useState } from 'react';
import { useReset } from '@/contexts/ResetContext';
import { SLEEP_QUESTIONS, SLEEP_SCREWS, computeSleepScrew, type SleepScrew } from '@/lib/sleepCheck';
import DayToolShell from '@/components/reset/DayToolShell';
import SegmentedControl from '@/components/reset/SegmentedControl';
import SprintHint from '@/components/reset/SprintHint';
import { track } from '@/lib/analytics';

interface Day4Saved {
  answers: Record<string, string>;
  screw: SleepScrew;
}

export default function Day4Sleep() {
  const { tools, setTool } = useReset();
  const saved = tools?.day4 as Day4Saved | undefined;
  const [editing, setEditing] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>(saved?.answers ?? {});

  const allAnswered = SLEEP_QUESTIONS.every(q => answers[q.key]);

  const handleCompute = () => {
    if (!allAnswered) return;
    const screw = computeSleepScrew(answers);
    setTool('day4', { answers, screw });
    track('day4_sleep', { screw });
    setEditing(false);
  };

  const result = saved && !editing ? saved : null;

  if (result) {
    const screw = SLEEP_SCREWS[result.screw];
    return (
      <div className="animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Deine Schlaf-Stellschraube</p>
        <h2 className="font-outfit text-2xl font-bold text-foreground mb-5 leading-tight">
          Eine Sache für heute Nacht.
        </h2>

        <div className="p-5 rounded-2xl border border-primary/25 bg-primary/5 shadow-glow-subtle mb-2">
          <p className="text-base font-bold text-foreground mb-1.5">{screw.label}</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{screw.line}</p>
        </div>

        <SprintHint>
          Im Sprint tracken wir deinen Schlaf über 2 Wochen und justieren Stellschraube für Stellschraube — bis dein Rhythmus steht.
        </SprintHint>

        <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mt-4">
          Antworten ändern
        </button>
      </div>
    );
  }

  return (
    <DayToolShell
      eyebrow="Tag 4 · Schlafanker"
      title="Kurzer Schlaf-Check."
      intro="5 schnelle Fragen — daraus bekommst du die eine Stellschraube, die heute Nacht am meisten bringt."
    >
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
          Meine Stellschraube zeigen →
        </button>
      </div>
    </DayToolShell>
  );
}
