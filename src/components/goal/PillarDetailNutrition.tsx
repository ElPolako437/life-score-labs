import { useState } from 'react';
import { type NutritionPlan, generateNutritionPlan, swapMeal } from '@/lib/pillarPlans';
import { type RealismData, type ExtendedGoal } from '@/lib/goalAssessment';
import { Button } from '@/components/ui/button';
import { Apple, ChevronLeft, ChevronDown, ChevronUp, RefreshCw, Egg, Utensils } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface Props {
  realism: RealismData;
  goal: ExtendedGoal;
  onBack: () => void;
  onPlanGenerated?: (plan: NutritionPlan) => void;
}

export default function PillarDetailNutrition({ realism, goal, onBack, onPlanGenerated }: Props) {
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      const newPlan = generateNutritionPlan(realism, goal);
      setPlan(newPlan);
      onPlanGenerated?.(newPlan);
      setLoading(false);
    }, 1200);
  };

  const handleSwap = (dayIdx: number, mealIdx: number) => {
    if (!plan) return;
    setPlan(swapMeal(plan, dayIdx, mealIdx));
  };

  return (
    <div className="space-y-4 animate-enter">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <ChevronLeft className="w-4 h-4" /> Zurück
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Apple className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-outfit text-lg font-bold text-foreground">Ernährungsplan</h2>
          <p className="text-xs text-muted-foreground">{realism.calorieRange.min}–{realism.calorieRange.max} kcal · {realism.proteinTarget}g Protein</p>
        </div>
      </div>

      {!plan && !loading && (
        <div className="rounded-2xl border border-border/30 p-6 text-center space-y-4" style={{ background: 'var(--gradient-card)' }}>
          <Utensils className="w-10 h-10 text-primary/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Erstelle deinen personalisierten Ernährungsplan basierend auf deinem Zielprofil.</p>
          <Button onClick={generate} className="w-full">Ernährungsplan erstellen</Button>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-border/30 p-8 text-center space-y-3" style={{ background: 'var(--gradient-card)' }}>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary/40" style={{ animation: 'floatParticle 1.2s ease-in-out infinite', animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Erstelle deinen Plan…</p>
        </div>
      )}

      {plan && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{plan.title}</span>
            <button onClick={generate} className="flex items-center gap-1 text-xs text-primary font-medium">
              <RefreshCw className="w-3 h-3" /> Neu generieren
            </button>
          </div>

          <div className="space-y-2">
            {plan.days.map((day, dayIdx) => (
              <Collapsible key={day.day} open={expandedDay === dayIdx} onOpenChange={() => setExpandedDay(expandedDay === dayIdx ? null : dayIdx)}>
                <CollapsibleTrigger asChild>
                  <button className="w-full rounded-xl border border-border/30 p-3 flex items-center gap-3 active:scale-[0.99] transition-all" style={{ background: 'var(--gradient-card)' }}>
                    <span className="text-sm font-semibold text-foreground flex-1 text-left">{day.day}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{day.totalCalories} kcal</span>
                      <span className="text-primary font-semibold">{day.totalProtein}g P</span>
                    </div>
                    {expandedDay === dayIdx ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2 pt-2 pl-1">
                    {day.meals.map((meal, mealIdx) => {
                      const mealKey = `${dayIdx}-${mealIdx}`;
                      const isExpanded = expandedMeal === mealKey;
                      return (
                        <div key={mealKey} className="rounded-xl border border-border/20 p-3 space-y-2" style={{ background: 'var(--gradient-card)' }}>
                          <div className="flex items-center justify-between">
                            <button onClick={() => setExpandedMeal(isExpanded ? null : mealKey)} className="flex-1 text-left">
                              <p className="text-sm font-medium text-foreground">{meal.name}</p>
                              <p className="text-xs text-muted-foreground">{meal.calories} kcal · {meal.protein}g Protein</p>
                            </button>
                            <button onClick={() => handleSwap(dayIdx, mealIdx)} className="text-[10px] text-primary font-medium px-2 py-1 rounded-lg bg-primary/10 shrink-0">
                              Tauschen
                            </button>
                          </div>
                          {isExpanded && (
                            <div className="pt-1 space-y-2.5 animate-enter">
                              {meal.prepTime && (
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <span>⏱ {meal.prepTime} Min</span>
                                  {meal.carbs !== undefined && <span>· {meal.carbs}g K · {meal.fat}g F</span>}
                                </div>
                              )}
                              <div className="space-y-1">
                                <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Zutaten</p>
                                <div className="flex flex-wrap gap-1">
                                  {(meal.ingredientAmounts || meal.ingredients.map(i => ({ name: i, amount: '' }))).map((ing, i) => (
                                    <span key={i} className="text-[10px] bg-secondary/40 text-muted-foreground px-2 py-0.5 rounded-full">
                                      {typeof ing === 'string' ? ing : `${ing.amount} ${ing.name}`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {meal.steps && meal.steps.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Zubereitung</p>
                                  {meal.steps.map((step, i) => (
                                    <p key={i} className="text-[11px] text-muted-foreground flex gap-1.5">
                                      <span className="text-primary font-bold shrink-0">{i + 1}.</span> {step}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {meal.longevityBenefit && (
                                <p className="text-[11px] text-primary/80 italic">🌿 {meal.longevityBenefit}</p>
                              )}
                              {meal.tip && <p className="text-[11px] text-muted-foreground/70 italic">💡 {meal.tip}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
