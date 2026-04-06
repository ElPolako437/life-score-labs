import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dumbbell, Plus, Trash2, Clock, Play, Square, Check } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

interface ExerciseEntry {
  name: string;
  sets: number;
  reps: string;
  weight: string;
}

interface TrainingModalProps {
  open: boolean;
  onClose: () => void;
  blockLabel: string;
  blockTime: string;
  blockDuration: number;
  dayIdx: number;
  blockIdx: number;
}

export default function TrainingModal({ open, onClose, blockLabel, blockTime, blockDuration, dayIdx, blockIdx }: TrainingModalProps) {
  const { addTrainingLog, setGoalPlan } = useApp();
  const [type, setType] = useState('Kraft');
  const [timerActive, setTimerActive] = useState(false);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([
    { name: '', sets: 3, reps: '10', weight: '' },
  ]);

  const TYPES = ['Kraft', 'Ausdauer', 'Mobilität', 'HIIT', 'Sonstiges'];

  const startTimer = () => {
    setTimerActive(true);
    setTimerStart(Date.now());
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - Date.now()) / 1000));
    }, 1000);
    // Store interval for cleanup
    (window as any).__trainingInterval = interval;
  };

  const stopTimer = () => {
    setTimerActive(false);
    if (timerStart) {
      setElapsed(Math.floor((Date.now() - timerStart) / 1000));
    }
    clearInterval((window as any).__trainingInterval);
  };

  const addExercise = () => {
    setExercises(prev => [...prev, { name: '', sets: 3, reps: '10', weight: '' }]);
  };

  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const updateExercise = (idx: number, field: keyof ExerciseEntry, value: string | number) => {
    setExercises(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const finishTraining = () => {
    const validExercises = exercises.filter(e => e.name.trim());
    const duration = timerStart ? Math.max(1, Math.floor((Date.now() - timerStart) / 60000)) : blockDuration;

    // Create training log entry
    addTrainingLog({
      date: new Date().toISOString().split('T')[0],
      exercises: validExercises.map(e => ({
        name: e.name, sets: e.sets, reps: e.reps, weight: parseFloat(e.weight) || 0,
      })),
      duration,
      type,
    });

    // Mark goal plan block as completed
    const today = new Date().toISOString().split('T')[0];
    setGoalPlan(prev => {
      if (!prev?.weeklyPlan?.weeklyBlocks) return prev;
      const updated = { ...prev };
      const blocks = [...(updated.weeklyPlan.weeklyBlocks[dayIdx]?.blocks || [])];
      if (blocks[blockIdx]) blocks[blockIdx] = { ...blocks[blockIdx], completed: true };
      updated.weeklyPlan = {
        ...updated.weeklyPlan,
        weeklyBlocks: updated.weeklyPlan.weeklyBlocks.map((d: any, idx: number) =>
          idx === dayIdx ? { ...d, blocks } : d
        ),
      };
      const completedLabels = blocks.filter((b: any) => b.completed).map((b: any) => `${today}_${b.label}`);
      updated.completedBlocks = [...new Set([...(updated.completedBlocks || []), ...completedLabels])];
      return updated;
    });

    stopTimer();
    toast.success('Training abgeschlossen & Block erledigt!');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            {blockLabel}
          </DialogTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" /> {blockTime} · {blockDuration} Min geplant
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Timer */}
          <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
            {!timerActive && !timerStart && (
              <Button variant="premium" size="sm" onClick={startTimer}>
                <Play className="w-3.5 h-3.5 mr-1" /> Training starten
              </Button>
            )}
            {timerActive && (
              <>
                <span className="font-outfit text-2xl font-bold text-primary tabular-nums">
                  {formatTime(timerStart ? Math.floor((Date.now() - timerStart) / 1000) : 0)}
                </span>
                <Button variant="outline" size="sm" onClick={stopTimer}>
                  <Square className="w-3.5 h-3.5 mr-1" /> Stopp
                </Button>
              </>
            )}
            {!timerActive && timerStart && (
              <span className="text-sm text-muted-foreground">
                Dauer: {Math.max(1, Math.floor((Date.now() - timerStart) / 60000))} Min
              </span>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-foreground">Art</span>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                    type === t ? 'bg-primary/10 border border-primary/30 text-primary' : 'bg-secondary/40 border border-border/40 text-muted-foreground'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Exercises */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-foreground">Übungen (optional)</span>
            {exercises.map((ex, i) => (
              <div key={i} className="rounded-lg border border-border/30 bg-secondary/20 p-2 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Input placeholder="Übung" value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)}
                    className="flex-1 h-8 text-xs" />
                  {exercises.length > 1 && (
                    <button onClick={() => removeExercise(i)} className="p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <span className="text-[9px] text-muted-foreground">Sets</span>
                    <Input type="number" value={ex.sets} onChange={e => updateExercise(i, 'sets', parseInt(e.target.value) || 0)} className="h-7 text-xs" />
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground">Reps</span>
                    <Input value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground">kg</span>
                    <Input type="number" value={ex.weight} onChange={e => updateExercise(i, 'weight', e.target.value)} className="h-7 text-xs" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addExercise}
              className="w-full rounded-lg border border-dashed border-border/40 p-2 text-[11px] text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
              <Plus className="w-3 h-3" /> Übung
            </button>
          </div>

          {/* Finish */}
          <Button className="w-full" onClick={finishTraining}>
            <Check className="w-4 h-4 mr-2" /> Training abschließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
