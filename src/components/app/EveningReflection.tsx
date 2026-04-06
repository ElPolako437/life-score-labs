import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import CompanionCreature from './CompanionCreature';
import { cn } from '@/lib/utils';
import type { CompanionData } from '@/lib/companionState';

const MOOD_OPTIONS = [
  { emoji: '😓', label: 'Schwer', value: 2 },
  { emoji: '😤', label: 'Anstrengend', value: 4 },
  { emoji: '😐', label: 'Okay', value: 6 },
  { emoji: '😊', label: 'Gut', value: 8 },
  { emoji: '🌟', label: 'Richtig gut', value: 10 },
];

interface EveningReflectionProps {
  open: boolean;
  onClose: () => void;
  companion: CompanionData;
  tomorrowBlock?: string | null;
  goalPlan?: any;
}

export default function EveningReflection({ open, onClose, companion, tomorrowBlock, goalPlan }: EveningReflectionProps) {
  const [reflectionStep, setReflectionStep] = useState(0);
  const [eveningMood, setEveningMood] = useState<number | null>(null);
  const [eveningWin, setEveningWin] = useState('');

  const handleComplete = () => {
    // Store in localStorage for now (could extend to Supabase later)
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`caliness_evening_${today}`, JSON.stringify({
      mood: eveningMood, win: eveningWin, completedAt: new Date().toISOString(),
    }));
    onClose();
  };

  // Create a "sleeping" companion state
  const sleepingCompanion = {
    ...companion,
    state: 'stabil' as const,
    coreGlow: 0.15,
    breathCycle: 12,
    tension: 0,
    warmth: 0.3,
    eyeExpression: 'heavy' as const,
  };

  return (
    <Drawer open={open} onOpenChange={v => !v && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="text-center">
            {reflectionStep === 0 && '🌙 Wie war dein Tag?'}
            {reflectionStep === 1 && '✨ Was hat heute funktioniert?'}
            {reflectionStep === 2 && '🌙 Gute Nacht'}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-6 pb-8 space-y-6">
          {/* Step 1: Evening Mood */}
          {reflectionStep === 0 && (
            <div className="space-y-4">
              <div className="flex gap-2 justify-center">
                {MOOD_OPTIONS.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setEveningMood(opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200',
                      eveningMood === opt.value
                        ? 'border-primary bg-primary/10 scale-105'
                        : 'border-border/50 bg-card',
                    )}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className={cn('text-[10px] font-medium', eveningMood === opt.value ? 'text-primary' : 'text-muted-foreground')}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
              <Button
                variant="premium"
                className="w-full"
                disabled={eveningMood === null}
                onClick={() => setReflectionStep(1)}
              >
                Weiter
              </Button>
            </div>
          )}

          {/* Step 2: Evening Win */}
          {reflectionStep === 1 && (
            <div className="space-y-4">
              <Textarea
                placeholder="Optional — was lief heute gut?"
                value={eveningWin}
                onChange={e => setEveningWin(e.target.value)}
                className="min-h-[80px] bg-secondary/30 border-border/30"
              />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setReflectionStep(2)}>
                  Überspringen
                </Button>
                <Button variant="premium" className="flex-1" onClick={() => setReflectionStep(2)}>
                  Weiter
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Companion settles */}
          {reflectionStep === 2 && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="opacity-60 transition-opacity duration-[2000ms]">
                <CompanionCreature companionState={sleepingCompanion} size={140} interactive={false} />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                CALI ruht sich aus. Morgen geht es weiter.
              </p>
              {goalPlan?.goalDescription && (
                <p className="text-xs text-primary/80 font-medium">
                  Dein Ziel: {goalPlan.goalDescription} — jeder Tag zählt.
                </p>
              )}
              {tomorrowBlock && (
                <p className="text-xs text-primary/70">
                  Morgen zuerst: {tomorrowBlock}
                </p>
              )}
              <Button variant="premium" className="w-full" onClick={handleComplete}>
                Gute Nacht
              </Button>
              <div className="flex items-center justify-center gap-1.5 mt-3 opacity-20">
                <img src="/images/caliness-logo-white.png" alt="" className="w-3.5 h-3.5 object-contain" />
                <span className="text-[9px] text-muted-foreground">Gute Nacht von CALINESS</span>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
