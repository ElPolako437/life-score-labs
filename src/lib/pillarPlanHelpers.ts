/**
 * Helper to generate pillar plans from simple activation answers.
 */

import { generateTrainingPlan, generateNutritionPlan, generateRecoveryTips, generateMentalTips } from '@/lib/pillarPlans';
import type { PillarKey } from '@/lib/focusPillar';
import type { FullAssessment, ExtendedGoal, RealismData } from '@/lib/goalAssessment';

function makeMockAssessment(pillarKey: string, score: number): FullAssessment {
  const makePillar = (key: string, label: string, s: number) => ({
    key, label, score: s, subIndicators: [],
  });
  return {
    overallScore: score,
    pillars: [
      makePillar('bewegung', 'Bewegung', pillarKey === 'bewegung' ? score : 50),
      makePillar('ernaehrung', 'Ernährung', pillarKey === 'ernaehrung' ? score : 50),
      makePillar('regeneration', 'Recovery', pillarKey === 'regeneration' ? score : 50),
      makePillar('mental', 'Mental', pillarKey === 'mental' ? score : 50),
    ],
  };
}

function makeMockRealism(): RealismData {
  return {
    weeklyRate: '0.5 kg/Woche',
    realismRating: 'mittel-gut',
    realismPercent: 70,
    calorieRange: { min: 1800, max: 2200 },
    proteinTarget: 130,
    fatTarget: 70,
    carbRange: { min: 180, max: 250 },
    trainingDirection: 'Kraft + Ausdauer',
    biggestBottleneck: 'Konsistenz',
    importantPillar: 'Ernährung',
    companionMessage: 'Guter Start!',
  };
}

const defaultGoal: ExtendedGoal = 'routine_building';

export function generatePillarPlan(
  pillar: PillarKey,
  answers: Record<string, any>,
  pillarScore: number,
  goalType?: string,
): { trainingPlanData?: any; nutritionPlan?: any; recoveryTips?: any[]; mentalTips?: any[] } {
  const goal = (goalType || defaultGoal) as ExtendedGoal;
  const assessment = makeMockAssessment(pillar, pillarScore);

  if (pillar === 'bewegung') {
    return { trainingPlanData: generateTrainingPlan(answers, goal) };
  } else if (pillar === 'ernaehrung') {
    // Build realism with personalization-aware calorie targets
    const realism = makeMockRealism();
    if (answers.calorieMin) realism.calorieRange.min = Number(answers.calorieMin);
    if (answers.calorieMax) realism.calorieRange.max = Number(answers.calorieMax);
    if (answers.proteinTarget) realism.proteinTarget = Number(answers.proteinTarget);
    return { nutritionPlan: generateNutritionPlan(realism, goal, answers) };
  } else if (pillar === 'regeneration') {
    return { recoveryTips: generateRecoveryTips(assessment, answers).tips };
  } else if (pillar === 'mental') {
    return { mentalTips: generateMentalTips(assessment, answers).tips };
  }
  return {};
}
