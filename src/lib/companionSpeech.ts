import type { PillarScores, DailyCheckIn } from '@/contexts/AppContext';
import type { PillarKey } from '@/lib/focusPillar';

const PILLAR_LABELS: Record<string, string> = {
  bewegung: 'Bewegung',
  ernaehrung: 'Ernährung',
  regeneration: 'Regeneration',
  mental: 'Mentale Balance',
};

function computeGoalAdherence(goalPlan: any): number {
  if (!goalPlan?.weeklyPlan?.weeklyBlocks) return 0;
  const total = goalPlan.weeklyPlan.weeklyBlocks.reduce((s: number, d: any) => s + (d.blocks?.length || 0), 0);
  const done = goalPlan.weeklyPlan.weeklyBlocks.reduce((s: number, d: any) => s + (d.blocks?.filter((b: any) => b.completed).length || 0), 0);
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

// ═══ TIME-AWARE COACHING TIPS ═══
const FOCUS_MORNING_TIPS: Record<PillarKey, string[]> = {
  ernaehrung: [
    'Starte heute mit 30g Protein zum Frühstück — das setzt den Anker für den ganzen Tag.',
    'Ein gutes Frühstück entscheidet den Tag. Protein + Gemüse = Energie.',
    'Wasser zuerst, dann Protein. Dein Stoffwechsel dankt es dir.',
  ],
  bewegung: [
    '10 Minuten Morgenbewegung wecken dein System besser als Kaffee.',
    'Ein kurzer Walk am Morgen setzt den Ton für den Tag.',
    'Dein Körper will sich bewegen — starte leicht.',
  ],
  regeneration: [
    'Wie war deine Nacht? Die Morgenroutine entscheidet über den nächsten Schlaf.',
    'Tageslicht in den ersten 30 Minuten verbessert deinen nächsten Schlaf.',
    'Ruhiger Morgen = besserer Tag. Nimm dir 5 Minuten Stille.',
  ],
  mental: [
    '2 Minuten Atmen am Morgen verändert den ganzen Tag.',
    'Setze eine Intention für heute — nur eine Sache.',
    'Morgenroutine ist Mentaltraining. Starte bewusst.',
  ],
};

const FOCUS_MIDDAY_NUDGES: Record<PillarKey, string[]> = {
  ernaehrung: [
    'Mittagszeit — achte auf Protein und Gemüse.',
    'Deine Fokus-Aktion steht noch aus. Jetzt wäre ein guter Moment für eine bewusste Mahlzeit.',
  ],
  bewegung: [
    'Dein Training steht noch aus. Jetzt wäre ein guter Moment.',
    'Kurze Bewegungspause? Schon 10 Minuten machen den Unterschied.',
  ],
  regeneration: [
    'Mitte des Tages — ein kurzer Moment Ruhe tut gut.',
    'Kurze Pause einplanen. Dein Körper regeneriert auch tagsüber.',
  ],
  mental: [
    'Dein Mental-Block steht noch aus. 5 Minuten reichen.',
    'Halbzeit. Atme kurz durch — es macht einen Unterschied.',
  ],
};

const EVENING_GOOD_TRACKING: string[] = [
  'Starker Tag — gut getrackt. Gönn dir eine gute Nacht.',
  'Dein Einsatz heute war sichtbar. Jetzt ausruhen.',
  'Klasse Tag. Der Trend zeigt nach oben.',
];

const EVENING_NO_TRACKING: string[] = [
  'Heute war ruhig. Morgen ist ein neuer Tag.',
  'Kein Druck. Manchmal braucht der Körper eine Pause.',
  'Morgen starten wir frisch. Schlaf gut.',
];

function getLastTipId(): string | null {
  try { return localStorage.getItem('caliness_last_tip_id'); } catch { return null; }
}

function setLastTipId(id: string) {
  try { localStorage.setItem('caliness_last_tip_id', id); } catch { /* ignore */ }
}

function pickTip(tips: string[], prefix: string): string {
  const lastId = getLastTipId();
  let available = tips.map((t, i) => ({ text: t, id: `${prefix}_${i}` }));
  if (lastId) available = available.filter(t => t.id !== lastId);
  if (available.length === 0) available = tips.map((t, i) => ({ text: t, id: `${prefix}_${i}` }));
  const pick = available[Math.floor(Math.random() * available.length)];
  setLastTipId(pick.id);
  return pick.text;
}

// ═══ TRACKING REACTION SPEECHES ═══
const TRACKING_REACTIONS: Record<PillarKey, Record<string, string[]>> = {
  bewegung: {
    workout: [
      'Training geloggt! Dein Körper dankt dir.',
      'Bewegung drin — dein System fährt hoch.',
      'Training erledigt. Das spürst du morgen positiv.',
    ],
    focus: [
      'Fokus-Aufgabe erledigt. Das war das Wichtigste heute.',
      'Bewegungs-Fokus ✓ — Hauptsache erledigt.',
    ],
    mini: [
      'Kleine Schritte, große Wirkung.',
      'Mini-Bewegung ✓ — zählt alles.',
    ],
  },
  ernaehrung: {
    meal: [
      'Mahlzeit drin. Weiter so.',
      'Gute Entscheidung. Dein Körper verarbeitet.',
      'Mahlzeit geloggt — Ernährung im Griff.',
    ],
    focus: [
      'Ernährungs-Fokus erledigt. Das war der wichtigste Schritt.',
      'Fokus-Aktion ✓ — Ernährung auf Kurs.',
    ],
    mini: [
      'Ernährungs-Mini ✓ — Kleine Schritte, große Wirkung.',
      'Geloggt. Jeder bewusste Bissen zählt.',
    ],
  },
  regeneration: {
    recovery: [
      'Recovery geloggt. Dein System erholt sich.',
      'Regeneration aktiv — dein Körper baut auf.',
      'Gut gemacht. Erholung ist Training.',
    ],
    focus: [
      'Recovery-Fokus erledigt. Das spürt man morgen.',
      'Fokus ✓ — Dein Körper dankt dir.',
    ],
    mini: [
      'Recovery-Mini ✓ — Kleine Pausen, große Wirkung.',
      'Mini-Recovery geloggt. Alles zählt.',
    ],
  },
  mental: {
    mental: [
      'Mental gestärkt. Das spürt man morgen.',
      'Mentale Übung erledigt — der Kopf ist klarer.',
      'Mental-Training ✓ — du investierst in dich.',
    ],
    focus: [
      'Mental-Fokus erledigt. Das war das Wichtigste heute.',
      'Fokus ✓ — Kopf und Körper im Einklang.',
    ],
    mini: [
      'Mental-Mini ✓ — Kleine Schritte, große Wirkung.',
      'Geloggt. Dein Geist baut Stärke auf.',
    ],
  },
};

const PROTEIN_REACTIONS = [
  'Protein fast am Ziel — {current}g von {target}g. Stark.',
  '{current}g Protein heute — {target}g ist das Ziel. Du bist dran.',
];

const FIRST_ACTION_REACTIONS = [
  'Erster Schritt heute — das zählt am meisten.',
  'Tag gestartet. Der erste Schritt ist der wichtigste.',
  'Los geht\'s! Erster Track heute ✓.',
];

const THREE_ACTIONS_REACTIONS = [
  '3 Aktivitäten heute. Du baust Momentum auf.',
  'Drei drin — dein Rhythmus stimmt.',
  '3 Tracks heute. Das Muster wird sichtbar.',
];

const ALL_DONE_REACTIONS = [
  'Alles erledigt! Perfekter Tag.',
  'Tagesziel erreicht — du hast alles gegeben.',
  'Vollständig! Dein System dankt es dir.',
];

export function getTrackingReaction(
  pillar: PillarKey,
  type: 'focus' | 'mini' | 'workout' | 'meal' | 'recovery' | 'mental',
  todayProtein?: number,
  proteinTarget?: number,
  miniLabel?: string,
): string {
  // Special protein reaction for meals
  if (pillar === 'ernaehrung' && type === 'meal' && todayProtein && proteinTarget) {
    if (todayProtein >= proteinTarget * 0.8) {
      const tpl = PROTEIN_REACTIONS[Math.floor(Math.random() * PROTEIN_REACTIONS.length)];
      return tpl.replace('{current}', String(Math.round(todayProtein))).replace('{target}', String(Math.round(proteinTarget)));
    }
  }

  const typeKey = type === 'workout' ? 'workout' : type === 'meal' ? 'meal' : type === 'recovery' ? 'recovery' : type === 'mental' ? 'mental' : type;
  const reactions = TRACKING_REACTIONS[pillar]?.[typeKey] || TRACKING_REACTIONS[pillar]?.['mini'] || ['Geloggt ✓'];
  const pick = reactions[Math.floor(Math.random() * reactions.length)];

  if (miniLabel && type === 'mini') {
    return `${miniLabel} ✓ — Kleine Schritte, große Wirkung.`;
  }

  return pick;
}

export function getMilestoneReaction(todayActionCount: number): string | null {
  if (todayActionCount === 1) {
    return FIRST_ACTION_REACTIONS[Math.floor(Math.random() * FIRST_ACTION_REACTIONS.length)];
  }
  if (todayActionCount === 3) {
    return THREE_ACTIONS_REACTIONS[Math.floor(Math.random() * THREE_ACTIONS_REACTIONS.length)];
  }
  return null;
}

export function getAllDoneReaction(): string {
  return ALL_DONE_REACTIONS[Math.floor(Math.random() * ALL_DONE_REACTIONS.length)];
}

export function getCompanionSpeech(
  score: number,
  pillarScores: PillarScores,
  todayCheckIn: DailyCheckIn | null,
  streak: number,
  scoreTrend: 'up' | 'down' | 'stable',
  scoreHistory: { score: number }[],
  allBlocksDone: boolean,
  goalPlan?: any,
  blockJustCompleted?: { label: string; completedCount: number; totalBlocks: number },
  todayProtein?: number,
  proteinTarget?: number,
  previousPillarScores?: PillarScores,
  trackedPillarCount?: number,
  focusPillar?: PillarKey,
  focusActionDone?: boolean,
): string {
  const entries = Object.entries(pillarScores).sort((a, b) => a[1] - b[1]);
  const weakest = entries[0][0];
  const weakestScore = entries[0][1];
  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  const activeFocus = focusPillar || (weakest as PillarKey);

  // ═══ HIGH-PRIORITY CONDITIONS ═══

  // Block just completed
  if (blockJustCompleted) {
    return `Erledigt! ${blockJustCompleted.label} abgehakt. ${blockJustCompleted.completedCount}/${blockJustCompleted.totalBlocks} heute geschafft.`;
  }

  // Protein tracking > 80%
  if (todayProtein && proteinTarget && todayProtein >= proteinTarget * 0.8) {
    return `Protein fast am Ziel — ${todayProtein}g von ${proteinTarget}g. Stark.`;
  }

  // Weakest pillar improved by 5+ points
  if (previousPillarScores) {
    const pillarKeys = Object.keys(pillarScores) as (keyof PillarScores)[];
    const weakestKey = pillarKeys.reduce((w, k) => previousPillarScores[k] < previousPillarScores[w] ? k : w, pillarKeys[0]);
    const improvement = pillarScores[weakestKey] - previousPillarScores[weakestKey];
    if (improvement >= 5) {
      return `${PILLAR_LABELS[weakestKey]} wird besser. Dein Fokus zahlt sich aus.`;
    }
  }

  // ═══ TIME-AWARE COACHING TIPS ═══

  // Morning (before 10:00) and no tracking yet
  if (hour < 10 && (trackedPillarCount === undefined || trackedPillarCount === 0) && !todayCheckIn) {
    return pickTip(FOCUS_MORNING_TIPS[activeFocus], `morning_${activeFocus}`);
  }

  // Midday (12:00-14:00) and focus action not done
  if (hour >= 12 && hour < 14 && !focusActionDone && !allBlocksDone) {
    return pickTip(FOCUS_MIDDAY_NUDGES[activeFocus], `midday_${activeFocus}`);
  }

  // Evening (after 19:00) and good tracking day
  if (hour >= 19 && trackedPillarCount !== undefined && trackedPillarCount >= 2) {
    return pickTip(EVENING_GOOD_TRACKING, 'evening_good');
  }

  // Evening and nothing tracked
  if (hour >= 19 && (trackedPillarCount === undefined || trackedPillarCount === 0) && !todayCheckIn) {
    return pickTip(EVENING_NO_TRACKING, 'evening_none');
  }

  // ═══ GOAL-AWARE CONDITIONS ═══
  if (goalPlan?.weeklyPlan) {
    const goalAdherence = computeGoalAdherence(goalPlan);
    const goalDesc = goalPlan.goalDescription || 'Dein Ziel';

    if (goalAdherence >= 80) {
      return `${goalDesc}: ${goalAdherence}% umgesetzt. Du bist auf Kurs.`;
    }

    if (goalPlan.targetDate) {
      const remaining = Math.ceil((new Date(goalPlan.targetDate).getTime() - Date.now()) / 86400000);
      if (remaining > 0 && remaining <= 7) {
        return `Letzte Woche deines ${goalDesc}-Plans. ${goalAdherence}% geschafft. Lass uns stark abschließen.`;
      }
    }

    if (goalPlan.targetDate && goalPlan.createdAt) {
      const totalDays = Math.ceil((new Date(goalPlan.targetDate).getTime() - new Date(goalPlan.createdAt).getTime()) / 86400000);
      const elapsed = Math.ceil((Date.now() - new Date(goalPlan.createdAt).getTime()) / 86400000);
      if (elapsed >= totalDays * 0.45 && elapsed <= totalDays * 0.55) {
        return `Halbzeit bei deinem ${goalDesc}-Ziel. ${goalAdherence}% geschafft. Die zweite Hälfte zählt.`;
      }
    }

    if (goalAdherence < 30 && goalAdherence > 0) {
      return `Dein Plan ist da — ${goalAdherence}% umgesetzt. Heute ein Block reicht. Starte klein.`;
    }
  }

  // ═══ EXISTING CONDITIONS ═══

  if (todayCheckIn && todayCheckIn.sleepHours < 5) {
    return 'Wenig Schlaf, aber du bist hier. Das zählt.';
  }

  if (allBlocksDone) {
    return 'Alles erledigt heute. Dein System dankt es dir.';
  }

  if (streak >= 7) {
    return `Tag ${streak}. Dein Rhythmus wird zu einer echten Gewohnheit.`;
  }

  if (scoreHistory.length >= 3) {
    const last3 = scoreHistory.slice(-3);
    const allUp = last3.every((s, i) => i === 0 || s.score >= last3[i - 1].score);
    if (allUp && scoreTrend === 'up') {
      return 'Ich spüre, wie sich etwas verändert. Dein Trend ist klar positiv.';
    }
  }

  if (weakest === 'regeneration' && weakestScore < 50) {
    return 'Regeneration ist gerade dein größter Hebel. Heute Abend früher zur Ruhe.';
  }

  if (dayOfWeek === 1) {
    return 'Neue Woche. Lass uns mit dem Wichtigsten starten.';
  }

  if (todayCheckIn && todayCheckIn.stress > 7) {
    return 'Hoher Druck gerade. Ein bewusster Atemzug reicht als erster Schritt.';
  }

  // Default by time of day
  if (hour < 12) return 'Guten Morgen. Lass uns sehen, wie der Tag wird.';
  if (hour < 18) return 'Wie läuft der Tag? CALI passt auf.';
  return 'Der Tag klingt aus. Zeit für dich.';
}
