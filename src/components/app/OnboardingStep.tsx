import { cn } from '@/lib/utils';

interface OnboardingStepProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export default function OnboardingStep({ step, totalSteps, title, subtitle, children, className }: OnboardingStepProps) {
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className={cn('flex flex-col min-h-screen px-6 py-8', className)}>
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, boxShadow: '0 0 8px hsl(142 76% 46% / 0.5)' }}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <h2 className="font-outfit text-2xl font-bold text-foreground mb-2">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-sm mb-8">{subtitle}</p>}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
