/**
 * MealCustomizeSheet -- optional ingredient-level customization for a planned meal.
 * Users can adjust ingredient amounts; nutrition values update in real-time.
 * Stays optional: default flow remains quick one-tap logging.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { calcMealNutrition, type MealIngredient } from '@/lib/pillarPlans';
import { cn } from '@/lib/utils';
import { CheckCircle2, Egg, Flame, Minus, Plus, SlidersHorizontal } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealName: string;
  ingredients: MealIngredient[];
  originalProtein: number;
  originalCalories: number;
  onConfirm: (customIngredients: MealIngredient[], totals: { protein: number; calories: number }) => void;
}

export default function MealCustomizeSheet({
  open, onOpenChange, mealName, ingredients, originalProtein, originalCalories, onConfirm,
}: Props) {
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    ingredients.forEach(ing => { map[ing.name] = ing.amount; });
    return map;
  });

  // Reset amounts when sheet opens with new ingredients
  const ingredientKey = ingredients.map(i => i.name).join(',');
  useEffect(() => {
    const map: Record<string, number> = {};
    ingredients.forEach(ing => { map[ing.name] = ing.amount; });
    setCustomAmounts(map);
  }, [ingredientKey]);

  const customIngredients = useMemo<MealIngredient[]>(() =>
    ingredients.map(ing => ({
      ...ing,
      amount: customAmounts[ing.name] ?? ing.amount,
    })),
    [ingredients, customAmounts],
  );

  const totals = useMemo(() => calcMealNutrition(customIngredients), [customIngredients]);

  const adjustAmount = useCallback((name: string, delta: number) => {
    setCustomAmounts(prev => {
      const current = prev[name] ?? 0;
      const step = delta > 0 ? getStep(current) : -getStep(current);
      const newVal = Math.max(0, current + step);
      return { ...prev, [name]: Math.round(newVal) };
    });
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(customIngredients, totals);
    onOpenChange(false);
  }, [customIngredients, totals, onConfirm, onOpenChange]);

  const proteinDelta = Math.round(totals.protein - originalProtein);
  const calorieDelta = Math.round(totals.calories - originalCalories);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-outfit text-left">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Zutaten anpassen
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-3 pb-2">
          <p className="text-xs text-muted-foreground">{mealName}</p>

          {/* Totals bar */}
          <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <Egg className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-bold text-foreground">{Math.round(totals.protein)}g</span>
                {proteinDelta !== 0 && (
                  <span className={cn('text-[10px] font-semibold',
                    proteinDelta > 0 ? 'text-primary' : 'text-destructive'
                  )}>
                    {proteinDelta > 0 ? '+' : ''}{proteinDelta}g
                  </span>
                )}
              </div>
              <p className="text-[9px] text-muted-foreground">Protein</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-sm font-bold text-foreground">{Math.round(totals.calories)}</span>
                {calorieDelta !== 0 && (
                  <span className={cn('text-[10px] font-semibold',
                    calorieDelta > 0 ? 'text-orange-400' : 'text-primary'
                  )}>
                    {calorieDelta > 0 ? '+' : ''}{calorieDelta}
                  </span>
                )}
              </div>
              <p className="text-[9px] text-muted-foreground">Kalorien</p>
            </div>
          </div>

          {/* Ingredient list */}
          {customIngredients.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Keine Zutaten verfügbar
            </p>
          )}
          <div className="space-y-1.5">
            {customIngredients.map(ing => {
              const amount = customAmounts[ing.name] ?? ing.amount;
              const ingProtein = Math.round(ing.protein_per_100 * amount / 100);
              const ingCal = Math.round(ing.calories_per_100 * amount / 100);
              return (
                <div key={ing.name} className="flex items-center gap-2 rounded-lg border border-border/30 px-3 py-2.5"
                  style={{ background: 'var(--gradient-card)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{ing.name}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {ingProtein}g P · {ingCal} kcal
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => adjustAmount(ing.name, -1)}
                      className="w-7 h-7 rounded-lg border border-border/40 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Minus className="w-3 h-3 text-muted-foreground" />
                    </button>
                    <span className="text-xs font-semibold text-foreground w-12 text-center">
                      {amount}{ing.unit}
                    </span>
                    <button
                      onClick={() => adjustAmount(ing.name, 1)}
                      className="w-7 h-7 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Plus className="w-3 h-3 text-primary" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Button className="w-full h-12 text-base glow-neon" onClick={handleConfirm} disabled={customIngredients.length === 0}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Speichern & Loggen
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Adaptive step size based on current amount */
function getStep(current: number): number {
  if (current <= 10) return 5;
  if (current <= 50) return 10;
  if (current <= 200) return 25;
  return 50;
}
