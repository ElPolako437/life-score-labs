/**
 * Daily Plan Assembly Pipeline
 * Merges all pillar plans into today's action blocks.
 */

import type { GoalPlanData } from '@/contexts/AppContext';

export interface DailyBlock {
  type: string;
  label: string;
  time: string;
  duration: number;
  description: string;
  priority: string;
  completed?: boolean;
  pillar: 'bewegung' | 'ernaehrung' | 'regeneration' | 'mental';
  source: 'weekly' | 'training' | 'nutrition' | 'recovery' | 'mental';
}

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export function assembleDailyPlan(goalPlan: GoalPlanData | null): DailyBlock[] {
  if (!goalPlan) return [];
  
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const blocks: DailyBlock[] = [];
  const todayName = DAYS[todayIdx];

  // 1. Training plan blocks
  if (goalPlan.trainingPlanData?.days) {
    const trainingDay = goalPlan.trainingPlanData.days[todayIdx];
    if (trainingDay?.isTraining) {
      blocks.push({
        type: 'training',
        label: trainingDay.sessionType,
        time: '08:00',
        duration: trainingDay.duration,
        description: `${trainingDay.exercises?.length || 0} Übungen`,
        priority: 'high',
        pillar: 'bewegung',
        source: 'training',
      });
    } else if (trainingDay?.movementSuggestion) {
      blocks.push({
        type: 'movement',
        label: 'Aktive Erholung',
        time: '10:00',
        duration: 20,
        description: trainingDay.movementSuggestion,
        priority: 'medium',
        pillar: 'bewegung',
        source: 'training',
      });
    }
  }

  // 2. Recovery tip as daily block (rotate from pool)
  if (goalPlan.recoveryTips && goalPlan.recoveryTips.length > 0) {
    const tipIdx = todayIdx % goalPlan.recoveryTips.length;
    const tip = goalPlan.recoveryTips[tipIdx];
    blocks.push({
      type: 'recovery',
      label: tip.title || 'Recovery-Tipp',
      time: '20:00',
      duration: 10,
      description: tip.text || '',
      priority: 'medium',
      pillar: 'regeneration',
      source: 'recovery',
    });
  }

  // 3. Mental tip as daily block
  if (goalPlan.mentalTips && goalPlan.mentalTips.length > 0) {
    const tipIdx = todayIdx % goalPlan.mentalTips.length;
    const tip = goalPlan.mentalTips[tipIdx];
    blocks.push({
      type: 'decompression',
      label: tip.title || 'Mental-Tipp',
      time: '15:00',
      duration: 5,
      description: tip.text || '',
      priority: 'medium',
      pillar: 'mental',
      source: 'mental',
    });
  }

  return blocks;
}

/** Check if a pillar's items have been consistently skipped (3+ days) */
export function getSkippedPillarWarning(
  planCheckInHistory: Record<string, Record<string, 'done' | 'partial' | 'skipped'>> | undefined,
): { pillar: string; label: string } | null {
  if (!planCheckInHistory) return null;
  
  const pillarSkipCounts: Record<string, number> = {};
  const dates = Object.keys(planCheckInHistory).sort().slice(-5);
  
  for (const date of dates) {
    const items = planCheckInHistory[date];
    for (const [key, status] of Object.entries(items)) {
      if (status === 'skipped') {
        const pillar = key.split('_')[0];
        pillarSkipCounts[pillar] = (pillarSkipCounts[pillar] || 0) + 1;
      }
    }
  }

  const PILLAR_LABELS: Record<string, string> = {
    bewegung: 'Bewegung', ernaehrung: 'Ernährung',
    regeneration: 'Recovery', mental: 'Mental',
  };

  for (const [pillar, count] of Object.entries(pillarSkipCounts)) {
    if (count >= 3) {
      return { pillar, label: PILLAR_LABELS[pillar] || pillar };
    }
  }
  return null;
}
