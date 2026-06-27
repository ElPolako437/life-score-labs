import type { Goal, StartProfile } from '@/contexts/ResetContext';

export type DayType = 'office' | 'out' | 'free';

export interface MovementResult {
  stepTarget: number;
  walkMin: number;
  line: string;
}

const round500 = (n: number) => Math.round(n / 500) * 500;

/**
 * Movement minimum for today from everyday activity level, training, goal and
 * the type of day. Honest, realistic targets — not puristic step counts.
 */
export function computeMovement(
  profile: StartProfile | null,
  goal: Goal | null,
  dayType: DayType,
): MovementResult {
  const dailyBase: Record<string, number> = { sedentary: 6000, mixed: 8000, active: 10000 };
  let steps = profile ? dailyBase[profile.daily] ?? 8000 : 8000;

  if (profile) {
    const bump: Record<string, number> = { low: 0, moderate: 500, high: 1000 };
    steps += bump[profile.activity] ?? 0;
  }
  if (goal === 'fatloss') steps += 1500;

  // A desk day needs more deliberate movement; an out-and-about day already has some.
  const dayAdj: Record<DayType, number> = { office: 1000, out: -500, free: 0 };
  steps += dayAdj[dayType];

  steps = Math.min(13000, Math.max(6000, round500(steps)));
  const walkMin = goal === 'fatloss' ? 15 : 10;

  const line =
    dayType === 'office'
      ? 'An einem Bürotag zählt jeder bewusste Gang — der Spaziergang nach dem Essen ist dein wichtigster Hebel.'
      : dayType === 'out'
      ? 'Du bist heute ohnehin viel unterwegs — nutze das und häng einen Spaziergang nach der größten Mahlzeit an.'
      : 'Heute hast du Spielraum — leg den Spaziergang bewusst nach deine größte Mahlzeit.';

  return { stepTarget: steps, walkMin, line };
}

export interface MovementBlock {
  id: string;
  label: string;
  steps: number;
  icon: string;
}

/**
 * Everyday NEAT actions the user can stack toward today's step target.
 * Shows that the goal is reached through small, realistic moves — not the gym.
 */
export const MOVEMENT_BLOCKS: MovementBlock[] = [
  { id: 'walk_meal', label: 'Spaziergang nach dem Essen', steps: 1800, icon: '🍽️' },
  { id: 'evening', label: 'Abendrunde um den Block', steps: 2800, icon: '🌙' },
  { id: 'stairs', label: 'Treppe statt Aufzug', steps: 400, icon: '🪜' },
  { id: 'stop_early', label: 'Eine Station früher raus', steps: 1500, icon: '🚏' },
  { id: 'call_walk', label: 'Telefonat im Gehen', steps: 1200, icon: '📞' },
  { id: 'errands', label: 'Erledigung zu Fuß', steps: 2200, icon: '🛍️' },
  { id: 'breaks', label: 'Geh-Pausen im Alltag', steps: 900, icon: '⏱️' },
];
