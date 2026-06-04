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
  // Tag 1
  {
    title: 'Dein Reset-Kompass',
    goal: 'Verstehe wo dein System gerade steht, bevor du etwas veränderst.',
    impulse: '„Heute geht es nicht ums Machen. Heute geht es ums Hinschauen. Das ist schwerer als es klingt."',
    insight: 'Die meisten starten einen Reset und suchen sofort die Lösung. Das Problem dabei: Ohne zu wissen welche Säule bei dir gerade am schwächsten ist, arbeitest du am falschen Punkt. Dein Reset-Kompass zeigt dir heute deinen persönlichen Startpunkt entlang der 4 Säulen.',
    sofortTipp: 'Lies dein Kompass-Ergebnis einmal in Ruhe durch. Schreib eine Sache auf die dich überrascht hat.',
    tasks: [
      'Kompass-Ergebnis lesen und eine überraschende Erkenntnis aufschreiben',
      '10 Min Abend-Beobachtung: Was hat heute die meiste Energie gekostet?',
    ],
    taskKeys: ['read_compass', 'energy_observation'],
    goalBonus: {
      energy: 'Beobachte heute wann deine Energie am höchsten ist. Nach dem Kompass-Block oder vorher? Das sagt dir mehr als jede App.',
      fatloss: 'Beobachte heute wann Hunger kommt. Echter Hunger oder Gewohnheit, Stress, Langeweile? Nur beobachten, nicht bewerten.',
      structure: 'Schreib heute Abend drei konkrete Punkte für morgen auf. Nicht eine lange Liste, drei Punkte. Bevor du das Handy nimmst.',
      sleep: 'Entscheide jetzt deine feste Schlafenszeit für die nächsten 7 Tage. Schreib sie auf. Das ist dein Anker.',
    },
  },
  // Tag 2
  {
    title: 'Mahlzeiten ordnen',
    goal: 'Zwei klare Mahlzeiten, kein Snacking, kein Chaos.',
    impulse: '„Die meisten sagen mir nach Tag 2: Ich wusste gar nicht wie selten ich wirklich Hunger hatte. Das wirst du heute selbst merken."',
    insight: 'Snacking ist kein Hunger-Problem, es ist ein Insulin-Problem: Jede Zwischenmahlzeit hebt deinen Insulinspiegel. Solange Insulin oben ist, findet kein Fettabbau statt. Punkt. Zwei klare Mahlzeiten mit echten Pausen geben deinem Körper die Fenster, in denen er das tut wofür er gebaut ist.',
    sofortTipp: 'Erste Mahlzeit erst bei echtem Hunger, nicht aus Gewohnheit. Eine Handfläche Protein pro Mahlzeit. Der Rest ist egal.',
    tasks: [
      '2 proteinreiche Mahlzeiten, keine Snacks dazwischen',
      'Mindestens 2 Liter Wasser über den Tag verteilt',
      'Nach der letzten Mahlzeit: Küche zu, nichts mehr essen',
    ],
    taskKeys: ['meals', 'water', 'kitchen_closed'],
    goalBonus: {
      energy: 'Iss deine erste Mahlzeit erst wenn echter Hunger da ist. Nicht um 8 Uhr weil das normal ist, sondern wenn dein Körper es will.',
      fatloss: 'Halte die Pause zwischen den zwei Mahlzeiten so lang wie möglich. Mindestens 5 Stunden. Wasser und schwarzer Kaffee zählen nicht.',
      structure: 'Leg Uhrzeit und Inhalt beider Mahlzeiten heute Morgen fest. Keine spontanen Entscheidungen heute und beobachte wie viel mentale Energie das spart.',
      sleep: 'Letzte Mahlzeit mindestens 3 Stunden vor dem Schlafen. Notiere morgen früh wie du aufgewacht bist.',
    },
  },
  // Tag 3
  {
    title: 'Bewegung zur Regulation',
    goal: 'Ruhige Bewegung als Nervensystem-Reset, nicht als Training.',
    impulse: '„Ehrlich gesagt ist Tag 3 der härteste. Das Neu-Gefühl ist weg, der Rhythmus noch nicht fest. Genau deshalb ist heute der wichtigste Tag."',
    insight: 'Warum ein Spaziergang mehr bringt als HIIT: 10 bis 15 Minuten ruhiges Gehen direkt nach einer Mahlzeit senkt den Blutzuckeranstieg um bis zu 30%. Kein Supplement schafft das. Gleichzeitig aktivierst du den Parasympathikus. Das ist buchstäblich das Gegenteil von Stress und dein Körper schaltet in Regeneration.',
    sofortTipp: 'Direkt nach der größten Mahlzeit: 10 bis 15 Min rausgehen. Kein Podcast, kein Handy. Einfach gehen.',
    tasks: [
      '30 Min ruhige Bewegung, Spaziergang kein Workout',
      '2 proteinreiche Mahlzeiten wie gestern',
      '15 Min nach einer Mahlzeit bewusst bewegen',
    ],
    taskKeys: ['movement', 'meals', 'post_meal_walk'],
    goalBonus: {
      energy: 'Geh nach dem Mittagessen spazieren, nicht abends. Beobachte deinen Nachmittag danach. Ich wette das Tief bleibt aus.',
      fatloss: 'Der Post-Meal Walk ist heute dein effektivstes Werkzeug. Direkt nach der größten Mahlzeit. Das ist kein optionaler Bonus.',
      structure: 'Baue den Spaziergang heute zur gleichen Uhrzeit ein wie morgen. Gleicher Ort, gleiche Zeit. Gewohnheiten brauchen Wiederholung, keine Motivation.',
      sleep: 'Spaziergang nach dem Abendessen senkt Cortisol natürlich und sagt deinem Körper: Der Tag ist vorbei. Probiere es aus.',
    },
  },
  // Tag 4
  {
    title: 'Schlafanker setzen',
    goal: 'Feste Schlafenszeit, nicht verhandelbar, auch heute.',
    impulse: '„Stell heute den Alarm auf EINSCHLAFEN, nicht auf Aufwachen. Klingt komisch, mach es einfach."',
    insight: 'Dein Körper regeneriert nicht im Schlaf, er regeneriert im Rhythmus: Wachstumshormon, Melatonin und Cortisol folgen einem präzisen Takt. Wenn deine Schlafenszeit jeden Tag um eine Stunde variiert, ist das für deinen Körper wie Jetlag ohne Flug. Auch 8 Stunden helfen nichts wenn der Rhythmus nicht stimmt.',
    sofortTipp: 'Alarm stellen jetzt. Für heute Abend auf die Uhrzeit zu der du ins Bett gehst, nicht aufstehst.',
    tasks: [
      'Feste Schlafenszeit einhalten (mind. 8h im Bett)',
      '60 Min vor dem Schlafen kein Bildschirm',
      '2 klare Mahlzeiten, letzte Mahlzeit mind. 2h vor dem Schlafen',
      'Kein Koffein nach 14 Uhr',
    ],
    taskKeys: ['sleep', 'screen_free', 'meals_timed', 'no_caffeine'],
    goalBonus: {
      energy: 'Gleiche Schlafenszeit wie gestern, auf die Minute. Beobachte morgen früh wie du aufwachst. Das wird anders sein.',
      fatloss: 'Schlechter Schlaf erhöht Ghrelin, das Hungerhormon, um bis zu 24%. Diese Nacht ist Fettverlust-Arbeit.',
      structure: 'Der Schlafanker ist dein wichtigster Tages-Hebel. Nicht die Morgenroutine, nicht das System. Der Zeitpunkt zu dem du ins Bett gehst.',
      sleep: 'Zimmer kühl (18 bis 19°C), komplett dunkel, Handy draußen. Nicht auf lautlos, in einem anderen Zimmer.',
    },
  },
  // Tag 5
  {
    title: 'Wenn der Abend kippt',
    goal: 'Den Abend strukturieren bevor die Gewohnheiten übernehmen.',
    impulse: '„Der Abend kippt fast nie aus Schwäche. Meistens liegt der Fehler 6 Stunden früher. Heute schauen wir dahin."',
    insight: 'Dein Abend-Problem ist ein Nachmittags-Problem: Heißhunger abends, Snacks, Bildschirm bis 1 Uhr nachts. Das liegt fast immer daran was zwischen 14 und 17 Uhr passiert. Cortisol fällt dann natürlich ab. Bei Dauerstress fällt es zu schnell und dein Körper kompensiert mit schneller Energie. Der Abend ist das Symptom, der Nachmittag ist die Ursache.',
    sofortTipp: 'Zwischen 15 und 16 Uhr: 10 Minuten Pause. Kein Kaffee, kein Snack, nur Ruhe. Das ist kein optionaler Bonus.',
    tasks: [
      'Abendessen vorher planen, nicht spontan entscheiden',
      'Eine Abendroutine definieren (z.B. Tee, Lesen, Spaziergang)',
      'Kein Bildschirm im Bett',
      'Wenn Heißhunger kommt: 10 Min warten, Wasser trinken',
    ],
    taskKeys: ['plan_dinner', 'evening_routine', 'no_screen_bed', 'hunger_strategy'],
    goalBonus: {
      energy: 'Plane heute zwischen 15 und 16 Uhr 10 Minuten ohne Bildschirm. Nur sitzen, nicht optimieren. Das rettet deinen Abend.',
      fatloss: 'Abend-Heißhunger ist kein Hunger. Es ist ein Zeichen dass du tagsüber entweder zu wenig gegessen oder zu viel Stress hattest. Beides ist lösbar.',
      structure: 'Schreib heute Abend deine drei wichtigsten Aufgaben für morgen auf, bevor du das Handy nimmst. Nicht nachher.',
      sleep: 'Beginne deine Schlafroutine 90 Minuten vor der Schlafenszeit. Nicht 30, neunzig. Das klingt viel. Es ist der Unterschied.',
    },
  },
  // Tag 6
  {
    title: 'Alltag vereinfachen',
    goal: 'Alles weglassen was dir Energie kostet ohne etwas zurückzugeben.',
    impulse: '„Fast durch. Heute nicht mehr pushen, sondern weglassen. Was kannst du heute streichen damit morgen automatisch besser wird?"',
    insight: 'Decision Fatigue: Dein mentales Budget ist morgens am größten. Jede Entscheidung kostet davon, egal wie klein. Wer abends schlechte Entscheidungen trifft, trifft sie nicht wegen mangelnder Disziplin. Er hat sein Budget für den Tag verbraucht. Die Lösung ist nicht mehr Disziplin. Es ist weniger Entscheidungen.',
    sofortTipp: 'Heute Abend drei Minuten: Was ziehe ich morgen an? Was esse ich? Wann gehe ich raus? Fertig. Morgen früh kostet das null Energie.',
    tasks: [
      'Mahlzeiten für morgen vorbereiten oder planen',
      'Eine Störquelle identifizieren und bewusst abstellen',
      'Schlafenszeit wie gestern einhalten',
    ],
    taskKeys: ['meal_prep', 'reduce_friction', 'sleep_anchor'],
    goalBonus: {
      energy: 'Was kostet dich täglich am meisten Energie ohne etwas zurückzugeben? Eine Sache. Kann sie weg oder zumindest kleiner werden?',
      fatloss: 'Räume heute alle Snacks aus deinem Sichtfeld. Nicht wegwerfen, nur wegräumen. Was nicht sichtbar ist wird in 80% der Fälle nicht gegessen.',
      structure: 'Definiere deine drei nicht-verhandelbaren Ankerpunkte für nächste Woche. Nicht zehn. Drei.',
      sleep: 'Handy heute Abend in ein anderes Zimmer. Nicht auf lautlos, wirklich raus. Beobachte was passiert.',
    },
  },
  // Tag 7
  {
    title: 'Reflexion und Auswertung',
    goal: 'Ehrlich hinschauen, nicht urteilen sondern verstehen.',
    impulse: '„Letzter Tag. Kein Vollgas heute. Offener Blick. Was hat diese Woche wirklich verändert?"',
    insight: 'Warum 7 Tage mehr zeigen als jeder Test: Du hast diese Woche nicht Theorie gelesen. Du hast dein eigenes System beobachtet. Welche Säule funktioniert sofort bei dir? Wo brichst du ein? Das sind Daten die kein Bio-Age-Test liefert. Du kennst deinen Körper jetzt ein bisschen besser als vor einer Woche.',
    sofortTipp: '5 Minuten ehrliche Reflexion. Nicht streng, klar. Was war anders? Was war leichter als gedacht?',
    tasks: [
      'Schreib 3 Dinge auf die sich diese Woche verändert haben',
      'Identifiziere den einen Moment der am schwierigsten war',
      'Entscheide: Welche eine Gewohnheit behältst du ab morgen bei?',
    ],
    taskKeys: ['write_changes', 'identify_hard', 'keep_habit'],
    goalBonus: {
      energy: 'An welchen Tagen hattest du spürbar mehr Energie und was war an diesen Tagen anders? Das ist dein persönlicher Energie-Code.',
      fatloss: 'Wie oft hast du diese Woche aus echtem Hunger gegessen und wie oft aus Gewohnheit oder Stress? Sei ehrlich.',
      structure: 'Welcher der 7 Tage hatte die beste Struktur? Was war der konkrete Unterschied zu den anderen Tagen?',
      sleep: 'Vergleiche deine erste Nacht mit deiner letzten. Hat sich dein Schlaf verändert? Was war der größte Hebel?',
    },
  },
];

// Legacy exports for backward compatibility
export const TASKS = DAY_CONTENT[0].tasks;
export const TASK_KEYS = DAY_CONTENT[0].taskKeys;

// Reflection task options
export const REFLECTION_TASK_OPTIONS = [
  { key: 'offline', label: 'Offline-Zeit und Reize reduzieren' },
  { key: 'meals', label: 'Mahlzeiten strukturieren' },
  { key: 'movement', label: 'Bewegung integrieren' },
  { key: 'sleep', label: 'Schlafrhythmus einhalten' },
  { key: 'evening', label: 'Abend-Routine und Heißhunger' },
  { key: 'preparation', label: 'Vorbereitung und Planung' },
];

// Goal-personalized locked teasers for Week screen
export const GOAL_LOCKED_TEASERS: Record<GoalKey, Record<number, string>> = {
  energy: {
    2: '🔒 Morgen: Wie selten du wirklich Hunger hast und was der Rest ist',
    3: '🔒 Morgen: Warum ein Spaziergang dein Nachmittags-Tief beendet',
    4: '🔒 Morgen: Der eine Schlaf-Hebel der alles andere verändert',
    5: '🔒 Morgen: Warum dein Abend-Problem eigentlich ein Nachmittags-Problem ist',
    6: '🔒 Morgen: Wie du täglich Entscheidungs-Energie sparst',
    7: '🔒 Morgen: Was dein Körper dir diese Woche gezeigt hat',
  },
  fatloss: {
    2: '🔒 Morgen: Warum Snacking Fettabbau komplett blockiert',
    3: '🔒 Morgen: 10 Min spazieren nach dem Essen, effektiver als jedes Supplement',
    4: '🔒 Morgen: Schlechter Schlaf erhöht deinen Hunger um bis zu 24%',
    5: '🔒 Morgen: Abend-Heißhunger ist kein Hunger, es ist Biologie',
    6: '🔒 Morgen: Warum weniger Entscheidungen direkt zu mehr Fettabbau führen',
    7: '🔒 Morgen: Dein persönliches Fettabbau-Profil nach 7 Tagen',
  },
  structure: {
    2: '🔒 Morgen: Zwei Mahlzeiten als Anker für den ganzen Tag',
    3: '🔒 Morgen: Warum Bewegung als Ritual mehr bringt als als Training',
    4: '🔒 Morgen: Der Schlaf-Anker als wichtigster Struktur-Hebel',
    5: '🔒 Morgen: Warum dein Abend über den nächsten Tag entscheidet',
    6: '🔒 Morgen: Deine 3 nicht-verhandelbaren Tages-Ankerpunkte',
    7: '🔒 Morgen: Was diese Woche über dein persönliches System verrät',
  },
  sleep: {
    2: '🔒 Morgen: Wie Mahlzeiten-Timing deinen Schlaf direkt beeinflusst',
    3: '🔒 Morgen: Der Abend-Spaziergang als natürliches Schlaf-Signal',
    4: '🔒 Morgen: Die wichtigste Nacht, dein Schlaf-Anker wird gesetzt',
    5: '🔒 Morgen: Warum dein Abend deine Schlafqualität macht, nicht das Bett',
    6: '🔒 Morgen: Ein Experiment das deinen Schlaf sofort verändert',
    7: '🔒 Morgen: Dein Schlaf-Profil nach 7 Tagen',
  },
};

// Retention hooks for days 1–6
export const RETENTION_HOOKS: Record<number, string> = {
  1: 'Morgen testest du wie selten du wirklich Hunger hast und wie viel davon einfach Gewohnheit ist.',
  2: '10 Minuten nach dem Essen spazieren. Klingt nach nichts und senkt deinen Blutzucker um bis zu 30%. Morgen erfährst du warum das effektiver ist als jedes Supplement.',
  3: 'Dein Körper regeneriert nicht im Schlaf, sondern im Rhythmus. Morgen setzen wir deinen Anker.',
  4: 'Warum dein Abend eigentlich schon um 15 Uhr entschieden wird. Morgen schauen wir dahin.',
  5: 'Weniger Entscheidungen bedeutet weniger Hunger am Abend. Das klingt seltsam und morgen ergibt es Sinn.',
  6: 'Letzter Tag morgen. Was bleibt wenn der Reset endet und welche eine Sache du ab dann einfach beibehältst.',
};

export interface SoftConversionEntry {
  text: string;
  cta: boolean;
}

export const SOFT_CONVERSION: Record<number, SoftConversionEntry> = {
  3: {
    text: 'Wenn dir nach 3 Tagen Reset noch Struktur fehlt, ist das normal und kein Zeichen dass du es falsch machst. Ein allgemeiner Reset kann keine individuellen Antworten geben.',
    cta: false,
  },
  4: {
    text: 'Du weißt jetzt wie Schlafrhythmus funktioniert. Aber was ist deine optimale Schlafenszeit? Wie viel Protein braucht dein Körper wirklich? Das kann dieser Reset nicht sagen, aber ich schon.',
    cta: true,
  },
  5: {
    text: 'Wenn der Abend dein Schwachpunkt ist: Das sagen mir über 70% der Reset-Teilnehmer. Fast immer liegt es nicht am Willen, sondern daran dass mittags etwas nicht gestimmt hat. Im Caliness-Sprint finden wir heraus was das bei dir ist.',
    cta: true,
  },
  6: {
    text: 'Morgen ist dein letzter Tag. Du wirst sehen was funktioniert hat und was nicht. Was du danach damit machst ist die eigentliche Entscheidung.',
    cta: true,
  },
};
