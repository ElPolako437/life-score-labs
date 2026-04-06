import { useNavigate, useParams } from 'react-router-dom';
import { useReset } from '@/contexts/ResetContext';
import { DAY_CONTENT, TASKS } from '@/lib/dayContent';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function ResetDay() {
  const { id } = useParams();
  const dayNum = Number(id);
  const navigate = useNavigate();
  const { currentDay, getDayData, toggleTask, completedTaskCount, homescreenHintShown, markHomescreenHintShown } = useReset();
  const [showHomeHint, setShowHomeHint] = useState(false);

  const content = DAY_CONTENT[dayNum - 1];
  const dayData = getDayData(dayNum);
  const completedCount = completedTaskCount(dayNum);
  const canComplete = completedCount >= 3;

  // Homescreen hint after day 1 completion
  useEffect(() => {
    if (dayNum === 1 && dayData.completed && !homescreenHintShown) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        setShowHomeHint(true);
        markHomescreenHintShown();
      }
    }
  }, [dayNum, dayData.completed, homescreenHintShown, markHomescreenHintShown]);

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
          „{content.impulse}"
        </p>

        {/* Tasks */}
        <div className="space-y-3 mb-8">
          {TASKS.map((task, i) => (
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
                checked={dayData.tasks[i]}
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

        {/* Why important */}
        <Accordion type="single" collapsible className="mb-8">
          <AccordionItem value="why" className="border-border/40">
            <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground py-3">
              Warum das heute wichtig ist
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground/80 leading-relaxed pb-4">
              {content.whyImportant}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

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
            Erledige mindestens 3 Aufgaben
          </p>
        )}

        {/* Homescreen hint */}
        {showHomeHint && (
          <div className="mt-6 p-4 rounded-xl border border-border/40 bg-card text-center animate-fade-in">
            <p className="text-sm text-muted-foreground mb-2">
              Füge die App zu deinem Homescreen hinzu für den vollen Fokus.
            </p>
            <button
              onClick={() => setShowHomeHint(false)}
              className="text-xs text-primary"
            >
              Verstanden
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
