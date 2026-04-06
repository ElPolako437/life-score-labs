// ═══════════════════════════════════════════════════════════════════════════
// BESTFORM CALCULATOR™ – Types & Calculation Logic (v3 – Goal Consistency Engine)
// ═══════════════════════════════════════════════════════════════════════════

export type Gender = "male" | "female";
export type Goal = "fat_loss" | "toning" | "muscle_gain" | "unsure";
export type TrainingType = "strength" | "cardio" | "both";
export type NutritionLevel = "none" | "rough" | "structured";

export interface BestformInputs {
  gender: Gender | null;
  age: number | null;
  height: number | null;
  currentWeight: number | null;
  targetWeight: number | null;
  goal: Goal | null;
  trainingDays: number | null;
  trainingType: TrainingType | null;
  sleepHours: number | null;
  wakesAtNight: boolean | null;
  nutrition: NutritionLevel | null;
}

export const initialBestformInputs: BestformInputs = {
  gender: null,
  age: null,
  height: null,
  currentWeight: null,
  targetWeight: null,
  goal: null,
  trainingDays: null,
  trainingType: null,
  sleepHours: null,
  wakesAtNight: null,
  nutrition: null,
};

export interface BestformResult {
  goal: Goal;
  originalGoal: Goal; // what user selected before override
  goalWasOverridden: boolean;
  goalOverrideMessage: string | null;
  rangeLabel: string;
  rangeWeeksMin: number;
  rangeWeeksMax: number;
  bottleneck: string;
  recommendations: string[];
  goalLabel: string;
  whyExplanation: string;
  biggestLever: string;
  sustainabilityNote: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// GUARDRAILS
// ═══════════════════════════════════════════════════════════════════════════

function getMinWeeksForDelta(deltaKg: number, currentWeight: number): number {
  const factor = currentWeight > 110 ? 0.85 : 1;

  if (deltaKg >= 15) return Math.round(16 * factor);
  if (deltaKg >= 12) return Math.round(16 * factor);
  if (deltaKg >= 8) return Math.round(12 * factor);
  if (deltaKg >= 6) return Math.round(10 * factor);
  if (deltaKg >= 4) return Math.round(8 * factor);
  return Math.round(6 * factor);
}

// ═══════════════════════════════════════════════════════════════════════════
// GOAL CONSISTENCY ENGINE
// ═══════════════════════════════════════════════════════════════════════════

interface GoalValidation {
  effectiveGoal: Goal;
  wasOverridden: boolean;
  overrideMessage: string | null;
}

function validateGoalConsistency(inputs: BestformInputs): GoalValidation {
  const goal = inputs.goal || "toning";
  const currentWeight = inputs.currentWeight ?? 80;
  const targetWeight = inputs.targetWeight;

  // RULE: Muscle gain + target weight < current weight = NOT muscle gain
  if (goal === "muscle_gain" && targetWeight !== null && targetWeight < currentWeight) {
    return {
      effectiveGoal: "toning",
      wasOverridden: true,
      overrideMessage:
        "Dein Zielgewicht liegt unter deinem aktuellen Gewicht. Muskelaufbau bedeutet in der Regel Gewichtserhalt oder leichter Anstieg. Wir berechnen deine Prognose stattdessen im Modus Straffung / Koerperkomposition.",
    };
  }

  return { effectiveGoal: goal, wasOverridden: false, overrideMessage: null };
}

// ═══════════════════════════════════════════════════════════════════════════
// DYNAMIC EXPLANATION TEXT (deterministic, no AI hallucination)
// ═══════════════════════════════════════════════════════════════════════════

function generateWhyExplanation(
  inputs: BestformInputs,
  bottleneck: string,
  goal: Goal
): string {
  const sleepHours = inputs.sleepHours ?? 7;
  const wakesAtNight = inputs.wakesAtNight ?? false;
  const nutrition = inputs.nutrition ?? "rough";
  const trainingDays = inputs.trainingDays ?? 3;

  const parts: string[] = [];

  if (goal === "fat_loss") {
    parts.push(
      "Deine Prognose basiert auf einer nachhaltigen Fettabbaurate von 0,5–0,6% deines Körpergewichts pro Woche – dem wissenschaftlich empfohlenen Bereich für dauerhaften Erfolg."
    );
  } else if (goal === "toning") {
    parts.push(
      "Körperstraffung ist ein Recomposition-Prozess: Muskelaufbau und Fettabbau gleichzeitig. Das braucht Geduld und Konsistenz."
    );
  } else if (goal === "muscle_gain") {
    parts.push(
      "Muskelaufbau ist ein langsamer biologischer Prozess. Natural sind 0,25–0,5 kg Muskelmasse pro Monat realistisch. Sichtbare Veränderungen brauchen mindestens 8–12 Wochen konsequentes Krafttraining."
    );
  } else {
    parts.push(
      "Ohne klar definiertes Ziel rechnen wir mit einer allgemeinen Körperverbesserung – ein Mix aus Straffung und Leistungssteigerung."
    );
  }

  if (sleepHours < 6 || wakesAtNight) {
    parts.push(
      `Dein Schlaf (${sleepHours}h${wakesAtNight ? ", mit nächtlichem Aufwachen" : ""}) verlängert die notwendige Zeit, weil Regeneration und Hungerregulation häufig schlechter sind. Wenn du 7–8h stabilisierst, verschiebt sich deine Prognose Richtung unterer Bereich.`
    );
  }

  if (nutrition === "none") {
    parts.push(
      "Ohne Ernährungsstruktur fehlt die wichtigste Stellschraube. Selbst grobes Tracking kann die Prognose deutlich verbessern."
    );
  }

  if (trainingDays <= 1) {
    parts.push(
      "Mit nur 0–1 Trainingstagen pro Woche fehlt der nötige Reiz für Veränderung. Ab 3 Tagen verbessert sich die Prognose spürbar."
    );
  }

  return parts.join(" ");
}

function generateBiggestLever(inputs: BestformInputs, bottleneck: string): string {
  const sleepHours = inputs.sleepHours ?? 7;
  const wakesAtNight = inputs.wakesAtNight ?? false;
  const nutrition = inputs.nutrition ?? "rough";
  const trainingDays = inputs.trainingDays ?? 3;

  if (sleepHours < 6 || wakesAtNight) {
    return "Schlafqualität verbessern: 7–8h durchgehender Schlaf ist der größte einzelne Hebel für schnellere Ergebnisse.";
  }
  if (nutrition === "none") {
    return "Ernährungsstruktur aufbauen: Bereits grobes Tracking und Proteinbewusstsein kann die Prognose um Wochen verkürzen.";
  }
  if (trainingDays <= 2) {
    return "Trainingsfrequenz erhöhen: Mindestens 3 Trainingstage pro Woche schaffen die Grundlage für sichtbare Veränderung.";
  }
  if (inputs.trainingType === "cardio") {
    return "Krafttraining integrieren: Muskulärer Reiz beschleunigt sowohl Fettabbau als auch Straffung deutlich.";
  }
  return "Konsistenz: Dein Setup ist solide – bleib 12+ Wochen konsequent dran, dann kommen die Ergebnisse.";
}

// ═══════════════════════════════════════════════════════════════════════════
// MUSCLE GAIN CALCULATION (independent of target weight)
// ═══════════════════════════════════════════════════════════════════════════

function calculateMuscleGainRange(inputs: BestformInputs): { min: number; max: number } {
  const trainingDays = inputs.trainingDays ?? 3;
  const trainingType = inputs.trainingType ?? "both";
  const sleepHours = inputs.sleepHours ?? 7;
  const nutrition = inputs.nutrition ?? "rough";
  const hasStrength = trainingType === "strength" || trainingType === "both";

  // Optimal conditions: strength ≥3 days, sleep ≥7, structured nutrition → ~0.5kg/month
  // Suboptimal: ≤2 training, poor sleep → ~0.25kg/month
  const isOptimal = hasStrength && trainingDays >= 3 && sleepHours >= 7 && nutrition === "structured";
  const isGood = hasStrength && trainingDays >= 3 && sleepHours >= 7;
  const isPoor = trainingDays <= 2 || sleepHours < 6;

  if (isOptimal) {
    // First visible definition: 8–12 weeks
    return { min: 8, max: 12 };
  } else if (isGood) {
    return { min: 10, max: 16 };
  } else if (isPoor) {
    // Significant muscle mass: 4–6 months range
    return { min: 16, max: 24 };
  } else {
    return { min: 12, max: 20 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CALCULATION (v3)
// ═══════════════════════════════════════════════════════════════════════════

export function calculateBestform(inputs: BestformInputs): BestformResult {
  const originalGoal = inputs.goal || "toning";

  // ── Goal Consistency Engine ──
  const validation = validateGoalConsistency(inputs);
  const goal = validation.effectiveGoal;

  const sleepHours = inputs.sleepHours ?? 7;
  const trainingDays = inputs.trainingDays ?? 3;
  const wakesAtNight = inputs.wakesAtNight ?? false;
  const nutrition = inputs.nutrition ?? "rough";
  const trainingType = inputs.trainingType ?? "both";
  const currentWeight = inputs.currentWeight ?? 80;
  const targetWeight = inputs.targetWeight;

  // Determine bottleneck
  let bottleneck = "Training";
  if (sleepHours < 6 || wakesAtNight) {
    bottleneck = "Schlaf & Regeneration";
  } else if (nutrition === "none") {
    bottleneck = "Ernährungsstruktur";
  } else if (trainingDays <= 1) {
    bottleneck = "Trainingsfrequenz";
  }

  const hasSlowdown = sleepHours < 6 || trainingDays <= 1 || wakesAtNight;
  const hasBoost =
    (trainingType === "strength" || trainingType === "both") &&
    trainingDays >= 4 &&
    sleepHours >= 7 &&
    nutrition === "structured";

  const goalLabels: Record<Goal, string> = {
    fat_loss: "Fett reduzieren",
    toning: "Straffer werden",
    muscle_gain: "Muskelaufbau",
    unsure: "Allgemeine Bestform",
  };

  let rangeMin: number;
  let rangeMax: number;
  let recommendations: string[] = [];

  switch (goal) {
    case "fat_loss": {
      const rateConservative = 0.005;
      const rateRealistic = 0.006;

      const deltaKg = targetWeight
        ? Math.max(currentWeight - targetWeight, 2)
        : currentWeight * 0.08;

      const weeklyLossConservative = currentWeight * rateConservative;
      const weeklyLossRealistic = currentWeight * rateRealistic;

      const weeksConservative = Math.ceil(deltaKg / weeklyLossConservative);
      const weeksRealistic = Math.ceil(deltaKg / weeklyLossRealistic);

      rangeMax = weeksConservative;
      rangeMin = weeksRealistic;

      if (hasSlowdown) {
        rangeMin = Math.round(rangeMin * 1.2);
        rangeMax = Math.round(rangeMax * 1.2);
      }
      if (hasBoost) {
        rangeMin = Math.round(rangeMin * 0.85);
        rangeMax = Math.round(rangeMax * 0.85);
      }

      // Guardrails
      const minWeeks = getMinWeeksForDelta(deltaKg, currentWeight);
      rangeMin = Math.max(rangeMin, minWeeks);
      rangeMax = Math.max(rangeMax, rangeMin + 2);

      // Hard cap: delta ≥15kg → never below 16 weeks
      if (deltaKg >= 15) {
        rangeMin = Math.max(rangeMin, 16);
        rangeMax = Math.max(rangeMax, rangeMin + 4);
      }

      rangeMin = Math.max(rangeMin, 4);
      rangeMax = Math.max(rangeMax, rangeMin + 2);

      recommendations = [
        "Moderates Kaloriendefizit (300–500 kcal) beibehalten – kein Crash-Diäting",
        "Krafttraining priorisieren, um Muskelmasse zu erhalten",
        "Proteinzufuhr auf 1,6–2,0 g/kg Körpergewicht erhöhen",
      ];
      break;
    }

    case "toning": {
      // If this was an overridden muscle_gain with lower target weight → recomposition
      const isRecomposition = validation.wasOverridden && originalGoal === "muscle_gain";

      if (isRecomposition) {
        // Recomposition mode: longer timelines
        if (hasSlowdown) {
          rangeMin = 16;
          rangeMax = 24;
        } else if (hasBoost) {
          rangeMin = 8;
          rangeMax = 14;
        } else {
          rangeMin = 12;
          rangeMax = 20;
        }
        recommendations = [
          "Fettverlust + Muskelaufbau gleichzeitig: moderates Defizit + Krafttraining",
          "Proteinzufuhr auf 1,8–2,2 g/kg für optimale Recomposition",
          "Geduld: Recomposition braucht mehr Zeit als reiner Fettabbau, liefert aber nachhaltigere Ergebnisse",
        ];
      } else {
        if (hasSlowdown) {
          rangeMin = 12;
          rangeMax = 16;
        } else if (hasBoost || (sleepHours >= 7 && trainingDays >= 3)) {
          rangeMin = 6;
          rangeMax = 10;
        } else {
          rangeMin = 8;
          rangeMax = 14;
        }
        recommendations = [
          "Krafttraining 3–4× pro Woche als Fundament",
          "Ausreichend Protein für Gewebestraffung",
          "Schlafqualität optimieren für Regeneration",
        ];
      }
      break;
    }

    case "muscle_gain": {
      // Muscle gain is NEVER based on target weight – purely on training/sleep/nutrition
      const muscleRange = calculateMuscleGainRange(inputs);
      rangeMin = muscleRange.min;
      rangeMax = muscleRange.max;

      if (hasSlowdown) {
        rangeMin = Math.round(rangeMin * 1.2);
        rangeMax = Math.round(rangeMax * 1.2);
      }

      recommendations = [
        "Progressive Überlastung im Training sicherstellen",
        "Leichter Kalorienüberschuss (200–400 kcal) einplanen",
        "Mindestens 7h Schlaf für optimale Muskelproteinsynthese",
      ];
      break;
    }

    default: {
      rangeMin = 8;
      rangeMax = 14;
      if (hasSlowdown) {
        rangeMin = 12;
        rangeMax = 18;
      }
      recommendations = [
        "Zuerst ein klares Ziel definieren (Fett, Straffung, Aufbau)",
        "Krafttraining als Basis für jede Körperveränderung",
        "Ernährungsstruktur schrittweise aufbauen",
      ];
      break;
    }
  }

  // Format range label
  let rangeLabel: string;
  if (rangeMax > 20) {
    const monthsMin = Math.round(rangeMin / 4);
    const monthsMax = Math.round(rangeMax / 4);
    rangeLabel = `${monthsMin}–${monthsMax} Monate`;
  } else {
    rangeLabel = `${rangeMin}–${rangeMax} Wochen`;
  }

  // Muscle gain specific labels
  if (goal === "muscle_gain") {
    rangeLabel = `${rangeMin}–${rangeMax} Wochen`;
    if (rangeMax > 16) {
      const monthsMin = Math.round(rangeMin / 4);
      const monthsMax = Math.round(rangeMax / 4);
      rangeLabel = `${monthsMin}–${monthsMax} Monate`;
    }
  }

  const whyExplanation = generateWhyExplanation(inputs, bottleneck, goal);
  const biggestLever = generateBiggestLever(inputs, bottleneck);

  // Use effective goal label, but show override info
  const displayGoalLabel = validation.wasOverridden
    ? "Straffung / Körperkomposition"
    : goalLabels[goal];

  return {
    goal,
    originalGoal,
    goalWasOverridden: validation.wasOverridden,
    goalOverrideMessage: validation.overrideMessage,
    rangeLabel,
    rangeWeeksMin: rangeMin,
    rangeWeeksMax: rangeMax,
    bottleneck,
    recommendations,
    goalLabel: displayGoalLabel,
    whyExplanation,
    biggestLever,
    sustainabilityNote:
      "Diese Prognose ist bewusst konservativ, damit du planbar Erfolg hast – ohne Jo-Jo-Effekt.",
  };
}
