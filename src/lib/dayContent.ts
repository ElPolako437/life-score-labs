export interface DayContent {
  title: string;
  goal: string;
  impulse: string;
  whyImportant: string;
  tasks: string[];
  taskKeys: string[];
}

export const DAY_CONTENT: DayContent[] = [
  // Tag 1 — Rauschen reduzieren
  {
    title: 'Rauschen reduzieren',
    goal: 'Heute geht es darum, bewusst weniger Reize zuzulassen.',
    impulse: '„Heute geht es nicht um Perfektion. Es geht darum, anzufangen. Dein einziges Ziel: den Tag bewusst abschließen."',
    whyImportant: 'Der erste Tag setzt den Rhythmus. Dein Körper braucht keine Höchstleistung — er braucht ein Signal, dass Ruhe erlaubt ist. Reize reduzieren ist der erste Schritt.',
    tasks: [
      '30 Min bewusst offline — kein Bildschirm',
      'Kein Alkohol heute',
      'Einen festen Zeitpunkt für deine letzte Mahlzeit setzen',
    ],
    taskKeys: ['offline', 'alcohol', 'last_meal'],
  },
  // Tag 2 — Mahlzeiten ordnen
  {
    title: 'Mahlzeiten ordnen',
    goal: 'Zwei klare Mahlzeiten — kein Snacking, kein Chaos.',
    impulse: '„Heute wird es das erste Mal klarer. Du wirst merken, wie sich dein Essverhalten verändert, wenn du bewusst Struktur reinbringst."',
    whyImportant: 'Blutzuckerschwankungen durch chaotisches Essen erzeugen Heißhunger, Müdigkeit und innere Unruhe. Zwei proteinreiche Mahlzeiten stabilisieren das System.',
    tasks: [
      '2 proteinreiche Mahlzeiten — keine Snacks dazwischen',
      'Mindestens 2 Liter Wasser über den Tag verteilt',
      'Nach der letzten Mahlzeit: Küche zu, nichts mehr essen',
    ],
    taskKeys: ['meals', 'water', 'kitchen_closed'],
  },
  // Tag 3 — Bewegung zur Regulation
  {
    title: 'Bewegung zur Regulation',
    goal: 'Ruhige Bewegung als Nervensystem-Regulation, nicht als Training.',
    impulse: '„Tag 3 ist der Punkt, an dem viele aufhören. Nicht weil es schwer ist — sondern weil der Reiz des Neuen nachlässt. Bleib."',
    whyImportant: 'Es geht nicht um Kalorien. Es geht um Rhythmus, Durchblutung und Beruhigung. Ein Spaziergang nach dem Essen reguliert den Blutzucker besser als jedes Supplement.',
    tasks: [
      '30 Min ruhige Bewegung — Spaziergang, kein Workout',
      '2 proteinreiche Mahlzeiten wie gestern',
      '15 Min nach einer Mahlzeit bewusst bewegen',
    ],
    taskKeys: ['movement', 'meals', 'post_meal_walk'],
  },
  // Tag 4 — Schlafanker setzen
  {
    title: 'Schlafanker setzen',
    goal: 'Feste Schlafenszeit als nicht verhandelbaren Ankerpunkt setzen.',
    impulse: '„Ab hier beginnt echte Stabilität. Achte heute darauf, wie du dich fühlst, wenn du zur gleichen Zeit ins Bett gehst."',
    whyImportant: 'Dein Nervensystem reagiert auf Vorhersehbarkeit. Gleiche Schlafenszeit = weniger Cortisol = bessere Regeneration. Nicht Schlaf optimieren — Rhythmus stabilisieren.',
    tasks: [
      'Feste Schlafenszeit festlegen und einhalten (mind. 8h im Bett)',
      '60 Min vor dem Schlafen: kein Bildschirm',
      '2 klare Mahlzeiten — letzte Mahlzeit mind. 2h vor dem Schlafen',
      'Kein Koffein nach 14 Uhr',
    ],
    taskKeys: ['sleep', 'screen_free', 'meals_timed', 'no_caffeine'],
  },
  // Tag 5 — Wenn der Abend kippt
  {
    title: 'Wenn der Abend kippt',
    goal: 'Einen bewussten Abend gestalten, bevor die Gewohnheiten übernehmen.',
    impulse: '„Hier verlieren die meisten die Kontrolle. Nicht durch fehlende Disziplin — sondern weil der Tag nicht strukturiert genug war. Heute änderst du das."',
    whyImportant: 'Der Abend ist der Moment, in dem die meisten Routinen scheitern. Stabilität entsteht durch Entlastung und Vorbereitung, nicht durch Perfektion.',
    tasks: [
      'Abendessen vorher planen — nicht spontan entscheiden',
      'Eine Abendroutine definieren (z.B. Tee, Lesen, Spaziergang)',
      'Kein Bildschirm im Bett',
      'Wenn Heißhunger kommt: 10 Min warten, Wasser trinken',
    ],
    taskKeys: ['plan_dinner', 'evening_routine', 'no_screen_bed', 'hunger_strategy'],
  },
  // Tag 6 — Alltag vereinfachen
  {
    title: 'Alltag vereinfachen',
    goal: 'Alles weglassen, was keinen Beitrag zur Stabilität leistet.',
    impulse: '„Jetzt wird es leicht — wenn du es richtig aufsetzt. Du bist seit fast einer Woche in diesem Rhythmus. Das ist kein Zufall — das ist ein System."',
    whyImportant: 'Heute geht es nicht um neue Routinen. Es geht darum, Reibung zu reduzieren. Vorbereitung und Umgebung entscheiden darüber, ob dein System hält.',
    tasks: [
      'Mahlzeiten für morgen vorbereiten oder planen',
      'Störquellen identifizieren und eine bewusst abstellen',
      'Schlafenszeit wie gestern einhalten',
    ],
    taskKeys: ['meal_prep', 'reduce_friction', 'sleep_anchor'],
  },
  // Tag 7 — Reflexion und Auswertung
  {
    title: 'Reflexion und Auswertung',
    goal: 'Ehrlich hinschauen — was funktioniert, wo hakt es noch.',
    impulse: '„Heute ist der letzte Tag. Nicht das Ende — sondern der Moment, in dem du siehst, was dein Körper wirklich braucht."',
    whyImportant: 'Ein Reset zeigt dir dein Fundament. Die Frage ist jetzt nicht „War ich perfekt?" — sondern „Was hat sich verändert, und was brauche ich als nächstes?"',
    tasks: [
      'Schreib 3 Dinge auf, die sich diese Woche verändert haben',
      'Identifiziere den einen Moment, der am schwierigsten war',
      'Entscheide: Welche eine Gewohnheit behältst du ab morgen bei?',
    ],
    taskKeys: ['write_changes', 'identify_hard', 'keep_habit'],
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

export const SOFT_CONVERSION: Record<number, string> = {
  4: 'Viele merken an diesem Punkt: Die Basics funktionieren — aber es fehlt die Einordnung. Was genau braucht DEIN Körper? Das ist die Frage, die ein Reset allein nicht beantworten kann.',
  5: 'Wenn du merkst, dass dir Struktur fehlt, ist der Reset oft nur der erste Schritt. Das Problem ist selten Disziplin — es ist fehlende Klarheit darüber, was wirklich zu dir passt.',
  6: 'Viele nutzen den Reset als Einstieg und bauen danach mit einem persönlichen Plan darauf auf. Wenn du nach diesem Reset weitermachen willst — nicht allein, sondern mit klarer Begleitung — dann gibt es einen nächsten Schritt.',
};
