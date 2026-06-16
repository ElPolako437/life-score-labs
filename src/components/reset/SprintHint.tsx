import type { ReactNode } from 'react';

/**
 * Quiet, non-salesy bridge to the paid 14-day sprint. One calm line per day.
 * Reset gives the direction — the sprint turns it into an adapting plan.
 */
export default function SprintHint({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 mt-6 pl-3 border-l-2 border-primary/30">
      <p className="text-xs text-muted-foreground/60 leading-relaxed">{children}</p>
    </div>
  );
}
