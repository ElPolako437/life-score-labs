import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  placeholder?: string;
  maxLength?: number;
}

/**
 * Labeled numeric input with an optional unit suffix.
 * Mirrors the weight-input pattern used in onboarding.
 */
export default function NumberField({
  label,
  value,
  onChange,
  unit,
  placeholder,
  maxLength = 5,
}: NumberFieldProps) {
  return (
    <div>
      <p className="text-sm text-foreground font-medium mb-2">{label}</p>
      <div
        className={cn(
          'relative rounded-2xl border border-border/50 bg-card/70 shadow-inner-light',
          'transition-[border-color,box-shadow] duration-300 ease-out',
          'focus-within:border-primary/70 focus-within:shadow-glow-subtle'
        )}
      >
        <Input
          type="number"
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value.slice(0, maxLength))}
          className="bg-transparent border-0 text-foreground placeholder:text-muted-foreground/40 h-14 rounded-2xl text-center text-lg font-semibold pr-12 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {unit && (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/50 pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
