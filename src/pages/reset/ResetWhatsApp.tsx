import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useReset } from '@/contexts/ResetContext';
import { track } from '@/lib/analytics';
import { recordWhatsapp } from '@/lib/resetBackend';

const WHATSAPP_NUMBER = '4917685912445';
// Sobald der ManyChat-Flow auf das Keyword scharfgeschaltet ist, triggert diese
// Start-Nachricht die automatische Sequenz. Bis dahin ist es ein echter Draht zu
// den Coaches — die Copy verspricht daher bewusst KEINE automatischen Tagesnachrichten.
const WHATSAPP_TRIGGER_KEYWORD = 'Start Reset';

export default function ResetWhatsApp() {
  const navigate = useNavigate();
  const { name, email } = useReset();
  const [phone, setPhone] = useState('');

  // Optionale Nummer serverseitig sichern (landet in reset_participants → Admin).
  const savePhone = () => {
    const p = phone.trim();
    if (p.length >= 6) recordWhatsapp(email, p);
  };

  const proceedToReset = () => {
    navigate('/onboarding');
  };

  const handleOpenWhatsApp = () => {
    track('whatsapp_opted_in');
    savePhone();
    const greeting = name?.trim() ? `Hi David — hier ist ${name.trim()}.` : 'Hi David.';
    const text = `${greeting} ${WHATSAPP_TRIGGER_KEYWORD}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    // Geh weiter im Reset-Flow, egal ob WhatsApp wirklich geöffnet wurde
    setTimeout(proceedToReset, 400);
  };

  const handleSkip = () => {
    track('whatsapp_skipped');
    savePhone();
    proceedToReset();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-primary/6 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-7 max-w-sm w-full animate-fade-in">

        <img
          src="/images/caliness-logo-white.png"
          alt="CALINESS"
          className="w-14 h-14 object-contain opacity-80"
        />

        <p className="text-[11px] font-semibold tracking-[3px] uppercase text-primary -mb-2">
          PERSÖNLICHE BEGLEITUNG
        </p>

        <div className="text-center space-y-3">
          <h1 className="font-outfit font-bold text-[26px] leading-tight tracking-tight text-foreground">
            Direkter Draht zu uns —<br />auf WhatsApp.
          </h1>
          <p className="text-sm text-muted-foreground/65 leading-relaxed max-w-xs mx-auto">
            Fragen, Hürden oder kurz festhängen? Schreib David &amp; Sarah direkt — wir lesen mit und melden uns. Kein Bot-Spam — schreib jederzeit „STOP" und wir melden uns nicht mehr.
          </p>
        </div>

        <div className="w-full">
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={e => setPhone(e.target.value.slice(0, 25))}
            placeholder="Deine Nummer (optional)"
            className="w-full h-12 px-4 rounded-xl bg-card border border-border/60 text-foreground placeholder:text-muted-foreground/40 text-center focus:outline-none focus:border-primary/50"
          />
          <p className="text-[11px] text-muted-foreground/35 text-center mt-2 leading-snug">
            Optional — dann können David &amp; Sarah dich auch direkt erreichen.
          </p>
        </div>

        <div className="w-full space-y-3">
          <Button
            variant="premium"
            size="lg"
            className="w-full min-h-[52px] text-base font-bold gap-2"
            onClick={handleOpenWhatsApp}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
            </svg>
            Auf WhatsApp schreiben →
          </Button>

          <button
            onClick={handleSkip}
            className="w-full min-h-[48px] rounded-xl border border-border/40 text-muted-foreground/60 text-sm font-medium hover:border-border/70 hover:text-muted-foreground/80 transition-all"
          >
            Überspringen — nur per E-Mail
          </button>

          <p className="text-[11px] text-muted-foreground/35 text-center leading-relaxed pt-1">
            WhatsApp öffnet sich mit einer kurzen Start-Nachricht. Schick sie ab — dann sind wir für dich erreichbar.
          </p>
        </div>

      </div>
    </div>
  );
}
