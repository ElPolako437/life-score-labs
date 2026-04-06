import { type RealismData, EXTENDED_GOAL_OPTIONS, type ExtendedGoal } from '@/lib/goalAssessment';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, Bot, Activity, Apple, Egg, TrendingUp, AlertTriangle } from 'lucide-react';

interface GoalRealismProps {
  goal: ExtendedGoal;
  realism: RealismData;
  onContinue: () => void;
  onBack: () => void;
}

export default function GoalRealism({ goal, realism, onContinue, onBack }: GoalRealismProps) {
  const goalOption = EXTENDED_GOAL_OPTIONS.find(g => g.type === goal);
  const ratingColor = realism.realismRating === 'sehr gut' ? 'text-primary' : realism.realismRating === 'mittel-gut' ? 'text-amber-400' : 'text-destructive';
  const ratingBg = realism.realismRating === 'sehr gut' ? 'bg-primary' : realism.realismRating === 'mittel-gut' ? 'bg-amber-400' : 'bg-destructive';

  return (
    <div className="space-y-4 animate-enter">
      {/* Header */}
      <div>
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Realism Check</span>
        <h2 className="font-outfit text-xl font-bold text-foreground mt-1">Dein Ziel-Profil</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{goalOption?.emoji} {goalOption?.label}</p>
      </div>

      {/* Realism Meter */}
      <div className="rounded-2xl border border-border/40 p-4" style={{ background: 'var(--gradient-card)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Realismus</span>
          <span className={cn('text-sm font-bold', ratingColor)}>{realism.realismRating}</span>
        </div>
        <div className="h-3 rounded-full bg-secondary/40 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-1000', ratingBg)}
            style={{ width: `${realism.realismPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-muted-foreground">niedrig</span>
          <span className="text-[9px] text-muted-foreground">sehr gut</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard icon={TrendingUp} label="Empfohlenes Tempo" value={realism.weeklyRate} />
        <MetricCard icon={Apple} label="Kalorien-Ziel" value={`${realism.calorieRange.min}–${realism.calorieRange.max}`} unit="kcal" />
        <MetricCard icon={Egg} label="Protein-Ziel" value={`${realism.proteinTarget}g`} unit="/Tag" highlight />
        <MetricCard icon={Activity} label="Training" value={realism.trainingDirection.split(' ').slice(0, 3).join(' ')} />
      </div>

      {/* Macro Framework */}
      <div className="rounded-xl border border-border/30 p-3 bg-secondary/10">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Makro-Rahmen</p>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-primary">{realism.proteinTarget}g Protein</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground">{realism.fatTarget}g Fett</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground">{realism.carbRange.min}–{realism.carbRange.max}g Carbs</span>
        </div>
      </div>

      {/* Bottleneck & Pillar */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Größter Engpass</p>
          <p className="text-xs font-medium text-foreground mt-1">{realism.biggestBottleneck}</p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
          <TrendingUp className="w-3.5 h-3.5 text-primary mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Wichtigste Säule</p>
          <p className="text-xs font-medium text-foreground mt-1">{realism.importantPillar}</p>
        </div>
      </div>

      {/* Companion Speech Bubble */}
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary border border-border/40 flex items-center justify-center shrink-0 mt-1">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div className="rounded-2xl rounded-tl-md px-4 py-3 text-sm text-foreground leading-relaxed border border-primary/20 bg-primary/5 flex-1">
          {realism.companionMessage}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-none">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button className="flex-1" onClick={onContinue}>
          4-Säulen-Analyse <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, unit, highlight }: {
  icon: typeof TrendingUp; label: string; value: string; unit?: string; highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/30 p-3" style={{ background: 'var(--gradient-card)' }}>
      <Icon className={cn('w-3.5 h-3.5 mb-1', highlight ? 'text-primary' : 'text-muted-foreground')} />
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-bold mt-0.5', highlight ? 'text-primary' : 'text-foreground')}>
        {value}{unit && <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}
