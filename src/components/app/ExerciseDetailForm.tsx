/**
 * ExerciseDetailForm - Reusable premium exercise detail entry
 * Used in AppMyPlans training cards, AppTrainingLog, and ActivityLogSheet.
 * Shows autocomplete, sets/reps/weight, and previous performance.
 */

import { useState, useRef, useMemo, useCallback } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { TrainingLog } from '@/contexts/AppContext';

export interface ExerciseEntry {
  name: string;
  sets: number;
  reps: string;
  weight: string;
  unit: 'kg' | 'lbs' | 'bodyweight';
  note: string;
}

const COMMON_EXERCISES = [
  'Bankdruecken', 'Kniebeugen', 'Kreuzheben', 'Schulterdruecken', 'Latzug',
  'Rudern', 'Klimmzuege', 'Dips', 'Bizepscurls', 'Trizepsdruecken',
  'Beinpresse', 'Ausfallschritte', 'Rumaenisches Kreuzheben', 'Seitheben',
  'Plank', 'Burpees', 'Box Jumps', 'Kettlebell Swings', 'Push-ups', 'Pull-ups',
  'Hip Thrust', 'Goblet Squat', 'Arnold Press', 'Facepulls', 'Cable Fly',
  'Incline Press', 'Leg Curl', 'Leg Extension', 'Calf Raises',
  'Liegestuetze', 'Bulgarian Split Squats', 'Glute Bridges',
];

interface Props {
  exercises: ExerciseEntry[];
  onChange: (exercises: ExerciseEntry[]) => void;
  trainingLogs: TrainingLog[];
  compact?: boolean;
}

function findLastPerformance(
  exerciseName: string,
  trainingLogs: TrainingLog[],
): { sets: number; reps: string; weight: number } | null {
  if (!exerciseName.trim()) return null;
  const lowerName = exerciseName.toLowerCase();
  // Search backwards through logs for matching exercise name
  for (let i = trainingLogs.length - 1; i >= 0; i--) {
    const log = trainingLogs[i];
    for (const ex of log.exercises) {
      if (ex.name.toLowerCase() === lowerName) {
        return { sets: ex.sets, reps: ex.reps, weight: ex.weight };
      }
    }
  }
  return null;
}

export default function ExerciseDetailForm({ exercises, onChange, trainingLogs, compact }: Props) {
  const addExercise = () => {
    onChange([...exercises, { name: '', sets: 3, reps: '10', weight: '', unit: 'kg', note: '' }]);
  };

  const removeExercise = (idx: number) => {
    onChange(exercises.filter((_, i) => i !== idx));
  };

  const updateExercise = (idx: number, field: keyof ExerciseEntry, value: string | number) => {
    onChange(exercises.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  return (
    <div className="space-y-2">
      <span className={cn(
        'font-semibold text-muted-foreground uppercase tracking-wider',
        compact ? 'text-[9px]' : 'text-[10px]',
      )}>
        Übungen
      </span>

      {exercises.map((ex, i) => (
        <ExerciseRow
          key={i}
          exercise={ex}
          index={i}
          total={exercises.length}
          compact={compact}
          trainingLogs={trainingLogs}
          onUpdate={(field, value) => updateExercise(i, field, value)}
          onRemove={() => removeExercise(i)}
        />
      ))}

      <button
        onClick={addExercise}
        className={cn(
          'w-full rounded-lg border border-dashed border-border/40 text-muted-foreground',
          'hover:text-foreground hover:border-primary/20 transition-all',
          'flex items-center justify-center gap-1.5',
          compact ? 'p-2 text-[10px]' : 'p-2.5 text-[11px]',
        )}
      >
        <Plus className="w-3 h-3" /> Übung hinzufügen
      </button>
    </div>
  );
}

function ExerciseRow({
  exercise, index, total, compact, trainingLogs, onUpdate, onRemove,
}: {
  exercise: ExerciseEntry;
  index: number;
  total: number;
  compact?: boolean;
  trainingLogs: TrainingLog[];
  onUpdate: (field: keyof ExerciseEntry, value: string | number) => void;
  onRemove: () => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (!exercise.name || exercise.name.length < 1) return [];
    const lower = exercise.name.toLowerCase();
    return COMMON_EXERCISES.filter(e => e.toLowerCase().includes(lower)).slice(0, 5);
  }, [exercise.name]);

  const lastPerf = useMemo(
    () => findLastPerformance(exercise.name, trainingLogs),
    [exercise.name, trainingLogs],
  );

  const formatLastPerf = useCallback(() => {
    if (!lastPerf) return null;
    const weightStr = lastPerf.weight > 0 ? ` @ ${lastPerf.weight}kg` : '';
    return `Letztes Mal: ${lastPerf.sets}x${lastPerf.reps}${weightStr}`;
  }, [lastPerf]);

  return (
    <div className={cn(
      'rounded-lg border border-border/30 bg-background/50 transition-all',
      compact ? 'p-2 space-y-1' : 'p-2.5 space-y-1.5',
    )}>
      {/* Exercise name + autocomplete */}
      <div className="flex items-center gap-1.5 relative">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            placeholder={`Übung ${index + 1}`}
            value={exercise.name}
            onChange={e => { onUpdate('name', e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className={cn('bg-secondary/20 border-border/20', compact ? 'h-7 text-[11px]' : 'h-8 text-xs')}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-0.5 rounded-lg border border-border/30 bg-background shadow-lg overflow-hidden">
              {suggestions.map(s => (
                <button
                  key={s}
                  onMouseDown={(e) => { e.preventDefault(); onUpdate('name', s); setShowSuggestions(false); }}
                  className="w-full text-left px-3 py-1.5 text-[11px] text-foreground hover:bg-primary/10 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        {total > 1 && (
          <button
            onClick={onRemove}
            className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
          >
            <Trash2 className={cn(compact ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
          </button>
        )}
      </div>

      {/* Sets / Reps / Weight */}
      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <span className="text-[9px] text-muted-foreground/60">Saetze</span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onUpdate('sets', Math.max(1, exercise.sets - 1))}
              className="w-6 h-6 rounded bg-secondary/30 text-muted-foreground text-xs flex items-center justify-center active:scale-90"
            >
              -
            </button>
            <Input
              type="number"
              value={exercise.sets}
              onChange={e => onUpdate('sets', Math.max(1, parseInt(e.target.value) || 1))}
              className={cn('text-center bg-secondary/20 border-border/20', compact ? 'h-6 text-[11px]' : 'h-7 text-xs')}
            />
            <button
              onClick={() => onUpdate('sets', Math.min(10, exercise.sets + 1))}
              className="w-6 h-6 rounded bg-secondary/30 text-muted-foreground text-xs flex items-center justify-center active:scale-90"
            >
              +
            </button>
          </div>
        </div>
        <div>
          <span className="text-[9px] text-muted-foreground/60">Wiederholungen</span>
          <Input
            value={exercise.reps}
            onChange={e => onUpdate('reps', e.target.value)}
            placeholder="8-10"
            className={cn('bg-secondary/20 border-border/20', compact ? 'h-6 text-[11px]' : 'h-7 text-xs')}
          />
        </div>
        <div>
          <span className="text-[9px] text-muted-foreground/60">Gewicht</span>
          <div className="flex items-center gap-0.5">
            <Input
              type="number"
              value={exercise.weight}
              onChange={e => onUpdate('weight', e.target.value)}
              placeholder="--"
              className={cn('bg-secondary/20 border-border/20 text-right', compact ? 'h-6 text-[11px]' : 'h-7 text-xs')}
            />
          </div>
        </div>
      </div>

      {/* Unit selector */}
      <div className="flex gap-1">
        {(['kg', 'lbs', 'bodyweight'] as const).map(u => (
          <button
            key={u}
            onClick={() => onUpdate('unit', u)}
            className={cn(
              'text-[8px] px-1.5 py-0.5 rounded-full border transition-all font-medium',
              exercise.unit === u
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-transparent border-border/20 text-muted-foreground/50',
            )}
          >
            {u === 'bodyweight' ? 'Koerpergewicht' : u}
          </button>
        ))}
      </div>

      {/* Previous performance */}
      {formatLastPerf() && (
        <p className="text-[10px] text-muted-foreground/60 italic pl-0.5">
          {formatLastPerf()}
        </p>
      )}
    </div>
  );
}

export function createEmptyExercise(): ExerciseEntry {
  return { name: '', sets: 3, reps: '10', weight: '', unit: 'kg', note: '' };
}

export function exerciseEntriesToTrainingExercises(entries: ExerciseEntry[]) {
  return entries
    .filter(e => e.name.trim())
    .map(e => ({
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      weight: parseFloat(e.weight) || 0,
    }));
}
