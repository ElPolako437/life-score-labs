/**
 * MealSwapSheet -- lets user swap a planned meal for an intelligent alternative.
 * Shows 3 alternatives scored by similarity. Premium feel, mobile-first.
 */

import { useMemo, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { findSwapCandidates, getMealTypeFromIndex, type SwapCandidate } from '@/lib/mealSwap';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, Clock, Egg, Flame, Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealName: string;
  mealId: string;
  mealIndex: number;
  protein: number;
  calories: number;
  onSwap: (recipe: SwapCandidate['recipe']) => void;
}

export default function MealSwapSheet({ open, onOpenChange, mealName, mealId, mealIndex, protein, calories, onSwap }: Props) {
  const mealType = useMemo(() => getMealTypeFromIndex(mealIndex), [mealIndex]);

  const candidates = useMemo(() =>
    findSwapCandidates(mealId, mealType, protein, calories, 3, mealName),
    [mealId, mealType, protein, calories, mealName],
  );

  const handleSelect = useCallback((candidate: SwapCandidate) => {
    onSwap(candidate.recipe);
    onOpenChange(false);
  }, [onSwap, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
        <SheetHeader>
          <SheetTitle className="font-outfit text-left">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-primary" />
              Mahlzeit tauschen
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3 pt-3 pb-2">
          {/* Current meal context */}
          <div className="rounded-xl border border-border/30 bg-secondary/30 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Statt</p>
            <p className="text-sm font-semibold text-foreground">{mealName}</p>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5"><Egg className="w-2.5 h-2.5" />{protein}g Protein</span>
              <span className="flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" />{calories} kcal</span>
            </div>
          </div>

          {/* Alternatives */}
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Alternativen</p>

          {candidates.map((c, i) => (
            <button
              key={c.recipe.id}
              onClick={() => handleSelect(c)}
              className={cn(
                'w-full rounded-xl border p-3.5 text-left transition-all active:scale-[0.98]',
                'border-border/40 hover:border-primary/30',
              )}
              style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{c.recipe.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                      <Egg className="w-2.5 h-2.5" />{c.recipe.protein}g
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" />{c.recipe.calories} kcal
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />{c.recipe.prepTime} Min
                    </span>
                  </div>
                  {c.matchReason && (
                    <p className="text-[9px] text-primary/70 mt-1 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />{c.matchReason}
                    </p>
                  )}
                </div>
                <div className={cn(
                  'text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-1',
                  c.matchScore >= 80 ? 'bg-primary/10 text-primary' :
                  c.matchScore >= 60 ? 'bg-amber-400/10 text-amber-400' :
                  'bg-secondary text-muted-foreground'
                )}>
                  {c.matchScore}% Match
                </div>
              </div>
              {c.recipe.longevityBenefit && (
                <p className="text-[9px] text-muted-foreground/60 mt-2 leading-relaxed line-clamp-2">
                  {c.recipe.longevityBenefit}
                </p>
              )}
            </button>
          ))}

          {candidates.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Alternativen verfuegbar.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
