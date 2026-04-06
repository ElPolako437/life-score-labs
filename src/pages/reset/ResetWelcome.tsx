import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReset } from '@/contexts/ResetContext';

export default function ResetWelcome() {
  const navigate = useNavigate();
  const { email, setEmail, currentDay, goal } = useReset();
  const [localEmail, setLocalEmail] = useState(email || '');
  const hasProgress = goal !== null;

  const handleStart = () => {
    if (localEmail.trim()) setEmail(localEmail.trim());
    if (hasProgress) {
      navigate('/week');
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
          Dein System beruhigen — in 7 klaren Tagen. Kein Trainingsplan, keine Challenge. Sondern ein strukturierter Ansatz zur Stabilisierung.
        </p>

        {/* Email field */}
        {!hasProgress && (
          <div className="w-full space-y-2">
            <Input
              type="email"
              placeholder="Deine E-Mail (optional)"
              value={localEmail}
              onChange={e => setLocalEmail(e.target.value)}
              className="bg-card border-border/60 text-foreground placeholder:text-muted-foreground/50 h-12 rounded-xl text-center"
            />
            <p className="text-2xs text-muted-foreground/50">
              Erhalte jeden Morgen eine kurze Erinnerung
            </p>
          </div>
        )}

        <Button
          variant="premium"
          size="lg"
          className="w-full min-h-[48px]"
          onClick={handleStart}
        >
          {hasProgress ? `Weiter bei Tag ${Math.min(currentDay, 7)}` : 'Reset starten'}
        </Button>
      </div>
    </div>
  );
}
