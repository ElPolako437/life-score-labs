/**
 * CALINESS Notification Scheduler
 * Runs on app load — determines which notifications to schedule for today.
 * Max 2 scheduled notifications per day.
 */

import type { PillarScores, DailyCheckIn, GoalPlanData } from '@/contexts/AppContext';
import {
  generateDailyFocusNotification,
  generatePlanReminderNotification,
  generateStreakNotification,
  generateProgressNotification,
  generateReengagementNotification,
  type NotificationPayload,
} from '@/lib/notificationEngine';
import {
  scheduleLocalNotification,
  isNotificationSupported,
  getNotificationPermission,
} from '@/lib/pushNotifications';

// ── Settings ─────────────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'caliness_notif_settings';
const SCHEDULED_DATE_KEY = 'caliness_notif_date';
const LAST_STREAK_NOTIF_KEY = 'caliness_last_streak_notif';

export interface NotificationSettings {
  dailyFocus: boolean;
  planReminder: boolean;
  progressStreaks: boolean;
  weeklyReport: boolean;
  reengagement: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyFocus: true,
  planReminder: true,
  progressStreaks: true,
  weeklyReport: true,
  reengagement: true,
};

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// ── Context for scheduler ────────────────────────────────────────────────────────

export interface AppNotificationContext {
  pillarScores: PillarScores;
  goalPlan: GoalPlanData | null;
  streak: number;
  todayCheckIn: DailyCheckIn | null;
  completedBlocksToday: number;
  totalBlocksToday: number;
  lastCheckInDate: string | null;
  prevWeekScores: PillarScores | null;
  userId?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

function msUntilHour(hour: number, minute: number = 0): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  const diff = target.getTime() - now.getTime();
  return diff > 0 ? diff : -1; // -1 = already passed today
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / 86400000);
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === new Date().toISOString().split('T')[0];
}

// ── Main scheduler ──────────────────────────────────────────────────────────────

export function scheduleNotificationsForToday(context: AppNotificationContext): void {
  if (!isNotificationSupported()) return;
  if (getNotificationPermission() !== 'granted') return;

  const today = new Date().toISOString().split('T')[0];
  const settings = getNotificationSettings();

  // Check if already scheduled today
  try {
    const lastDate = localStorage.getItem(SCHEDULED_DATE_KEY);
    if (lastDate === today) return;
  } catch {
    // ignore
  }

  const scheduled: NotificationPayload[] = [];

  // 1. Re-engagement (2+ days no check-in) — overrides daily_focus
  const daysSinceCheckin = daysSince(context.lastCheckInDate);
  if (daysSinceCheckin >= 2 && settings.reengagement) {
    const notif = generateReengagementNotification(
      daysSinceCheckin, context.pillarScores, context.streak, context.userId,
    );
    const delay = msUntilHour(10, 0);
    if (delay > 0) {
      scheduleLocalNotification(notif, delay);
      scheduled.push(notif);
    }
  }

  // 2. Daily focus (08:00) — only if no reengagement and no check-in yet today
  if (scheduled.length === 0 && settings.dailyFocus && !context.todayCheckIn) {
    const notif = generateDailyFocusNotification(
      context.pillarScores, context.goalPlan, context.streak, context.todayCheckIn, context.userId,
    );
    const delay = msUntilHour(8, 0);
    if (delay > 0) {
      scheduleLocalNotification(notif, delay);
      scheduled.push(notif);
    }
  }

  // 3. Plan reminder (12:30) — only if <2 items completed
  if (scheduled.length < 2 && settings.planReminder && context.goalPlan) {
    const notif = generatePlanReminderNotification(
      context.goalPlan, context.completedBlocksToday, context.totalBlocksToday, context.userId,
    );
    if (notif) {
      const delay = msUntilHour(12, 30);
      if (delay > 0) {
        scheduleLocalNotification(notif, delay);
        scheduled.push(notif);
      }
    }
  }

  // 4. Streak milestone — immediate if milestone hit
  if (settings.progressStreaks) {
    const notif = generateStreakNotification(context.streak);
    if (notif) {
      // Only fire if we haven't already notified for this streak value
      try {
        const lastStreakNotif = localStorage.getItem(LAST_STREAK_NOTIF_KEY);
        if (lastStreakNotif !== String(context.streak)) {
          scheduleLocalNotification(notif, 3000); // 3s delay
          localStorage.setItem(LAST_STREAK_NOTIF_KEY, String(context.streak));
        }
      } catch {
        // ignore
      }
    }
  }

  // 5. Progress notification — immediate if pillar improved >5
  if (settings.progressStreaks && context.prevWeekScores) {
    const notif = generateProgressNotification(
      context.pillarScores, context.prevWeekScores, context.goalPlan, context.userId,
    );
    if (notif) {
      scheduleLocalNotification(notif, 5000); // 5s delay
    }
  }

  // 6. Weekly report — Sunday at 19:00
  // Note: weekly_report is handled differently — it needs the report data
  // which is generated separately. This is just the schedule slot.
  if (settings.weeklyReport && new Date().getDay() === 0) {
    // Sunday: the weekly report notification is generated by the report page itself
    // We just reserve the slot here
  }

  // Mark today as scheduled
  try {
    localStorage.setItem(SCHEDULED_DATE_KEY, today);
  } catch {
    // ignore
  }
}

// ── Trigger for in-app banner ────────────────────────────────────────────────────

export function getInAppNotification(context: AppNotificationContext): NotificationPayload | null {
  const settings = getNotificationSettings();

  // Streak milestone
  if (settings.progressStreaks) {
    const streak = generateStreakNotification(context.streak);
    if (streak) {
      try {
        const lastShown = localStorage.getItem('caliness_banner_streak');
        if (lastShown !== String(context.streak)) {
          return streak;
        }
      } catch {
        // ignore
      }
    }
  }

  // Progress
  if (settings.progressStreaks && context.prevWeekScores) {
    const progress = generateProgressNotification(
      context.pillarScores, context.prevWeekScores, context.goalPlan, context.userId,
    );
    if (progress) {
      try {
        const lastShown = localStorage.getItem('caliness_banner_progress_date');
        const today = new Date().toISOString().split('T')[0];
        if (lastShown !== today) {
          return progress;
        }
      } catch {
        // ignore
      }
    }
  }

  // Daily focus (if no check-in yet)
  if (settings.dailyFocus && !context.todayCheckIn) {
    return generateDailyFocusNotification(
      context.pillarScores, context.goalPlan, context.streak, context.todayCheckIn, context.userId,
    );
  }

  return null;
}

export function markBannerShown(notification: NotificationPayload): void {
  try {
    const today = new Date().toISOString().split('T')[0];
    if (notification.category === 'streak') {
      localStorage.setItem('caliness_banner_streak', notification.id);
    } else if (notification.category === 'progress') {
      localStorage.setItem('caliness_banner_progress_date', today);
    }
  } catch {
    // ignore
  }
}
