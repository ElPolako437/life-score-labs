/**
 * CALINESS Notification Engine
 * Premium, rule-based notification generator. NO AI calls.
 *
 * AI USAGE POLICY:
 * - daily_focus:    NEVER AI — pure rule/template
 * - plan_reminder:  NEVER AI — from plan data
 * - streak:         NEVER AI — fixed milestone texts
 * - progress:       NEVER AI — template + score delta
 * - weekly_report:  OPTIONAL AI via callAI() with 24h TTL — only for premium users, only the "body" field, title always rule-based
 * - reengagement:   NEVER AI — template pool
 */

import type { PillarScores, DailyCheckIn, GoalPlanData } from '@/contexts/AppContext';
import type { PillarKey } from '@/lib/focusPillar';

// ── Types ────────────────────────────────────────────────────────────────────────

export type NotificationCategory =
  | 'daily_focus'
  | 'plan_reminder'
  | 'streak'
  | 'progress'
  | 'weekly_report'
  | 'reengagement';

export interface NotificationPayload {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  url: string;
  scheduledFor?: string;
  caliMood?: 'neutral' | 'happy' | 'concerned' | 'excited';
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

const PILLAR_LABELS: Record<PillarKey, string> = {
  bewegung: 'Bewegung',
  ernaehrung: 'Ernährung',
  regeneration: 'Recovery',
  mental: 'Mental',
};

const PILLAR_ACTIONS: Record<PillarKey, string[]> = {
  bewegung: ['10 Min Bewegung', '30 Min Training', '2000 Schritte'],
  ernaehrung: ['30g Protein', '2L Wasser trinken', 'Gemüse zu jeder Mahlzeit'],
  regeneration: ['Früher schlafen', 'Bildschirm ab 21h aus', '5 Min Dehnen'],
  mental: ['2 Min Atemübung', 'Dankbarkeit notieren', '10 Min Stille'],
};

function getWeakestPillar(scores: PillarScores): PillarKey {
  const entries = Object.entries(scores) as [PillarKey, number][];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}

function getStrongestPillar(scores: PillarScores): PillarKey {
  const entries = Object.entries(scores) as [PillarKey, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/** Deterministic seed from date + optional userId — same value all day */
function dailySeed(userId?: string): number {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  let hash = parseInt(dateStr, 10);
  if (userId) {
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) + hash + userId.charCodeAt(i)) | 0;
    }
  }
  return Math.abs(hash);
}

function makeId(category: NotificationCategory, extra?: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `caliness_${category}_${date}${extra ? '_' + extra : ''}`;
}

function pickTemplate<T>(templates: T[], seed: number): T {
  return templates[seed % templates.length];
}

// ── Daily Focus Notification ─────────────────────────────────────────────────────

interface DailyFocusTemplateVars {
  focusPillar: string;
  focusScore: number;
  focusPillarAction: string;
  streak: number;
  goalLabel: string;
}

function renderDailyFocusTitle(vars: DailyFocusTemplateVars, seed: number): string {
  const templates = [
    `Dein Hebel heute: ${vars.focusPillar}`,
    `Guten Morgen. Fokus: ${vars.focusPillar}`,
    `Heute zählt: ${vars.focusPillar}`,
    `CALI wartet auf deinen Check-in`,
    `Neuer Tag, neuer Fortschritt`,
    `${vars.focusPillar} — dein größter Hebel`,
  ];
  return pickTemplate(templates, seed);
}

function renderDailyFocusBody(vars: DailyFocusTemplateVars, seed: number): string {
  const templates = [
    `${vars.focusPillar} bei ${vars.focusScore} — hier wartet Potenzial.`,
    `Eine Sache heute: ${vars.focusPillarAction}. Klein anfangen.`,
    `${vars.streak > 1 ? vars.streak + ' Tage in Folge. ' : ''}${vars.focusPillar} weiter stärken.`,
    `Wie war die Nacht? Dein Check-in macht den Unterschied.`,
    `${vars.goalLabel}-Fortschritt braucht ${vars.focusPillar}-Input.`,
    `Score ${vars.focusScore} bei ${vars.focusPillar}. Heute ein kleiner Schritt.`,
  ];
  return pickTemplate(templates, seed + 1);
}

export function generateDailyFocusNotification(
  pillarScores: PillarScores,
  goalPlan: GoalPlanData | null,
  streak: number,
  todayCheckIn: DailyCheckIn | null,
  userId?: string,
): NotificationPayload {
  const focus = getWeakestPillar(pillarScores);
  const seed = dailySeed(userId);
  const actions = PILLAR_ACTIONS[focus];

  const goalLabels: Record<string, string> = {
    fat_loss: 'Fettverlust', recomp: 'Recomposition', muscle_gain: 'Muskelaufbau',
    sleep_improvement: 'Schlaf', stress_reduction: 'Stressabbau',
    energy_recovery: 'Energie', routine_building: 'Routineaufbau',
  };

  const vars: DailyFocusTemplateVars = {
    focusPillar: PILLAR_LABELS[focus],
    focusScore: Math.round(pillarScores[focus]),
    focusPillarAction: pickTemplate(actions, seed),
    streak,
    goalLabel: goalPlan?.goalType ? (goalLabels[goalPlan.goalType] || 'Gesundheit') : 'Gesundheit',
  };

  return {
    id: makeId('daily_focus'),
    category: 'daily_focus',
    title: renderDailyFocusTitle(vars, seed),
    body: renderDailyFocusBody(vars, seed),
    url: '/app/home',
    caliMood: todayCheckIn ? 'happy' : 'neutral',
  };
}

// ── Plan Reminder Notification ───────────────────────────────────────────────────

export function generatePlanReminderNotification(
  goalPlan: GoalPlanData | null,
  completedToday: number,
  totalToday: number,
  userId?: string,
): NotificationPayload | null {
  if (!goalPlan) return null;
  if (completedToday >= Math.max(2, totalToday)) return null; // all done

  const seed = dailySeed(userId);
  const remaining = Math.max(0, totalToday - completedToday);

  const titles = [
    'Dein Plan wartet',
    'Halbzeit — kurz einchecken?',
    'Noch offen heute',
    'CALI erinnert dich sanft',
  ];

  const bodies = [
    `Noch ${remaining} ${remaining === 1 ? 'Aufgabe' : 'Aufgaben'} offen. Du schaffst das.`,
    `${completedToday}/${totalToday} erledigt — weiter so.`,
    `Ein kurzer Check-in hält den Rhythmus.`,
    `Kleine Schritte zählen. Was geht noch heute?`,
  ];

  return {
    id: makeId('plan_reminder'),
    category: 'plan_reminder',
    title: pickTemplate(titles, seed),
    body: pickTemplate(bodies, seed + 2),
    url: '/app/heute',
    caliMood: 'neutral',
  };
}

// ── Streak Notification ──────────────────────────────────────────────────────────

const STREAK_MILESTONES: Record<number, { title: string; body: string }> = {
  3:   { title: '3 Tage in Folge', body: 'Der Rhythmus beginnt. Bleib dran.' },
  7:   { title: '7 Tage. Eine Woche.', body: 'Eine Woche Konsequenz. Stark.' },
  14:  { title: '14 Tage. Gewohnheit.', body: 'Du hast eine Gewohnheit aufgebaut. Wirklich.' },
  21:  { title: '21 Tage. Echt jetzt.', body: 'Neuroplastizität. Das ist real.' },
  30:  { title: '30 Tage. Ein Monat.', body: 'CALI ist so stolz auf dich.' },
  60:  { title: '60 Tage. Unaufhaltsam.', body: 'Zwei Monate. Das ist Lebenswandel.' },
  100: { title: '100 Tage. Legende.', body: 'Du bist CALINESS.' },
};

export function generateStreakNotification(streak: number): NotificationPayload | null {
  const milestone = STREAK_MILESTONES[streak];
  if (!milestone) return null;

  return {
    id: makeId('streak', String(streak)),
    category: 'streak',
    title: milestone.title,
    body: milestone.body,
    url: '/app/home',
    caliMood: 'excited',
  };
}

// ── Progress Notification ────────────────────────────────────────────────────────

export function generateProgressNotification(
  pillarScores: PillarScores,
  previousWeekScores: PillarScores | null,
  goalPlan: GoalPlanData | null,
  userId?: string,
): NotificationPayload | null {
  if (!previousWeekScores) return null;

  const seed = dailySeed(userId);
  const pillars: PillarKey[] = ['bewegung', 'ernaehrung', 'regeneration', 'mental'];

  let bestImprovement: { pillar: PillarKey; delta: number } | null = null;
  for (const p of pillars) {
    const delta = pillarScores[p] - previousWeekScores[p];
    if (delta > 5 && (!bestImprovement || delta > bestImprovement.delta)) {
      bestImprovement = { pillar: p, delta: Math.round(delta) };
    }
  }

  if (!bestImprovement) return null;

  const label = PILLAR_LABELS[bestImprovement.pillar];
  const titles = [
    `${label} +${bestImprovement.delta} Punkte`,
    `Fortschritt bei ${label}`,
    `${label} wächst`,
  ];

  const bodies = [
    `Dein ${label}-Score ist um ${bestImprovement.delta} Punkte gestiegen. Weiter so.`,
    `Klarer Aufwärtstrend bei ${label}. Das macht sich bemerkbar.`,
    `+${bestImprovement.delta} bei ${label} diese Woche. Deine Arbeit zahlt sich aus.`,
  ];

  return {
    id: makeId('progress', bestImprovement.pillar),
    category: 'progress',
    title: pickTemplate(titles, seed),
    body: pickTemplate(bodies, seed + 3),
    url: '/app/progress',
    caliMood: 'happy',
  };
}

// ── Weekly Report Notification ───────────────────────────────────────────────────

export function generateWeeklyReportNotification(
  weeklyWin: string,
  longevityScore: number,
  prevLongevityScore: number,
  userId?: string,
): NotificationPayload {
  const seed = dailySeed(userId);
  const delta = Math.round(longevityScore - prevLongevityScore);
  const deltaText = delta > 0 ? `+${delta} diese Woche` : delta < 0 ? `${delta} diese Woche` : 'Stabil diese Woche';

  const titles = [
    'Dein Wochenbericht ist da',
    'Woche abgeschlossen',
    'CALI hat analysiert',
  ];

  const bodies = [
    `Score: ${Math.round(longevityScore)}. ${deltaText}.`,
    `${deltaText}. Schau rein fuer Details.`,
    `Deine Woche in Zahlen. ${deltaText}.`,
  ];

  return {
    id: makeId('weekly_report'),
    category: 'weekly_report',
    title: pickTemplate(titles, seed),
    body: pickTemplate(bodies, seed + 4),
    url: '/app/weekly-report',
    caliMood: delta > 0 ? 'happy' : delta < 0 ? 'concerned' : 'neutral',
  };
}

// ── Re-engagement Notification ───────────────────────────────────────────────────

export function generateReengagementNotification(
  daysSinceLastCheckIn: number,
  pillarScores: PillarScores,
  streak: number,
  userId?: string,
): NotificationPayload {
  const seed = dailySeed(userId);
  const weakest = getWeakestPillar(pillarScores);
  const weakLabel = PILLAR_LABELS[weakest];

  const titles = [
    'CALI vermisst dich',
    'Kurz einchecken?',
    'Neustart zählt genauso',
    'Wie geht es dir?',
  ];

  const bodies = [
    `${daysSinceLastCheckIn} Tage ohne Check-in — heute einfach kurz einchecken?`,
    `Dein ${weakLabel}-Score wartet auf dich. Nur 2 Minuten.`,
    'Keine Sorge — ein Neustart zählt genauso. Heute?',
    `CALI ist bereit wenn du es bist. Ein Check-in reicht.`,
  ];

  return {
    id: makeId('reengagement'),
    category: 'reengagement',
    title: pickTemplate(titles, seed),
    body: pickTemplate(bodies, seed + 5),
    url: '/app/checkin',
    caliMood: 'concerned',
  };
}
