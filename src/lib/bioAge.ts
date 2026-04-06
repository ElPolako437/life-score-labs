import type { PillarScores } from '@/contexts/AppContext';

/**
 * Calculates a behavioural bio-age delta (in years).
 * Negative = biologically younger, positive = biologically older.
 */
export function calculateBioAgeDelta(
  score: number,
  streak: number,
  weeklyConsistency: number,
  pillarScores: PillarScores,
  checkInCount: number,
): number {
  // Base delta from score
  let base: number;
  if (score >= 80) {
    // -5 to -8
    base = -5 - ((score - 80) / 20) * 3;
  } else if (score >= 60) {
    // -1 to -5
    base = -1 - ((score - 60) / 20) * 4;
  } else if (score >= 50) {
    // 0 to -1
    base = -((score - 50) / 10);
  } else if (score >= 35) {
    // 0 to +3
    base = ((50 - score) / 15) * 3;
  } else {
    // +3 to +6
    base = 3 + ((35 - score) / 35) * 3;
  }

  // Streak bonus (7+ days → up to -0.5)
  const streakBonus = streak >= 7 ? -Math.min(0.5, (streak - 7) * 0.03 + 0.3) : 0;

  // Consistency bonus (>80% → -0.3)
  const consistencyBonus = weeklyConsistency >= 80 ? -0.3 : weeklyConsistency >= 60 ? -0.15 : 0;

  // Pillar balance bonus — low variance = better
  const scores = [pillarScores.bewegung, pillarScores.ernaehrung, pillarScores.regeneration, pillarScores.mental];
  const avg = scores.reduce((s, v) => s + v, 0) / 4;
  const variance = scores.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / 4;
  const stdDev = Math.sqrt(variance);
  const balanceBonus = stdDev < 10 ? -0.3 : stdDev < 15 ? -0.15 : 0;

  // Precision factor — more check-ins = more confident
  const precisionFactor = Math.min(1, checkInCount / 14);

  const raw = base + streakBonus + consistencyBonus + balanceBonus;
  // Round to 1 decimal
  return Math.round(raw * precisionFactor * 10) / 10;
}

export function formatBioAgeDelta(delta: number): { text: string; isPositive: boolean } {
  if (delta <= -0.1) {
    return { text: `Biologisch ${Math.abs(delta).toFixed(1)} Jahre jünger`, isPositive: true };
  }
  if (delta >= 0.1) {
    return { text: `Biologisch ${delta.toFixed(1)} Jahre älter`, isPositive: false };
  }
  return { text: 'Biologisch auf deinem chronologischen Alter', isPositive: true };
}
