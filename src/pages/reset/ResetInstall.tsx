import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Share, Plus, Check } from 'lucide-react';
import {
  getDeferredPrompt,
  clearDeferredPrompt,
  isIOS,
  isMobile,
  isStandalone,
} from '@/lib/installPrompt';
import { track } from '@/lib/analytics';

const NEXT_ROUTE = '/whatsapp';

export default function ResetInstall() {
  const navigate = useNavigate();
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const ios = isIOS();

  // Schon installiert oder Desktop → skip
  useEffect(() => {
    if (!isMobile() || isStandalone()) {
      navigate(NEXT_ROUTE, { replace: true });
    }
  }, [navigate]);

  const handleAndroidInstall = async () => {
    const prompt = getDeferredPrompt();
    if (!prompt) {
      // Browser unterstützt Native Install nicht — User soll manuell anpinnen
      track('install_prompt_unavailable');
      goNext();
      return;
    }
    setInstalling(true);
    track('install_prompt_shown', { trigger: 'reset_install_page' });
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    clearDeferredPrompt();
    track('install_prompt_outcome', { outcome });
    if (outcome === 'accepted') {
      setInstalled(true);
      setTimeout(goNext, 1200);
    } else {
      goNext();
    }
    setInstalling(false);
  };

  const goNext = () => navigate(NEXT_ROUTE);

  const handleSkip = () => {
    track('install_skipped');
    goNext();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-primary/6 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full animate-fade-in">

        <img
          src="/images/caliness-logo-white.png"
          alt="CALINESS"
          className="w-14 h-14 object-contain opacity-80"
        />

        <p className="text-[11px] font-semibold tracking-[3px] uppercase text-primary -mb-2">
          1 MINUTE — DANN STARTEN WIR
        </p>

        <div className="text-center space-y-3">
          <h1 className="font-outfit font-bold text-[26px] leading-tight tracking-tight text-foreground">
            Speicher CALINESS<br />auf deinem Home-Screen.
          </h1>
          <p className="text-sm text-muted-foreground/65 leading-relaxed max-w-xs mx-auto">
            Damit du täglich mit einem Tap startest — und nicht jedes Mal im Browser suchen musst.
          </p>
        </div>

        {/* iOS Anleitung */}
        {ios && (
          <div className="w-full bg-card border border-border/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">1</div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm text-foreground/90 leading-relaxed">
                  Tipp unten auf das <Share className="w-4 h-4 inline-block mx-1 -mt-0.5 text-primary" /> Teilen-Symbol.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">2</div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm text-foreground/90 leading-relaxed">
                  Scroll runter und wähl <strong>„Zum Home-Bildschirm"</strong> <Plus className="w-4 h-4 inline-block mx-1 -mt-0.5 text-primary" />
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">3</div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm text-foreground/90 leading-relaxed">
                  Tipp oben rechts auf <strong>„Hinzufügen"</strong>. Fertig.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground/50 text-center pt-2">
              Funktioniert nur in Safari — nicht in Chrome auf dem iPhone.
            </p>
          </div>
        )}

        {/* Android: schneller Weg via Native Prompt + manueller Fallback */}
        {!ios && (
          <div className="w-full space-y-3">
            <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-3">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-primary/80">
                Schneller Weg
              </p>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">1</div>
                <p className="text-sm text-foreground/90 leading-relaxed pt-0.5">
                  Tipp unten auf <strong>„App installieren"</strong>.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">2</div>
                <p className="text-sm text-foreground/90 leading-relaxed pt-0.5">
                  Bestätige im Browser-Dialog. Fertig.
                </p>
              </div>
            </div>

            <details className="bg-card/60 border border-border/30 rounded-2xl px-5 py-3.5 text-sm">
              <summary className="cursor-pointer text-muted-foreground/80 font-medium select-none">
                Funktioniert der Button nicht? Manueller Weg
              </summary>
              <div className="mt-4 space-y-4 pl-1">
                <div>
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground/60 mb-2">
                    Chrome / Edge
                  </p>
                  <ol className="space-y-1.5 text-sm text-foreground/85 leading-relaxed list-decimal list-inside">
                    <li>Tippe oben rechts auf das <strong>⋮</strong>-Menü.</li>
                    <li>Wähl <strong>„App installieren"</strong> oder <strong>„Zum Startbildschirm hinzufügen"</strong>.</li>
                    <li>Bestätige mit <strong>„Installieren"</strong>.</li>
                  </ol>
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground/60 mb-2">
                    Samsung Internet
                  </p>
                  <ol className="space-y-1.5 text-sm text-foreground/85 leading-relaxed list-decimal list-inside">
                    <li>Tippe unten auf das <strong>☰</strong>-Menü.</li>
                    <li>Wähl <strong>„Seite hinzufügen zu"</strong> → <strong>„Startbildschirm"</strong>.</li>
                  </ol>
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground/60 mb-2">
                    Firefox
                  </p>
                  <ol className="space-y-1.5 text-sm text-foreground/85 leading-relaxed list-decimal list-inside">
                    <li>Tippe oben rechts auf das <strong>⋮</strong>-Menü.</li>
                    <li>Wähl <strong>„Installieren"</strong> oder <strong>„Zur Startseite hinzufügen"</strong>.</li>
                  </ol>
                </div>
              </div>
            </details>
          </div>
        )}

        <div className="w-full space-y-3 pt-1">
          {!ios && (
            <Button
              variant="premium"
              size="lg"
              className="w-full min-h-[52px] text-base font-bold gap-2"
              onClick={handleAndroidInstall}
              disabled={installing || installed}
            >
              {installed
                ? (<><Check className="w-5 h-5" /> Installiert</>)
                : installing
                  ? 'Einen Moment…'
                  : 'App installieren →'}
            </Button>
          )}

          <button
            onClick={handleSkip}
            className="w-full min-h-[48px] rounded-xl border border-border/40 text-muted-foreground/60 text-sm font-medium hover:border-border/70 hover:text-muted-foreground/80 transition-all"
          >
            {ios ? 'Hab ich gemacht — weiter →' : 'Später installieren'}
          </button>
        </div>

      </div>
    </div>
  );
}
