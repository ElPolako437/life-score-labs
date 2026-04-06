import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Dumbbell, Apple, Loader2, ChevronRight, Clock, Flame, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

type PlanType = 'training' | 'nutrition';

interface TrainingDay {
  day: string;
  focus: string;
  duration?: string;
  exercises: { name: string; sets: number; reps: string; rest?: string; notes?: string }[];
}

interface TrainingPlan {
  title: string;
  description: string;
  days: TrainingDay[];
}

interface NutritionPlan {
  title: string;
  description: string;
  dailyCalories: number;
  macros: { protein: number; carbs: number; fat: number };
  meals: { name: string; time: string; calories: number; protein?: number; items: string[]; longevityNote?: string }[];
  tips?: string[];
}

const PLAN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-plan`;

const TRAINING_GOALS = ['Fettabbau', 'Muskelaufbau', 'Longevity', 'Mobilität'];
const EQUIPMENT = ['Gym', 'Home', 'Outdoor'];
const EXPERIENCE = ['Anfänger', 'Fortgeschritten', 'Erfahren'];
const NUTRITION_GOALS = ['Abnehmen', 'Aufbauen', 'Halten', 'Longevity'];

export default function AppPlans() {
  const { profile, generatedPlans, addGeneratedPlan } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'generate'>('overview');
  const [planType, setPlanType] = useState<PlanType>('training');
  const [generating, setGenerating] = useState(false);

  // Training prefs
  const [tGoal, setTGoal] = useState(TRAINING_GOALS[0]);
  const [tDays, setTDays] = useState(4);
  const [tEquipment, setTEquipment] = useState(EQUIPMENT[0]);
  const [tExperience, setTExperience] = useState(EXPERIENCE[1]);

  // Nutrition prefs
  const [nGoal, setNGoal] = useState(NUTRITION_GOALS[0]);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const preferences = planType === 'training'
        ? { goal: tGoal, daysPerWeek: tDays, equipment: tEquipment, experience: tExperience }
        : { goal: nGoal };

      const resp = await fetch(PLAN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: planType,
          preferences,
          userContext: {
            name: profile.name, age: profile.age, gender: profile.gender,
            height: profile.height, weight: profile.weight,
            goals: profile.goals, activityLevel: profile.activityLevel,
          },
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Generierung fehlgeschlagen');
      }

      const data = await resp.json();
      if (data.plan) {
        addGeneratedPlan({ id: crypto.randomUUID(), type: planType, plan: data.plan, createdAt: new Date().toISOString() });
        setActiveTab('overview');
        toast.success('Plan erstellt!');
      }
    } catch (e: any) {
      toast.error(e.message || 'Plan konnte nicht erstellt werden');
    } finally {
      setGenerating(false);
    }
  };

  const trainingPlans = generatedPlans.filter(p => p.type === 'training');
  const nutritionPlans = generatedPlans.filter(p => p.type === 'nutrition');

  if (activeTab === 'generate') {
    return (
      <div className="px-5 pt-8 pb-4 space-y-6 animate-enter">
        <h1 className="font-outfit text-2xl font-bold text-foreground">
          {planType === 'training' ? 'Trainingsplan' : 'Ernährungsplan'} erstellen
        </h1>

        {/* Plan type toggle */}
        <div className="flex gap-2">
          {(['training', 'nutrition'] as PlanType[]).map(t => (
            <button
              key={t}
              onClick={() => setPlanType(t)}
              className={`flex-1 rounded-xl p-3 text-sm font-medium transition-all ${
                planType === t
                  ? 'bg-primary/10 border border-primary/30 text-primary'
                  : 'bg-secondary/40 border border-border/40 text-muted-foreground'
              }`}
            >
              {t === 'training' ? '🏋️ Training' : '🥗 Ernährung'}
            </button>
          ))}
        </div>

        {planType === 'training' ? (
          <div className="space-y-4">
            <OptionGroup label="Ziel" options={TRAINING_GOALS} value={tGoal} onChange={setTGoal} />
            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">Trainingstage / Woche</span>
              <div className="flex gap-2">
                {[3, 4, 5, 6].map(d => (
                  <button
                    key={d}
                    onClick={() => setTDays(d)}
                    className={`flex-1 rounded-xl p-2.5 text-sm font-medium transition-all ${
                      tDays === d
                        ? 'bg-primary/10 border border-primary/30 text-primary'
                        : 'bg-secondary/40 border border-border/40 text-muted-foreground'
                    }`}
                  >
                    {d}x
                  </button>
                ))}
              </div>
            </div>
            <OptionGroup label="Equipment" options={EQUIPMENT} value={tEquipment} onChange={setTEquipment} />
            <OptionGroup label="Erfahrung" options={EXPERIENCE} value={tExperience} onChange={setTExperience} />
          </div>
        ) : (
          <div className="space-y-4">
            <OptionGroup label="Ziel" options={NUTRITION_GOALS} value={nGoal} onChange={setNGoal} />
            <div className="card-elegant rounded-2xl p-4 space-y-2">
              <span className="text-xs text-muted-foreground">Dein Profil wird berücksichtigt:</span>
              <div className="text-sm text-foreground">
                {profile.age} Jahre · {profile.height} cm · {profile.weight} kg · {profile.activityLevel}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setActiveTab('overview')} className="flex-1">Zurück</Button>
          <Button onClick={generatePlan} disabled={generating} className="flex-1">
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {generating ? 'Generiere…' : 'Plan erstellen'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-8 pb-4 space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <h1 className="font-outfit text-2xl font-bold text-foreground">Meine Pläne</h1>
        <Button size="sm" onClick={() => setActiveTab('generate')}>
          + Neuer Plan
        </Button>
      </div>

      {/* Training Plans */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-primary" /> Trainingspläne
        </h2>
        {trainingPlans.length === 0 ? (
          <Card className="border-dashed border-border/40">
            <CardContent className="p-5 text-center text-sm text-muted-foreground">
              Noch kein Trainingsplan erstellt. Lass dir einen von der KI generieren!
            </CardContent>
          </Card>
        ) : (
          trainingPlans.map(p => <TrainingPlanCard key={p.id} plan={p.plan as TrainingPlan} />)
        )}
      </div>

      {/* Nutrition Plans */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Apple className="w-4 h-4 text-primary" /> Ernährungspläne
        </h2>
        {nutritionPlans.length === 0 ? (
          <Card className="border-dashed border-border/40">
            <CardContent className="p-5 text-center text-sm text-muted-foreground">
              Noch kein Ernährungsplan erstellt. Lass dir einen von der KI generieren!
            </CardContent>
          </Card>
        ) : (
          nutritionPlans.map(p => <NutritionPlanCard key={p.id} plan={p.plan as NutritionPlan} />)
        )}
      </div>
    </div>
  );
}

function OptionGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              value === o
                ? 'bg-primary/10 border border-primary/30 text-primary'
                : 'bg-secondary/40 border border-border/40 text-muted-foreground'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function TrainingPlanCard({ plan }: { plan: TrainingPlan }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card-elegant rounded-2xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center justify-between text-left">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{plan.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {plan.days.map((day, i) => (
            <div key={i} className="bg-secondary/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{day.day}</span>
                <span className="text-xs text-primary">{day.focus}</span>
              </div>
              {day.duration && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" /> {day.duration}
                </div>
              )}
              {day.exercises.map((ex, j) => (
                <div key={j} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{ex.name}</span>
                  <span className="text-foreground font-medium">{ex.sets} × {ex.reps}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NutritionPlanCard({ plan }: { plan: NutritionPlan }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card-elegant rounded-2xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center justify-between text-left">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{plan.title}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-primary flex items-center gap-1">
              <Flame className="w-3 h-3" /> {plan.dailyCalories} kcal
            </span>
            <span className="text-xs text-muted-foreground">
              P: {plan.macros.protein}g · K: {plan.macros.carbs}g · F: {plan.macros.fat}g
            </span>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {plan.meals.map((meal, i) => (
            <div key={i} className="bg-secondary/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{meal.name}</span>
                <span className="text-xs text-muted-foreground">{meal.time} · {meal.calories} kcal</span>
              </div>
              {meal.items.map((item, j) => (
                <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-3 h-3 text-primary" /> {item}
                </div>
              ))}
              {meal.longevityNote && (
                <p className="text-xs text-primary/80 italic">💡 {meal.longevityNote}</p>
              )}
            </div>
          ))}
          {plan.tips && plan.tips.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-medium text-foreground">Longevity-Tipps:</span>
              {plan.tips.map((tip, i) => (
                <p key={i} className="text-xs text-muted-foreground">• {tip}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
