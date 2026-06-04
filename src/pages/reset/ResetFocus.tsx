import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useReset } from '@/contexts/ResetContext';
import { getFocusText } from '@/lib/focusTexts';
import { computeCompass } from '@/lib/resetCompass';
import type { Goal } from '@/contexts/ResetContext';

const PILLAR_ICON: Record<string, string> = {
  ernährung: '⚡',
  bewegung: '🏃',
  schlaf: '🌙',
  mental: '🧠',
};

export default function ResetFocus() {
  const navigate = useNavigate();
  const { goal, hurdle, name, baseline } = useReset();

  if (!goal || !hurdle) {
    return <Navigate to="/onboarding" replace />;
  }

  const compass = baseline ? computeCompass(goal, hurdle, baseline) : null;
  const focusText = getFocusText(goal, hurdle);

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full animate-fade-in">

        {/* David & Sarah */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex -space-x-2 flex-shrink-0">
            <img
              src="/images/david.jpg"
              alt="David"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-background"
            />
            <img
              src="/images/sarah.jpg"
              alt="Sarah"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-background"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground/80">David & Sarah</p>
            <p className="text-[11px] text-muted-foreground/50">Caliness Academy</p>
          </div>
        </div>

        {compass ? (
          <>
            {/* Kompass-Ergebnis */}
            <div className="mb-6">
              {name && (
                <p className="text-[11px] font-semibold text-primary uppercase tracking-widest mb-3">
                  Für dich, {name}
                </p>
              )}

              {/* Typ-Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-4">
                <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">
                  {compass.compassTypeLabel}
                </span>
              </div>

              <h2 className="font-outfit text-xl font-bold text-foreground mb-3 leading-tight">
                {compass.headline}
              </h2>

              <p className="text-sm text-foreground/75 leading-relaxed mb-5">
                {compass.einordnung}
              </p>

              {/* Schwächste Säule */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 mb-3">
                <span className="text-lg">{PILLAR_ICON[compass.focusPillar]}</span>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                    Deine schwächste Säule
                  </p>
                  <p className="text-sm font-semibold text-foreground">{compass.pillarLabel}</p>
                </div>
              </div>

              {/* Fokus der Woche */}
              <div className="p-4 rounded-xl border border-border/40 bg-card/60 mb-5">
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-1.5">
                  Die nächsten 7 Tage
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">{compass.fokusWoche}</p>
              </div>

              {/* Erste Aufgabe heute */}
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-1.5">
                  Deine erste Aufgabe heute
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed">{compass.ersteAufgabe}</p>
              </div>
            </div>
          </>
        ) : (
          /* Fallback wenn keine Baseline vorhanden */
          <div className="mb-8">
            {name && (
              <p className="text-[11px] font-semibold text-primary uppercase tracking-widest mb-3">
                Für dich, {name}
              </p>
            )}
            <p className="text-foreground text-base leading-relaxed font-medium">
              {focusText}
            </p>
          </div>
        )}

        <div className="w-full space-y-2 mb-8 mt-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40">
            <span className="text-primary text-lg">✦</span>
            <span className="text-sm text-muted-foreground">~10 Minuten täglich, keine Ausrede</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40">
            <span className="text-primary text-lg">✦</span>
            <span className="text-sm text-muted-foreground">Konstanz schlägt Intensität, jeden Tag</span>
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
