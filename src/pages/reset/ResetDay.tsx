import { useNavigate, useParams } from 'react-router-dom';
import { useReset } from '@/contexts/ResetContext';
import { DAY_CONTENT, type GoalKey } from '@/lib/dayContent';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

export default function ResetDay() {
  const { id } = useParams();
  const dayNum = Number(id);
  const navigate = useNavigate();
  const { currentDay, getDayData, toggleTask, completedTaskCount, goal } = useReset();

  const content = DAY_CONTENT[dayNum - 1];
  const goalBonus = goal ? content?.goalBonus?.[goal as GoalKey] : null;
  const dayData = getDayData(dayNum);
  const completedCount = completedTaskCount(dayNum);
  const totalTasks = content?.tasks.length || 0;
  const minRequired = Math.min(3, totalTasks);
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
      navigate(`/checkin/${dayNum}`);
    }
  };

  return (
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
          className="w-full min-h-[48px]"
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
  );
}
