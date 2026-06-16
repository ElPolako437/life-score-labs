import CountUp from './CountUp';

interface StatRevealProps {
  eyebrow: string;
  low: number;
  high?: number;
  unit: string;
  sublabel?: string;
}

/**
 * Premium animated stat — a single number or a low–high range that counts up.
 * Used for the calorie / protein anchors.
 */
export default function StatReveal({ eyebrow, low, high, unit, sublabel }: StatRevealProps) {
  const fmt = (v: number) => Math.round(v).toLocaleString('de-DE');
  return (
    <div className="text-left">
      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">{eyebrow}</p>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <CountUp to={low} duration={1} format={fmt} className="font-outfit text-3xl font-bold text-foreground tabular-nums" />
        {high != null && (
          <>
            <span className="font-outfit text-3xl font-bold text-foreground">–</span>
            <CountUp to={high} duration={1.2} format={fmt} className="font-outfit text-3xl font-bold text-foreground tabular-nums" />
          </>
        )}
        <span className="text-base font-semibold text-muted-foreground ml-1">{unit}</span>
      </div>
      {sublabel && <p className="text-[11px] text-muted-foreground/50 mt-1">{sublabel}</p>}
    </div>
  );
}
