import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

export default function AppWelcome() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useApp();

  // If already authenticated, skip the welcome page
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      if (profile.onboardingComplete) {
        navigate('/app/home', { replace: true });
      } else {
        navigate('/app/onboarding', { replace: true });
      }
    }
  }, [user, authLoading, profile.onboardingComplete, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm animate-enter">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src="/images/caliness-logo-white.png"
              alt="CALINESS"
              className="w-20 h-20 object-contain"
              style={{
                filter: 'drop-shadow(0 0 20px hsl(142 76% 46% / 0.15))',
                animation: 'cardSlideUp 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
            <div className="absolute inset-0 -m-3 rounded-full"
                 style={{
                   background: 'radial-gradient(circle, hsl(142 76% 46% / 0.08) 0%, transparent 70%)',
                   animation: 'glowPulseGreen 4s ease-in-out infinite',
                 }} />
          </div>
          <h1 className="font-outfit font-bold text-3xl tracking-tight text-foreground"
              style={{ animation: 'cardSlideUp 0.8s ease 0.15s both' }}>
            CALINESS
          </h1>
          <span className="text-[10px] font-semibold text-primary/80 tracking-[0.25em] uppercase"
                style={{ animation: 'cardSlideUp 0.8s ease 0.3s both' }}>
            Longevity Intelligence
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h2 className="font-outfit font-bold text-xl leading-tight text-foreground">
            Das Betriebssystem für deine biologische Zukunft.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Kleine tägliche Schritte. Massiver langfristiger Effekt. Verbessere deinen Longevity Score durch personalisierte Protokolle und tägliche Check-ins.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="w-full flex flex-col gap-3 mt-4">
          <Button variant="premium" size="lg" className="w-full" onClick={() => navigate('/auth?tab=signup')}>
            Konto erstellen
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/auth?tab=signin')}>
            Anmelden
          </Button>
        </div>

        {/* Tagline */}
        <p className="text-xs text-muted-foreground/60 mt-4">
          Longevity entsteht täglich. CALI zeigt dir wie.
        </p>
      </div>
    </div>
  );
}
