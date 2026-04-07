import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReset, type Goal, type Hurdle } from '@/contexts/ResetContext';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';

const GOALS: { value: Goal; label: string }[] = [
  { value: 'energy', label: 'Mehr Energie im Alltag' },
  { value: 'fatloss', label: 'Fett verlieren — ohne Druck' },
  { value: 'structure', label: 'Wieder Struktur finden' },
  { value: 'sleep', label: 'Besser schlafen' },
];

const HURDLES: { value: Hurdle; label: string }[] = [
  { value: 'stress', label: 'Stress & Überforderung' },
  { value: 'time', label: 'Zeitmangel' },
  { value: 'nutrition', label: 'Unklare Ernährung' },
  { value: 'consistency', label: 'Fehlende Konstanz' },
  { value: 'evening', label: 'Abends kippt es' },
];

export default function ResetOnboarding() {
  const navigate = useNavigate();
  const { setGoal, setHurdle } = useReset();
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedHurdle, setSelectedHurdle] = useState<Hurdle | null>(null);

  const handleGoalSelect = (goal: Goal) => {
    setSelectedGoal(goal);
    setGoal(goal);
    setTimeout(() => setStep(1), 160);
  };

  const handleHurdleSelect = (hurdle: Hurdle) => {
    setSelectedHurdle(hurdle);
    setHurdle(hurdle);
    track('onboarding_complete', { goal: selectedGoal, hurdle });
    setTimeout(() => navigate('/focus'), 160);
  };

  const progress = ((step + 1) / 2) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, boxShadow: '0 0 8px hsl(142 76% 46% / 0.5)' }}
        />
      </div>

      <div className="flex-1 flex flex-col animate-fade-in max-w-sm mx-auto w-full">
        {step === 0 ? (
          <>
            <h2 className="font-outfit text-2xl font-bold text-foreground mb-2">
              Was willst du gerade am meisten verändern?
            </h2>
            <p className="text-muted-foreground text-sm mb-8">Wähle das, was sich am dringendsten anfühlt.</p>
            <div className="space-y-3 flex-1">
              {GOALS.map(g => (
                <button
                  key={g.value}
                  onClick={() => handleGoalSelect(g.value)}
                  className={cn(
                    'w-full text-left p-4 rounded-2xl border transition-all duration-200',
                    selectedGoal === g.value
                      ? 'border-primary bg-primary/10 text-foreground shadow-glow-subtle'
                      : 'border-border/60 bg-card text-card-foreground hover:border-primary/40 hover:bg-elevated-surface'
                  )}
                >
                  <span className="font-medium text-sm">{g.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="font-outfit text-2xl font-bold text-foreground mb-2">
              Was hält dich aktuell am meisten zurück?
            </h2>
            <p className="text-muted-foreground text-sm mb-8">Sei ehrlich — das hilft bei der Einordnung.</p>
            <div className="space-y-3 flex-1">
              {HURDLES.map(h => (
                <button
                  key={h.value}
                  onClick={() => handleHurdleSelect(h.value)}
                  className={cn(
                    'w-full text-left p-4 rounded-2xl border transition-all duration-200',
                    selectedHurdle === h.value
                      ? 'border-primary bg-primary/10 text-foreground shadow-glow-subtle'
                      : 'border-border/60 bg-card text-card-foreground hover:border-primary/40 hover:bg-elevated-surface'
                  )}
                >
                  <span className="font-medium text-sm">{h.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground/40 text-center pt-6 pb-4">
          Tippe eine Option an — es geht automatisch weiter
        </p>
      </div>
    </div>
  );
}
