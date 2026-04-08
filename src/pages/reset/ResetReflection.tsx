import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useReset, type ReflectionData } from '@/contexts/ResetContext';
import { REFLECTION_TASK_OPTIONS } from '@/lib/dayContent';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const DIMENSIONS = [
  { key: 'energy', label: 'Energie' },
  { key: 'sleep', label: 'Schlafqualität' },
  { key: 'calm', label: 'Innere Ruhe' },
  { key: 'eating', label: 'Essverhalten' },
  { key: 'body', label: 'Körpergefühl' },
] as const;


export default function ResetReflection() {
  const navigate = useNavigate();
  const { setReflection } = useReset();

  const [values, setValues] = useState<Record<string, number>>({
    energy: 1, sleep: 1, calm: 1, eating: 1, body: 1,
  });
  const [easiest, setEasiest] = useState<string | null>(null);
  const [hardest, setHardest] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!easiest || !hardest) return;
    const data: ReflectionData = {
      ...values as any,
      easiest,
      hardest,
    };
    setReflection(data);
    track('reflection_submitted', { ...values, hardest, easiest });
    navigate('/next');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <div className="max-w-sm mx-auto w-full animate-fade-in">
        <h2 className="font-outfit text-2xl font-bold text-foreground mb-2">
          Reflexion
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          7 Tage sind geschafft. Wie hat sich dein Körper verändert?
        </p>

        {/* Sliders */}
        <div className="space-y-6 mb-4">
          {DIMENSIONS.map(d => (
            <div key={d.key}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-foreground font-medium">{d.label}</span>
                <span className="text-sm text-primary font-bold">{values[d.key]}/5</span>
              </div>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[values[d.key]]}
                onValueChange={([v]) => setValues(prev => ({ ...prev, [d.key]: v }))}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mb-10">
          <span className="text-2xs text-muted-foreground/40">Hat sich kaum verändert</span>
          <span className="text-2xs text-muted-foreground/40">Deutlich verbessert</span>
        </div>

        {/* Easiest */}
        <div className="mb-8">
          <p className="text-sm font-medium text-foreground mb-3">Was fiel dir am leichtesten?</p>
          <div className="space-y-2">
            {REFLECTION_TASK_OPTIONS.map(t => (
              <button
                key={t.key}
                onClick={() => setEasiest(t.key)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border text-sm transition-all duration-200',
                  easiest === t.key
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border/40 bg-card text-muted-foreground hover:border-primary/30'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hardest */}
        <div className="mb-8">
          <p className="text-sm font-medium text-foreground mb-3">Was war am schwierigsten?</p>
          <div className="space-y-2">
            {REFLECTION_TASK_OPTIONS.map(t => (
              <button
                key={t.key}
                onClick={() => setHardest(t.key)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border text-sm transition-all duration-200',
                  hardest === t.key
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border/40 bg-card text-muted-foreground hover:border-primary/30'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="premium"
          size="lg"
          className="w-full min-h-[48px]"
          disabled={!hardest}
          onClick={handleSubmit}
        >
          Meine Caliness Sprint-Empfehlung ansehen →
        </Button>
      </div>
    </div>
  );
}
