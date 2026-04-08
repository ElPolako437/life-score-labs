import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Share, Plus } from 'lucide-react';
import { getDeferredPrompt, clearDeferredPrompt, isIOS } from '@/lib/installPrompt';

interface Props {
  onDismiss: () => void;
}

export default function InstallPromptSheet({ onDismiss }: Props) {
  const [installing, setInstalling] = useState(false);
  const ios = isIOS();

  const handleAndroidInstall = async () => {
    const prompt = getDeferredPrompt();
    if (!prompt) {
      onDismiss();
      return;
    }
    setInstalling(true);
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    clearDeferredPrompt();
    if (outcome === 'accepted' || outcome === 'dismissed') {
      onDismiss();
    }
    setInstalling(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 animate-fade-in"
        onClick={onDismiss}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/40 rounded-t-2xl px-6 pt-6 pb-10 max-w-sm mx-auto animate-fade-up">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-muted-foreground/50 hover:text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <img
            src="/images/caliness-logo-white.png"
            alt=""
            className="w-10 h-10 object-contain opacity-80"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">CALINESS Reset</p>
            <p className="text-xs text-muted-foreground">Zum Homescreen hinzufügen</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Dein Streak wartet morgen früh — füge die App zum Homescreen hinzu und öffne sie in 1 Tap. Kein Browser, kein Ablenkungsrisiko.
        </p>

        {ios ? (
          // iOS: manual instructions
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/40">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Share className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">1. Teilen antippen</p>
                <p className="text-xs text-muted-foreground">Das Symbol unten in der Safari-Leiste</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/40">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">2. "Zum Home-Bildschirm"</p>
                <p className="text-xs text-muted-foreground">Nach unten scrollen und antippen</p>
              </div>
            </div>
          </div>
        ) : (
          // Android: native prompt
          <Button
            variant="premium"
            size="lg"
            className="w-full min-h-[48px] mb-4"
            disabled={installing}
            onClick={handleAndroidInstall}
          >
            Zum Homescreen hinzufügen
          </Button>
        )}

        <button
          onClick={onDismiss}
          className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors block mx-auto"
        >
          {ios ? 'Verstanden' : 'Später'}
        </button>
      </div>
    </>
  );
}
