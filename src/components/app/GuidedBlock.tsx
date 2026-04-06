import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, Moon, Brain, Timer } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockType: 'recovery' | 'decompression' | 'mental';
  title: string;
  description: string;
  duration?: number; // minutes
  onComplete: () => void;
}

export default function GuidedBlock({ open, onOpenChange, blockType, title, description, duration, onComplete }: Props) {
  const [timerActive, setTimerActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState((duration || 5) * 60);
  const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out'>('in');
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const isMental = blockType === 'decompression' || blockType === 'mental';
  const hasTimer = !!duration && duration > 0;

  useEffect(() => {
    if (!open) {
      setTimerActive(false);
      setSecondsLeft((duration || 5) * 60);
    }
  }, [open, duration]);

  useEffect(() => {
    if (!timerActive) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setTimerActive(false);
          if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timerActive]);

  // Breathing animation cycle for mental blocks
  useEffect(() => {
    if (!isMental || !timerActive) return;
    const cycle = () => {
      setBreathPhase('in');
      setTimeout(() => setBreathPhase('hold'), 4000);
      setTimeout(() => setBreathPhase('out'), 8000);
    };
    cycle();
    const id = setInterval(cycle, 14000);
    return () => clearInterval(id);
  }, [isMental, timerActive]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    onComplete();
    onOpenChange(false);
  };

  const Icon = isMental ? Brain : Moon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-outfit flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {title}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pt-3 pb-4">
          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

          {/* Breathing animation for mental blocks */}
          {isMental && timerActive && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div
                className="rounded-full bg-primary/10 border-2 border-primary/30 transition-all duration-[4000ms] ease-in-out"
                style={{
                  width: breathPhase === 'in' ? 120 : breathPhase === 'hold' ? 120 : 60,
                  height: breathPhase === 'in' ? 120 : breathPhase === 'hold' ? 120 : 60,
                  opacity: breathPhase === 'out' ? 0.5 : 1,
                }}
              />
              <span className="text-xs text-primary font-semibold">
                {breathPhase === 'in' ? 'Einatmen...' : breathPhase === 'hold' ? 'Halten...' : 'Ausatmen...'}
              </span>
            </div>
          )}

          {/* Timer */}
          {hasTimer && (
            <div className="flex flex-col items-center gap-3">
              <div className="font-outfit text-4xl font-bold text-foreground">{formatTime(secondsLeft)}</div>
              {!timerActive && secondsLeft > 0 && (
                <Button variant="outline" onClick={() => setTimerActive(true)} className="gap-2">
                  <Timer className="w-4 h-4" /> Timer starten
                </Button>
              )}
              {timerActive && (
                <Button variant="ghost" onClick={() => setTimerActive(false)} className="text-xs text-muted-foreground">
                  Pausieren
                </Button>
              )}
              {secondsLeft === 0 && (
                <p className="text-sm text-primary font-semibold">Zeit ist um! Gut gemacht. 🎉</p>
              )}
            </div>
          )}

          {/* Complete button */}
          <Button className="w-full h-12 glow-neon" onClick={handleComplete}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Erledigt
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
