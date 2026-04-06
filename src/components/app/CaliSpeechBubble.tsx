import { cn } from '@/lib/utils';

interface CaliSpeechBubbleProps {
  message: string;
  compact?: boolean;
  className?: string;
  showIcon?: boolean;
}

export default function CaliSpeechBubble({ message, compact, className, showIcon = true }: CaliSpeechBubbleProps) {
  return (
    <div className={cn(
      'flex items-start gap-2 rounded-xl px-3 py-2 border border-primary/15',
      compact ? 'bg-primary/5' : 'bg-primary/5',
      className,
    )}>
      {showIcon && (
        <img
          src="/images/caliness-logo-white.png"
          alt=""
          className="w-4 h-4 object-contain mt-0.5 shrink-0 opacity-60"
        />
      )}
      <p className={cn(
        'text-foreground leading-relaxed',
        compact ? 'text-[11px]' : 'text-xs',
      )}>
        {message}
      </p>
    </div>
  );
}
