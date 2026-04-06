import { useState } from 'react';
import { type TrainingPlan, generateTrainingPlan } from '@/lib/pillarPlans';
import { type ExtendedGoal } from '@/lib/goalAssessment';
import { Button } from '@/components/ui/button';
import { Activity, ChevronLeft, ChevronDown, ChevronUp, RefreshCw, Dumbbell } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface Props {
  answers: Record<string, any>;
  goal: ExtendedGoal;
  onBack: () => void;
  onPlanGenerated?: (plan: TrainingPlan) => void;
}

export default function PillarDetailTraining({ answers, goal, onBack, onPlanGenerated }: Props) {
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      const newPlan = generateTrainingPlan(answers, goal);
      setPlan(newPlan);
      onPlanGenerated?.(newPlan);
      setExpandedDay(0);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="space-y-4 animate-enter">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <ChevronLeft className="w-4 h-4" /> Zurück
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-outfit text-lg font-bold text-foreground">Trainingsplan</h2>
          <p className="text-xs text-muted-foreground">{answers.trainingDays || 3}x/Woche · an dein Ziel angepasst</p>
        </div>
      </div>

      {!plan && !loading && (
        <div className="rounded-2xl border border-border/30 p-6 text-center space-y-4" style={{ background: 'var(--gradient-card)' }}>
          <Dumbbell className="w-10 h-10 text-primary/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Erstelle deinen personalisierten Trainingsplan basierend auf deinem Zielprofil und deiner Ausstattung.</p>
          <Button onClick={generate} className="w-full">Trainingsplan erstellen</Button>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-border/30 p-8 text-center space-y-3" style={{ background: 'var(--gradient-card)' }}>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary/40" style={{ animation: 'floatParticle 1.2s ease-in-out infinite', animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Erstelle deinen Plan…</p>
        </div>
      )}

      {plan && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{plan.title}</span>
            <button onClick={generate} className="flex items-center gap-1 text-xs text-primary font-medium">
              <RefreshCw className="w-3 h-3" /> Neu generieren
            </button>
          </div>

          <div className="space-y-2">
            {plan.days.map((day, dayIdx) => (
              <Collapsible key={day.day} open={expandedDay === dayIdx} onOpenChange={() => setExpandedDay(expandedDay === dayIdx ? null : dayIdx)}>
                <CollapsibleTrigger asChild>
                  <button className={cn(
                    'w-full rounded-xl border p-3 flex items-center gap-3 active:scale-[0.99] transition-all',
                    day.isTraining ? 'border-primary/20' : 'border-border/30'
                  )} style={{ background: day.isTraining ? 'linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--primary) / 0.02))' : 'var(--gradient-card)' }}>
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold', day.isTraining ? 'bg-primary/10 text-primary' : 'bg-secondary/30 text-muted-foreground')}>
                      {day.day.slice(0, 2)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-foreground">{day.sessionType}</p>
                      <p className="text-xs text-muted-foreground">{day.duration} Min</p>
                    </div>
                    {expandedDay === dayIdx ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2 pl-1 space-y-2">
                    {day.isTraining ? day.exercises.map((ex, i) => (
                      <div key={i} className="rounded-xl border border-border/20 p-3" style={{ background: 'var(--gradient-card)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-foreground">{ex.name}</p>
                          <span className="text-xs text-primary font-semibold">{ex.sets}×{ex.reps}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">💡 {ex.formCue}</p>
                      </div>
                    )) : (
                      <div className="rounded-xl border border-border/20 p-4 text-center" style={{ background: 'var(--gradient-card)' }}>
                        <p className="text-sm text-foreground">{day.movementSuggestion}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Rest Days sind Trainingstage für dein Nervensystem</p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
