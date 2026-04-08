import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useReset } from '@/contexts/ResetContext';
import { getFocusText } from '@/lib/focusTexts';
import type { Goal } from '@/contexts/ResetContext';

const DAY1_TEASER: Record<Goal, string> = {
  energy: 'Tag 1 zeigt dir, warum du erschöpft bist — obwohl du "genug" schläfst.',
  fatloss: 'Tag 1 zeigt dir, warum du trotz Verzicht nicht abnimmst.',
  structure: 'Tag 1 zeigt dir, wie 3 Ankerpunkte mehr Struktur geben als jeder Plan.',
  sleep: 'Tag 1 zeigt dir, warum schlechter Schlaf selten ein Schlaf-Problem ist.',
};

export default function ResetFocus() {
  const navigate = useNavigate();
  const { goal, hurdle } = useReset();

  if (!goal || !hurdle) {
    return <Navigate to="/onboarding" replace />;
  }

  const focusText = getFocusText(goal, hurdle);

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full animate-fade-in">
        {/* Logo small */}
        <img
          src="/images/caliness-logo-white.png"
          alt=""
          className="w-8 h-8 object-contain opacity-40 mb-8"
        />

        <p className="text-foreground text-base leading-relaxed text-center mb-10 font-medium">
          {focusText}
        </p>

        {goal && (
          <div className="w-full p-4 rounded-xl border border-primary/20 bg-primary/5 mb-6 text-left">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">Heute</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{DAY1_TEASER[goal]}</p>
          </div>
        )}

        <div className="w-full space-y-2 mb-8">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40">
            <span className="text-primary text-lg">✦</span>
            <span className="text-sm text-muted-foreground">~10 Minuten täglich — keine Ausrede</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40">
            <span className="text-primary text-lg">✦</span>
            <span className="text-sm text-muted-foreground">Konstanz schlägt Intensität — jeden Tag</span>
          </div>
        </div>

        <Button
          variant="premium"
          size="lg"
          className="w-full min-h-[48px]"
          onClick={() => navigate('/week')}
        >
          Tag 1 starten →
        </Button>
      </div>

    </div>
  );
}
