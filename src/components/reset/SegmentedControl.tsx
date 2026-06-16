import { cn } from '@/lib/utils';

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  columns?: number;
  className?: string;
}

/**
 * Pill-style single-select used across the day tools (sex, activity, alltag …).
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn('grid gap-2.5', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-2xl border px-3 py-3 text-center transition-all duration-200 active:scale-[0.98]',
              active
                ? 'border-primary bg-primary/10 text-foreground shadow-glow-subtle'
                : 'border-border/60 bg-card text-card-foreground hover:border-primary/40'
            )}
          >
            <span className="block text-sm font-medium">{opt.label}</span>
            {opt.hint && (
              <span className={cn('block text-[11px] mt-0.5', active ? 'text-primary/70' : 'text-muted-foreground/50')}>
                {opt.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
