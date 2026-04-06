import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import CompanionCreature from '@/components/app/CompanionCreature';
import { computeCompanionState } from '@/lib/companionState';
import { calculateLongevityScore } from '@/lib/scoring';
import type { PillarScores } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { Activity, Apple, Moon, Brain, Sparkles, CheckCircle2 } from 'lucide-react';
import { EXTENDED_GOAL_OPTIONS, type ExtendedGoal } from '@/lib/goalAssessment';

/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */

const GENDERS = [
  { value: 'männlich' as const, label: 'Männlich' },
  { value: 'weiblich' as const, label: 'Weiblich' },
  { value: 'divers' as const, label: 'Divers' },
];

const ENERGY_OPTIONS = [
  { value: 'erschöpft', label: 'Erschöpft', desc: 'Ich fühle mich dauerhaft leer' },
  { value: 'niedrig', label: 'Niedrig', desc: 'Ich komme durch, aber mit Mühe' },
  { value: 'okay', label: 'Okay', desc: 'Durchschnittlich, mal mehr mal weniger' },
  { value: 'gut', label: 'Gut', desc: 'Ich habe meistens genug Energie' },
  { value: 'vital', label: 'Vital', desc: 'Ich fühle mich klar und leistungsfähig' },
];

const BURDEN_OPTIONS = [
  { value: 'stress', label: 'Stress & mentale Erschöpfung' },
  { value: 'schlaf', label: 'Schlafmangel & fehlende Erholung' },
  { value: 'koerper', label: 'Körpergewicht & Körpergefühl' },
  { value: 'zeit', label: 'Fehlende Zeit & Routine' },
  { value: 'energie', label: 'Energie & Antrieb' },
  { value: 'ernaehrung', label: 'Ernährung & Essverhalten' },
];

const BALANCE_OPTIONS = [
  { value: 'kaum', label: 'Kaum', desc: 'Ich bin weit von meiner Balance entfernt' },
  { value: 'wenig', label: 'Wenig', desc: 'Ich spüre klare Defizite' },
  { value: 'mittel', label: 'Mittel', desc: 'Mal so, mal so' },
  { value: 'gut', label: 'Gut', desc: 'Ich bin weitgehend stabil' },
  { value: 'sehr_gut', label: 'Sehr gut', desc: 'Ich fühle mich im Gleichgewicht' },
];

const ACTIVITY_OPTIONS = [
  { value: 'kaum', label: 'Kaum aktiv', desc: 'Ich bewege mich sehr wenig' },
  { value: 'leicht', label: 'Leicht aktiv', desc: 'Gelegentlich, ohne feste Struktur' },
  { value: 'regelmaessig', label: 'Regelmäßig aktiv', desc: 'Mehrmals pro Woche' },
  { value: 'sehr', label: 'Sehr aktiv', desc: 'Bewegung und Sport sind fester Alltag' },
];

const STEPS_OPTIONS = [
  { value: 'u3000', label: 'Unter 3.000 Schritte' },
  { value: '3_6k', label: '3.000 – 6.000 Schritte' },
  { value: '6_9k', label: '6.000 – 9.000 Schritte' },
  { value: '9_12k', label: '9.000 – 12.000 Schritte' },
  { value: 'ue12k', label: 'Über 12.000 Schritte' },
];

const TRAINING_OPTIONS = [
  { value: '0x', label: 'Gar nicht' },
  { value: '1x', label: '1× pro Woche' },
  { value: '2_3x', label: '2–3× pro Woche' },
  { value: '4_5x', label: '4–5× pro Woche' },
  { value: '6x', label: '6× oder öfter' },
];

const NUTRITION_OPTIONS = [
  { value: 'sehr_unstrukturiert', label: 'Sehr unstrukturiert', desc: 'Ich esse meist, was greifbar ist' },
  { value: 'ausbaufähig', label: 'Ausbaufähig', desc: 'Ich versuche es, aber ohne Konsequenz' },
  { value: 'solide', label: 'Solide', desc: 'Ich achte auf das Wesentliche' },
  { value: 'sehr_bewusst', label: 'Sehr bewusst', desc: 'Ich ernähre mich gezielt und reflektiert' },
];

const PROCESSED_OPTIONS = [
  { value: 'fast_täglich', label: 'Fast täglich' },
  { value: 'mehrmals_woche', label: 'Mehrmals pro Woche' },
  { value: '1_2x_woche', label: '1–2× pro Woche' },
  { value: 'selten', label: 'Selten oder nie' },
];

const PROTEIN_OPTIONS = [
  { value: 'kaum', label: 'Kaum', desc: 'Protein spielt bei mir keine Rolle' },
  { value: 'manchmal', label: 'Manchmal', desc: 'Unregelmäßig und zufällig' },
  { value: 'oft', label: 'Oft', desc: 'Ich achte meistens darauf' },
  { value: 'konsequent', label: 'Konsequent', desc: 'Täglich fester Teil meiner Ernährung' },
];

const SLEEP_QUALITY_OPTIONS = [
  { value: 'sehr_schlecht', label: 'Sehr schlecht', desc: 'Ich fühle mich dauerhaft nicht erholt' },
  { value: 'ausbaufähig', label: 'Ausbaufähig', desc: 'Mein Schlaf ist unzuverlässig' },
  { value: 'okay', label: 'Okay', desc: 'Manchmal gut, manchmal nicht' },
  { value: 'gut', label: 'Gut', desc: 'Ich schlafe solide und erhole mich gut' },
];

const SLEEP_HOURS_OPTIONS = [
  { value: 'u5', label: 'Unter 5 Stunden' },
  { value: '5_6', label: '5–6 Stunden' },
  { value: '6_7', label: '6–7 Stunden' },
  { value: '7_8', label: '7–8 Stunden' },
  { value: 'ue8', label: 'Über 8 Stunden' },
];

const WAKE_OPTIONS = [
  { value: 'selten', label: 'Selten oder nie' },
  { value: 'manchmal', label: 'Manchmal', desc: 'Unregelmäßig' },
  { value: 'oft', label: 'Oft', desc: 'Meistens schon' },
  { value: 'fast_immer', label: 'Fast immer', desc: 'Ich starte energiegeladen' },
];

const MENTAL_OPTIONS = [
  { value: 'sehr_stark', label: 'Sehr stark', desc: 'Ich stehe dauerhaft unter Druck' },
  { value: 'erheblich', label: 'Erheblich', desc: 'Der Alltag fordert mich stark' },
  { value: 'mittel', label: 'Mittel', desc: 'Spürbar, aber handhabbar' },
  { value: 'kaum', label: 'Kaum', desc: 'Ich fühle mich mental stabil' },
];

const OVERWHELM_OPTIONS = [
  { value: 'fast_täglich', label: 'Fast täglich' },
  { value: 'mehrmals_woche', label: 'Mehrmals pro Woche' },
  { value: 'selten', label: 'Selten' },
  { value: 'kaum_nie', label: 'Kaum oder nie' },
];

const BREAKS_OPTIONS = [
  { value: 'kaum', label: 'Kaum', desc: 'Ich komme selten wirklich zur Ruhe' },
  { value: 'manchmal', label: 'Manchmal', desc: 'Unregelmäßig' },
  { value: 'regelmaessig', label: 'Regelmäßig', desc: 'Ich baue Pausen bewusst ein' },
  { value: 'täglich', label: 'Täglich', desc: 'Erholung ist fester Teil meines Alltags' },
];

const PILLAR_OPTIONS = [
  { value: 'bewegung', label: 'Bewegung & Körper', icon: Activity },
  { value: 'ernaehrung', label: 'Ernährung & Nährstoffe', icon: Apple },
  { value: 'regeneration', label: 'Schlaf & Erholung', icon: Moon },
  { value: 'mental', label: 'Mentale Balance', icon: Brain },
];

const PILLAR_LABELS: Record<string, string> = {
  bewegung: 'Bewegung', ernaehrung: 'Ernährung', regeneration: 'Regeneration', mental: 'Mentale Balance',
};

/* ═══════════════════════════════════════════
   GOAL-SPECIFIC FOLLOW-UP QUESTIONS
═══════════════════════════════════════════ */

const GOAL_FOLLOWUP: Record<string, Array<{ id: string; question: string; options: { value: string; label: string }[] }>> = {
  fat_loss: [
    { id: 'saboteur', question: 'Was sabotiert dich aktuell am meisten?', options: [
      { value: 'cravings', label: 'Heißhunger & spontane Snacks' },
      { value: 'no_routine', label: 'Fehlende Mahlzeitenstruktur' },
      { value: 'stress_eating', label: 'Stress- oder Emotionsessen' },
      { value: 'no_time', label: 'Keine Zeit zum Kochen' },
      { value: 'motivation', label: 'Motivationsverluste' },
    ]},
    { id: 'challenge', question: 'Was fällt dir dabei aktuell am schwersten?', options: [
      { value: 'tracking', label: 'Kalorien im Blick behalten' },
      { value: 'restriction', label: 'Auf Lieblingsessen verzichten' },
      { value: 'consistency', label: 'Konsequenz im Alltag' },
      { value: 'training', label: 'Das richtige Training finden' },
    ]},
  ],
  muscle_gain: [
    { id: 'limitation', question: 'Was limitiert dich aktuell am meisten?', options: [
      { value: 'protein', label: 'Zu wenig Protein in der Ernährung' },
      { value: 'no_plan', label: 'Kein strukturierter Trainingsplan' },
      { value: 'inconsistent', label: 'Unregelmäßiges Training' },
      { value: 'recovery', label: 'Fehlende Erholung zwischen Einheiten' },
      { value: 'no_progress', label: 'Kaum sichtbarer Fortschritt' },
    ]},
    { id: 'milestone', question: 'Was wäre diese Wochen realistisch und motivierend?', options: [
      { value: 'strength', label: 'Erste Kraftzuwächse spüren' },
      { value: 'consistency', label: 'Regelmäßig 3× pro Woche trainieren' },
      { value: 'visible', label: 'Sichtbare Veränderung am Körper' },
      { value: 'nutrition', label: 'Ernährung strukturieren und aufbauen' },
    ]},
  ],
  recomp: [
    { id: 'challenge', question: 'Was ist dabei aktuell deine größte Herausforderung?', options: [
      { value: 'protein_deficit', label: 'Genug Protein bei kontrollierter Kalorienzufuhr' },
      { value: 'coordination', label: 'Training und Ernährung koordinieren' },
      { value: 'patience', label: 'Geduld für langsame, nachhaltige Ergebnisse' },
      { value: 'muscle_retention', label: 'Muskelerhalt trotz Kaloriendefizit' },
    ]},
    { id: 'performance', question: 'Wie wichtig ist dir körperliche Leistungsfähigkeit dabei?', options: [
      { value: 'very', label: 'Sehr wichtig – ich will gleichzeitig stärker werden' },
      { value: 'balanced', label: 'Mittel – ich möchte beides in Balance halten' },
      { value: 'secondary', label: 'Eher sekundär – Aussehen steht im Vordergrund' },
    ]},
  ],
  sleep_improvement: [
    { id: 'sleep_problem', question: 'Was ist aktuell dein größtes Schlafproblem?', options: [
      { value: 'falling_asleep', label: 'Einschlafen dauert zu lang' },
      { value: 'staying_asleep', label: 'Ich wache nachts auf' },
      { value: 'early_wake', label: 'Ich wache zu früh auf' },
      { value: 'not_refreshed', label: 'Ich wache nicht erholt auf' },
      { value: 'irregular', label: 'Meine Schlafzeiten sind zu unregelmäßig' },
    ]},
    { id: 'sleep_burden', question: 'Was belastet deinen Schlaf aktuell am meisten?', options: [
      { value: 'thoughts', label: 'Gedanken & innere Unruhe' },
      { value: 'screen', label: 'Bildschirmzeit am Abend' },
      { value: 'caffeine', label: 'Koffein oder Alkohol' },
      { value: 'tension', label: 'Körperliche Anspannung' },
      { value: 'environment', label: 'Ungünstige Schlafumgebung' },
    ]},
  ],
  stress_reduction: [
    { id: 'stress_sign', question: 'Woran merkst du am stärksten, dass Stress dich belastet?', options: [
      { value: 'physical', label: 'Körperliche Anspannung oder Verspannung' },
      { value: 'sleep', label: 'Schlafprobleme durch Gedanken' },
      { value: 'mood', label: 'Reizbarkeit & Stimmungsschwankungen' },
      { value: 'focus', label: 'Konzentrationsprobleme' },
      { value: 'exhaustion', label: 'Erschöpfung & Antriebslosigkeit' },
    ]},
    { id: 'stress_trigger', question: 'Wann kippt es bei dir am häufigsten?', options: [
      { value: 'work', label: 'Im Berufsalltag' },
      { value: 'overload', label: 'Wenn zu viel auf einmal kommt' },
      { value: 'home', label: 'In der Freizeit & zu Hause' },
      { value: 'evening', label: 'Abends nach dem Tag' },
      { value: 'conflict', label: 'Bei zwischenmenschlichen Konflikten' },
    ]},
  ],
  energy_recovery: [
    { id: 'energy_sign', question: 'Woran merkst du am stärksten, dass dir Energie fehlt?', options: [
      { value: 'afternoon', label: 'Starkes Nachmittagstief' },
      { value: 'morning', label: 'Morgens schwer in den Tag kommen' },
      { value: 'focus', label: 'Konzentrationsprobleme' },
      { value: 'after_eating', label: 'Erschöpfung nach dem Essen' },
      { value: 'general', label: 'Grundlegende Antriebslosigkeit' },
    ]},
    { id: 'energy_drain', question: 'Was wirkt aktuell am stärksten als Energieräuber?', options: [
      { value: 'sleep', label: 'Schlechter oder zu kurzer Schlaf' },
      { value: 'stress', label: 'Dauerhafter Stress & Druck' },
      { value: 'nutrition', label: 'Ungünstige Ernährung' },
      { value: 'movement', label: 'Zu wenig Bewegung' },
      { value: 'social', label: 'Soziale oder mentale Belastung' },
    ]},
  ],
  routine_building: [
    { id: 'missing', question: 'Was fehlt dir aktuell am meisten?', options: [
      { value: 'sleep_times', label: 'Feste Schlafzeiten & Abendroutine' },
      { value: 'movement', label: 'Regelmäßige Bewegung im Alltag' },
      { value: 'nutrition', label: 'Strukturiertere Ernährung' },
      { value: 'me_time', label: 'Zeit und Raum für mich selbst' },
      { value: 'mental', label: 'Mentale Erdung & Stressausgleich' },
    ]},
    { id: 'valuable_routine', question: 'Welche Routine wäre gerade die wertvollste für dich?', options: [
      { value: 'morning', label: 'Eine klare Morgenroutine' },
      { value: 'nutrition', label: 'Eine gesunde Ernährungsroutine' },
      { value: 'training', label: 'Eine feste Trainingsroutine' },
      { value: 'evening', label: 'Eine bewusste Abendroutine' },
      { value: 'stress', label: 'Eine Stressmanagement-Routine' },
    ]},
  ],
};

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */

function estimatePillars(a: {
  activityLevel: string; dailySteps: string; trainingFrequency: string;
  nutritionQuality: string; processedFoodFreq: string; proteinFrequency: string;
  sleepQuality: string; sleepHours: string; wakeRefreshed: string;
  mentalBurden: string; overwhelmFreq: string; mentalBreaks: string;
}): PillarScores {
  const actMap: Record<string, number> = { kaum: 20, leicht: 42, regelmaessig: 65, sehr: 85 };
  const stepsMap: Record<string, number> = { u3000: 15, '3_6k': 35, '6_9k': 55, '9_12k': 75, ue12k: 90 };
  const trainMap: Record<string, number> = { '0x': 10, '1x': 28, '2_3x': 55, '4_5x': 78, '6x': 90 };
  const nutMap: Record<string, number> = { sehr_unstrukturiert: 15, ausbaufähig: 38, solide: 65, sehr_bewusst: 88 };
  const procMap: Record<string, number> = { fast_täglich: 10, mehrmals_woche: 32, '1_2x_woche': 65, selten: 92 };
  const protMap: Record<string, number> = { kaum: 15, manchmal: 38, oft: 68, konsequent: 90 };
  const slpQMap: Record<string, number> = { sehr_schlecht: 15, ausbaufähig: 35, okay: 58, gut: 82 };
  const slpHMap: Record<string, number> = { u5: 10, '5_6': 28, '6_7': 52, '7_8': 85, ue8: 72 };
  const wakeMap: Record<string, number> = { selten: 15, manchmal: 40, oft: 68, fast_immer: 90 };
  const mentMap: Record<string, number> = { sehr_stark: 15, erheblich: 35, mittel: 60, kaum: 85 };
  const ovMap: Record<string, number> = { fast_täglich: 10, mehrmals_woche: 30, selten: 65, kaum_nie: 90 };
  const brMap: Record<string, number> = { kaum: 15, manchmal: 38, regelmaessig: 68, täglich: 90 };

  const bew = (actMap[a.activityLevel] ?? 42) * 0.4 + (stepsMap[a.dailySteps] ?? 45) * 0.3 + (trainMap[a.trainingFrequency] ?? 40) * 0.3;
  const ern = (nutMap[a.nutritionQuality] ?? 42) * 0.4 + (procMap[a.processedFoodFreq] ?? 45) * 0.3 + (protMap[a.proteinFrequency] ?? 40) * 0.3;
  const reg = (slpQMap[a.sleepQuality] ?? 45) * 0.4 + (slpHMap[a.sleepHours] ?? 50) * 0.35 + (wakeMap[a.wakeRefreshed] ?? 42) * 0.25;
  const ment = (mentMap[a.mentalBurden] ?? 50) * 0.4 + (ovMap[a.overwhelmFreq] ?? 45) * 0.3 + (brMap[a.mentalBreaks] ?? 42) * 0.3;

  return {
    bewegung: Math.round(Math.min(100, Math.max(5, bew))),
    ernaehrung: Math.round(Math.min(100, Math.max(5, ern))),
    regeneration: Math.round(Math.min(100, Math.max(5, reg))),
    mental: Math.round(Math.min(100, Math.max(5, ment))),
  };
}

function getStrongestWeakest(p: PillarScores) {
  const entries = Object.entries(p).sort((a, b) => b[1] - a[1]);
  return { strongest: entries[0][0], weakest: entries[entries.length - 1][0] };
}

function getArchetype(avg: number): { title: string; subtitle: string } {
  if (avg >= 75) return { title: 'Auf Hochniveau', subtitle: 'Eine starke Basis — jetzt geht es ums Verfeinern.' };
  if (avg >= 60) return { title: 'Im Optimierungsmodus', subtitle: 'Gute Grundlage mit klaren Hebeln.' };
  if (avg >= 45) return { title: 'Im Aufbau', subtitle: 'Du hast Potenzial — wir wissen genau, wo.' };
  if (avg >= 30) return { title: 'Im Aufbruch', subtitle: 'Der richtige Fokus macht den entscheidenden Unterschied.' };
  return { title: 'Neustart', subtitle: 'Wir starten bei den Grundlagen — dem besten Ausgangspunkt.' };
}

function pillarLevel(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 70) return { label: 'stark', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' };
  if (score >= 50) return { label: 'gut', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' };
  if (score >= 32) return { label: 'mittel', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' };
  return { label: 'gering', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30' };
}

const HEBEL_MAP: Record<string, Record<string, string>> = {
  bewegung: {
    fat_loss: 'Mehr Bewegung verbrennt Kalorien und reduziert Heißhunger gleichzeitig — ein doppelter Hebel.',
    muscle_gain: 'Ohne strukturiertes Training ist Muskelaufbau biologisch nicht möglich — das ist dein primärer Hebel.',
    recomp: 'Training ist die Grundlage für Recomp — hier setzt alles andere an.',
    sleep_improvement: 'Regelmäßige Bewegung verbessert Schlafarchitektur messbar — ein oft unterschätzter Weg.',
    stress_reduction: 'Körperliche Aktivität ist eines der wirksamsten Gegenmittel gegen Stress.',
    energy_recovery: 'Bewegung steigert Energie dauerhaft — auch wenn es zunächst paradox klingt.',
    routine_building: 'Eine Bewegungsroutine zieht die meisten anderen Gewohnheiten nach sich.',
  },
  ernaehrung: {
    fat_loss: 'Ernährung ist verantwortlich für 80% des Fettabbau-Ergebnisses — hier liegt dein stärkster Hebel.',
    muscle_gain: 'Ohne ausreichend Protein und Kalorien findet Muskelaufbau einfach nicht statt.',
    recomp: 'Präzise Ernährung entscheidet bei Recomp über alles — sie ist nicht verhandelbar.',
    sleep_improvement: 'Ernährungsmuster beeinflussen die Schlafarchitektur direkt, besonders abends.',
    stress_reduction: 'Was du isst, beeinflusst deinen Cortisolspiegel — Ernährung ist Stressmanagement.',
    energy_recovery: 'Deine Ernährung ist wahrscheinlich der stärkste Energieräuber — hier liegt dein größter Gewinn.',
    routine_building: 'Eine Ernährungsroutine ist das Fundament fast aller anderen Gesundheitsgewohnheiten.',
  },
  regeneration: {
    fat_loss: 'Schlechter Schlaf erhöht Hunger und Heißhunger messbar — er sabotiert deinen Fettabbau stärker als du denkst.',
    muscle_gain: 'Muskelaufbau findet im Schlaf statt. Schlechter Schlaf löscht Trainingsfortschritt aus.',
    recomp: 'Regeneration entscheidet, ob dein Körper Muskeln auf- oder abbaut — der meistunterschätzte Faktor.',
    sleep_improvement: 'Schlaf ist dein erklärtes Ziel — hier liegt dein direktester und stärkster Hebel.',
    stress_reduction: 'Schlafmangel verstärkt Stress biologisch — ein Teufelskreis, den wir als erstes unterbrechen.',
    energy_recovery: 'Dein Schlaf ist wahrscheinlich der Hauptgrund deines Energiemangels.',
    routine_building: 'Eine feste Schlaf-Wach-Routine ist der Anker für alle anderen Gewohnheiten.',
  },
  mental: {
    fat_loss: 'Stress und emotionales Essen sabotieren mehr als schlechte Ernährung allein.',
    muscle_gain: 'Chronischer Stress erhöht Cortisol und hemmt Muskelaufbau direkt.',
    recomp: 'Mentale Balance beeinflusst die Hormone, die Fettabbau und Muskelaufbau steuern.',
    sleep_improvement: 'Gedanken und mentale Anspannung sind die häufigste Ursache für schlechten Schlaf.',
    stress_reduction: 'Mentale Balance ist dein erklärtes Ziel — hier liegt dein direkter Hebel.',
    energy_recovery: 'Mentaler Stress raubt mehr Energie als körperliche Belastung — das ist dein primärer Energieräuber.',
    routine_building: 'Mentale Entlastung schafft erst den Raum, in dem neue Gewohnheiten wachsen können.',
  },
};

const FOCUS_MAP: Record<string, Record<string, { title: string; steps: string[] }>> = {
  bewegung: {
    fat_loss: { title: '3× Bewegung diese Woche', steps: ['3 Trainingseinheiten einplanen', 'Schritte auf 7.000+ täglich erhöhen', 'Aktive Pausen in den Alltag einbauen'] },
    muscle_gain: { title: 'Trainingsplan starten', steps: ['3 Krafteinheiten pro Woche einplanen', 'Proteinzufuhr täglich tracken', 'Progressive Steigerung von Woche zu Woche'] },
    recomp: { title: 'Training & Ernährung koppeln', steps: ['3 Trainingseinheiten einplanen', 'Proteinzufuhr sicherstellen', 'Schritte auf 8.000+ täglich erhöhen'] },
    sleep_improvement: { title: 'Bewegung als Schlaf-Booster', steps: ['20+ Min Bewegung täglich einplanen', 'Kein intensives Training nach 19 Uhr', 'Abendspaziergang als Routine einführen'] },
    stress_reduction: { title: 'Bewegung als Stressventil', steps: ['3× 20 Min Bewegung pro Woche', 'Eine Sportart wählen, die Freude macht', 'Natur und frische Luft gezielt einbauen'] },
    energy_recovery: { title: 'Bewegung zur Energiegewinnung', steps: ['15 Min leichte Bewegung täglich', 'Schritte schrittweise aufbauen', 'Mittagsspaziergang statt Erschöpfung'] },
    routine_building: { title: 'Bewegungsroutine aufbauen', steps: ['Feste Trainingstage wählen (z.B. Mo/Mi/Fr)', 'Spaziergang nach dem Abendessen', 'Aktivität im Kalender blocken'] },
  },
  ernaehrung: {
    fat_loss: { title: 'Ernährung strukturieren', steps: ['Protein bei jeder Mahlzeit priorisieren', 'Verarbeitete Snacks bewusst reduzieren', 'Mahlzeiten vorplanen — mind. 1× täglich'] },
    muscle_gain: { title: 'Proteinzufuhr sichern', steps: ['Täglich 1,8–2g Protein/kg Körpergewicht', '3 proteinreiche Mahlzeiten planen', 'Post-Workout Protein einführen'] },
    recomp: { title: 'Protein & Kalorien kalibrieren', steps: ['Täglich 2g Protein/kg Körpergewicht anstreben', 'Leichtes Kaloriendefizit halten', 'Keine Mahlzeiten auslassen'] },
    sleep_improvement: { title: 'Ernährung für besseren Schlaf', steps: ['Koffein nach 14 Uhr meiden', 'Leichte Abendmahlzeit wählen', 'Alkohol deutlich reduzieren'] },
    stress_reduction: { title: 'Ernährung als Cortisol-Stabilisator', steps: ['Blutzucker mit Protein stabilisieren', 'Mahlzeiten nicht auslassen', 'Zuckerreiche Snacks gezielt ersetzen'] },
    energy_recovery: { title: 'Energie durch Ernährung', steps: ['Protein zum Frühstück priorisieren', 'Snacks mit Protein kombinieren', '2–2,5L Wasser täglich trinken'] },
    routine_building: { title: 'Ernährungsroutine starten', steps: ['3 feste Mahlzeiten täglich einplanen', 'Wochenplanung für Mahlzeiten einführen', 'Eine gesunde Mahlzeit täglich vorbereiten'] },
  },
  regeneration: {
    fat_loss: { title: 'Schlaf als Fettabbau-Booster', steps: ['7–8 Stunden Schlaf als Mindestziel', 'Bildschirm 60 Min vor Schlaf ausschalten', 'Feste Schlafzeiten einführen'] },
    muscle_gain: { title: 'Regeneration maximieren', steps: ['7–9 Stunden Schlaf priorisieren', 'Recovery-Tage aktiv einplanen', 'Vor-Schlaf Proteinmahlzeit einführen'] },
    recomp: { title: 'Erholung als Muskelschutz', steps: ['7+ Stunden Schlaf täglich', 'Kein Training an 2 aufeinanderfolgenden Tagen', 'Entspannungsritual vor dem Schlaf'] },
    sleep_improvement: { title: 'Schlaf systematisch verbessern', steps: ['Feste Einschlafzeit wählen und konsequent halten', 'Bildschirm 60 Min vor Schlaf vermeiden', 'Koffein ab 14 Uhr meiden'] },
    stress_reduction: { title: 'Erholung als Stress-Antidot', steps: ['7+ Stunden Schlaf als Fundament', 'Power-Naps von 15–20 Min nutzen', 'Aktive Entspannungszeit täglich einplanen'] },
    energy_recovery: { title: 'Schlaf als Energiequelle', steps: ['7–8 Stunden Schlaf priorisieren', 'Abendroutine ohne Bildschirm', 'Koffein nach 14 Uhr eliminieren'] },
    routine_building: { title: 'Schlaf als Anker-Routine', steps: ['Feste Schlaf- und Aufwachzeit etablieren', 'Entspannungsritual vor dem Einschlafen', 'Schlafumgebung optimieren (dunkel, kühl, ruhig)'] },
  },
  mental: {
    fat_loss: { title: 'Stress-Essen reduzieren', steps: ['Stressmomente erkennen, bevor gegessen wird', 'Alternative bei Stress: Atemübung oder Spaziergang', 'Emotionales Essen im Journal festhalten'] },
    muscle_gain: { title: 'Mentale Stabilität für Fortschritt', steps: ['Täglich 5 Min Entspannung einbauen', 'Stressspitzen mit Atemübungen unterbrechen', 'Fortschritts-Tagebuch führen'] },
    recomp: { title: 'Cortisol reduzieren', steps: ['Tägliche Entspannung gezielt einplanen', 'Überlastung in Training und Alltag vermeiden', 'Regeneration als echte Priorität setzen'] },
    sleep_improvement: { title: 'Gedanken zur Ruhe bringen', steps: ['Abend-Journaling (5 Min)', 'Entspannungsübung vor dem Schlafen', 'To-do-Liste abends schreiben — Kopf leeren'] },
    stress_reduction: { title: 'Stress aktiv regulieren', steps: ['Täglich 10 Min Stille oder Meditation', 'Stressspitzen erkennen und unterbrechen', 'Klare Grenzen im Alltag setzen'] },
    energy_recovery: { title: 'Mentalen Energieräuber stoppen', steps: ['10 Min tägliche Stille einplanen', 'Digitale Pausen einführen', 'Belastende Situationen bewusst reduzieren'] },
    routine_building: { title: 'Mentale Anker setzen', steps: ['Morgen- oder Abendreflexion (5 Min)', 'Täglich eine Sache tun, die Freude macht', '"Nein"-Sagen üben und Grenzen wahren'] },
  },
};

function mapActivityLevel(v: string): string {
  const m: Record<string, string> = { kaum: 'Wenig aktiv', leicht: 'Moderat aktiv', regelmaessig: 'Sehr aktiv', sehr: 'Sportlich' };
  return m[v] || 'Moderat aktiv';
}
function mapSleepQuality(v: string): string {
  const m: Record<string, string> = { sehr_schlecht: 'Schlecht', ausbaufähig: 'Mittel', okay: 'Gut', gut: 'Sehr gut' };
  return m[v] || 'Mittel';
}
function mapStressLevel(v: string): string {
  const m: Record<string, string> = { sehr_stark: 'Sehr hoch', erheblich: 'Hoch', mittel: 'Mittel', kaum: 'Niedrig' };
  return m[v] || 'Mittel';
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */

export default function AppOnboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { completeOnboarding, setGoalPlan, profile } = useApp();
  const [step, setStep] = useState(0);

  // Auth guard: must be signed in to onboard
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/app', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Already onboarded: skip to home
  useEffect(() => {
    if (!authLoading && user && profile.onboardingComplete) {
      navigate('/app/home', { replace: true });
    }
  }, [user, authLoading, profile.onboardingComplete, navigate]);

  // Phase 1 — welcome animation
  const [showLine1, setShowLine1] = useState(false);
  const [showLine2, setShowLine2] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  // Phase 2 — biometrics
  const [name, setName] = useState('');
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<'männlich' | 'weiblich' | 'divers'>('männlich');
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(80);
  const [hasTargetWeight, setHasTargetWeight] = useState<boolean | null>(null);
  const [targetWeight, setTargetWeight] = useState(75);

  // Phase 3 — global state
  const [currentEnergy, setCurrentEnergy] = useState('');
  const [mainBurden, setMainBurden] = useState('');
  const [balanceFeeling, setBalanceFeeling] = useState('');

  // Phase 4 — bewegung
  const [activityLevel, setActivityLevel] = useState('');
  const [dailySteps, setDailySteps] = useState('');
  const [trainingFrequency, setTrainingFrequency] = useState('');

  // Phase 5 — ernährung
  const [nutritionQuality, setNutritionQuality] = useState('');
  const [processedFoodFreq, setProcessedFoodFreq] = useState('');
  const [proteinFrequency, setProteinFrequency] = useState('');

  // Phase 6 — regeneration
  const [sleepQuality, setSleepQuality] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [wakeRefreshed, setWakeRefreshed] = useState('');

  // Phase 7 — mental
  const [mentalBurden, setMentalBurden] = useState('');
  const [overwhelmFreq, setOverwhelmFreq] = useState('');
  const [mentalBreaks, setMentalBreaks] = useState('');

  // Phase 8 — self-perception
  const [weakestPillar, setWeakestPillar] = useState('');
  const [strongestPillar, setStrongestPillar] = useState('');

  // Phase 9 — goal
  const [primaryGoal, setPrimaryGoal] = useState('');

  // Phase 10 — goal follow-up
  const [goalQ1, setGoalQ1] = useState('');
  const [goalQ2, setGoalQ2] = useState('');

  // Phase 11 — analysis animation
  const [analysisStep, setAnalysisStep] = useState(-1);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    if (step === 0) {
      const t1 = setTimeout(() => setShowLine1(true), 1500);
      const t2 = setTimeout(() => setShowLine2(true), 2500);
      const t3 = setTimeout(() => setShowCTA(true), 3500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [step]);

  useEffect(() => {
    if (step === 25) {
      setAnalysisStep(-1);
      setAnalysisComplete(false);
      const timers = [
        setTimeout(() => setAnalysisStep(0), 400),
        setTimeout(() => setAnalysisStep(1), 1100),
        setTimeout(() => setAnalysisStep(2), 1800),
        setTimeout(() => setAnalysisStep(3), 2500),
        setTimeout(() => setAnalysisComplete(true), 3400),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [step]);

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  // Derived values
  const estimatedPillars = useMemo(() => estimatePillars({
    activityLevel, dailySteps, trainingFrequency,
    nutritionQuality, processedFoodFreq, proteinFrequency,
    sleepQuality, sleepHours, wakeRefreshed,
    mentalBurden, overwhelmFreq, mentalBreaks,
  }), [activityLevel, dailySteps, trainingFrequency, nutritionQuality, processedFoodFreq, proteinFrequency, sleepQuality, sleepHours, wakeRefreshed, mentalBurden, overwhelmFreq, mentalBreaks]);

  const avgPillarScore = useMemo(() => {
    const vals = Object.values(estimatedPillars);
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  }, [estimatedPillars]);

  const { strongest: computedStrongest, weakest: computedWeakest } = useMemo(
    () => getStrongestWeakest(estimatedPillars),
    [estimatedPillars]
  );

  const effectiveWeakest = weakestPillar || computedWeakest;
  const archetype = useMemo(() => getArchetype(avgPillarScore), [avgPillarScore]);
  const estimatedScore = useMemo(() => calculateLongevityScore(estimatedPillars), [estimatedPillars]);
  const bmi = useMemo(() => (weight / ((height / 100) ** 2)).toFixed(1), [height, weight]);

  const dimState = useMemo(() => computeCompanionState(25, { bewegung: 25, ernaehrung: 25, regeneration: 25, mental: 25 }, null, 0, 0), []);
  const companionState = useMemo(() => computeCompanionState(estimatedScore, estimatedPillars, null, 0, 0), [estimatedScore, estimatedPillars]);

  const goalFollowUpQuestions = primaryGoal ? (GOAL_FOLLOWUP[primaryGoal] || []) : [];
  const goalLabel = EXTENDED_GOAL_OPTIONS.find(g => g.type === primaryGoal)?.label || primaryGoal;

  // Auth guard: render nothing while redirecting
  if (authLoading || !user) return null;

  const finish = () => {
    localStorage.setItem('caliness_consent', 'true');
    completeOnboarding({
      name: name.trim() || 'User',
      goals: primaryGoal ? [primaryGoal] : [],
      gender, age, height, weight,
      activityLevel: mapActivityLevel(activityLevel),
      sleepQuality: mapSleepQuality(sleepQuality),
      stressLevel: mapStressLevel(mentalBurden),
    });
    setGoalPlan(prev => ({
      goalType: primaryGoal,
      goalDescription: '',
      targetDate: '',
      targetWeeks: 12,
      createdAt: new Date().toISOString(),
      weeklyPlan: null,
      realismResult: null,
      completedBlocks: prev?.completedBlocks || [],
      remindersEnabled: prev?.remindersEnabled || false,
      secondaryGoal: '',
      followUpAnswers: {
        baseline: {
          target_weight: hasTargetWeight ? targetWeight : null,
          current_energy: currentEnergy,
          main_burden: mainBurden,
          balance_feeling: balanceFeeling,
          daily_steps: dailySteps,
          training_frequency: trainingFrequency,
          nutrition_quality: nutritionQuality,
          processed_food_freq: processedFoodFreq,
          protein_frequency: proteinFrequency,
          sleep_hours: sleepHours,
          wake_refreshed: wakeRefreshed,
          overwhelm_frequency: overwhelmFreq,
          mental_break_frequency: mentalBreaks,
          weakest_pillar: weakestPillar,
          strongest_pillar: strongestPillar,
        },
        goal_specific: {
          q1: goalQ1,
          q2: goalQ2,
        },
      },
      pillarAssessment: estimatedPillars,
    }));
    navigate('/app/zielsystem');
  };

  /* ═══════════════════════════════════════════
     RENDERS
  ═══════════════════════════════════════════ */

  // Step 0 — CALI Welcome
  if (step === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full bg-primary/4 blur-[160px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm text-center">
          <img src="/images/caliness-logo-white.png" alt="" className="w-8 h-8 object-contain opacity-30" />
          <div className="transition-all duration-[3000ms] ease-out" style={{ opacity: showLine1 ? 1 : 0.2, transform: showLine1 ? 'scale(1)' : 'scale(0.93)' }}>
            <CompanionCreature companionState={showCTA ? companionState : dimState} size={200} interactive={false} />
          </div>
          <div className="space-y-3 min-h-[80px]">
            <p className={cn('text-xl font-outfit font-semibold text-foreground transition-all duration-1000', showLine1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3')}>
              Hallo. Ich bin CALI.
            </p>
            <p className={cn('text-sm text-muted-foreground leading-relaxed transition-all duration-1000', showLine2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3')}>
              Dein persönlicher Begleiter für Gesundheit, Energie und Vitalität.
            </p>
          </div>
          <div className={cn('w-full transition-all duration-700', showCTA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
            <Button variant="premium" size="lg" className="w-full" onClick={next}>
              Lass uns beginnen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1 — 4-Pillar Promise
  if (step === 1) {
    const pillars = [
      { icon: Activity, label: 'Bewegung' },
      { icon: Apple, label: 'Ernährung' },
      { icon: Moon, label: 'Regeneration' },
      { icon: Brain, label: 'Mentale Balance' },
    ];
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[400px] h-[400px] rounded-full bg-primary/4 blur-[140px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm w-full text-center">
          <div className="space-y-2">
            <p className="text-xs text-primary font-semibold tracking-widest uppercase">CALINESS Analyse</p>
            <h1 className="font-outfit text-2xl font-bold text-foreground leading-tight">
              Deine ganzheitliche<br />Analyse beginnt jetzt.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              Wir bewerten deinen Ist-Zustand über 4 Säulen, erkennen deine stärksten Hebel und erstellen deinen ersten persönlichen Fokus.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            {pillars.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl border border-border/40 bg-card/60 p-4 flex flex-col items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>

          <Button variant="premium" size="lg" className="w-full" onClick={next}>
            Profil aufbauen
          </Button>
        </div>
      </div>
    );
  }

  // Step 2 — Name, Age, Gender
  if (step === 2) {
    return (
      <div className="min-h-screen bg-background flex flex-col px-6 py-8">
        <OnboardingProgress step={step} />
        <div className="flex-1 flex flex-col justify-center gap-8 max-w-sm mx-auto w-full">
          <div>
            <p className="text-xs text-primary font-semibold tracking-widest uppercase mb-4">Biometrisches Profil</p>
            <h2 className="font-outfit text-xl font-bold text-foreground">Wie darf ich dich nennen?</h2>
          </div>
          <div className="space-y-6">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Dein Vorname"
              className="w-full bg-card border border-border/50 rounded-xl px-4 py-3.5 text-base font-medium text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
            />
            <div>
              <label className="text-sm text-muted-foreground block mb-3">Alter</label>
              <div className="flex items-center gap-4">
                <span className="font-outfit text-3xl font-bold text-foreground w-14 tabular-nums">{age}</span>
                <Slider value={[age]} onValueChange={v => setAge(v[0])} min={18} max={75} step={1} className="flex-1" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-3">Geschlecht</label>
              <div className="flex gap-2">
                {GENDERS.map(g => (
                  <button key={g.value} onClick={() => setGender(g.value)}
                    className={cn('flex-1 rounded-xl border py-3 text-sm font-medium transition-all',
                      gender === g.value ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 bg-card text-foreground hover:border-primary/30'
                    )}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <NavButtons onBack={back} onNext={next} />
      </div>
    );
  }

  // Step 3 — Height & Weight
  if (step === 3) {
    return (
      <div className="min-h-screen bg-background flex flex-col px-6 py-8">
        <OnboardingProgress step={step} />
        <div className="flex-1 flex flex-col justify-center gap-8 max-w-sm mx-auto w-full">
          <div>
            <p className="text-xs text-primary font-semibold tracking-widest uppercase mb-4">Biometrisches Profil</p>
            <h2 className="font-outfit text-xl font-bold text-foreground">Deine Körpermaße</h2>
          </div>
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-sm text-muted-foreground">Körpergröße</span>
                <span className="font-outfit text-2xl font-bold text-foreground">{height} cm</span>
              </div>
              <Slider value={[height]} onValueChange={v => setHeight(v[0])} min={150} max={210} step={1} />
            </div>
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-sm text-muted-foreground">Körpergewicht</span>
                <span className="font-outfit text-2xl font-bold text-foreground">{weight} kg</span>
              </div>
              <Slider value={[weight]} onValueChange={v => setWeight(v[0])} min={40} max={160} step={1} />
            </div>
            <div className="rounded-xl border border-border/30 bg-card/60 p-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">BMI</span>
              <span className="text-sm font-semibold text-foreground">{bmi}</span>
            </div>
          </div>
        </div>
        <NavButtons onBack={back} onNext={next} />
      </div>
    );
  }

  // Step 4 — Target Weight
  if (step === 4) {
    return (
      <div className="min-h-screen bg-background flex flex-col px-6 py-8">
        <OnboardingProgress step={step} />
        <div className="flex-1 flex flex-col justify-center gap-8 max-w-sm mx-auto w-full">
          <div>
            <p className="text-xs text-primary font-semibold tracking-widest uppercase mb-4">Biometrisches Profil</p>
            <h2 className="font-outfit text-xl font-bold text-foreground">Möchtest du ein Zielgewicht angeben?</h2>
            <p className="text-sm text-muted-foreground mt-2">Optional — hilft uns, deinen Plan präziser zu gestalten.</p>
          </div>
          <div className="space-y-3">
            {[
              { v: true, label: 'Ja, ich habe ein konkretes Ziel' },
              { v: false, label: 'Noch nicht — ich bleibe offen' },
            ].map(o => (
              <button key={String(o.v)} onClick={() => setHasTargetWeight(o.v)}
                className={cn('w-full rounded-xl border px-4 py-3.5 text-left transition-all',
                  hasTargetWeight === o.v ? 'border-primary bg-primary/10' : 'border-border/50 bg-card hover:border-primary/30'
                )}>
                <span className={cn('text-sm font-medium', hasTargetWeight === o.v ? 'text-primary' : 'text-foreground')}>{o.label}</span>
              </button>
            ))}
          </div>
          {hasTargetWeight && (
            <div className="space-y-3">
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm text-muted-foreground">Zielgewicht</span>
                <span className="font-outfit text-2xl font-bold text-foreground">{targetWeight} kg</span>
              </div>
              <Slider value={[targetWeight]} onValueChange={v => setTargetWeight(v[0])} min={40} max={160} step={1} />
            </div>
          )}
        </div>
        <NavButtons onBack={back} onNext={next} nextDisabled={hasTargetWeight === null} />
      </div>
    );
  }

  // Steps 5–21 — single-select question screens
  const singleSelectStep = renderSingleSelectStep(step, {
    back, next,
    currentEnergy, setCurrentEnergy,
    mainBurden, setMainBurden,
    balanceFeeling, setBalanceFeeling,
    activityLevel, setActivityLevel,
    dailySteps, setDailySteps,
    trainingFrequency, setTrainingFrequency,
    nutritionQuality, setNutritionQuality,
    processedFoodFreq, setProcessedFoodFreq,
    proteinFrequency, setProteinFrequency,
    sleepQuality, setSleepQuality,
    sleepHours, setSleepHours,
    wakeRefreshed, setWakeRefreshed,
    mentalBurden, setMentalBurden,
    overwhelmFreq, setOverwhelmFreq,
    mentalBreaks, setMentalBreaks,
    weakestPillar, setWeakestPillar,
    strongestPillar, setStrongestPillar,
  });
  if (singleSelectStep) return singleSelectStep;

  // Step 22 — Goal Selection
  if (step === 22) {
    return (
      <div className="min-h-screen bg-background flex flex-col px-6 py-8">
        <OnboardingProgress step={step} />
        <div className="mb-6">
          <p className="text-xs text-primary font-semibold tracking-widest uppercase mb-2">Dein Ziel</p>
          <h2 className="font-outfit text-xl font-bold text-foreground">Was möchtest du in den nächsten Wochen am meisten verbessern?</h2>
        </div>
        <div className="flex-1 flex flex-col gap-2.5">
          {EXTENDED_GOAL_OPTIONS.map(g => {
            const selected = primaryGoal === g.type;
            return (
              <button key={g.type} onClick={() => setPrimaryGoal(g.type)}
                className={cn('rounded-xl border p-4 flex items-center gap-3 text-left transition-all duration-200',
                  selected ? 'border-primary bg-primary/10' : 'border-border/50 bg-card hover:border-primary/30'
                )}>
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', selected ? 'bg-primary/20' : 'bg-secondary')}>
                  <span className="text-xl">{g.emoji}</span>
                </div>
                <div>
                  <span className={cn('text-sm font-semibold', selected ? 'text-primary' : 'text-foreground')}>{g.label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
        <NavButtons onBack={back} onNext={next} nextDisabled={!primaryGoal} nextLabel="Weiter" />
      </div>
    );
  }

  // Step 23 — Goal Q1
  if (step === 23 && goalFollowUpQuestions[0]) {
    const q = goalFollowUpQuestions[0];
    return (
      <QuestionScreen
        step={step} onBack={back} onNext={next}
        sectionLabel="Ziel-Analyse"
        question={q.question}
        options={q.options}
        value={goalQ1}
        onChange={setGoalQ1}
      />
    );
  }

  // Step 24 — Goal Q2
  if (step === 24 && goalFollowUpQuestions[1]) {
    const q = goalFollowUpQuestions[1];
    return (
      <QuestionScreen
        step={step} onBack={back} onNext={next}
        sectionLabel="Ziel-Analyse"
        question={q.question}
        options={q.options}
        value={goalQ2}
        onChange={setGoalQ2}
      />
    );
  }

  // If no follow-up questions for this goal, skip to 25
  if (step === 23 || step === 24) {
    setStep(25);
    return null;
  }

  // Step 25 — Analysis Animation
  if (step === 25) {
    const analysisLines = [
      'Wir analysieren deinen Ist-Zustand über 4 Säulen …',
      'Wir erkennen deine stärksten Hebel …',
      'Wir verbinden deinen Zustand mit deinem Ziel …',
      'Dein CALINESS Profil ist bereit.',
    ];
    const PillarIcons = [Activity, Apple, Moon, Brain];
    const pillarKeys: (keyof PillarScores)[] = ['bewegung', 'ernaehrung', 'regeneration', 'mental'];

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[400px] h-[400px] rounded-full bg-primary/5 blur-[130px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-10 max-w-sm w-full">
          <CompanionCreature
            companionState={analysisComplete ? companionState : dimState}
            size={140}
            interactive={false}
          />
          <div className="w-full space-y-4">
            {pillarKeys.map((key, i) => {
              const Icon = PillarIcons[i];
              const active = analysisStep >= i;
              const score = estimatedPillars[key];
              return (
                <div key={key} className={cn('transition-all duration-600', active ? 'opacity-100' : 'opacity-20')}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={cn('w-3.5 h-3.5', active ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="text-xs text-muted-foreground">{analysisLines[i]}</span>
                  </div>
                  <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: active ? `${score}%` : '0%', boxShadow: active ? '0 0 8px hsl(142 76% 46% / 0.5)' : 'none' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {analysisComplete && (
            <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
              <p className="text-sm font-semibold text-foreground text-center">Dein CALINESS Profil ist bereit.</p>
              <Button variant="premium" className="w-full" onClick={next}>
                Ergebnis ansehen
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 26 — Result
  if (step === 26) {
    const pillarOrder: (keyof PillarScores)[] = ['bewegung', 'ernaehrung', 'regeneration', 'mental'];
    const pillarIcons = [Activity, Apple, Moon, Brain];
    const hebelText = HEBEL_MAP[effectiveWeakest]?.[primaryGoal] || `${PILLAR_LABELS[effectiveWeakest]} ist aktuell dein stärkster Hebel.`;
    const focus = FOCUS_MAP[effectiveWeakest]?.[primaryGoal] || { title: 'Erster Fokus', steps: ['Einen Bereich auswählen', 'Täglich 10 Minuten einplanen'] };

    return (
      <div className="min-h-screen bg-background flex flex-col px-6 py-8 overflow-y-auto relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 max-w-sm mx-auto w-full">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-primary font-semibold tracking-widest uppercase">Dein CALINESS Profil</p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">Stand: {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <CompanionCreature companionState={companionState} size={64} compact interactive={false} />
          </div>

          {/* Archetype */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-primary font-bold tracking-widest uppercase">Profil</span>
            </div>
            <p className="font-outfit text-2xl font-bold text-foreground">{archetype.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{archetype.subtitle}</p>
          </div>

          {/* Pillar Scores */}
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase mb-3">Säulen-Status</p>
            <div className="grid grid-cols-4 gap-2">
              {pillarOrder.map((key, i) => {
                const Icon = pillarIcons[i];
                const score = estimatedPillars[key];
                const level = pillarLevel(score);
                return (
                  <div key={key} className={cn('rounded-xl border p-3 flex flex-col items-center gap-1.5', level.bg, level.border)}>
                    <Icon className={cn('w-4 h-4', level.color)} />
                    <span className={cn('font-outfit text-xl font-bold', level.color)}>{score}</span>
                    <span className={cn('text-[9px] font-medium', level.color)}>{level.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strongest / Weakest */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
              <p className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase mb-1">Stärkste Säule</p>
              <p className="text-sm font-semibold text-foreground">{PILLAR_LABELS[computedStrongest]}</p>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
              <p className="text-[9px] text-amber-400 font-bold tracking-widest uppercase mb-1">Größter Hebel</p>
              <p className="text-sm font-semibold text-foreground">{PILLAR_LABELS[effectiveWeakest]}</p>
            </div>
          </div>

          {/* Goal */}
          {goalLabel && (
            <div className="rounded-xl border border-border/40 bg-card/60 p-4">
              <p className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase mb-1">Dein Ziel</p>
              <p className="text-sm font-semibold text-foreground">{goalLabel}</p>
            </div>
          )}

          {/* Größter Hebel */}
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
            <p className="text-[9px] text-amber-400 font-bold tracking-widest uppercase mb-2">Warum das dein Hebel ist</p>
            <p className="text-sm text-foreground leading-relaxed">{hebelText}</p>
          </div>

          {/* First Week Focus */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-[9px] text-primary font-bold tracking-widest uppercase mb-2">Erster Wochenfokus</p>
            <p className="text-sm font-semibold text-foreground mb-3">{focus.title}</p>
            <div className="space-y-2">
              {focus.steps.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 opacity-40 pb-2">
            <img src="/images/caliness-logo-white.png" alt="" className="w-5 h-5 object-contain" />
            <span className="text-[10px] text-muted-foreground font-medium tracking-wider">CALINESS · Deine Longevity Reise beginnt</span>
          </div>

          <Button variant="premium" size="lg" className="w-full glow-neon" onClick={finish}>
            Plan einrichten
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════
   SINGLE-SELECT STEP ROUTER (Steps 5–21)
═══════════════════════════════════════════ */

function renderSingleSelectStep(step: number, s: any) {
  const configs: Record<number, { sectionLabel?: string; question: string; hint?: string; options: any[]; value: string; setter: (v: string) => void; pillarOptions?: boolean }> = {
    5: { sectionLabel: 'Aktueller Zustand', question: 'Wie würdest du deinen aktuellen Energiezustand beschreiben?', options: ENERGY_OPTIONS, value: s.currentEnergy, setter: s.setCurrentEnergy },
    6: { question: 'Was belastet dich aktuell am meisten?', options: BURDEN_OPTIONS, value: s.mainBurden, setter: s.setMainBurden },
    7: { question: 'Wie sehr bist du aktuell insgesamt in Balance?', options: BALANCE_OPTIONS, value: s.balanceFeeling, setter: s.setBalanceFeeling },
    8: { sectionLabel: 'Säulen — Bewegung & Körper', question: 'Wie würdest du deine körperliche Aktivität aktuell einschätzen?', options: ACTIVITY_OPTIONS, value: s.activityLevel, setter: s.setActivityLevel },
    9: { question: 'Wie viele Schritte machst du an einem typischen Tag?', options: STEPS_OPTIONS, value: s.dailySteps, setter: s.setDailySteps },
    10: { question: 'Wie oft trainierst du aktuell pro Woche?', options: TRAINING_OPTIONS, value: s.trainingFrequency, setter: s.setTrainingFrequency },
    11: { sectionLabel: 'Säulen — Ernährung & Nährstoffe', question: 'Wie würdest du deine Ernährung aktuell einschätzen?', options: NUTRITION_OPTIONS, value: s.nutritionQuality, setter: s.setNutritionQuality },
    12: { question: 'Wie oft isst du stark verarbeitete Lebensmittel?', hint: 'Fertiggerichte, Fast Food, zuckerreiche Snacks', options: PROCESSED_OPTIONS, value: s.processedFoodFreq, setter: s.setProcessedFoodFreq },
    13: { question: 'Wie regelmäßig deckst du deinen Proteinbedarf?', options: PROTEIN_OPTIONS, value: s.proteinFrequency, setter: s.setProteinFrequency },
    14: { sectionLabel: 'Säulen — Schlaf & Erholung', question: 'Wie gut sind Schlaf und Erholung bei dir aktuell?', options: SLEEP_QUALITY_OPTIONS, value: s.sleepQuality, setter: s.setSleepQuality },
    15: { question: 'Wie viele Stunden schläfst du durchschnittlich pro Nacht?', options: SLEEP_HOURS_OPTIONS, value: s.sleepHours, setter: s.setSleepHours },
    16: { question: 'Wie oft wachst du morgens wirklich erholt auf?', options: WAKE_OPTIONS, value: s.wakeRefreshed, setter: s.setWakeRefreshed },
    17: { sectionLabel: 'Säulen — Mentale Balance', question: 'Wie belastet fühlst du dich mental im Alltag?', options: MENTAL_OPTIONS, value: s.mentalBurden, setter: s.setMentalBurden },
    18: { question: 'Wie oft fühlst du dich im Alltag wirklich überfordert?', options: OVERWHELM_OPTIONS, value: s.overwhelmFreq, setter: s.setOverwhelmFreq },
    19: { question: 'Wie oft hast du echte Pausen oder mentale Entlastung?', options: BREAKS_OPTIONS, value: s.mentalBreaks, setter: s.setMentalBreaks },
    20: { sectionLabel: 'Deine Selbstwahrnehmung', question: 'Welcher dieser Bereiche fällt dir aktuell am schwersten?', options: PILLAR_OPTIONS, value: s.weakestPillar, setter: s.setWeakestPillar, pillarOptions: true },
    21: { question: 'Und welcher Bereich läuft bei dir aktuell am besten?', options: PILLAR_OPTIONS.filter(p => p.value !== s.weakestPillar), value: s.strongestPillar, setter: s.setStrongestPillar, pillarOptions: true },
  };

  const config = configs[step];
  if (!config) return null;

  return (
    <QuestionScreen
      step={step}
      onBack={s.back}
      onNext={s.next}
      sectionLabel={config.sectionLabel}
      question={config.question}
      hint={config.hint}
      options={config.options}
      value={config.value}
      onChange={config.setter}
      pillarOptions={config.pillarOptions}
    />
  );
}

/* ═══════════════════════════════════════════
   HELPER COMPONENTS
═══════════════════════════════════════════ */

function OnboardingProgress({ step }: { step: number }) {
  const progress = Math.max(4, ((step - 1) / 23) * 100);
  const phaseLabel =
    step <= 4 ? 'Biometrisches Profil' :
    step <= 7 ? 'Aktueller Zustand' :
    step <= 10 ? 'Säulen — Bewegung' :
    step <= 13 ? 'Säulen — Ernährung' :
    step <= 16 ? 'Säulen — Regeneration' :
    step <= 19 ? 'Säulen — Mentale Balance' :
    step <= 21 ? 'Selbstwahrnehmung' :
    'Dein Ziel';

  return (
    <div className="mb-7">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] text-primary/70 font-semibold tracking-widest uppercase">{phaseLabel}</span>
        <span className="text-[10px] text-muted-foreground/40">{Math.round(progress)}%</span>
      </div>
      <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, boxShadow: '0 0 6px hsl(142 76% 46% / 0.4)' }}
        />
      </div>
    </div>
  );
}

function QuestionScreen({ step, onBack, onNext, sectionLabel, question, hint, options, value, onChange, pillarOptions }: {
  step: number; onBack: () => void; onNext: () => void;
  sectionLabel?: string; question: string; hint?: string;
  options: { value: string; label: string; desc?: string; icon?: any }[];
  value: string; onChange: (v: string) => void;
  pillarOptions?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <OnboardingProgress step={step} />
      {sectionLabel && (
        <p className="text-xs text-primary font-semibold tracking-widest uppercase mb-3">{sectionLabel}</p>
      )}
      <h2 className="font-outfit text-lg font-bold text-foreground mb-1">{question}</h2>
      {hint && <p className="text-xs text-muted-foreground mb-1">{hint}</p>}
      <div className="flex-1 flex flex-col gap-2.5 mt-5">
        {options.map((o) => {
          const selected = value === o.value;
          const Icon = (o as any).icon;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                'rounded-xl border px-4 py-3.5 text-left transition-all duration-200 flex items-center gap-3',
                selected ? 'border-primary bg-primary/10' : 'border-border/50 bg-card hover:border-primary/30'
              )}
            >
              {pillarOptions && Icon && (
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', selected ? 'bg-primary/20' : 'bg-secondary')}>
                  <Icon className={cn('w-4 h-4', selected ? 'text-primary' : 'text-muted-foreground')} />
                </div>
              )}
              <div>
                <span className={cn('text-sm font-medium', selected ? 'text-primary' : 'text-foreground')}>{o.label}</span>
                {o.desc && <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex gap-3 pt-6">
        <Button variant="outline" onClick={onBack} className="flex-1">Zurück</Button>
        <Button variant="premium" onClick={onNext} className="flex-1" disabled={!value}>Weiter</Button>
      </div>
    </div>
  );
}

function NavButtons({ onBack, onNext, nextDisabled, nextLabel }: {
  onBack: () => void; onNext: () => void; nextDisabled?: boolean; nextLabel?: string;
}) {
  return (
    <div className="flex gap-3 pt-6">
      <Button variant="outline" onClick={onBack} className="flex-1">Zurück</Button>
      <Button variant="premium" onClick={onNext} className="flex-1" disabled={nextDisabled}>{nextLabel || 'Weiter'}</Button>
    </div>
  );
}
