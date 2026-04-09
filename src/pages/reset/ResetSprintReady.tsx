import { useNavigate } from 'react-router-dom';
import { useReset } from '@/contexts/ResetContext';
import { ArrowRight, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

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
  const { name, reflection, baseline } = useReset();
  const [shared, setShared] = useState(false);

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
          Das machen weniger als 20% aller, die anfangen. Was du jetzt weißt, haben die meisten noch nie ausprobiert.
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

        {/* Bridge text */}
        <div className="p-4 rounded-xl border border-border/30 bg-card/50 mb-8 text-left">
          <p className="text-sm text-foreground/80 leading-relaxed">
            Das Fundament ist gelegt. Die Frage ist jetzt: Willst du darauf aufbauen — mit einem persönlichen Plan, der genau auf dich passt? Oder startest du ohne Plan und fällst in alte Muster zurück?
          </p>
        </div>

        <Button
          variant="premium"
          size="lg"
          className="w-full min-h-[52px] text-base gap-2 mb-4"
          onClick={() => navigate('/next')}
        >
          Mein persönliches Sprint-Angebot ansehen
          <ArrowRight className="w-4 h-4" />
        </Button>

        <p className="text-xs text-muted-foreground/30 mb-6">
          Kostenlos ansehen — keine Verpflichtung
        </p>

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
