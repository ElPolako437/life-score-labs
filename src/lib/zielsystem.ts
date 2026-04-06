/**
 * CALINESS Zielsystem — Core calculation engine
 * Goal-based calorie, macro, training & daily guidance calculations.
 */

import type { UserProfile, DailyCheckIn, PillarScores, GoalPlanData, NutritionLogEntry } from '@/contexts/AppContext';

/* ═══ Types ═══ */

export type ZielGoal = 'fat_loss' | 'muscle_gain' | 'recomp' | 'energy_recovery' | 'routine_building' | 'longevity' | 'sleep_improvement' | 'stress_reduction';

export interface MacroTargets {
  calorieMin: number;
  calorieMax: number;
  proteinTarget: number;
  fatTarget: number;
  carbMin: number;
  carbMax: number;
  goalLabel: string;
  paceLabel: string;
  explanation: string;
}

export interface TrainingStructure {
  daysPerWeek: number;
  focusType: string;
  sessionMinutes: number;
  structure: string[];
  recoveryNote: string;
}

export interface GoalFitResult {
  level: 'hoch' | 'mittel' | 'niedrig';
  label: string;
  explanation: string;
  biggestLever: string;
  blockers: string[];
  nextSteps: string[];
}

export interface WeeklyFocus {
  focusArea: string;
  focusLabel: string;
  actionItems: string[];
}

export interface LongevityMealEval {
  proteinQuality: 'stark' | 'mittel' | 'schwach';
  satietyValue: 'hoch' | 'mittel' | 'niedrig';
  nutrientDensity: 'hoch' | 'mittel' | 'niedrig';
  processingLevel: 'gering' | 'mittel' | 'stark';
  energyStability: 'stabil' | 'mittel' | 'instabil';
  longevityFit: 'hoch' | 'mittel' | 'niedrig';
  goalSupport: 'gut' | 'teilweise' | 'schwach';
  goalSupportLabel: string;
  labels: string[];
}

export interface ZielsystemState {
  goal: ZielGoal;
  goalLabel: string;
  macros: MacroTargets;
  training: TrainingStructure;
  goalFit: GoalFitResult;
  weeklyFocus: WeeklyFocus;
  mealEval?: LongevityMealEval;
}

/* ═══ Goal Labels ═══ */

export const GOAL_LABELS: Record<ZielGoal, string> = {
  fat_loss: 'Fett verlieren',
  muscle_gain: 'Muskeln aufbauen',
  recomp: 'Körperfett reduzieren & Muskulatur erhalten',
  energy_recovery: 'Energie & Regeneration verbessern',
  routine_building: 'Gesunde Routinen aufbauen',
  longevity: 'Longevity-Basis',
  sleep_improvement: 'Schlaf verbessern',
  stress_reduction: 'Stress reduzieren',
};

/* ═══ Mifflin-St Jeor BMR ═══ */

function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  if (gender === 'weiblich') {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

function getActivityMultiplier(level: string): number {
  if (level.includes('seden') || level.includes('kaum') || level.includes('wenig')) return 1.2;
  if (level.includes('leicht')) return 1.375;
  if (level.includes('aktiv') && level.includes('sehr')) return 1.9;
  if (level.includes('aktiv') || level.includes('hoch')) return 1.725;
  return 1.55; // moderat
}

/* ═══ Macro Calculation ═══ */

export function calculateMacroTargets(
  profile: UserProfile,
  goal: ZielGoal,
): MacroTargets {
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  const mult = getActivityMultiplier(profile.activityLevel);
  const tdee = Math.round(bmr * mult);

  let deficitMin: number, deficitMax: number, proteinPerKg: number, fatPerKg: number;
  let goalLabel: string, paceLabel: string, explanation: string;

  switch (goal) {
    case 'fat_loss':
      deficitMin = 300; deficitMax = 500;
      proteinPerKg = 1.8; fatPerKg = 0.8;
      goalLabel = 'Fettverlust';
      paceLabel = '~0.5 kg/Woche · nachhaltig';
      explanation = 'Moderates Defizit für nachhaltigen Fettabbau. Protein schützt die Muskulatur, Fett sichert hormonelle Balance.';
      break;
    case 'muscle_gain':
      deficitMin = -300; deficitMax = -150;
      proteinPerKg = 2.0; fatPerKg = 0.9;
      goalLabel = 'Muskelaufbau';
      paceLabel = '~0.2 kg/Woche Zuwachs';
      explanation = 'Leichter Überschuss mit hohem Protein. Fett bleibt moderat. Der Überschuss fließt in Muskelproteinbiosynthese.';
      break;
    case 'recomp':
      deficitMin = 100; deficitMax = 250;
      proteinPerKg = 2.0; fatPerKg = 0.85;
      goalLabel = 'Rekomposition';
      paceLabel = 'Langsam & nachhaltig · Geduld zählt';
      explanation = 'Leichtes Defizit mit sehr hohem Protein — schützt Muskulatur während Fett abgebaut wird. Kraft-Training ist Pflicht.';
      break;
    case 'energy_recovery':
      deficitMin = -50; deficitMax = 50;
      proteinPerKg = 1.6; fatPerKg = 0.9;
      goalLabel = 'Energie & Recovery';
      paceLabel = 'Erhaltung · Qualität vor Quantität';
      explanation = 'Nah am Erhaltungsbedarf. Fokus auf Nährstoffdichte, Timing und Schlaf-Support durch Ernährung.';
      break;
    case 'routine_building':
      deficitMin = 0; deficitMax = 100;
      proteinPerKg = 1.5; fatPerKg = 0.85;
      goalLabel = 'Routinen aufbauen';
      paceLabel = 'Struktur wichtiger als Perfektion';
      explanation = 'Keine strenge Diät. Lerne erst konsistente Mahlzeiten-Zeiten und Protein-Ankerpunkte zu setzen.';
      break;
    default: // longevity
      deficitMin = 0; deficitMax = 100;
      proteinPerKg = 1.5; fatPerKg = 0.85;
      goalLabel = 'Nachhaltige Balance';
      paceLabel = 'Langfristige Gesundheit';
      explanation = 'Dein Erhaltungsbereich für langfristige Gesundheit. Qualität vor Quantität.';
  }

  const calorieMax = tdee - deficitMin;
  const calorieMin = tdee - deficitMax;
  const proteinTarget = Math.round(profile.weight * proteinPerKg);
  const fatTarget = Math.round(profile.weight * fatPerKg);

  // Carbs = remaining calories
  const proteinCal = proteinTarget * 4;
  const fatCal = fatTarget * 9;
  const carbMin = Math.max(50, Math.round((calorieMin - proteinCal - fatCal) / 4));
  const carbMax = Math.max(50, Math.round((calorieMax - proteinCal - fatCal) / 4));

  return {
    calorieMin: Math.round(calorieMin / 50) * 50,
    calorieMax: Math.round(calorieMax / 50) * 50,
    proteinTarget,
    fatTarget,
    carbMin,
    carbMax,
    goalLabel,
    paceLabel,
    explanation,
  };
}

/* ═══ Training Structure ═══ */

export function calculateTrainingStructure(
  profile: UserProfile,
  goal: ZielGoal,
  availableMinutes: number = 45,
  trainingDays: number = 3,
): TrainingStructure {
  let focusType: string;
  let structure: string[];
  let recoveryNote: string;
  const days = Math.min(trainingDays, 6);
  const mins = Math.max(20, Math.min(90, availableMinutes));

  switch (goal) {
    case 'fat_loss':
      focusType = 'Kraft + aktive Erholung';
      structure = days >= 4
        ? ['2–3x Krafttraining (Ganzkörper oder Upper/Lower)', '1–2x aktive Erholung (Spaziergang, Yoga)', 'Alltagsbewegung: 8.000+ Schritte']
        : ['2x Krafttraining (Ganzkörper)', '1x aktive Erholung', 'Alltagsbewegung priorisieren'];
      recoveryNote = 'Im Defizit ist Recovery wichtiger als Volumen. Schlaf > Extra-Training.';
      break;
    case 'muscle_gain':
      focusType = 'Progressive Kraft';
      structure = days >= 4
        ? ['3–4x Krafttraining (PPL oder Upper/Lower)', '1x aktive Erholung', 'Progressive Überladung: Gewicht oder Reps steigern']
        : ['3x Krafttraining (Ganzkörper)', 'Progressive Überladung jede Woche', 'Minimum 48h Pause zwischen gleichen Muskelgruppen'];
      recoveryNote = 'Muskelaufbau passiert in der Erholung. Schlaf und Protein-Timing sind entscheidend.';
      break;
    case 'recomp':
      focusType = 'Kraft mit Fokus auf Muskelerhalt';
      structure = ['2–3x Krafttraining (schwere Grundübungen)', '1–2x leichte Bewegung oder Cardio', 'Konsistenz > Intensität'];
      recoveryNote = 'Bei Rekomposition ist Kraft-Training nicht optional. Ohne Reiz kein Muskelerhalt.';
      break;
    case 'energy_recovery':
      focusType = 'Bewegung & Regeneration';
      structure = ['2–3x moderate Bewegung (kein Maximaltraining)', '1–2x Yoga, Mobilität oder Spaziergang', 'Fokus auf Nervensystem-Regulation'];
      recoveryNote = 'Weniger ist mehr. Dein Körper braucht Reize, aber keine Überlastung.';
      break;
    default:
      focusType = 'Strukturierte Bewegung';
      structure = ['2–3x Krafttraining oder Bewegung', '1x aktive Erholung', 'Alltagsbewegung als Basis'];
      recoveryNote = 'Starte mit 2x/Woche und steigere schrittweise. Konsistenz schlägt Intensität.';
  }

  return { daysPerWeek: days, focusType, sessionMinutes: mins, structure, recoveryNote };
}

/* ═══ Goal Fit Evaluation ═══ */

export function evaluateGoalFit(
  goal: ZielGoal,
  profile: UserProfile,
  todayCheckIn: DailyCheckIn | null,
  pillarScores: PillarScores,
  streak: number,
  todayProtein: number,
  macros: MacroTargets,
  goalPlan: GoalPlanData | null,
): GoalFitResult {
  const blockers: string[] = [];
  const nextSteps: string[] = [];
  let score = 0;
  let biggestLever = '';

  // Protein check
  const proteinPercent = macros.proteinTarget > 0 ? (todayProtein / macros.proteinTarget) * 100 : 0;
  if (proteinPercent >= 80) score += 2;
  else if (proteinPercent >= 50) score += 1;
  else {
    blockers.push(`Protein aktuell bei ${Math.round(proteinPercent)}% des Ziels`);
    if (!biggestLever) biggestLever = 'Protein früher am Tag stabilisieren';
  }

  // Check-in data
  if (todayCheckIn) {
    // Sleep
    if (todayCheckIn.sleepHours >= 7) score += 1;
    else blockers.push(`Nur ${todayCheckIn.sleepHours}h Schlaf — hemmt ${goal === 'muscle_gain' ? 'Muskelproteinbiosynthese' : 'Fettabbau und Recovery'}`);

    // Training
    if (todayCheckIn.training) score += 1;

    // Stress
    if (todayCheckIn.stress <= 5) score += 1;
    else if (todayCheckIn.stress >= 7) {
      blockers.push('Hohes Stresslevel — erhöht Cortisol und hemmt Fortschritt');
      if (!biggestLever) biggestLever = 'Stress-Puffer aufbauen: Mikro-Pausen, Atemübungen';
    }

    // Energy
    if (todayCheckIn.energy >= 6) score += 1;

    // Goal-specific
    if (goal === 'fat_loss' && todayCheckIn.alcohol) {
      blockers.push('Alkohol bremst Fettabbau und stört Schlafqualität');
    }
    if ((goal === 'energy_recovery' || goal === 'fat_loss') && todayCheckIn.screenTimeNight) {
      blockers.push('Bildschirmzeit abends stört Regeneration');
    }
  }

  // Streak bonus
  if (streak >= 7) score += 1;
  else if (streak < 3) {
    blockers.push('Konsistenz fehlt — Streak aufbauen');
    if (!biggestLever) biggestLever = 'Jeden Tag einchecken — Konsistenz ist der wichtigste Hebel';
  }

  // Pillar balance
  const pillarValues = Object.values(pillarScores);
  const weakest = Math.min(...pillarValues);
  if (weakest < 40) {
    const weakName = Object.entries(pillarScores).sort((a, b) => a[1] - b[1])[0][0];
    const labels: Record<string, string> = { bewegung: 'Bewegung', ernaehrung: 'Ernährung', regeneration: 'Regeneration', mental: 'Mentale Balance' };
    blockers.push(`${labels[weakName]} ist aktuell sehr schwach (${weakest})`);
  }

  // Goal adherence
  if (goalPlan?.weeklyPlan?.weeklyBlocks) {
    const total = goalPlan.weeklyPlan.weeklyBlocks.reduce((s: number, d: any) => s + d.blocks.length, 0);
    const done = goalPlan.weeklyPlan.weeklyBlocks.reduce((s: number, d: any) => s + d.blocks.filter((b: any) => b.completed).length, 0);
    const adherence = total > 0 ? (done / total) * 100 : 0;
    if (adherence >= 70) score += 1;
    else if (adherence < 40) blockers.push('Planumsetzung unter 40% — Blöcke vereinfachen oder reduzieren');
  }

  // Next steps based on goal
  switch (goal) {
    case 'fat_loss':
      nextSteps.push('Protein-Ziel vor 14 Uhr zu 50% erreichen');
      nextSteps.push('Abends leichter essen — Sättigung statt Restriktion');
      if (blockers.length === 0) nextSteps.push('Defizit halten — nicht weiter senken');
      break;
    case 'muscle_gain':
      nextSteps.push('Kraft-Training mit progressiver Überladung');
      nextSteps.push('Protein gleichmäßig über 3–4 Mahlzeiten verteilen');
      nextSteps.push('Schlaf und Recovery priorisieren');
      break;
    case 'recomp':
      nextSteps.push('Kraft-Training ist nicht optional — Muskelerhalt braucht Reiz');
      nextSteps.push('Protein ist dein wichtigster Makro');
      break;
    case 'energy_recovery':
      nextSteps.push('Schlaf-Hygiene verbessern — feste Schlafenszeit');
      nextSteps.push('Bewegung als Energie-Quelle, nicht als Belastung');
      break;
    default:
      nextSteps.push('Täglichen Check-in nicht vergessen');
      nextSteps.push('Eine kleine Gewohnheit konsistent durchhalten');
  }

  if (!biggestLever) {
    biggestLever = goal === 'fat_loss' ? 'Protein-Timing und Abendstruktur'
      : goal === 'muscle_gain' ? 'Progressive Überladung im Training'
      : goal === 'recomp' ? 'Kraft-Training + Protein-Konsistenz'
      : goal === 'energy_recovery' ? 'Schlaf-Qualität und Stress-Regulation'
      : 'Konsistenz in den Grundlagen';
  }

  // Determine level
  const maxScore = 8;
  const percent = (score / maxScore) * 100;
  let level: 'hoch' | 'mittel' | 'niedrig';
  let label: string;
  let explanation: string;

  if (percent >= 70) {
    level = 'hoch';
    label = 'Passt aktuell zu deinem Ziel';
    explanation = 'Dein Verhalten unterstützt dein Ziel. Weiter so — Konsistenz ist der Schlüssel.';
  } else if (percent >= 40) {
    level = 'mittel';
    label = 'Unterstützt dein Ziel teilweise';
    explanation = 'Es gibt konkrete Hebel, die dich schneller ans Ziel bringen würden.';
  } else {
    level = 'niedrig';
    label = 'Bremst dein Ziel aktuell eher aus';
    explanation = 'Dein aktuelles Verhalten arbeitet gegen dein Ziel. Fokussiere auf den einen größten Hebel.';
  }

  return { level, label, explanation, biggestLever, blockers: blockers.slice(0, 3), nextSteps: nextSteps.slice(0, 3) };
}

/* ═══ Weekly Focus ═══ */

export function calculateWeeklyFocus(
  goal: ZielGoal,
  pillarScores: PillarScores,
  goalFit: GoalFitResult,
): WeeklyFocus {
  const weakest = Object.entries(pillarScores).sort((a, b) => a[1] - b[1])[0];
  const labels: Record<string, string> = { bewegung: 'Bewegung', ernaehrung: 'Ernährung', regeneration: 'Regeneration', mental: 'Mentale Balance' };

  let focusArea = weakest[0];
  let focusLabel = labels[focusArea] || 'Bewegung';
  const actionItems: string[] = [];

  // Goal-specific override
  if (goal === 'fat_loss' && pillarScores.ernaehrung < 60) {
    focusArea = 'ernaehrung';
    focusLabel = 'Ernährung';
    actionItems.push('Protein-Ziel jeden Tag anvisieren');
    actionItems.push('Abendessen vor 20 Uhr planen');
    actionItems.push('Kalorienbereich einhalten — nicht zu tief, nicht zu hoch');
  } else if (goal === 'muscle_gain') {
    if (pillarScores.bewegung < 60) {
      focusArea = 'bewegung';
      focusLabel = 'Training';
      actionItems.push('Mindestens 3 Kraft-Einheiten diese Woche');
      actionItems.push('Progressive Überladung: +1 Rep oder +2.5kg');
    } else {
      actionItems.push('Protein auf 4 Mahlzeiten verteilen');
      actionItems.push('Schlaf: 7.5h+ jede Nacht');
    }
  } else if (goal === 'energy_recovery') {
    focusArea = 'regeneration';
    focusLabel = 'Regeneration';
    actionItems.push('Schlafenszeit-Konsistenz: ±30 Min');
    actionItems.push('Kein Bildschirm 1h vor dem Schlafen');
    actionItems.push('Moderate Bewegung statt Maximal-Training');
  } else {
    actionItems.push(`${focusLabel} ist aktuell dein schwächstes Feld`);
    actionItems.push(goalFit.biggestLever);
    if (goalFit.nextSteps[0]) actionItems.push(goalFit.nextSteps[0]);
  }

  return { focusArea, focusLabel, actionItems: actionItems.slice(0, 3) };
}

/* ═══ Longevity Meal Evaluation ═══ */

export function evaluateMealLongevity(
  mealDescription: string,
  proteinLevel: 'niedrig' | 'mittel' | 'hoch',
  mealType: string,
  goal: ZielGoal,
): LongevityMealEval {
  const desc = mealDescription.toLowerCase();
  const labels: string[] = [];

  // Protein quality
  const proteinQuality = proteinLevel === 'hoch' ? 'stark' : proteinLevel === 'mittel' ? 'mittel' : 'schwach';
  if (proteinQuality === 'stark') labels.push('Starker Proteinanker');

  // Satiety
  const hasFiber = /gemüse|salat|bohnen|linsen|hafer|vollkorn|avocado|nüsse|süßkartoffel/i.test(desc);
  const hasProtein = proteinLevel !== 'niedrig';
  const satietyValue = hasFiber && hasProtein ? 'hoch' : hasFiber || hasProtein ? 'mittel' : 'niedrig';
  if (satietyValue === 'hoch') labels.push('Gute Sättigungsbasis');

  // Processing level
  const processed = /pizza|burger|fast.?food|fertig|tiefkühl|chips|süßigkeit|schoko|kuchen|croissant|toast|weißbrot|nudeln|pommes|döner|kebab/i.test(desc);
  const wholefood = /eier|rührei|lachs|hähnchen|reis|kartoffel|gemüse|salat|quark|joghurt|haferflocken|linsen|bohnen|avocado/i.test(desc);
  const processingLevel = processed && !wholefood ? 'stark' : processed ? 'mittel' : 'gering';
  if (processingLevel === 'stark') labels.push('Eher stark verarbeitet');

  // Nutrient density
  const nutrientDensity = wholefood && hasFiber ? 'hoch' : wholefood || hasFiber ? 'mittel' : 'niedrig';

  // Energy stability
  const sugarSpike = /saft|cola|limo|süß|marmelade|honig|zucker|weißbrot|croissant/i.test(desc);
  const stableEnergy = hasProtein && hasFiber && !sugarSpike;
  const energyStability = stableEnergy ? 'stabil' : sugarSpike ? 'instabil' : 'mittel';

  // Longevity fit
  const longevityScore = (proteinQuality === 'stark' ? 2 : proteinQuality === 'mittel' ? 1 : 0)
    + (nutrientDensity === 'hoch' ? 2 : nutrientDensity === 'mittel' ? 1 : 0)
    + (processingLevel === 'gering' ? 2 : processingLevel === 'mittel' ? 1 : 0)
    + (energyStability === 'stabil' ? 1 : 0);
  const longevityFit = longevityScore >= 5 ? 'hoch' : longevityScore >= 3 ? 'mittel' : 'niedrig';
  labels.push(`Longevity-Fit: ${longevityFit}`);

  // Goal support
  let goalSupport: 'gut' | 'teilweise' | 'schwach';
  let goalSupportLabel: string;
  if (goal === 'fat_loss') {
    goalSupport = satietyValue === 'hoch' && proteinQuality !== 'schwach' ? 'gut'
      : satietyValue !== 'niedrig' ? 'teilweise' : 'schwach';
    goalSupportLabel = goalSupport === 'gut' ? 'Unterstützt dein Abnehmziel gut'
      : goalSupport === 'teilweise' ? 'Unterstützt dein Ziel teilweise'
      : 'Bremst dein Abnehmziel eher aus';
  } else if (goal === 'muscle_gain') {
    goalSupport = proteinQuality === 'stark' ? 'gut' : proteinQuality === 'mittel' ? 'teilweise' : 'schwach';
    goalSupportLabel = goalSupport === 'gut' ? 'Unterstützt Muskelaufbau gut'
      : goalSupport === 'teilweise' ? 'Mehr Protein würde helfen'
      : 'Zu wenig Protein für Muskelaufbau';
  } else {
    goalSupport = longevityFit === 'hoch' ? 'gut' : longevityFit === 'mittel' ? 'teilweise' : 'schwach';
    goalSupportLabel = goalSupport === 'gut' ? 'Unterstützt dein Ziel gut'
      : goalSupport === 'teilweise' ? 'Unterstützt dein Ziel teilweise'
      : 'Passt aktuell wenig zu deinem Ziel';
  }
  labels.push(goalSupportLabel);

  return {
    proteinQuality, satietyValue, nutrientDensity, processingLevel,
    energyStability, longevityFit, goalSupport, goalSupportLabel, labels,
  };
}

/* ═══ Map GoalPlan goalType to ZielGoal ═══ */

export function mapGoalTypeToZiel(goalType: string): ZielGoal {
  switch (goalType) {
    case 'fat_loss': return 'fat_loss';
    case 'training': case 'movement': return 'muscle_gain';
    case 'sleep': case 'recovery': case 'energy': return 'energy_recovery';
    case 'stress': case 'evening_routine': case 'morning_routine': return 'routine_building';
    default: return 'longevity';
  }
}

/* ═══ Daily Guidance ═══ */

export function getDailyGuidance(
  goal: ZielGoal,
  goalFit: GoalFitResult,
  todayCheckIn: DailyCheckIn | null,
  proteinPercent: number,
): string {
  if (goalFit.level === 'hoch') {
    return 'Dein Verhalten passt heute gut zu deinem Ziel. Halte den Kurs.';
  }

  if (goalFit.blockers.length > 0) {
    const blocker = goalFit.blockers[0];
    if (goal === 'fat_loss') {
      if (blocker.includes('Protein')) return `Für dein Abnehmziel ist aktuell nicht dein Training das Problem, sondern dein Protein-Timing. ${goalFit.biggestLever}.`;
      if (blocker.includes('Schlaf')) return 'Schlaf unter 7h erhöht Cortisol und Hunger-Hormone. Das arbeitet gegen dein Defizit.';
      if (blocker.includes('Stress')) return 'Hoher Stress triggert Comfort-Eating. Bau heute einen Stress-Puffer ein.';
    }
    if (goal === 'muscle_gain') {
      if (blocker.includes('Protein')) return 'Für Muskelaufbau ist dein Protein aktuell zu niedrig. Verteile 30g+ auf jede Mahlzeit.';
      if (blocker.includes('Konsistenz')) return 'Für Muskelaufbau ist Trainingsreiz-Regelmäßigkeit entscheidend. Jede versäumte Einheit kostet Fortschritt.';
    }
    return `Dein Verhalten passt im Moment nur teilweise zu deinem Ziel. Der größte Hebel ist: ${goalFit.biggestLever}.`;
  }

  return `Heute liegt der größte Hebel bei: ${goalFit.biggestLever}.`;
}
