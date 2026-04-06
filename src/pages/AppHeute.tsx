/**
 * AppHeute -- "Heute" daily hub tab.
 * If check-in not done: shows the check-in flow.
 * If check-in done: shows today's plan items + meal log + quick log buttons.
 * Consolidates the daily flow into one place.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import TodaysPlanSection from '@/components/app/TodaysPlanSection';
import NutritionDayFeed from '@/components/app/NutritionDayFeed';
import QuickMealLog from '@/components/app/QuickMealLog';
import { ClipboardCheck, Plus, Apple, ChevronRight, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppHeute() {
  const { checkInHistory, nutritionLogs } = useApp();
  const navigate = useNavigate();
  const [quickLogOpen, setQuickLogOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const hasCheckedIn = checkInHistory.some(c => c.date === today);

  const todayNutritionLogs = useMemo(
    () => nutritionLogs.filter(l => l.date === today),
    [nutritionLogs, today],
  );

  // Check-in done: show daily hub
  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-outfit text-lg font-bold text-foreground">Dein Tag</h1>
        {hasCheckedIn ? (
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
            <ClipboardCheck className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-primary">Check-in erledigt</span>
          </div>
        ) : (
          <button
            onClick={() => navigate('/app/checkin')}
            className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1 active:scale-95 transition-transform"
          >
            <Pencil className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-500">Jetzt einchecken</span>
          </button>
        )}
      </div>

      {/* Non-blocking check-in prompt */}
      {!hasCheckedIn && (
        <button
          onClick={() => navigate('/app/checkin')}
          className="w-full flex items-center gap-3 rounded-2xl border border-amber-500/20 p-3.5 active:scale-[0.99] transition-transform text-left"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(0,0,0,0) 100%)' }}
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Tages-Check-in</p>
            <p className="text-[10px] text-muted-foreground">2 Min · dein Score wird aktualisiert</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-500/50 shrink-0" />
        </button>
      )}


      {/* Plan items */}
      <TodaysPlanSection />

      {/* Nutrition feed */}
      <NutritionDayFeed />

      {/* Quick log button */}
      <button
        onClick={() => setQuickLogOpen(true)}
        className="w-full flex items-center gap-3 rounded-2xl border border-border/20 p-4 active:scale-[0.99] transition-transform"
        style={{ background: 'var(--gradient-card)' }}
      >
        <div className="w-10 h-10 rounded-xl bg-orange-400/10 flex items-center justify-center shrink-0">
          <Plus className="w-5 h-5 text-orange-400" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-foreground">Mahlzeit loggen</p>
          <p className="text-[10px] text-muted-foreground">Schnell Protein & Kalorien erfassen</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
      </button>

      {/* Link to nutrition page */}
      <button
        onClick={() => navigate('/app/nutrition')}
        className="w-full flex items-center gap-3 rounded-xl border border-border/15 p-3 active:scale-[0.99] transition-transform"
        style={{ background: 'var(--gradient-card)' }}
      >
        <Apple className="w-4 h-4 text-orange-400" />
        <span className="text-xs font-medium text-foreground flex-1 text-left">Ernährung & Rezepte</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
      </button>

      <QuickMealLog open={quickLogOpen} onOpenChange={setQuickLogOpen} />
    </div>
  );
}
