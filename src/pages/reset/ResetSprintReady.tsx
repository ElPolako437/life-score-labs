import { useNavigate } from 'react-router-dom';
import { useReset } from '@/contexts/ResetContext';
import { ArrowRight, Share2, Check, Sparkles, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { buildResetSummary } from '@/lib/resetSummary';
import { track } from '@/lib/analytics';
import { recordIntent } from '@/lib/resetBackend';

const DIMENSION_LABELS: Record<string, string> = {
  energy: 'Energie',
  sleep: 'Schlaf',
  calm: 'Innere Ruhe',
  eating: 'Essverhalten',
  body: 'Körpergefühl',
};

const DIMS = ['energy', 'sleep', 'calm', 'eating', 'body'] as const;

export default function ResetSprintReady() {
  const navigate = useNavigate();
  const reset = useReset();
  const { name, reflection, baseline, goal, email } = reset;
  const [shared, setShared] = useState(false);
  const summary = buildResetSummary(reset);

  // Tag 7 reached: the reset is finished and the conversion fork is shown.
  useEffect(() => {
    track('reset_finished', { goal: goal ?? null });
    track('sprint_pitch_viewed', { goal: goal ?? null });
  }, [goal]);

  const goApp = () => {
    track('app_cta_clicked', { goal: goal ?? null, source: 'decision_hub' });
    recordIntent(email, 'app_cta');
    navigate('/app');
  };
  const goCoaching = () => {
    track('coaching_cta_clicked', { goal: goal ?? null, source: 'decision_hub' });
    recordIntent(email, 'coaching_cta');
    navigate('/next');
  };

  const handleShare = async () => {
    const lines = reflection ? [
      '🎯 Mein CALINESS 7-Tage Reset Ergebnis:',
      '',
      `Energie: ${reflection.energy}/5`,
      `Schlafqualität: ${reflection.sleep}/5`,
      `Innere Ruhe: ${reflection.calm}/5`,
      `Essverhalten: ${reflection.eating}/5`,
      `Körpergefühl: ${reflection.body}/5`,
      '',
      '7 Tage · täglich ~10 Minuten · kostenlos',
      'caliness.de',
    ].join('\n') : '7-Tage Reset von CALINESS — caliness.de';
    try {
      if (navigator.share) { await navigator.share({ text: lines }); }
      else { await navigator.clipboard.writeText(lines); }
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {}
  };

  // Compute total improvement if baseline exists
  const totalImprovement = (() => {
    if (!reflection || !baseline) return null;
    return DIMS.reduce((sum, k) => {
      const diff = (reflection[k] ?? 0) - (baseline[k] ?? 0);
      return sum + diff;
    }, 0);
  })();

  const improvedDims = (() => {
    if (!reflection || !baseline) return [];
    return DIMS.filter(k => (reflection[k] ?? 0) > (baseline[k] ?? 0));
  })();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      <div className="max-w-sm mx-auto w-full text-center animate-fade-in">

        {/* Glow orb */}
        <div
          className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center animate-scale-in"
          style={{
            background: 'radial-gradient(circle, hsl(142 76% 46% / 0.25) 0%, hsl(142 76% 46% / 0.05) 70%)',
            boxShadow: '0 0 60px hsl(142 76% 46% / 0.3)',
          }}
        >
          <span className="text-4xl">🔥</span>
        </div>

        <h1 className="font-outfit text-2xl font-bold text-foreground mb-2 leading-tight">
          {name ? `${name}, 7 Tage.` : '7 Tage.'}
          <br />
          <span className="text-primary">Du hast es durchgezogen.</span>
        </h1>

        <p className="text-sm text-muted-foreground/80 leading-relaxed mb-6">
          Das ziehen die wenigsten durch. Was du jetzt über deinen Körper weißt, haben die meisten nie ausprobiert.
        </p>

        {/* Vorher / Nachher summary — only if baseline exists */}
        {reflection && baseline && improvedDims.length > 0 && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-6 text-left">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Deine Veränderung</p>
            <div className="space-y-2.5">
              {DIMS.map(k => {
                const before = (baseline as Record<string, number>)[k] ?? 0;
                const after = (reflection as Record<string, number>)[k] ?? 0;
                const diff = after - before;
                return (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-xs text-foreground/70">{DIMENSION_LABELS[k]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground/40">{before}/5</span>
                      <span className="text-xs text-muted-foreground/30">→</span>
                      <span className={`text-xs font-bold ${after >= before ? 'text-primary' : 'text-foreground/50'}`}>{after}/5</span>
                      {diff !== 0 && (
                        <span className={`text-[10px] font-semibold px-1 py-0.5 rounded ${diff > 0 ? 'text-primary bg-primary/15' : 'text-red-400/70 bg-red-400/10'}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {totalImprovement != null && totalImprovement > 0 && (
              <p className="text-xs text-primary/70 font-medium mt-3 pt-3 border-t border-primary/10">
                Gesamt: +{totalImprovement} Punkte in 7 Tagen
              </p>
            )}
          </div>
        )}

        {/* Personal evaluation — was lief / größtes Risiko / nächster Schritt */}
        <div className="p-4 rounded-2xl border border-border/40 bg-card/60 mb-6 text-left space-y-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Deine Auswertung</p>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">Was funktioniert hat</p>
            <p className="text-sm text-foreground/85 leading-relaxed"><span className="text-primary font-semibold">{summary.workedLabel}.</span> {summary.workedLine}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">Dein größtes Risiko</p>
            <p className="text-sm text-foreground/85 leading-relaxed"><span className="text-foreground font-semibold">{summary.riskLabel}.</span> {summary.riskLine}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">Dein nächster Schritt</p>
            <p className="text-sm text-foreground/85 leading-relaxed">{summary.nextStep}</p>
          </div>
        </div>

        {/* Two-path fork */}
        <div className="mb-2 text-left">
          <p className="font-outfit text-lg font-bold text-foreground mb-1">Wie willst du weitermachen?</p>
          <p className="text-sm text-muted-foreground/70 leading-relaxed mb-5">
            Zwei Wege. Beide bauen auf deinen 7 Tagen auf — keiner fängt bei null an.
          </p>
        </div>

        {/* Door A — App (self-guided) */}
        <button
          onClick={goApp}
          className="w-full text-left p-5 rounded-2xl border border-border/50 bg-card/60 hover:border-primary/50 hover:bg-primary/[0.04] transition-all duration-200 active:scale-[0.99] mb-3 group"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Selbstständig</p>
                <span className="text-[10px] text-primary/70 font-medium">Bald · Frühzugang</span>
              </div>
              <p className="text-base font-bold text-foreground mb-1">Mit der CALINESS App</p>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                Dein täglicher Longevity-Coach. Auswertung, Plan und Fortschritt — passt sich jeden Tag an deine echten Daten an.
              </p>
              <p className="text-sm text-primary font-semibold mt-2.5 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                Frühzugang ansehen <ArrowRight className="w-3.5 h-3.5" />
              </p>
            </div>
          </div>
        </button>

        {/* Door B — Coaching (guided) */}
        <button
          onClick={goCoaching}
          className="w-full text-left p-5 rounded-2xl border border-primary/40 bg-primary/[0.06] hover:border-primary/60 hover:bg-primary/[0.09] transition-all duration-200 active:scale-[0.99] mb-6 group"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[10px] uppercase tracking-widest text-primary/60 font-semibold">Begleitet</p>
                <span className="text-[10px] text-muted-foreground/50 font-medium">Begrenzte Plätze</span>
              </div>
              <p className="text-base font-bold text-foreground mb-1">Mit dem Caliness-Sprint</p>
              <p className="text-xs text-muted-foreground/75 leading-relaxed">
                14 Tage persönlich begleitet von David &amp; Sarah. Individuelle Strategie, Accountability, schnellere Umsetzung — kein Alleinkampf.
              </p>
              <p className="text-sm text-primary font-semibold mt-2.5 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                Sprint ansehen <ArrowRight className="w-3.5 h-3.5" />
              </p>
            </div>
          </div>
        </button>

        {/* Share result */}
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mx-auto"
        >
          {shared ? <Check className="w-3.5 h-3.5 text-primary" /> : <Share2 className="w-3.5 h-3.5" />}
          {shared ? 'Ergebnis kopiert!' : 'Ergebnis teilen'}
        </button>
      </div>
    </div>
  );
}
