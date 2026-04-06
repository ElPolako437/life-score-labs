import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Dumbbell, Plus, Check, ChevronDown, ChevronUp, Calendar, TrendingUp, ArrowLeft, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ExerciseDetailForm, { createEmptyExercise, exerciseEntriesToTrainingExercises, type ExerciseEntry } from '@/components/app/ExerciseDetailForm';
import { toast } from 'sonner';

const TYPES = ['Kraft', 'Ausdauer', 'Mobilität', 'HIIT', 'Sonstiges'];

const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export default function AppTrainingLog() {
  const navigate = useNavigate();
  const { addTrainingLog, trainingLogs, addActivityLog, goalPlan } = useApp();
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [type, setType] = useState('Kraft');
  const [duration, setDuration] = useState(45);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([createEmptyExercise()]);
  const [expandedLogIdx, setExpandedLogIdx] = useState<number | null>(null);

  // Group logs by week
  const groupedLogs = useMemo(() => {
    const sorted = [...trainingLogs].sort((a, b) => b.date.localeCompare(a.date));
    const groups: { weekLabel: string; logs: (typeof trainingLogs[0] & { originalIdx: number })[] }[] = [];
    const weekMap = new Map<string, (typeof trainingLogs[0] & { originalIdx: number })[]>();

    sorted.forEach((log, idx) => {
      const d = new Date(log.date);
      // Get Monday of that week
      const dayOfWeek = d.getDay() || 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - dayOfWeek + 1);
      const weekKey = monday.toISOString().split('T')[0];

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      weekMap.get(weekKey)!.push({ ...log, originalIdx: idx });
    });

    weekMap.forEach((logs, weekKey) => {
      const mondayDate = new Date(weekKey);
      const sundayDate = new Date(mondayDate);
      sundayDate.setDate(mondayDate.getDate() + 6);
      const formatDate = (d: Date) => `${d.getDate()}.${d.getMonth() + 1}`;
      const weekLabel = `${formatDate(mondayDate)} - ${formatDate(sundayDate)}`;
      groups.push({ weekLabel, logs });
    });

    return groups;
  }, [trainingLogs]);

  // Find progression for an exercise
  const findProgression = (exerciseName: string, currentLogDate: string) => {
    const lowerName = exerciseName.toLowerCase();
    const matches: { date: string; weight: number; sets: number; reps: string }[] = [];

    for (const log of trainingLogs) {
      if (log.date >= currentLogDate) continue;
      for (const ex of log.exercises) {
        if (ex.name.toLowerCase() === lowerName && ex.weight > 0) {
          matches.push({ date: log.date, weight: ex.weight, sets: ex.sets, reps: ex.reps });
        }
      }
    }

    return matches.sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  };

  // Detect today's planned training session
  const todayPlannedSession = useMemo(() => {
    const todayDayName = DAY_NAMES[new Date().getDay()];
    const days = goalPlan?.weeklyPlan?.trainingPlanData?.days ?? [];
    return days.find((d: any) => d.day === todayDayName && d.exercises?.length > 0) ?? null;
  }, [goalPlan]);

  const todayStr = new Date().toISOString().split('T')[0];
  const alreadyLoggedToday = trainingLogs.some(l => l.date === todayStr);

  // Pre-fill form from planned session
  const startPlannedWorkout = () => {
    if (!todayPlannedSession) return;
    const plannedExercises: ExerciseEntry[] = (todayPlannedSession.exercises ?? []).map((ex: any) => ({
      ...createEmptyExercise(),
      name: ex.name ?? ex,
    }));
    setExercises(plannedExercises.length > 0 ? plannedExercises : [createEmptyExercise()]);
    setType(todayPlannedSession.type ?? 'Kraft');
    setDuration(todayPlannedSession.duration ?? 45);
    setShowNewEntry(true);
  };

  const resetForm = () => {
    setType('Kraft');
    setDuration(45);
    setExercises([createEmptyExercise()]);
    setShowNewEntry(false);
  };

  const saveLog = () => {
    const validExercises = exerciseEntriesToTrainingExercises(exercises);
    if (validExercises.length === 0) {
      toast.error('Mindestens eine Übung eingeben');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    addTrainingLog({
      date: today,
      exercises: validExercises,
      duration,
      type,
      source: 'manual',
    });

    // Also add activity log for pillar scoring
    addActivityLog({
      pillar: 'bewegung',
      type: 'Krafttraining',
      label: type,
      duration,
      source: 'manual',
      intensity: 'mittel',
    });

    toast.success('Workout gespeichert!');
    resetForm();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return `${dayNames[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}`;
  };

  return (
    <div className="px-4 pt-6 pb-24 animate-enter">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary/30 transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Dumbbell className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="font-outfit text-xl font-bold text-foreground">Training Log</h1>
          <p className="text-[11px] text-muted-foreground">
            {trainingLogs.length} {trainingLogs.length === 1 ? 'Workout' : 'Workouts'} gespeichert
          </p>
        </div>
      </div>

      {/* Today's planned workout card */}
      {todayPlannedSession && !alreadyLoggedToday && !showNewEntry && (
        <button
          onClick={startPlannedWorkout}
          className="w-full flex items-center gap-3 rounded-2xl border border-primary/20 p-4 mb-4 active:scale-[0.99] transition-transform text-left"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(0,0,0,0) 100%)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <PlayCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Heutiges Training starten</p>
            <p className="text-[10px] text-muted-foreground">
              {todayPlannedSession.type ?? 'Training'} · {(todayPlannedSession.exercises ?? []).length} Übungen geplant
            </p>
          </div>
          <div className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-1">
            Starten →
          </div>
        </button>
      )}

      {/* New entry toggle */}
      {!showNewEntry ? (
        <button
          onClick={() => setShowNewEntry(true)}
          className="w-full mb-5 flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/20 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Neues Training
        </button>
      ) : (
        <div className="mb-5 rounded-xl border border-primary/20 bg-card/80 p-4 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Neues Training</span>
            <button onClick={resetForm} className="text-[10px] text-muted-foreground hover:text-foreground">
              Abbrechen
            </button>
          </div>

          {/* Type selection */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Art</span>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all border',
                    type === t
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-secondary/30 border-border/30 text-muted-foreground',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Dauer</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDuration(Math.max(5, duration - 5))}
                className="w-7 h-7 rounded bg-secondary/30 text-muted-foreground text-sm flex items-center justify-center active:scale-90"
              >-</button>
              <span className="text-sm font-semibold text-primary w-14 text-center">{duration} Min</span>
              <button
                onClick={() => setDuration(Math.min(180, duration + 5))}
                className="w-7 h-7 rounded bg-secondary/30 text-muted-foreground text-sm flex items-center justify-center active:scale-90"
              >+</button>
            </div>
          </div>

          {/* Exercise form */}
          <ExerciseDetailForm
            exercises={exercises}
            onChange={setExercises}
            trainingLogs={trainingLogs}
          />

          {/* Save */}
          <Button onClick={saveLog} className="w-full" size="lg">
            <Check className="w-4 h-4 mr-2" /> Workout speichern
          </Button>
        </div>
      )}

      {/* History */}
      {groupedLogs.length === 0 ? (
        <div className="rounded-2xl border border-border/30 p-8 text-center space-y-3" style={{ background: 'var(--gradient-card)' }}>
          <Dumbbell className="w-10 h-10 text-primary/15 mx-auto" />
          <p className="text-xs text-muted-foreground">Noch keine Workouts gespeichert</p>
          <p className="text-[10px] text-muted-foreground/60">Deine Trainingshistorie erscheint hier</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedLogs.map((group, gi) => (
            <div key={gi} className="space-y-2">
              {/* Week header */}
              <div className="flex items-center gap-2 px-0.5">
                <Calendar className="w-3 h-3 text-muted-foreground/50" />
                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                  KW {group.weekLabel}
                </span>
                <div className="flex-1 h-px bg-border/20" />
                <span className="text-[10px] text-muted-foreground/40">
                  {group.logs.length} {group.logs.length === 1 ? 'Session' : 'Sessions'}
                </span>
              </div>

              {/* Log entries */}
              {group.logs.map((log, li) => {
                const isExpanded = expandedLogIdx === log.originalIdx;
                const exerciseCount = log.exercises.length;

                return (
                  <button
                    key={li}
                    onClick={() => setExpandedLogIdx(isExpanded ? null : log.originalIdx)}
                    className="w-full text-left rounded-xl border border-border/20 p-3 transition-all hover:border-border/40"
                    style={{ background: 'var(--gradient-card)' }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Date chip */}
                      <div className="w-10 h-10 rounded-lg bg-primary/8 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] text-muted-foreground/60 font-medium leading-none">
                          {formatDate(log.date).split(' ')[0]}
                        </span>
                        <span className="text-[13px] font-bold text-foreground leading-tight">
                          {new Date(log.date).getDate()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {log.planSessionType || log.type}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{log.duration} Min</span>
                          {exerciseCount > 0 && (
                            <span className="text-[10px] text-primary/70">{exerciseCount} Übungen</span>
                          )}
                          {log.source === 'plan' && (
                            <span className="text-[8px] bg-primary/10 text-primary/70 px-1 py-0.5 rounded font-medium">Plan</span>
                          )}
                        </div>
                      </div>

                      {/* Expand indicator */}
                      {exerciseCount > 0 && (
                        isExpanded
                          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                      )}
                    </div>

                    {/* Expanded exercise list */}
                    {isExpanded && exerciseCount > 0 && (
                      <div className="mt-2.5 space-y-1 animate-in fade-in-0 duration-200">
                        {log.exercises.map((ex, ei) => {
                          const prev = findProgression(ex.name, log.date);
                          const weightDiff = prev && ex.weight > 0 ? ex.weight - prev.weight : null;

                          return (
                            <div key={ei} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-secondary/20">
                              <div className="min-w-0 flex-1">
                                <span className="text-[11px] text-foreground">{ex.name}</span>
                                {prev && weightDiff !== null && weightDiff !== 0 && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <TrendingUp className={cn(
                                      'w-2.5 h-2.5',
                                      weightDiff > 0 ? 'text-primary' : 'text-orange-400 rotate-180',
                                    )} />
                                    <span className={cn(
                                      'text-[9px] font-medium',
                                      weightDiff > 0 ? 'text-primary' : 'text-orange-400',
                                    )}>
                                      {weightDiff > 0 ? '+' : ''}{weightDiff}kg vs. vorher
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <span className="text-[10px] text-primary font-semibold">{ex.sets}x{ex.reps}</span>
                                {ex.weight > 0 && (
                                  <p className="text-[9px] text-muted-foreground/60">{ex.weight}kg</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
