/**
 * Pillar Activation Bottom Sheet
 * Shows 2-3 pillar-specific questions before generating a plan.
 * Max 30 seconds to complete.
 */

import { useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Activity, Apple, Moon, Brain, Sparkles } from 'lucide-react';
import type { PillarKey } from '@/lib/focusPillar';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pillar: PillarKey;
  onActivate: (pillar: PillarKey, answers: Record<string, any>) => void;
  recommendation?: { reason: string; readyScore: number } | null;
}

const PILLAR_ICONS: Record<PillarKey, typeof Activity> = {
  bewegung: Activity,
  ernaehrung: Apple,
  regeneration: Moon,
  mental: Brain,
};

const PILLAR_TITLES: Record<PillarKey, string> = {
  bewegung: 'Bewegung aktivieren',
  ernaehrung: 'Ernährung aktivieren',
  regeneration: 'Recovery aktivieren',
  mental: 'Mental aktivieren',
};

interface QuestionConfig {
  id: string;
  label: string;
  type: 'slider' | 'choice';
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  defaultValue?: number;
}

const PILLAR_QUESTIONS: Record<PillarKey, QuestionConfig[]> = {
  bewegung: [
    {
      id: 'trainingDays',
      label: 'Wie viele Tage pro Woche kannst du realistisch trainieren?',
      type: 'slider',
      min: 1, max: 6, defaultValue: 3,
    },
    {
      id: 'gymAccess',
      label: 'Hast du Zugang zu einem Gym?',
      type: 'choice',
      options: [
        { label: 'Ja', value: 'ja' },
        { label: 'Nein', value: 'nein' },
      ],
    },
  ],
  ernaehrung: [
    {
      id: 'challenge',
      label: 'Was ist deine größte Ernährungs-Herausforderung?',
      type: 'choice',
      options: [
        { label: 'Heißhunger', value: 'cravings' },
        { label: 'Keine Zeit zum Kochen', value: 'no_time' },
        { label: 'Weiß nicht was gesund ist', value: 'knowledge' },
        { label: 'Protein zu niedrig', value: 'low_protein' },
      ],
    },
    {
      id: 'cooking',
      label: 'Kochst du gerne?',
      type: 'choice',
      options: [
        { label: 'Ja', value: 'ja' },
        { label: 'Geht so', value: 'mittel' },
        { label: 'Ungern', value: 'nein' },
      ],
    },
  ],
  regeneration: [
    {
      id: 'sleepQuality',
      label: 'Wie ist dein Schlaf aktuell?',
      type: 'choice',
      options: [
        { label: 'Schlecht', value: 'schlecht' },
        { label: 'Mittel', value: 'mittel' },
        { label: 'Gut', value: 'gut' },
      ],
    },
    {
      id: 'eveningRoutine',
      label: 'Hast du eine Abendroutine?',
      type: 'choice',
      options: [
        { label: 'Ja', value: 'ja' },
        { label: 'Nein', value: 'nein' },
      ],
    },
  ],
  mental: [
    {
      id: 'stressSource',
      label: 'Was stresst dich am meisten?',
      type: 'choice',
      options: [
        { label: 'Arbeit', value: 'arbeit' },
        { label: 'Beziehungen', value: 'beziehungen' },
        { label: 'Gesundheit', value: 'gesundheit' },
        { label: 'Allgemein', value: 'allgemein' },
      ],
    },
    {
      id: 'meditationExp',
      label: 'Hast du Erfahrung mit Meditation?',
      type: 'choice',
      options: [
        { label: 'Ja', value: 'ja' },
        { label: 'Nein', value: 'nein' },
      ],
    },
  ],
};

export default function PillarActivationSheet({ open, onOpenChange, pillar, onActivate, recommendation }: Props) {
  const questions = PILLAR_QUESTIONS[pillar];
  const Icon = PILLAR_ICONS[pillar];
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const setAnswer = useCallback((id: string, value: any) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  const allAnswered = questions.every(q => {
    if (q.type === 'slider') return true; // sliders always have a default
    return answers[q.id] !== undefined;
  });

  const handleActivate = useCallback(() => {
    // Fill in slider defaults
    const finalAnswers = { ...answers };
    questions.forEach(q => {
      if (q.type === 'slider' && finalAnswers[q.id] === undefined) {
        finalAnswers[q.id] = q.defaultValue;
      }
    });
    setLoading(true);
    onActivate(pillar, finalAnswers);
    setTimeout(() => {
      setLoading(false);
      onOpenChange(false);
    }, 500);
  }, [answers, questions, pillar, onActivate, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[55vh]">
        <SheetHeader className="pb-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Icon className="w-4 h-4 text-primary" />
            {PILLAR_TITLES[pillar]}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          {recommendation && (
            <div className="flex items-start gap-2 bg-primary/5 rounded-xl px-3 py-2 border border-primary/15">
              <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">{recommendation.reason}</p>
            </div>
          )}

          {questions.map(q => (
            <div key={q.id} className="space-y-2">
              <p className="text-xs font-medium text-foreground">{q.label}</p>
              {q.type === 'slider' ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{q.min}</span>
                    <span className="font-semibold text-foreground">{answers[q.id] ?? q.defaultValue} Tage</span>
                    <span>{q.max}</span>
                  </div>
                  <Slider
                    value={[answers[q.id] ?? q.defaultValue ?? 3]}
                    onValueChange={v => setAnswer(q.id, v[0])}
                    min={q.min}
                    max={q.max}
                    step={1}
                    className="py-2"
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {q.options?.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setAnswer(q.id, opt.value)}
                      className={cn(
                        'rounded-full px-3 py-2 text-xs font-medium border transition-all active:scale-95',
                        answers[q.id] === opt.value
                          ? 'bg-primary/15 border-primary/30 text-primary'
                          : 'bg-secondary/30 border-border/30 text-foreground',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Button
            className="w-full glow-neon"
            onClick={handleActivate}
            disabled={!allAnswered || loading}
          >
            {loading ? 'Plan wird erstellt...' : 'Säule aktivieren'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
