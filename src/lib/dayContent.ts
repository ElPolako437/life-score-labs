export type GoalKey = 'energy' | 'fatloss' | 'structure' | 'sleep';

export interface DayContent {
  title: string;
  goal: string;
  impulse: string;
  insight: string;
  sofortTipp: string;
  tasks: string[];
  taskKeys: string[];
  goalBonus: Record<GoalKey, string>;
  pillarDay?: boolean; // true = PillarAssessment replaces tasks
}

export const DAY_CONTENT: DayContent[] = [
  // Tag 1 — Ernährung & Energie (Pillar-Assessment-Tag)
  {
    title: 'Ernährung & Energie',
    goal: 'Verstehe wie dein Körper gerade mit Energie versorgt wird.',
    impulse: '„Heute geht es nicht ums Machen. Heute geht es ums Hinschauen. Das ist schwerer als es klingt."',
    insight: 'Ernährung ist keine Diätfrage. Sie ist deine Energieversorgung. Wann du isst, was du isst und wie viel Protein du bekommst bestimmt ob du morgens direkt klar bist oder erst nach dem zweiten Kaffee.',
    sofortTipp: 'Lies dein Ernährungs-Ergebnis einmal in Ruhe durch.',
    tasks: [],
    taskKeys: [],
    pillarDay: true,
    goalBonus: {
      energy: 'Beobachte heute wann deine Energie am höchsten ist.',
      fatloss: 'Beobachte heute wann Hunger kommt. Echter Hunger oder Gewohnheit?',
      structure: 'Leg heute Morgen Uhrzeit und ungefähren Inhalt beider Mahlzeiten fest.',
      sleep: 'Entscheide jetzt deine feste Schlafenszeit für diese Woche.',
    },
  },
  // Tag 2 — Bewegung & Training (Pillar-Assessment-Tag)
  {
    title: 'Bewegung & Training',
    goal: 'Verstehe wie Bewegung als Regulations-Werkzeug wirkt.',
    impulse: '„Bewegung ist kein Workout-Thema. Sie ist ein Schalter."',
    insight: '10 bis 15 Minuten ruhiges Gehen direkt nach einer Mahlzeit senkt den Blutzuckeranstieg um bis zu 30%. Gleichzeitig aktivierst du den Parasympathikus. Dein Körper schaltet in Regeneration.',
    sofortTipp: 'Direkt nach der größten Mahlzeit: 10 bis 15 Min rausgehen. Kein Podcast, kein Handy.',
    tasks: [],
    taskKeys: [],
    pillarDay: true,
    goalBonus: {
      energy: 'Post-Meal Walk nach dem Mittagessen. Beobachte deinen Nachmittag danach.',
      fatloss: 'Post-Meal Walk direkt nach der größten Mahlzeit. Das ist kein optionaler Bonus.',
      structure: 'Baue den Spaziergang heute zur gleichen Uhrzeit ein wie morgen.',
      sleep: 'Spaziergang nach dem Abendessen senkt Cortisol natürlich.',
    },
  },
  // Tag 3 — Regeneration & Schlaf (Pillar-Assessment-Tag)
  {
    title: 'Regeneration & Schlaf',
    goal: 'Verstehe warum dein Körper nachts nicht immer wirklich regeneriert.',
    impulse: '„Schlaf ist keine Ruhezeit. Er ist aktive Reparatur."',
    insight: 'Wachstumshormon, Melatonin und Cortisol folgen einem festen Takt. Wenn deine Schlafenszeit jeden Tag variiert, ist das für deinen Körper wie Jetlag ohne Flug. Auch 8 Stunden helfen nichts wenn der Rhythmus nicht stimmt.',
    sofortTipp: 'Alarm auf EINSCHLAFEN stellen, nicht auf Aufwachen.',
    tasks: [],
    taskKeys: [],
    pillarDay: true,
    goalBonus: {
      energy: 'Gleiche Schlafenszeit wie gestern, auf die Minute. Beobachte morgen früh.',
      fatloss: 'Schlechter Schlaf erhöht das Hungerhormon um bis zu 24%. Diese Nacht ist Fettverlust-Arbeit.',
      structure: 'Der Schlafanker ist dein wichtigster Tages-Hebel.',
      sleep: 'Zimmer kühl (18 bis 19°C), komplett dunkel, Handy draußen.',
    },
  },
  // Tag 4 — Mentale Klarheit & Stress (Pillar-Assessment-Tag)
  {
    title: 'Mentale Klarheit & Stress',
    goal: 'Verstehe welches Muster dich täglich die meiste Energie kostet.',
    impulse: '„Dein Verhalten folgt deinem Nervensystemzustand. Das ist keine Schwäche, das ist Biologie."',
    insight: 'Wenn das Nervensystem überlastet ist treffen wir schlechtere Entscheidungen, essen mehr und schlafen schlechter. Der Abend kippt fast nie aus Schwäche. Meistens liegt der Fehler 6 Stunden früher.',
    sofortTipp: 'Zwischen 15 und 16 Uhr: 10 Minuten ohne Bildschirm, ohne Kaffee, nur Pause.',
    tasks: [],
    taskKeys: [],
    pillarDay: true,
    goalBonus: {
      energy: 'Plane heute zwischen 15 und 16 Uhr 10 Minuten ohne Bildschirm.',
      fatloss: 'Abend-Heißhunger ist kein Hunger. Es ist ein Zeichen von zu viel Stress oder zu wenig Struktur.',
      structure: 'Schreib heute Abend drei Punkte für morgen auf, bevor du das Handy nimmst.',
      sleep: 'Beginne deine Schlafroutine 90 Minuten vor der Schlafenszeit.',
    },
  },
  // Tag 5 — Auswertung (routes to ResetSynthesis, minimal task content)
  {
    title: 'Deine Auswertung',
    goal: 'Deine 4 Säulen auf einen Blick.',
    impulse: '„7 Tage Beobachtung. Jetzt zeigen wir dir was das bedeutet."',
    insight: 'Du hast diese Woche dein eigenes System beobachtet. Welche Säule funktioniert sofort bei dir? Wo brichst du ein? Das sind Daten die kein Test liefert. Du kennst deinen Körper jetzt ein bisschen besser als vor einer Woche.',
    sofortTipp: 'Schau dir deine 4 Säulen-Einordnung in Ruhe an.',
    tasks: [],
    taskKeys: [],
    pillarDay: false,
    goalBonus: {
      energy: 'An welchen Tagen hattest du spürbar mehr Energie?',
      fatloss: 'Wie oft hast du diese Woche aus echtem Hunger gegessen?',
      structure: 'Welcher der Tage hatte die beste Struktur?',
      sleep: 'Vergleiche deine erste Nacht mit deiner letzten.',
    },
  },
];

export const TASKS = DAY_CONTENT[0].tasks;
export const TASK_KEYS = DAY_CONTENT[0].taskKeys;

export const REFLECTION_TASK_OPTIONS = [
  { key: 'offline', label: 'Offline-Zeit und Reize reduzieren' },
  { key: 'meals', label: 'Mahlzeiten strukturieren' },
  { key: 'movement', label: 'Bewegung integrieren' },
  { key: 'sleep', label: 'Schlafrhythmus einhalten' },
  { key: 'evening', label: 'Abend-Routine und Heißhunger' },
  { key: 'preparation', label: 'Vorbereitung und Planung' },
];

export const GOAL_LOCKED_TEASERS: Record<GoalKey, Record<number, string>> = {
  energy: {
    2: '🔒 Morgen: Warum ein Spaziergang dein Nachmittags-Tief beendet',
    3: '🔒 Morgen: Der Schlaf-Hebel der alles andere verändert',
    4: '🔒 Morgen: Warum dein Abend-Problem ein Nachmittags-Problem ist',
    5: '🔒 Morgen: Deine 4 Säulen auf einen Blick',
  },
  fatloss: {
    2: '🔒 Morgen: 10 Min spazieren nach dem Essen, effektiver als jedes Supplement',
    3: '🔒 Morgen: Schlechter Schlaf erhöht deinen Hunger um bis zu 24%',
    4: '🔒 Morgen: Warum Abend-Heißhunger kein Hunger ist',
    5: '🔒 Morgen: Dein persönliches Fettabbau-Profil',
  },
  structure: {
    2: '🔒 Morgen: Warum Bewegung als Ritual mehr bringt als als Training',
    3: '🔒 Morgen: Der Schlaf-Anker als wichtigster Struktur-Hebel',
    4: '🔒 Morgen: Warum dein Abend über den nächsten Tag entscheidet',
    5: '🔒 Morgen: Was diese Woche über dein persönliches System verrät',
  },
  sleep: {
    2: '🔒 Morgen: Der Abend-Spaziergang als natürliches Schlaf-Signal',
    3: '🔒 Morgen: Dein Schlaf-Anker wird gesetzt',
    4: '🔒 Morgen: Warum dein Abend deine Schlafqualität macht, nicht das Bett',
    5: '🔒 Morgen: Dein Schlaf-Profil nach 5 Tagen',
  },
};

export const RETENTION_HOOKS: Record<number, string> = {
  1: 'Morgen testest du wie Bewegung als Schalter für dein Nervensystem funktioniert.',
  2: 'Morgen setzt du deinen Schlaf-Anker. Eine Sache, die mehr verändert als 8 Stunden im Bett.',
  3: 'Morgen schauen wir auf das Muster das dich täglich am meisten Energie kostet.',
  4: 'Morgen siehst du deine 4 Säulen auf einen Blick und welcher nächste Schritt wirklich zählt.',
};

export interface SoftConversionEntry {
  text: string;
  cta: boolean;
}

export const SOFT_CONVERSION: Record<number, SoftConversionEntry> = {
  3: {
    text: 'Wenn dir nach 3 Tagen Reset noch Struktur fehlt, ist das normal. Ein allgemeiner Reset kann keine individuellen Antworten geben.',
    cta: false,
  },
  4: {
    text: 'Du siehst jetzt dein Muster. Das ist wertvoller als jede Diät. Im Caliness-Sprint bauen wir daraus ein System das genau dagegen arbeitet.',
    cta: true,
  },
};
