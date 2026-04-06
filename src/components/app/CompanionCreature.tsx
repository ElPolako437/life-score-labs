import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { CompanionData } from '@/lib/companionState';
import CompanionStatePanel from './CompanionStatePanel';

interface CompanionCreatureProps {
  companionState: CompanionData;
  size?: number;
  compact?: boolean;
  className?: string;
  id?: string;
  interactive?: boolean;
}

export default function CompanionCreature({ companionState, size = 240, compact = false, className, id: idProp, interactive = true }: CompanionCreatureProps) {
  const {
    pillarIntensity, coreGlow, shellIntegrity, breathCycle, state, vitality,
    posture, eyeExpression, sanctuaryBrightness, tension, evolutionTier, warmth, mood,
    evolutionStage, dayPhase, weakestPillar, streakTier, attentionHungry,
  } = companionState;

  const [showPanel, setShowPanel] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [tapRipple, setTapRipple] = useState(false);
  const [tapFlash, setTapFlash] = useState(false);
  const [tapHeart, setTapHeart] = useState(false);
  const [tapSparkles, setTapSparkles] = useState(false);
  const [tapEyesWide, setTapEyesWide] = useState(false);

  const uid = useMemo(() => idProp || `cc-${Math.random().toString(36).slice(2, 7)}`, [idProp]);

  // ═══ STATE-DRIVEN PALETTE ═══
  const stateHSL = useMemo(() => {
    const stateColors: Record<string, { h: number; s: number; l: number }> = {
      erschoepft: { h: 220, s: 20, l: 25 },
      angespannt: { h: 35, s: 45, l: 35 },
      stabil: { h: 142, s: 55, l: 35 },
      erholt: { h: 152, s: 65, l: 40 },
      vital: { h: 142, s: 76, l: 46 },
    };
    return stateColors[state] || stateColors.stabil;
  }, [state]);

  const palette = useMemo(() => {
    const c = stateHSL;
    return {
      primary: `hsl(${c.h}, ${c.s}%, ${c.l}%)`,
      dark: `hsl(${c.h}, ${Math.max(15, c.s - 25)}%, ${Math.max(8, c.l - 20)}%)`,
      mid: `hsl(${c.h}, ${Math.max(20, c.s - 15)}%, ${Math.max(12, c.l - 10)}%)`,
      light: `hsl(${c.h}, ${Math.max(25, c.s - 10)}%, ${c.l}%)`,
      highlight: `hsl(${c.h}, ${Math.max(30, c.s - 5)}%, ${Math.min(75, c.l + 25)}%)`,
      glow: `hsl(${c.h}, ${c.s}%, ${Math.min(65, c.l + 15)}%)`,
      innerLight: `hsl(${c.h}, ${Math.min(90, c.s + 10)}%, ${Math.min(70, c.l + 20)}%)`,
      aura: `hsla(${c.h}, ${c.s}%, ${c.l}%, `,
    };
  }, [stateHSL]);

  // Aura color by state — visually distinct per emotional state
  const auraColor = useMemo(() => {
    const colors: Record<string, string> = {
      erschoepft: 'hsl(220, 30%, 40%)',      // dim blue-grey
      angespannt: 'hsl(35, 50%, 45%)',        // muted amber
      stabil: 'hsl(142, 55%, 40%)',           // balanced green
      erholt: 'hsl(165, 60%, 42%)',           // teal
      vital: 'hsl(45, 85%, 55%)',             // warm gold
    };
    return colors[state] || colors.stabil;
  }, [state]);

  // Track previous state for transition flash
  const prevStateRef = useRef(state);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (prevStateRef.current !== state) {
      prevStateRef.current = state;
      setTransitioning(true);
      const timer = setTimeout(() => setTransitioning(false), 2800);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const tierGlowBoost = evolutionTier === 'ancient' ? 0.15 : evolutionTier === 'guardian' ? 0.08 : 0;

  // ═══ EVOLUTION STAGE VISUALS ═══
  const stageScale = evolutionStage?.scaleFactor ?? 1;
  const stageAura = evolutionStage?.auraIntensity ?? 0.5;
  const stageMoteCount = evolutionStage?.moteCount ?? 3;
  const stageEyeBoost = evolutionStage?.eyeBrightnessBoost ?? 0;
  const stageShellRichness = evolutionStage?.shellRichness ?? 0.5;

  // ═══ DAY PHASE MODIFIERS ═══
  const phaseBrightness = dayPhase?.brightnessModifier ?? 1;
  const phaseWarmthShift = dayPhase?.warmthShift ?? 0;
  const phaseBreathMod = dayPhase?.breathCycleModifier ?? 1;
  const currentPhase = dayPhase?.phase ?? 'midday';

  // ═══ STREAK EXPRESSION ═══
  const currentStreakTier = streakTier ?? 'none';

  // ═══ ATTENTION HUNGER ═══
  const isHungry = attentionHungry ?? false;

  // ═══ PILLAR NEED ANIMATIONS ═══
  const currentNeed = weakestPillar ?? null;

  // Compute attention-seeking eye drift (looks forward more often)
  const [attentionPulse, setAttentionPulse] = useState(false);
  useEffect(() => {
    if (!isHungry || compact) return;
    const interval = setInterval(() => {
      setAttentionPulse(true);
      setTimeout(() => setAttentionPulse(false), 3000);
    }, 8000);
    return () => clearInterval(interval);
  }, [isHungry, compact]);

  const pillarColors = useMemo(() => {
    const base = state === 'erschoepft' || state === 'angespannt'
      ? { h: 35, s: 40, l: 30 }
      : { h: 142, s: 65, l: 40 };
    return {
      bewegung: `hsla(${base.h}, ${base.s}%, ${base.l}%, ${0.12 + pillarIntensity.bewegung * 0.5})`,
      ernaehrung: `hsla(${base.h + 8}, ${base.s - 8}%, ${base.l + 3}%, ${0.12 + pillarIntensity.ernaehrung * 0.5})`,
      regeneration: `hsla(${base.h - 5}, ${base.s - 3}%, ${base.l - 2}%, ${0.12 + pillarIntensity.regeneration * 0.5})`,
      mental: `hsla(${base.h + 15}, ${base.s - 12}%, ${base.l + 5}%, ${0.12 + pillarIntensity.mental * 0.5})`,
    };
  }, [pillarIntensity, state]);

  // ═══ EMOTIONAL BODY LANGUAGE CALCULATIONS ═══
  const postureOffset = (1 - posture) * 8;
  const headDrop = (1 - posture) * 5;
  const envGlow = sanctuaryBrightness * 0.15;
  const envMute = tension * 0.5;

  // Head tilt based on state
  const headRotation = useMemo(() => {
    if (state === 'erschoepft') return 6 + (1 - posture) * 3; // droop down
    if (state === 'angespannt') return -2 - tension * 2; // pulled back
    if (state === 'vital') return -3; // raised, open
    if (state === 'erholt') return -1;
    return 0;
  }, [state, posture, tension]);

  // Breathing animation selection
  const breathAnimation = useMemo(() => {
    if (state === 'erschoepft') return `companion-heavy-breathe ${breathCycle * 1.4}s cubic-bezier(0.37, 0, 0.63, 1) infinite`;
    if (state === 'angespannt') return `companion-tense-breathe ${breathCycle * 0.6}s cubic-bezier(0.37, 0, 0.63, 1) infinite`;
    return `companion-breathe ${breathCycle}s cubic-bezier(0.37, 0, 0.63, 1) infinite`;
  }, [state, breathCycle]);

  // Idle float for non-compact views — gentle weightless feel
  const idleFloatAnimation = useMemo(() => {
    if (compact) return undefined;
    if (state === 'erschoepft') return undefined; // exhausted Cali stays grounded
    const duration = state === 'vital' ? 5 : state === 'erholt' ? 6 : 7;
    return `companion-idle-float ${duration}s ease-in-out infinite`;
  }, [compact, state]);

  // Tail animation selection
  const tailAnimation = useMemo(() => {
    if (state === 'vital' || state === 'erholt') return `companion-tail-wag ${2.5 + (1 - vitality / 100)}s ease-in-out infinite`;
    if (state === 'angespannt') return `companion-tail-tense ${4}s ease-in-out infinite`;
    if (state === 'erschoepft') return `companion-tail-droop ${6}s ease-in-out infinite`;
    return `companion-tail-sway ${breathCycle * 2}s ease-in-out infinite`;
  }, [state, vitality, breathCycle]);

  // Shell scale based on state
  const shellScale = useMemo(() => {
    if (state === 'erschoepft') return 'scale(0.97, 0.96)';
    if (state === 'vital') return 'scale(1.02, 1.01)';
    if (state === 'angespannt') return 'scale(0.99, 0.98)';
    return 'scale(1, 1)';
  }, [state]);

  // Shell breathing animation
  const shellBreathAnim = useMemo(() => {
    return `companion-shell-breathe ${breathCycle * 1.1}s cubic-bezier(0.37, 0, 0.63, 1) infinite`;
  }, [breathCycle]);

  // Leg compression based on state
  const legStretch = useMemo(() => {
    if (state === 'erschoepft') return { scaleY: 0.92, extraDrop: 4 };
    if (state === 'angespannt') return { scaleY: 0.96, extraDrop: 2 };
    if (state === 'vital') return { scaleY: 1.04, extraDrop: -2 };
    return { scaleY: 1, extraDrop: 0 };
  }, [state]);

  // Core energy animation
  const coreAnimation = useMemo(() => {
    if (state === 'vital') return `companion-heartbeat 3.5s ease-in-out infinite`;
    if (state === 'angespannt') return `companion-core-flicker 2s ease-in-out infinite`;
    if (state === 'erschoepft') return `companion-glow ${breathCycle * 2}s ease-in-out infinite`;
    return `companion-glow ${breathCycle * 1.2}s ease-in-out infinite`;
  }, [state, breathCycle]);

  // Core visibility
  const coreOpacity = useMemo(() => {
    if (state === 'erschoepft') return 0.02 + coreGlow * 0.03;
    if (state === 'vital') return 0.1 + coreGlow * 0.3;
    if (state === 'angespannt') return 0.05 + coreGlow * 0.12;
    return 0.08 + coreGlow * 0.25;
  }, [state, coreGlow]);

  // Particle animation based on state
  const particleAnimation = useMemo(() => {
    if (state === 'erschoepft') return 'companion-particle-slow';
    if (state === 'angespannt') return 'companion-particle-agitated';
    return 'companion-particle';
  }, [state]);

  // Particle count
  const particleCount = useMemo(() => {
    if (state === 'erschoepft') return 2;
    if (state === 'angespannt') return 3;
    if (state === 'vital') return 7;
    return vitality > 60 ? 6 : vitality > 30 ? 4 : 3;
  }, [state, vitality]);

  // Ambient mote config — floating light motes for premium feel (enhanced by evolution stage)
  const moteConfig = useMemo(() => {
    if (compact) return [];
    const baseCount = state === 'vital' ? 5 : state === 'erholt' ? 4 : state === 'stabil' ? 3 : state === 'angespannt' ? 2 : 1;
    const count = Math.max(baseCount, stageMoteCount);
    return Array.from({ length: count }, (_, i) => ({
      delay: i * 2.5 + Math.random() * 2,
      duration: 6 + Math.random() * 4,
      dx: (Math.random() - 0.5) * 30,
      dy: -(10 + Math.random() * 25),
      dx2: (Math.random() - 0.5) * 20,
      dy2: -(25 + Math.random() * 20),
      startX: 60 + Math.random() * 80,
      startY: 100 + Math.random() * 50,
      size: 1 + Math.random() * 1.5,
    }));
  }, [compact, state]);

  const handleTap = useCallback(() => {
    if (!interactive) return;

    // Trigger tap bounce animation
    setTapped(true);
    setTapRipple(true);
    setTapFlash(true);
    setTapHeart(true);
    setTapSparkles(true);
    setTapEyesWide(true);
    setTimeout(() => setTapped(false), 400);
    setTimeout(() => setTapRipple(false), 600);
    setTimeout(() => setTapFlash(false), 500);
    setTimeout(() => setTapHeart(false), 900);
    setTimeout(() => setTapSparkles(false), 700);
    setTimeout(() => setTapEyesWide(false), 500);

    if (!compact) {
      setShowPanel(true);
    }
  }, [interactive, compact]);

  // Mood-driven animation overlay
  const moodAnimation = useMemo(() => {
    if (mood === 'happy') return 'moodHappyBounce 0.6s ease-in-out 3';
    if (mood === 'celebrating') return 'companion-celebrate-bounce 1.4s cubic-bezier(0.34, 1.56, 0.64, 1) 2';
    if (mood === 'concerned') return 'moodConcernedDroop 3s ease-in-out infinite';
    if (mood === 'sleepy') return 'moodSleepySway 4s ease-in-out infinite';
    return undefined;
  }, [mood]);

  // Idle attention animation — occasional curiosity head gesture
  const idleAttentionAnim = useMemo(() => {
    if (state === 'erschoepft') return undefined;
    const interval = state === 'vital' ? 8 : state === 'erholt' ? 10 : 14;
    return `companion-idle-attention ${interval}s ease-in-out infinite`;
  }, [state]);

  // Determine the root animation: tap bounce takes priority, then mood, then combined breath+float
  const rootAnimation = useMemo(() => {
    if (tapped) return 'companion-tap-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    if (moodAnimation) return moodAnimation;
    // Combine idle float with breathing via the float animation only (breath is on inner SVG elements)
    if (idleFloatAnimation) return idleFloatAnimation;
    return breathAnimation;
  }, [tapped, moodAnimation, idleFloatAnimation, breathAnimation]);

  return (
    <>
      <div
        className={cn(
          'relative inline-flex items-center justify-center companion-root',
          interactive && !compact && 'cursor-pointer',
          className,
        )}
        style={{
          animation: rootAnimation,
          transform: `scale(${stageScale})`,
          filter: `brightness(${phaseBrightness})${currentPhase === 'evening' ? ' saturate(0.92)' : currentPhase === 'night' ? ' saturate(0.82)' : ''}`,
          '--comp-h': stateHSL.h,
          '--comp-s': stateHSL.s,
          '--comp-l': stateHSL.l,
          '--comp-glow': coreGlow,
          '--comp-env': sanctuaryBrightness,
          transition: 'transform 1.5s cubic-bezier(0.22, 1, 0.36, 1), filter 2s ease',
        } as React.CSSProperties}
        onClick={handleTap}
      >
        {/* State transition bloom overlay — rich layered bloom */}
        {transitioning && (
          <>
            <div
              className="absolute inset-0 rounded-full pointer-events-none z-10"
              style={{
                background: `radial-gradient(ellipse at 50% 55%, ${palette.glow} 0%, transparent 70%)`,
                opacity: 0,
                animation: 'companion-state-flash 2.2s ease-out forwards',
              }}
            />
            <div
              className="absolute inset-0 rounded-full pointer-events-none z-10"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${auraColor} 0%, transparent 60%)`,
                animation: 'companion-bloom-pulse 3s ease-out forwards',
              }}
            />
            <div
              className="absolute inset-0 rounded-full pointer-events-none z-10"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${palette.primary} 0%, transparent 50%)`,
                animation: 'companion-state-bloom 2.8s ease-out forwards',
                animationDelay: '0.2s',
              }}
            />
          </>
        )}

        {/* Tap ripple */}
        {tapRipple && (
          <div
            className="absolute pointer-events-none z-10"
            style={{
              width: size * 0.4,
              height: size * 0.4,
              left: '50%',
              top: '50%',
              marginLeft: -(size * 0.2),
              marginTop: -(size * 0.2),
              borderRadius: '50%',
              border: `2px solid ${palette.glow}`,
              animation: 'companion-tap-ripple 0.6s ease-out forwards',
            }}
          />
        )}

        {/* Tap flash — bright burst */}
        {tapFlash && (
          <div
            className="absolute pointer-events-none z-10"
            style={{
              width: size * 0.5,
              height: size * 0.5,
              left: '50%',
              top: '45%',
              marginLeft: -(size * 0.25),
              marginTop: -(size * 0.25),
              borderRadius: '50%',
              background: `radial-gradient(circle, ${palette.glow} 0%, transparent 70%)`,
              animation: 'companion-tap-flash 0.5s ease-out forwards',
            }}
          />
        )}

        {/* Tap heart float */}
        {tapHeart && !compact && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left: '50%',
              top: '30%',
              marginLeft: -6,
              fontSize: 12,
              animation: 'companion-heart-float 0.9s ease-out forwards',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={palette.glow} opacity={0.8}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        )}

        {/* Tap sparkle burst — multiple small sparkles */}
        {tapSparkles && !compact && [0, 1, 2, 3, 4].map(i => {
          const angle = (i * 72 + 20) * (Math.PI / 180);
          const dist = 14 + i * 4;
          return (
            <div
              key={`tsp-${i}`}
              className="absolute pointer-events-none z-20"
              style={{
                left: '50%',
                top: '45%',
                width: 3,
                height: 3,
                marginLeft: -1.5,
                marginTop: -1.5,
                borderRadius: '50%',
                background: palette.glow,
                '--tap-sx': `${Math.cos(angle) * dist}px`,
                '--tap-sy': `${Math.sin(angle) * dist - 8}px`,
                '--tap-ex': `${Math.cos(angle) * dist * 1.8}px`,
                '--tap-ey': `${Math.sin(angle) * dist * 1.8 - 14}px`,
                animation: `companion-tap-sparkle 0.7s ease-out forwards`,
                animationDelay: `${i * 0.04}s`,
              } as React.CSSProperties}
            />
          );
        })}

        <svg width={size} height={size} viewBox="0 0 200 200" className="overflow-visible">
          {/* All SVG fills use transition for smooth morphing */}
          <style>{`
            #${uid}-group * {
              transition: fill 2s cubic-bezier(0.22, 1, 0.36, 1),
                          stroke 2s cubic-bezier(0.22, 1, 0.36, 1),
                          opacity 2s cubic-bezier(0.22, 1, 0.36, 1),
                          stop-color 2s cubic-bezier(0.22, 1, 0.36, 1),
                          stop-opacity 2s cubic-bezier(0.22, 1, 0.36, 1);
            }
          `}</style>
          <defs>
            <filter id={`${uid}-glow`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={4 * coreGlow} />
            </filter>
            <filter id={`${uid}-soft`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
            </filter>
            <filter id={`${uid}-sanctuary`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="22" />
            </filter>
            <filter id={`${uid}-heartbeat`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={10 * coreGlow} />
            </filter>
            <filter id={`${uid}-aura`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="30" />
            </filter>
            <filter id={`${uid}-mote`} x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
            </filter>

            <radialGradient id={`${uid}-sanctuary-glow`} cx="50%" cy="60%" r="60%">
              <stop offset="0%" stopColor={palette.primary} stopOpacity={envGlow * (1 - envMute)} />
              <stop offset="50%" stopColor={palette.primary} stopOpacity={envGlow * 0.3 * (1 - envMute)} />
              <stop offset="100%" stopColor={palette.primary} stopOpacity={0} />
            </radialGradient>

            <radialGradient id={`${uid}-ambient`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={palette.glow} stopOpacity={0.04 + coreGlow * 0.06} />
              <stop offset="100%" stopColor={palette.glow} stopOpacity={0} />
            </radialGradient>

            <radialGradient id={`${uid}-shell-grad`} cx="42%" cy="28%" r="68%">
              <stop offset="0%" stopColor={palette.highlight} stopOpacity={0.9} />
              <stop offset="18%" stopColor={palette.light} />
              <stop offset="42%" stopColor={palette.mid} />
              <stop offset="72%" stopColor={palette.dark} />
              <stop offset="100%" stopColor={palette.dark} stopOpacity={0.95} />
            </radialGradient>

            {/* Inner light — Cali glows from within */}
            <radialGradient id={`${uid}-inner-light`} cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor={palette.innerLight} stopOpacity={0.15 + coreGlow * 0.12} />
              <stop offset="40%" stopColor={palette.glow} stopOpacity={0.06 + coreGlow * 0.06} />
              <stop offset="100%" stopColor={palette.dark} stopOpacity={0} />
            </radialGradient>

            {/* Specular dome highlight */}
            <radialGradient id={`${uid}-specular`} cx="38%" cy="22%" r="35%">
              <stop offset="0%" stopColor="white" stopOpacity={0.12 + coreGlow * 0.08} />
              <stop offset="50%" stopColor="white" stopOpacity={0.03} />
              <stop offset="100%" stopColor="white" stopOpacity={0} />
            </radialGradient>

            {/* Layered aura gradients */}
            <radialGradient id={`${uid}-aura-inner-ring`} cx="50%" cy="50%" r="45%">
              <stop offset="0%" stopColor={auraColor} stopOpacity={0.12 + coreGlow * 0.1} />
              <stop offset="70%" stopColor={auraColor} stopOpacity={0.04} />
              <stop offset="100%" stopColor={auraColor} stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`${uid}-aura-mid-ring`} cx="50%" cy="50%" r="55%">
              <stop offset="40%" stopColor={auraColor} stopOpacity={0} />
              <stop offset="70%" stopColor={auraColor} stopOpacity={0.06 + coreGlow * 0.06} />
              <stop offset="100%" stopColor={auraColor} stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`${uid}-aura-outer-ring`} cx="50%" cy="50%" r="70%">
              <stop offset="60%" stopColor={auraColor} stopOpacity={0} />
              <stop offset="80%" stopColor={auraColor} stopOpacity={0.03 + coreGlow * 0.04} />
              <stop offset="100%" stopColor={auraColor} stopOpacity={0} />
            </radialGradient>

            <radialGradient id={`${uid}-body-grad`} cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor={palette.light} stopOpacity={0.7} />
              <stop offset="35%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.dark} />
            </radialGradient>

            {/* Warmth halo gradient */}
            <radialGradient id={`${uid}-warmth`} cx="50%" cy="55%" r="45%">
              <stop offset="0%" stopColor={palette.glow} stopOpacity={warmth * 0.08} />
              <stop offset="70%" stopColor={palette.primary} stopOpacity={warmth * 0.03} />
              <stop offset="100%" stopColor={palette.primary} stopOpacity={0} />
            </radialGradient>

            {/* Outer aura ring gradient */}
            <radialGradient id={`${uid}-aura-ring`} cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor={palette.glow} stopOpacity={0} />
              <stop offset="85%" stopColor={palette.glow} stopOpacity={0.06 + coreGlow * 0.08} />
              <stop offset="100%" stopColor={palette.glow} stopOpacity={0} />
            </radialGradient>
          </defs>

          <g id={`${uid}-group`}>
          {!compact && (
            <>
              {/* ═══ LAYERED AURA SYSTEM ═══ */}
              {/* Layer 3: Outer atmospheric ring — large, very subtle, breathing (enhanced by evolution stage) */}
              <ellipse
                cx="100" cy="115" rx="98" ry="85"
                fill={`url(#${uid}-aura-outer-ring)`}
                style={{
                  animation: `companion-aura-outer ${breathCycle * 2 * phaseBreathMod}s ease-in-out infinite`,
                  transition: 'opacity 3s ease',
                  opacity: stageAura,
                }}
              />

              {/* Layer 2: Middle soft glow — medium, matches state color */}
              <ellipse
                cx="100" cy="118" rx="85" ry="72"
                fill={`url(#${uid}-aura-mid-ring)`}
                style={{
                  animation: `companion-aura-mid ${breathCycle * 1.5}s ease-in-out infinite`,
                  transition: 'opacity 3s ease',
                }}
              />

              {/* Layer 1: Inner core glow — tight, bright */}
              <ellipse
                cx="100" cy="120" rx="70" ry="58"
                fill={`url(#${uid}-aura-inner-ring)`}
                style={{
                  animation: `companion-aura-inner ${breathCycle * 1.2}s ease-in-out infinite`,
                  transition: 'opacity 3s ease',
                }}
              />

              {/* Inner sanctuary glow */}
              <ellipse
                cx="100" cy="128" rx="80" ry="55"
                fill={`url(#${uid}-sanctuary-glow)`}
                style={{ animation: `companion-sanctuary-pulse ${breathCycle * 1.5}s ease-in-out infinite` }}
              />

              {/* Ground reflection — enhanced with gradient */}
              <ellipse cx="100" cy="172" rx="65" ry="10"
                fill={palette.primary}
                opacity={0.05 + sanctuaryBrightness * 0.08}
                filter={`url(#${uid}-soft)`}
              />

              {/* Ambient ground elements */}
              <ellipse cx="40" cy="176" rx="7" ry="2.5"
                fill={palette.mid} opacity={0.06 + vitality / 100 * 0.1}
                style={{ transition: 'opacity 3s ease' }}
              />
              <ellipse cx="158" cy="178" rx="5" ry="2"
                fill={palette.dark} opacity={0.05 + vitality / 100 * 0.08}
                style={{ transition: 'opacity 3s ease' }}
              />

              {/* Floating sanctuary particles — emotion-driven */}
              {Array.from({ length: particleCount }).map((_, i) => {
                const angle = (i * (360 / particleCount) + 20) * (Math.PI / 180);
                const radius = 65 + i * 10;
                const particleSize = state === 'erschoepft' ? 0.4 : 0.6 + (coreGlow * 0.8);
                return (
                  <circle
                    key={`env-${i}`}
                    cx={100 + radius * Math.cos(angle)}
                    cy={115 + radius * Math.sin(angle) * 0.45}
                    r={particleSize}
                    fill={palette.glow}
                    opacity={state === 'erschoepft' ? 0.03 + sanctuaryBrightness * 0.05 : 0.04 + sanctuaryBrightness * 0.12}
                    style={{
                      animation: `${particleAnimation} ${state === 'angespannt' ? 2.5 + i * 0.8 : 5 + i * 1.5}s ease-in-out infinite`,
                      animationDelay: `${i * 0.8}s`,
                      transition: 'opacity 3s ease',
                    }}
                  />
                );
              })}

              {/* Premium floating motes — firefly-like ambient lights */}
              {moteConfig.map((mote, i) => (
                <circle
                  key={`mote-${i}`}
                  cx={mote.startX}
                  cy={mote.startY}
                  r={mote.size}
                  fill={palette.glow}
                  filter={`url(#${uid}-mote)`}
                  style={{
                    '--mote-dx': `${mote.dx}px`,
                    '--mote-dy': `${mote.dy}px`,
                    '--mote-dx2': `${mote.dx2}px`,
                    '--mote-dy2': `${mote.dy2}px`,
                    animation: `companion-mote-float ${mote.duration}s ease-in-out infinite`,
                    animationDelay: `${mote.delay}s`,
                  } as React.CSSProperties}
                />
              ))}
            </>
          )}

          {/* Warmth halo */}
          <circle cx="100" cy="110" r="85" fill={`url(#${uid}-warmth)`} />
          <circle cx="100" cy="110" r="90" fill={`url(#${uid}-ambient)`} />

          {/* Ground shadow */}
          <ellipse cx="100" cy="172" rx="50" ry="5"
            fill={palette.primary}
            opacity={0.06 + shellIntegrity * 0.04}
            filter={`url(#${uid}-soft)`}
          />

          {/* ═══ CREATURE GROUP — with posture-driven body language ═══ */}
          <g
            style={{
              transform: `translateY(${postureOffset + legStretch.extraDrop}px)`,
              transition: 'transform 3s cubic-bezier(0.22, 1, 0.36, 1)',
              animation: state === 'vital' || state === 'erholt'
                ? `companion-happy-sway ${6 - vitality / 50}s ease-in-out infinite`
                : state === 'angespannt'
                ? `companion-shiver ${3 + tension * 2}s ease-in-out infinite`
                : currentNeed === 'bewegung'
                ? 'cali-need-stretch 10s ease-in-out infinite'
                : 'none',
            }}
          >
            {/* Back legs — state-driven compression */}
            <g style={{
              transformOrigin: '125px 150px',
              transform: `scaleY(${legStretch.scaleY})`,
              transition: 'transform 3s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <path d="M 125,138 C 128,138 132,145 132,155 C 132,160 128,162 125,162 C 122,162 118,160 118,155 C 118,145 122,138 125,138 Z" fill={palette.dark} opacity={0.6} />
            </g>
            <g style={{
              transformOrigin: '72px 148px',
              transform: `scaleY(${legStretch.scaleY})`,
              transition: 'transform 3s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <path d="M 72,136 C 75,136 79,143 79,153 C 79,158 75,160 72,160 C 69,160 65,158 65,153 C 65,143 69,136 72,136 Z" fill={palette.dark} opacity={0.6} />
            </g>

            {/* Tail — emotionally driven animation */}
            <path
              d="M 145,140 C 150,138 156,134 158,130 C 157,132 153,140 147,142 Z"
              fill={palette.dark} opacity={state === 'angespannt' ? 0.5 : 0.7}
              style={{
                transformOrigin: '145px 140px',
                animation: tailAnimation,
                transition: 'opacity 2s ease',
              }}
            />

            {/* Body — emotional breathing expansion */}
            <path
              d="M 55,140 C 55,135 60,128 70,128 L 130,128 C 140,128 145,135 145,140 C 145,145 140,148 130,148 L 70,148 C 60,148 55,145 55,140 Z"
              fill={`url(#${uid}-body-grad)`}
              style={{
                transformOrigin: '100px 138px',
                animation: state === 'erschoepft'
                  ? `companion-heavy-breathe ${breathCycle * 1.4}s cubic-bezier(0.37, 0, 0.63, 1) infinite`
                  : state === 'angespannt'
                  ? `companion-tense-breathe ${breathCycle * 0.6}s cubic-bezier(0.37, 0, 0.63, 1) infinite`
                  : `companion-belly-breathe ${breathCycle}s cubic-bezier(0.37, 0, 0.63, 1) infinite`,
              }}
            />

            {/* ═══ HEAD GROUP — with emotional tilt + idle attention ═══ */}
            <g
              style={{
                transformOrigin: '40px 105px',
                transform: `translateY(${headDrop}px) rotate(${headRotation}deg)`,
                animation: state === 'erschoepft'
                  ? `companion-head-droop ${breathCycle * 1.5}s ease-in-out infinite`
                  : idleAttentionAnim || `companion-head-drift ${12 + tension * 4}s ease-in-out infinite`,
                transition: 'transform 3s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {/* Neck — organic connection */}
              <path d="M 65,128 C 58,125 48,118 44,108 C 42,112 40,120 44,126 C 48,130 58,132 65,132 Z" fill={palette.mid} />

              {/* Head shape — refined cranium */}
              <ellipse cx="40" cy="105" rx="14.5" ry="12" fill={palette.mid} />
              {/* Snout / cheek area */}
              <ellipse cx="29" cy="107" rx="8" ry="7" fill={palette.light} opacity={0.85} />
              {/* Forehead ridge */}
              <path d="M 30,96 C 35,94.5 42,94.5 48,96" stroke={palette.dark} strokeWidth="0.6" fill="none" opacity={0.15} />

              {/* ═══ EAR — with idle perk animation ═══ */}
              <path
                d="M 46,93 C 48,87 52,84 53,86 C 52,89 49,93 47,95"
                fill={palette.mid}
                stroke={palette.dark}
                strokeWidth="0.3"
                opacity={0.6}
                style={{
                  transformOrigin: '48px 93px',
                  animation: state !== 'erschoepft' ? `companion-ear-perk ${state === 'vital' ? 7 : 12}s ease-in-out infinite` : 'none',
                  animationDelay: '3s',
                }}
              />

              {/* ═══ WORRY LINES — forehead wrinkles when tense ═══ */}
              {(state === 'angespannt' || tension > 0.5) && (
                <g style={{ animation: `companion-worry-pulse ${3 + tension}s ease-in-out infinite` }}>
                  <path d="M 33,95 C 35,94.3 37,94.3 39,95" stroke={palette.dark} strokeWidth="0.4" fill="none" opacity={0.2 + tension * 0.15} />
                  <path d="M 34,93.5 C 36,93 38,93 40,93.5" stroke={palette.dark} strokeWidth="0.35" fill="none" opacity={0.12 + tension * 0.1} />
                </g>
              )}

              {/* ═══ CHEEK WARMTH — richer, pulsing blush (dims when ernaehrung is weakest) ═══ */}
              <ellipse cx="26" cy="109" rx="7" ry="4.5"
                fill={state === 'vital' ? 'hsl(350, 70%, 60%)' : palette.glow}
                opacity={0}
                filter={`url(#${uid}-soft)`}
                style={{
                  opacity: currentNeed === 'ernaehrung' ? 0.02 : warmth > 0.6 ? 0.28 : warmth > 0.3 ? 0.14 : 0.04,
                  animation: currentNeed === 'ernaehrung'
                    ? 'cali-cheek-dim 5s ease-in-out infinite'
                    : state === 'vital' || state === 'erholt'
                    ? `companion-blush-pulse ${3.5}s ease-in-out infinite`
                    : 'none',
                  transition: 'opacity 3s ease',
                }}
              />
              {/* Second cheek blush (far side, richer) */}
              <ellipse cx="45" cy="106" rx="4.5" ry="3"
                fill={state === 'vital' ? 'hsl(350, 65%, 58%)' : palette.glow}
                opacity={warmth > 0.6 ? 0.16 : warmth > 0.3 ? 0.06 : 0.02}
                filter={`url(#${uid}-soft)`}
                style={{
                  animation: state === 'vital' ? `companion-blush-pulse 4s ease-in-out infinite` : 'none',
                  animationDelay: '1s',
                  transition: 'opacity 3s ease',
                }}
              />

              {/* ═══ NOSTRIL — breathing indicator ═══ */}
              <ellipse cx="22" cy="109" rx="1" ry={0.6 + (1 - posture) * 0.4}
                fill={palette.dark} opacity={0.35 + (1 - posture) * 0.15}
                style={{
                  transition: 'all 2s ease',
                  animation: `companion-nostril-breathe ${breathCycle}s ease-in-out infinite`,
                }}
              />

              {/* ═══ EYEBROWS — two separate, dramatically expressive ═══ */}
              {/* Left/main eyebrow */}
              <path
                d={
                  state === 'vital' || state === 'erholt'
                    ? "M 31,97 C 33,94.5 37,94.5 39,97"
                    : state === 'angespannt'
                    ? "M 30,96.5 C 32,97.5 36,98 39,96"
                    : state === 'erschoepft'
                    ? "M 31,98.5 C 33,99.5 37,99.5 39,98.5"
                    : eyeExpression === 'calm'
                    ? "M 31,97.5 C 33,96 37,96 39,97.5"
                    : "M 31,97.8 C 33,96.5 37,96.5 39,97.8"
                }
                stroke={palette.dark}
                strokeWidth={state === 'angespannt' ? 1.2 : state === 'erschoepft' ? 0.7 : 1}
                fill="none"
                opacity={state === 'angespannt' ? 0.5 : state === 'erschoepft' ? 0.35 : state === 'vital' ? 0.4 : 0.3}
                style={{
                  transition: 'all 2s cubic-bezier(0.22, 1, 0.36, 1)',
                  animation: state === 'angespannt' ? `companion-brow-furrow ${2}s ease-in-out infinite` : 'none',
                }}
              />
              {/* Right/far eyebrow (smaller, depth) */}
              <path
                d={
                  state === 'vital' || state === 'erholt'
                    ? "M 43,98.5 C 44.5,97 46,97 47,98.5"
                    : state === 'angespannt'
                    ? "M 43,98.2 C 44,99 46,99.2 47,98"
                    : state === 'erschoepft'
                    ? "M 43,99.5 C 44.5,100 46,100 47,99.5"
                    : "M 43,99 C 44.5,98.2 46,98.2 47,99"
                }
                stroke={palette.dark}
                strokeWidth={state === 'angespannt' ? 0.9 : 0.6}
                fill="none"
                opacity={state === 'angespannt' ? 0.35 : 0.2}
                style={{ transition: 'all 2s cubic-bezier(0.22, 1, 0.36, 1)' }}
              />

              {/* ═══ FAR EYE (depth, partially hidden) ═══ */}
              <g style={{
                animation: `companion-premium-blink ${(eyeExpression === 'bright' ? 3.5 : eyeExpression === 'heavy' ? 8 : 5) + 0.3}s ease-in-out infinite`,
                animationDelay: '0.15s',
                transformOrigin: '44.5px 102.5px',
                ...(tapEyesWide ? { animation: 'companion-tap-eyes-wide 0.5s ease-out' } : {}),
              }}>
                <ellipse cx="44.5" cy="102.5" rx="2.2" ry="1.8"
                  fill="white"
                  opacity={eyeExpression === 'heavy' ? 0.1 : 0.3}
                  style={{ transition: 'all 2s ease' }}
                />
                <circle cx="44.5" cy="102.5"
                  r={eyeExpression === 'bright' ? 1.8 : eyeExpression === 'heavy' ? 0.8 : 1.4}
                  fill={palette.primary}
                  opacity={eyeExpression === 'heavy' ? 0.2 : eyeExpression === 'dim' ? 0.35 : 0.65}
                  style={{ transition: 'all 2s ease' }}
                />
                {eyeExpression !== 'heavy' && (
                  <circle cx="44" cy="101.8" r="0.6" fill="white"
                    opacity={eyeExpression === 'bright' ? 0.6 : 0.3}
                    style={{ transition: 'opacity 2s ease' }}
                  />
                )}
                {/* Far eye smile squint */}
                {(state === 'vital' || (state === 'erholt' && posture > 0.7)) && (
                  <path d="M 42.5,103.5 C 44,104.5 45.5,104.5 47,103.5"
                    stroke={palette.dark} strokeWidth="0.8" fill="none" opacity={0.3}
                    style={{ transition: 'all 2s ease' }}
                  />
                )}
              </g>

              {/* ═══ MAIN EYE — full emotional system ═══ */}
              <g style={{
                animation: `companion-premium-blink ${eyeExpression === 'bright' ? 3.5 : eyeExpression === 'calm' ? 4.5 : eyeExpression === 'soft' ? 5 : eyeExpression === 'dim' ? 6.5 : 8}s ease-in-out infinite`,
                transformOrigin: '35px 102px',
                ...(tapEyesWide ? { animation: 'companion-tap-eyes-wide 0.5s ease-out' } : {}),
              }}>
                {/* Eye socket shadow */}
                <ellipse cx="35" cy="102" rx={eyeExpression === 'heavy' ? 3.5 : 4.5} ry={eyeExpression === 'heavy' ? 2.5 : 4}
                  fill={palette.dark} opacity={0.12}
                  style={{ transition: 'all 2s ease' }}
                />

                {/* Sclera */}
                <ellipse cx="35" cy="101.8"
                  rx={eyeExpression === 'heavy' ? 3 : eyeExpression === 'dim' ? 3.5 : 4}
                  ry={
                    (state === 'vital' || (state === 'erholt' && posture > 0.7))
                      ? 2.5
                      : eyeExpression === 'heavy' ? 1.5 : eyeExpression === 'dim' ? 2.8 : 3.5
                  }
                  fill="white"
                  opacity={eyeExpression === 'heavy' ? 0.25 : eyeExpression === 'dim' ? 0.4 : 0.55}
                  style={{ transition: 'all 2s ease' }}
                />

                {/* Iris */}
                <circle cx="35" cy={eyeExpression === 'heavy' ? 102.5 : 101.8}
                  r={eyeExpression === 'bright' ? 3 : eyeExpression === 'calm' ? 2.6 : eyeExpression === 'soft' ? 2.3 : eyeExpression === 'dim' ? 2 : 1.4}
                  fill={palette.primary}
                  opacity={eyeExpression === 'heavy' ? 0.5 : eyeExpression === 'dim' ? 0.65 : 0.95}
                  style={{ transition: 'all 2s ease' }}
                />

                {/* Pupil — with idle eye drift (looks forward when attention hungry) */}
                <g style={{
                  animation: isHungry && attentionPulse
                    ? 'cali-attention-gaze 3s ease-in-out forwards'
                    : `companion-eye-drift ${state === 'erschoepft' ? 18 : state === 'angespannt' ? 8 : 12}s ease-in-out infinite`,
                  animationDelay: isHungry && attentionPulse ? '0s' : '2s',
                }}>
                  <circle cx="35" cy={eyeExpression === 'heavy' ? 102.5 : 101.8}
                    r={
                      state === 'angespannt'
                        ? (eyeExpression === 'bright' ? 1 : 0.5)
                        : (eyeExpression === 'bright' ? 1.5 : eyeExpression === 'calm' ? 1.2 : eyeExpression === 'soft' ? 1 : eyeExpression === 'dim' ? 0.9 : 0.6)
                    }
                    fill={palette.dark}
                    opacity={eyeExpression === 'heavy' ? 0.4 : 0.85}
                    style={{
                      transition: 'all 2s ease',
                      animation: `companion-pupil-shift ${state === 'angespannt' ? 4 : 8 + tension * 4}s ease-in-out infinite`,
                    }}
                  />
                </g>

                {/* Primary catchlight — enhanced by evolution stage + day phase */}
                <circle cx="33.2" cy={eyeExpression === 'heavy' ? 101.5 : 100}
                  r={eyeExpression === 'bright' ? 1.2 + stageEyeBoost * 0.5 : eyeExpression === 'heavy' ? 0.4 : 0.85 + stageEyeBoost * 0.3}
                  fill="white"
                  opacity={Math.min(1, (eyeExpression === 'heavy' ? 0.2 : eyeExpression === 'dim' ? 0.5 : 0.92) + stageEyeBoost * 0.1) * (currentPhase === 'night' ? 0.6 : currentPhase === 'morning' ? 1.1 : 1)}
                  style={{ transition: 'all 2s ease' }}
                />
                {/* Secondary catchlight */}
                {eyeExpression !== 'heavy' && (
                  <circle cx="36.5" cy={101.2}
                    r={eyeExpression === 'bright' ? 0.55 : 0.35}
                    fill="white"
                    opacity={eyeExpression === 'dim' ? 0.25 : 0.6}
                    style={{ transition: 'all 2s ease' }}
                  />
                )}

                {/* Eye glow */}
                <circle cx="35" cy="101.8"
                  r={eyeExpression === 'bright' ? 8 : 5}
                  fill={palette.glow}
                  opacity={eyeExpression === 'bright' ? 0.12 : eyeExpression === 'heavy' ? 0 : 0.05}
                  filter={`url(#${uid}-glow)`}
                  style={{
                    animation: `companion-glow ${breathCycle * 1.2}s ease-in-out infinite`,
                    transition: 'opacity 2s ease',
                  }}
                />

                {/* Upper eyelid — droops when tired */}
                {(eyeExpression === 'heavy' || eyeExpression === 'dim') && (
                  <path
                    d={eyeExpression === 'heavy'
                      ? "M 31,101.5 C 33,100 37,100 39,101.5"
                      : "M 31,100 C 33,99 37,99 39,100"
                    }
                    stroke={palette.dark} strokeWidth={eyeExpression === 'heavy' ? 1.6 : 1}
                    fill="none" opacity={eyeExpression === 'heavy' ? 0.5 : 0.25}
                    style={{ transition: 'all 2s ease' }}
                  />
                )}

                {/* Smile squint — lower lid pushes up when happy */}
                {(state === 'vital' || (state === 'erholt' && posture > 0.7)) && (
                  <path
                    d="M 31.5,104 C 33,105.5 37,105.5 38.5,104"
                    stroke={palette.dark} strokeWidth="0.9" fill="none"
                    opacity={state === 'vital' ? 0.4 : 0.25}
                    style={{ transition: 'all 2s ease' }}
                  />
                )}

                {/* Lower eyelid line */}
                {!(state === 'vital' || (state === 'erholt' && posture > 0.7)) && (
                  <path
                    d={eyeExpression === 'heavy'
                      ? "M 32,103.5 C 34,104 36,104 38,103.5"
                      : "M 31,104.5 C 33,105.5 37,105.5 39,104.5"
                    }
                    stroke={palette.dark} strokeWidth="0.4" fill="none"
                    opacity={eyeExpression === 'heavy' ? 0.2 : 0.08}
                    style={{ transition: 'all 2s ease' }}
                  />
                )}
              </g>

              {/* ═══ TEAR DROP — when deeply exhausted ═══ */}
              {state === 'erschoepft' && vitality < 30 && (
                <ellipse cx="33" cy="106" rx="0.6" ry="0.9"
                  fill="hsl(210, 60%, 75%)"
                  opacity={0.4}
                  style={{
                    animation: `companion-tear-fall ${5 + Math.random() * 3}s ease-in infinite`,
                    animationDelay: `${2 + Math.random() * 4}s`,
                  }}
                />
              )}

              {/* ═══ MOUTH — clearly visible, BELOW snout ═══ */}
              <g>
                {/* Main mouth line — thick, dark, unmissable */}
                <path
                  d={
                    state === 'vital'
                      ? "M 22,116 C 25,120 30,121 34,117"
                      : state === 'erholt' && posture > 0.7
                      ? "M 23,116 C 26,119.5 31,120 35,116.5"
                      : posture > 0.6
                      ? "M 23,116.5 C 26,119 31,119 35,116.8"
                      : posture > 0.4
                      ? "M 24,117 C 27,118 31,118 34,117"
                      : state === 'erschoepft'
                      ? "M 23,118 C 26,116 30,115.5 33,118"
                      : state === 'angespannt'
                      ? "M 24,117 C 27,116.3 30,116.3 33,117"
                      : "M 24,117 C 27,116.5 31,116.5 34,117.5"
                  }
                  stroke={palette.dark} strokeWidth="1.8" fill="none"
                  strokeLinecap="round"
                  opacity={0.75}
                  style={{ transition: 'all 3s cubic-bezier(0.22, 1, 0.36, 1)' }}
                />

                {/* Filled smile shape for vital — like a real grin */}
                {state === 'vital' && (
                  <path
                    d="M 22,116 C 25,120 30,121 34,117 C 30,119 25,119 22,116 Z"
                    fill={palette.dark} opacity={0.15}
                    style={{ transition: 'all 3s ease' }}
                  />
                )}

                {/* Smile uptick corners */}
                {(state === 'vital' || (state === 'erholt' && posture > 0.7)) && (
                  <>
                    <path d="M 34,117 C 35.2,115.8 35.5,115 35,114.5"
                      stroke={palette.dark} strokeWidth="1" strokeLinecap="round" fill="none" opacity={0.45}
                      style={{ transition: 'all 3s ease' }}
                    />
                    <path d="M 22,116 C 21,115 20.5,114.2 21,113.5"
                      stroke={palette.dark} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity={0.3}
                      style={{ transition: 'all 3s ease' }}
                    />
                  </>
                )}

                {/* Teeth line on big smile */}
                {state === 'vital' && posture > 0.8 && (
                  <path d="M 24,118 C 26,119.5 30,120 33,118"
                    stroke="white" strokeWidth="0.6" fill="none" opacity={0.2}
                    style={{ transition: 'all 3s ease' }}
                  />
                )}

                {/* Frown corners when exhausted */}
                {state === 'erschoepft' && (
                  <>
                    <path d="M 23,118 C 22,119 21.5,119.8 21.8,120.5"
                      stroke={palette.dark} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity={0.4}
                      style={{ transition: 'all 3s ease' }}
                    />
                    <path d="M 33,118 C 33.8,119 34,119.8 33.8,120.5"
                      stroke={palette.dark} strokeWidth="0.7" strokeLinecap="round" fill="none" opacity={0.3}
                      style={{ transition: 'all 3s ease' }}
                    />
                  </>
                )}

                {/* Tight pressed lips when tense */}
                {state === 'angespannt' && tension > 0.5 && (
                  <path d="M 24,117.5 C 27,117 30,117 33,117.5"
                    stroke={palette.dark} strokeWidth="0.5" fill="none" opacity={0.25}
                    style={{ transition: 'all 2s ease' }}
                  />
                )}

                {/* Yawn when exhausted */}
                {state === 'erschoepft' && vitality < 35 && (
                  <ellipse cx="28" cy="117.5" rx="3.5" ry="2"
                    fill={palette.dark} opacity={0}
                    style={{
                      transformOrigin: '28px 117.5px',
                      animation: `companion-yawn ${12 + Math.random() * 6}s ease-in-out infinite`,
                      animationDelay: `${5 + Math.random() * 5}s`,
                    }}
                  />
                )}
              </g>

              {/* ═══ DIMPLES — visible on smile ═══ */}
              {(state === 'vital' || (state === 'erholt' && posture > 0.7)) && (
                <>
                  <circle cx="21" cy="111" r="0.6"
                    fill={palette.dark} opacity={state === 'vital' ? 0.15 : 0.08}
                    style={{ transition: 'all 3s ease' }}
                  />
                  <circle cx="35.5" cy="111.5" r="0.5"
                    fill={palette.dark} opacity={state === 'vital' ? 0.12 : 0.06}
                    style={{ transition: 'all 3s ease' }}
                  />
                </>
              )}
            </g>

            {/* Front legs — state-driven stretch */}
            <g style={{
              transformOrigin: '78px 152px',
              transform: `scaleY(${legStretch.scaleY})`,
              transition: 'transform 3s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <path d="M 78,140 C 81,140 85,148 85,158 C 85,163 81,165 78,165 C 75,165 71,163 71,158 C 71,148 75,140 78,140 Z" fill={palette.mid} />
              <ellipse cx="78" cy="164" rx="5" ry="2" fill={palette.dark} opacity={0.4} />
            </g>
            <g style={{
              transformOrigin: '120px 152px',
              transform: `scaleY(${legStretch.scaleY})`,
              transition: 'transform 3s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <path d="M 120,140 C 123,140 127,148 127,158 C 127,163 123,165 120,165 C 117,165 113,163 113,158 C 113,148 117,140 120,140 Z" fill={palette.mid} />
              <ellipse cx="120" cy="164" rx="5" ry="2" fill={palette.dark} opacity={0.4} />
            </g>

            {/* ═══ SHELL DOME — reactive to state ═══ */}
            <g style={{
              transformOrigin: '100px 102px',
              transform: shellScale,
              animation: shellBreathAnim,
              transition: 'transform 3s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <path
                d="M 60,140 C 57,133 55,118 60,103 C 65,88 78,72 100,65 C 122,72 135,88 140,103 C 145,118 143,133 140,140 Z"
                fill={`url(#${uid}-shell-grad)`}
                stroke={palette.primary}
                strokeWidth={0.6 + stageShellRichness * 0.3}
                strokeOpacity={0.15 + shellIntegrity * 0.2 + tierGlowBoost + stageShellRichness * 0.08}
              />
              {/* Shell inner line */}
              <path
                d="M 62,138 C 59,130 57,116 62,103 C 67,89 79,74 100,67 C 121,74 133,89 138,103 C 143,116 141,130 138,138"
                fill="none" stroke={palette.glow} strokeWidth={0.4}
                strokeOpacity={0.06 + coreGlow * 0.15 + tierGlowBoost}
                style={{ animation: `companion-glow ${breathCycle * 1.3}s ease-in-out infinite` }}
              />

              {/* Shell shimmer — premium light sweep across dome */}
              {!compact && (
                <path
                  d="M 75,85 C 80,78 95,70 100,68 C 105,70 110,74 115,82 L 105,100 Z"
                  fill="white"
                  style={{
                    animation: `companion-shell-shimmer ${12 + (1 - coreGlow) * 8}s ease-in-out infinite`,
                    animationDelay: '2s',
                  }}
                />
              )}

              {/* Scutes — pillar energy zones */}
              <path d="M 92,75 C 96,72 104,72 108,75 C 114,82 116,95 114,105 C 110,108 90,108 86,105 C 84,95 86,82 92,75 Z"
                fill={pillarColors.bewegung} stroke={palette.primary} strokeWidth={0.5}
                strokeOpacity={0.12 + pillarIntensity.bewegung * 0.18}
                style={{ transition: 'all 2s cubic-bezier(0.22, 1, 0.36, 1)' }}
              />
              <path d="M 68,108 C 64,100 64,88 70,80 C 76,76 88,74 92,76 C 86,83 84,96 86,106 C 82,108 72,110 68,108 Z"
                fill={pillarColors.ernaehrung} stroke={palette.primary} strokeWidth={0.5}
                strokeOpacity={0.12 + pillarIntensity.ernaehrung * 0.18}
                style={{ transition: 'all 2s cubic-bezier(0.22, 1, 0.36, 1)' }}
              />
              <path d="M 132,108 C 136,100 136,88 130,80 C 124,76 112,74 108,76 C 114,83 116,96 114,106 C 118,108 128,110 132,108 Z"
                fill={pillarColors.regeneration} stroke={palette.primary} strokeWidth={0.5}
                strokeOpacity={0.12 + pillarIntensity.regeneration * 0.18}
                style={{ transition: 'all 2s cubic-bezier(0.22, 1, 0.36, 1)' }}
              />
              <path d="M 72,112 C 72,108 86,106 100,106 C 114,106 128,108 128,112 C 130,120 128,132 125,136 C 115,140 85,140 75,136 C 72,132 70,120 72,112 Z"
                fill={pillarColors.mental} stroke={palette.primary} strokeWidth={0.5}
                strokeOpacity={0.12 + pillarIntensity.mental * 0.18}
                style={{ transition: 'all 2s cubic-bezier(0.22, 1, 0.36, 1)' }}
              />

              {/* Dividers */}
              <path d="M 100,68 L 100,140" stroke={palette.dark} strokeWidth="0.5" opacity={0.12} />
              <path d="M 68,110 C 80,105 120,105 132,110" stroke={palette.dark} strokeWidth="0.5" opacity={0.1} />

              {/* Inner light — Cali glows from within */}
              <path
                d="M 65,138 C 62,130 60,116 65,103 C 70,89 82,74 100,67 C 118,74 130,89 135,103 C 140,116 138,130 135,138 Z"
                fill={`url(#${uid}-inner-light)`}
                style={{
                  animation: `companion-inner-light ${breathCycle * 1.4}s ease-in-out infinite`,
                  pointerEvents: 'none',
                }}
              />

              {/* Specular dome highlight — glossy premium reflection */}
              <path
                d="M 78,82 C 85,74 95,70 100,68 C 105,70 112,73 118,80 L 108,95 C 102,90 92,88 86,92 Z"
                fill={`url(#${uid}-specular)`}
                style={{
                  animation: `companion-specular-shift ${breathCycle * 1.6}s ease-in-out infinite`,
                  pointerEvents: 'none',
                }}
              />

              {/* Shell highlights */}
              <path d="M 82,80 C 88,75 96,73 102,74 C 98,78 90,82 84,84 Z" fill="white" opacity={0.03 + coreGlow * 0.08 + tierGlowBoost * 0.3} />
              <path d="M 88,85 C 92,82 98,81 103,82 C 100,85 94,87 90,88 Z" fill="white" opacity={0.02 + coreGlow * 0.04}
                style={{ animation: `companion-highlight-sweep ${breathCycle * 2}s ease-in-out infinite` }}
              />
            </g>

            {/* ═══ CORE ENERGY SYSTEM — emotionally reactive ═══ */}
            {/* Outer energy field */}
            <circle cx="100" cy="100" r={16 * (0.5 + coreGlow * 0.5)}
              fill={palette.primary} opacity={coreOpacity * 0.4}
              filter={`url(#${uid}-heartbeat)`}
              style={{ animation: coreAnimation }}
            />
            {/* Mid energy ring */}
            <circle cx="100" cy="100" r={8 * (0.7 + coreGlow * 0.4)}
              fill={palette.glow} opacity={coreOpacity}
              filter={`url(#${uid}-glow)`}
              style={{ animation: coreAnimation }}
            />
            {/* Core point */}
            <circle cx="100" cy="100"
              r={state === 'erschoepft' ? 0.8 : 1.5 + coreGlow}
              fill={palette.glow}
              opacity={state === 'erschoepft' ? 0.1 + coreGlow * 0.2 : 0.3 + coreGlow * 0.5}
              style={{ transition: 'all 2s ease' }}
            />
          </g>

          {/* ═══ AMBIENT PARTICLES — emotionally reactive ═══ */}
          {!compact && vitality > 15 && [0, 1, 2, 3].map(i => {
            if (i >= 3 && vitality < 60) return null;
            const angle = (i * 90 + 30) * (Math.PI / 180);
            const pr = 80 + i * 5;
            return (
              <circle key={i}
                cx={100 + pr * Math.cos(angle)}
                cy={108 + pr * Math.sin(angle) * 0.55}
                r={state === 'erschoepft' ? 0.5 : 0.8 + coreGlow * 0.5}
                fill={palette.glow}
                opacity={state === 'erschoepft' ? 0.03 : 0.06 + (vitality / 100) * 0.2}
                style={{
                  animation: `${particleAnimation} ${state === 'angespannt' ? 2 + i * 0.6 : 4 + i * 1.8}s ease-in-out infinite`,
                  animationDelay: `${i * 1}s`,
                }}
              />
            );
          })}

          {/* ═══ CELEBRATION SPARKLES — for celebrating mood ═══ */}
          {!compact && mood === 'celebrating' && [0, 1, 2, 3, 4, 5].map(i => {
            const angle = (i * 60 + 15) * (Math.PI / 180);
            const sx = Math.cos(angle) * 35;
            const sy = Math.sin(angle) * 35;
            return (
              <circle key={`sparkle-${i}`}
                cx="100" cy="100"
                r={1 + Math.random()}
                fill={palette.glow}
                style={{
                  '--spark-x': `${sx}px`,
                  '--spark-y': `${sy - 15}px`,
                  '--spark-x2': `${sx * 1.5}px`,
                  '--spark-y2': `${sy * 1.5 - 25}px`,
                  animation: `companion-sparkle ${1.5 + Math.random()}s ease-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                } as React.CSSProperties}
              />
            );
          })}

          {/* ═══ STREAK EXPRESSION — elegant arc/ring system ═══ */}
          {!compact && currentStreakTier !== 'none' && (() => {
            const streakRadius = 92;
            const streakOpacity = currentStreakTier === 'crown' ? 0.35 : currentStreakTier === 'pulse' ? 0.25 : currentStreakTier === 'golden' ? 0.18 : 0.1;
            const streakColor = currentStreakTier === 'crown' || currentStreakTier === 'pulse' || currentStreakTier === 'golden'
              ? 'hsl(45, 85%, 55%)' : palette.glow;
            const arcLength = currentStreakTier === 'crown' ? 0.95 : currentStreakTier === 'pulse' ? 0.75 : currentStreakTier === 'golden' ? 0.5 : 0.3;
            const circumference = 2 * Math.PI * streakRadius;
            return (
              <g>
                {/* Streak arc */}
                <circle
                  cx="100" cy="110" r={streakRadius}
                  fill="none"
                  stroke={streakColor}
                  strokeWidth={currentStreakTier === 'crown' ? 1.5 : 1}
                  strokeOpacity={streakOpacity}
                  strokeLinecap="round"
                  strokeDasharray={`${circumference * arcLength} ${circumference * (1 - arcLength)}`}
                  style={{
                    transformOrigin: '100px 110px',
                    transform: 'rotate(-90deg)',
                    animation: currentStreakTier === 'pulse' || currentStreakTier === 'crown'
                      ? `cali-streak-pulse ${currentStreakTier === 'crown' ? 3 : 4}s ease-in-out infinite`
                      : undefined,
                    transition: 'all 2s ease',
                  }}
                />
                {/* Crown element for streak 30+ */}
                {currentStreakTier === 'crown' && (
                  <g style={{ animation: 'cali-crown-shimmer 4s ease-in-out infinite' }}>
                    {[0, 1, 2].map(i => {
                      const angle = (-90 + (i - 1) * 25) * (Math.PI / 180);
                      const cx = 100 + Math.cos(angle) * (streakRadius + 6);
                      const cy = 110 + Math.sin(angle) * (streakRadius + 6);
                      return (
                        <circle key={`crown-${i}`}
                          cx={cx} cy={cy} r={1.5}
                          fill="hsl(45, 90%, 60%)"
                          opacity={0.5}
                          style={{ filter: `url(#${uid}-mote)` }}
                        />
                      );
                    })}
                  </g>
                )}
              </g>
            );
          })()}

          {/* ═══ ATTENTION HUNGER — subtle waiting cues ═══ */}
          {!compact && isHungry && (
            <g>
              {/* Floating question mark particle — elegant, not intrusive */}
              <text
                x="115" y="60"
                fontSize="8"
                fill={palette.glow}
                opacity={0}
                style={{
                  animation: 'cali-question-float 6s ease-in-out infinite',
                  animationDelay: '2s',
                }}
              >
                ?
              </text>
              {/* Dimmer aura overlay when attention-hungry */}
              <circle
                cx="100" cy="110" r="80"
                fill="none"
                stroke={palette.primary}
                strokeWidth="0.5"
                strokeOpacity={0.06}
                style={{
                  animation: 'cali-waiting-ring 5s ease-in-out infinite',
                }}
              />
            </g>
          )}

          {/* ═══ PILLAR NEED VISUAL CUES ═══ */}
          {!compact && currentNeed === 'regeneration' && (
            <g>
              {/* Subtle yawning/slow-blink indicator — extra sleep particles */}
              <text x="55" y="88" fontSize="5" fill={palette.glow} opacity={0}
                style={{ animation: 'cali-need-particle 8s ease-in-out infinite', animationDelay: '1s' }}>
                z
              </text>
              <text x="48" y="80" fontSize="4" fill={palette.glow} opacity={0}
                style={{ animation: 'cali-need-particle 8s ease-in-out infinite', animationDelay: '3s' }}>
                z
              </text>
            </g>
          )}
          {!compact && currentNeed === 'mental' && (
            <g>
              {/* Clouded/foggy aura overlay */}
              <circle cx="100" cy="105" r="55"
                fill={palette.primary} opacity={0}
                filter={`url(#${uid}-sanctuary)`}
                style={{ animation: 'cali-fog-pulse 6s ease-in-out infinite' }}
              />
            </g>
          )}

          {/* ═══ MASTERY/RADIANCE GOLDEN AURA ═══ */}
          {!compact && (evolutionStage?.stage === 'mastery' || evolutionStage?.stage === 'radiance') && (
            <ellipse
              cx="100" cy="115" rx={evolutionStage.stage === 'radiance' ? 95 : 88} ry={evolutionStage.stage === 'radiance' ? 80 : 72}
              fill="none"
              stroke="hsl(45, 85%, 55%)"
              strokeWidth={evolutionStage.stage === 'radiance' ? 1.2 : 0.8}
              strokeOpacity={evolutionStage.stage === 'radiance' ? 0.18 : 0.1}
              style={{
                animation: `cali-golden-aura ${evolutionStage.stage === 'radiance' ? 3.5 : 4.5}s ease-in-out infinite`,
              }}
            />
          )}
          </g>
        </svg>
      </div>

      {/* Tap interaction panel */}
      {interactive && (
        <CompanionStatePanel
          companion={companionState}
          open={showPanel}
          onClose={() => setShowPanel(false)}
        />
      )}
    </>
  );
}
