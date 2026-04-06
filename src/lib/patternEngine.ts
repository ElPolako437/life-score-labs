import type { DailyCheckIn } from '@/contexts/AppContext';

export type PatternType = 'weekday_weakness' | 'pillar_correlation' | 'streak_effect' |
                          'recovery_pattern' | 'consistency_gain' | 'goal_blocker';

export interface Pattern {
  type: PatternType;
  title: string;
  description: string;
  confidence: number;
  daysSinceDetected: number;
}

export function detectPatterns(checkInHistory: DailyCheckIn[], goalPlan?: any): Pattern[] {
  const patterns: Pattern[] = [];
  if (checkInHistory.length < 7) return patterns;

  const last14 = checkInHistory.slice(-14);
  const last7 = checkInHistory.slice(-7);

  // ═══ WEEKDAY WEAKNESS ═══
  const dayScores: Record<number, number[]> = {};
  last14.forEach(ci => {
    const d = new Date(ci.date).getDay();
    if (!dayScores[d]) dayScores[d] = [];
    const avg = (ci.sleepQuality + (10 - ci.stress) + ci.mood + ci.energy) / 4;
    dayScores[d].push(avg);
  });
  const dayAvgs = Object.entries(dayScores)
    .filter(([_, scores]) => scores.length >= 2)
    .map(([day, scores]) => ({ day: Number(day), avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
    .sort((a, b) => a.avg - b.avg);
  if (dayAvgs.length >= 3 && dayAvgs[0].avg < dayAvgs[dayAvgs.length - 1].avg - 2) {
    const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    patterns.push({
      type: 'weekday_weakness',
      title: `${dayNames[dayAvgs[0].day]} ist dein schwächster Tag`,
      description: `Dein Durchschnitt am ${dayNames[dayAvgs[0].day]} liegt deutlich unter deinem besten Tag (${dayNames[dayAvgs[dayAvgs.length - 1].day]}).`,
      confidence: 0.75,
      daysSinceDetected: 0,
    });
  }

  // ═══ RECOVERY PATTERN (Training → Sleep) ═══
  const trainingDays = last14.filter(ci => ci.training);
  const restDays = last14.filter(ci => !ci.training);
  if (trainingDays.length >= 3 && restDays.length >= 3) {
    const trainSleep = trainingDays.reduce((s, ci) => s + ci.sleepQuality, 0) / trainingDays.length;
    const restSleep = restDays.reduce((s, ci) => s + ci.sleepQuality, 0) / restDays.length;
    if (Math.abs(trainSleep - restSleep) > 1) {
      const better = trainSleep > restSleep ? 'nach Training' : 'an Ruhetagen';
      patterns.push({
        type: 'recovery_pattern',
        title: `Besserer Schlaf ${better}`,
        description: `Schlafqualität ${better}: ${Math.round(Math.max(trainSleep, restSleep) * 10) / 10}/10 vs ${Math.round(Math.min(trainSleep, restSleep) * 10) / 10}/10.`,
        confidence: 0.7,
        daysSinceDetected: 0,
      });
    }
  }

  // ═══ CONSISTENCY GAIN ═══
  if (last7.length >= 7) {
    const prev7 = checkInHistory.slice(-14, -7);
    if (prev7.length >= 5) {
      const recentAvg = last7.reduce((s, ci) => s + ci.energy, 0) / last7.length;
      const prevAvg = prev7.reduce((s, ci) => s + ci.energy, 0) / prev7.length;
      if (recentAvg - prevAvg >= 1.5) {
        patterns.push({
          type: 'consistency_gain',
          title: 'Deine Energie steigt',
          description: `Durchschnittlich ${Math.round(recentAvg * 10) / 10}/10 diese Woche vs ${Math.round(prevAvg * 10) / 10}/10 letzte Woche.`,
          confidence: 0.8,
          daysSinceDetected: 0,
        });
      }
    }
  }

  // ═══ GOAL-SPEZIFISCHE MUSTER ═══
  if (goalPlan && checkInHistory.length >= 7) {
    const goalType = goalPlan.goalType;

    // Fat loss: Alkohol-Muster
    if (goalType === 'fat_loss') {
      const alcoholDays = last14.filter(ci => ci.alcohol);
      if (alcoholDays.length >= 3) {
        const alcoholDayNames = alcoholDays.map(ci => {
          const d = new Date(ci.date).getDay();
          return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d];
        });
        patterns.push({
          type: 'goal_blocker',
          title: 'Alkohol bremst dein Fettverlust-Ziel',
          description: `${alcoholDays.length}x Alkohol in 14 Tagen (${[...new Set(alcoholDayNames)].join(', ')}). Jedes Mal verzögert das den Fettabbau um ~2 Tage.`,
          confidence: 0.9,
          daysSinceDetected: 0,
        });
      }
    }

    // Sleep: Bildschirmzeit-Muster
    if (goalType === 'sleep' || goalType === 'recovery') {
      const screenDays = last14.filter(ci => ci.screenTimeNight);
      const noScreenDays = last14.filter(ci => !ci.screenTimeNight);
      if (screenDays.length >= 3 && noScreenDays.length >= 3) {
        const screenSleep = screenDays.reduce((s, ci) => s + ci.sleepQuality, 0) / screenDays.length;
        const noScreenSleep = noScreenDays.reduce((s, ci) => s + ci.sleepQuality, 0) / noScreenDays.length;
        if (noScreenSleep - screenSleep > 1) {
          patterns.push({
            type: 'goal_blocker',
            title: 'Bildschirm sabotiert deinen Schlaf',
            description: `An Abenden ohne Bildschirm: Schlafqualität ${Math.round(noScreenSleep * 10) / 10}/10. Mit Bildschirm: ${Math.round(screenSleep * 10) / 10}/10. Das ist dein #1 Hebel.`,
            confidence: 0.9,
            daysSinceDetected: 0,
          });
        }
      }
    }

    // Stress: Training → Stress Korrelation
    if (goalType === 'stress') {
      const trainDays = last14.filter(ci => ci.training);
      const noTrainDays = last14.filter(ci => !ci.training);
      if (trainDays.length >= 3 && noTrainDays.length >= 3) {
        const trainStress = trainDays.reduce((s, ci) => s + ci.stress, 0) / trainDays.length;
        const noTrainStress = noTrainDays.reduce((s, ci) => s + ci.stress, 0) / noTrainDays.length;
        if (noTrainStress - trainStress > 1) {
          patterns.push({
            type: 'goal_blocker',
            title: 'Training senkt deinen Stress',
            description: `Stress an Trainingstagen: ${Math.round(trainStress * 10) / 10}/10. Ohne Training: ${Math.round(noTrainStress * 10) / 10}/10. Training ist dein Stressventil.`,
            confidence: 0.85,
            daysSinceDetected: 0,
          });
        }
      }
    }

    // Energy: Schlaf → Energie Korrelation
    if (goalType === 'energy') {
      const lowEnergyDays = last14.filter(ci => ci.energy <= 4);
      if (lowEnergyDays.length >= 3) {
        const avgSleepOnLowEnergy = lowEnergyDays.reduce((s, ci) => s + ci.sleepHours, 0) / lowEnergyDays.length;
        patterns.push({
          type: 'goal_blocker',
          title: 'Deine Energie-Einbrüche haben ein Muster',
          description: `An den ${lowEnergyDays.length} Tagen mit niedriger Energie hattest du im Schnitt ${Math.round(avgSleepOnLowEnergy * 10) / 10}h Schlaf. Schlaf ist dein Energie-Hebel #1.`,
          confidence: 0.85,
          daysSinceDetected: 0,
        });
      }
    }
  }

  return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}
