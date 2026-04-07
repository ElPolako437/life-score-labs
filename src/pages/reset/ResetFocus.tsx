import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useReset } from '@/contexts/ResetContext';
import { getFocusText } from '@/lib/focusTexts';
import InstallPromptSheet from '@/components/InstallPromptSheet';
import { isMobile, isStandalone } from '@/lib/installPrompt';

export default function ResetFocus() {
  const navigate = useNavigate(); // used for "Los geht's" CTA
  const { goal, hurdle, homescreenHintShown, markHomescreenHintShown } = useReset();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    if (!homescreenHintShown && isMobile() && !isStandalone()) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
        markHomescreenHintShown();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, []);

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

        <div className="w-full space-y-3 mb-8">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40">
            <span className="text-primary text-lg">✦</span>
            <span className="text-sm text-muted-foreground">Täglich 3–4 konkrete Aufgaben</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40">
            <span className="text-primary text-lg">✦</span>
            <span className="text-sm text-muted-foreground">Kein Leistungsdruck — nur Konstanz</span>
          </div>
        </div>

        <Button
          variant="premium"
          size="lg"
          className="w-full min-h-[48px]"
          onClick={() => navigate('/week')}
        >
          Los geht's — Tag 1
        </Button>
      </div>

      {showInstallPrompt && (
        <InstallPromptSheet onDismiss={() => setShowInstallPrompt(false)} />
      )}
    </div>
  );
}
