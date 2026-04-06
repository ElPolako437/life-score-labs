/**
 * CALINESS Focus Pillar Engine
 * Picks ONE priority pillar per week based on scores and goal alignment.
 * Manages progressive pillar activation (1 → 2 → 3 → 4).
 */

import type { PillarScores, ActivityLog } from '@/contexts/AppContext';

export type PillarKey = 'bewegung' | 'ernaehrung' | 'regeneration' | 'mental';

export interface FocusPillarResult {
  focusPillar: PillarKey;
  reason: string;
  miniActions: { pillar: PillarKey; label: string; icon: string }[];
  caliAnnouncement: string;
}

export interface NextPillarRecommendation {
  recommended: PillarKey;
  reason: string;
  readyScore: number; // 0-100
}

const PILLAR_LABELS: Record<PillarKey, string> = {
  bewegung: 'Bewegung',
  ernaehrung: 'Ernährung',
  regeneration: 'Recovery',
  mental: 'Mental',
};

// Goal type → naturally linked pillar priority order
const GOAL_PILLAR_PRIORITY: Record<string, PillarKey[]> = {
  fat_loss: ['ernaehrung', 'bewegung', 'regeneration', 'mental'],
  recomp: ['ernaehrung', 'bewegung', 'regeneration', 'mental'],
  muscle_gain: ['bewegung', 'ernaehrung', 'regeneration', 'mental'],
  sleep_improvement: ['regeneration', 'mental', 'bewegung', 'ernaehrung'],
  stress_reduction: ['mental', 'regeneration', 'bewegung', 'ernaehrung'],
  energy_recovery: ['regeneration', 'bewegung', 'ernaehrung', 'mental'],
  routine_building: ['bewegung', 'ernaehrung', 'regeneration', 'mental'],
};

// Goal type → naturally linked pillar (single)
const GOAL_PILLAR_LINK: Record<string, PillarKey> = {
  fat_loss: 'ernaehrung',
  recomp: 'ernaehrung',
  muscle_gain: 'bewegung',
  sleep_improvement: 'regeneration',
  stress_reduction: 'mental',
  energy_recovery: 'regeneration',
  routine_building: 'bewegung',
};

// Mini action templates per pillar (for non-focus pillars)
const MINI_ACTIONS: Record<PillarKey, { label: string; icon: string }[]> = {
  bewegung: [
    { label: '10 Min gehen', icon: '🏃' },
    { label: '5 Min Stretching', icon: '🤸' },
    { label: '2000 Schritte', icon: '👟' },
  ],
  ernaehrung: [
    { label: '30g Protein', icon: '🥚' },
    { label: '2L Wasser', icon: '💧' },
    { label: 'Gemüse zu jeder Mahlzeit', icon: '🥗' },
  ],
  regeneration: [
    { label: 'Früh ins Bett', icon: '🌙' },
    { label: 'Bildschirm aus 22h', icon: '📵' },
    { label: '5 Min Dehnen', icon: '🧘' },
  ],
  mental: [
    { label: '2 Min Atmen', icon: '🧠' },
    { label: 'Dankbarkeit notieren', icon: '📝' },
    { label: '10 Min Stille', icon: '🔇' },
  ],
};

/**
 * Get the initial pillar to activate based on goal type and scores.
 */
export function getInitialPillar(
  pillarScores: PillarScores,
  goalType?: string,
): PillarKey {
  const priority = goalType ? (GOAL_PILLAR_PRIORITY[goalType] || Object.keys(PILLAR_LABELS)) : Object.keys(PILLAR_LABELS);
  // Pick the pillar with the most impact: lowest score among high-priority pillars
  let best: PillarKey = priority[0] as PillarKey;
  let bestNeed = -Infinity;
  for (const p of priority) {
    const need = (100 - pillarScores[p as PillarKey]) + (p === priority[0] ? 15 : p === priority[1] ? 8 : 0);
    if (need > bestNeed) {
      bestNeed = need;
      best = p as PillarKey;
    }
  }
  return best;
}

/**
 * Recommend the next pillar to activate.
 */
export function recommendNextPillar(
  activePillars: PillarKey[],
  pillarScores: PillarScores,
  goalType: string,
  activityLog: ActivityLog[],
): NextPillarRecommendation {
  const allPillars: PillarKey[] = ['bewegung', 'ernaehrung', 'regeneration', 'mental'];
  const inactivePillars = allPillars.filter(p => !activePillars.includes(p));

  if (inactivePillars.length === 0) {
    return { recommended: 'bewegung', reason: 'Alle Säulen sind bereits aktiv.', readyScore: 100 };
  }

  // Check plan adherence over last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentLogs = activityLog.filter(l => new Date(l.date) >= weekAgo);
  const activeLogCount = recentLogs.filter(l => activePillars.includes(l.pillar)).length;
  const readyScore = Math.min(100, Math.round((activeLogCount / Math.max(1, activePillars.length * 5)) * 100));

  // Goal priority order for inactive pillars
  const goalPriority = GOAL_PILLAR_PRIORITY[goalType] || allPillars;
  const inactiveByPriority = goalPriority.filter(p => inactivePillars.includes(p as PillarKey)) as PillarKey[];

  // Pick the one with lowest score among inactive, weighted by goal priority
  let best: PillarKey = inactiveByPriority[0] || inactivePillars[0];
  let bestNeed = -Infinity;
  for (const p of inactivePillars) {
    const priorityIdx = goalPriority.indexOf(p);
    const priorityBonus = priorityIdx >= 0 ? (4 - priorityIdx) * 5 : 0;
    const need = (100 - pillarScores[p]) + priorityBonus;
    if (need > bestNeed) {
      bestNeed = need;
      best = p;
    }
  }

  const label = PILLAR_LABELS[best];
  const score = pillarScores[best];

  // Generate reason
  const goalLink = GOAL_PILLAR_LINK[goalType];
  let reason: string;
  if (best === goalLink) {
    const goalLabels: Record<string, string> = {
      fat_loss: 'Fettverlust', recomp: 'Body Recomposition', muscle_gain: 'Muskelaufbau',
      sleep_improvement: 'Schlafverbesserung', stress_reduction: 'Stressreduktion',
      energy_recovery: 'Energie', routine_building: 'Routineaufbau',
    };
    reason = `Deine ${label} liegt bei ${score} — und bremst deinen ${goalLabels[goalType] || 'Fortschritt'}. Mit einem ${label}-Plan können wir das gezielt ändern.`;
  } else {
    reason = `${label} bei ${score} — hier liegt ungenutztes Potenzial. Ein gezielter Plan macht den Unterschied.`;
  }

  return { recommended: best, reason, readyScore };
}

/**
 * Check if user is ready for next pillar activation (>60% adherence over 7 days).
 */
export function isReadyForNextPillar(
  activePillars: PillarKey[],
  activityLog: ActivityLog[],
  activationDate?: string,
): boolean {
  if (!activationDate) return false;
  const activeSince = new Date(activationDate);
  const daysSince = Math.floor((Date.now() - activeSince.getTime()) / 86400000);
  if (daysSince < 7) return false;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentLogs = activityLog.filter(l => new Date(l.date) >= weekAgo && activePillars.includes(l.pillar));
  const adherence = recentLogs.length / Math.max(1, activePillars.length * 5);
  return adherence >= 0.6;
}

/**
 * Get the weekly focus pillar from ACTIVE pillars only.
 */
export function getWeeklyFocusPillar(
  pillarScores: PillarScores,
  goalPlan?: { goalType?: string; activePillars?: string[] } | null,
): FocusPillarResult {
  const activePillars = (goalPlan?.activePillars && goalPlan.activePillars.length > 0
    ? goalPlan.activePillars
    : ['bewegung', 'ernaehrung', 'regeneration', 'mental']) as PillarKey[];

  const allPillars: PillarKey[] = ['bewegung', 'ernaehrung', 'regeneration', 'mental'];
  const goalLinked = goalPlan?.goalType ? GOAL_PILLAR_LINK[goalPlan.goalType] : null;

  let bestPillar: PillarKey = activePillars[0];
  let bestPriority = -Infinity;

  for (const p of activePillars) {
    let priority = 100 - pillarScores[p];
    if (goalLinked === p) priority += 15;
    if (priority > bestPriority) {
      bestPriority = priority;
      bestPillar = p;
    }
  }

  const focusLabel = PILLAR_LABELS[bestPillar];
  const focusScore = pillarScores[bestPillar];

  // Deterministic daily seed — same pick all day, changes each day
  const todaySeed = parseInt(new Date().toISOString().split('T')[0].replace(/-/g, ''), 10);

  // Pick one mini action per non-focus ACTIVE pillar (max 3)
  const miniActions = activePillars
    .filter(p => p !== bestPillar)
    .slice(0, 3)
    .map((p, i) => {
      const actions = MINI_ACTIONS[p];
      const pick = actions[(todaySeed + i) % actions.length];
      return { pillar: p, label: pick.label, icon: pick.icon };
    });

  // Find strongest pillar for announcement context
  const strongest = activePillars.reduce((best, p) =>
    pillarScores[p] > pillarScores[best] ? p : best, activePillars[0]);
  const strongLabel = PILLAR_LABELS[strongest];

  const reason = `${focusLabel} bei ${focusScore} — dein größter Hebel`;

  const caliAnnouncement = `Neue Woche. Dein Fokus: ${focusLabel}. Dein ${strongLabel} war letzte Woche stark — jetzt drehen wir am ${focusLabel === 'Ernährung' ? 'Essen' : focusLabel === 'Bewegung' ? 'Training' : focusLabel === 'Recovery' ? 'Schlaf' : 'Kopf'}.`;

  return { focusPillar: bestPillar, reason, miniActions, caliAnnouncement };
}

/** Get a focus-specific daily action title and why-text */
export function getFocusDailyAction(
  focusPillar: PillarKey,
  pillarScores: PillarScores,
  goalType?: string,
): { title: string; whyText: string } {
  const score = pillarScores[focusPillar];

  const actions: Record<PillarKey, { title: string; whyText: string }[]> = {
    bewegung: [
      { title: 'Krafttraining — 30 Min', whyText: `Dein Bewegungs-Score ist bei ${score} — heute den Körper fordern.` },
      { title: '30 Min aktive Bewegung', whyText: `Bewegung bei ${score} — jede Einheit zählt für deinen Trend.` },
    ],
    ernaehrung: [
      { title: 'Protein-reiches Mittagessen', whyText: `Dein Protein war gestern nur ${Math.round(score * 0.7)}% — heute den Anker früh setzen.` },
      { title: '3 proteinreiche Mahlzeiten', whyText: `Ernährung bei ${score} — Protein ist dein größter Hebel.` },
    ],
    regeneration: [
      { title: 'Heute vor 22:30 schlafen', whyText: `Recovery bei ${score} — eine gute Nacht hebt alles.` },
      { title: 'Aktive Regeneration', whyText: `Dein Schlaf-Score liegt bei ${score} — heute bewusst erholen.` },
    ],
    mental: [
      { title: '5-Minuten Atemübung', whyText: `Mental-Score bei ${score} — ein kleiner Reset mit großer Wirkung.` },
      { title: 'Bewusste Pause einbauen', whyText: `Stress-Management bei ${score} — heute eine Pause priorisieren.` },
    ],
  };

  const options = actions[focusPillar];
  return options[Math.floor(Date.now() / 86400000) % options.length];
}

/** Get autopilot action for a pillar that's moved to autopilot mode */
export function getAutopilotAction(pillar: PillarKey): { label: string; icon: string } {
  const autopilot: Record<PillarKey, { label: string; icon: string }> = {
    bewegung: { label: '10 Min Bewegung', icon: '🏃' },
    ernaehrung: { label: '30g Protein pro Mahlzeit', icon: '🥚' },
    regeneration: { label: 'Vor 23h schlafen', icon: '🌙' },
    mental: { label: '2 Min Atemübung', icon: '🧠' },
  };
  return autopilot[pillar];
}
