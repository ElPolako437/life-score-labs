/**
 * CALINESS Push Notifications
 * Browser-based notification support using Web Notification API.
 * Works in PWA and desktop browsers — no external push service needed.
 */

// ── Types ────────────────────────────────────────────────────────────────────────

import type { NotificationPayload } from '@/lib/notificationEngine';

const SCHEDULED_KEY = 'caliness_scheduled_notifs';

interface ScheduledEntry {
  id: string;
  timerId: number;
  scheduledAt: number;
}

// In-memory timer map (timers don't survive page reload — that's OK for local scheduling)
const activeTimers = new Map<string, number>();

// ── Permission ───────────────────────────────────────────────────────────────────

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

// ── Show notification ────────────────────────────────────────────────────────────

function showNotification(payload: NotificationPayload): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  try {
    // Try service worker notification first (works when app is in background)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          title: payload.title,
          body: payload.body,
          icon: '/favicon-512.png',
          badge: '/favicon-512.png',
          tag: payload.id,
          data: { url: payload.url },
        },
      });
    } else {
      // Fallback: direct Notification API (only works when tab is open)
      const n = new Notification(payload.title, {
        body: payload.body,
        icon: '/favicon-512.png',
        badge: '/favicon-512.png',
        tag: payload.id,
      });

      n.onclick = () => {
        window.focus();
        if (payload.url) {
          window.location.href = payload.url;
        }
        n.close();
      };
    }
  } catch {
    // Silently fail — notifications are non-critical
  }
}

// ── Schedule / Cancel ────────────────────────────────────────────────────────────

export function scheduleLocalNotification(payload: NotificationPayload, delayMs: number): void {
  if (delayMs <= 0) {
    showNotification(payload);
    return;
  }

  // Cancel existing timer for same ID
  cancelScheduledNotification(payload.id);

  const timerId = window.setTimeout(() => {
    showNotification(payload);
    activeTimers.delete(payload.id);
    removeScheduledEntry(payload.id);
  }, delayMs);

  activeTimers.set(payload.id, timerId);
  saveScheduledEntry({ id: payload.id, timerId, scheduledAt: Date.now() + delayMs });
}

export function cancelScheduledNotification(id: string): void {
  const existing = activeTimers.get(id);
  if (existing !== undefined) {
    clearTimeout(existing);
    activeTimers.delete(id);
  }
  removeScheduledEntry(id);
}

export function cancelAllScheduledNotifications(): void {
  activeTimers.forEach((timerId) => clearTimeout(timerId));
  activeTimers.clear();
  try {
    localStorage.removeItem(SCHEDULED_KEY);
  } catch {
    // ignore
  }
}

// ── localStorage tracking ────────────────────────────────────────────────────────

function getScheduledEntries(): ScheduledEntry[] {
  try {
    const raw = localStorage.getItem(SCHEDULED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveScheduledEntry(entry: ScheduledEntry): void {
  try {
    const entries = getScheduledEntries().filter(e => e.id !== entry.id);
    entries.push(entry);
    localStorage.setItem(SCHEDULED_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

function removeScheduledEntry(id: string): void {
  try {
    const entries = getScheduledEntries().filter(e => e.id !== id);
    localStorage.setItem(SCHEDULED_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

// ── Service Worker Registration ──────────────────────────────────────────────────

export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    // SW registration failed — non-critical
  }
}
