// Reset = Diagnose + 1 Hebel. Lösung & Plan = Sprint. Spannung offen halten.

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReset } from '@/contexts/ResetContext';
import { DAY_CONTENT, type GoalKey } from '@/lib/dayContent';
import { track } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import PillarAssessment from '@/components/reset/PillarAssessment';

export default function ResetDay() {
  const { id } = useParams();
  const dayNum = Number(id);
  const navigate = useNavigate();
  const {
    currentDay, getDayData, toggleTask, completedTaskCount, completeDay,
    goal, pillarQuestionsAnswered, markPillarAnswered,
  } = useReset();
  const [celebrating, setCelebrating] = useState(false);
  const [ctaPulse, setCtaPulse] = useState(false);

  const content = DAY_CONTENT[dayNum - 1];
  const goalBonus = goal ? content?.goalBonus?.[goal as GoalKey] : null;
  const dayData = getDayData(dayNum);
  const completedCount = completedTaskCount(dayNum);
  const totalTasks = content?.tasks.length || 0;
  const minRequired = Math.min(3, totalTasks);

  // Pillar days (1–4): completion driven by questions answered, not task checkboxes
  const isPillarDay = content?.pillarDay === true;
  const canComplete = isPillarDay
    ? !!pillarQuestionsAnswered[dayNum] || dayData.completed
    : completedCount >= minRequired || dayData.completed;

  const prevCount = useRef(completedCount);
  useEffect(() => {
    if (!isPillarDay && prevCount.current < minRequired && completedCount >= minRequired && !dayData.completed) {
      setCtaPulse(true);
      setTimeout(() => setCtaPulse(false), 900);
    }
    prevCount.current = completedCount;
  }, [completedCount]);

  useEffect(() => {
    if (isPillarDay && pillarQuestionsAnswered[dayNum] && !dayData.completed) {
      setCtaPulse(true);
      setTimeout(() => setCtaPulse(false), 900);
    }
  }, [pillarQuestionsAnswered[dayNum]]);

  if (!content || dayNum < 1 || dayNum > 5) {
    navigate('/week');
    return null;
  }

  if (dayNum > currentDay) {
    navigate('/week');
    return null;
  }

  // Time-gate
  const prevDayData = dayNum > 1 ? getDayData(dayNum - 1) : null;
  const prevCompletedAt = prevDayData?.completedAt ?? null;
  const hoursSincePrev = prevCompletedAt ? (Date.now() - prevCompletedAt) / (1000 * 60 * 60) : null;
  const hoursUntilUnlock = hoursSincePrev != null ? Math.max(0, Math.ceil(20 - hoursSincePrev)) : null;
  const isTimeLocked = !dayData.completed && dayNum > 1 && hoursUntilUnlock != null && hoursUntilUnlock > 0;

  if (isTimeLocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-sm mx-auto w-full animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="font-outfit text-xl font-bold text-foreground mb-2">Tag {dayNum} öffnet bald.</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {hoursUntilUnlock <= 1
              ? 'Noch weniger als eine Stunde, komm gleich wieder.'
              : `In ca. ${hoursUntilUnlock} Stunden ist Tag ${dayNum} bereit für dich.`}
          </p>
          <p className="text-xs text-muted-foreground/40 mb-8">
            Der Reset funktioniert weil dein Körper Zeit braucht um zu adaptieren. Ein Tag, ein Schritt.
          </p>
          <button onClick={() => navigate('/week')} className="text-sm text-primary/70 hover:text-primary transition-colors">
            ← Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  const handleComplete = () => {
    if (dayData.completed) {
      navigate('/week');
    } else {
      completeDay(dayNum, 'good');
      track('day_completed', { day: dayNum });
      localStorage.setItem('caliness_just_completed', String(dayNum));
      setCelebrating(true);
      setTimeout(() => navigate(`/checkin/${dayNum}`), 700);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <div className="max-w-sm mx-auto w-full animate-fade-in">
        <button onClick={() => navigate('/week')} className="text-xs text-muted-foreground/60 mb-4 hover:text-muted-foreground transition-colors">
          ← Übersicht
        </button>

        <p className="text-xs text-primary font-semibold tracking-widest uppercase mb-1">
          Tag {dayNum} von 5
        </p>
        <Progress value={(dayNum / 5) * 100} variant="neon" className="mb-6 h-1.5" />

        <h1 className="font-outfit text-2xl font-bold text-foreground mb-2">{content.title}</h1>
        <p className="text-sm text-muted-foreground mb-5">{content.goal}</p>

        {/* David-Nachricht */}
        <div className="flex items-start gap-3 mb-6">
          <img src="/images/david.jpg" alt="David" className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5 ring-2 ring-primary/20" />
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-primary mb-1.5">David</p>
            <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-sm text-foreground/80 leading-relaxed italic">
                {content.impulse.replace(/^„/, '').replace(/"$/, '')}
              </p>
            </div>
          </div>
        </div>

        {/* Pillar-Assessment (Tage 1–4) */}
        {isPillarDay && !dayData.completed && (
          <div className="mb-6">
            <PillarAssessment
              day={dayNum}
              onComplete={() => {
                setCtaPulse(true);
                setTimeout(() => setCtaPulse(false), 900);
              }}
            />
          </div>
        )}

        {/* Task-Checkboxen (nur für nicht-Pillar-Tage mit Tasks) */}
        {!isPillarDay && totalTasks > 0 && (
          <div className="space-y-3 mb-8">
            {content.tasks.map((task, i) => (
              <label
                key={i}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200',
                  dayData.tasks[i] ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-card hover:border-primary/30'
                )}
              >
                <Checkbox
                  checked={dayData.tasks[i] || false}
                  onCheckedChange={() => toggleTask(dayNum, i)}
                  className="mt-0.5 transition-transform data-[state=checked]:scale-110"
                />
                <span className={cn('text-sm leading-relaxed', dayData.tasks[i] ? 'text-foreground' : 'text-muted-foreground')}>
                  {task}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* Insight (nur wenn kein Pillar-Assessment oder Tag abgeschlossen) */}
        {(!isPillarDay || dayData.completed) && (
          <>
            {goalBonus && (
              <div className="mb-4 p-4 rounded-xl border border-border/40 bg-card/60">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Dein Fokus heute</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{goalBonus}</p>
              </div>
            )}
            <div className="mb-6 p-4 rounded-xl border border-primary/40 bg-primary/5">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">Sofort-Tipp</p>
              <p className="text-sm text-foreground/90 leading-relaxed">{content.sofortTipp}</p>
            </div>
            <div className="mb-8 p-4 rounded-xl border border-border/30 bg-card/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Warum das funktioniert</p>
              <p className="text-sm text-foreground/85 leading-relaxed">{content.insight}</p>
            </div>
          </>
        )}

        {/* CTA */}
        <Button
          variant="premium"
          size="lg"
          className={cn(
            'w-full min-h-[48px] transition-all duration-300',
            ctaPulse && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]',
            ctaPulse && '[box-shadow:0_0_24px_hsl(142_76%_46%/0.45)]'
          )}
          disabled={!canComplete}
          onClick={handleComplete}
        >
          {dayData.completed ? 'Zurück zur Übersicht' : 'Tag abschließen'}
        </Button>

        {isPillarDay && !canComplete && !dayData.completed && (
          <p className="text-xs text-muted-foreground/50 text-center mt-3">
            Beantworte die Fragen um fortzufahren
          </p>
        )}
        {!isPillarDay && !canComplete && !dayData.completed && minRequired > 0 && (
          <p className="text-xs text-muted-foreground/50 text-center mt-3">
            Erledige mindestens {minRequired} Aufgaben
          </p>
        )}
      </div>
    </div>

    {celebrating && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 animate-fade-in">
        <div className="flex flex-col items-center gap-4 animate-scale-in">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: 'radial-gradient(circle, hsl(142 76% 46% / 0.25) 0%, hsl(142 76% 46% / 0.05) 70%)', boxShadow: '0 0 40px hsl(142 76% 46% / 0.3)' }}
          >
            <Check className="w-12 h-12 text-primary" strokeWidth={2.5} />
          </div>
          <p className="font-outfit text-2xl font-bold text-foreground">Tag {dayNum} geschafft.</p>
        </div>
      </div>
    )}
    </>
  );
}
