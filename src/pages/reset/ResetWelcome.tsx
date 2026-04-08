import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReset } from '@/contexts/ResetContext';
import { track, captureLead } from '@/lib/analytics';

export default function ResetWelcome() {
  const navigate = useNavigate();
  const { name, setName, currentDay, goal } = useReset();
  const [localName, setLocalName] = useState(name || '');
  const [localEmail, setLocalEmail] = useState('');
  const hasProgress = goal !== null;

  const handleStart = () => {
    if (localName.trim()) setName(localName.trim());
    if (localEmail.trim()) captureLead(localEmail, localName);
    track(hasProgress ? 'reset_resumed' : 'reset_started', { hasName: !!localName.trim(), hasEmail: !!localEmail.trim() });
    if (hasProgress) {
      // Go directly to active day if it's not completed yet
      const activeDay = Math.min(currentDay, 7);
      navigate(`/day/${activeDay}`);
    } else {
      navigate('/onboarding');
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
          <h1 className="font-outfit font-bold text-3xl tracking-tight text-foreground leading-tight">
            Du bist erschöpft —<br />aber nicht aus dem Grund,<br />den du denkst.
          </h1>
        </div>

        <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-xs">
          Wenn du das hier liest, hast du es wahrscheinlich schon mit früher schlafen, weniger Essen oder mehr Disziplin versucht. Nichts hat dauerhaft geholfen. Hier ist der Grund — und was tatsächlich funktioniert.
        </p>

        {/* Trust signal — David & Sarah */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 flex-shrink-0">
            <img
              src="/images/david.jpg"
              alt="David"
              className="w-8 h-8 rounded-full object-cover grayscale brightness-75 ring-2 ring-background"
            />
            <img
              src="/images/sarah.jpg"
              alt="Sarah"
              className="w-8 h-8 rounded-full object-cover grayscale brightness-75 ring-2 ring-background"
            />
          </div>
          <p className="text-xs text-muted-foreground/50 text-left leading-snug">
            Von David &amp; Sarah — Caliness Academy<br />
            <span className="text-muted-foreground/30">über 200 Teilnehmer persönlich begleitet</span>
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
          </div>
        )}

        <Button
          variant="premium"
          size="lg"
          className="w-full min-h-[48px]"
          onClick={handleStart}
        >
          {hasProgress ? `Tag ${Math.min(currentDay, 7)} öffnen →` : 'Ich will das verstehen →'}
        </Button>
      </div>
    </div>
  );
}
