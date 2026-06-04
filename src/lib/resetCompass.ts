import type { Goal, Hurdle, BaselineData } from '@/contexts/ResetContext';

export type CompassPillar = 'ernährung' | 'bewegung' | 'schlaf' | 'mental';
export type CompassType = 'dauerstress' | 'fundament' | 'muster';

export interface CompassResult {
  weakestDimension: keyof BaselineData;
  weakestDimensionLabel: string;
  focusPillar: CompassPillar;
  pillarLabel: string;
  compassType: CompassType;
  compassTypeLabel: string;
  headline: string;
  einordnung: string;
  fokusWoche: string;
  ersteAufgabe: string;
}

const DIMENSION_LABELS: Record<keyof BaselineData, string> = {
  energy: 'Energie',
  sleep: 'Schlafqualität',
  calm: 'Innere Ruhe',
  eating: 'Essverhalten',
  body: 'Körpergefühl',
};

const DIMENSION_TO_PILLAR: Record<keyof BaselineData, CompassPillar> = {
  energy: 'ernährung',
  eating: 'ernährung',
  body: 'bewegung',
  sleep: 'schlaf',
  calm: 'mental',
};

const PILLAR_LABELS: Record<CompassPillar, string> = {
  ernährung: 'Ernährung & Energie',
  bewegung: 'Bewegung & Training',
  schlaf: 'Regeneration & Schlaf',
  mental: 'Mentale Klarheit',
};

const COMPASS_TYPE_LABELS: Record<CompassType, string> = {
  dauerstress: 'System unter Dauerlast',
  fundament: 'Fundament aufbauen',
  muster: 'Muster erkennen',
};

const HEADLINES: Record<CompassType, string> = {
  dauerstress: 'Dein System läuft auf Reserve',
  fundament: 'Dein Alltag braucht Ankerpunkte',
  muster: 'Ein Muster wirft dich zurück',
};

const EINORDNUNG: Record<CompassType, Record<Goal, string>> = {
  dauerstress: {
    energy: 'Dein Energieproblem kommt nicht von zu wenig Schlaf. Dein Körper schaltet tagsüber nie richtig ab. Jeder Reiz, jede Benachrichtigung kostet dieselbe Energie wie eine echte Herausforderung. Die nächsten 7 Tage beginnen genau dort.',
    fatloss: 'Dein Körper hält gerade Fett fest weil er unter Dauerlast steht. Das ist kein Versagen deiner Disziplin. Unter anhaltendem Stress priorisiert der Körper Sicherheit, nicht Fettabbau. Erst das System beruhigen, dann optimieren.',
    structure: 'Mehr Planung hilft nicht wenn das System überlastet ist. Struktur entsteht nicht durch mehr Kalender. Sie entsteht wenn dein Körper sich sicher genug fühlt um Routinen tatsächlich zu halten.',
    sleep: 'Dein Schlafproblem beginnt nicht im Bett. Es beginnt darin wie viel Alarm dein System tagsüber aufnimmt. Das Bett ist nur der Ort wo es sich zeigt.',
  },
  fundament: {
    energy: 'Du weißt was gut für dich wäre. Das Problem ist nicht Wissen. Es fehlt ein verlässlicher Tagesrahmen der auch hält wenn der Alltag voll wird. Den bauen wir jetzt auf.',
    fatloss: 'Jede Diät scheitert nicht am Anfang. Sie scheitert in Woche 3 wenn der Alltag zurückkommt. Was du brauchst ist kein neues Programm, du brauchst ein Fundament das trägt.',
    structure: '7 Tage identische Ankerpunkte. Keine Abwechslung, kein Optimieren. Nur Wiederholung bis die Struktur sitzt. Das ist der Plan.',
    sleep: 'Einen verlässlichen Schlafrhythmus aufzubauen braucht keine Tricks. Es braucht eine feste Zeit die nicht verhandelbar ist. Das beginnt heute.',
  },
  muster: {
    energy: 'Du machst vieles richtig und trotzdem fehlt die Energie. Irgendwo gibt es ein Leck. Abends, unter Stress, oder wenn der Alltag zu voll wird. In 7 Tagen findest du heraus wo.',
    fatloss: 'Es liegt nicht an der Methode. Es liegt an einem Muster das bisher unsichtbar war. Abend-Heißhunger, Stress-Essen oder chaotische Mahlzeiten. In 7 Tagen wird sichtbar was bei dir den größten Unterschied macht.',
    structure: 'Die Struktur bricht immer an der gleichen Stelle. Nicht zufällig, das ist ein Muster. Wenn wir wissen wo es bricht, können wir es gezielt verändern.',
    sleep: 'Schlechter Schlaf hängt oft an einem Muster das sich am Abend aufbaut. Bildschirm, späte Mahlzeiten, Reize bis kurz vor dem Schlafen. In 7 Tagen findest du deinen größten Hebel.',
  },
};

const FOKUS_WOCHE: Record<CompassType, string> = {
  dauerstress: 'Das Nervensystem entlasten. Reize bewusst reduzieren. Dem Körper Signale geben, dass er nicht mehr im Alarm-Modus sein muss.',
  fundament: 'Drei verlässliche Ankerpunkte setzen: Schlafenszeit, Mahlzeiten, Bewegung. Nicht mehr, nur verlässlicher.',
  muster: 'Unbewusste Muster sichtbar machen. Ernährungsstruktur stabilisieren. Verstehen was dich wirklich zurückwirft.',
};

const ERSTE_AUFGABE: Record<CompassType, string> = {
  dauerstress: 'Stell heute Abend das Handy 30 Minuten früher weg als üblich. Nur das.',
  fundament: 'Entscheide jetzt deine feste Schlafenszeit für die nächsten 7 Tage. Schreib sie auf.',
  muster: 'Beobachte heute 2x wenn Hunger kommt: Echter Hunger oder Gewohnheit, Stress, Langeweile?',
};

function getWeakestDimension(baseline: BaselineData): keyof BaselineData {
  const dims = Object.entries(baseline) as [keyof BaselineData, number][];
  return dims.reduce((a, b) => (b[1] < a[1] ? b : a))[0];
}

function getCompassType(hurdle: Hurdle, baseline: BaselineData): CompassType {
  if (hurdle === 'stress') return 'dauerstress';
  if (hurdle === 'evening') {
    return baseline.calm <= baseline.eating ? 'dauerstress' : 'muster';
  }
  if (hurdle === 'consistency' || hurdle === 'time') return 'fundament';
  if (hurdle === 'nutrition') return 'muster';
  return 'fundament';
}

export function computeCompass(
  goal: Goal,
  hurdle: Hurdle,
  baseline: BaselineData,
): CompassResult {
  const weakestDimension = getWeakestDimension(baseline);
  const focusPillar = DIMENSION_TO_PILLAR[weakestDimension];
  const compassType = getCompassType(hurdle, baseline);

  return {
    weakestDimension,
    weakestDimensionLabel: DIMENSION_LABELS[weakestDimension],
    focusPillar,
    pillarLabel: PILLAR_LABELS[focusPillar],
    compassType,
    compassTypeLabel: COMPASS_TYPE_LABELS[compassType],
    headline: HEADLINES[compassType],
    einordnung: EINORDNUNG[compassType][goal],
    fokusWoche: FOKUS_WOCHE[compassType],
    ersteAufgabe: ERSTE_AUFGABE[compassType],
  };
}
