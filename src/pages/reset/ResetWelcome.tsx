import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReset } from '@/contexts/ResetContext';
import { track } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';

export default function ResetWelcome() {
  const navigate = useNavigate();
  const { name, setName, setEmail, currentDay, goal } = useReset();
  const hasProgress = goal !== null;

  const [vorname, setVorname] = useState(name || '');
  const [email, setEmailLocal] = useState('');
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ vorname?: string; email?: string; checkbox?: string }>({});

  // Returning user — direkt zum aktiven Tag
  if (hasProgress) {
    const activeDay = Math.min(currentDay, 7);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="flex flex-col items-center gap-6 max-w-sm w-full animate-fade-in">
          <img
            src="/images/caliness-logo-white.png"
            alt="CALINESS"
            className="w-16 h-16 object-contain"
          />
          <h1 className="font-outfit font-bold text-2xl text-foreground">
            Willkommen zurück{name ? `, ${name}` : ''}.
          </h1>
          <Button
            variant="premium"
            size="lg"
            className="w-full min-h-[52px]"
            onClick={() => navigate(`/day/${activeDay}`)}
          >
            Tag {activeDay} öffnen →
          </Button>
        </div>
      </div>
    );
  }

  const validate = () => {
    const e: typeof errors = {};
    if (!vorname.trim()) e.vorname = 'Bitte gib deinen Vornamen ein.';
    if (!email.trim()) {
      e.email = 'Bitte gib deine E-Mail-Adresse ein.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = 'Bitte eine gültige E-Mail-Adresse eingeben.';
    }
    if (!checked) e.checkbox = 'Bitte bestätige die Begleitung per E-Mail.';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    const cleanEmail  = email.trim().toLowerCase();
    const cleanVorname = vorname.trim();

    // Context setzen — sofort, für alle folgenden Screens
    setName(cleanVorname);
    setEmail(cleanEmail);

    track('reset_started', { hasName: true, hasEmail: true });

    // Edge Function — DB + Resend Audience (fire, nicht auf Ergebnis warten)
    supabase.functions
      .invoke('register-reset-participant', {
        body: { step: 'register', email: cleanEmail, vorname: cleanVorname, ziel: null },
      })
      .catch(console.error);

    setLoading(false);
    navigate('/whatsapp');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Green glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-primary/6 blur-[130px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-7 max-w-sm w-full animate-fade-in">

        {/* Logo */}
        <img
          src="/images/caliness-logo-white.png"
          alt="CALINESS"
          className="w-16 h-16 object-contain"
          style={{ filter: 'drop-shadow(0 0 24px hsl(142 76% 46% / 0.18))' }}
        />

        {/* Copy */}
        <div className="space-y-3 text-center">
          <p className="text-[11px] font-semibold tracking-[3px] uppercase text-primary">
            7-TAGE RESET
          </p>
          <h1 className="font-outfit font-bold text-[28px] leading-tight tracking-tight text-foreground">
            Du bist erschöpft —<br />aber nicht aus dem Grund,<br />den du denkst.
          </h1>
          <p className="text-sm text-muted-foreground/70 leading-relaxed">
            7 Tage. Täglich ~10 Minuten. Kostenlos.<br />Über 200 Menschen haben das bereits durchgezogen.
          </p>
        </div>

        {/* Trust signal */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 flex-shrink-0">
            <img src="/images/david.jpg" alt="David" className="w-8 h-8 rounded-full object-cover grayscale brightness-75 ring-2 ring-background" />
            <img src="/images/sarah.jpg" alt="Sarah" className="w-8 h-8 rounded-full object-cover grayscale brightness-75 ring-2 ring-background" />
          </div>
          <p className="text-xs text-muted-foreground/45 text-left leading-snug">
            David &amp; Sarah — Caliness Academy<br />
            <span className="text-muted-foreground/25">über 200 Menschen persönlich begleitet</span>
          </p>
        </div>

        {/* Form */}
        <div className="w-full space-y-3">
          {/* Vorname */}
          <div>
            <Input
              placeholder="Dein Vorname *"
              value={vorname}
              onChange={e => { setVorname(e.target.value.slice(0, 30)); setErrors(ev => ({ ...ev, vorname: undefined })); }}
              maxLength={30}
              className={`bg-card border-border/60 text-foreground placeholder:text-muted-foreground/40 h-12 rounded-xl text-sm ${errors.vorname ? 'border-red-500/60' : ''}`}
            />
            {errors.vorname && <p className="text-xs text-red-400/80 mt-1 pl-1">{errors.vorname}</p>}
          </div>

          {/* Email */}
          <div>
            <Input
              type="email"
              placeholder="Deine E-Mail-Adresse *"
              value={email}
              onChange={e => { setEmailLocal(e.target.value.slice(0, 100)); setErrors(ev => ({ ...ev, email: undefined })); }}
              maxLength={100}
              className={`bg-card border-border/60 text-foreground placeholder:text-muted-foreground/40 h-12 rounded-xl text-sm ${errors.email ? 'border-red-500/60' : ''}`}
            />
            {errors.email && <p className="text-xs text-red-400/80 mt-1 pl-1">{errors.email}</p>}
          </div>

          {/* Checkbox */}
          <div>
            <label className={`flex items-start gap-3 cursor-pointer rounded-xl border p-3.5 transition-colors ${checked ? 'border-primary/40 bg-primary/5' : errors.checkbox ? 'border-red-500/40 bg-red-500/5' : 'border-border/40 bg-card'}`}>
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={e => { setChecked(e.target.checked); setErrors(ev => ({ ...ev, checkbox: undefined })); }}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${checked ? 'bg-primary border-primary' : 'border-border/60 bg-card'}`}>
                  {checked && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="#080808" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                Mit dem Start begleiten wir dich 7 Tage per E-Mail. Kein Newsletter, keine Werbung. Abmeldung jederzeit per Klick.
              </p>
            </label>
            {errors.checkbox && <p className="text-xs text-red-400/80 mt-1 pl-1">{errors.checkbox}</p>}
          </div>
        </div>

        {/* Submit */}
        <Button
          variant="premium"
          size="lg"
          className="w-full min-h-[52px] text-base font-bold"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Einen Moment…' : 'Reset starten →'}
        </Button>

        <p className="text-[11px] text-muted-foreground/25 text-center leading-relaxed">
          Kostenlos · Kein Abo · Jederzeit abmeldbar
        </p>
      </div>
    </div>
  );
}
