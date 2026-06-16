import { useReset } from '@/contexts/ResetContext';
import { SLEEP_SCREWS, type SleepScrew } from '@/lib/sleepCheck';
import { SABOTEURS, type SaboteurKey } from '@/lib/saboteur';
import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The user's reset profile, taking shape across the week. Each building block
 * fills in with a real value as its day-tool is completed — visible progress
 * before the final evaluation.
 */
export default function CollectedProfile() {
  const { profile, tools } = useReset();
  const t = (tools ?? {}) as Record<string, any>;

  const blocks = [
    {
      icon: '🔥', label: 'Startprofil', day: 1,
      value: profile ? `${profile.calLow.toLocaleString('de-DE')}–${profile.calHigh.toLocaleString('de-DE')} kcal · ${profile.proteinLow}–${profile.proteinHigh} g` : null,
    },
    { icon: '🍽️', label: 'Mahlzeiten-Plan', day: 2, value: t.day2 ? 'erstellt' : null },
    { icon: '🚶', label: 'Bewegungsziel', day: 3, value: t.day3 ? `${(t.day3.stepTarget as number)?.toLocaleString('de-DE')} Schritte` : null },
    { icon: '😴', label: 'Schlaf-Stellschraube', day: 4, value: t.day4 ? SLEEP_SCREWS[t.day4.screw as SleepScrew]?.label : null },
    { icon: '🎯', label: 'Dein Saboteur', day: 5, value: t.day5 ? SABOTEURS[t.day5.saboteur as SaboteurKey]?.label : null },
    { icon: '🗓️', label: 'Wochenstruktur', day: 6, value: t.day6 ? 'erstellt' : null },
  ];

  const done = blocks.filter(b => b.value).length;

  return (
    <div className="p-4 rounded-2xl border border-border/40 bg-card/50 mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Dein Reset-Profil</p>
        <span className="text-[11px] text-primary font-semibold tabular-nums">{done}/6 Bausteine</span>
      </div>
      <div className="space-y-1.5">
        {blocks.map(b => {
          const filled = !!b.value;
          return (
            <div
              key={b.label}
              className={cn(
                'flex items-center gap-3 py-2 px-2.5 rounded-xl transition-colors',
                filled ? 'bg-primary/5' : 'opacity-50'
              )}
            >
              <span className="text-sm w-5 text-center shrink-0">{b.icon}</span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-medium', filled ? 'text-foreground' : 'text-muted-foreground')}>{b.label}</p>
                {filled && <p className="text-[11px] text-primary/80 tabular-nums truncate">{b.value}</p>}
              </div>
              {filled
                ? <Check className="w-4 h-4 text-primary shrink-0" />
                : <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50 shrink-0"><Lock className="w-3 h-3" />Tag {b.day}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
