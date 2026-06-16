import type { Goal, StartProfile } from '@/contexts/ResetContext';

export const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;
export type Weekday = typeof WEEKDAYS[number];

export interface WeekPlanDay {
  day: Weekday;
  training: boolean;
}

export interface WeekPlan {
  days: WeekPlanDay[];
  trainingTarget: number;
  walkMin: number;
  proteinTarget: number; // g per meal
  mealCount: number;
}

/** Recommended training days from training activity level. */
export function trainingTargetFor(profile: StartProfile | null): number {
  if (!profile) return 3;
  return { low: 2, moderate: 3, high: 4 }[profile.activity] ?? 3;
}

/**
 * Build a simple, shareable weekly skeleton. Daily anchors (walk, protein,
 * sleep) are constant; training sits on the days the user picked.
 */
export function buildWeekStructure(
  profile: StartProfile | null,
  goal: Goal | null,
  selectedDays: Weekday[],
): WeekPlan {
  const days = WEEKDAYS.map(day => ({ day, training: selectedDays.includes(day) }));
  return {
    days,
    trainingTarget: trainingTargetFor(profile),
    walkMin: goal === 'fatloss' ? 15 : 10,
    proteinTarget: profile ? Math.round(profile.proteinHigh / profile.mealCount / 5) * 5 : 35,
    mealCount: profile?.mealCount ?? 3,
  };
}
