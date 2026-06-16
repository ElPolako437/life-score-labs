import { Input } from '@/components/ui/input';

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
      <div className="relative">
        <Input
          type="number"
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value.slice(0, maxLength))}
          className="bg-card border-border/60 text-foreground placeholder:text-muted-foreground/40 h-14 rounded-2xl text-center text-lg font-semibold pr-12"
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
