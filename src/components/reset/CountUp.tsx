import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  /** Render hook — format the current value (e.g. add unit). */
  format?: (v: number) => string;
  className?: string;
}

/**
 * Smoothly counts a number up on mount. Respects prefers-reduced-motion.
 */
export default function CountUp({
  to,
  from = 0,
  duration = 1.1,
  delay = 0,
  format = v => String(Math.round(v)),
  className,
}: CountUpProps) {
  const [value, setValue] = useState(from);
  const node = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(to);
      return;
    }
    const controls = animate(from, to, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: v => setValue(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);

  return (
    <span ref={node} className={className}>
      {format(value)}
    </span>
  );
}
