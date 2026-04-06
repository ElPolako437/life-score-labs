import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedScoreProps {
  value: number;
  previousValue?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDelta?: boolean;
}

export default function AnimatedScore({ value, previousValue, size = 'lg', showDelta = true }: AnimatedScoreProps) {
  const [displayValue, setDisplayValue] = useState(previousValue ?? 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const animRef = useRef<number>();
  const delta = previousValue !== undefined ? value - previousValue : 0;

  useEffect(() => {
    setIsAnimating(true);
    const startValue = displayValue;
    const startTime = performance.now();
    const duration = 1200;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        if (Math.abs(delta) >= 3) {
          setShowImpact(true);
          setTimeout(() => setShowImpact(false), 800);
        }
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const sizeClasses: Record<string, string> = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  };

  const glowIntensity = value >= 80
    ? '0 0 30px hsl(142 76% 46% / 0.3)'
    : value >= 60
      ? '0 0 20px hsl(142 76% 46% / 0.15)'
      : 'none';

  return (
    <div className="relative flex flex-col items-center">
      <span
        className={cn('font-outfit font-bold text-foreground will-change-transform', sizeClasses[size])}
        style={{
          textShadow: glowIntensity,
          animation: showImpact ? 'scoreImpact 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
        }}
      >
        {displayValue}
      </span>

      {showDelta && delta !== 0 && !isAnimating && (
        <span
          className={cn('text-xs font-bold mt-0.5', delta > 0 ? 'text-primary' : 'text-amber-400')}
          style={{ animation: 'cardSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}

      {showImpact && delta > 0 && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(142 76% 46% / 0.15) 0%, transparent 70%)',
            animation: 'celebrationBurst 0.8s ease-out forwards',
          }}
        />
      )}
    </div>
  );
}
