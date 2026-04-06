import { cn } from '@/lib/utils';
import ScoreRing from './ScoreRing';
import { LucideIcon } from 'lucide-react';

interface PillarCardProps {
  icon: LucideIcon;
  label: string;
  score: number;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export default function PillarCard({ icon: Icon, label, score, trend = 'stable', className }: PillarCardProps) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? 'text-primary' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className={cn('card-elegant rounded-2xl p-4 flex flex-col items-center gap-3', className)}>
      <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <ScoreRing score={score} size={64} strokeWidth={5} showLabel={false} />
      <div className="text-center">
        <p className="text-xs font-medium text-foreground leading-tight">{label}</p>
        <span className={cn('text-xs font-semibold', trendColor)}>{trendIcon} {score}</span>
      </div>
    </div>
  );
}
