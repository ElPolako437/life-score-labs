import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReset } from '@/contexts/ResetContext';
import { DAY_CONTENT, type GoalKey } from '@/lib/dayContent';
import { track } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ResetDay() {
  const { id } = useParams();
  const dayNum = Number(id);
  const navigate = useNavigate();
  const { currentDay, getDayData, toggleTask, completedTaskCount, completeDay, goal } = useReset();
  const [celebrating, setCelebrating] = useState(false);
  const [ctaPulse, setCtaPulse] = useState(false);

  const content = DAY_CONTENT[dayNum - 1];
  const goalBonus = goal ? content?.goalBonus?.[goal as GoalKey] : null;
  const dayData = getDayData(dayNum);
  const completedCount = completedTaskCount(dayNum);
  const totalTasks = content?.tasks.length || 0;
  const minRequired = Math.min(3, totalTasks);

  const prevCount = useRef(completedCount);

  useEffect(() => {
    if (prevCount.current < minRequired && completedCount >= minRequired && !dayData.completed) {
      setCtaPulse(true);
      setTimeout(() => setCtaPulse(false), 900);
    }
    prevCount.current = completedCount;
  }, [completedCount]);
  const canComplete = completedCount >= minRequired;

  if (!content || dayNum < 1 || dayNum > 7) {
    navigate('/week');
    return null;
  }

  if (dayNum > currentDay) {
    navigate('/week');
    return null;
  }

  const handleComplete = () => {
    if (dayData.completed) {
      navigate('/week');
    } else {
      completeDay(dayNum, 'good');
      track('day_completed', { day: dayNum });
      setCelebrating(true);
      setTimeout(() => navigate(`/checkin/${dayNum}`), 700);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <div className="max-w-sm mx-auto w-full animate-fade-in">
        {/* Back to week */}
        <button
          onClick={() => navigate('/week')}
          className="text-xs text-muted-foreground/60 mb-4 hover:text-muted-foreground transition-colors"
        >
          ← Wochenübersicht
        </button>

        {/* Header */}
        <p className="text-xs text-primary font-semibold tracking-widest uppercase mb-1">
          Tag {dayNum} von 7
        </p>
        <Progress value={(dayNum / 7) * 100} variant="neon" className="mb-6 h-1.5" />

        <h1 className="font-outfit text-2xl font-bold text-foreground mb-2">
          {content.title}
        </h1>
        <p className="text-sm text-muted-foreground mb-2">{content.goal}</p>
        <p className="text-sm text-foreground/70 italic mb-8 leading-relaxed">
          {content.impulse}
        </p>

        {/* Tasks */}
        <div className="space-y-3 mb-8">
          {content.tasks.map((task, i) => (
            <label
              key={i}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200',
                dayData.tasks[i]
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border/60 bg-card hover:border-primary/30'
              )}
            >
              <Checkbox
                checked={dayData.tasks[i] || false}
                onCheckedChange={() => toggleTask(dayNum, i)}
                className="mt-0.5 transition-transform data-[state=checked]:scale-110"
              />
              <span className={cn(
                'text-sm leading-relaxed',
                dayData.tasks[i] ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {task}
              </span>
            </label>
          ))}
        </div>

        {/* Goal-spezifischer Fokus */}
        {goalBonus && (
          <div className="mb-4 p-4 rounded-xl border border-border/40 bg-card/60">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Dein Fokus heute</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{goalBonus}</p>
          </div>
        )}

        {/* Sofort-Tipp */}
        <div className="mb-6 p-4 rounded-xl border border-primary/40 bg-primary/5">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">Sofort-Tipp</p>
          <p className="text-sm text-foreground/90 leading-relaxed">{content.sofortTipp}</p>
        </div>

        {/* Insight — title always visible, body expandable */}
        {(() => {
          const colonIdx = content.insight.indexOf(':');
          const insightTitle = colonIdx > -1 ? content.insight.slice(0, colonIdx) : content.insight;
          const insightBody = colonIdx > -1 ? content.insight.slice(colonIdx + 1).trim() : '';
          return (
            <Accordion type="single" collapsible className="mb-8">
              <AccordionItem value="why" className="border-border/40">
                <AccordionTrigger className="text-sm text-foreground font-medium hover:text-foreground py-3 text-left">
                  {insightTitle}
                </AccordionTrigger>
                {insightBody && (
                  <AccordionContent className="text-sm text-muted-foreground/80 leading-relaxed pb-4">
                    {insightBody}
                  </AccordionContent>
                )}
              </AccordionItem>
            </Accordion>
          );
        })()}

        {/* CTA */}
        <Button
          variant="premium"
          size="lg"
          className={cn(
            'w-full min-h-[48px] transition-all duration-300',
            ctaPulse && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]',
            ctaPulse && '[box-shadow:0_0_24px_hsl(142_76%_46%/0.45)]'
          )}
          disabled={!canComplete && !dayData.completed}
          onClick={handleComplete}
        >
          {dayData.completed ? 'Zurück zur Übersicht' : 'Tag abschließen'}
        </Button>

        {!canComplete && !dayData.completed && (
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
