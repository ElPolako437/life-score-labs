import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, type HabitDefinition } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScoreRing from '@/components/app/ScoreRing';
import {
  Flame, CheckCircle2, Circle, Plus, X, Trash2,
  Egg, Footprints, Droplets, MonitorOff, Wind, Sparkles, Heart, Check,
} from 'lucide-react';
import PremiumPaywall from '@/components/app/PremiumPaywall';
import { cn } from '@/lib/utils';
import { staggerDelay, EASINGS } from '@/lib/animations';

const iconMap: Record<string, React.ElementType> = {
  Egg, Footprints, Droplets, MonitorOff, Wind, Sparkles, Heart,
};

export default function AppHabits() {
  const navigate = useNavigate();
  const { isPremium, habits, habitHistory, toggleHabit, addHabit, removeHabit } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [completedHabitAnim, setCompletedHabitAnim] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = habitHistory.find(d => d.date === today);
  const completedToday = todayEntry?.completedHabits ?? [];
  const completionCount = completedToday.length;
  const totalHabits = habits.length;
  const allDone = completionCount === totalHabits && totalHabits > 0;

  const calculateStreak = () => {
    let streak = 0;
    const d = new Date();
    d.setDate(d.getDate() - 1);
    for (let i = 0; i < 60; i++) {
      const dateStr = d.toISOString().split('T')[0];
      const entry = habitHistory.find(e => e.date === dateStr);
      if (entry && entry.completedHabits.length >= Math.ceil(totalHabits * 0.6)) {
        streak++;
      } else {
        break;
      }
      d.setDate(d.getDate() - 1);
    }
    if (completionCount >= Math.ceil(totalHabits * 0.6)) streak++;
    return streak;
  };

  const habitStreak = calculateStreak();

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const entry = habitHistory.find(e => e.date === dateStr);
    const count = entry?.completedHabits.length ?? 0;
    const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return {
      date: dateStr,
      dayLabel: dayNames[d.getDay()],
      count,
      total: totalHabits,
      isToday: dateStr === today,
    };
  });

  const handleAddHabit = () => {
    if (!newLabel.trim() || habits.length >= 7) return;
    addHabit({ id: `custom_${Date.now()}`, label: newLabel.trim(), icon: 'Sparkles' });
    setNewLabel('');
    setShowAdd(false);
  };

  const handleToggleHabit = (habitId: string) => {
    setCompletedHabitAnim(habitId);
    setTimeout(() => setCompletedHabitAnim(null), 600);
    toggleHabit(habitId, today);
  };

  if (!isPremium) {
    return <PremiumPaywall feature="Habit Tracker" />;
  }

  return (
    <div className="px-5 pt-8 pb-4 space-y-6 animate-enter">
      {/* Header */}
      <div className="flex items-center justify-between" style={staggerDelay(0)}>
        <div>
          <h1 className="font-outfit text-2xl font-bold text-foreground">Deine Gewohnheiten</h1>
          <p className="text-sm text-muted-foreground">Kleine Schritte, große Wirkung</p>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
          <div style={{
            animation: habitStreak >= 3 ? `flameDance ${Math.max(1.2, 2 - Math.min(habitStreak / 30, 0.8))}s ease-in-out infinite` : undefined,
            transformOrigin: 'bottom center',
          }}>
            <Flame className={cn('w-3.5 h-3.5', habitStreak >= 14 ? 'text-amber-400' : 'text-primary')} />
          </div>
          <span className="text-xs font-semibold text-primary">{habitStreak} Tage</span>
        </div>
      </div>

      {/* Progress Ring */}
      <div className="card-elegant rounded-2xl p-6 flex flex-col items-center gap-3" style={staggerDelay(1)}>
        <span className="text-xs font-medium text-primary tracking-wider uppercase">Heute</span>
        <ScoreRing
          score={totalHabits > 0 ? Math.round((completionCount / totalHabits) * 100) : 0}
          size={120}
          strokeWidth={8}
          label={`${completionCount}/${totalHabits}`}
        />
        {allDone ? (
          <div className="flex items-center gap-1.5" style={{ animation: `milestoneReveal 0.6s ${EASINGS.overshoot} both` }}>
            <span className="text-xs text-primary font-semibold">🎉 Alle Habits erledigt!</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Noch {totalHabits - completionCount} offen
          </p>
        )}
      </div>

      {/* Today's Habits */}
      <div className="space-y-2">
        {habits.map((habit, index) => {
          const done = completedToday.includes(habit.id);
          const Icon = iconMap[habit.icon] || Sparkles;
          const isAnimating = completedHabitAnim === habit.id;
          return (
            <Card
              key={habit.id}
              className={cn(
                'cursor-pointer border relative overflow-hidden',
                done
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-card border-border hover:border-primary/20'
              )}
              style={{
                ...staggerDelay(index + 2, 60),
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                ...(isAnimating ? { animation: `hapticShake 0.3s ${EASINGS.smooth}` } : {}),
              }}
              onClick={() => handleToggleHabit(habit.id)}
            >
              {/* Ripple effect */}
              {isAnimating && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded-full bg-primary/20" style={{ animation: 'rippleExpand 0.6s ease-out forwards' }} />
                </div>
              )}
              <CardContent className="p-4 flex items-center gap-3 relative z-10">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors',
                  done ? 'bg-primary/20' : 'bg-secondary'
                )}>
                  <Icon className={cn('w-4 h-4', done ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <span className={cn(
                  'text-sm flex-1 transition-colors',
                  done ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}>
                  {habit.label}
                </span>
                {done ? (
                  <div className="relative">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    {isAnimating && (
                      <span className="absolute -top-3 -right-1 text-[10px] font-bold text-primary"
                        style={{ animation: 'confettiFloat 0.8s ease-out forwards' }}>+1</span>
                    )}
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Habit */}
      {showAdd ? (
        <div className="flex gap-2" style={{ animation: `cardSlideUp 0.3s ${EASINGS.smooth} both` }}>
          <Input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Neuer Habit..."
            className="flex-1"
            maxLength={40}
            onKeyDown={e => e.key === 'Enter' && handleAddHabit()}
          />
          <Button size="sm" onClick={handleAddHabit} disabled={!newLabel.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setNewLabel(''); }}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          {habits.length < 7 && (
            <Button variant="outline" size="sm" className="flex-1 active:scale-95 transition-transform" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-1" /> Habit hinzufügen
            </Button>
          )}
        </div>
      )}

      {/* 7-Day Overview */}
      <div style={staggerDelay(habits.length + 3, 60)}>
        <h2 className="font-outfit text-sm font-semibold text-foreground mb-3">Letzte 7 Tage</h2>
        <div className="card-elegant rounded-2xl p-4">
          <div className="grid grid-cols-7 gap-2">
            {last7Days.map((day, i) => {
              const pct = day.total > 0 ? day.count / day.total : 0;
              return (
                <div key={day.date} className="flex flex-col items-center gap-1.5"
                  style={{ animation: `cardSlideUp 0.4s ${EASINGS.smooth} both`, animationDelay: `${200 + i * 60}ms` }}>
                  <span className={cn(
                    'text-[10px] font-medium',
                    day.isToday ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {day.dayLabel}
                  </span>
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all',
                    pct >= 0.8 ? 'bg-primary/20 border-primary/40 text-primary' :
                    pct >= 0.4 ? 'bg-primary/10 border-primary/20 text-primary/70' :
                    pct > 0 ? 'bg-secondary border-border text-muted-foreground' :
                    'bg-secondary/50 border-border/50 text-muted-foreground/40'
                  )}
                    style={pct >= 0.8 ? { boxShadow: '0 0 8px hsl(142 76% 46% / 0.2)' } : {}}>
                    {pct >= 1 ? <Check className="w-3 h-3" /> : day.count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Manage Habits */}
      {habits.length > 1 && (
        <div>
          <h2 className="font-outfit text-sm font-semibold text-foreground mb-3">Habits verwalten</h2>
          <div className="space-y-1.5">
            {habits.map((habit, i) => {
              const Icon = iconMap[habit.icon] || Sparkles;
              return (
                <div key={habit.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/50"
                  style={staggerDelay(i, 40)}>
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground flex-1">{habit.label}</span>
                  <button onClick={() => removeHabit(habit.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors active:scale-90">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Motivational */}
      <div className="text-center py-3">
        <p className="text-xs text-muted-foreground/70 italic">
          „Exzellenz ist keine Handlung, sondern eine Gewohnheit." — Aristoteles
        </p>
      </div>
    </div>
  );
}
