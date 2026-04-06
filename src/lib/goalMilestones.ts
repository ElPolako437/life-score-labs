export interface Milestone {
  id: string;
  label: string;
  description: string;
  reached: boolean;
}

export interface MilestoneResult {
  milestones: Milestone[];
  newlyReached: Milestone[];
}

/**
 * Check goal milestones based on current plan state.
 */
export function checkMilestones(
  goalPlan: any,
  pillarScores: any,
  scoreHistory: any[],
): MilestoneResult {
  if (!goalPlan?.weeklyPlan?.weeklyBlocks) {
    return { milestones: [], newlyReached: [] };
  }

  const blocks = goalPlan.weeklyPlan.weeklyBlocks;
  const totalBlocks = blocks.reduce((s: number, d: any) => s + d.blocks.length, 0);
  const completedBlocks = blocks.reduce((s: number, d: any) => s + d.blocks.filter((b: any) => b.completed).length, 0);
  const adherence = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

  const createdAt = goalPlan.createdAt ? new Date(goalPlan.createdAt) : new Date();
  const daysSincePlan = Math.ceil((Date.now() - createdAt.getTime()) / 86400000);
  const targetDate = goalPlan.targetDate ? new Date(goalPlan.targetDate) : new Date();
  const totalDays = Math.max(1, Math.ceil((targetDate.getTime() - createdAt.getTime()) / 86400000));
  const halfwayDays = Math.ceil(totalDays / 2);

  // Focus pillar delta
  const focusPillar = goalPlan.weeklyPlan?.focusPillar;
  const focusKey = focusPillar
    ? Object.entries({ bewegung: 'Bewegung', ernaehrung: 'Ernährung', regeneration: 'Regeneration', mental: 'Mentale Balance' })
        .find(([_, v]) => v === focusPillar)?.[0]
    : null;
  const currentFocusScore = focusKey ? (pillarScores[focusKey] ?? 0) : 0;
  // Approximate start score from earliest score history entry after plan creation
  const startScoreEntry = scoreHistory.find(s => new Date(s.date) >= createdAt);
  const startFocusScore = startScoreEntry?.pillars?.[focusKey || ''] ?? currentFocusScore;
  const focusDelta = currentFocusScore - startFocusScore;

  // Perfect week: any day set where ALL blocks are done
  const perfectWeek = blocks.every((d: any) => d.blocks.length === 0 || d.blocks.every((b: any) => b.completed));

  const milestones: Milestone[] = [
    {
      id: 'erste_woche',
      label: 'Erste Woche',
      description: '7+ Tage im Plan & >20% umgesetzt',
      reached: daysSincePlan >= 7 && adherence > 20,
    },
    {
      id: 'fifty_percent',
      label: '50% umgesetzt',
      description: 'Die Hälfte aller Blöcke erledigt',
      reached: adherence >= 50,
    },
    {
      id: 'eighty_percent',
      label: '80% umgesetzt',
      description: 'Fast alles geschafft',
      reached: adherence >= 80,
    },
    {
      id: 'focus_pillar_10',
      label: 'Fokus-Säule +10',
      description: `${focusPillar || 'Fokus'} um 10+ Punkte verbessert`,
      reached: focusDelta >= 10,
    },
    {
      id: 'halbzeit',
      label: 'Halbzeit',
      description: 'Die Hälfte der Plan-Zeit ist geschafft',
      reached: daysSincePlan >= halfwayDays,
    },
    {
      id: 'perfekte_woche',
      label: 'Perfekte Woche',
      description: 'Alle Blöcke einer Woche erledigt',
      reached: perfectWeek && totalBlocks > 0,
    },
  ];

  // Check newly reached (compare to localStorage)
  const storageKey = 'caliness_milestones_reached';
  const previouslyReached: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const currentlyReached = milestones.filter(m => m.reached).map(m => m.id);
  const newlyReached = milestones.filter(m => m.reached && !previouslyReached.includes(m.id));

  // Save current state
  if (currentlyReached.length > previouslyReached.length) {
    localStorage.setItem(storageKey, JSON.stringify(currentlyReached));
  }

  return { milestones, newlyReached };
}
