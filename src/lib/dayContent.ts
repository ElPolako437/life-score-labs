export interface DayContent {
  title: string;
  goal: string;
  impulse: string;
  whyImportant: string;
}

export const TASKS = [
  '30 Min ruhige Bewegung (5.000–7.000 Schritte)',
  '2 proteinreiche Mahlzeiten, keine Snacks',
  'Feste Schlafenszeit einhalten (mind. 8h im Bett)',
  '30 Min bewusst offline — kein Bildschirm',
  'Kein Alkohol',
];

export const TASK_KEYS = ['movement', 'meals', 'sleep', 'offline', 'alcohol'];

export const DAY_CONTENT: DayContent[] = [
  {
    title: 'Rauschen reduzieren',
    goal: 'Heute geht es darum, bewusst weniger Reize zuzulassen.',
    impulse: 'Heute geht es nicht um Perfektion. Es geht darum, anzufangen. Dein einziges Ziel: den Tag bewusst abschließen.',
    whyImportant: 'Der erste Tag setzt den Rhythmus. Dein Körper braucht keine Höchstleistung — er braucht ein Signal, dass Ruhe erlaubt ist. Reize reduzieren ist der erste Schritt.',
  },
  {
    title: 'Mahlzeiten ordnen',
    goal: 'Zwei klare Mahlzeiten — kein Snacking, kein Chaos.',
    impulse: 'Wiederholung ist kein Stillstand. Sie ist das Fundament. Mach heute dasselbe — und bemerke, wie sich dein Essverhalten verändert.',
    whyImportant: 'Blutzuckerschwankungen durch chaotisches Essen erzeugen Heißhunger, Müdigkeit und innere Unruhe. Zwei proteinreiche Mahlzeiten stabilisieren das System.',
  },
  {
    title: 'Bewegung zur Regulation',
    goal: 'Ruhige Bewegung als Nervensystem-Regulation, nicht als Training.',
    impulse: 'Tag 3 ist der Punkt, an dem viele aufhören. Nicht weil es schwer ist — sondern weil der Reiz des Neuen nachlässt. Bleib.',
    whyImportant: 'Es geht nicht um Kalorien. Es geht um Rhythmus, Durchblutung und Beruhigung. Ein Spaziergang nach dem Essen reguliert den Blutzucker besser als jedes Supplement.',
  },
  {
    title: 'Schlafanker setzen',
    goal: 'Feste Schlafenszeit als nicht verhandelbaren Ankerpunkt setzen.',
    impulse: 'Achte heute bewusst darauf, wie du dich fühlst, wenn du zur gleichen Zeit ins Bett gehst. Nicht bewerten — nur bemerken.',
    whyImportant: 'Dein Nervensystem reagiert auf Vorhersehbarkeit. Gleiche Schlafenszeit = weniger Cortisol = bessere Regeneration. Nicht Schlaf optimieren — Rhythmus stabilisieren.',
  },
  {
    title: 'Wenn der Abend kippt',
    goal: 'Einen bewussten Abend gestalten, bevor die Gewohnheiten übernehmen.',
    impulse: 'Wenn heute ein schwieriger Tag war: Priorisiere. Schlafrhythmus, zwei Mahlzeiten, Reize reduzieren. Mehr brauchst du nicht.',
    whyImportant: 'Der Abend ist der Moment, in dem die meisten Routinen scheitern. Nicht durch fehlende Disziplin, sondern durch fehlende Struktur im Rest des Tages. Stabilität entsteht durch Entlastung, nicht durch Perfektion.',
  },
  {
    title: 'Alltag vereinfachen',
    goal: 'Alles weglassen, was keinen Beitrag zur Stabilität leistet.',
    impulse: 'Du bist seit fast einer Woche in diesem Rhythmus. Das ist keine Challenge — das ist ein System, das du aufgebaut hast.',
    whyImportant: 'Keine neuen Routinen, keine Interventionen. Alles, was sich bewährt hat, bleibt. Diese Phase dient nicht der Veränderung — sondern der Beruhigung.',
  },
  {
    title: 'Reflexion und Auswertung',
    goal: 'Ehrlich hinschauen — was funktioniert, wo hakt es noch.',
    impulse: 'Heute ist der letzte Tag. Nicht das Ende — sondern der Moment, in dem du siehst, was dein Körper wirklich braucht.',
    whyImportant: 'Ein Reset zeigt dir dein Fundament. Die Frage ist jetzt nicht „War ich perfekt?" — sondern „Was hat sich verändert, und was brauche ich als nächstes?"',
  },
];

export const SOFT_CONVERSION: Record<number, string> = {
  4: 'Viele merken an diesem Punkt: Die Basics funktionieren — aber es fehlt die Einordnung. Was genau braucht DEIN Körper? Das ist die Frage, die ein Reset allein nicht beantworten kann.',
  5: 'Wenn du merkst, dass dir Struktur fehlt, ist der Reset oft nur der erste Schritt. Das Problem ist selten Disziplin — es ist fehlende Klarheit darüber, was wirklich zu dir passt.',
  6: 'Viele nutzen den Reset als Einstieg und bauen danach mit einem persönlichen Plan darauf auf. Wenn du nach diesem Reset weitermachen willst — nicht allein, sondern mit klarer Begleitung — dann gibt es einen nächsten Schritt.',
};
