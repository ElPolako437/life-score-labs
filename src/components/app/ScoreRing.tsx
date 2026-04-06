import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PillarDot {
  key: string;
  score: number;
}

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  showLabel?: boolean;
  trend?: 'up' | 'down' | 'stable';
  trendDelta?: number;
  pillarDots?: PillarDot[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'hsl(142, 76%, 46%)';
  if (score >= 66) return 'hsl(142, 60%, 42%)';
  if (score >= 41) return 'hsl(38, 92%, 50%)';
  return 'hsl(0, 72%, 51%)';
}

function getDotColor(score: number): string {
  if (score >= 66) return 'hsl(142, 76%, 46%)';
  if (score >= 33) return 'hsl(38, 92%, 50%)';
  return 'hsl(0, 72%, 51%)';
}

// Positions: North, East, South, West
const DOT_ANGLES = [270, 0, 90, 180];

export default function ScoreRing({
  score, size = 120, strokeWidth = 8, className, label, showLabel = true,
  trend, trendDelta, pillarDots,
}: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const color = getScoreColor(animatedScore);
  const showGlow = animatedScore >= 75;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-primary' : trend === 'down' ? 'text-amber-400' : 'text-muted-foreground';

  const dotRadius = size / 2 - 2;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, hsl(142 76% 46% / 0.15) 0%, transparent 70%)`,
          }}
        />
      )}
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: showGlow ? `drop-shadow(0 0 8px ${color})` : `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>

      {/* Pillar dots at NSEW */}
      {pillarDots && pillarDots.length === 4 && (
        <div className="absolute inset-0">
          {pillarDots.map((dot, i) => {
            const angle = (DOT_ANGLES[i] * Math.PI) / 180;
            const x = size / 2 + dotRadius * Math.cos(angle);
            const y = size / 2 + dotRadius * Math.sin(angle);
            const dotColor = getDotColor(dot.score);
            return (
              <div
                key={dot.key}
                className="absolute w-2.5 h-2.5 rounded-full border border-background transition-all duration-700"
                style={{
                  left: x - 5,
                  top: y - 5,
                  backgroundColor: dotColor,
                  boxShadow: `0 0 6px ${dotColor}`,
                  animationDelay: `${i * 150}ms`,
                }}
              />
            );
          })}
        </div>
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-center gap-1">
          <span className="font-outfit font-bold text-foreground" style={{ fontSize: size * 0.28 }}>
            {Math.round(animatedScore)}
          </span>
          {trend && (
            <TrendIcon className={cn('w-3 h-3', trendColor)} />
          )}
        </div>
        {showLabel && label && (
          <span className="text-muted-foreground text-xs mt-0.5">{label}</span>
        )}
      </div>
    </div>
  );
}
