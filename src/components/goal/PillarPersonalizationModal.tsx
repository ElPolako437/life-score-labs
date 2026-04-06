import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Apple, Activity, Moon, Brain, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { generatePillarPlan } from '@/lib/pillarPlanHelpers';
import type { PillarKey } from '@/lib/focusPillar';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

interface PersonalizationQuestion {
  id: string;
  label: string;
  context: string;
  type: 'select' | 'text';
  options?: { value: string; label: string; emoji?: string }[];
  optional?: boolean;
  placeholder?: string;
  skipLabel?: string;
}

interface PillarConfig {
  key: PillarKey;
  title: string;
  subtitle: string;
  icon: typeof Activity;
  questions: PersonalizationQuestion[];
}

/* ═══════════════════════════════════════════════════════════
   PILLAR CONFIGURATIONS (per spec)
   ═══════════════════════════════════════════════════════════ */

const PILLAR_CONFIGS: Record<PillarKey, PillarConfig> = {
  ernaehrung: {
    key: 'ernaehrung',
    title: 'Dein Ernährungsplan',
    subtitle: 'Damit dein Plan wirklich zu dir passt...',
    icon: Apple,
    questions: [
      {
        id: 'mainGoal',
        label: 'Hauptziel',
        context: 'Was soll deine Ernährung diese Woche leisten?',
        type: 'select',
        options: [
          { value: 'fat_loss', label: 'Fettabbau & Defizit' },
          { value: 'muscle_gain', label: 'Muskelaufbau & Protein' },
          { value: 'energy', label: 'Mehr Energie' },
          { value: 'structure', label: 'Bessere Struktur' },
        ],
      },
      {
        id: 'challenge',
        label: 'Größte Herausforderung',
        context: 'Wo liegt dein stärkster Hebel?',
        type: 'select',
        options: [
          { value: 'cravings', label: 'Heißhunger abends' },
          { value: 'no_protein', label: 'Zu wenig Protein' },
          { value: 'no_structure', label: 'Keine Struktur' },
          { value: 'emotional', label: 'Emotionales Essen' },
          { value: 'portions', label: 'Zu große Portionen' },
        ],
      },
      {
        id: 'style',
        label: 'Ernährungsstil',
        context: 'Welcher Stil passt zu dir?',
        type: 'select',
        options: [
          { value: 'alles', label: 'Flexibel / Alles' },
          { value: 'vegetarisch', label: 'Vegetarisch' },
          { value: 'vegan', label: 'Vegan' },
          { value: 'low_carb', label: 'Low Carb' },
          { value: 'mediterran', label: 'Mediterran' },
        ],
      },
      {
        id: 'intolerances',
        label: 'Unverträglichkeiten',
        context: 'Gibt es etwas, das wir ausschließen sollen?',
        type: 'text',
        optional: true,
        placeholder: 'z.B. Laktose, Gluten...',
        skipLabel: 'Keine',
      },
    ],
  },
  bewegung: {
    key: 'bewegung',
    title: 'Dein Trainingsplan',
    subtitle: 'Das hilft uns, die richtigen Akzente zu setzen.',
    icon: Activity,
    questions: [
      {
        id: 'location',
        label: 'Trainingsort',
        context: 'Wo trainierst du diese Woche?',
        type: 'select',
        options: [
          { value: 'gym', label: 'Fitnessstudio' },
          { value: 'home', label: 'Zuhause' },
          { value: 'outdoor', label: 'Draußen' },
          { value: 'mixed', label: 'Gemischt' },
        ],
      },
      {
        id: 'frequency',
        label: 'Tage & Dauer',
        context: 'Wie viel Zeit hast du diese Woche?',
        type: 'select',
        options: [
          { value: '2x30', label: '2x 30 Min' },
          { value: '3x45', label: '3x 45 Min' },
          { value: '4x60', label: '4x 60 Min' },
          { value: '5x45', label: '5x 45 Min' },
          { value: '3x60', label: '3x 60 Min' },
        ],
      },
      {
        id: 'mainFocus',
        label: 'Trainingsfokus',
        context: 'Was soll dein Training diese Woche bewirken?',
        type: 'select',
        options: [
          { value: 'longevity', label: 'Langlebigkeit & Gesundheit' },
          { value: 'muscle_gain', label: 'Muskelaufbau' },
          { value: 'fat_loss', label: 'Fettabbau' },
          { value: 'strength', label: 'Kraft' },
          { value: 'mobility', label: 'Mobilität & Schmerz' },
          { value: 'fitness', label: 'Allgemeine Fitness' },
        ],
      },
    ],
  },
  regeneration: {
    key: 'regeneration',
    title: 'Dein Recovery-Plan',
    subtitle: 'Guter Schlaf verändert alles.',
    icon: Moon,
    questions: [
      {
        id: 'mainProblem',
        label: 'Größte Herausforderung',
        context: 'Wo liegt deine größte Herausforderung?',
        type: 'select',
        options: [
          { value: 'falling_asleep', label: 'Einschlafen dauert zu lang' },
          { value: 'staying_asleep', label: 'Ich wache nachts auf' },
          { value: 'not_rested', label: 'Morgens nicht erholt' },
          { value: 'energy_crash', label: 'Energie bricht tagsüber ein' },
        ],
      },
      {
        id: 'routineTime',
        label: 'Abendroutine',
        context: 'Wie viel Zeit hast du abends für dich?',
        type: 'select',
        options: [
          { value: '10', label: '10 Minuten' },
          { value: '20', label: '20 Minuten' },
          { value: '30', label: '30+ Minuten' },
          { value: 'none', label: 'Kaum Zeit' },
        ],
      },
      {
        id: 'mainCause',
        label: 'Hauptursache',
        context: 'Was beeinflusst deinen Schlaf am stärksten?',
        type: 'select',
        options: [
          { value: 'screen', label: 'Bildschirmzeit zu spät' },
          { value: 'stress', label: 'Stress & Gedanken' },
          { value: 'no_ritual', label: 'Kein festes Ritual' },
          { value: 'late_food', label: 'Spätes Essen/Sport' },
        ],
      },
    ],
  },
  mental: {
    key: 'mental',
    title: 'Dein Mental-Plan',
    subtitle: 'Dein Kopf ist der stärkste Muskel.',
    icon: Brain,
    questions: [
      {
        id: 'mainProblem',
        label: 'Hauptbelastung',
        context: 'Was belastet dich mental am stärksten?',
        type: 'select',
        options: [
          { value: 'rumination', label: 'Grübeln & Gedankenkarussell' },
          { value: 'overwhelm', label: 'Overwhelm & zu viel auf einmal' },
          { value: 'no_focus', label: 'Kein Fokus' },
          { value: 'no_breaks', label: 'Keine mentalen Pausen' },
          { value: 'emotional', label: 'Emotionale Reaktivität' },
        ],
      },
      {
        id: 'stressTiming',
        label: 'Wann am stärksten',
        context: 'Wann trifft dich dieser Zustand am häufigsten?',
        type: 'select',
        options: [
          { value: 'morning', label: 'Morgens beim Aufwachen' },
          { value: 'daytime', label: 'Während der Arbeit' },
          { value: 'evening', label: 'Abends' },
          { value: 'weekend', label: 'Am Wochenende' },
        ],
      },
      {
        id: 'desiredEffect',
        label: 'Gewünschte Wirkung',
        context: 'Was soll dein Plan diese Woche bewirken?',
        type: 'select',
        options: [
          { value: 'calm', label: 'Zur Ruhe kommen' },
          { value: 'focus', label: 'Fokus aufbauen' },
          { value: 'reset', label: 'Mentalen Reset' },
          { value: 'consistency', label: 'Konsistenz etablieren' },
          { value: 'regulate', label: 'Besser regulieren' },
        ],
      },
    ],
  },
};

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

interface PillarPersonalizationModalProps {
  pillar: PillarKey;
  open: boolean;
  onClose: () => void;
  existingAnswers?: Record<string, string>;
}

export default function PillarPersonalizationModal({ pillar, open, onClose, existingAnswers }: PillarPersonalizationModalProps) {
  const { goalPlan, setGoalPlan, pillarScores, profile, nutritionTargets } = useApp();
  const config = PILLAR_CONFIGS[pillar];
  const Icon = config.icon;

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() => existingAnswers || {});
  const [saving, setSaving] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');
  const [isAnimating, setIsAnimating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Smart prefilling from profile/context
  useEffect(() => {
    if (existingAnswers && Object.keys(existingAnswers).length > 0) return;

    const prefilled: Record<string, string> = {};

    if (pillar === 'ernaehrung') {
      // Prefill from goal type
      if (goalPlan?.goalType === 'fat_loss') prefilled.mainGoal = 'fat_loss';
      else if (goalPlan?.goalType === 'muscle_gain') prefilled.mainGoal = 'muscle_gain';
    }

    if (pillar === 'bewegung') {
      // Prefill from follow-up answers
      const days = goalPlan?.followUpAnswers?.trainingDays;
      if (days === '2' || days === 2) prefilled.frequency = '2x30';
      else if (days === '3' || days === 3) prefilled.frequency = '3x45';
      else if (days === '4' || days === 4) prefilled.frequency = '4x60';
      else if (days === '5' || days === 5) prefilled.frequency = '5x45';

      if (goalPlan?.goalType === 'muscle_gain') prefilled.mainFocus = 'muscle_gain';
      else if (goalPlan?.goalType === 'fat_loss') prefilled.mainFocus = 'fat_loss';
    }

    if (pillar === 'regeneration') {
      if (profile.sleepQuality === 'schlecht' || profile.sleepQuality === '1' || profile.sleepQuality === '2') {
        prefilled.mainProblem = 'not_rested';
      }
    }

    if (pillar === 'mental') {
      if (profile.stressLevel === 'hoch' || profile.stressLevel === '4' || profile.stressLevel === '5') {
        prefilled.mainProblem = 'overwhelm';
      }
    }

    if (Object.keys(prefilled).length > 0) {
      setAnswers(prev => ({ ...prefilled, ...prev }));
    }
  }, [pillar, goalPlan, profile, nutritionTargets, existingAnswers]);

  const currentQ = config.questions[currentStep];
  const isLast = currentStep === config.questions.length - 1;
  const isFirst = currentStep === 0;

  const canProceed = currentQ.optional || !!answers[currentQ.id];

  const handleSelect = useCallback((value: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
  }, [currentQ.id]);

  const animateTransition = useCallback((direction: 'forward' | 'backward', callback: () => void) => {
    setSlideDirection(direction);
    setIsAnimating(true);
    setTimeout(() => {
      callback();
      setIsAnimating(false);
    }, 250);
  }, []);

  const handleNext = useCallback(() => {
    if (isLast) {
      // Generate plan
      setSaving(true);
      const personalizationKey = `${pillar}Personalization` as const;

      // Parse frequency for training
      const freqMap: Record<string, { days: string; minutes: string }> = {
        '2x30': { days: '2', minutes: '30' },
        '3x45': { days: '3', minutes: '45' },
        '4x60': { days: '4', minutes: '60' },
        '5x45': { days: '5', minutes: '45' },
        '3x60': { days: '3', minutes: '60' },
      };
      const freq = freqMap[answers.frequency] || { days: '3', minutes: '45' };

      const planAnswers: Record<string, any> = {
        ...answers,
        trainingDays: freq.days,
        trainingLocation: answers.location,
        sessionMinutes: freq.minutes,
        // Pass through for nutrition
        proteinTarget: nutritionTargets?.proteinTarget,
        calorieMin: nutritionTargets?.calorieMin,
        calorieMax: nutritionTargets?.calorieMax,
      };

      const planUpdates = generatePillarPlan(
        pillar,
        planAnswers,
        pillarScores[pillar],
        goalPlan?.goalType,
      );

      setGoalPlan(prev => {
        if (!prev) return prev;
        const weeklyPlan = prev.weeklyPlan || {};
        return {
          ...prev,
          ...planUpdates,
          weeklyPlan: {
            ...weeklyPlan,
            [personalizationKey]: answers,
          },
        };
      });

      setTimeout(() => {
        setSaving(false);
        onClose();
      }, 1500);
    } else {
      animateTransition('forward', () => {
        setCurrentStep(prev => prev + 1);
      });
    }
  }, [isLast, answers, pillar, goalPlan, pillarScores, nutritionTargets, setGoalPlan, onClose, animateTransition]);

  const handleBack = useCallback(() => {
    if (isFirst) {
      onClose();
    } else {
      animateTransition('backward', () => {
        setCurrentStep(prev => prev - 1);
      });
    }
  }, [isFirst, onClose, animateTransition]);

  const handleSkip = useCallback(() => {
    if (currentQ.optional) {
      // Clear any value and proceed
      setAnswers(prev => {
        const next = { ...prev };
        delete next[currentQ.id];
        return next;
      });
      if (isLast) {
        handleNext();
      } else {
        animateTransition('forward', () => {
          setCurrentStep(prev => prev + 1);
        });
      }
    }
  }, [currentQ, isLast, handleNext, animateTransition]);

  if (!open) return null;

  // Saving/generating state
  if (saving) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-lg bg-background border-t border-border/30 rounded-t-2xl p-5 pb-10"
          style={{ maxHeight: '85vh', animation: 'slideUp 0.3s ease-out' }}
        >
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-foreground font-outfit">Dein Plan wird erstellt...</p>
              <p className="text-[11px] text-muted-foreground">Personalisiert auf deine Antworten</p>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0.5; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-background border-t border-border/30 rounded-t-2xl p-5 pb-8"
        style={{ maxHeight: '85vh', animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header: back button + title + close */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-lg bg-secondary/30 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="text-center flex-1 mx-3">
            <p className="text-sm font-bold text-foreground font-outfit">{config.title}</p>
            <p className="text-[10px] text-muted-foreground">{config.subtitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary/30 flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Progress bar (thin, not numbered) */}
        <div className="flex gap-1.5 mb-6">
          {config.questions.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 rounded-full flex-1 transition-all duration-500',
                i < currentStep ? 'bg-primary' : i === currentStep ? 'bg-primary/70' : 'bg-secondary/40',
              )}
            />
          ))}
        </div>

        {/* Question area with slide animation */}
        <div className="overflow-hidden mb-6" ref={contentRef}>
          <div
            className={cn(
              'transition-all duration-250 ease-out',
              isAnimating && slideDirection === 'forward' && 'translate-x-[-100%] opacity-0',
              isAnimating && slideDirection === 'backward' && 'translate-x-[100%] opacity-0',
              !isAnimating && 'translate-x-0 opacity-100',
            )}
          >
            {/* Context text */}
            <p className="text-xs text-muted-foreground mb-1.5">{currentQ.context}</p>
            <p className="text-sm font-semibold text-foreground mb-4">{currentQ.label}</p>

            {/* Select options */}
            {currentQ.type === 'select' && currentQ.options && (
              <div className="space-y-2">
                {currentQ.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'w-full text-left px-4 py-3.5 rounded-xl border transition-all active:scale-[0.98]',
                      answers[currentQ.id] === opt.value
                        ? 'border-primary/40 bg-primary/10 text-foreground shadow-sm'
                        : 'border-border/25 bg-card/60 text-foreground',
                    )}
                    style={{ minHeight: '48px' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                        answers[currentQ.id] === opt.value
                          ? 'border-primary bg-primary'
                          : 'border-border/40',
                      )}>
                        {answers[currentQ.id] === opt.value && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-sm">{opt.emoji ? `${opt.emoji} ` : ''}{opt.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Text input */}
            {currentQ.type === 'text' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={answers[currentQ.id] || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                  placeholder={currentQ.placeholder}
                  className="w-full px-4 py-3.5 rounded-xl border border-border/25 bg-card/60 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors"
                  style={{ minHeight: '48px' }}
                />
                {currentQ.skipLabel && (
                  <button
                    onClick={handleSkip}
                    className="text-xs text-muted-foreground/60 font-medium active:text-muted-foreground transition-colors"
                  >
                    {currentQ.skipLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={cn(
            'w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]',
            canProceed
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/40 text-muted-foreground/50',
          )}
          style={{ minHeight: '48px' }}
        >
          {isLast ? 'Plan generieren' : (
            <span className="flex items-center justify-center gap-1.5">
              Weiter <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0.5; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
