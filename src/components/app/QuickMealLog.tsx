import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useApp, type NutritionLogEntry } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MEAL_TYPE_AUTO = (): 'frühstück' | 'mittag' | 'abend' | 'snack' => {
  const h = new Date().getHours();
  if (h < 10) return 'frühstück';
  if (h < 14) return 'mittag';
  if (h < 17) return 'snack';
  return 'abend';
};

const MEAL_TYPE_PILLS = [
  { value: 'frühstück' as const, label: 'Frühstück', emoji: '🌅' },
  { value: 'mittag' as const, label: 'Mittag', emoji: '☀️' },
  { value: 'abend' as const, label: 'Abend', emoji: '🌙' },
  { value: 'snack' as const, label: 'Snack', emoji: '🥜' },
];

interface AIEstimate {
  estimatedGrams: number;
  estimatedCalories?: number;
  level: 'niedrig' | 'mittel' | 'hoch';
  explanation: string;
  suggestion?: string;
  tip?: string;
  qualityDot?: 'green' | 'yellow' | 'red';
}

export default function QuickMealLog({ open, onOpenChange }: Props) {
  const { addNutritionLog, nutritionLogs } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mealText, setMealText] = useState('');
  const [mealType, setMealType] = useState<'frühstück' | 'mittag' | 'abend' | 'snack'>(MEAL_TYPE_AUTO());
  const [aiEstimate, setAiEstimate] = useState<AIEstimate | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [logging, setLogging] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-focus input when sheet opens
  useEffect(() => {
    if (open) {
      setMealType(MEAL_TYPE_AUTO());
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setMealText('');
      setAiEstimate(null);
    }
  }, [open]);

  // Frequent meals from history
  const frequentMeals = useMemo(() => {
    const counts: Record<string, { name: string; count: number; type: string; protein: number }> = {};
    nutritionLogs.forEach(log => {
      log.meals.forEach((m: any) => {
        const key = m.name?.toLowerCase().trim();
        if (!key || key.length < 3) return;
        if (!counts[key]) counts[key] = { name: m.name, count: 0, type: m.type || 'mittag', protein: m.estimatedProtein || 15 };
        counts[key].count++;
      });
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [nutritionLogs]);

  // Debounced AI estimation
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (mealText.trim().length < 3) { setAiEstimate(null); return; }
    debounceRef.current = setTimeout(async () => {
      setAiLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('nutrition-ai', {
          body: {
            mode: 'estimate-protein',
            userContext: { userMessage: `Schätze Protein und Kalorien für: ${mealText} (Typ: ${mealType})` },
          },
        });
        if (!error && data && !data.error) {
          setAiEstimate({
            estimatedGrams: data.estimatedGrams || 15,
            estimatedCalories: data.estimatedCalories,
            level: data.level || 'mittel',
            explanation: data.explanation || '',
            suggestion: data.suggestion,
            tip: data.tip,
            qualityDot: data.estimatedGrams >= 25 ? 'green' : data.estimatedGrams >= 12 ? 'yellow' : 'red',
          });
        }
      } catch {
        // Fallback — no AI estimate available
      } finally {
        setAiLoading(false);
      }
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [mealText, mealType]);

  const logMeal = useCallback((name: string, type: string, proteinLevel: string, estimatedProtein: number) => {
    setLogging(true);
    const today = new Date().toISOString().split('T')[0];
    addNutritionLog({
      date: today,
      meals: [{
        name, type, description: name, proteinLevel,
        estimatedProtein,
        time: new Date().toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' }),
      }],
      estimatedProteinTotal: estimatedProtein,
      qualityRating: proteinLevel === 'hoch' ? 'gut' : proteinLevel === 'mittel' ? 'okay' : 'schlecht',
    });
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);
    toast.success(`${name} geloggt`);
    setMealText('');
    setAiEstimate(null);
    setLogging(false);
    onOpenChange(false);
  }, [addNutritionLog, onOpenChange]);

  const handleSubmit = useCallback(() => {
    if (!mealText.trim()) return;
    const ep = aiEstimate?.estimatedGrams || 15;
    const level = aiEstimate?.level || 'mittel';
    logMeal(mealText.trim(), mealType, level, ep);
  }, [mealText, mealType, aiEstimate, logMeal]);

  const handleFrequentMeal = useCallback((meal: { name: string; type: string; protein: number }) => {
    logMeal(meal.name, meal.type, meal.protein >= 30 ? 'hoch' : meal.protein >= 15 ? 'mittel' : 'niedrig', meal.protein);
  }, [logMeal]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
        <SheetHeader>
          <SheetTitle className="font-outfit">Mahlzeit loggen</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-3 pb-2">
          {/* Main input — auto-focus */}
          <Input
            ref={inputRef}
            value={mealText}
            onChange={e => setMealText(e.target.value)}
            placeholder="Was hast du gegessen?"
            className="text-base h-12"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />

          {/* AI Analysis */}
          {aiLoading && (
            <div className="flex items-center gap-2 px-1">
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Analysiere...</span>
            </div>
          )}
          {aiEstimate && !aiLoading && (
            <div className="rounded-xl border border-border/40 p-3 space-y-1.5" style={{ background: 'var(--gradient-card)' }}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  aiEstimate.qualityDot === 'green' ? 'bg-primary' : aiEstimate.qualityDot === 'yellow' ? 'bg-amber-400' : 'bg-destructive'
                )} />
                <span className="text-xs font-semibold text-foreground">
                  ~{aiEstimate.estimatedGrams}g Protein
                  {aiEstimate.estimatedCalories && ` · ~${aiEstimate.estimatedCalories} kcal`}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{aiEstimate.explanation}</p>
              {aiEstimate.tip && (
                <p className="text-[10px] text-primary/80 italic">💡 {aiEstimate.tip}</p>
              )}
            </div>
          )}

          {/* Meal type pills — auto-detected */}
          <div className="flex gap-2">
            {MEAL_TYPE_PILLS.map(t => (
              <button key={t.value} onClick={() => setMealType(t.value)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-center border transition-all',
                  mealType === t.value ? 'border-primary bg-primary/10 text-primary' : 'border-border/40 text-muted-foreground'
                )}>
                <span className="block text-sm">{t.emoji}</span>
                <span className="text-[9px] font-medium">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Frequent meals — one-tap */}
          {frequentMeals.length > 0 && !mealText && (
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5 block">Schnell</span>
              <div className="flex flex-wrap gap-1.5">
                {frequentMeals.map((m, i) => (
                  <button key={i} onClick={() => handleFrequentMeal(m)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border/40 text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all">
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Log button */}
          <Button
            className="w-full h-12 text-base glow-neon"
            onClick={handleSubmit}
            disabled={!mealText.trim() || logging}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Loggen
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
