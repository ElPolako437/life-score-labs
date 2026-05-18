import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useReset } from '@/contexts/ResetContext';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/lib/analytics';

export default function ResetWhatsApp() {
  const navigate = useNavigate();
  const { email, name, goal } = useReset();
  const [number, setNumber] = useState('+49 ');
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const proceedToReset = () => {
    navigate('/onboarding');
  };

  const handleActivate = async () => {
    const cleaned = number.trim();
    // Nur absenden wenn mehr als Vorwahl eingegeben wurde
    if (cleaned.length > 4) {
      setLoading(true);
      track('whatsapp_opted_in');

      supabase.functions
        .invoke('register-reset-participant', {
          body: {
            step: 'whatsapp',
            email: email ?? '',
            vorname: name ?? null,
            whatsapp_nummer: cleaned,
            ziel: goal ?? null,
            start_datum: today,
          },
        })
        .catch(console.error);

      setLoading(false);
    }
    proceedToReset();
  };

  const handleSkip = () => {
    track('whatsapp_skipped');
    proceedToReset();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Green glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-primary/6 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-7 max-w-sm w-full animate-fade-in">

        {/* Logo */}
        <img
          src="/images/caliness-logo-white.png"
          alt="CALINESS"
          className="w-14 h-14 object-contain opacity-80"
        />

        {/* Eyebrow */}
        <p className="text-[11px] font-semibold tracking-[3px] uppercase text-primary -mb-2">
          PERSÖNLICHE BEGLEITUNG
        </p>

        {/* Headline */}
        <div className="text-center space-y-3">
          <h1 className="font-outfit font-bold text-[26px] leading-tight tracking-tight text-foreground">
            Täglich kurz von David —<br />direkt auf WhatsApp.
          </h1>
          <p className="text-sm text-muted-foreground/65 leading-relaxed max-w-xs mx-auto">
            Wer auf WhatsApp dabei ist, bleibt nachweislich besser dran. Ich check kurz rein, du antwortest wenn du magst — kein Druck.
          </p>
        </div>

        {/* Input */}
        <div className="w-full space-y-2">
          <div className="relative">
            <input
              type="tel"
              value={number}
              onChange={e => setNumber(e.target.value)}
              placeholder="+49 170 1234567"
              className="w-full h-12 px-4 rounded-xl bg-card border border-border/60 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
          <p className="text-[11px] text-muted-foreground/35 text-center leading-relaxed">
            Nur für die 7 Reset-Tage. Kein Spam, keine Werbung danach.
          </p>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-3">
          <Button
            variant="premium"
            size="lg"
            className="w-full min-h-[52px] text-base font-bold"
            onClick={handleActivate}
            disabled={loading}
          >
            {loading ? 'Einen Moment…' : 'Begleitung aktivieren →'}
          </Button>

          <button
            onClick={handleSkip}
            className="w-full min-h-[48px] rounded-xl border border-border/40 text-muted-foreground/60 text-sm font-medium hover:border-border/70 hover:text-muted-foreground/80 transition-all"
          >
            Überspringen — nur per E-Mail
          </button>
        </div>

      </div>
    </div>
  );
}
