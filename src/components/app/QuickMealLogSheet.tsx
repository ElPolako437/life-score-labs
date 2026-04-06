/**
 * QuickMealLogSheet -- THE canonical meal logging sheet.
 * Opens when a planned meal is tapped anywhere in the app.
 * Provides: Gegessen (log), Tauschen (inline swap candidates), Anpassen (customize), Überspringen (skip).
 * Swap candidates are shown INLINE (no separate MealSwapSheet) to avoid modal purgatory.
 */

import { useState, useMemo, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Check, ArrowLeftRight, SlidersHorizontal, X, Egg, Flame, Clock, Sparkles, ChevronLeft } from 'lucide-react';
import { findSwapCandidates, getMealTypeFromIndex, type SwapCandidate } from '@/lib/mealSwap';

export interface QuickMealLogData {
  id?: string;
  name: string;
  protein: number;
  calories: number;
  description?: string;
  nutritionIngredients?: any[];
  mealType?: string;
  mealIndex: number;
  dayIndex: number;
  checkKey: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: QuickMealLogData | null;
  onEat: () => void;
  onSwap: (recipe: SwapCandidate['recipe']) => void;
  onCustomize?: () => void;
  onSkip: () => void;
}

export default function QuickMealLogSheet({
  open, onOpenChange, meal, onEat, onSwap, onCustomize, onSkip,
}: Props) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSwapInline, setShowSwapInline] = useState(false);

  // Compute swap candidates inline
  const swapCandidates = useMemo(() => {
    if (!meal || !showSwapInline) return [];
    const mealType = getMealTypeFromIndex(meal.mealIndex);
    return findSwapCandidates(meal.id || '', mealType, meal.protein, meal.calories, 3, meal.name);
  }, [meal, showSwapInline]);

  const handleEat = useCallback(() => {
    onEat();
    setShowSuccess(true);
    setShowSwapInline(false);
    setTimeout(() => {
      setShowSuccess(false);
      onOpenChange(false);
    }, 800);
  }, [onEat, onOpenChange]);

  const handleSkip = useCallback(() => {
    onSkip();
    setShowSwapInline(false);
    onOpenChange(false);
  }, [onSkip, onOpenChange]);

  const handleSwapSelect = useCallback((candidate: SwapCandidate) => {
    onSwap(candidate.recipe);
    setShowSwapInline(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onOpenChange(false);
    }, 800);
  }, [onSwap, onOpenChange]);

  const handleCustomize = useCallback(() => {
    if (!onCustomize) return;
    onOpenChange(false);
    setShowSwapInline(false);
    setTimeout(() => onCustomize(), 150);
  }, [onCustomize, onOpenChange]);

  // Reset swap view when sheet closes
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) setShowSwapInline(false);
    onOpenChange(open);
  }, [onOpenChange]);

  if (!meal) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-outfit text-left sr-only">
            Mahlzeit loggen
          </SheetTitle>
        </SheetHeader>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mb-3">
              <Check className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm font-semibold text-primary">Geloggt</p>
          </div>
        ) : showSwapInline ? (
          /* ── Inline Swap View ── */
          <div className="space-y-3 pt-2 pb-4">
            <button
              onClick={() => setShowSwapInline(false)}
              className="flex items-center gap-1 text-xs text-muted-foreground mb-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Zurück
            </button>

            {/* Current meal context */}
            <div className="rounded-xl border border-border/30 bg-secondary/30 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Statt</p>
              <p className="text-sm font-semibold text-foreground">{meal.name}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><Egg className="w-2.5 h-2.5" />{meal.protein}g Protein</span>
                <span className="flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" />{meal.calories} kcal</span>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Alternativen</p>

            {swapCandidates.map((c) => (
              <button
                key={c.recipe.id}
                onClick={() => handleSwapSelect(c)}
                className="w-full rounded-xl border p-3.5 text-left transition-all active:scale-[0.98] border-border/40 hover:border-primary/30"
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
              </button>
            ))}

            {swapCandidates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine Alternativen verfügbar.
              </p>
            )}
          </div>
        ) : (
          /* ── Main Actions View ── */
          <div className="space-y-4 pt-2 pb-4">
            {/* Meal info */}
            <div className="text-center px-4">
              <p className="text-lg font-bold text-foreground leading-tight">{meal.name}</p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="text-xs text-primary font-semibold flex items-center gap-1">
                  <Egg className="w-3 h-3" />{meal.protein}g Protein
                </span>
                <span className="text-[10px] text-muted-foreground/60">|</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Flame className="w-3 h-3" />{meal.calories} kcal
                </span>
              </div>
              {meal.description && meal.description !== meal.name && (
                <p className="text-[11px] text-muted-foreground/70 mt-1.5 line-clamp-1">{meal.description}</p>
              )}
            </div>

            {/* Primary actions */}
            <div className="space-y-2 px-2">
              {/* Gegessen */}
              <button
                onClick={handleEat}
                className="w-full flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3.5 active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">Gegessen</p>
                  <p className="text-[10px] text-muted-foreground">Sofort als gegessen loggen</p>
                </div>
              </button>

              {/* Tauschen - now shows inline swap candidates */}
              <button
                onClick={() => setShowSwapInline(true)}
                className="w-full flex items-center gap-3 rounded-xl border border-amber-400/20 px-4 py-3.5 active:scale-[0.98] transition-all hover:bg-white/5"
                style={{ background: 'var(--gradient-card)' }}
              >
                <div className="w-10 h-10 rounded-full bg-amber-400/15 flex items-center justify-center shrink-0">
                  <ArrowLeftRight className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">Tauschen</p>
                  <p className="text-[10px] text-muted-foreground">Alternative Mahlzeit wählen</p>
                </div>
              </button>

              {/* Anpassen */}
              {onCustomize && (
                <button
                  onClick={handleCustomize}
                  className="w-full flex items-center gap-3 rounded-xl border border-blue-400/20 px-4 py-3.5 active:scale-[0.98] transition-all hover:bg-white/5"
                  style={{ background: 'var(--gradient-card)' }}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-400/15 flex items-center justify-center shrink-0">
                    <SlidersHorizontal className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground">Anpassen</p>
                    <p className="text-[10px] text-muted-foreground">Zutaten bearbeiten</p>
                  </div>
                </button>
              )}
            </div>

            {/* Secondary: Skip */}
            <div className="flex justify-center pt-1">
              <button
                onClick={handleSkip}
                className="text-xs text-muted-foreground/60 font-medium flex items-center gap-1.5 px-4 py-2 rounded-lg active:scale-[0.96] transition-all hover:text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
                Überspringen
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
