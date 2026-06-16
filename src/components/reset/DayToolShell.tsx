import type { ReactNode } from 'react';

interface DayToolShellProps {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
}

/**
 * Consistent container for an interactive day tool:
 * eyebrow + title + intro, then the tool body. Keeps all days visually coherent.
 */
export default function DayToolShell({ eyebrow, title, intro, children }: DayToolShellProps) {
  return (
    <div className="animate-fade-in">
      {eyebrow && (
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">{eyebrow}</p>
      )}
      <h2 className="font-outfit text-2xl font-bold text-foreground mb-2 leading-tight">{title}</h2>
      {intro && <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{intro}</p>}
      {children}
    </div>
  );
}
