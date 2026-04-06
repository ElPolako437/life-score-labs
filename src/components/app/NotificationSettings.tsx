/**
 * CALINESS Benachrichtigungseinstellungen
 * Kompakte Settings-Komponente fuer Notification-Praeferenzen.
 */

import { useState, useEffect } from 'react';
import { Bell, BellOff, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
} from '@/lib/pushNotifications';
import {
  getNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings as NotifSettings,
} from '@/lib/notificationScheduler';

export default function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [settings, setSettings] = useState<NotifSettings>(getNotificationSettings());

  useEffect(() => {
    setPermission(
      isNotificationSupported() ? Notification.permission : 'unsupported',
    );
  }, []);

  function updateSetting(key: keyof NotifSettings, value: boolean) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveNotificationSettings(next);
  }

  async function handleActivate() {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
  }

  const supported = isNotificationSupported();

  const rows: { key: keyof NotifSettings; label: string; time?: string }[] = [
    { key: 'dailyFocus', label: 'Taeglicher Fokus', time: '08:00' },
    { key: 'planReminder', label: 'Planerinnerung', time: '12:30' },
    { key: 'progressStreaks', label: 'Fortschritt & Streaks' },
    { key: 'weeklyReport', label: 'Wochenbericht', time: 'Sonntag' },
    { key: 'reengagement', label: 'Rueckkehr-Impuls' },
  ];

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-white">Benachrichtigungen</h3>
      </div>

      {!supported && (
        <p className="text-sm text-white/40">
          Dein Browser unterstuetzt keine Benachrichtigungen.
        </p>
      )}

      {supported && permission === 'denied' && (
        <p className="text-sm text-amber-400/80">
          Benachrichtigungen wurden blockiert. Bitte erlaube sie in den Browser-Einstellungen.
        </p>
      )}

      {supported && permission !== 'denied' && (
        <>
          <div className="space-y-3">
            {rows.map(row => (
              <div key={row.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/80">{row.label}</span>
                  {row.time && (
                    <span className="flex items-center gap-0.5 text-xs text-white/30">
                      <Clock className="w-3 h-3" />
                      {row.time}
                    </span>
                  )}
                </div>
                <Switch
                  checked={settings[row.key]}
                  onCheckedChange={(v) => updateSetting(row.key, v)}
                  disabled={permission !== 'granted'}
                />
              </div>
            ))}
          </div>

          {permission === 'default' && (
            <Button
              onClick={handleActivate}
              variant="outline"
              className="w-full mt-2 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Bell className="w-4 h-4 mr-2" />
              Benachrichtigungen aktivieren
            </Button>
          )}

          {permission === 'granted' && (
            <p className="text-xs text-white/30 flex items-center gap-1">
              <Bell className="w-3 h-3" /> Aktiv — max. 2 Benachrichtigungen pro Tag
            </p>
          )}
        </>
      )}
    </div>
  );
}
