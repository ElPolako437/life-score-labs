import { useState } from 'react';
import { getQuestionsForGoal, type ExtendedGoal, type QuestionGroup } from '@/lib/goalAssessment';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, Bot } from 'lucide-react';

interface GoalQuestionsProps {
  goal: ExtendedGoal;
  initialAnswers?: Record<string, any>;
  onComplete: (answers: Record<string, any>) => void;
  onBack: () => void;
}

/** Map profile strings to numeric slider values */
function mapSleepToNumber(s: string): number {
  const m: Record<string, number> = { 'Schlecht': 1, 'Mittel': 2, 'Gut': 4, 'Sehr gut': 5 };
  return m[s] ?? 3;
}
function mapStressToNumber(s: string): number {
  const m: Record<string, number> = { 'Niedrig': 1, 'Mittel': 3, 'Hoch': 4, 'Sehr hoch': 5 };
  return m[s] ?? 3;
}
function mapActivityToTrainingDays(s: string): number {
  const m: Record<string, number> = { 'Wenig aktiv': 1, 'Moderat aktiv': 3, 'Sehr aktiv': 4, 'Sportlich': 5 };
  return m[s] ?? 3;
}

export default function GoalQuestions({ goal, initialAnswers, onComplete, onBack }: GoalQuestionsProps) {
  const { profile } = useApp();
  const groups = getQuestionsForGoal(goal);
  const [groupIdx, setGroupIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) return initialAnswers;
    // Smart defaults from profile
    const defaults: Record<string, any> = {};
    groups.forEach(g => g.questions.forEach(q => { defaults[q.id] = q.defaultValue; }));
    // Override with profile data
    if (defaults.currentWeight !== undefined) defaults.currentWeight = profile.weight || 80;
    if (defaults.goalWeight !== undefined) {
      defaults.goalWeight = goal === 'fat_loss' || goal === 'recomp'
        ? Math.max(50, (profile.weight || 80) - 5)
        : goal === 'muscle_gain'
        ? (profile.weight || 75) + 5
        : profile.weight || 80;
    }
    if (defaults.sleepQuality !== undefined) defaults.sleepQuality = mapSleepToNumber(profile.sleepQuality);
    if (defaults.stressLevel !== undefined) defaults.stressLevel = mapStressToNumber(profile.stressLevel);
    if (defaults.trainingDays !== undefined) defaults.trainingDays = mapActivityToTrainingDays(profile.activityLevel);
    return defaults;
  });

  const group = groups[groupIdx];
  const isLast = groupIdx === groups.length - 1;

  const setAnswer = (id: string, value: any) => setAnswers(prev => ({ ...prev, [id]: value }));

  const next = () => {
    if (isLast) {
      onComplete(answers);
    } else {
      setGroupIdx(i => i + 1);
    }
  };

  return (
    <div className="space-y-5 animate-enter" key={groupIdx}>
      {/* Progress */}
      <div className="flex items-center gap-2">
        {groups.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all',
              i <= groupIdx ? 'bg-primary' : 'bg-secondary/40',
            )}
          />
        ))}
      </div>

      {/* Companion Message */}
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary border border-border/40 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="rounded-2xl rounded-tl-md px-4 py-3 text-sm text-foreground leading-relaxed border border-border/30"
          style={{ background: 'var(--gradient-card)' }}>
          {group.companionMessage}
        </div>
      </div>

      {/* Group Title */}
      <h3 className="font-outfit text-lg font-bold text-foreground">{group.title}</h3>

      {/* Questions */}
      <div className="space-y-5">
        {group.questions.map(q => (
          <div key={q.id} className="space-y-2">
            <label className="text-sm font-medium text-foreground">{q.label}</label>

            {q.type === 'number' && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={answers[q.id] ?? ''}
                  onChange={e => setAnswer(q.id, Number(e.target.value))}
                  className="flex-1"
                />
                {q.unit && <span className="text-sm text-muted-foreground">{q.unit}</span>}
              </div>
            )}

            {q.type === 'slider' && (
              <div className="space-y-2">
                <Slider
                  value={[answers[q.id] ?? q.defaultValue ?? q.min ?? 1]}
                  onValueChange={([v]) => setAnswer(q.id, v)}
                  min={q.min ?? 1}
                  max={q.max ?? 5}
                  step={q.step ?? 1}
                  className="py-2"
                />
                <div className="flex justify-between">
                  <span className="text-[10px] text-muted-foreground">{q.min ?? 1}</span>
                  <span className="text-sm font-semibold text-primary">{answers[q.id] ?? q.defaultValue}</span>
                  <span className="text-[10px] text-muted-foreground">{q.max ?? 5}</span>
                </div>
              </div>
            )}

            {q.type === 'select' && q.options && (
              <div className="grid grid-cols-2 gap-2">
                {q.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswer(q.id, opt.value)}
                    className={cn(
                      'rounded-xl border p-3 text-left text-xs font-medium transition-all active:scale-[0.98]',
                      answers[q.id] === opt.value
                        ? 'border-primary/50 bg-primary/10 text-foreground'
                        : 'border-border/40 bg-secondary/20 text-muted-foreground hover:border-border/60',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'yesno' && (
              <div className="flex gap-2">
                {[
                  { val: true, label: 'Ja' },
                  { val: false, label: 'Nein' },
                ].map(opt => (
                  <button
                    key={String(opt.val)}
                    onClick={() => setAnswer(q.id, opt.val)}
                    className={cn(
                      'flex-1 rounded-xl border p-3 text-sm font-medium transition-all active:scale-[0.98]',
                      answers[q.id] === opt.val
                        ? 'border-primary/50 bg-primary/10 text-foreground'
                        : 'border-border/40 bg-secondary/20 text-muted-foreground hover:border-border/60',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={groupIdx > 0 ? () => setGroupIdx(i => i - 1) : onBack} className="flex-none">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button className="flex-1" onClick={next}>
          {isLast ? 'Analyse starten' : 'Weiter'} <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
