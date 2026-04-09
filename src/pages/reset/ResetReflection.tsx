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
  const { setReflection, name, baseline } = useReset();

  const [values, setValues] = useState<Record<string, number>>({
    energy: 3, sleep: 3, calm: 3, eating: 3, body: 3,
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
    navigate('/sprint-ready');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <div className="max-w-sm mx-auto w-full animate-fade-in">
        <h2 className="font-outfit text-2xl font-bold text-foreground mb-2">
          {name ? `${name}, 7 Tage.` : '7 Tage.'}
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          Das haben die wenigsten durchgezogen. Jetzt schaust du ehrlich hin — wie hat sich dein Körper verändert?
        </p>

        {/* Sliders */}
        <div className="space-y-6 mb-4">
          {DIMENSIONS.map(d => {
            const baseVal = baseline ? (baseline as Record<string, number>)[d.key] : null;
            const currentVal = values[d.key];
            const diff = baseVal != null ? currentVal - baseVal : null;
            return (
              <div key={d.key}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground font-medium">{d.label}</span>
                    {diff != null && diff !== 0 && (
                      <span className={cn(
                        'text-[11px] font-semibold px-1.5 py-0.5 rounded-full',
                        diff > 0
                          ? 'text-primary bg-primary/10'
                          : 'text-red-400/80 bg-red-400/10'
                      )}>
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {baseVal != null && (
                      <span className="text-[11px] text-muted-foreground/40">Start: {baseVal}/5</span>
                    )}
                    <span className="text-sm text-primary font-bold">{currentVal}/5</span>
                  </div>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[values[d.key]]}
                  onValueChange={([v]) => setValues(prev => ({ ...prev, [d.key]: v }))}
                />
              </div>
            );
          })}
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
          Meine Caliness-Sprint-Empfehlung ansehen →
        </Button>
      </div>
    </div>
  );
}
