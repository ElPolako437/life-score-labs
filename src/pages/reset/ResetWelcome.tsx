import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReset } from '@/contexts/ResetContext';
import { track, captureLead, triggerResetSignup } from '@/lib/analytics';
import { recordSignup, recordEvent, restoreFromServer } from '@/lib/resetBackend';
import { reconstructState } from '@/lib/resetRestore';

export default function ResetWelcome() {
  const navigate = useNavigate();
  const { name, setName, setEmail, currentDay, goal, restoreState } = useReset();
  const [localName, setLocalName] = useState(name || '');
  const [localEmail, setLocalEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [checking, setChecking] = useState(false);
  const hasProgress = goal !== null;
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  // First touchpoint of the funnel — fires once per landing.
  useEffect(() => {
    track('reset_viewed', { returning: goal !== null });
  }, []);

  const handleStart = async () => {
    // First-timer: E-Mail ist Pflicht — sie ist der Lead UND der Kanal für die
    // täglichen Reset-Impulse. Ohne sie würde der Funnel den Nutzer verlieren.
    if (!hasProgress && !isValidEmail(localEmail)) {
      setEmailError(true);
      return;
    }
    const emailVal = localEmail.trim();
    if (localName.trim()) setName(localName.trim());
    if (emailVal) {
      setEmail(emailVal);
      captureLead(emailVal, localName);
      triggerResetSignup(emailVal, localName);
      // Server-side participant: consent (soft opt-in via disclosure) + UTM attribution
      recordSignup(emailVal, localName.trim() || null, true);
    }

    // Returning user IM SELBEN Browser (lokaler Stand da) → direkt zum Tag.
    if (hasProgress) {
      track('reset_resumed', { hasName: !!localName.trim(), hasEmail: !!emailVal });
      recordEvent(emailVal || null, 'reset_resumed');
      navigate(`/day/${Math.min(currentDay, 7)}`);
      return;
    }

    // Frischer Kontext (leerer lokaler Stand), aber bekannte E-Mail → Server nach
    // vorhandenem Fortschritt fragen (behebt iOS-Homescreen / Gerätewechsel).
    if (emailVal) {
      setChecking(true);
      const payload = await restoreFromServer(emailVal);
      setChecking(false);
      if (payload) {
        restoreState(reconstructState(payload));
        track('reset_restored', { source: 'welcome' });
        recordEvent(emailVal, 'reset_restored');
        navigate('/week'); // Wochen-Hub zeigt den wiederhergestellten Fortschritt
        return;
      }
    }

    // Neuer Nutzer → normaler Flow (Install-Tutorial → WhatsApp → Onboarding).
    track('reset_started', { hasName: !!localName.trim(), hasEmail: !!emailVal });
    recordEvent(emailVal || null, 'reset_started');
    navigate('/install');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">

      {/* HERO HEADER — blurred coaching shot with logo + headline overlaid */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: '42vh' }}>
        <img
          src="/images/caliness-coaching.jpg"
          alt="David & Sarah coachen eine CALINESS-Gruppe"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'blur(2px) brightness(0.6) saturate(1.05)', transform: 'scale(1.06)' }}
        />
        {/* Dark scrim — keeps text crisp + fades the image into the page */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, hsl(var(--background) / 0.5) 0%, hsl(var(--background) / 0.15) 32%, hsl(var(--background) / 0.7) 80%, hsl(var(--background)) 100%)',
          }}
        />
        <div className="relative z-10 flex flex-col items-center justify-end text-center px-6 pt-12 pb-7 gap-4" style={{ minHeight: '42vh' }}>
          <img
            src="/images/caliness-logo-white.png"
            alt="CALINESS"
            className="w-16 h-16 object-contain"
            style={{ filter: 'drop-shadow(0 0 24px hsl(0 0% 0% / 0.5))' }}
          />
          <h1
            className="font-outfit font-bold text-[27px] tracking-tight text-foreground leading-[1.15] text-balance max-w-sm"
            style={{ textShadow: '0 2px 24px hsl(0 0% 0% / 0.65)' }}
          >
            Du machst nicht zu wenig.<br />Nur an der falschen Stelle.
          </h1>
        </div>
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col items-center text-center px-6 pb-10 gap-7 max-w-sm mx-auto w-full animate-fade-in">

        <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-xs">
          7 Tage. Etwa 10 Minuten am Tag. Danach weißt du, wo dein System gerade leerläuft. Und kannst aufhören, da Kraft reinzukippen.
        </p>

        {/* What you actually get — concrete value above the fold */}
        <div className="w-full max-w-xs space-y-2 text-left">
          {[
            'Dein echter Kalorien- & Protein-Bedarf — aus 6 Werten',
            'Dein größter Hebel: wo dein System leerläuft',
            'Ein 7-Tage-Plan, der in deinen Alltag passt',
          ].map((b, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-[9px] font-bold">✓</span>
              </span>
              <span className="text-[13px] text-foreground/80 leading-snug">{b}</span>
            </div>
          ))}
        </div>

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
              placeholder="Deine E-Mail"
              value={localEmail}
              onChange={e => { setLocalEmail(e.target.value.slice(0, 100)); if (emailError) setEmailError(false); }}
              maxLength={100}
              className={`bg-card text-foreground placeholder:text-muted-foreground/40 h-12 rounded-xl text-center ${emailError ? 'border-red-400/70' : 'border-border/60'}`}
            />
            {emailError ? (
              <p className="text-[11px] text-red-400/80 leading-snug px-1">
                Bitte gib eine gültige E-Mail ein — dahin kommt dein persönlicher Tag-1-Plan.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground/40 leading-snug px-1">
                Dahin schicken wir deinen Tag-1-Plan + deine täglichen Reset-Impulse. Jederzeit mit einem Klick abbestellbar.{' '}
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
          disabled={checking}
        >
          {checking ? 'Einen Moment …' : hasProgress ? `Tag ${Math.min(currentDay, 7)} öffnen →` : 'Meinen Plan starten →'}
        </Button>
      </div>
    </div>
  );
}
