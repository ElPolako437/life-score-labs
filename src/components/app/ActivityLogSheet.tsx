import { useState, useCallback } from 'react';
import { useApp, type ActivityLog } from '@/contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Apple, Moon, Brain, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import ExerciseDetailForm, { createEmptyExercise, exerciseEntriesToTrainingExercises, type ExerciseEntry } from '@/components/app/ExerciseDetailForm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BEWEGUNG_TYPES = ['Krafttraining', 'Cardio', 'Spaziergang', 'Yoga', 'Sport'];
const REGENERATION_TYPES = ['Sauna', 'Stretching', 'Meditation', 'Nickerchen', 'Spaziergang'];
const MENTAL_TYPES = ['Atemübung', 'Journaling', 'Dankbarkeit', 'Digital Detox', 'Lesen'];
const INTENSITY_OPTIONS = ['leicht', 'mittel', 'intensiv'];

export default function ActivityLogSheet({ open, onOpenChange }: Props) {
  const { addActivityLog, addTrainingLog, trainingLogs } = useApp();
  const [tab, setTab] = useState('bewegung');
  const [type, setType] = useState('');
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState('mittel');
  const [note, setNote] = useState('');
  const [mealName, setMealName] = useState('');
  const [showExerciseDetails, setShowExerciseDetails] = useState(false);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([createEmptyExercise()]);

  const resetForm = () => {
    setType('');
    setDuration(30);
    setIntensity('mittel');
    setNote('');
    setMealName('');
    setShowExerciseDetails(false);
    setExercises([createEmptyExercise()]);
  };

  const logActivity = useCallback((pillar: ActivityLog['pillar'], actType: string, dur: number, int?: string, n?: string) => {
    addActivityLog({
      pillar,
      type: actType,
      label: actType,
      duration: dur,
      source: 'manual',
      intensity: int,
      note: n || undefined,
    });
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    resetForm();
    onOpenChange(false);
  }, [addActivityLog, onOpenChange]);

  const handleSubmit = () => {
    if (tab === 'ernaehrung') {
      if (!mealName.trim()) return;
      logActivity('ernaehrung', mealName, 0);
    } else {
      if (!type) return;

      // If exercise details are filled, also save a training log
      if (tab === 'bewegung' && showExerciseDetails) {
        const validExercises = exerciseEntriesToTrainingExercises(exercises);
        if (validExercises.length > 0) {
          addTrainingLog({
            date: new Date().toISOString().split('T')[0],
            exercises: validExercises,
            duration,
            type,
            source: 'manual',
            note: note || undefined,
          });
        }
      }

      logActivity(
        tab as ActivityLog['pillar'],
        type,
        duration,
        tab === 'bewegung' ? intensity : undefined,
        note || undefined,
      );
    }
  };

  const typeOptions = tab === 'bewegung' ? BEWEGUNG_TYPES : tab === 'regeneration' ? REGENERATION_TYPES : MENTAL_TYPES;
  const isKraft = tab === 'bewegung' && (type === 'Krafttraining' || type === 'Sport');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t border-border/30 bg-background px-4 pb-8 max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="font-outfit text-base">Aktivitaet tracken</SheetTitle>
        </SheetHeader>

        <Tabs value={tab} onValueChange={(v) => { setTab(v); resetForm(); }} className="space-y-4">
          <TabsList className="w-full grid grid-cols-4 bg-secondary/30 border border-border/20 rounded-xl h-9">
            <TabsTrigger value="bewegung" className="text-[10px] gap-1 rounded-lg"><Activity className="w-3 h-3" />Bewegung</TabsTrigger>
            <TabsTrigger value="ernaehrung" className="text-[10px] gap-1 rounded-lg"><Apple className="w-3 h-3" />Ernährung</TabsTrigger>
            <TabsTrigger value="regeneration" className="text-[10px] gap-1 rounded-lg"><Moon className="w-3 h-3" />Recovery</TabsTrigger>
            <TabsTrigger value="mental" className="text-[10px] gap-1 rounded-lg"><Brain className="w-3 h-3" />Mental</TabsTrigger>
          </TabsList>

          {/* Ernährung - quick meal */}
          <TabsContent value="ernaehrung" className="space-y-3">
            <Input
              placeholder="Was hast du gegessen?"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              className="bg-secondary/30 border-border/20"
            />
            <Button onClick={handleSubmit} disabled={!mealName.trim()} className="w-full">
              Mahlzeit loggen
            </Button>
          </TabsContent>

          {/* Bewegung / Regeneration / Mental */}
          {['bewegung', 'regeneration', 'mental'].map(pillar => (
            <TabsContent key={pillar} value={pillar} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Typ</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-secondary/30 border-border/20">
                    <SelectValue placeholder="Waehle eine Aktivitaet" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Dauer</label>
                  <span className="text-xs text-primary font-semibold">{duration} Min</span>
                </div>
                <Slider
                  value={[duration]}
                  onValueChange={([v]) => setDuration(v)}
                  min={5}
                  max={120}
                  step={5}
                  className="py-2"
                />
              </div>

              {pillar === 'bewegung' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Intensitaet</label>
                  <div className="flex gap-2">
                    {INTENSITY_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setIntensity(opt)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                          intensity === opt
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-secondary/20 border-border/20 text-muted-foreground'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Input
                placeholder="Notiz (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-secondary/30 border-border/20"
              />

              {/* Optional exercise details for Krafttraining */}
              {isKraft && (
                <div>
                  <button
                    onClick={() => setShowExerciseDetails(!showExerciseDetails)}
                    className="flex items-center gap-1.5 text-[11px] text-primary/70 font-medium hover:text-primary transition-colors"
                  >
                    <Dumbbell className="w-3.5 h-3.5" />
                    Mehr Details (optional)
                    {showExerciseDetails
                      ? <ChevronUp className="w-3 h-3" />
                      : <ChevronDown className="w-3 h-3" />
                    }
                  </button>
                  {showExerciseDetails && (
                    <div className="mt-2 rounded-xl border border-border/30 bg-card/60 p-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                      <ExerciseDetailForm
                        exercises={exercises}
                        onChange={setExercises}
                        trainingLogs={trainingLogs}
                        compact
                      />
                    </div>
                  )}
                </div>
              )}

              <Button onClick={handleSubmit} disabled={!type} className="w-full">
                Aktivitaet loggen
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
