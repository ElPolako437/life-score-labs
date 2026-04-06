import { useState } from 'react';
import { EXTENDED_GOAL_OPTIONS, type ExtendedGoal } from '@/lib/goalAssessment';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface GoalSelectionProps {
  onComplete: (primary: ExtendedGoal, secondary?: ExtendedGoal) => void;
  initialPrimary?: ExtendedGoal;
  initialSecondary?: ExtendedGoal;
}

export default function GoalSelection({ onComplete, initialPrimary, initialSecondary }: GoalSelectionProps) {
  const [primary, setPrimary] = useState<ExtendedGoal | null>(initialPrimary || null);
  const [secondary, setSecondary] = useState<ExtendedGoal | null>(initialSecondary || null);
  const [showSecondary, setShowSecondary] = useState(!!initialSecondary);

  const handleSelect = (goal: ExtendedGoal) => {
    if (showSecondary) {
      if (goal === primary) return;
      setSecondary(goal === secondary ? null : goal);
    } else {
      setPrimary(goal === primary ? null : goal);
    }
  };

  return (
    <div className="space-y-5 animate-enter">
      {/* Header */}
      <div>
        <h2 className="font-outfit text-xl font-bold text-foreground">
          {showSecondary ? 'Sekundäres Ziel (optional)' : 'Was ist dein Hauptziel?'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {showSecondary ? 'Wähle optional ein zweites Ziel.' : 'Wähle das Ziel, das dich am meisten antreibt.'}
        </p>
      </div>

      {/* Goal Cards */}
      <div className="space-y-2.5">
        {EXTENDED_GOAL_OPTIONS.map(g => {
          const isSelected = showSecondary ? secondary === g.type : primary === g.type;
          const isDisabled = showSecondary && g.type === primary;
          return (
            <button
              key={g.type}
              onClick={() => !isDisabled && handleSelect(g.type)}
              disabled={isDisabled}
              className={cn(
                'w-full rounded-xl border p-4 flex items-center gap-4 text-left transition-all active:scale-[0.99]',
                isSelected
                  ? 'border-primary/50 bg-primary/8'
                  : isDisabled
                  ? 'border-border/20 bg-secondary/10 opacity-40'
                  : 'border-border/40 bg-secondary/20 hover:border-border/60',
              )}
              style={!isSelected && !isDisabled ? { background: 'var(--gradient-card)' } : undefined}
            >
              <span className="text-2xl">{g.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold', isSelected ? 'text-foreground' : 'text-muted-foreground')}>
                  {g.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="space-y-2.5 pt-2">
        {!showSecondary && primary && (
          <button
            onClick={() => setShowSecondary(true)}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            + Optionales Nebenziel hinzufügen
          </button>
        )}
        <Button
          className="w-full"
          disabled={!primary}
          onClick={() => primary && onComplete(primary, secondary || undefined)}
        >
          Weiter <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
