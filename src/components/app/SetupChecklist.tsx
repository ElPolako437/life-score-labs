import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DailyCheckIn, GoalPlanData } from '@/contexts/AppContext';

interface SetupChecklistProps {
  checkInHistory: DailyCheckIn[];
  goalPlan: GoalPlanData | null;
  userCreatedAt: string | undefined;
}

interface Step {
  id: string;
  label: string;
  done: boolean;
  route?: string;
}

const DISMISSED_KEY = 'caliness_setup_dismissed';
const COMPLETED_AT_KEY = 'caliness_setup_completed_at';

function isDismissed(): boolean {
  return localStorage.getItem(DISMISSED_KEY) === 'true';
}

function getCompletedAt(): number | null {
  const raw = localStorage.getItem(COMPLETED_AT_KEY);
  return raw ? parseInt(raw, 10) : null;
}

function setCompletedAt(ts: number): void {
  localStorage.setItem(COMPLETED_AT_KEY, String(ts));
}

export default function SetupChecklist({
  checkInHistory,
  goalPlan,
  userCreatedAt,
}: SetupChecklistProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<boolean>(isDismissed);

  const steps = useMemo<Step[]>(() => [
    {
      id: 'profil',
      label: 'Profil erstellt',
      done: true,
    },
    {
      id: 'checkin',
      label: 'Erster Check-in',
      done: checkInHistory.length > 0,
      route: '/app/checkin',
    },
    {
      id: 'ziel',
      label: 'Ziel setzen',
      done: goalPlan !== null && !!goalPlan.goalType,
      route: '/app/zielsystem',
    },
    {
      id: 'plan',
      label: 'Plan erstellen',
      done: !!(goalPlan?.activePillars && goalPlan.activePillars.length > 0),
      route: '/app/zielsystem',
    },
  ], [checkInHistory.length, goalPlan]);

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === 4;
  const progressPercent = (completedCount / 4) * 100;

  // When all done, record timestamp once
  useEffect(() => {
    if (allDone && !getCompletedAt()) {
      setCompletedAt(Date.now());
    }
  }, [allDone]);

  // Determine account age in days
  const accountAgeDays = useMemo(() => {
    if (!userCreatedAt) return 0;
    return Math.floor((Date.now() - new Date(userCreatedAt).getTime()) / 86_400_000);
  }, [userCreatedAt]);

  // Visibility logic:
  // Hide if dismissed via X button
  // Hide if all done AND 2 days have passed since completion
  // Hide if account is older than 14 days AND all steps done
  const shouldHide = useMemo(() => {
    if (dismissed) return true;
    if (allDone) {
      const completedAt = getCompletedAt();
      if (completedAt) {
        const daysSinceComplete = (Date.now() - completedAt) / 86_400_000;
        if (daysSinceComplete >= 2) return true;
      }
    }
    if (accountAgeDays > 14 && allDone) return true;
    return false;
  }, [dismissed, allDone, accountAgeDays]);

  if (shouldHide) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  }

  function handleStepClick(step: Step) {
    if (step.done || !step.route) return;
    navigate(step.route);
  }

  return (
    <div className="rounded-2xl border border-border/25 overflow-hidden" style={{ background: 'var(--gradient-card)' }}>
      {/* Progress bar */}
      <div className="h-[3px] w-full bg-secondary/30">
        <div
          className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-0.5">
              Einstieg
            </p>
            <h2 className="font-outfit text-[14px] font-bold text-foreground leading-tight">
              {allDone ? 'Perfekter Start!' : 'Dein Start bei CALINESS'}
            </h2>
            {!allDone && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {completedCount} von 4 Schritten abgeschlossen
              </p>
            )}
            {allDone && (
              <p className="text-[11px] text-primary/70 mt-0.5">
                Du hast alle 4 Schritte abgeschlossen.
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground/70 hover:bg-secondary/40 transition-colors shrink-0 ml-2 mt-0.5"
            aria-label="Checkliste ausblenden"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Steps */}
        <ul className="space-y-2">
          {steps.map((step) => {
            const isClickable = !step.done && !!step.route;
            return (
              <li key={step.id}>
                <button
                  onClick={() => handleStepClick(step)}
                  disabled={step.done || !step.route}
                  className={cn(
                    'w-full flex items-center gap-3 py-2 px-2.5 rounded-xl transition-all text-left',
                    isClickable
                      ? 'hover:bg-primary/6 active:scale-[0.98] cursor-pointer'
                      : 'cursor-default',
                    step.done && 'opacity-55',
                  )}
                >
                  {/* Checkbox */}
                  <div className="shrink-0">
                    {step.done ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-primary" style={{ width: '18px', height: '18px' }} />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-muted-foreground/30" style={{ width: '18px', height: '18px' }} />
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      'flex-1 text-[13px] font-medium leading-snug',
                      step.done
                        ? 'text-muted-foreground/50 line-through decoration-muted-foreground/25'
                        : 'text-foreground',
                    )}
                  >
                    {step.label}
                  </span>

                  {/* Arrow for incomplete steps */}
                  {isClickable && (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/35 shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
