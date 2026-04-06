import { cn } from '@/lib/utils';

interface GoalTimelineProps {
  totalWeeks: number;
  currentWeek: number;
  weekScores?: number[]; // score per past week, 0-100
}

export default function GoalTimeline({ totalWeeks, currentWeek, weekScores = [] }: GoalTimelineProps) {
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  return (
    <div className="rounded-xl border border-border/30 p-3" style={{ background: 'var(--gradient-card)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Zeitstrahl</span>
        <span className="text-[10px] text-primary font-semibold">Woche {currentWeek} / {totalWeeks}</span>
      </div>
      <div className="flex items-center gap-0.5">
        {weeks.map(w => {
          const isPast = w < currentWeek;
          const isCurrent = w === currentWeek;
          const score = weekScores[w - 1] ?? 0;
          const bgColor = isCurrent
            ? 'bg-primary'
            : isPast
              ? score >= 60 ? 'bg-primary/70' : score >= 30 ? 'bg-amber-400/70' : 'bg-destructive/50'
              : 'bg-secondary/40';

          return (
            <div
              key={w}
              className={cn(
                'flex-1 h-2 rounded-full transition-all duration-500',
                bgColor,
                isCurrent && 'ring-1 ring-primary ring-offset-1 ring-offset-background',
              )}
              style={isCurrent ? { animation: 'glowPulseGreen 2s ease-in-out infinite' } : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
