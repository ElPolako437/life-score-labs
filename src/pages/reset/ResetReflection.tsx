import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useReset, type ReflectionData } from '@/contexts/ResetContext';
import { REFLECTION_TASK_OPTIONS } from '@/lib/dayContent';
import { cn } from '@/lib/utils';

const DIMENSIONS = [
  { key: 'energy', label: 'Energie' },
  { key: 'sleep', label: 'Schlafqualität' },
  { key: 'calm', label: 'Innere Ruhe' },
  { key: 'eating', label: 'Steuerbarkeit beim Essen' },
  { key: 'body', label: 'Körpergefühl' },
] as const;

const HARDEST_FEEDBACK: Record<string, string> = {
  offline: 'Wenn Offline-Zeit am schwierigsten war, zeigt das, wie stark Reize deinen Alltag dominieren.',
  meals: 'Wenn Mahlzeiten dein Stolperstein waren, fehlt oft nicht Wissen — sondern eine klare Tagesstruktur.',
  movement: 'Wenn Bewegung schwerfiel, liegt es selten an Faulheit — sondern an Überforderung im Alltag.',
  sleep: 'Wenn Schlaf schwierig war, braucht dein Nervensystem mehr Vorlaufzeit zum Runterfahren.',
  evening: 'Wenn der Abend dein größter Stolperstein war, liegt das selten an Willenskraft — sondern an fehlender Tagesstruktur.',
  preparation: 'Wenn Vorbereitung schwerfiel, fehlt nicht die Zeit — sondern ein einfaches System, das zu deinem Alltag passt.',
};

export default function ResetReflection() {
  const navigate = useNavigate();
  const { setReflection } = useReset();

  const [values, setValues] = useState<Record<string, number>>({
    energy: 3, sleep: 3, calm: 3, eating: 3, body: 3,
  });
  const [easiest, setEasiest] = useState<string | null>(null);
  const [hardest, setHardest] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    if (!easiest || !hardest) return;
    const data: ReflectionData = {
      ...values as any,
      easiest,
      hardest,
    };
    setReflection(data);
    setShowResult(true);
  };

  if (showResult) {
    const strong = DIMENSIONS.filter(d => values[d.key] >= 4);
    const weak = DIMENSIONS.filter(d => values[d.key] <= 2);

    return (
      <div className="min-h-screen bg-background flex flex-col px-6 py-8">
        <div className="max-w-sm mx-auto w-full animate-fade-in">
          <h2 className="font-outfit text-2xl font-bold text-foreground mb-6">
            Dein Ergebnis
          </h2>

          {/* Visual bars */}
          <div className="space-y-4 mb-8">
            {DIMENSIONS.map(d => (
              <div key={d.key}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">{d.label}</span>
                  <span className="text-sm font-semibold text-foreground">{values[d.key]}/5</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(values[d.key] / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Strong areas */}
          {strong.length > 0 && (
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 mb-4">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Gut aufgestellt:</span>{' '}
                {strong.map(s => s.label).join(', ')}
              </p>
            </div>
          )}

          {/* Weak areas */}
          {weak.length > 0 && (
            <div className="p-4 rounded-xl border border-border/40 bg-card mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Hier lohnt es sich genauer hinzuschauen:</span>{' '}
                {weak.map(w => w.label).join(', ')}
              </p>
            </div>
          )}

          {/* Hardest feedback */}
          {hardest && HARDEST_FEEDBACK[hardest] && (
            <div className="p-4 rounded-xl border border-border/30 bg-card/60 mb-8">
              <p className="text-sm text-muted-foreground/80 italic leading-relaxed">
                {HARDEST_FEEDBACK[hardest]}
              </p>
            </div>
          )}

          {/* Pre-conversion bridge */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-8 animate-fade-in">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Dieser Reset hat dir gezeigt, worauf dein Körper reagiert. Der nächste Schritt ist kein neuer Versuch — sondern ein Plan, der genau darauf aufbaut.
            </p>
          </div>

          <Button
            variant="premium"
            size="lg"
            className="w-full min-h-[48px]"
            onClick={() => navigate('/next')}
          >
            Wie geht es jetzt weiter?
          </Button>
        </div>
      </div>
    );
  }

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
        <div className="space-y-6 mb-10">
          {DIMENSIONS.map(d => (
            <div key={d.key}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-foreground font-medium">{d.label}</span>
                <span className="text-sm text-primary font-bold">{values[d.key]}</span>
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
          disabled={!easiest || !hardest}
          onClick={handleSubmit}
        >
          Ergebnis anzeigen
        </Button>
      </div>
    </div>
  );
}
