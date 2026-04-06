import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';

interface StreakCelebrationProps {
  streak: number;
  show: boolean;
  onComplete: () => void;
}

const MILESTONE_TEXT: Record<number, string> = {
  7: 'Eine Woche. Dein Rhythmus wird real.',
  14: 'Zwei Wochen. Du baust etwas auf.',
  21: 'Drei Wochen. Das ist keine Phase mehr.',
  30: 'Ein Monat. Du hast dich verändert.',
};

export default function StreakCelebration({ streak, show, onComplete }: StreakCelebrationProps) {
  const [phase, setPhase] = useState<'burst' | 'number' | 'text' | 'done'>('burst');

  useEffect(() => {
    if (!show) return;
    setPhase('burst');
    const t1 = setTimeout(() => setPhase('number'), 600);
    const t2 = setTimeout(() => setPhase('text'), 1800);
    const t3 = setTimeout(() => { setPhase('done'); onComplete(); }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [show, onComplete]);

  if (!show || phase === 'done') return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 backdrop-blur-md"
      onClick={onComplete}
    >
      {/* Particle burst */}
      {phase === 'burst' && (
        <div className="relative w-48 h-48">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: i % 2 === 0 ? 'hsl(142 76% 46%)' : 'hsl(45 90% 55%)',
                left: '50%',
                top: '50%',
                animation: `confettiFloat 1s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                animationDelay: `${i * 50}ms`,
                transform: `rotate(${i * 30}deg) translateY(-40px)`,
              }}
            />
          ))}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(142 76% 46% / 0.3) 0%, transparent 70%)',
              animation: 'celebrationBurst 0.8s ease-out forwards',
            }}
          />
        </div>
      )}

      {/* Streak number */}
      {(phase === 'number' || phase === 'text') && (
        <div
          className="flex flex-col items-center gap-4"
          style={{ animation: 'streakExplosion 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          <div
            className="w-20 h-20 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center"
            style={{ animation: 'glowPulseGold 2s ease-in-out infinite' }}
          >
            <Flame className="w-10 h-10 text-amber-400" />
          </div>
          <span className="font-outfit text-6xl font-bold text-foreground" style={{ textShadow: '0 0 30px hsl(142 76% 46% / 0.4)' }}>
            {streak}
          </span>
          <span className="text-sm text-muted-foreground font-medium">Tage in Folge</span>
        </div>
      )}

      {/* Motivational text */}
      {phase === 'text' && (
        <>
          {MILESTONE_TEXT[streak] && (
            <p
              className="text-center text-lg font-medium text-foreground/90 mt-6 px-12 max-w-xs"
              style={{ animation: 'cardSlideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
            >
              {MILESTONE_TEXT[streak]}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-4 opacity-30">
            <img src="/images/caliness-logo-white.png" alt="" className="w-4 h-4 object-contain" />
            <span className="text-[9px] text-muted-foreground tracking-wider">CALINESS</span>
          </div>
        </>
      )}
    </div>
  );
}
