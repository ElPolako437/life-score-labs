/**
 * CALINESS In-App Notification Banner
 * Subtle dark glass banner at top of Home screen.
 * Auto-dismisses after 5 seconds or on tap.
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Bell, Flame, TrendingUp, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { NotificationPayload } from '@/lib/notificationEngine';
import { markBannerShown } from '@/lib/notificationScheduler';
import { cn } from '@/lib/utils';

interface NotificationBannerProps {
  notification: NotificationPayload | null;
}

const CATEGORY_ICON: Record<string, typeof Bell> = {
  daily_focus: Target,
  streak: Flame,
  progress: TrendingUp,
  plan_reminder: Bell,
  weekly_report: Bell,
  reengagement: Bell,
};

export default function NotificationBanner({ notification }: NotificationBannerProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [currentNotif, setCurrentNotif] = useState<NotificationPayload | null>(null);

  useEffect(() => {
    if (notification) {
      setCurrentNotif(notification);
      // Small delay for slide-in animation
      const showTimer = setTimeout(() => setVisible(true), 100);
      // Auto-dismiss after 5s
      const hideTimer = setTimeout(() => {
        setVisible(false);
        markBannerShown(notification);
      }, 5000);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setVisible(false);
    }
  }, [notification]);

  const handleTap = useCallback(() => {
    if (currentNotif) {
      setVisible(false);
      markBannerShown(currentNotif);
      if (currentNotif.url) {
        navigate(currentNotif.url);
      }
    }
  }, [currentNotif, navigate]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentNotif) {
      setVisible(false);
      markBannerShown(currentNotif);
    }
  }, [currentNotif]);

  if (!currentNotif) return null;

  const Icon = CATEGORY_ICON[currentNotif.category] || Bell;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 pt-3 transition-all duration-300 ease-out',
        visible
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full opacity-0 pointer-events-none',
      )}
    >
      <div
        onClick={handleTap}
        className="mx-auto max-w-md rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-3 flex items-start gap-3 cursor-pointer shadow-lg shadow-black/40"
      >
        <div className="flex-shrink-0 mt-0.5">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            currentNotif.caliMood === 'excited' ? 'bg-amber-500/20' :
            currentNotif.caliMood === 'happy' ? 'bg-primary/20' :
            currentNotif.caliMood === 'concerned' ? 'bg-orange-500/20' :
            'bg-white/10',
          )}>
            <Icon className={cn(
              'w-4 h-4',
              currentNotif.caliMood === 'excited' ? 'text-amber-400' :
              currentNotif.caliMood === 'happy' ? 'text-primary' :
              currentNotif.caliMood === 'concerned' ? 'text-orange-400' :
              'text-white/60',
            )} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-tight truncate">
            {currentNotif.title}
          </p>
          <p className="text-xs text-white/50 mt-0.5 leading-snug line-clamp-2">
            {currentNotif.body}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 mt-0.5 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-white/30" />
        </button>
      </div>
    </div>
  );
}
