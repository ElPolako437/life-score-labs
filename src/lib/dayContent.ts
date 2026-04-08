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
}

export const DAY_CONTENT: DayContent[] = [
  // Tag 1 — Rauschen reduzieren
  {
    title: 'Rauschen reduzieren',
    goal: 'Heute geht es darum, bewusst weniger Reize zuzulassen.',
    impulse: '„Heute geht es nicht um Perfektion. Es geht darum, anzufangen. Dein einziges Ziel: den Tag bewusst abschließen."',
    insight: 'Warum du müde bist, obwohl du genug schläfst: Allostatic Load — jede Benachrichtigung, jede News-Headline kostet dieselbe Energie wie eine echte Bedrohung. Die meisten Menschen sind nicht erschöpft weil sie zu wenig schlafen, sondern weil sie tagsüber zu viele Reize aufnehmen.',
    sofortTipp: '30 Minuten ALLE Benachrichtigungen aus. Nicht nur Social Media — alles.',
    tasks: [
      '30 Min bewusst offline — kein Bildschirm',
      'Kein Alkohol heute',
      'Einen festen Zeitpunkt für deine letzte Mahlzeit setzen',
    ],
    taskKeys: ['offline', 'alcohol', 'last_meal'],
    goalBonus: {
      energy: 'Beobachte heute dein Energieniveau nach dem Offline-Block. Wann fühlst du dich leichter?',
      fatloss: 'Notiere mental wann du heute Hunger spürst vs. wann du aus Reiz essen willst.',
      structure: 'Plane heute Abend den morgigen Tag in 3 konkreten Punkten — bevor du schläfst.',
      sleep: 'Lege heute Abend deine feste Schlafenszeit fest. Schreib sie auf.',
    },
  },
  // Tag 2 — Mahlzeiten ordnen
  {
    title: 'Mahlzeiten ordnen',
    goal: 'Zwei klare Mahlzeiten — kein Snacking, kein Chaos.',
    impulse: '„Heute wird es das erste Mal klarer. Du wirst merken, wie sich dein Essverhalten verändert, wenn du bewusst Struktur reinbringst."',
    insight: 'Das Snacking-Problem ist kein Hunger-Problem: Jede Zwischenmahlzeit hebt Insulin. Insulin blockiert Fettabbau komplett. Zwei klare Mahlzeiten mit Pausen geben dem Körper Zeitfenster für echten Fettabbau. Kein Hungern — Timing.',
    sofortTipp: 'Erste Mahlzeit erst bei echtem Hunger. Eine Handfläche Protein pro Mahlzeit.',
    tasks: [
      '2 proteinreiche Mahlzeiten — keine Snacks dazwischen',
      'Mindestens 2 Liter Wasser über den Tag verteilt',
      'Nach der letzten Mahlzeit: Küche zu, nichts mehr essen',
    ],
    taskKeys: ['meals', 'water', 'kitchen_closed'],
    goalBonus: {
      energy: 'Iss deine erste Mahlzeit erst wenn echter Hunger da ist — nicht aus Gewohnheit.',
      fatloss: 'Halte die Pause zwischen den zwei Mahlzeiten so lang wie möglich. Mindestens 5 Stunden.',
      structure: 'Lege Uhrzeit und Inhalt beider Mahlzeiten heute Morgen fest — keine spontanen Entscheidungen.',
      sleep: 'Letzte Mahlzeit mindestens 3 Stunden vor dem Schlafen. Notiere wie du dich nachts fühlst.',
    },
  },
  // Tag 3 — Bewegung zur Regulation
  {
    title: 'Bewegung zur Regulation',
    goal: 'Ruhige Bewegung als Nervensystem-Regulation, nicht als Training.',
    impulse: '„Tag 3 ist der Punkt, an dem viele aufhören. Nicht weil es schwer ist — sondern weil der Reiz des Neuen nachlässt. Bleib."',
    insight: 'Warum ein Spaziergang mehr bringt als HIIT: 10–15 Min Spaziergang nach einer Mahlzeit senkt den Blutzuckeranstieg um bis zu 30%. Effektiver als jedes Supplement. Aktiviert den Parasympathikus für Regeneration und Verdauung.',
    sofortTipp: 'Direkt nach der größten Mahlzeit 10–15 Min spazieren. Entspannt, kein Tempo.',
    tasks: [
      '30 Min ruhige Bewegung — Spaziergang, kein Workout',
      '2 proteinreiche Mahlzeiten wie gestern',
      '15 Min nach einer Mahlzeit bewusst bewegen',
    ],
    taskKeys: ['movement', 'meals', 'post_meal_walk'],
    goalBonus: {
      energy: 'Geh nach dem Mittagessen spazieren — nicht abends. Beobachte den Energieunterschied am Nachmittag.',
      fatloss: 'Der Post-Meal Walk ist heute dein wichtigstes Fettverlust-Tool. Direkt nach der größten Mahlzeit.',
      structure: 'Baue den Spaziergang als festen Ankerpunkt in deinen Tag ein — gleiche Uhrzeit wie morgen.',
      sleep: 'Spaziergang nach dem Abendessen senkt Cortisol und bereitet deinen Körper auf Schlaf vor.',
    },
  },
  // Tag 4 — Schlafanker setzen
  {
    title: 'Schlafanker setzen',
    goal: 'Feste Schlafenszeit als nicht verhandelbaren Ankerpunkt setzen.',
    impulse: '„Ab hier beginnt echte Stabilität. Achte heute darauf, wie du dich fühlst, wenn du zur gleichen Zeit ins Bett gehst."',
    insight: 'Dein Körper regeneriert nicht im Schlaf — er regeneriert im Rhythmus: Wachstumshormon, Melatonin, Cortisol folgen einem festen Takt. Unterschiedliche Schlafenszeiten stören den Takt — auch bei 8 Stunden. Feste Schlafenszeit (±15 Min) ist der stärkste Einzelhebel.',
    sofortTipp: 'Alarm stellen zum INS-BETT-GEHEN, nicht zum Aufwachen.',
    tasks: [
      'Feste Schlafenszeit festlegen und einhalten (mind. 8h im Bett)',
      '60 Min vor dem Schlafen: kein Bildschirm',
      '2 klare Mahlzeiten — letzte Mahlzeit mind. 2h vor dem Schlafen',
      'Kein Koffein nach 14 Uhr',
    ],
    taskKeys: ['sleep', 'screen_free', 'meals_timed', 'no_caffeine'],
    goalBonus: {
      energy: 'Teste heute: Gleiche Schlafenszeit wie gestern — und beobachte dein Energieniveau morgen früh.',
      fatloss: 'Schlechter Schlaf erhöht Ghrelin (Hungerhormon) um bis zu 24%. Heute Nacht ist Fettverlust-Arbeit.',
      structure: 'Der Schlafanker ist dein wichtigster Tagesstruktur-Hebel. Alles andere baut darauf auf.',
      sleep: 'Heute Abend: Zimmer kühl (18–19°C), dunkel, kein Handy. Dokumentiere wie du morgen aufwachst.',
    },
  },
  // Tag 5 — Wenn der Abend kippt
  {
    title: 'Wenn der Abend kippt',
    goal: 'Einen bewussten Abend gestalten, bevor die Gewohnheiten übernehmen.',
    impulse: '„Hier verlieren die meisten die Kontrolle. Nicht durch fehlende Disziplin — sondern weil der Tag nicht strukturiert genug war. Heute änderst du das."',
    insight: 'Dein Abend-Problem ist ein Nachmittags-Problem: Kontrollverlust am Abend (Snacks, Bildschirm, Alkohol) liegt an dem was zwischen 14–17 Uhr passiert. Cortisol fällt natürlich ab. Bei Dauerstress fällt es zu tief → Körper kompensiert mit schneller Energie. Abend ist Symptom, Nachmittag ist Ursache.',
    sofortTipp: 'Zwischen 15–16 Uhr bewusst 10 Min Pause. Kein Kaffee, kein Snack — nur Ruhe.',
    tasks: [
      'Abendessen vorher planen — nicht spontan entscheiden',
      'Eine Abendroutine definieren (z.B. Tee, Lesen, Spaziergang)',
      'Kein Bildschirm im Bett',
      'Wenn Heißhunger kommt: 10 Min warten, Wasser trinken',
    ],
    taskKeys: ['plan_dinner', 'evening_routine', 'no_screen_bed', 'hunger_strategy'],
    goalBonus: {
      energy: 'Plane heute zwischen 15–16 Uhr eine 10-Min Pause ohne Bildschirm. Das rettet deinen Abend.',
      fatloss: 'Abend-Heißhunger ist kein Hunger. Es ist ein Zeichen dass du tagsüber zu wenig gegessen oder zu viel Stress hattest.',
      structure: 'Schreib heute Abend deine 3 wichtigsten Aufgaben für morgen auf — bevor du das Handy weglegest.',
      sleep: 'Beginne heute deine Schlafroutine 90 Min vor der Schlafenszeit. Nicht 30 — 90.',
    },
  },
  // Tag 6 — Alltag vereinfachen
  {
    title: 'Alltag vereinfachen',
    goal: 'Alles weglassen, was keinen Beitrag zur Stabilität leistet.',
    impulse: '„Jetzt wird es leicht — wenn du es richtig aufsetzt. Du bist seit fast einer Woche in diesem Rhythmus. Das ist kein Zufall — das ist ein System."',
    insight: 'Decision Fatigue — warum weniger Entscheidungen zu besserem Fettverlust führen: Jede Entscheidung kostet mentales Budget. Morgens Entscheidungen treffen = abends ist das Budget leer → schlechteste Optionen. Lösung: Entscheidungen eliminieren, nicht besser treffen.',
    sofortTipp: 'Heute Abend für morgen festlegen: Was anziehen? Was essen? Wann rausgehen?',
    tasks: [
      'Mahlzeiten für morgen vorbereiten oder planen',
      'Störquellen identifizieren und eine bewusst abstellen',
      'Schlafenszeit wie gestern einhalten',
    ],
    taskKeys: ['meal_prep', 'reduce_friction', 'sleep_anchor'],
    goalBonus: {
      energy: 'Identifiziere die eine Sache die dir täglich die meiste Energie kostet. Kann sie weg oder reduziert werden?',
      fatloss: 'Räume heute alle Snacks aus deinem Sichtfeld. Was nicht sichtbar ist, wird nicht gegessen.',
      structure: 'Definiere heute deine 3 nicht-verhandelbaren Tages-Ankerpunkte für die nächste Woche.',
      sleep: 'Stelle heute Abend das Handy in ein anderes Zimmer. Nicht auf lautlos — in ein anderes Zimmer.',
    },
  },
  // Tag 7 — Reflexion und Auswertung
  {
    title: 'Reflexion und Auswertung',
    goal: 'Ehrlich hinschauen — was funktioniert, wo hakt es noch.',
    impulse: '„Heute ist der letzte Tag. Nicht das Ende — sondern der Moment, in dem du siehst, was dein Körper wirklich braucht."',
    insight: 'Warum ein Reset nicht reicht — aber zeigt was du brauchst: 7 Tage reichen nicht für Transformation. Aber sie testen dein Fundament. Du weißt jetzt welche Säule funktioniert und wo du einbrichst. Diese Daten sind wertvoller als jeder Trainingsplan.',
    sofortTipp: '5 Minuten ehrliche Reflexion. Nicht streng — klar.',
    tasks: [
      'Schreib 3 Dinge auf, die sich diese Woche verändert haben',
      'Identifiziere den einen Moment, der am schwierigsten war',
      'Entscheide: Welche eine Gewohnheit behältst du ab morgen bei?',
    ],
    taskKeys: ['write_changes', 'identify_hard', 'keep_habit'],
    goalBonus: {
      energy: 'Frage dich ehrlich: An welchen Tagen hattest du spürbar mehr Energie — und was war anders?',
      fatloss: 'Wie oft hast du diese Woche aus echtem Hunger gegessen vs. aus Gewohnheit oder Stress?',
      structure: 'Welcher der 7 Tage hatte die beste Struktur? Was war der Unterschied zu den anderen?',
      sleep: 'Vergleiche deine erste Nacht mit deiner letzten. Hat sich dein Schlaf verändert — und warum?',
    },
  },
];

// Legacy exports for backward compatibility
export const TASKS = DAY_CONTENT[0].tasks;
export const TASK_KEYS = DAY_CONTENT[0].taskKeys;

// Reflection task options (covers all unique themes across the week)
export const REFLECTION_TASK_OPTIONS = [
  { key: 'offline', label: 'Offline-Zeit & Reize reduzieren' },
  { key: 'meals', label: 'Mahlzeiten strukturieren' },
  { key: 'movement', label: 'Bewegung integrieren' },
  { key: 'sleep', label: 'Schlafrhythmus einhalten' },
  { key: 'evening', label: 'Abend-Routine & Heißhunger' },
  { key: 'preparation', label: 'Vorbereitung & Planung' },
];

// Goal-personalized locked teasers for Week screen
export const GOAL_LOCKED_TEASERS: Record<GoalKey, Record<number, string>> = {
  energy: {
    2: '🔒 Morgen: Wie 2 klare Mahlzeiten dein Energieniveau stabilisieren',
    3: '🔒 Morgen: Warum ein Spaziergang dein Nachmittags-Tief beendet',
    4: '🔒 Morgen: Der eine Schlaf-Hebel, der alles andere verändert',
    5: '🔒 Morgen: Warum dein Energieabfall nicht am Morgen entschieden wird',
    6: '🔒 Morgen: Wie du täglich Entscheidungs-Energie sparst',
    7: '🔒 Morgen: Was dein Körper dir diese Woche gezeigt hat',
  },
  fatloss: {
    2: '🔒 Morgen: Warum Snacking Fettabbau komplett blockiert',
    3: '🔒 Morgen: 10 Min spazieren nach dem Essen — effektiver als jedes Supplement',
    4: '🔒 Morgen: Schlechter Schlaf erhöht deinen Hunger um bis zu 24%',
    5: '🔒 Morgen: Abend-Heißhunger ist kein Hunger — es ist Biologie',
    6: '🔒 Morgen: Warum weniger Entscheidungen zu mehr Fettabbau führen',
    7: '🔒 Morgen: Dein persönliches Fettabbau-Profil nach 7 Tagen',
  },
  structure: {
    2: '🔒 Morgen: Zwei Mahlzeiten als Anker für deinen ganzen Tag',
    3: '🔒 Morgen: Bewegung als tägliches Ritual — nicht als Training',
    4: '🔒 Morgen: Der Schlaf-Anker als wichtigster Struktur-Hebel',
    5: '🔒 Morgen: Warum dein Abend über den nächsten Tag entscheidet',
    6: '🔒 Morgen: Deine 3 nicht-verhandelbaren Tages-Ankerpunkte',
    7: '🔒 Morgen: Was diese Woche über dein System verrät',
  },
  sleep: {
    2: '🔒 Morgen: Wie Mahlzeiten-Timing deinen Schlaf direkt beeinflusst',
    3: '🔒 Morgen: Der Abend-Spaziergang als natürliches Schlaf-Signal',
    4: '🔒 Morgen: Die wichtigste Nacht — dein Schlaf-Anker wird gesetzt',
    5: '🔒 Morgen: Warum dein Abend deine Schlafqualität macht — nicht das Bett',
    6: '🔒 Morgen: Ein Experiment, das deinen Schlaf sofort verändert',
    7: '🔒 Morgen: Dein Schlaf-Profil nach 7 Tagen',
  },
};

// Retention hooks for days 1–2: tease next day's insight to pull users back
export const RETENTION_HOOKS: Record<number, string> = {
  1: 'Morgen: Warum Snacking kein Hunger-Problem ist — und wie zwei Mahlzeiten mehr verändern als jede Diät.',
  2: 'Morgen: Wie 15 Minuten nach dem Essen deinen Blutzucker um bis zu 30% senken können. Effektiver als jedes Supplement.',
};

export interface SoftConversionEntry {
  text: string;
  cta: boolean;
}

export const SOFT_CONVERSION: Record<number, SoftConversionEntry> = {
  3: {
    text: 'Wenn dir selbst mit diesem Reset noch Struktur fehlt, liegt es oft nicht an Disziplin — sondern an fehlender Einordnung.',
    cta: false,
  },
  4: {
    text: 'Du verstehst jetzt, wie Schlafrhythmus funktioniert. Aber was ist DEINE optimale Schlafenszeit? Wie viel Protein braucht DEIN Körper? Das sind Fragen, die ein allgemeiner Reset nicht beantworten kann.',
    cta: true,
  },
  5: {
    text: 'Wenn der Abend dein Schwachpunkt ist, bist du nicht allein. Die meisten Reset-Teilnehmer kämpfen hier am meisten. Oft liegt es nicht am Willen — sondern daran, dass die Ernährung tagsüber nicht gestimmt hat. Im Caliness-Sprint findest du heraus, was DEIN Körper wann braucht, damit der Abend nicht mehr kippt.',
    cta: true,
  },
  6: {
    text: 'Morgen ist dein letzter Tag. Du wirst sehen, was funktioniert hat und was nicht. Was du danach damit machst, ist die eigentliche Entscheidung.',
    cta: true,
  },
};
