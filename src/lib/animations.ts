// Premium animation constants for CALINESS App
// All animations use transform + opacity only for performance

export const ANIMATION_DURATIONS = {
  fast: 200,
  normal: 400,
  slow: 800,
  dramatic: 1200,
  celebration: 2000,
} as const;

export const EASINGS = {
  smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
  overshoot: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
} as const;

export const staggerDelay = (index: number, base = 100) => ({
  animation: `cardSlideUp 0.5s ${EASINGS.smooth} both`,
  animationDelay: `${base + index * 100}ms`,
});

export const pillarBarStyle = (score: number, index: number) => ({
  '--pillar-width': `${score}%`,
  background: score >= 70 ? 'hsl(var(--primary))' : score >= 40 ? 'hsl(45, 90%, 55%)' : 'hsl(0, 70%, 55%)',
  animation: `pillarFill 0.8s ${EASINGS.smooth} both`,
  animationDelay: `${400 + index * 100}ms`,
  boxShadow: score >= 70 ? '0 0 6px hsl(142 76% 46% / 0.4)' : 'none',
} as React.CSSProperties);

export const streakFlameSpeed = (streak: number) =>
  Math.max(1.2, 2 - Math.min(streak / 30, 0.8));
