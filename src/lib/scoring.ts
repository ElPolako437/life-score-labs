import type { DailyCheckIn, PillarScores, NutritionLogEntry, ActivityLog } from '@/contexts/AppContext';
import { calculateLongevityNutritionScore } from '@/lib/longevityNutrition';

export function calculatePillarScores(
  checkIn: DailyCheckIn,
  todayNutritionLogs?: NutritionLogEntry[],
  nutritionTargets?: { calorieMin: number; calorieMax: number; proteinTarget: number },
  todayActivityLog?: ActivityLog[],
): PillarScores {
  // ═══ BEWEGUNG ═══
  // A logged workout is semantically equivalent to checkIn.training=true — both mean "I trained today"
  const hasMovementLog = !!(todayActivityLog?.some(l => l.pillar === 'bewegung'));
  const trainingScore = (checkIn.training || hasMovementLog) ? 30 : 0;
  const stepsScore = Math.min(checkIn.steps / 10000, 1) * 40;
  const recoveryBewegung = (checkIn.recovery / 10) * 30;
  // Additional bonus from duration/intensity details of logged workouts
  const intensityMultiplier = (intensity?: string) =>
    intensity === 'intensiv' ? 1.5 : intensity === 'leicht' ? 0.7 : 1.0;
  let bewegungBonus = 0;
  if (todayActivityLog) {
    const movementLogs = todayActivityLog.filter(l => l.pillar === 'bewegung');
    bewegungBonus = Math.min(15, movementLogs.length * 5 + movementLogs.reduce((s, l) => s + Math.min(5, (l.duration || 0) / 20 * intensityMultiplier(l.intensity)), 0));
  }
  const bewegung = Math.round(Math.min(trainingScore + stepsScore + recoveryBewegung + bewegungBonus, 100));

  // ═══ ERNÄHRUNG ═══
  const proteinMap: Record<string, number> = { schlecht: 10, okay: 35, gut: 60, sehr_gut: 85 };
  const hydrationMap: Record<string, number> = { wenig: 10, okay: 35, gut: 65, sehr_gut: 90 };
  const alcoholPenalty = checkIn.alcohol ? -20 : 0;

  let ernaehrung: number;
  if (todayNutritionLogs && todayNutritionLogs.length >= 2 && nutritionTargets) {
    const longevityResult = calculateLongevityNutritionScore(
      todayNutritionLogs, nutritionTargets.calorieMin, nutritionTargets.calorieMax, nutritionTargets.proteinTarget
    );
    const feelingScore = (proteinMap[checkIn.proteinQuality] ?? 35) * 0.5 + (hydrationMap[checkIn.hydration] ?? 35) * 0.5;
    ernaehrung = Math.round(Math.max(0, Math.min(feelingScore * 0.5 + longevityResult.score * 0.5 + alcoholPenalty, 100)));
  } else if (todayNutritionLogs && todayNutritionLogs.length >= 2) {
    const totalProtein = todayNutritionLogs.reduce((s, l) => s + l.estimatedProteinTotal, 0);
    const proteinTarget = 130;
    const proteinPct = Math.min(1, totalProtein / proteinTarget);
    const actualScore = proteinPct * 85;
    const feelingScore = (proteinMap[checkIn.proteinQuality] ?? 35) * 0.5 + (hydrationMap[checkIn.hydration] ?? 35) * 0.5;
    ernaehrung = Math.round(Math.max(0, Math.min(actualScore * 0.6 + feelingScore * 0.4 + alcoholPenalty, 100)));
  } else {
    const proteinScore = proteinMap[checkIn.proteinQuality] ?? 35;
    const hydrationScore = hydrationMap[checkIn.hydration] ?? 35;
    ernaehrung = Math.round(Math.max(0, Math.min((proteinScore * 0.5 + hydrationScore * 0.5 + alcoholPenalty), 100)));
  }
  // Bonus from nutrition logging activity
  if (todayActivityLog) {
    const nutritionLogs = todayActivityLog.filter(l => l.pillar === 'ernaehrung');
    if (nutritionLogs.length > 0) ernaehrung = Math.min(100, ernaehrung + Math.min(10, nutritionLogs.length * 3));
  }

  // ═══ REGENERATION ═══
  const sleepHoursScore = checkIn.sleepHours >= 7 && checkIn.sleepHours <= 9 ? 40 : checkIn.sleepHours >= 6 ? 25 : 10;
  const sleepQualityScore = (checkIn.sleepQuality / 10) * 35;
  const recoveryScore = (checkIn.recovery / 10) * 25;
  let regenBonus = 0;
  if (todayActivityLog) {
    const recoveryLogs = todayActivityLog.filter(l => l.pillar === 'regeneration');
    regenBonus = Math.min(15, recoveryLogs.length * 5 + recoveryLogs.reduce((s, l) => s + Math.min(5, (l.duration || 0) / 15), 0));
  }
  const regeneration = Math.round(Math.min(sleepHoursScore + sleepQualityScore + recoveryScore + regenBonus, 100));

  // ═══ MENTAL ═══
  const stressInverse = ((10 - checkIn.stress) / 10) * 40;
  const moodScore = (checkIn.mood / 10) * 35;
  const screenPenalty = checkIn.screenTimeNight ? -10 : 0;
  const energyBonus = (checkIn.energy / 10) * 25;
  let mentalBonus = 0;
  if (todayActivityLog) {
    const mentalLogs = todayActivityLog.filter(l => l.pillar === 'mental');
    mentalBonus = Math.min(15, mentalLogs.length * 5 + mentalLogs.reduce((s, l) => s + Math.min(5, (l.duration || 0) / 10), 0));
  }
  const mental = Math.round(Math.max(0, Math.min(stressInverse + moodScore + energyBonus + screenPenalty + mentalBonus, 100)));

  return { bewegung, ernaehrung, regeneration, mental };
}

export function calculateLongevityScore(pillars: PillarScores): number {
  const weights = { bewegung: 0.25, ernaehrung: 0.25, regeneration: 0.25, mental: 0.25 };
  return Math.round(
    pillars.bewegung * weights.bewegung +
    pillars.ernaehrung * weights.ernaehrung +
    pillars.regeneration * weights.regeneration +
    pillars.mental * weights.mental
  );
}

/**
 * 7-day weighted rolling longevity score.
 * Today = 40%, last 6 days = [18, 13, 10, 8, 6, 5]%
 */
export function calculateRollingLongevityScore(
  checkInHistory: DailyCheckIn[],
  todayCheckIn: DailyCheckIn | null,
  todayActivityLog?: ActivityLog[],
  todayNutritionLogs?: NutritionLogEntry[],
  nutritionTargets?: { calorieMin: number; calorieMax: number; proteinTarget: number },
): number {
  const WEIGHTS = [40, 18, 13, 10, 8, 6, 5];
  const last7 = todayCheckIn
    ? [todayCheckIn, ...checkInHistory.slice(-6).reverse()]
    : checkInHistory.slice(-7).reverse();

  if (last7.length === 0) return 50;

  let totalWeight = 0;
  let weightedScore = 0;

  last7.forEach((checkIn, i) => {
    const w = WEIGHTS[i] || 3;
    // Pass today's activity/nutrition logs only for the first entry (today)
    const isToday = i === 0 && todayCheckIn;
    const actLog = isToday && todayActivityLog ? todayActivityLog : undefined;
    const nutLogs = isToday && todayNutritionLogs ? todayNutritionLogs : undefined;
    const nutTargets = isToday && nutritionTargets ? nutritionTargets : undefined;
    const pillars = calculatePillarScores(checkIn, nutLogs, nutTargets, actLog);
    const dayScore = calculateLongevityScore(pillars);
    weightedScore += dayScore * w;
    totalWeight += w;
  });

  return Math.round(weightedScore / totalWeight);
}

export function getProfileLevel(score: number): 'Foundation' | 'Awakening' | 'Momentum' | 'Mastery' {
  if (score >= 80) return 'Mastery';
  if (score >= 60) return 'Momentum';
  if (score >= 40) return 'Awakening';
  return 'Foundation';
}

export function getProfileDescription(level: string): string {
  const descriptions: Record<string, string> = {
    Foundation: 'Du stehst am Anfang deiner Longevity-Reise. Es gibt großes Potenzial für Verbesserungen in allen Bereichen.',
    Awakening: 'Du hast erste gute Gewohnheiten etabliert. Jetzt geht es darum, Konsistenz aufzubauen.',
    Momentum: 'Du bist auf einem starken Weg. Deine Routinen zeigen bereits messbare Wirkung.',
    Mastery: 'Beeindruckend. Du lebst auf einem hohen Niveau biologischer Optimierung.',
  };
  return descriptions[level] || descriptions.Foundation;
}

export function getBioAgeDirection(score: number): string {
  if (score >= 75) return 'jünger als das chronologische Alter';
  if (score >= 45) return 'ungefähr auf dem chronologischen Alter';
  return 'älter als das chronologische Alter';
}

export function getScoreExplanation(checkIn: DailyCheckIn, pillars: PillarScores): string {
  const weakest = Object.entries(pillars).sort((a, b) => a[1] - b[1])[0];
  const pillarNames: Record<string, string> = {
    bewegung: 'Bewegung', ernaehrung: 'Ernährung',
    regeneration: 'Regeneration', mental: 'Mentale Balance',
  };
  const reasons: string[] = [];
  if (checkIn.sleepQuality <= 4) reasons.push('niedrige Schlafqualität');
  if (checkIn.stress >= 7) reasons.push('hoher Stress');
  if (!checkIn.training) reasons.push('kein Training');
  if (checkIn.alcohol) reasons.push('Alkoholkonsum');
  if (reasons.length === 0) reasons.push('solide Werte in allen Bereichen');
  return `Dein Score wird heute vor allem beeinflusst durch: ${reasons.join(', ')}. Dein schwächster Bereich ist ${pillarNames[weakest[0]]}.`;
}

export function getQuickRecommendation(
  checkIn: DailyCheckIn,
  pillars: PillarScores,
  goalPlan?: any,
): string {
  const weakest = Object.entries(pillars).sort((a, b) => a[1] - b[1])[0][0];

  if (goalPlan?.goalType) {
    const gt = goalPlan.goalType;
    if (gt === 'fat_loss' && checkIn.alcohol)
      return 'Heute Alkohol — morgen extra auf Protein und Hydration achten. Dein Fettverlust-Ziel verlangt Konsistenz.';
    if (gt === 'sleep' && checkIn.sleepHours < 6)
      return 'Unter 6 Stunden — heute Abend alles dafür tun: kein Bildschirm ab 20 Uhr, früh ins Bett.';
    if (gt === 'stress' && checkIn.stress >= 7)
      return 'Hoher Stress trotz Ziel. Heute: Eine bewusste 5-Minuten Atempause. Nicht mehr, nicht weniger.';
    if (gt === 'energy' && checkIn.energy <= 4)
      return 'Niedrige Energie. Für dein Ziel jetzt: Proteinreiche Mahlzeit, 20 Min Tageslicht, heute früh schlafen.';
  }

  const recs: Record<string, string> = {
    bewegung: '20 Minuten Spazierengehen oder leichtes Training würden deinen Score heute am meisten verbessern.',
    ernaehrung: 'Fokussiere dich auf eine proteinreiche Mahlzeit und trinke mindestens 2 Liter Wasser.',
    regeneration: 'Geh heute 30 Minuten früher ins Bett und verzichte auf Bildschirmzeit vor dem Schlafen.',
    mental: 'Eine 10-minütige Atemübung oder ein Spaziergang in der Natur können deinen Stress sofort senken.',
  };
  return recs[weakest] || recs.bewegung;
}
