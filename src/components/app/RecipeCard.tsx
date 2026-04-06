import { cn } from '@/lib/utils';
import { Clock, Egg } from 'lucide-react';
import type { Recipe } from '@/lib/pillarPlans';

interface Props {
  recipe: Recipe;
  onView: () => void;
  onLog?: () => void;
  compact?: boolean;
}

export default function RecipeCard({ recipe, onView, onLog, compact }: Props) {
  return (
    <div
      className="rounded-2xl border border-border/40 p-3.5 cursor-pointer active:scale-[0.99] transition-all"
      style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{recipe.name}</p>
          {!compact && recipe.longevityBenefit && (
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{recipe.longevityBenefit}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" /> {recipe.prepTime} Min
            </span>
            <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
              <Egg className="w-2.5 h-2.5" /> {recipe.protein}g Protein
            </span>
            <span className="text-[10px] text-muted-foreground">{recipe.calories} kcal</span>
          </div>
        </div>
        {onLog && (
          <button
            onClick={(e) => { e.stopPropagation(); onLog(); }}
            className="text-[10px] text-primary-foreground font-semibold bg-primary px-2.5 py-1.5 rounded-full shrink-0 active:scale-95 transition-transform"
          >
            Gegessen
          </button>
        )}
      </div>
    </div>
  );
}
