import { useApp } from '@/contexts/AppContext';
import { Crown, Check, Sparkles, Shield, Brain, Moon, Zap, Target, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PremiumPaywallProps {
  feature: string;
  compact?: boolean;
  children?: React.ReactNode;
}

const PREMIUM_BENEFITS = [
  { icon: Brain, text: 'Unbegrenzter KI-Coach' },
  { icon: Sparkles, text: 'Persönlicher Wochenbericht' },
  { icon: Target, text: 'KI-Wochenpläne & adaptive Anpassung' },
  { icon: Moon, text: 'Bio-Alter Delta & Muster-Erkennung' },
  { icon: Shield, text: 'Companion Evolution & Abendreflexion' },
  { icon: Zap, text: 'KI-Ernährungspläne & Wearable-Daten' },
];

export default function PremiumPaywall({ feature, compact = false, children }: PremiumPaywallProps) {
  const { startCheckout } = useApp();

  if (compact) {
    return (
      <div className="card-elegant rounded-2xl p-4 border-primary/20 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lock className="w-4 h-4 text-primary" />
          {feature}
        </div>
        <p className="text-xs text-muted-foreground">
          Dieses Feature ist Teil von CALINESS Premium.
        </p>
        <Button onClick={startCheckout} variant="premium" size="sm" className="w-full">
          Premium freischalten · €39/Monat
        </Button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-8 pb-4 space-y-6 animate-enter">
      {children && (
        <div className="relative overflow-hidden rounded-2xl">
          <div className="blur-sm opacity-50 pointer-events-none">{children}</div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
      )}

      <div className="card-elegant rounded-2xl p-6 space-y-6 border-primary/30">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center overflow-hidden"
               style={{ animation: 'glowPulseGreen 3s ease-in-out infinite' }}>
            <img src="/images/caliness-logo-white.png" alt="" className="w-8 h-8 object-contain" />
          </div>
          <h2 className="font-outfit text-xl font-bold text-foreground">CALINESS Premium</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Schalte die volle Kraft deines persönlichen Longevity-Systems frei.
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-outfit text-4xl font-bold text-foreground">€39</span>
            <span className="text-sm text-muted-foreground">/Monat</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Jederzeit kündbar · 14 Tage Widerrufsrecht</p>
        </div>

        <div className="space-y-3">
          {PREMIUM_BENEFITS.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <b.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">{b.text}</span>
            </div>
          ))}
        </div>

        <Button onClick={startCheckout} variant="premium" size="lg" className="w-full">
          Jetzt Premium starten
        </Button>

        <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <span>🔒 SSL-verschlüsselt</span>
          <span>✓ Jederzeit kündbar</span>
        </div>
      </div>
    </div>
  );
}
