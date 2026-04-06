import { useState, useEffect } from 'react';
import { getTierMeta, type EvolutionTier } from '@/lib/companionState';
import CompanionCreature from './CompanionCreature';
import type { CompanionData } from '@/lib/companionState';
import { Button } from '@/components/ui/button';

interface Props {
  oldTier: EvolutionTier;
  newTier: EvolutionTier;
  companion: CompanionData;
  onDismiss: () => void;
}

export default function EvolutionMilestone({ oldTier, newTier, companion, onDismiss }: Props) {
  const [phase, setPhase] = useState(0); // 0 = creature transition, 1 = text1, 2 = text2, 3 = text3, 4 = cta
  const meta = getTierMeta(newTier);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1500),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 4000),
      setTimeout(() => setPhase(4), 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Particle leaves
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 4 + Math.random() * 3,
      size: 3 + Math.random() * 4,
    }))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)' }}>
      {/* Radial green glow backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, hsl(142 76% 46% / 0.15) 0%, transparent 60%)',
        }}
      />

      {/* Falling leaf particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: '-5%',
            width: p.size,
            height: p.size,
            background: `hsl(142 ${50 + Math.random() * 30}% ${40 + Math.random() * 20}% / 0.6)`,
            animation: `milestone-leaf-fall ${p.duration}s ease-in ${p.delay}s infinite`,
          }}
        />
      ))}

      <div className="relative flex flex-col items-center gap-6 px-8 max-w-sm">
        {/* Companion — animates from old to new */}
        <div
          className="transition-all duration-[3000ms] ease-out"
          style={{ transform: phase >= 1 ? 'scale(1.05)' : 'scale(0.9)', opacity: phase >= 0 ? 1 : 0 }}
        >
          <CompanionCreature companionState={companion} size={180} interactive={false} />
        </div>

        {/* Text sequence */}
        <div className="text-center space-y-3">
          <p
            className="font-outfit text-lg font-bold text-foreground transition-all duration-700"
            style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateY(0)' : 'translateY(10px)' }}
          >
            CALI ist gewachsen.
          </p>

          <div
            className="transition-all duration-700"
            style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(10px)' }}
          >
            <span className="text-2xl mr-2">{meta.icon}</span>
            <span className="font-outfit text-xl font-bold text-primary">{meta.label}</span>
            <p className="text-sm text-muted-foreground mt-1">{meta.description}</p>
          </div>

          <p
            className="text-sm text-muted-foreground italic leading-relaxed transition-all duration-700"
            style={{ opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? 'translateY(0)' : 'translateY(10px)' }}
          >
            {meta.milestone}
          </p>

          <div className="flex items-center gap-1.5 mt-2 opacity-30"
               style={{ opacity: phase >= 3 ? 0.3 : 0, transition: 'opacity 0.7s' }}>
            <img src="/images/caliness-logo-white.png" alt="" className="w-3.5 h-3.5 object-contain" />
            <span className="text-[9px] text-muted-foreground tracking-wider">CALINESS</span>
          </div>
        </div>

        {/* CTA */}
        <div
          className="w-full transition-all duration-700"
          style={{ opacity: phase >= 4 ? 1 : 0, transform: phase >= 4 ? 'translateY(0)' : 'translateY(10px)' }}
        >
          <Button className="w-full glow-neon" onClick={onDismiss}>
            Weiter →
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes milestone-leaf-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.4; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
