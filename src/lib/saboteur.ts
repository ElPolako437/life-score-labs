import type { Hurdle, BaselineData } from '@/contexts/ResetContext';

export type SaboteurKey = 'hunger' | 'sleep' | 'stress' | 'protein' | 'movement' | 'chaos';

export type KipptTime = 'morning' | 'afternoon' | 'evening';
export type EnergyLevel = 'high' | 'mid' | 'low';

export interface SaboteurInputs {
  hurdle: Hurdle | null;
  baseline: BaselineData | null;
  sleepIssue: boolean;     // a real sleep screw was found on day 4
  struggleDays: number;    // count of difficult/failed days so far
  kippt: KipptTime | null;
  energy: EnergyLevel | null;
}

export const SABOTEURS: Record<SaboteurKey, { label: string; counter: string }> = {
  hunger: {
    label: 'Heißhunger am Abend',
    counter: 'Iss heute 30 g Protein vor 11 Uhr. Ein satter Vormittag nimmt dem Abend fast immer die Wucht.',
  },
  sleep: {
    label: 'Schlafmangel',
    counter: 'Setz heute deine Schlaf-Stellschraube von gestern konsequent um. Müdigkeit treibt fast jeden Heißhunger.',
  },
  stress: {
    label: 'Stress',
    counter: '3× heute 2 Minuten bewusst atmen — jeweils vor dem Essen. Ein ruhigeres System trifft bessere Entscheidungen.',
  },
  protein: {
    label: 'Zu wenig Protein tagsüber',
    counter: 'In die nächsten 2 Mahlzeiten je eine Handfläche Protein. Das stoppt den Nachmittags-Crash, bevor er kommt.',
  },
  movement: {
    label: 'Zu wenig Bewegung',
    counter: 'Ein 15-Min-Spaziergang nach der größten Mahlzeit — senkt Blutzucker und Heißhunger zugleich.',
  },
  chaos: {
    label: 'Fehlende Struktur',
    counter: 'Leg jetzt 3 Ankerpunkte für heute fest: Essen, Bewegung, Schlafenszeit. Mehr nicht — das nimmt den Druck raus.',
  },
};

/** Score the six saboteurs from all available signals and pick the most likely. */
export function computeSaboteur(input: SaboteurInputs): SaboteurKey {
  const s: Record<SaboteurKey, number> = {
    hunger: 0, sleep: 0, stress: 0, protein: 0, movement: 0, chaos: 0,
  };

  // Stated hurdle
  switch (input.hurdle) {
    case 'stress': s.stress += 3; break;
    case 'time': s.chaos += 2; s.movement += 1; break;
    case 'nutrition': s.protein += 2; s.hunger += 1; break;
    case 'consistency': s.chaos += 3; break;
    case 'evening': s.hunger += 3; break;
  }

  // Weakest baseline dimensions (1–5, low = problem)
  if (input.baseline) {
    const b = input.baseline;
    if (b.eating <= 2) { s.hunger += 2; s.protein += 2; }
    if (b.sleep <= 2) s.sleep += 3;
    if (b.calm <= 2) s.stress += 2;
    if (b.energy <= 2) { s.protein += 1; s.sleep += 1; }
    if (b.body <= 2) s.movement += 2;
  }

  if (input.sleepIssue) s.sleep += 2;
  if (input.struggleDays >= 2) s.chaos += 1;

  // Today's quick answers
  if (input.kippt === 'afternoon') { s.hunger += 1; s.stress += 1; }
  if (input.kippt === 'evening') s.hunger += 2;
  if (input.kippt === 'morning') s.sleep += 1;
  if (input.energy === 'low') { s.sleep += 1; s.protein += 1; }

  const order: SaboteurKey[] = ['hunger', 'protein', 'sleep', 'stress', 'movement', 'chaos'];
  let best: SaboteurKey = 'protein';
  let bestScore = -1;
  for (const k of order) {
    if (s[k] > bestScore) { bestScore = s[k]; best = k; }
  }
  return best;
}
