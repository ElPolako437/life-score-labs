import type { PillarScores, DailyCheckIn } from '@/contexts/AppContext';

export type CompanionState = 'erschoepft' | 'angespannt' | 'stabil' | 'erholt' | 'vital';

export type EyeExpression = 'bright' | 'calm' | 'soft' | 'dim' | 'heavy';

export type EvolutionTier = 'seed' | 'sprout' | 'sapling' | 'guardian' | 'ancient';

export interface CompanionInfluence {
  factor: string;
  label: string;
  impact: 'positive' | 'neutral' | 'negative';
  value: number;
}

export type CompanionMood = 'happy' | 'celebrating' | 'concerned' | 'sleepy' | 'neutral';

// ═══ EVOLUTION STAGE SYSTEM ═══
export type EvolutionStage = 'seedling' | 'awakening' | 'momentum' | 'mastery' | 'radiance';

export interface EvolutionStageData {
  stage: EvolutionStage;
  stageName: string;
  scaleFactor: number;
  auraIntensity: number;
  moteCount: number;
  eyeBrightnessBoost: number;
  shellRichness: number;
}

const STAGE_CONFIG: Record<EvolutionStage, { name: string; scale: number; aura: number; motes: number; eyeBoost: number; shellRichness: number }> = {
  seedling:   { name: 'Seedling',   scale: 0.85, aura: 0.3, motes: 1, eyeBoost: 0,    shellRichness: 0.3 },
  awakening:  { name: 'Awakening',  scale: 1.0,  aura: 0.5, motes: 3, eyeBoost: 0.1,  shellRichness: 0.5 },
  momentum:   { name: 'Momentum',   scale: 1.05, aura: 0.7, motes: 5, eyeBoost: 0.2,  shellRichness: 0.7 },
  mastery:    { name: 'Mastery',    scale: 1.1,  aura: 0.85, motes: 7, eyeBoost: 0.3,  shellRichness: 0.85 },
  radiance:   { name: 'Radiance',   scale: 1.15, aura: 1.0, motes: 9, eyeBoost: 0.4,  shellRichness: 1.0 },
};

export function computeEvolutionStage(longevityScore: number, streak: number): EvolutionStageData {
  let stage: EvolutionStage = 'seedling';
  if (longevityScore >= 85 || streak >= 50) stage = 'radiance';
  else if (longevityScore >= 73 || streak >= 21) stage = 'mastery';
  else if (longevityScore >= 60 || streak >= 8) stage = 'momentum';
  else if (longevityScore >= 45 || streak >= 3) stage = 'awakening';
  const cfg = STAGE_CONFIG[stage];
  return {
    stage,
    stageName: cfg.name,
    scaleFactor: cfg.scale,
    auraIntensity: cfg.aura,
    moteCount: cfg.motes,
    eyeBrightnessBoost: cfg.eyeBoost,
    shellRichness: cfg.shellRichness,
  };
}

// ═══ TIME-OF-DAY PERSONALITY ═══
export type DayPhase = 'morning' | 'midday' | 'evening' | 'night';

export interface DayPhaseData {
  phase: DayPhase;
  brightnessModifier: number;
  warmthShift: number;
  energyModifier: number;
  breathCycleModifier: number;
}

export function computeDayPhase(): DayPhaseData {
  const h = new Date().getHours();
  if (h >= 6 && h < 11) return { phase: 'morning', brightnessModifier: 1.15, warmthShift: -0.05, energyModifier: 1.1, breathCycleModifier: 0.9 };
  if (h >= 11 && h < 17) return { phase: 'midday', brightnessModifier: 1.0, warmthShift: 0, energyModifier: 1.0, breathCycleModifier: 1.0 };
  if (h >= 17 && h < 21) return { phase: 'evening', brightnessModifier: 0.88, warmthShift: 0.12, energyModifier: 0.92, breathCycleModifier: 1.1 };
  return { phase: 'night', brightnessModifier: 0.7, warmthShift: 0.06, energyModifier: 0.78, breathCycleModifier: 1.3 };
}

// ═══ PILLAR NEEDS / MOOD HINTS ═══
export type PillarNeed = 'bewegung' | 'ernaehrung' | 'regeneration' | 'mental' | null;

export function computeWeakestPillar(pillarScores: PillarScores): PillarNeed {
  const entries = Object.entries(pillarScores) as [string, number][];
  const sorted = entries.sort((a, b) => a[1] - b[1]);
  // Only signal a need if the weakest is meaningfully behind (15+ below average)
  const avg = entries.reduce((s, e) => s + e[1], 0) / entries.length;
  if (sorted[0][1] < avg - 10) return sorted[0][0] as PillarNeed;
  return null;
}

// ═══ STREAK EXPRESSION ═══
export type StreakTier = 'none' | 'glow' | 'golden' | 'pulse' | 'crown';

export function computeStreakTier(streak: number): StreakTier {
  if (streak >= 30) return 'crown';
  if (streak >= 14) return 'pulse';
  if (streak >= 7) return 'golden';
  if (streak >= 3) return 'glow';
  return 'none';
}

// ═══ ATTENTION HUNGER ═══
export function computeAttentionHunger(hasCheckedInToday: boolean): boolean {
  return !hasCheckedInToday;
}

// ═══ "CALI SAYS" REFLECTION ═══
export function getCaliSays(
  state: CompanionState,
  stage: EvolutionStage,
  phase: DayPhase,
  streak: number,
  weakestPillar: PillarNeed,
  hasCheckedIn: boolean,
): string {
  // Priority: attention hunger > pillar need > streak celebration > time-of-day + state
  if (!hasCheckedIn) {
    const waiting: Record<DayPhase, string> = {
      morning: 'CALI wartet auf deinen Morgen-Check-in. Ein neuer Tag beginnt.',
      midday: 'Wie geht es dir heute? CALI wartet auf ein Zeichen.',
      evening: 'Der Tag neigt sich. Erzähl CALI, wie es war.',
      night: 'Ruhe dich aus. Morgen ist ein neuer Anfang.',
    };
    return waiting[phase];
  }

  if (weakestPillar) {
    const hints: Record<string, string> = {
      bewegung: 'CALI spürt, dass Bewegung heute gut tun würde.',
      ernaehrung: 'CALI merkt, dass Ernährung heute Aufmerksamkeit braucht.',
      regeneration: 'CALI fühlt, dass Regeneration jetzt Priorität hat.',
      mental: 'CALI spürt, dass dein Geist heute etwas Ruhe verdient.',
    };
    return hints[weakestPillar] || 'CALI fühlt sich ausgeglichen.';
  }

  if (streak >= 30) return 'CALI strahlt. Deine Konstanz ist außergewöhnlich.';
  if (streak >= 14) return 'CALI wächst mit dir. Dein Rhythmus ist stark.';
  if (streak >= 7) return 'CALI spürt deinen Fortschritt. Bleib dran.';

  const stateMsg: Record<CompanionState, string> = {
    vital: 'CALI strahlt Vitalität aus. Dein System ist in Balance.',
    erholt: 'CALI fühlt sich regeneriert und bereit.',
    stabil: 'CALI ist geerdet. Ein solider Tag.',
    angespannt: 'CALI spürt Anspannung. Nimm dir einen Moment.',
    erschoepft: 'CALI braucht Ruhe — genau wie du.',
  };
  return stateMsg[state];
}

export interface CompanionData {
  state: CompanionState;
  mood: CompanionMood;
  vitality: number;
  breathCycle: number;
  shellIntegrity: number;
  coreGlow: number;
  pillarIntensity: {
    bewegung: number;
    ernaehrung: number;
    regeneration: number;
    mental: number;
  };
  label: string;
  insight: string;
  posture: number;
  eyeExpression: EyeExpression;
  sanctuaryBrightness: number;
  tension: number;
  warmth: number;
  evolutionTier: EvolutionTier;
  evolutionProgress: number;
  evolutionScore: number;
  sanctuaryDepth: number;
  harmonyScore: number;
  resilience: number;
  influences: CompanionInfluence[];
  primaryInfluence: string;
  actionSuggestion: string;
  emotionalReflection: string;
  // Psychology layer additions
  evolutionStage: EvolutionStageData;
  dayPhase: DayPhaseData;
  weakestPillar: PillarNeed;
  streakTier: StreakTier;
  attentionHungry: boolean;
  caliSays: string;
}

const STATE_META: Record<CompanionState, { label: string; insight: string }> = {
  erschoepft: {
    label: 'Erschöpft',
    insight: 'Dein System braucht Erholung. Priorisiere Ruhe, Schlaf und Regeneration.',
  },
  angespannt: {
    label: 'Angespannt',
    insight: 'Dein System steht unter Spannung. Bewusste Pausen können den Druck lösen.',
  },
  stabil: {
    label: 'Stabil',
    insight: 'Dein System ist ausgeglichen und geerdet. Eine solide Basis für Fortschritt.',
  },
  erholt: {
    label: 'Erholt',
    insight: 'Dein System regeneriert sich gut. Du bist auf einem positiven Weg.',
  },
  vital: {
    label: 'Vital',
    insight: 'Dein System ist in einem starken, lebendigen Zustand. Halte diesen Rhythmus.',
  },
};

const EYE_MAP: Record<CompanionState, EyeExpression> = {
  erschoepft: 'heavy',
  angespannt: 'dim',
  stabil: 'calm',
  erholt: 'soft',
  vital: 'bright',
};

const TIER_META: Record<EvolutionTier, { label: string; description: string; icon: string; minVitality: number; milestone: string }> = {
  seed: { label: 'Samen', description: 'Am Anfang der Reise. Jeder Tag zählt.', icon: '🌱', minVitality: 0, milestone: '' },
  sprout: { label: 'Keim', description: 'Erste Routine entsteht. CALI erwacht.', icon: '🌿', minVitality: 25, milestone: 'Drei Tage Konsistenz. CALI beginnt, dich zu kennen.' },
  sapling: { label: 'Setzling', description: 'Gewohnheiten festigen sich. Fortschritt wird sichtbar.', icon: '🪴', minVitality: 45, milestone: 'Eine Woche echter Rhythmus. Das ist die Basis, auf der Langlebigkeit entsteht.' },
  guardian: { label: 'Wächter', description: 'Starke Konsistenz. CALI ist geerdet und vital.', icon: '🌳', minVitality: 65, milestone: 'Du bist über den Durchschnitt hinaus. Dein System hat Stabilität entwickelt.' },
  ancient: { label: 'Uralter', description: 'Meisterhafte Balance. CALI strahlt Weisheit aus.', icon: '✨', minVitality: 85, milestone: 'Meisterhafte Balance. Nur wenige Menschen kommen hierhin. CALI strahlt Weisheit aus.' },
};

export const EVOLUTION_TIERS: EvolutionTier[] = ['seed', 'sprout', 'sapling', 'guardian', 'ancient'];

export function getTierMeta(tier: EvolutionTier) {
  return TIER_META[tier];
}

export function getNextTier(tier: EvolutionTier): EvolutionTier | null {
  const idx = EVOLUTION_TIERS.indexOf(tier);
  return idx < EVOLUTION_TIERS.length - 1 ? EVOLUTION_TIERS[idx + 1] : null;
}

export function getEvoPointsToNextTier(tier: EvolutionTier, evoScore: number): number {
  const thresholds: Record<EvolutionTier, number> = { seed: 25, sprout: 45, sapling: 65, guardian: 85, ancient: 100 };
  return Math.max(0, thresholds[tier] - evoScore);
}

export function computeEvolution(
  vitality: number, streak: number, weeklyConsistency: number,
  totalCheckins: number, harmonyScore: number,
): { tier: EvolutionTier; progress: number; evoScore: number } {
  let evoScore = vitality * 0.6 + (weeklyConsistency / 100) * 25 + Math.min(streak / 30, 1) * 15;

  // Persistence bonus: 30+ days active
  if (totalCheckins >= 30) evoScore += 5;

  // Harmony bonus: balanced pillars
  if (harmonyScore > 0.8) evoScore += 8;

  evoScore = Math.min(100, evoScore);

  if (evoScore >= 85) return { tier: 'ancient', progress: Math.min(1, (evoScore - 85) / 15), evoScore };
  if (evoScore >= 65) return { tier: 'guardian', progress: (evoScore - 65) / 20, evoScore };
  if (evoScore >= 45) return { tier: 'sapling', progress: (evoScore - 45) / 20, evoScore };
  if (evoScore >= 25) return { tier: 'sprout', progress: (evoScore - 25) / 20, evoScore };
  return { tier: 'seed', progress: evoScore / 25, evoScore };
}

const PILLAR_LABELS: Record<string, string> = {
  bewegung: 'Bewegung',
  ernaehrung: 'Ernährung',
  regeneration: 'Regeneration',
  mental: 'Mentale Balance',
};

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function computeInfluences(
  pillarScores: PillarScores,
  todayCheckIn: DailyCheckIn | null,
  streak: number,
): CompanionInfluence[] {
  const influences: CompanionInfluence[] = [];
  const stress = todayCheckIn?.stress ?? 5;
  const energy = todayCheckIn?.energy ?? 5;
  const sleepHours = todayCheckIn?.sleepHours ?? 7;
  const recovery = todayCheckIn?.recovery ?? 5;

  influences.push({
    factor: 'sleep',
    label: sleepHours >= 7 ? `${sleepHours}h Schlaf – gute Grundlage` : `Nur ${sleepHours}h Schlaf`,
    impact: sleepHours >= 7 ? 'positive' : sleepHours >= 5.5 ? 'neutral' : 'negative',
    value: sleepHours,
  });

  influences.push({
    factor: 'stress',
    label: stress >= 7 ? 'Hohes Stresslevel' : stress <= 3 ? 'Niedriger Stress' : 'Moderater Stress',
    impact: stress <= 3 ? 'positive' : stress >= 7 ? 'negative' : 'neutral',
    value: stress,
  });

  influences.push({
    factor: 'recovery',
    label: recovery >= 7 ? 'Gute Recovery' : recovery <= 3 ? 'Geringe Recovery' : 'Moderate Recovery',
    impact: recovery >= 7 ? 'positive' : recovery <= 3 ? 'negative' : 'neutral',
    value: recovery,
  });

  influences.push({
    factor: 'energy',
    label: energy >= 7 ? 'Hohe Energie' : energy <= 3 ? 'Niedrige Energie' : 'Moderate Energie',
    impact: energy >= 7 ? 'positive' : energy <= 3 ? 'negative' : 'neutral',
    value: energy,
  });

  if (streak >= 5) {
    influences.push({ factor: 'streak', label: `${streak}-Tage-Serie`, impact: 'positive', value: streak });
  }

  const pillarEntries = Object.entries(pillarScores) as [string, number][];
  const weakest = pillarEntries.sort((a, b) => a[1] - b[1])[0];
  if (weakest[1] < 50) {
    influences.push({ factor: 'pillar', label: `${PILLAR_LABELS[weakest[0]]} ist schwach`, impact: 'negative', value: weakest[1] });
  }

  return influences.sort((a, b) => {
    const order = { negative: 0, neutral: 1, positive: 2 };
    return order[a.impact] - order[b.impact];
  });
}

function getActionSuggestion(state: CompanionState, influences: CompanionInfluence[]): string {
  const time = getTimeOfDay();
  const negatives = influences.filter(i => i.impact === 'negative');

  if (negatives.length === 0) {
    const actions = {
      morning: 'Starte den Tag mit einer bewussten Morgenroutine.',
      afternoon: 'Eine kurze Gehpause bringt neue Klarheit.',
      evening: 'Bereite dich auf einen erholsamen Abend vor.',
    };
    return actions[time];
  }

  const primary = negatives[0];
  const suggestions: Record<string, Record<string, string>> = {
    sleep: {
      morning: 'Plane heute Abend 30 Minuten früher ins Bett.',
      afternoon: 'Kein Koffein mehr ab jetzt für besseren Schlaf.',
      evening: 'Reduziere Bildschirmzeit und starte deine Abendroutine.',
    },
    stress: {
      morning: '2 Minuten bewusstes Atmen — ohne Bildschirm.',
      afternoon: 'Eine bewusste 5-Minuten-Pause senkt den Pegel.',
      evening: 'Lass den Tag ausklingen. Weniger Reize, mehr Ruhe.',
    },
    recovery: {
      morning: 'Starte sanft — dein Körper regeneriert noch.',
      afternoon: 'Leichte Bewegung statt hoher Intensität heute.',
      evening: 'Priorisiere Schlaf und Regeneration heute Abend.',
    },
    energy: {
      morning: 'Ein proteinreiches Frühstück hebt dein Energielevel.',
      afternoon: 'Frische Luft und Tageslicht geben neue Energie.',
      evening: 'Früh zur Ruhe kommen — morgen wird besser.',
    },
    pillar: {
      morning: 'Fokussiere dich heute auf dein schwächstes Feld.',
      afternoon: 'Ein kleiner Schritt in deiner schwächsten Säule zählt.',
      evening: 'Plane morgen einen Fokus auf deine schwächste Säule.',
    },
  };

  return suggestions[primary.factor]?.[time] || 'Ein kleiner bewusster Schritt reicht heute.';
}

function getEmotionalReflection(state: CompanionState, influences: CompanionInfluence[]): string {
  const negCount = influences.filter(i => i.impact === 'negative').length;
  const posCount = influences.filter(i => i.impact === 'positive').length;

  const reflections: Record<CompanionState, string[]> = {
    erschoepft: [
      'CALI spürt die Erschöpfung. Gönne euch beiden Ruhe.',
      'Es ist okay, langsamer zu machen. Morgen ist ein neuer Tag.',
    ],
    angespannt: [
      'CALI spürt die Anspannung. Kleine Pausen machen den Unterschied.',
      'Spannung ist ein Signal — nicht ignorieren, sondern regulieren.',
    ],
    stabil: [
      'CALI fühlt sich ausgeglichen und geerdet.',
      'Ein guter Grundzustand. Konsistenz ist dein stärkster Hebel.',
    ],
    erholt: [
      'CALI wirkt ruhig und regeneriert. Das gute Gefühl zeigt sich.',
      'Du gibst deinem System, was es braucht. Das strahlt aus.',
    ],
    vital: [
      'CALI strahlt ruhige Stärke aus. Dein Rhythmus trägt Früchte.',
      'Lebendigkeit und Balance — das ist dein Zustand gerade.',
    ],
  };

  const pool = reflections[state];
  const idx = (negCount + posCount) % pool.length;
  return pool[idx];
}

export function getCompanionMood(
  allBlocksDone: boolean,
  pillarScores: PillarScores,
  previousPillarScores?: PillarScores,
  lastInteractionTimestamp?: number,
  justCompletedBlock?: boolean,
): CompanionMood {
  // Just completed a block → happy for 30s (caller manages timing)
  if (justCompletedBlock) return 'happy';

  // All blocks done → celebrating
  if (allBlocksDone) return 'celebrating';

  // >12h since last interaction → sleepy
  if (lastInteractionTimestamp && Date.now() - lastInteractionTimestamp > 12 * 60 * 60 * 1000) return 'sleepy';

  // Any pillar dropped 10+ points → concerned
  if (previousPillarScores) {
    const keys = Object.keys(pillarScores) as (keyof PillarScores)[];
    if (keys.some(k => (previousPillarScores[k] - pillarScores[k]) >= 10)) return 'concerned';
  }

  return 'neutral';
}

export function computeCompanionState(
  longevityScore: number,
  pillarScores: PillarScores,
  todayCheckIn: DailyCheckIn | null,
  streak: number,
  weeklyConsistency: number,
  goalPlan?: any,
  totalCheckins?: number,
  mood?: CompanionMood,
): CompanionData {
  const stress = todayCheckIn?.stress ?? 5;
  const energy = todayCheckIn?.energy ?? 5;
  const sleepHours = todayCheckIn?.sleepHours ?? 7;
  const recovery = todayCheckIn?.recovery ?? 5;

  const pillarValues = [pillarScores.bewegung, pillarScores.ernaehrung, pillarScores.regeneration, pillarScores.mental];
  const pillarMax = Math.max(...pillarValues);
  const pillarMin = Math.min(...pillarValues);
  const pillarDiff = pillarMax - pillarMin;

  let state: CompanionState = 'stabil';
  const wellbeing = longevityScore * 0.35 + (10 - stress) * 4 + energy * 2.5 + recovery * 2 + Math.min(sleepHours, 9) * 1.5;

  if (wellbeing < 30 || (sleepHours < 5 && energy < 4)) {
    state = 'erschoepft';
  } else if (wellbeing < 45 || (stress >= 7 && recovery < 5) || (pillarDiff > 35 && longevityScore < 60)) {
    state = 'angespannt';
  } else if (wellbeing >= 75 && streak >= 5 && pillarDiff < 25) {
    state = 'vital';
  } else if (wellbeing >= 58 && recovery >= 6 && sleepHours >= 7) {
    state = 'erholt';
  } else {
    state = 'stabil';
  }

  const vitality = Math.round(longevityScore * 0.7 + weeklyConsistency * 0.3);
  const breathCycle = state === 'erschoepft' ? 11 : state === 'angespannt' ? 8 : state === 'vital' ? 5 : state === 'erholt' ? 6 : 7;
  const shellIntegrity = Math.min(1, (streak / 14) * 0.5 + (weeklyConsistency / 100) * 0.5);
  const coreGlow = state === 'erschoepft' ? 0.15 : state === 'angespannt' ? 0.3 : state === 'vital' ? 0.95 : state === 'erholt' ? 0.7 : 0.5;

  const pillarIntensity = {
    bewegung: pillarScores.bewegung / 100,
    ernaehrung: pillarScores.ernaehrung / 100,
    regeneration: pillarScores.regeneration / 100,
    mental: pillarScores.mental / 100,
  };

  let posture = state === 'erschoepft' ? 0.25 : state === 'angespannt' ? 0.5 : state === 'vital' ? 0.95 : state === 'erholt' ? 0.8 : 0.65;
  const computedMood = mood || 'neutral';

  // Mood adjustments
  if (computedMood === 'concerned') posture = Math.max(0.1, posture - 0.15);
  const adjustedBreathCycle = computedMood === 'sleepy' ? Math.round(breathCycle * 1.5) : breathCycle;
  const eyeExpression: EyeExpression = computedMood === 'sleepy' ? 'heavy' : EYE_MAP[state];

  const sanctuaryBrightness = state === 'erschoepft' ? 0.15 : state === 'angespannt' ? 0.3 : state === 'vital' ? 0.9 : state === 'erholt' ? 0.7 : 0.5;
  const tension = state === 'angespannt' ? 0.7 : state === 'erschoepft' ? 0.5 : state === 'vital' ? 0.05 : state === 'erholt' ? 0.15 : 0.3;
  const warmth = state === 'vital' ? 0.9 : state === 'erholt' ? 0.75 : state === 'stabil' ? 0.5 : state === 'angespannt' ? 0.25 : 0.15;

  const harmonyScore = Math.max(0, 1 - (pillarDiff / 100));

  const { tier: evolutionTier, progress: evolutionProgress, evoScore } = computeEvolution(
    vitality, streak, weeklyConsistency, totalCheckins || 0, harmonyScore,
  );

  const sanctuaryDepth = Math.min(1, (vitality / 100) * 0.3 + harmonyScore * 0.3 + shellIntegrity * 0.2 + (recovery / 10) * 0.2);
  const resilience = Math.min(1, (streak / 21) * 0.5 + (weeklyConsistency / 100) * 0.5);

  const influences = computeInfluences(pillarScores, todayCheckIn, streak);

  if (goalPlan?.weeklyPlan?.weeklyBlocks) {
    const total = goalPlan.weeklyPlan.weeklyBlocks.reduce((s: number, d: any) => s + d.blocks.length, 0);
    const done = goalPlan.weeklyPlan.weeklyBlocks.reduce((s: number, d: any) => s + d.blocks.filter((b: any) => b.completed).length, 0);
    const goalAdherence = total > 0 ? done / total : 0;
    
    if (goalAdherence >= 0.7) {
      influences.push({ factor: 'goal', label: `Zielplan ${Math.round(goalAdherence * 100)}% umgesetzt`, impact: 'positive', value: goalAdherence * 100 });
    } else if (goalAdherence < 0.3 && total > 0) {
      influences.push({ factor: 'goal', label: `Zielplan nur ${Math.round(goalAdherence * 100)}% umgesetzt`, impact: 'negative', value: goalAdherence * 100 });
    }
  }

  const primaryInfluence = influences.length > 0 ? influences[0].label : 'Keine besonderen Einflüsse heute';
  const actionSuggestion = getActionSuggestion(state, influences);
  const emotionalReflection = getEmotionalReflection(state, influences);

  const meta = STATE_META[state];

  // Psychology layer computations
  const evolutionStage = computeEvolutionStage(longevityScore, streak);
  const dayPhase = computeDayPhase();
  const weakestPillar = computeWeakestPillar(pillarScores);
  const streakTier = computeStreakTier(streak);
  const attentionHungry = computeAttentionHunger(!!todayCheckIn);
  const caliSays = getCaliSays(state, evolutionStage.stage, dayPhase.phase, streak, weakestPillar, !!todayCheckIn);

  return {
    state,
    mood: computedMood,
    vitality,
    breathCycle: adjustedBreathCycle,
    shellIntegrity,
    coreGlow,
    pillarIntensity,
    label: meta.label,
    insight: meta.insight,
    posture,
    eyeExpression,
    sanctuaryBrightness,
    tension,
    warmth,
    evolutionTier,
    evolutionProgress,
    evolutionScore: evoScore,
    sanctuaryDepth,
    harmonyScore,
    resilience,
    influences,
    primaryInfluence,
    actionSuggestion,
    emotionalReflection,
    evolutionStage,
    dayPhase,
    weakestPillar,
    streakTier,
    attentionHungry,
    caliSays,
  };
}
