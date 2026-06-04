// Reset = Diagnose + 1 Hebel. Lösung & Plan = Sprint. Spannung offen halten.

import type {
  Tag1Data, Tag2Data, Tag3Data, Tag4Data,
  ErnaehrungsTyp, BewegungsTyp, SchlafTyp, MentalTyp, MentalTrigger,
} from '@/contexts/ResetContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function round50(n: number): number { return Math.round(n / 50) * 50; }
function round10(n: number): number { return Math.round(n / 10) * 10; }

// ─── TAG 1: ERNÄHRUNG & ENERGIE ───────────────────────────────────────────────

const AKTIVITAETS_FAKTOR: Record<Tag1Data['aktivitaet'], number> = {
  sitzend: 1.2,
  moderat: 1.375,
  aktiv: 1.55,
  sehr_aktiv: 1.725,
};

const ZIEL_ANPASSUNG: Record<Tag1Data['ziel'], number> = {
  abnehmen: -350,
  muskel: 200,
  energie: 0,
  gesundheit: 0,
};

export interface EnergyResult {
  energieRahmen: { min: number; max: number };
  proteinAnker: { min: number; max: number };
  hasValidData: boolean;
}

export function calcTag1Energy(data: Tag1Data): EnergyResult {
  const { alter, geschlecht, groesse, gewicht, aktivitaet, ziel } = data;
  if (!gewicht || !groesse || !alter || gewicht <= 0 || groesse <= 0 || alter <= 0) {
    return { energieRahmen: { min: 0, max: 0 }, proteinAnker: { min: 0, max: 0 }, hasValidData: false };
  }
  const bmrM = 10 * gewicht + 6.25 * groesse - 5 * alter + 5;
  const bmrW = 10 * gewicht + 6.25 * groesse - 5 * alter - 161;
  const bmr = geschlecht === 'm' ? bmrM : geschlecht === 'w' ? bmrW : (bmrM + bmrW) / 2;
  const tdee = bmr * (AKTIVITAETS_FAKTOR[aktivitaet] ?? 1.375);
  const adj = ZIEL_ANPASSUNG[ziel] ?? 0;
  return {
    energieRahmen: { min: round50(tdee + adj - 100), max: round50(tdee + adj + 100) },
    proteinAnker: { min: round10(gewicht * 1.8), max: round10(gewicht * 2.0) },
    hasValidData: true,
  };
}

export function determineErnaehrungsTyp(data: Tag1Data): ErnaehrungsTyp {
  const m = data.mahlzeiten;
  if (m === 'snacking' || m === 'abends_mehr') return 'craving';
  if (m === 'unregelmaessig') return 'chaos';
  if (m === 'regelmaessig') return 'stabil';
  return 'struktur';
}

// ─── TAG 2: BEWEGUNG & TRAINING ──────────────────────────────────────────────

export function determineBewegungsTyp(data: Tag2Data): BewegungsTyp {
  const { schritte, frequenz, gefuehl } = data;
  if (frequenz === '5plus' && gefuehl === 'erschoepft') return 'ueberlastet';
  if (schritte === 'u3000' && (frequenz === 'keins' || frequenz === '1-2')) return 'unteraktiviert';
  if (gefuehl === 'gut' && (frequenz === '3-4' || frequenz === '5plus')) return 'stabil';
  return 'unstrukturiert';
}

// ─── TAG 3: REGENERATION & SCHLAF ────────────────────────────────────────────

export function determineSchlafTyp(data: Tag3Data): SchlafTyp {
  const { dauer, regelmaessigkeit, morgenBildschirm } = data;
  if (dauer === 'u6') return 'zu-wenig';
  if (regelmaessigkeit === 'stark' || regelmaessigkeit === 'keins') return 'rhythmus';
  if (morgenBildschirm === 'erschoepft' && (dauer === '7-8' || dauer === '8plus')) return 'regeneration';
  if (morgenBildschirm === 'schwer' || morgenBildschirm === 'erschoepft') return 'abschalten';
  return 'stabil';
}

// ─── TAG 4: MENTALE KLARHEIT & STRESS ────────────────────────────────────────

export function determineMentalTyp(data: Tag4Data): { typ: MentalTyp; trigger: MentalTrigger } {
  const { kippPunkt, stress, abendVerhalten } = data;
  if (abendVerhalten === 'oft_essen' || abendVerhalten === 'manchmal') {
    const trigger: MentalTrigger = (stress === 'hoch' || stress === 'sehr_hoch') ? 'stress' : 'belohnung';
    return { typ: 'emotionales-essen', trigger };
  }
  if (stress === 'hoch' || stress === 'sehr_hoch') return { typ: 'reizueberflutung', trigger: null };
  if (abendVerhalten === 'leer') return { typ: 'decision-fatigue', trigger: null };
  return { typ: 'struktur', trigger: null };
}

// ─── CONTENT: Ergebnis-Karten-Texte ──────────────────────────────────────────

export interface PillarContent {
  headline: string;
  einordnung: string;
  hebel: string;
  tagesaufgabe: string;
  davidMessage: string;
  sprintBruecke: string;
  appTeaser?: string;
}

// TAG 1 — kein appTeaser (Zahlenwert-Vertrauen nicht durch Produkt-Pitch brechen)
const ERNAEHRUNGS_CONTENT: Record<ErnaehrungsTyp, PillarContent> = {
  chaos: {
    headline: 'Dein Energiehaushalt hat keinen Rhythmus',
    einordnung: 'Dein Körper weiß gerade nicht wann die nächste Mahlzeit kommt. Das klingt harmlos, kostet aber täglich Energie. Unregelmäßige Mahlzeiten halten den Insulinspiegel instabil. Du isst nicht zu viel oder zu wenig. Du isst zu unstrukturiert.',
    hebel: 'Entscheide heute Morgen wann du essen wirst. Nicht was, wann.',
    tagesaufgabe: 'Iss heute 2 Mahlzeiten mit einer Handfläche Protein pro Mahlzeit. Kein Kalorienzählen. Nur Protein beobachten.',
    davidMessage: 'Die meisten sagen mir nach Tag 1: Ich wusste gar nicht wie chaotisch mein Essalltag ist. Heute beobachtest du das einfach.',
    sprintBruecke: 'Im Sprint übersetzen wir deinen Rahmen in konkrete Mahlzeiten, Portionen und Anpassungen für dein Ziel.',
  },
  craving: {
    headline: 'Dein Abend-Problem ist ein Mittags-Problem',
    einordnung: 'Der Heißhunger abends entsteht nicht abends. Er entsteht wenn tagsüber die Mahlzeiten zu wenig Protein hatten oder das letzte Essen zu früh war. Abend-Cravings sind fast immer ein Signal von fehlender Struktur früher am Tag.',
    hebel: 'Füge deiner nächsten Mahlzeit bewusst eine Handfläche Protein hinzu. Nur das.',
    tagesaufgabe: 'Iss heute 2 Mahlzeiten mit einer Handfläche Protein. Beobachte wie sich dein Abend anfühlt.',
    davidMessage: 'Abend-Cravings sind das häufigste Thema das ich höre. Der Fehler liegt fast nie am Abend selbst.',
    sprintBruecke: 'Im Sprint bauen wir aus deinem Rahmen konkrete Mahlzeiten die Abend-Cravings strukturell verhindern.',
  },
  struktur: {
    headline: 'Der Rahmen fehlt, nicht der Wille',
    einordnung: 'Du machst es manchmal richtig und manchmal nicht. Das liegt nicht an Motivation. Es fehlt ein verlässlicher Mahlzeiten-Rahmen der auch hält wenn der Tag voll wird. Mit einer festen Struktur brauchst du keinen Willen mehr.',
    hebel: 'Entscheide heute Morgen wann du essen wirst. Nicht was, wann.',
    tagesaufgabe: 'Leg heute Morgen Uhrzeit und ungefähren Inhalt beider Mahlzeiten fest. Keine spontanen Entscheidungen.',
    davidMessage: 'Ein fester Mahlzeiten-Rahmen ist das einfachste System das es gibt. Und es funktioniert.',
    sprintBruecke: 'Im Sprint übersetzen wir deinen Energie-Rahmen in einen konkreten Mahlzeitenrhythmus für deinen Alltag.',
  },
  stabil: {
    headline: 'Du hast eine Basis die wir optimieren können',
    einordnung: 'Deine Ernährungsstruktur ist grundsolide. Der nächste Schritt ist Feinabstimmung: Wie viel Protein brauchst du konkret für dein Ziel? Zu welchen Zeiten isst du am effektivsten? Das sind Fragen die ein allgemeiner Reset nicht beantworten kann.',
    hebel: 'Beobachte heute gedanklich dein Protein. Nicht Kalorien. Nur Protein.',
    tagesaufgabe: 'Iss heute 2 Mahlzeiten und beobachte wie viel Protein wirklich drinsteckt. Schätzung reicht.',
    davidMessage: 'Eine gute Basis ist der beste Startpunkt. Jetzt geht es um die Feinabstimmung.',
    sprintBruecke: 'Im Sprint optimieren wir deine vorhandene Basis: Protein-Verteilung, Timing und Anpassung an dein Ziel.',
  },
};

// TAG 2
const BEWEGUNGS_CONTENT: Record<BewegungsTyp, PillarContent> = {
  unteraktiviert: {
    headline: 'Dein Körper wartet auf das Signal',
    einordnung: 'Zu wenig Bewegung ist für viele das stille Problem. Nicht weil du faul bist, sondern weil der Alltag keinen natürlichen Platz dafür hat. Dein Nervensystem wird mit regelmäßiger, ruhiger Bewegung deutlich stabiler. Kein Gym nötig. Nur Konsistenz.',
    hebel: '10 Minuten direkt nach der größten Mahlzeit spazieren gehen.',
    tagesaufgabe: 'Post-Meal Walk: 10 bis 15 Minuten direkt nach der größten Mahlzeit. Kein Podcast, kein Handy.',
    davidMessage: 'Der Post-Meal Walk ist einer der unterschätztesten Hebel. Einfach und es funktioniert.',
    sprintBruecke: 'Im Sprint bauen wir daraus deinen Bewegungsrhythmus: Kraft, Schritte und Erholung.',
    appTeaser: 'Die CALINESS App wird deine Schritte und deinen Bewegungs-Score über Zeit sichtbar machen.',
  },
  ueberlastet: {
    headline: 'Du trainierst gegen deinen Körper',
    einordnung: 'Zu viel Training ohne ausreichende Erholung ist genauso problematisch wie zu wenig. Dein Körper regeneriert nicht beim Training, er regeneriert danach. Wenn Erschöpfung das dominante Gefühl nach Sport ist, ist mehr Training selten die Lösung.',
    hebel: 'Aktive Erholung statt Training. 30 Minuten ruhiger Spaziergang.',
    tagesaufgabe: '30 Minuten ruhige Bewegung. Kein Workout. Nur gehen.',
    davidMessage: 'Mehr ist nicht immer mehr. Manchmal ist weniger Intensität die entscheidende Veränderung.',
    sprintBruecke: 'Im Sprint bauen wir eine Balance zwischen Trainingsreiz und Erholung die wirklich trägt.',
    appTeaser: 'Die App wird deine Trainings- und Erholungsbalance über Zeit tracken.',
  },
  unstrukturiert: {
    headline: 'Viel Energie, kein System',
    einordnung: 'Du weißt was zu tun wäre und machst es auch manchmal. Das Problem ist nicht Wissen oder Wille. Es ist das Fehlen eines verlässlichen Rhythmus. Ohne festen Rhythmus hängt Bewegung an Motivation, und Motivation ist keine verlässliche Grundlage.',
    hebel: 'Lege jetzt eine feste Zeit für Bewegung morgen fest. Nicht was, wann.',
    tagesaufgabe: 'Post-Meal Walk heute. Gleiche Uhrzeit für morgen einplanen.',
    davidMessage: 'Gewohnheiten brauchen Wiederholung, keine Motivation. Eine feste Zeit reicht.',
    sprintBruecke: 'Im Sprint entwickeln wir deinen persönlichen Bewegungsrhythmus mit verlässlichen Ankerpunkten.',
    appTeaser: 'Die App macht deinen Bewegungsrhythmus über die Wochen sichtbar.',
  },
  stabil: {
    headline: 'Gute Basis, nächste Ebene',
    einordnung: 'Du bewegst dich regelmäßig und das hilft dir. Das ist die beste Ausgangslage. Der nächste Schritt ist Optimierung: Ist dein Training wirklich auf dein Ziel ausgerichtet? Stimmt die Balance zwischen Intensität und Erholung?',
    hebel: 'Post-Meal Walk nach der größten Mahlzeit hinzufügen. 10 bis 15 Minuten.',
    tagesaufgabe: 'Post-Meal Walk: 10 bis 15 Minuten direkt nach der größten Mahlzeit.',
    davidMessage: 'Eine gute Bewegungsbasis ist selten. Jetzt optimieren wir sie.',
    sprintBruecke: 'Im Sprint optimieren wir deine vorhandene Bewegungsbasis für dein konkretes Ziel.',
    appTeaser: 'Die App trackt deinen Fortschritt über Zeit.',
  },
};

// TAG 3
const SCHLAF_CONTENT: Record<SchlafTyp, PillarContent> = {
  'zu-wenig': {
    headline: 'Dein Körper bekommt nicht genug Zeit',
    einordnung: 'Unter 6 Stunden Schlaf ist keine Lifestyle-Entscheidung, es ist ein biologisches Defizit. Kognitive Leistung, Stoffwechsel und Immunsystem werden direkt beeinflusst. Das ist der Startpunkt für alles andere.',
    hebel: 'Schlafenszeit heute um 30 Minuten vorverlegen. Nicht mehr, nur 30 Minuten.',
    tagesaufgabe: 'Alarm heute auf EINSCHLAFEN stellen, 30 Minuten früher als gestern.',
    davidMessage: 'Dreißig Minuten früher macht mehr Unterschied als du denkst.',
    sprintBruecke: 'Im Sprint prüfen wir genauer was deinen Schlaf konkret blockiert und bauen deinen persönlichen Schlafplan.',
    appTeaser: 'Die App wird deinen Schlaf-Score über Zeit tracken.',
  },
  rhythmus: {
    headline: 'Dein Körper hat keinen festen Takt',
    einordnung: 'Variable Schlafenszeiten sind für deinen Körper wie Jetlag ohne Flug. Das Timing ist wichtiger als die Stundenzahl. 7 Stunden immer zur gleichen Zeit sind wertvoller als 8 Stunden chaotisch verteilt.',
    hebel: 'Entscheide jetzt deine feste Schlafenszeit für diese Woche. Alarm auf EINSCHLAFEN stellen.',
    tagesaufgabe: 'Alarm auf EINSCHLAFEN stellen, nicht auf Aufwachen. Feste Zeit für heute.',
    davidMessage: 'Stell den Alarm auf EINSCHLAFEN, nicht auf Aufwachen. Das klingt banal und macht den Unterschied.',
    sprintBruecke: 'Im Sprint bauen wir deinen individuellen Schlafrhythmus mit konkretem Timing.',
    appTeaser: 'Die App macht deine Schlafrhythmus-Stabilität über Zeit sichtbar.',
  },
  abschalten: {
    headline: 'Dein Gehirn bekommt kein Schlaf-Signal',
    einordnung: 'Bildschirme bis kurz vor dem Schlafen blockieren die Melatonin-Produktion. Das ist keine Theorie, das ist Physiologie. Dein Körper braucht ein klares Signal dass der Tag vorbei ist. Das Handy im Bett ist das Gegenteil davon.',
    hebel: 'Kein Bildschirm 45 Minuten vor dem Schlafen. Nur heute. Beobachte was passiert.',
    tagesaufgabe: 'Kein Bildschirm 45 Minuten vor der Schlafenszeit. Einmal ausprobieren.',
    davidMessage: 'Ich war skeptisch als ich das selbst ausprobiert habe. Der Unterschied war sofort spürbar.',
    sprintBruecke: 'Im Sprint entwickeln wir eine Abend-Routine die deinem Gehirn das richtige Signal gibt.',
    appTeaser: 'Die App wird deine Schlafqualität über Zeit messen.',
  },
  regeneration: {
    headline: 'Die Stunden stimmen aber die Qualität nicht',
    einordnung: 'Wenn du 7 bis 8 Stunden schläfst und trotzdem erschöpft aufwachst, liegt es selten am Schlaf selbst. Stresshormone, späte Mahlzeiten oder fehlende Abschaltroutinen können die Schlaftiefe blockieren, auch wenn die Dauer stimmt.',
    hebel: 'Letzte Mahlzeit heute 3 Stunden vor dem Schlafen. Beobachte morgen früh den Unterschied.',
    tagesaufgabe: 'Letzte Mahlzeit 3 Stunden vor dem Schlafen. Morgen früh beobachten.',
    davidMessage: 'Schlaftiefe wird oft unterschätzt. Die Stunden zählen, die Qualität entscheidet.',
    sprintBruecke: 'Im Sprint prüfen wir ob dein Schlafproblem an Timing, Ernährung oder Stress hängt.',
    appTeaser: 'Die App wird deine Erholung und Schlaftiefe über Zeit sichtbar machen.',
  },
  stabil: {
    headline: 'Dein Schlaf ist eine gute Basis',
    einordnung: 'Du schläfst regelmäßig und wachst erholt auf. Das ist die beste Ausgangslage. Der nächste Schritt ist Optimierung für dein spezifisches Ziel.',
    hebel: 'Schlafenszeit heute auf die Minute beibehalten. Konsistenz ist dein Hebel.',
    tagesaufgabe: 'Schlafenszeit heute auf die Minute einhalten. Konsistenz stärken.',
    davidMessage: 'Guter Schlaf ist die Basis für alles andere. Du hast einen echten Vorteil.',
    sprintBruecke: 'Im Sprint optimieren wir deinen Schlaf für dein spezifisches Ziel.',
    appTeaser: 'Die App trackt deine Schlaf-Stabilität über Zeit.',
  },
};

// TAG 4 — emotionales-essen hat optionalen hebelBelohnung je nach Trigger
interface MentalContentEntry extends PillarContent {
  hebelBelohnung?: string;
}

const MENTAL_CONTENT: Record<MentalTyp, MentalContentEntry> = {
  'emotionales-essen': {
    headline: 'Essen ist dein Ventil',
    einordnung: 'Emotionales Essen ist keine Schwäche. Es ist ein biologischer Mechanismus. Wenn Stress oder ein harter Tag nach Kompensation rufen, greift der Körper zu schneller Energie. Das Muster zu kennen ist der erste Schritt es zu unterbrechen.',
    hebel: 'Wenn Craving kommt: 10 Minuten warten, ein Glas Wasser, dann entscheiden.',
    hebelBelohnung: 'Definiere eine konkrete Non-Food-Belohnung für heute Abend.',
    tagesaufgabe: 'Zwischen 15 und 16 Uhr: 10 Minuten ohne Bildschirm, ohne Kaffee, ohne Aufgabe.',
    davidMessage: 'Das Muster zu erkennen ist schwerer als es zu ändern. Du hast den ersten Schritt gemacht.',
    sprintBruecke: 'Im Sprint arbeiten wir gezielt an deinem Muster mit konkreten Verhaltens-Strategien.',
    appTeaser: 'Die App wird deinen Mentale-Klarheit-Score über Zeit tracken.',
  },
  reizueberflutung: {
    headline: 'Dein System verarbeitet zu viele Signale',
    einordnung: 'Dauerhaft viel Bildschirmzeit bedeutet Dauerstress für dein Nervensystem. Nicht wegen des Inhalts, sondern wegen des Rhythmus. Jede Benachrichtigung ist ein kleines Stresssignal. Die Summe davon erschöpft genauso wie echter Stress, nur leiser.',
    hebel: 'Erste 30 Minuten nach dem Aufwachen kein Handy. Nur morgen früh.',
    tagesaufgabe: 'Zwischen 15 und 16 Uhr: 10 Minuten ohne Bildschirm und ohne Aufgabe.',
    davidMessage: 'Reizreduktion ist keine Wellness-Empfehlung. Es ist Biologie.',
    sprintBruecke: 'Im Sprint entwickeln wir konkrete Reizmanagement-Strategien für deinen Alltag.',
    appTeaser: 'Die App wird deinen Mentale-Klarheit-Score sichtbar machen.',
  },
  struktur: {
    headline: 'Ohne Anker folgst du Impulsen',
    einordnung: 'Wenn der Tag keine festen Punkte hat folgst du dem was gerade naheliegend ist. Meistens ist das nicht das was dir hilft. Drei feste Ankerpunkte im Tag reichen um das grundlegend zu verändern. Nicht zehn. Drei.',
    hebel: 'Lege jetzt drei feste Punkte für morgen fest: Wann aufstehen, wann essen, wann schlafen.',
    tagesaufgabe: 'Zwischen 15 und 16 Uhr: 10 Minuten Pause. Ohne Bildschirm, ohne Aufgabe.',
    davidMessage: 'Drei Ankerpunkte verändern den ganzen Tag. Keine zehn, drei.',
    sprintBruecke: 'Im Sprint bauen wir deine persönliche Tagesstruktur mit verlässlichen Ankerpunkten.',
    appTeaser: 'Die App macht deine Tagesstruktur über Zeit sichtbar.',
  },
  'decision-fatigue': {
    headline: 'Dein Entscheidungsbudget ist täglich leer',
    einordnung: 'Jede Entscheidung kostet mentales Budget. Wer abends chronisch schlechte Entscheidungen trifft, hat tagsüber zu viele getroffen. Die Lösung ist nicht mehr Disziplin, sondern weniger Entscheidungen durch vorausschauende Planung.',
    hebel: 'Treffe heute Abend drei Entscheidungen für morgen: Was essen, was anziehen, wann schlafen.',
    tagesaufgabe: 'Zwischen 15 und 16 Uhr: 10 Minuten Pause ohne Bildschirm.',
    davidMessage: 'Weniger Entscheidungen bedeutet mehr Energie für das Wichtige.',
    sprintBruecke: 'Im Sprint bauen wir ein System das täglich Entscheidungen für dich trifft.',
    appTeaser: 'Die App reduziert tägliche Entscheidungen durch einen personalisierten Plan.',
  },
};

// ─── Getter ───────────────────────────────────────────────────────────────────

export function getErnaehrungsContent(typ: ErnaehrungsTyp): PillarContent {
  return ERNAEHRUNGS_CONTENT[typ];
}

export function getBewegungsContent(typ: BewegungsTyp): PillarContent {
  return BEWEGUNGS_CONTENT[typ];
}

export function getSchlafContent(typ: SchlafTyp): PillarContent {
  return SCHLAF_CONTENT[typ];
}

export function getMentalContent(typ: MentalTyp, trigger?: MentalTrigger): PillarContent {
  const entry = MENTAL_CONTENT[typ];
  if (typ === 'emotionales-essen' && trigger === 'belohnung' && entry.hebelBelohnung) {
    return { ...entry, hebel: entry.hebelBelohnung };
  }
  return entry;
}
