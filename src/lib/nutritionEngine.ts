import type {
  Sex, Goal, Hurdle, Activity, Daily, LeverKey, StartProfile, BaselineData,
} from '@/contexts/ResetContext';

/**
 * Tag-1 nutrition engine.
 * Computes a serious, range-based start profile (calories, protein, meals, lever)
 * from minimal body inputs. Ranges, not single numbers — no false precision,
 * no medical claims. Orientation only.
 */

export interface BodyInputs {
  sex: Sex;
  age: number;
  height: number; // cm
  weight: number; // kg
  activity: Activity;
  daily: Daily;
}

// --- Calorie / protein math -------------------------------------------------

/** Mifflin-St Jeor basal metabolic rate. */
export function mifflinBMR(sex: Sex, age: number, height: number, weight: number): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(base + (sex === 'male' ? 5 : -161));
}

/** Physical activity level from everyday movement + training frequency. */
export function palFor(activity: Activity, daily: Daily): number {
  const dailyBase: Record<Daily, number> = { sedentary: 1.3, mixed: 1.45, active: 1.6 };
  const trainingBump: Record<Activity, number> = { low: 0, moderate: 0.1, high: 0.2 };
  return Math.min(1.8, Math.max(1.3, dailyBase[daily] + trainingBump[activity]));
}

// Protein per kg bodyweight by goal (general health ~1.2–1.6; higher end protects
// muscle in a deficit).
const PROTEIN_PER_KG: Record<Goal, [number, number]> = {
  fatloss: [1.8, 2.2],
  structure: [1.5, 1.9],
  energy: [1.5, 1.9],
  sleep: [1.4, 1.8],
};

// Calorie band as a fraction of TDEE by goal.
const CAL_BAND: Record<Goal, [number, number]> = {
  fatloss: [0.78, 0.85],   // moderate deficit
  energy: [0.95, 1.02],    // maintenance
  structure: [0.95, 1.02], // maintenance
  sleep: [0.95, 1.02],     // maintenance
};

const round = (n: number, step: number) => Math.round(n / step) * step;

// --- Main lever -------------------------------------------------------------

export const LEVERS: Record<LeverKey, { label: string; line: string }> = {
  protein: {
    label: 'Protein-Konstanz',
    line: 'Genug Protein, gleichmäßig über den Tag — das stabilisiert Hunger, Energie und schützt Muskeln.',
  },
  meals: {
    label: 'Mahlzeiten-Struktur',
    line: 'Klare Mahlzeiten statt Dauer-Snacking geben deinem Tag und deinem Blutzucker einen Rahmen.',
  },
  movement: {
    label: 'Tägliche Bewegung',
    line: 'Nicht Training, sondern Alltagsbewegung — kurze Spaziergänge nach dem Essen wirken überraschend stark.',
  },
  sleep: {
    label: 'Schlaf-Rhythmus',
    line: 'Eine feste Schlafenszeit ist der stärkste Einzelhebel für Energie und Appetit.',
  },
  stress: {
    label: 'Innere Ruhe',
    line: 'Weniger Reize tagsüber entlasten dein Nervensystem — die Basis, auf der alles andere erst funktioniert.',
  },
  structure: {
    label: 'Tages-Struktur',
    line: 'Wenige feste Ankerpunkte nehmen Entscheidungen aus dem Tag und machen Dranbleiben leicht.',
  },
};

/**
 * Pick the biggest current lever from the weakest baseline dimension + the
 * stated hurdle. Deterministic scoring across the six levers.
 */
export function deriveMainLever(
  goal: Goal | null,
  hurdle: Hurdle | null,
  baseline: BaselineData | null,
): LeverKey {
  const score: Record<LeverKey, number> = {
    protein: 0, meals: 0, movement: 0, sleep: 0, stress: 0, structure: 0,
  };

  // Weakest baseline dimensions push their related lever.
  if (baseline) {
    const dimToLever: Record<keyof BaselineData, LeverKey> = {
      energy: 'protein',
      sleep: 'sleep',
      calm: 'stress',
      eating: 'meals',
      body: 'movement',
    };
    const entries = (Object.keys(dimToLever) as (keyof BaselineData)[])
      .map(k => ({ k, v: baseline[k] }))
      .sort((a, b) => a.v - b.v);
    // Lowest two dimensions get the most weight.
    if (entries[0]) score[dimToLever[entries[0].k]] += 3;
    if (entries[1]) score[dimToLever[entries[1].k]] += 1;
  }

  // The hurdle is the user's own stated blocker — weight it heavily.
  const hurdleToLever: Record<Hurdle, LeverKey> = {
    stress: 'stress',
    time: 'structure',
    nutrition: 'meals',
    consistency: 'structure',
    evening: 'meals',
  };
  if (hurdle) score[hurdleToLever[hurdle]] += 3;

  // Gentle nudge from the goal so the lever feels aligned with intent.
  const goalToLever: Partial<Record<Goal, LeverKey>> = {
    fatloss: 'protein',
    sleep: 'sleep',
  };
  if (goal && goalToLever[goal]) score[goalToLever[goal]!] += 1;

  return (Object.keys(score) as LeverKey[]).reduce((a, b) => (score[b] > score[a] ? b : a), 'protein');
}

// --- Profile builder --------------------------------------------------------

export function buildStartProfile(
  inputs: BodyInputs,
  goal: Goal | null,
  hurdle: Hurdle | null,
  baseline: BaselineData | null,
): StartProfile {
  const g: Goal = goal ?? 'energy';
  const bmr = mifflinBMR(inputs.sex, inputs.age, inputs.height, inputs.weight);
  const pal = palFor(inputs.activity, inputs.daily);
  const tdee = Math.round(bmr * pal);

  const [loFrac, hiFrac] = CAL_BAND[g];
  const calLow = round(tdee * loFrac, 50);
  const calHigh = round(tdee * hiFrac, 50);

  const [pLo, pHi] = PROTEIN_PER_KG[g];
  const proteinLow = round(inputs.weight * pLo, 5);
  const proteinHigh = round(inputs.weight * pHi, 5);

  return {
    ...inputs,
    bmr,
    tdee,
    calLow,
    calHigh,
    proteinLow,
    proteinHigh,
    mealCount: 3,
    mainLever: deriveMainLever(g, hurdle, baseline),
    createdAt: Date.now(),
  };
}

/** Protein per meal target, rounded to 5. */
export function proteinPerMeal(profile: StartProfile): number {
  return round(profile.proteinHigh / profile.mealCount, 5);
}
