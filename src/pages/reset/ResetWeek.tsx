import { useNavigate } from 'react-router-dom';
import { useReset } from '@/contexts/ResetContext';
import { DAY_CONTENT } from '@/lib/dayContent';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function ResetWeek() {
  const navigate = useNavigate();
  const { currentDay, getDayData } = useReset();

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <div className="max-w-sm mx-auto w-full animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <img src="/images/caliness-logo-white.png" alt="" className="w-5 h-5 object-contain opacity-40" />
          <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">7-Tage Reset</span>
        </div>

        <h1 className="font-outfit text-2xl font-bold text-foreground mb-1">
          Tag {Math.min(currentDay, 7)} von 7
        </h1>

        <Progress value={(Math.min(currentDay, 7) / 7) * 100} variant="neon" className="mb-8 h-2" />

        {/* Day cards */}
        <div className="space-y-3">
          {DAY_CONTENT.map((day, i) => {
            const dayNum = i + 1;
            const data = getDayData(dayNum);
            const isActive = dayNum === currentDay && currentDay <= 7;
            const isCompleted = data.completed;
            const isFuture = dayNum > currentDay;

            return (
              <button
                key={dayNum}
                disabled={isFuture}
                onClick={() => {
                  if (isActive || isCompleted) navigate(`/day/${dayNum}`);
                }}
                className={cn(
                  'w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4',
                  isActive && 'border-primary/60 bg-primary/5 shadow-glow-subtle',
                  isCompleted && !isActive && 'border-border/30 bg-card/60 opacity-70',
                  isFuture && 'border-border/20 bg-card/30 opacity-40 cursor-not-allowed',
                  !isActive && !isCompleted && !isFuture && 'border-border/60 bg-card'
                )}
              >
                {/* Day number / check */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                    isCompleted
                      ? 'bg-primary/20 text-primary'
                      : isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : dayNum}
                </div>

                <div className="min-w-0">
                  <p className={cn(
                    'text-sm font-semibold truncate',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    Tag {dayNum} — {day.title}
                  </p>
                  {isActive && (
                    <p className="text-xs text-primary mt-0.5">Jetzt starten →</p>
                  )}
                  {isCompleted && data.rating && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {data.rating === 'good' ? 'Lief gut' : data.rating === 'difficult' ? 'War schwierig' : 'Nicht geschafft'}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
