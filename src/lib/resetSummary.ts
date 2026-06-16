import type { ResetState, BaselineData, ReflectionData } from '@/contexts/ResetContext';
import { SABOTEURS, type SaboteurKey } from '@/lib/saboteur';
import { LEVERS } from '@/lib/nutritionEngine';

export interface ResetSummary {
  workedLabel: string;
  workedLine: string;
  riskLabel: string;
  riskLine: string;
  nextStep: string;
}

const DIM_LABELS: Record<keyof BaselineData, string> = {
  energy: 'Energie',
  sleep: 'Schlafqualität',
  calm: 'Innere Ruhe',
  eating: 'Essverhalten',
  body: 'Körpergefühl',
};

const DIMS: (keyof BaselineData)[] = ['energy', 'sleep', 'calm', 'eating', 'body'];

/**
 * Build a personalized Tag-7 summary from everything the user logged:
 * what improved, the biggest remaining risk, and the natural next step.
 */
export function buildResetSummary(state: ResetState): ResetSummary {
  const { baseline, reflection, tools, profile } = state;

  // --- What worked: biggest baseline → reflection improvement ---------------
  let workedLabel = '7 Tage am Stück';
  let workedLine = 'Du hast den Reset durchgezogen — das schaffen die wenigsten. Dein Fundament steht.';
  if (baseline && reflection) {
    let bestDim: keyof BaselineData | null = null;
    let bestDiff = 0;
    for (const d of DIMS) {
      const diff = (reflection as ReflectionData)[d] - (baseline as BaselineData)[d];
      if (diff > bestDiff) { bestDiff = diff; bestDim = d; }
    }
    if (bestDim) {
      workedLabel = DIM_LABELS[bestDim];
      workedLine = `${DIM_LABELS[bestDim]} hat sich in 7 Tagen am deutlichsten verbessert (+${bestDiff}). Das zeigt, worauf dein Körper anspringt.`;
    }
  }

  // --- Biggest risk: the day-5 saboteur, else weakest reflection dim --------
  const saboteur = (tools?.day5 as { saboteur?: SaboteurKey } | undefined)?.saboteur;
  let riskLabel: string;
  let riskLine: string;
  if (saboteur) {
    riskLabel = SABOTEURS[saboteur].label;
    riskLine = `Das bleibt deine Schwachstelle, wenn der Reset-Effekt nachlässt. ${SABOTEURS[saboteur].counter}`;
  } else if (reflection) {
    let worstDim: keyof BaselineData = 'eating';
    let worstVal = 6;
    for (const d of DIMS) {
      const v = (reflection as ReflectionData)[d];
      if (v < worstVal) { worstVal = v; worstDim = d; }
    }
    riskLabel = DIM_LABELS[worstDim];
    riskLine = `${DIM_LABELS[worstDim]} ist noch instabil — genau hier fallen die meisten ohne Plan zurück.`;
  } else {
    riskLabel = 'Der Übergang';
    riskLine = 'Ohne Anschlussplan fallen die meisten innerhalb weniger Wochen in alte Muster zurück.';
  }

  // --- Next step: tie to the main lever / sprint ----------------------------
  const lever = profile ? LEVERS[profile.mainLever].label : 'deinen größten Hebel';
  const nextStep = `2 Wochen mit festem Fokus auf ${lever} — aufgebaut auf genau diesen Daten. Das ist der Caliness-Sprint.`;

  return { workedLabel, workedLine, riskLabel, riskLine, nextStep };
}
