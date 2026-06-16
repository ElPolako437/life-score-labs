export type SleepScrew = 'duration' | 'screen' | 'caffeine' | 'meal' | 'stress' | 'none';

export interface SleepOption {
  value: string;
  label: string;
  screw?: Exclude<SleepScrew, 'none'>;
  weight?: number;
}

export interface SleepQuestion {
  key: string;
  label: string;
  columns: number;
  options: SleepOption[];
}

export const SLEEP_QUESTIONS: SleepQuestion[] = [
  {
    key: 'duration',
    label: 'Wie viel schläfst du aktuell?',
    columns: 4,
    options: [
      { value: 'lt6', label: '<6h', screw: 'duration', weight: 3 },
      { value: '6_7', label: '6–7h', screw: 'duration', weight: 1 },
      { value: '7_8', label: '7–8h' },
      { value: 'gt8', label: '>8h' },
    ],
  },
  {
    key: 'screen',
    label: 'Bildschirm direkt vorm Schlafen?',
    columns: 3,
    options: [
      { value: 'often', label: 'Oft', screw: 'screen', weight: 3 },
      { value: 'sometimes', label: 'Manchmal', screw: 'screen', weight: 1 },
      { value: 'rarely', label: 'Selten' },
    ],
  },
  {
    key: 'caffeine',
    label: 'Koffein nach 14 Uhr?',
    columns: 2,
    options: [
      { value: 'yes', label: 'Ja', screw: 'caffeine', weight: 2 },
      { value: 'no', label: 'Nein' },
    ],
  },
  {
    key: 'meal',
    label: 'Wann isst du abends?',
    columns: 3,
    options: [
      { value: 'late', label: 'Kurz vorm Bett', screw: 'meal', weight: 3 },
      { value: 'mid', label: '2–3h vorher', screw: 'meal', weight: 1 },
      { value: 'early', label: 'Früh' },
    ],
  },
  {
    key: 'stress',
    label: 'Stresslevel am Abend?',
    columns: 3,
    options: [
      { value: 'high', label: 'Hoch', screw: 'stress', weight: 3 },
      { value: 'mid', label: 'Mittel', screw: 'stress', weight: 1 },
      { value: 'low', label: 'Niedrig' },
    ],
  },
];

export const SLEEP_SCREWS: Record<SleepScrew, { label: string; line: string }> = {
  duration: {
    label: 'Schlafdauer priorisieren',
    line: 'Geh heute 30 Minuten früher ins Bett — zur gleichen Zeit. Stell dir den Wecker zum Ins-Bett-Gehen, nicht zum Aufwachen.',
  },
  screen: {
    label: 'Bildschirm-Stopp vorm Bett',
    line: '60 Minuten vor dem Schlafen kein Bildschirm. Das ist bei dir der stärkste einzelne Hebel für tieferen Schlaf.',
  },
  caffeine: {
    label: 'Koffein-Fenster schließen',
    line: 'Kein Koffein nach 14 Uhr. Die Halbwertszeit liegt bei ~6 Stunden — abends ist es noch aktiv, auch wenn du es nicht merkst.',
  },
  meal: {
    label: 'Letzte Mahlzeit vorziehen',
    line: 'Iss heute mindestens 3 Stunden vor dem Schlafen. Dein Körper soll nachts regenerieren, nicht verdauen.',
  },
  stress: {
    label: 'Abend-Routine zum Runterfahren',
    line: 'Bau heute 60 Minuten Puffer vorm Bett ein — Tee, Lesen, Spaziergang. Du kannst nicht von 100 auf Schlaf schalten.',
  },
  none: {
    label: 'Deine Basis steht',
    line: 'Dein Schlaf-Fundament ist solide. Halte heute einfach deine feste Schlafenszeit — Konstanz schlägt Optimierung.',
  },
};

/** Pick the single biggest sleep lever from the answers. */
export function computeSleepScrew(answers: Record<string, string>): SleepScrew {
  const score: Record<string, number> = {};
  for (const q of SLEEP_QUESTIONS) {
    const opt = q.options.find(o => o.value === answers[q.key]);
    if (opt?.screw && opt.weight) score[opt.screw] = (score[opt.screw] ?? 0) + opt.weight;
  }
  // Tie-break by question order (duration first).
  const order: SleepScrew[] = ['duration', 'screen', 'caffeine', 'meal', 'stress'];
  let best: SleepScrew = 'none';
  let bestScore = 0;
  for (const k of order) {
    if ((score[k] ?? 0) > bestScore) {
      bestScore = score[k];
      best = k;
    }
  }
  return best;
}
