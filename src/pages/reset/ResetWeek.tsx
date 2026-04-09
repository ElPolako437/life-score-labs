import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReset } from '@/contexts/ResetContext';
import { DAY_CONTENT, GOAL_LOCKED_TEASERS, type GoalKey } from '@/lib/dayContent';
import { Check, ArrowRight, AlertTriangle } from 'lucide-react';
import InstallPromptSheet from '@/components/InstallPromptSheet';
import { isMobile, isStandalone } from '@/lib/installPrompt';

const INSTALL_D3_KEY = 'caliness_install_d3_shown';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const LAST_VISIT_KEY = 'caliness_week_last_visit';

function getHoursSinceLastVisit(): number {
  const last = Number(localStorage.getItem(LAST_VISIT_KEY) || '0');
  if (!last) return 0;
  return (Date.now() - last) / (1000 * 60 * 60);
}

function getUnlockLabel(dayNum: number, currentDay: number): string | null {
  if (dayNum !== currentDay) return null; // only for the immediately next day
  const last = Number(localStorage.getItem(LAST_VISIT_KEY) || '0');
  if (!last) return 'Öffnet morgen';
  const hoursSince = (Date.now() - last) / (1000 * 60 * 60);
  const hoursLeft = Math.max(0, Math.ceil(24 - hoursSince));
  if (hoursLeft <= 1) return 'Öffnet gleich';
  if (hoursLeft < 24) return `Öffnet in ~${hoursLeft}h`;
  return 'Öffnet morgen';
}

const LOCKED_TEASERS: Record<number, string> = {
  2: '🔒 Morgen: Warum Snacking dein größter Feind ist',
  3: '🔒 Warum ein Spaziergang mehr bringt als HIIT',
  4: '🔒 Dein Körper regeneriert nicht im Schlaf',
  5: '🔒 Dein Abend-Problem ist ein Nachmittags-Problem',
  6: '🔒 Decision Fatigue und Fettverlust',
  7: '🔒 Warum ein Reset nicht reicht',
};

export default function ResetWeek() {
  const navigate = useNavigate();
  const { currentDay, getDayData, reflection, goal, name } = useReset();
  const allDone = currentDay > 7;
  const [streakAtRisk, setStreakAtRisk] = useState(false);
  const [justCompletedDay, setJustCompletedDay] = useState<number | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  // Count consecutive completed days from day 1
  const streak = (() => {
    let count = 0;
    for (let i = 1; i < currentDay; i++) {
      if (getDayData(i).completed) count++;
      else break;
    }
    return count;
  })();

  useEffect(() => {
    const hours = getHoursSinceLastVisit();
    if (streak > 0 && hours > 20 && currentDay <= 7) {
      setStreakAtRisk(true);
    }
    localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));

    const justDone = localStorage.getItem('caliness_just_completed');
    if (justDone) {
      setJustCompletedDay(Number(justDone));
      localStorage.removeItem('caliness_just_completed');
      setTimeout(() => setJustCompletedDay(null), 3500);
    }

    // Trigger 2: show install prompt again on Day 3+ if not yet standalone
    if (streak >= 2 && isMobile() && !isStandalone() && !localStorage.getItem(INSTALL_D3_KEY)) {
      const timer = setTimeout(() => {
        setShowInstall(true);
        localStorage.setItem(INSTALL_D3_KEY, '1');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <div className="max-w-sm mx-auto w-full animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <img src="/images/caliness-logo-white.png" alt="" className="w-5 h-5 object-contain opacity-40" />
          <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">7-Tage Reset</span>
        </div>

        <div className="flex items-center justify-between mb-1">
          <h1 className="font-outfit text-2xl font-bold text-foreground">
            {name ? `${name}, Tag ${Math.min(currentDay, 7)}` : `Tag ${Math.min(currentDay, 7)} von 7`}
          </h1>
          {streak > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-xl font-bold text-primary leading-none">🔥 {streak}</span>
              <span className="text-[10px] text-muted-foreground/50 leading-none mt-0.5">{streak === 1 ? 'Tag' : 'Tage'} Streak</span>
            </div>
          )}
        </div>

        <Progress value={(Math.min(currentDay, 7) / 7) * 100} variant="neon" className="mb-8 h-2" />

        {/* Return celebration banner */}
        {justCompletedDay && (
          <div className="mb-4 p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-3 animate-fade-in">
            <span className="text-lg">🔥</span>
            <p className="text-sm font-semibold text-primary">Tag {justCompletedDay} abgeschlossen — weiter so!</p>
          </div>
        )}

        {/* Streak at risk banner */}
        {streakAtRisk && (
          <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-400">Dein Streak steht auf dem Spiel.</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Schließe heute Tag {Math.min(currentDay, 7)} ab, um deinen 🔥{streak}-Tage-Streak zu halten.</p>
            </div>
          </div>
        )}

        {/* All-done CTA */}
        {allDone && (
          <div className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5 animate-fade-in">
            <p className="text-sm font-semibold text-foreground mb-1">Du hast alle 7 Tage abgeschlossen.</p>
            <p className="text-xs text-muted-foreground/70 mb-4">
              {reflection ? 'Sieh dir dein persönliches Caliness-Sprint-Angebot an.' : 'Zeit für die Reflexion — und dein Ergebnis.'}
            </p>
            <Button
              variant="premium"
              size="sm"
              className="w-full gap-2"
              onClick={() => navigate(reflection ? '/sprint-ready' : '/reflection')}
            >
              {reflection ? 'Zum Caliness-Sprint-Angebot' : 'Reset auswerten'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

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
                    <p className="text-xs text-primary mt-0.5">Jetzt starten · ~10 Min →</p>
                  )}
                  {isCompleted && data.rating && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {data.rating === 'good' ? 'Lief gut' : data.rating === 'difficult' ? 'War schwierig' : 'Nicht geschafft'}
                    </p>
                  )}
                  {isFuture && (() => {
                    const teaser = goal && GOAL_LOCKED_TEASERS[goal as GoalKey]?.[dayNum]
                      ? GOAL_LOCKED_TEASERS[goal as GoalKey][dayNum]
                      : LOCKED_TEASERS[dayNum] ?? '';
                    const isNext = dayNum === currentDay + 1;
                    const unlockLabel = isNext ? getUnlockLabel(dayNum, currentDay) : null;
                    return (
                      <p className="text-xs text-muted-foreground/40 mt-0.5 leading-snug">
                        {unlockLabel ? `${unlockLabel} — ${teaser.replace('🔒 ', '')}` : teaser}
                      </p>
                    );
                  })()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showInstall && (
        <InstallPromptSheet onDismiss={() => setShowInstall(false)} />
      )}
    </div>
  );
}
