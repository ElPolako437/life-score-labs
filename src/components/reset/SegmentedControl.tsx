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
              'relative rounded-2xl border px-3 py-3.5 text-center overflow-hidden',
              'transition-[transform,border-color,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
              'active:scale-[0.97]',
              active
                ? 'border-primary/80 text-foreground scale-[1.03] shadow-glow [background:var(--gradient-glow)]'
                : 'border-border/50 bg-card/70 text-card-foreground hover:border-primary/40 hover:-translate-y-0.5 shadow-inner-light'
            )}
          >
            {active && (
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            )}
            <span className={cn('block text-sm font-semibold transition-colors', active && 'text-primary')}>{opt.label}</span>
            {opt.hint && (
              <span className={cn('block text-[11px] mt-0.5 transition-colors', active ? 'text-primary/60' : 'text-muted-foreground/50')}>
                {opt.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
