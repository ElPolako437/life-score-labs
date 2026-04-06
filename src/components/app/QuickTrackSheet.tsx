/**
 * Quick Track Bottom Sheet — opens per pillar for fast activity logging.
 * Max 3 taps to log anything.
 */

import { useState, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Activity, Apple, Moon, Brain } from 'lucide-react';
import { toast } from 'sonner';
import type { PillarKey } from '@/lib/focusPillar';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pillar: PillarKey;
}

const PRESETS: Record<PillarKey, { label: string; emoji: string }[]> = {
  bewegung: [
    { label: 'Krafttraining', emoji: '🏋️' },
    { label: 'Cardio', emoji: '🏃' },
    { label: 'Spaziergang', emoji: '🚶' },
    { label: 'Yoga', emoji: '🧘' },
    { label: 'Sport', emoji: '⚽' },
  ],
  ernaehrung: [
    { label: 'Frühstück', emoji: '🥚' },
    { label: 'Mittagessen', emoji: '🥗' },
    { label: 'Abendessen', emoji: '🍽️' },
    { label: 'Snack', emoji: '🥜' },
  ],
  regeneration: [
    { label: 'Sauna', emoji: '🧖' },
    { label: 'Stretching', emoji: '🤸' },
    { label: 'Nickerchen', emoji: '😴' },
    { label: 'Meditation', emoji: '🧘' },
    { label: 'Spaziergang', emoji: '🚶' },
  ],
  mental: [
    { label: 'Atemübung', emoji: '🌬️' },
    { label: 'Journaling', emoji: '📝' },
    { label: 'Dankbarkeit', emoji: '🙏' },
    { label: 'Digital Detox', emoji: '📵' },
    { label: 'Lesen', emoji: '📚' },
  ],
};

const PROTEIN_PILLS = [
  { label: 'Niedrig', value: 'niedrig', grams: 10 },
  { label: 'Mittel', value: 'mittel', grams: 20 },
  { label: 'Hoch', value: 'hoch', grams: 35 },
];

const PILLAR_TITLES: Record<PillarKey, string> = {
  bewegung: 'Bewegung tracken',
  ernaehrung: 'Mahlzeit loggen',
  regeneration: 'Recovery tracken',
  mental: 'Mental tracken',
};

const PILLAR_ICONS: Record<PillarKey, typeof Activity> = {
  bewegung: Activity,
  ernaehrung: Apple,
  regeneration: Moon,
  mental: Brain,
};

function getMealTypeByHour(): string {
  const h = new Date().getHours();
  if (h < 10) return 'frühstück';
  if (h < 14) return 'mittag';
  if (h < 17) return 'snack';
  return 'abend';
}

export default function QuickTrackSheet({ open, onOpenChange, pillar }: Props) {
  const { addActivityLog, addNutritionLog } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [duration, setDuration] = useState(20);
  const [mealText, setMealText] = useState('');
  const [proteinLevel, setProteinLevel] = useState('mittel');

  const Icon = PILLAR_ICONS[pillar];
  const presets = PRESETS[pillar];

  const reset = useCallback(() => {
    setSelected(null);
    setDuration(20);
    setMealText('');
    setProteinLevel('mittel');
  }, []);

  const handleLog = useCallback(() => {
    if (pillar === 'ernaehrung') {
      const text = mealText.trim() || selected || 'Mahlzeit';
      const protein = PROTEIN_PILLS.find(p => p.value === proteinLevel)?.grams || 20;
      const mealType = getMealTypeByHour();
      addNutritionLog({
        date: new Date().toISOString().split('T')[0],
        meals: [{
          name: text,
          type: mealType,
          description: text,
          proteinLevel,
          estimatedProtein: protein,
          time: new Date().toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' }),
        }],
        estimatedProteinTotal: protein,
        qualityRating: proteinLevel === 'hoch' ? 'gut' : 'okay',
      });
      addActivityLog({
        pillar: 'ernaehrung',
        type: 'meal',
        label: text,
        source: 'manual',
        details: { protein, mealType },
      });
    } else {
      const label = selected || presets[0].label;
      addActivityLog({
        pillar,
        type: label.toLowerCase().replace(/\s+/g, '_'),
        label,
        duration,
        source: 'manual',
      });
    }

    if (navigator.vibrate) navigator.vibrate(10);
    toast.success(`${pillar === 'ernaehrung' ? mealText || selected || 'Mahlzeit' : selected || presets[0].label} geloggt`);
    reset();
    onOpenChange(false);
  }, [pillar, selected, duration, mealText, proteinLevel, addActivityLog, addNutritionLog, presets, reset, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
        <SheetHeader className="pb-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Icon className="w-4 h-4 text-primary" />
            {PILLAR_TITLES[pillar]}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          {pillar === 'ernaehrung' ? (
            <>
              <Input
                placeholder="Was hast du gegessen?"
                value={mealText}
                onChange={e => setMealText(e.target.value)}
                className="text-sm"
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                {presets.map(p => (
                  <button
                    key={p.label}
                    onClick={() => { setSelected(p.label); if (!mealText) setMealText(p.label); }}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium border transition-all',
                      selected === p.label
                        ? 'bg-primary/15 border-primary/30 text-primary'
                        : 'bg-secondary/30 border-border/30 text-foreground',
                    )}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {PROTEIN_PILLS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setProteinLevel(p.value)}
                    className={cn(
                      'flex-1 rounded-lg py-2 text-xs font-medium border transition-all',
                      proteinLevel === p.value
                        ? 'bg-primary/15 border-primary/30 text-primary'
                        : 'bg-secondary/30 border-border/30 text-muted-foreground',
                    )}
                  >
                    {p.label} ({p.grams}g)
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {presets.map(p => (
                  <button
                    key={p.label}
                    onClick={() => setSelected(p.label)}
                    className={cn(
                      'rounded-full px-3 py-2 text-xs font-medium border transition-all',
                      selected === p.label
                        ? 'bg-primary/15 border-primary/30 text-primary'
                        : 'bg-secondary/30 border-border/30 text-foreground',
                    )}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Dauer</span>
                  <span className="font-semibold text-foreground">{duration} Min</span>
                </div>
                <Slider
                  value={[duration]}
                  onValueChange={v => setDuration(v[0])}
                  min={5}
                  max={120}
                  step={5}
                  className="py-2"
                />
              </div>
            </>
          )}

          <Button
            className="w-full glow-neon"
            onClick={handleLog}
            disabled={pillar !== 'ernaehrung' && !selected}
          >
            Loggen
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
