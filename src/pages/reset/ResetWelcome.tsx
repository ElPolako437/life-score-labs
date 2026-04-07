import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReset } from '@/contexts/ResetContext';

export default function ResetWelcome() {
  const navigate = useNavigate();
  const { name, setName, currentDay, goal } = useReset();
  const [localName, setLocalName] = useState(name || '');
  const hasProgress = goal !== null;

  const handleStart = () => {
    if (localName.trim()) setName(localName.trim());
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
          <h1 className="font-outfit font-bold text-3xl tracking-tight text-foreground">
            7-Tage Reset
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Mehr Ruhe im Körper. Mehr Klarheit im Fettverlust.
          </p>
        </div>

        <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-xs">
          Die meisten Menschen sind nicht erschöpft weil sie zu wenig schlafen — sondern weil sie zu viele Reize aufnehmen. Dieser Reset adressiert die Ursache, nicht das Symptom.
        </p>

        <p className="text-xs text-muted-foreground/50 tracking-wide">
          7 Tage · täglich ~10 Minuten · über 500 Teilnehmer
        </p>

        {!hasProgress && (
          <Input
            placeholder="Dein Vorname (optional)"
            value={localName}
            onChange={e => setLocalName(e.target.value.slice(0, 30))}
            maxLength={30}
            className="bg-card border-border/60 text-foreground placeholder:text-muted-foreground/40 h-12 rounded-xl text-center"
          />
        )}

        <Button
          variant="premium"
          size="lg"
          className="w-full min-h-[48px]"
          onClick={handleStart}
        >
          {hasProgress ? `Tag ${Math.min(currentDay, 7)} öffnen →` : 'Reset starten'}
        </Button>
      </div>
    </div>
  );
}
