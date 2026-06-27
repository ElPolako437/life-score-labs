import { motion, useReducedMotion } from 'framer-motion';
import CountUp from './CountUp';

interface StatRevealProps {
  eyebrow: string;
  low: number;
  high?: number;
  unit: string;
  sublabel?: string;
  hero?: boolean;
}

/**
 * Premium animated stat — a single number or a low–high range that counts up.
 * `hero` makes it the dopamine centerpiece: larger, glowing primary numbers.
 */
export default function StatReveal({ eyebrow, low, high, unit, sublabel, hero }: StatRevealProps) {
  const reduce = useReducedMotion();
  const fmt = (v: number) => Math.round(v).toLocaleString('de-DE');

  const numClass = hero
    ? 'font-outfit text-[44px] leading-none font-bold text-primary tabular-nums'
    : 'font-outfit text-3xl font-bold text-foreground tabular-nums';
  const numStyle = hero ? { textShadow: '0 0 28px hsl(142 76% 46% / 0.45)' } : undefined;

  return (
    <motion.div
      className="text-left"
      initial={reduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">{eyebrow}</p>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <CountUp to={low} duration={1.1} format={fmt} className={numClass} style={numStyle} />
        {high != null && (
          <>
            <span className={numClass} style={numStyle}>–</span>
            <CountUp to={high} duration={1.3} format={fmt} className={numClass} style={numStyle} />
          </>
        )}
        <span className={hero ? 'text-lg font-semibold text-muted-foreground ml-1.5' : 'text-base font-semibold text-muted-foreground ml-1'}>{unit}</span>
      </div>
      {sublabel && <p className="text-[11px] text-muted-foreground/50 mt-1.5">{sublabel}</p>}
    </motion.div>
  );
}
