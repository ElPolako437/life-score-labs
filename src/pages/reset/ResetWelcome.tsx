import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReset } from '@/contexts/ResetContext';
import { track, captureLead, triggerResetSignup } from '@/lib/analytics';
import { recordSignup } from '@/lib/resetBackend';
import SoftPhoto from '@/components/reset/SoftPhoto';

export default function ResetWelcome() {
  const navigate = useNavigate();
  const { name, setName, setEmail, currentDay, goal } = useReset();
  const [localName, setLocalName] = useState(name || '');
  const [localEmail, setLocalEmail] = useState('');
  const hasProgress = goal !== null;

  // First touchpoint of the funnel — fires once per landing.
  useEffect(() => {
    track('reset_viewed', { returning: goal !== null });
  }, []);

  const handleStart = () => {
    if (localName.trim()) setName(localName.trim());
    if (localEmail.trim()) {
      setEmail(localEmail.trim());
      captureLead(localEmail, localName);
      triggerResetSignup(localEmail, localName);
      // Server-side participant: consent (soft opt-in via disclosure) + UTM attribution
      recordSignup(localEmail.trim(), localName.trim() || null, true);
    }
    track(hasProgress ? 'reset_resumed' : 'reset_started', { hasName: !!localName.trim(), hasEmail: !!localEmail.trim() });
    if (hasProgress) {
      // Returning user → straight to active day
      const activeDay = Math.min(currentDay, 7);
      navigate(`/day/${activeDay}`);
    } else {
      // First-time: Install-Tutorial → WhatsApp → Onboarding
      // /install redirected sich selbst weiter wenn Desktop oder schon Standalone
      navigate('/install');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="relative">
          <img
            src="/images/caliness-logo-white.png"
            alt="CALINESS"
            className="w-20 h-20 object-contain"
            style={{ filter: 'drop-shadow(0 0 20px hsl(142 76% 46% / 0.15))' }}
          />
          <div
            className="absolute inset-0 -m-3 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(142 76% 46% / 0.08) 0%, transparent 70%)' }}
          />
        </div>

        <div className="space-y-2">
          <h1 className="font-outfit font-bold text-[26px] tracking-tight text-foreground leading-[1.15] text-balance">
            Du machst nicht zu wenig.<br />Nur an der falschen Stelle.
          </h1>
        </div>

        <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-xs">
          7 Tage. Etwa 10 Minuten am Tag. Danach weißt du, wo dein System gerade leerläuft. Und kannst aufhören, da Kraft reinzukippen.
        </p>

        {/* Real coaching shot — soft, atmospheric trust at entry */}
        <SoftPhoto src="/images/caliness-coaching.jpg" alt="David & Sarah coachen eine CALINESS-Gruppe" className="shadow-card" />

        {/* Trust signal — David & Sarah */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 flex-shrink-0">
            <img
              src="/images/david-sm.jpg"
              alt="David"
              width={32}
              height={32}
              loading="lazy"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-background"
            />
            <img
              src="/images/sarah-sm.jpg"
              alt="Sarah"
              width={32}
              height={32}
              loading="lazy"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-background"
            />
          </div>
          <p className="text-xs text-muted-foreground/60 text-left leading-snug">
            David &amp; Sarah, Caliness Academy<br />
            <span className="text-muted-foreground/40">200+ Mal mit echten Klienten gemacht. Daraus gebaut.</span>
          </p>
        </div>

        <p className="text-xs text-muted-foreground/30 tracking-wide">
          7-Tage Reset · täglich ~10 Minuten · kostenlos
        </p>

        {!hasProgress && (
          <div className="w-full space-y-3">
            <Input
              placeholder="Dein Vorname (optional)"
              value={localName}
              onChange={e => setLocalName(e.target.value.slice(0, 30))}
              maxLength={30}
              className="bg-card border-border/60 text-foreground placeholder:text-muted-foreground/40 h-12 rounded-xl text-center"
            />
            <Input
              type="email"
              placeholder="Deine E-Mail (optional)"
              value={localEmail}
              onChange={e => setLocalEmail(e.target.value.slice(0, 100))}
              maxLength={100}
              className="bg-card border-border/60 text-foreground placeholder:text-muted-foreground/40 h-12 rounded-xl text-center"
            />
            {localEmail.trim() && (
              <p className="text-[11px] text-muted-foreground/40 leading-snug px-1">
                Mit „Loslegen" bekommst du deine täglichen Reset-Impulse per E-Mail. Jederzeit mit einem Klick abbestellbar.{' '}
                <a href="/datenschutz" className="underline hover:text-muted-foreground/60">Datenschutz</a>
              </p>
            )}
          </div>
        )}

        <Button
          variant="premium"
          size="lg"
          className="w-full min-h-[48px]"
          onClick={handleStart}
        >
          {hasProgress ? `Tag ${Math.min(currentDay, 7)} öffnen →` : 'Loslegen'}
        </Button>
      </div>
    </div>
  );
}
