import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Egg, Flame, Leaf } from 'lucide-react';
import type { Recipe } from '@/lib/pillarPlans';

interface Props {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLog?: () => void;
}

export default function RecipeDetail({ recipe, open, onOpenChange, onLog }: Props) {
  if (!recipe) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-outfit text-lg">{recipe.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-3 pb-4">
          {/* Macros row */}
          <div className="flex gap-3">
            {[
              { label: 'Kalorien', value: `${recipe.calories}`, icon: Flame, color: 'text-amber-400' },
              { label: 'Protein', value: `${recipe.protein}g`, icon: Egg, color: 'text-primary' },
              { label: 'Carbs', value: `${recipe.carbs}g`, color: 'text-blue-400' },
              { label: 'Fett', value: `${recipe.fat}g`, color: 'text-orange-400' },
            ].map((m, i) => (
              <div key={i} className="flex-1 rounded-xl border border-border/30 p-2.5 text-center" style={{ background: 'var(--gradient-card)' }}>
                <p className={cn('font-outfit text-sm font-bold', m.color)}>{m.value}</p>
                <p className="text-[9px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Prep time */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{recipe.prepTime} Minuten Zubereitung</span>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Zutaten</h3>
            <div className="space-y-1.5">
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                  <span className="text-foreground">{ing.amount}</span>
                  <span className="text-muted-foreground">{ing.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Zubereitung</h3>
            <div className="space-y-2.5">
              {recipe.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Longevity benefit */}
          {recipe.longevityBenefit && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
              <Leaf className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-foreground leading-relaxed">{recipe.longevityBenefit}</p>
            </div>
          )}

          {/* Log button */}
          {onLog && (
            <Button className="w-full h-12 text-base glow-neon" onClick={() => { onLog(); onOpenChange(false); }}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Gegessen — loggen
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
