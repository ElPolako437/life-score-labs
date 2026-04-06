import { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { calculatePillarAssessment, calculateRealism, type ExtendedGoal, type FullAssessment, type RealismData, EXTENDED_GOAL_OPTIONS } from '@/lib/goalAssessment';
import { mapGoalTypeToZiel } from '@/lib/zielsystem';
import { Activity, Apple, Moon, Brain, ChevronRight } from 'lucide-react';
import GoalSelection from '@/components/goal/GoalSelection';
import GoalQuestions from '@/components/goal/GoalQuestions';
import GoalRealism from '@/components/goal/GoalRealism';
import GoalPillarAssessment from '@/components/goal/GoalPillarAssessment';
import GoalSummaryDashboard from '@/components/goal/GoalSummaryDashboard';
import PillarDetailNutrition from '@/components/goal/PillarDetailNutrition';
import PillarDetailTraining from '@/components/goal/PillarDetailTraining';
import PillarDetailRecovery from '@/components/goal/PillarDetailRecovery';
import PillarDetailMental from '@/components/goal/PillarDetailMental';
import type { NutritionPlan, TrainingPlan, TipCard, MentalTip } from '@/lib/pillarPlans';

type GoalStep = 'selection' | 'questions' | 'realism' | 'assessment' | 'summary' | 'pillar_ernaehrung' | 'pillar_bewegung' | 'pillar_regeneration' | 'pillar_mental';

function goalTypeToExtended(type: string): ExtendedGoal | null {
  const valid: ExtendedGoal[] = ['fat_loss', 'muscle_gain', 'recomp', 'sleep_improvement', 'stress_reduction', 'energy_recovery', 'routine_building'];
  if (valid.includes(type as ExtendedGoal)) return type as ExtendedGoal;
  if (type === 'longevity') return 'routine_building';
  return null;
}

const VALID_PILLAR_PARAMS = ['bewegung', 'ernaehrung', 'regeneration', 'mental'] as const;

export default function AppZielsystem() {
  const { profile, goalPlan, setGoalPlan, pillarScores } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const hasCompletedSetup = !!(goalPlan?.pillarAssessment && goalPlan?.followUpAnswers);

  const [step, setStep] = useState<GoalStep>(() => {
    // Deep-link: if ?pillar=xxx is present and setup is done, jump straight to that pillar detail
    const pillarParam = searchParams.get('pillar');
    if (hasCompletedSetup && pillarParam && (VALID_PILLAR_PARAMS as readonly string[]).includes(pillarParam)) {
      return `pillar_${pillarParam}` as GoalStep;
    }
    if (hasCompletedSetup) return 'summary';
    if (goalPlan?.goalType && goalTypeToExtended(goalPlan.goalType)) return 'questions';
    return 'selection';
  });

  // Consume the pillar param after mount so navigating away and back resets to default
  useEffect(() => {
    const pillarParam = searchParams.get('pillar');
    if (pillarParam) {
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [primaryGoal, setPrimaryGoal] = useState<ExtendedGoal | null>(() => {
    if (goalPlan?.goalType) return goalTypeToExtended(goalPlan.goalType) || 'fat_loss';
    return null;
  });
  const [secondaryGoal, setSecondaryGoal] = useState<ExtendedGoal | undefined>(() => {
    return goalPlan?.secondaryGoal ? goalTypeToExtended(goalPlan.secondaryGoal) || undefined : undefined;
  });
  const [answers, setAnswers] = useState<Record<string, any>>(() => goalPlan?.followUpAnswers || {});
  const [assessment, setAssessment] = useState<FullAssessment | null>(() => goalPlan?.pillarAssessment || null);
  const [realism, setRealism] = useState<RealismData | null>(() => goalPlan?.realismResult || null);

  const handleGoalSelected = useCallback((primary: ExtendedGoal, secondary?: ExtendedGoal) => {
    setPrimaryGoal(primary);
    setSecondaryGoal(secondary);
    setStep('questions');
  }, []);

  const handleQuestionsComplete = useCallback((ans: Record<string, any>) => {
    if (!primaryGoal) return;
    setAnswers(ans);
    const assess = calculatePillarAssessment(primaryGoal, ans, profile);
    const real = calculateRealism(primaryGoal, ans, profile, assess);
    setAssessment(assess);
    setRealism(real);
    setStep('realism');
  }, [primaryGoal, profile]);

  const handleSaveAndFinish = useCallback(() => {
    if (!primaryGoal || !assessment || !realism) return;
    const goalLabel = EXTENDED_GOAL_OPTIONS.find(g => g.type === primaryGoal)?.label || primaryGoal;
    const weightDiff = (Number(answers.currentWeight) || profile.weight) - (Number(answers.goalWeight) || profile.weight);
    const timeframe = Number(answers.timeframe) || 12;

    setGoalPlan(prev => ({
      goalType: primaryGoal,
      goalDescription: weightDiff > 0 ? `${weightDiff} kg ${goalLabel}` : goalLabel,
      targetDate: new Date(Date.now() + timeframe * 7 * 86400000).toISOString().split('T')[0],
      targetWeeks: timeframe,
      createdAt: prev?.createdAt || new Date().toISOString(),
      weeklyPlan: prev?.weeklyPlan || null,
      realismResult: realism,
      completedBlocks: prev?.completedBlocks || [],
      remindersEnabled: prev?.remindersEnabled || false,
      secondaryGoal: secondaryGoal || '',
      followUpAnswers: answers,
      pillarAssessment: assessment,
      // Preserve existing pillar plans
      nutritionPlan: prev?.nutritionPlan,
      trainingPlanData: prev?.trainingPlanData,
      recoveryTips: prev?.recoveryTips,
      mentalTips: prev?.mentalTips,
      planCheckInHistory: prev?.planCheckInHistory,
    }));
    setStep('summary');
  }, [primaryGoal, secondaryGoal, answers, assessment, realism, profile, setGoalPlan]);

  const handleReset = useCallback(() => {
    setPrimaryGoal(null);
    setSecondaryGoal(undefined);
    setAnswers({});
    setAssessment(null);
    setRealism(null);
    setStep('selection');
  }, []);

  const handleOpenPillar = useCallback((pillarKey: string) => {
    setStep(`pillar_${pillarKey}` as GoalStep);
  }, []);

  // Pillar plan persistence callbacks
  const handleNutritionPlanGenerated = useCallback((plan: NutritionPlan) => {
    setGoalPlan(prev => prev ? { ...prev, nutritionPlan: plan } : prev);
  }, [setGoalPlan]);

  const handleTrainingPlanGenerated = useCallback((plan: TrainingPlan) => {
    setGoalPlan(prev => prev ? { ...prev, trainingPlanData: plan } : prev);
  }, [setGoalPlan]);

  const handleRecoveryTipsGenerated = useCallback((tips: TipCard[]) => {
    setGoalPlan(prev => prev ? { ...prev, recoveryTips: tips } : prev);
  }, [setGoalPlan]);

  const handleMentalTipsGenerated = useCallback((tips: MentalTip[]) => {
    setGoalPlan(prev => prev ? { ...prev, mentalTips: tips } : prev);
  }, [setGoalPlan]);

  const PILLAR_NAV = [
    { key: 'bewegung', label: 'Training', icon: Activity, color: 'text-primary' },
    { key: 'ernaehrung', label: 'Ernährung', icon: Apple, color: 'text-orange-400' },
    { key: 'regeneration', label: 'Recovery', icon: Moon, color: 'text-blue-400' },
    { key: 'mental', label: 'Mental', icon: Brain, color: 'text-purple-400' },
  ] as const;

  return (
    <div className="px-4 pt-6 pb-24 animate-enter">
      {/* Sub-navigation links (visible on summary) */}
      {step === 'summary' && hasCompletedSetup && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {PILLAR_NAV.map(pn => {
            const Icon = pn.icon;
            return (
              <button
                key={pn.key}
                onClick={() => handleOpenPillar(pn.key)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/20 active:scale-95 transition-transform"
                style={{ background: 'var(--gradient-card)' }}
              >
                <Icon className={`w-4 h-4 ${pn.color}`} />
                <span className="text-[9px] font-semibold text-muted-foreground">{pn.label}</span>
              </button>
            );
          })}
        </div>
      )}
      {step === 'selection' && (
        <GoalSelection
          onComplete={handleGoalSelected}
          initialPrimary={primaryGoal || undefined}
          initialSecondary={secondaryGoal}
        />
      )}
      {step === 'questions' && primaryGoal && (
        <GoalQuestions
          goal={primaryGoal}
          initialAnswers={Object.keys(answers).length > 0 ? answers : undefined}
          onComplete={handleQuestionsComplete}
          onBack={() => setStep('selection')}
        />
      )}
      {step === 'realism' && primaryGoal && realism && (
        <GoalRealism
          goal={primaryGoal}
          realism={realism}
          onContinue={() => setStep('assessment')}
          onBack={() => setStep('questions')}
        />
      )}
      {step === 'assessment' && assessment && (
        <GoalPillarAssessment
          assessment={assessment}
          onContinue={handleSaveAndFinish}
          onBack={() => setStep('realism')}
        />
      )}
      {step === 'summary' && primaryGoal && realism && assessment && (assessment as any).pillars?.length > 0 && (
        <GoalSummaryDashboard
          goal={primaryGoal}
          secondaryGoal={secondaryGoal}
          realism={realism}
          assessment={assessment}
          answers={answers}
          onReset={handleReset}
          onOpenPillar={handleOpenPillar}
        />
      )}
      {step === 'pillar_ernaehrung' && primaryGoal && realism && (
        <PillarDetailNutrition
          realism={realism}
          goal={primaryGoal}
          onBack={() => setStep('summary')}
          onPlanGenerated={handleNutritionPlanGenerated}
        />
      )}
      {step === 'pillar_bewegung' && primaryGoal && (
        <PillarDetailTraining
          answers={answers}
          goal={primaryGoal}
          onBack={() => setStep('summary')}
          onPlanGenerated={handleTrainingPlanGenerated}
        />
      )}
      {step === 'pillar_regeneration' && assessment && (
        <PillarDetailRecovery
          assessment={assessment}
          answers={answers}
          onBack={() => setStep('summary')}
          onTipsGenerated={handleRecoveryTipsGenerated}
        />
      )}
      {step === 'pillar_mental' && assessment && (
        <PillarDetailMental
          assessment={assessment}
          answers={answers}
          onBack={() => setStep('summary')}
          onTipsGenerated={handleMentalTipsGenerated}
        />
      )}
    </div>
  );
}
