/**
 * CALINESS Goal Assessment Engine
 * Handles follow-up questions, pillar sub-assessment, and realism calculations.
 */

import type { UserProfile } from '@/contexts/AppContext';

export type ExtendedGoal = 'fat_loss' | 'muscle_gain' | 'recomp' | 'sleep_improvement' | 'stress_reduction' | 'energy_recovery' | 'routine_building';

export const EXTENDED_GOAL_OPTIONS: { type: ExtendedGoal; label: string; desc: string; emoji: string }[] = [
  { type: 'fat_loss', label: 'Fett verlieren', desc: 'Nachhaltiger Fettabbau mit Muskelerhalt', emoji: '🔥' },
  { type: 'muscle_gain', label: 'Muskeln aufbauen', desc: 'Lean Muscle Gain mit progressivem Training', emoji: '💪' },
  { type: 'recomp', label: 'Fettabbau + Muskelerhalt', desc: 'Körperfett reduzieren, Muskulatur schützen', emoji: '⚡' },
  { type: 'sleep_improvement', label: 'Schlaf verbessern', desc: 'Tiefere Erholung und bessere Schlafqualität', emoji: '🌙' },
  { type: 'stress_reduction', label: 'Stress reduzieren', desc: 'Nervensystem regulieren und Ruhe finden', emoji: '🧘' },
  { type: 'energy_recovery', label: 'Energie verbessern', desc: 'Mehr Vitalität und bessere Regeneration', emoji: '⚡' },
  { type: 'routine_building', label: 'Gesunde Routinen', desc: 'Konsistente Gewohnheiten aufbauen', emoji: '🛡️' },
];

/* ═══ Question Definitions ═══ */

export interface GoalQuestion {
  id: string;
  type: 'number' | 'slider' | 'select' | 'yesno';
  label: string;
  hint?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  defaultValue?: any;
}

export interface QuestionGroup {
  title: string;
  companionMessage: string;
  questions: GoalQuestion[];
}

function getBaseQuestions(): GoalQuestion[] {
  return [
    { id: 'trainingDays', type: 'slider', label: 'Realistische Trainingstage pro Woche', min: 0, max: 6, step: 1, defaultValue: 3 },
    { id: 'sleepQuality', type: 'slider', label: 'Schlafqualität (1 = schlecht, 5 = sehr gut)', min: 1, max: 5, step: 1, defaultValue: 3 },
    { id: 'stressLevel', type: 'slider', label: 'Aktuelles Stresslevel (1 = niedrig, 5 = sehr hoch)', min: 1, max: 5, step: 1, defaultValue: 3 },
  ];
}

export function getQuestionsForGoal(goal: ExtendedGoal): QuestionGroup[] {
  switch (goal) {
    case 'fat_loss':
      return [
        {
          title: 'Dein Ausgangspunkt',
          companionMessage: 'Lass mich deinen Ist-Zustand verstehen, damit ich dir einen realistischen Plan geben kann.',
          questions: [
            { id: 'currentWeight', type: 'number', label: 'Aktuelles Gewicht', unit: 'kg', defaultValue: 80 },
            { id: 'goalWeight', type: 'number', label: 'Zielgewicht', unit: 'kg', defaultValue: 75 },
            { id: 'timeframe', type: 'select', label: 'Gewünschter Zeitrahmen', options: [
              { value: '8', label: '8 Wochen' }, { value: '12', label: '12 Wochen' },
              { value: '16', label: '16 Wochen' }, { value: '24', label: '24+ Wochen' },
            ], defaultValue: '12' },
          ],
        },
        {
          title: 'Dein Alltag',
          companionMessage: 'Jetzt schauen wir, wie dein Alltag aussieht — das entscheidet mehr als jeder Ernährungsplan.',
          questions: [
            { id: 'biggestObstacle', type: 'select', label: 'Größtes Hindernis bisher', options: [
              { value: 'cravings', label: 'Heißhunger abends' }, { value: 'time', label: 'Keine Zeit zum Kochen' },
              { value: 'stress_eating', label: 'Stress-Essen' }, { value: 'consistency', label: 'Mangelnde Konsequenz' },
            ], defaultValue: 'consistency' },
            { id: 'trainingDays', type: 'slider', label: 'Realistische Trainingstage / Woche', min: 0, max: 6, step: 1, defaultValue: 3 },
            { id: 'lifestyle', type: 'select', label: 'Alltag überwiegend…', options: [
              { value: 'sedentary', label: 'Sitzend' }, { value: 'active', label: 'Eher aktiv' },
            ], defaultValue: 'sedentary' },
          ],
        },
        {
          title: 'Recovery & Mental',
          companionMessage: 'Schlaf und Stress sind oft die versteckten Hebel bei Fettabbau.',
          questions: [
            { id: 'sleepQuality', type: 'slider', label: 'Schlafqualität (1-5)', min: 1, max: 5, step: 1, defaultValue: 3 },
            { id: 'stressLevel', type: 'slider', label: 'Stresslevel (1-5)', min: 1, max: 5, step: 1, defaultValue: 3 },
            { id: 'eveningCravings', type: 'yesno', label: 'Hast du abends oft Heißhunger?', defaultValue: false },
          ],
        },
      ];

    case 'muscle_gain':
      return [
        {
          title: 'Dein Trainings-Profil',
          companionMessage: 'Muskelaufbau ist ein Handwerk. Lass mich verstehen, wo du stehst.',
          questions: [
            { id: 'currentWeight', type: 'number', label: 'Aktuelles Gewicht', unit: 'kg', defaultValue: 75 },
            { id: 'goalWeight', type: 'number', label: 'Zielgewicht / Wunschgewicht', unit: 'kg', defaultValue: 82 },
            { id: 'experience', type: 'select', label: 'Trainingserfahrung', options: [
              { value: 'beginner', label: 'Anfänger (< 1 Jahr)' },
              { value: 'intermediate', label: 'Fortgeschritten (1-3 Jahre)' },
              { value: 'advanced', label: 'Erfahren (3+ Jahre)' },
            ], defaultValue: 'intermediate' },
          ],
        },
        {
          title: 'Training & Ausstattung',
          companionMessage: 'Dein Setup bestimmt, wie wir den Plan strukturieren.',
          questions: [
            { id: 'trainingDays', type: 'slider', label: 'Verfügbare Trainingstage / Woche', min: 2, max: 6, step: 1, defaultValue: 4 },
            { id: 'equipment', type: 'select', label: 'Verfügbare Ausstattung', options: [
              { value: 'full_gym', label: 'Vollständiges Gym' },
              { value: 'home', label: 'Home Gym' },
              { value: 'minimal', label: 'Minimal' },
            ], defaultValue: 'full_gym' },
            { id: 'sleepQuality', type: 'slider', label: 'Schlafqualität (1-5)', min: 1, max: 5, step: 1, defaultValue: 3 },
          ],
        },
        {
          title: 'Ernährung & Recovery',
          companionMessage: 'Muskeln wachsen in der Küche und im Schlaf — nicht nur im Gym.',
          questions: [
            { id: 'recoveryHabits', type: 'select', label: 'Recovery-Gewohnheiten', options: [
              { value: 'good', label: 'Gut (Stretching, Schlaf, Rest Days)' },
              { value: 'medium', label: 'Mittel' },
              { value: 'poor', label: 'Kaum vorhanden' },
            ], defaultValue: 'medium' },
            { id: 'mealStructure', type: 'select', label: 'Aktuelle Mahlzeiten-Struktur', options: [
              { value: 'regular', label: 'Regelmäßig (3-4 Mahlzeiten)' },
              { value: 'irregular', label: 'Unregelmäßig' },
              { value: 'minimal', label: 'Kaum strukturiert' },
            ], defaultValue: 'irregular' },
            { id: 'proteinIntake', type: 'select', label: 'Protein-Einschätzung', options: [
              { value: 'low', label: 'Niedrig' }, { value: 'medium', label: 'Mittel' }, { value: 'high', label: 'Hoch' },
            ], defaultValue: 'medium' },
          ],
        },
      ];

    case 'sleep_improvement':
      return [
        {
          title: 'Dein Schlaf aktuell',
          companionMessage: 'Guter Schlaf ist das Fundament von allem. Lass uns schauen, wo du stehst.',
          questions: [
            { id: 'sleepHours', type: 'slider', label: 'Durchschnittliche Schlafdauer (Stunden)', min: 4, max: 10, step: 0.5, defaultValue: 6.5 },
            { id: 'sleepQuality', type: 'slider', label: 'Schlafqualität (1-5)', min: 1, max: 5, step: 1, defaultValue: 2 },
            { id: 'sleepProblem', type: 'select', label: 'Größtes Schlaf-Problem', options: [
              { value: 'falling_asleep', label: 'Einschlafen dauert lange' },
              { value: 'staying_asleep', label: 'Durchschlafen schwierig' },
              { value: 'waking_early', label: 'Zu frühes Aufwachen' },
              { value: 'not_rested', label: 'Nicht erholt trotz genug Schlaf' },
            ], defaultValue: 'falling_asleep' },
          ],
        },
        {
          title: 'Abend-Routinen',
          companionMessage: 'Was du abends tust, programmiert deinen Schlaf.',
          questions: [
            { id: 'screenTimeEvening', type: 'yesno', label: 'Bildschirmzeit nach 21 Uhr?', defaultValue: true },
            { id: 'caffeineLate', type: 'yesno', label: 'Koffein nach 14 Uhr?', defaultValue: false },
            { id: 'stressLevel', type: 'slider', label: 'Stresslevel (1-5)', min: 1, max: 5, step: 1, defaultValue: 3 },
            { id: 'trainingDays', type: 'slider', label: 'Trainingstage / Woche', min: 0, max: 6, step: 1, defaultValue: 2 },
          ],
        },
      ];

    case 'stress_reduction':
      return [
        {
          title: 'Dein Stress-Profil',
          companionMessage: 'Stress ist nicht der Feind — unkontrollierter Stress ist es. Lass uns schauen.',
          questions: [
            { id: 'stressLevel', type: 'slider', label: 'Aktuelles Stresslevel (1-5)', min: 1, max: 5, step: 1, defaultValue: 4 },
            { id: 'stressSource', type: 'select', label: 'Hauptquelle für Stress', options: [
              { value: 'work', label: 'Arbeit / Beruf' },
              { value: 'relationships', label: 'Beziehungen / Familie' },
              { value: 'health', label: 'Gesundheit' },
              { value: 'financial', label: 'Finanzen' },
            ], defaultValue: 'work' },
            { id: 'copingMechanism', type: 'select', label: 'Wie gehst du mit Stress um?', options: [
              { value: 'exercise', label: 'Sport / Bewegung' },
              { value: 'eating', label: 'Essen / Snacken' },
              { value: 'screen', label: 'Bildschirm / Social Media' },
              { value: 'nothing', label: 'Gar nicht bewusst' },
            ], defaultValue: 'screen' },
          ],
        },
        {
          title: 'Lifestyle & Recovery',
          companionMessage: 'Dein Nervensystem braucht Ankerpunkte. Was hast du aktuell?',
          questions: [
            { id: 'sleepQuality', type: 'slider', label: 'Schlafqualität (1-5)', min: 1, max: 5, step: 1, defaultValue: 3 },
            { id: 'trainingDays', type: 'slider', label: 'Bewegung / Trainingstage pro Woche', min: 0, max: 6, step: 1, defaultValue: 2 },
            { id: 'hasRoutine', type: 'yesno', label: 'Hast du eine feste Morgen- oder Abendroutine?', defaultValue: false },
          ],
        },
      ];

    default: // energy_recovery, routine_building, recomp
      return [
        {
          title: 'Dein Ausgangspunkt',
          companionMessage: 'Lass uns verstehen, wo du gerade stehst.',
          questions: [
            { id: 'currentWeight', type: 'number', label: 'Aktuelles Gewicht', unit: 'kg', defaultValue: 80 },
            ...getBaseQuestions(),
          ],
        },
        {
          title: 'Lebensstil',
          companionMessage: 'Der Alltag entscheidet über deinen Erfolg.',
          questions: [
            { id: 'lifestyle', type: 'select', label: 'Alltag überwiegend…', options: [
              { value: 'sedentary', label: 'Sitzend' }, { value: 'active', label: 'Eher aktiv' },
            ], defaultValue: 'sedentary' },
            { id: 'mealStructure', type: 'select', label: 'Mahlzeiten-Struktur', options: [
              { value: 'regular', label: 'Regelmäßig' }, { value: 'irregular', label: 'Unregelmäßig' },
              { value: 'minimal', label: 'Kaum strukturiert' },
            ], defaultValue: 'irregular' },
            { id: 'biggestObstacle', type: 'select', label: 'Größtes Hindernis', options: [
              { value: 'time', label: 'Zeitmangel' }, { value: 'motivation', label: 'Motivation' },
              { value: 'knowledge', label: 'Fehlendes Wissen' }, { value: 'consistency', label: 'Konsequenz' },
            ], defaultValue: 'consistency' },
          ],
        },
      ];
  }
}

/* ═══ Pillar Sub-Assessment ═══ */

export interface SubIndicator {
  label: string;
  status: 'green' | 'yellow' | 'red';
  detail: string;
}

export interface PillarAssessment {
  key: string;
  label: string;
  score: number;
  subIndicators: SubIndicator[];
}

export interface FullAssessment {
  pillars: PillarAssessment[];
  overallScore: number;
}

export function calculatePillarAssessment(
  goal: ExtendedGoal,
  answers: Record<string, any>,
  profile: UserProfile,
): FullAssessment {
  const trainingDays = Number(answers.trainingDays) || 0;
  const sleepQuality = Number(answers.sleepQuality) || 3;
  const stressLevel = Number(answers.stressLevel) || 3;
  const lifestyle = answers.lifestyle || 'sedentary';
  const mealStructure = answers.mealStructure || 'irregular';
  const proteinIntake = answers.proteinIntake || 'medium';
  const eveningCravings = answers.eveningCravings === true;

  // Pillar 1: Movement
  const requiredDays = goal === 'muscle_gain' ? 3 : goal === 'fat_loss' ? 3 : 2;
  const trainingFit: SubIndicator = {
    label: 'Trainingsfrequenz passend?',
    status: trainingDays >= requiredDays ? 'green' : trainingDays >= requiredDays - 1 ? 'yellow' : 'red',
    detail: trainingDays >= requiredDays ? `${trainingDays}x/Woche passt zu deinem Ziel` : `${trainingDays}x/Woche — empfohlen wären ${requiredDays}+`,
  };
  const movementFit: SubIndicator = {
    label: 'Alltagsbewegung ausreichend?',
    status: lifestyle === 'active' ? 'green' : 'yellow',
    detail: lifestyle === 'active' ? 'Aktiver Alltag unterstützt dein Ziel' : 'Sitzender Alltag — mehr Alltagsbewegung wäre ideal',
  };
  const structureFit: SubIndicator = {
    label: 'Wochenstruktur vorhanden?',
    status: trainingDays >= 2 ? 'green' : trainingDays >= 1 ? 'yellow' : 'red',
    detail: trainingDays >= 2 ? 'Trainingsstruktur vorhanden' : 'Keine feste Trainingsstruktur',
  };
  const bewegungScore = [trainingFit, movementFit, structureFit].filter(s => s.status === 'green').length * 33 + [trainingFit, movementFit, structureFit].filter(s => s.status === 'yellow').length * 17;

  // Pillar 2: Nutrition
  const calorieFit: SubIndicator = (() => {
    if (goal === 'fat_loss') {
      const diff = (answers.currentWeight || 80) - (answers.goalWeight || 75);
      const weeks = Number(answers.timeframe) || 12;
      const weeklyLoss = diff / weeks;
      if (weeklyLoss <= 0.7) return { label: 'Kalorienbereich passend?', status: 'green' as const, detail: `~${weeklyLoss.toFixed(1)} kg/Woche — nachhaltiges Tempo` };
      if (weeklyLoss <= 1.0) return { label: 'Kalorienbereich passend?', status: 'yellow' as const, detail: `~${weeklyLoss.toFixed(1)} kg/Woche — ambitioniert aber machbar` };
      return { label: 'Kalorienbereich passend?', status: 'red' as const, detail: `~${weeklyLoss.toFixed(1)} kg/Woche — zu aggressiv, Muskelabbau wahrscheinlich` };
    }
    return { label: 'Kalorienbereich passend?', status: 'yellow' as const, detail: 'Wird basierend auf deinem Ziel berechnet' };
  })();
  const proteinFit: SubIndicator = {
    label: 'Protein ausreichend?',
    status: proteinIntake === 'high' ? 'green' : proteinIntake === 'medium' ? 'yellow' : 'red',
    detail: proteinIntake === 'high' ? 'Gute Proteinversorgung' : proteinIntake === 'medium' ? 'Protein könnte höher sein' : 'Protein ist zu niedrig für dein Ziel',
  };
  const mealFit: SubIndicator = {
    label: 'Mahlzeitenstruktur stabil?',
    status: mealStructure === 'regular' ? 'green' : mealStructure === 'irregular' ? 'yellow' : 'red',
    detail: mealStructure === 'regular' ? 'Regelmäßige Mahlzeiten — super' : 'Unregelmäßige Mahlzeiten erschweren die Kontrolle',
  };
  const ernaehrungScore = [calorieFit, proteinFit, mealFit].filter(s => s.status === 'green').length * 33 + [calorieFit, proteinFit, mealFit].filter(s => s.status === 'yellow').length * 17;

  // Pillar 3: Recovery
  const sleepFit: SubIndicator = {
    label: 'Schlaf limitiert Fortschritt?',
    status: sleepQuality >= 4 ? 'green' : sleepQuality >= 3 ? 'yellow' : 'red',
    detail: sleepQuality >= 4 ? 'Schlafqualität unterstützt dein Ziel' : sleepQuality >= 3 ? 'Schlaf könnte besser sein' : 'Schlaf bremst deinen Fortschritt erheblich',
  };
  const restFit: SubIndicator = {
    label: 'Erholung ausreichend?',
    status: trainingDays <= 4 ? 'green' : trainingDays <= 5 ? 'yellow' : 'red',
    detail: trainingDays <= 4 ? 'Genug Rest Days eingeplant' : 'Wenig Erholung — Übertraining-Risiko',
  };
  const recoveryBehavior: SubIndicator = (() => {
    const rh = answers.recoveryHabits || 'medium';
    return {
      label: 'Recovery-Verhalten passend?',
      status: rh === 'good' ? 'green' as const : rh === 'medium' ? 'yellow' as const : 'red' as const,
      detail: rh === 'good' ? 'Aktive Recovery-Gewohnheiten vorhanden' : 'Recovery-Verhalten könnte verbessert werden',
    };
  })();
  const regenerationScore = [sleepFit, restFit, recoveryBehavior].filter(s => s.status === 'green').length * 33 + [sleepFit, restFit, recoveryBehavior].filter(s => s.status === 'yellow').length * 17;

  // Pillar 4: Mental
  const stressFit: SubIndicator = {
    label: 'Stress sabotiert Umsetzung?',
    status: stressLevel <= 2 ? 'green' : stressLevel <= 3 ? 'yellow' : 'red',
    detail: stressLevel <= 2 ? 'Stresslevel unter Kontrolle' : stressLevel <= 3 ? 'Stress moderat — Puffer einplanen' : 'Hohes Stresslevel — größter Risikofaktor',
  };
  const cravingsFit: SubIndicator = {
    label: 'Heißhunger emotional bedingt?',
    status: !eveningCravings && stressLevel <= 3 ? 'green' : eveningCravings && stressLevel >= 4 ? 'red' : 'yellow',
    detail: !eveningCravings ? 'Kein emotionales Essverhalten erkennbar' : 'Abendliche Heißhunger-Muster erkannt',
  };
  const routineStability: SubIndicator = {
    label: 'Routinen stabil?',
    status: mealStructure === 'regular' && trainingDays >= 2 ? 'green' : mealStructure !== 'minimal' ? 'yellow' : 'red',
    detail: mealStructure === 'regular' ? 'Stabile Grundroutinen vorhanden' : 'Routinen fehlen — Konsistenz aufbauen',
  };
  const mentalScore = [stressFit, cravingsFit, routineStability].filter(s => s.status === 'green').length * 33 + [stressFit, cravingsFit, routineStability].filter(s => s.status === 'yellow').length * 17;

  const pillars: PillarAssessment[] = [
    { key: 'bewegung', label: 'Bewegung & Leistung', score: Math.min(100, bewegungScore), subIndicators: [trainingFit, movementFit, structureFit] },
    { key: 'ernaehrung', label: 'Ernährung & Mikronährstoffe', score: Math.min(100, ernaehrungScore), subIndicators: [calorieFit, proteinFit, mealFit] },
    { key: 'regeneration', label: 'Recovery & Schlafqualität', score: Math.min(100, regenerationScore), subIndicators: [sleepFit, restFit, recoveryBehavior] },
    { key: 'mental', label: 'Mentale Balance & Stresskompetenz', score: Math.min(100, mentalScore), subIndicators: [stressFit, cravingsFit, routineStability] },
  ];

  const overallScore = Math.round(pillars.reduce((s, p) => s + p.score, 0) / 4);
  return { pillars, overallScore };
}

/* ═══ Realism Check ═══ */

export interface RealismData {
  weeklyRate: string;
  realismRating: 'niedrig' | 'mittel-gut' | 'sehr gut';
  realismPercent: number;
  calorieRange: { min: number; max: number };
  proteinTarget: number;
  fatTarget: number;
  carbRange: { min: number; max: number };
  trainingDirection: string;
  biggestBottleneck: string;
  importantPillar: string;
  companionMessage: string;
}

export function calculateRealism(
  goal: ExtendedGoal,
  answers: Record<string, any>,
  profile: UserProfile,
  assessment: FullAssessment,
): RealismData {
  const weight = Number(answers.currentWeight) || profile.weight;
  const goalWeight = Number(answers.goalWeight) || weight;
  const timeframe = Number(answers.timeframe) || 12;
  const trainingDays = Number(answers.trainingDays) || 3;
  const sleepQuality = Number(answers.sleepQuality) || 3;
  const stressLevel = Number(answers.stressLevel) || 3;

  // BMR calculation
  const bmr = profile.gender === 'weiblich'
    ? 10 * weight + 6.25 * profile.height - 5 * profile.age - 161
    : 10 * weight + 6.25 * profile.height - 5 * profile.age + 5;

  const actMult = profile.activityLevel.includes('hoch') || profile.activityLevel.includes('aktiv') ? 1.6 : profile.activityLevel.includes('leicht') ? 1.375 : 1.55;
  const tdee = Math.round(bmr * actMult);

  // Goal-specific calculations
  let weeklyRate = '';
  let realismPercent = 70;
  let deficit = 0;

  if (goal === 'fat_loss' || goal === 'recomp') {
    const diff = weight - goalWeight;
    const weeklyLoss = diff > 0 ? diff / timeframe : 0;
    weeklyRate = `~${Math.max(0.3, Math.min(1.0, weeklyLoss)).toFixed(1)} kg/Woche`;
    deficit = Math.round(weeklyLoss * 1100); // ~1100 kcal deficit per kg loss
    deficit = Math.min(deficit, 700); // cap
    if (weeklyLoss <= 0.5) realismPercent = 90;
    else if (weeklyLoss <= 0.75) realismPercent = 70;
    else realismPercent = 45;
  } else if (goal === 'muscle_gain') {
    weeklyRate = '~0.15-0.25 kg/Woche';
    deficit = -250; // surplus
    realismPercent = trainingDays >= 3 ? 80 : 55;
  } else {
    weeklyRate = 'Nachhaltige Verbesserung';
    realismPercent = 75;
  }

  // Adjust for sleep/stress
  if (sleepQuality <= 2) realismPercent -= 15;
  if (stressLevel >= 4) realismPercent -= 10;
  if (trainingDays >= 3) realismPercent += 5;

  realismPercent = Math.max(20, Math.min(95, realismPercent));

  const realismRating: RealismData['realismRating'] =
    realismPercent >= 70 ? 'sehr gut' : realismPercent >= 45 ? 'mittel-gut' : 'niedrig';

  // Macros
  const proteinPerKg = goal === 'muscle_gain' ? 2.0 : goal === 'fat_loss' ? 1.8 : 1.6;
  const fatPerKg = 0.85;
  const proteinTarget = Math.round(weight * proteinPerKg);
  const fatTarget = Math.round(weight * fatPerKg);
  const calorieMax = tdee - (goal === 'fat_loss' ? 300 : goal === 'muscle_gain' ? -200 : 0);
  const calorieMin = tdee - (goal === 'fat_loss' ? 500 : goal === 'muscle_gain' ? -100 : 100);
  const proteinCal = proteinTarget * 4;
  const fatCal = fatTarget * 9;
  const carbMin = Math.max(50, Math.round((calorieMin - proteinCal - fatCal) / 4));
  const carbMax = Math.max(50, Math.round((calorieMax - proteinCal - fatCal) / 4));

  // Find weakest pillar
  const weakest = assessment.pillars.reduce((w, p) => p.score < w.score ? p : w, assessment.pillars[0]);
  const importantPillar = weakest.label;

  // Bottleneck from answers
  const bottleneckMap: Record<string, string> = {
    cravings: 'Abendliche Heißhunger-Muster',
    time: 'Zeitmangel für Zubereitung',
    stress_eating: 'Stressgetriebenes Essen',
    consistency: 'Konsequenz in der Umsetzung',
    falling_asleep: 'Einschlafprobleme',
    staying_asleep: 'Durchschlaf-Probleme',
  };
  const obstacle = answers.biggestObstacle || answers.sleepProblem || 'consistency';
  const biggestBottleneck = bottleneckMap[obstacle] || 'Konsequenz in der Umsetzung';

  // Training direction
  const trainingDir = goal === 'muscle_gain' ? 'Progressive Kraft mit Fokus auf Hypertrophie'
    : goal === 'fat_loss' ? 'Kraft + aktive Erholung für Muskelerhalt'
    : goal === 'sleep_improvement' ? 'Moderate Bewegung, kein Abendtraining'
    : goal === 'stress_reduction' ? 'Nervensystem-freundliches Training (Yoga, Walks)'
    : 'Strukturierte Bewegung mit Recovery-Fokus';

  // Companion message
  const messages: Record<string, string> = {
    fat_loss: `Dein Ziel ist ${realismRating === 'sehr gut' ? 'realistisch' : 'ambitioniert'}. Dein größter Hebel ist nicht nur Ernährung — es ist ${stressLevel >= 4 ? 'dein Stresslevel zu stabilisieren' : sleepQuality <= 2 ? 'deinen Schlaf zu verbessern' : 'Konsistenz in den Grundlagen'}.`,
    muscle_gain: `Muskelaufbau braucht Geduld und System. Mit ${trainingDays}x Training pro Woche ${trainingDays >= 3 ? 'hast du eine gute Basis' : 'wäre mehr Training ideal'}. ${proteinTarget}g Protein pro Tag ist dein Ankerpunkt.`,
    sleep_improvement: `Schlaf ist der wichtigste Hebel für alles andere. ${answers.screenTimeEvening ? 'Der erste Schritt: Bildschirmzeit abends reduzieren.' : 'Du machst schon einiges richtig — lass uns die Feinheiten optimieren.'}`,
    stress_reduction: `Stress-Reduktion ist kein Luxus, sondern Grundlage. ${stressLevel >= 4 ? 'Dein Stresslevel ist hoch — wir starten mit kleinen Ankerpunkten.' : 'Moderat hohes Stresslevel — mit Struktur gut managebar.'}`,
    recomp: `Rekomposition ist der anspruchsvollste Weg — aber auch der nachhaltigste. Kraft-Training ist dabei nicht optional.`,
    energy_recovery: `Mehr Energie beginnt nicht mit mehr Kaffee, sondern mit besserer Recovery. Dein schwächster Bereich: ${importantPillar}.`,
    routine_building: `Routinen sind der Grundstein. Starte mit einer einzigen Gewohnheit und baue darauf auf.`,
  };

  return {
    weeklyRate,
    realismRating,
    realismPercent,
    calorieRange: { min: Math.round(calorieMin / 50) * 50, max: Math.round(calorieMax / 50) * 50 },
    proteinTarget,
    fatTarget,
    carbRange: { min: carbMin, max: carbMax },
    trainingDirection: trainingDir,
    biggestBottleneck,
    importantPillar,
    companionMessage: messages[goal] || messages.routine_building,
  };
}

/* ═══ Goal Summary Helpers ═══ */

export function getWeeklyFocusSummary(goal: ExtendedGoal, assessment: FullAssessment, answers: Record<string, any>): string {
  const weakest = assessment.pillars.reduce((w, p) => p.score < w.score ? p : w, assessment.pillars[0]);
  const parts: string[] = [];

  if (weakest.key === 'ernaehrung' || goal === 'fat_loss' || goal === 'muscle_gain') {
    parts.push('Protein früher am Tag');
  }
  if (Number(answers.trainingDays) >= 2) {
    parts.push(`${answers.trainingDays} feste Bewegungsblöcke`);
  }
  if (Number(answers.stressLevel) >= 4 || answers.screenTimeEvening) {
    parts.push('Bildschirmzeit abends reduzieren');
  }
  if (Number(answers.sleepQuality) <= 2) {
    parts.push('Schlaf-Routine aufbauen');
  }

  return parts.length > 0 ? parts.join(' + ') : 'Konsistenz in den Grundlagen aufbauen';
}

export function getExpandableDirections(goal: ExtendedGoal, realism: RealismData, assessment: FullAssessment): {
  training: string[];
  nutrition: string[];
  recovery: string[];
  mental: string[];
} {
  return {
    training: [
      goal === 'muscle_gain' ? 'Progressive Überladung: +1 Rep oder +2.5kg pro Woche' : 'Kraft-Training priorisieren für Muskelerhalt',
      goal === 'sleep_improvement' ? 'Kein intensives Training nach 19 Uhr' : 'Alltagsbewegung: 8.000+ Schritte',
      'Rest Days sind Trainingstage für dein Nervensystem',
    ],
    nutrition: [
      `${realism.proteinTarget}g Protein auf 3-4 Mahlzeiten verteilen`,
      goal === 'fat_loss' ? `Kalorienbereich: ${realism.calorieRange.min}–${realism.calorieRange.max} kcal` : 'Nährstoffdichte vor Kalorien-Tracking',
      'Erste Mahlzeit: Protein-Ankerpunkt setzen',
    ],
    recovery: [
      'Schlafenszeit-Konsistenz: jeden Tag ±30 Min',
      'Kein Bildschirm 60 Min vor dem Schlafen',
      'Aktive Recovery: Mobilität, Stretching, Spaziergang',
    ],
    mental: [
      'Täglicher 2-Min Atem-Ankerpunkt',
      'Bewusste Pausen: 3x am Tag 5 Minuten ohne Reize',
      'Abend-Reflexion: Was lief heute gut?',
    ],
  };
}
