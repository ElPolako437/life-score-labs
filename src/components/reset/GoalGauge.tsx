import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalGaugeProps {
  total: number;
  target: number;
  unit: string;
  compact?: boolean;
  /** Format big numbers (e.g. thousands separator for steps). */
  format?: (v: number) => string;
  reachedLabel?: string;
}

/**
 * Live fill-to-target gauge — the shared dopamine mechanic across day tools.
 * The bar springs toward the goal, the number pops on change, and crossing the
 * target lights everything up with a celebration tick.
 */
export default function GoalGauge({ total, target, unit, compact, format, reachedLabel = 'Ziel erreicht' }: GoalGaugeProps) {
  const reduce = useReducedMotion();
  const pct = Math.min(100, (total / target) * 100);
  const reached = total >= target;
  const fmt = format ?? ((v: number) => String(v));
  const remaining = Math.max(0, target - total);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2 gap-2">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <motion.span
            key={total}
            initial={reduce ? false : { scale: 1.25 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className={cn('font-outfit font-bold tabular-nums leading-none', compact ? 'text-2xl' : 'text-3xl', reached ? 'text-primary' : 'text-foreground')}
            style={reached ? { textShadow: '0 0 24px hsl(142 76% 46% / 0.5)' } : undefined}
          >
            {fmt(total)}
          </motion.span>
          <span className="text-sm font-semibold text-muted-foreground truncate">/ {fmt(target)} {unit}</span>
        </div>
        {reached && (
          <motion.span
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 14 }}
            className="flex items-center gap-1 text-xs font-bold text-primary shrink-0"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={3} /> {reachedLabel}
          </motion.span>
        )}
      </div>
      <div className="relative h-3 rounded-full bg-secondary/80 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: reached
              ? 'linear-gradient(90deg, hsl(142 76% 46%), hsl(142 80% 55%))'
              : 'linear-gradient(90deg, hsl(142 60% 38%), hsl(142 76% 46%))',
            boxShadow: reached ? '0 0 16px hsl(142 76% 46% / 0.6)' : '0 0 8px hsl(142 76% 46% / 0.3)',
          }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      {!reached && (
        <p className="text-[11px] text-muted-foreground/50 mt-1.5">Noch {fmt(remaining)} {unit} bis zu deinem Ziel.</p>
      )}
    </div>
  );
}
