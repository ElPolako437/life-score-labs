// Rückbezug + Synthese-Logik für Tag 5.
// Keine Prozent-Claims, keine medizinische Sprache.

import type { ErnaehrungsTyp, BewegungsTyp, SchlafTyp, MentalTyp, MentalTrigger } from '@/contexts/ResetContext';
import {
  getErnaehrungsContent, getBewegungsContent, getSchlafContent, getMentalContent,
} from '@/lib/pillarAssessment';

// ─── Rückbezug (Tage 2–4) ────────────────────────────────────────────────────

export function getRueckbezug(
  day: number,
  ernaehrungsTyp: ErnaehrungsTyp | null,
  bewegungsTyp: BewegungsTyp | null,
  schlafTyp: SchlafTyp | null,
  mentalTyp: MentalTyp | null,
): string | null {
  if (day === 2) {
    if (ernaehrungsTyp === 'craving')
      return 'Dein Abend-Craving von gestern hängt direkt mit Bewegung zusammen. Ein Post-Meal-Walk senkt den Insulinspiegel und dämpft beides.';
    if (ernaehrungsTyp === 'chaos')
      return 'Unregelmäßiges Essen und wenig Bewegung verstärken sich gegenseitig. Heute zeigen wir wie du beides mit einem Hebel angehst.';
  }
  if (day === 3) {
    if (bewegungsTyp === 'unteraktiviert')
      return 'Wenig Bewegung und unruhiger Schlaf verstärken sich. Dein erster Walk von gestern hat bereits die Voraussetzung für besseren Schlaf geschaffen.';
    if (bewegungsTyp === 'ueberlastet')
      return 'Zu intensives Training ohne Erholung stört auch den Schlaf. Heute schauen wir was wirklich für deine Regeneration nötig ist.';
    if (ernaehrungsTyp === 'craving' || ernaehrungsTyp === 'chaos')
      return 'Unregelmäßige Mahlzeiten und schlechter Schlaf sind fast immer ein Kreislauf. Heute kommt der zweite Teil des Bildes.';
  }
  if (day === 4) {
    if (ernaehrungsTyp === 'craving' && mentalTyp === 'emotionales-essen')
      return 'Jetzt schließt sich der Kreis: Dein Abend-Craving von Tag 1 ist kein Hunger. Es ist dein Ventil.';
    if (schlafTyp && schlafTyp !== 'stabil' && (mentalTyp === 'reizueberflutung' || mentalTyp === 'emotionales-essen'))
      return 'Dein Schlafproblem von gestern und dieses Muster hängen zusammen. Stress und schlechter Schlaf sind fast immer ein Kreislauf.';
    if (bewegungsTyp === 'unteraktiviert' && (mentalTyp === 'struktur' || mentalTyp === 'decision-fatigue'))
      return 'Wenig Bewegung verstärkt Decision Fatigue. Körperliche Aktivität ist einer der stärksten Hebel für mentale Klarheit.';
  }
  return null;
}

// ─── Säulen-Status ────────────────────────────────────────────────────────────

export type SaeulenStatus = 'stark' | 'mittel' | 'schwach';

export interface SaeulenOverview {
  ernaehrung: SaeulenStatus;
  bewegung: SaeulenStatus;
  schlaf: SaeulenStatus;
  mental: SaeulenStatus;
}

export function getSaeulenStatus(
  ernaehrungsTyp: ErnaehrungsTyp | null,
  bewegungsTyp: BewegungsTyp | null,
  schlafTyp: SchlafTyp | null,
  mentalTyp: MentalTyp | null,
): SaeulenOverview {
  return {
    ernaehrung: ernaehrungsStatus(ernaehrungsTyp),
    bewegung:   bewegungsStatus(bewegungsTyp),
    schlaf:     schlafStatus(schlafTyp),
    mental:     mentalStatus(mentalTyp),
  };
}

function ernaehrungsStatus(t: ErnaehrungsTyp | null): SaeulenStatus {
  if (!t) return 'mittel';
  if (t === 'stabil') return 'stark';
  if (t === 'struktur') return 'mittel';
  return 'schwach';
}
function bewegungsStatus(t: BewegungsTyp | null): SaeulenStatus {
  if (!t) return 'mittel';
  if (t === 'stabil') return 'stark';
  if (t === 'unstrukturiert') return 'mittel';
  return 'schwach';
}
function schlafStatus(t: SchlafTyp | null): SaeulenStatus {
  if (!t) return 'mittel';
  if (t === 'stabil') return 'stark';
  if (t === 'abschalten' || t === 'regeneration') return 'mittel';
  return 'schwach';
}
function mentalStatus(t: MentalTyp | null): SaeulenStatus {
  if (!t) return 'mittel';
  if (t === 'struktur' || t === 'decision-fatigue') return 'mittel';
  return 'schwach';
}

const STATUS_ORDER: Record<SaeulenStatus, number> = { schwach: 0, mittel: 1, stark: 2 };

export function getStaerksteSaeule(ov: SaeulenOverview): keyof SaeulenOverview {
  return (Object.entries(ov) as [keyof SaeulenOverview, SaeulenStatus][])
    .sort((a, b) => STATUS_ORDER[b[1]] - STATUS_ORDER[a[1]])[0][0];
}

export function getSchwaechsteSaeule(ov: SaeulenOverview): keyof SaeulenOverview {
  return (Object.entries(ov) as [keyof SaeulenOverview, SaeulenStatus][])
    .sort((a, b) => STATUS_ORDER[a[1]] - STATUS_ORDER[b[1]])[0][0];
}

// ─── Hauptmuster ─────────────────────────────────────────────────────────────

export function getHauptMuster(
  ernaehrungsTyp: ErnaehrungsTyp | null,
  bewegungsTyp: BewegungsTyp | null,
  schlafTyp: SchlafTyp | null,
  mentalTyp: MentalTyp | null,
): string {
  if (mentalTyp === 'emotionales-essen' && (ernaehrungsTyp === 'craving' || ernaehrungsTyp === 'chaos'))
    return 'Stress und emotionales Essen erzeugen einen Kreislauf: Druck tagsüber → Abend-Snacks → unruhiger Schlaf → weniger Energie → mehr Druck.';
  if (schlafTyp === 'zu-wenig' && ernaehrungsTyp === 'chaos')
    return 'Wenig Schlaf erhöht das Hungerhormon und macht strukturiertes Essen schwerer: weniger Schlaf → mehr Cravings → chaotisches Essen → noch weniger Energie.';
  if (ernaehrungsTyp === 'craving' && (schlafTyp === 'rhythmus' || schlafTyp === 'abschalten'))
    return 'Zu wenig Protein tagsüber führt zu Abendhunger, spätem Essen und damit zu schlechterem Schlaf. Das wiederholt sich täglich.';
  if (bewegungsTyp === 'unteraktiviert' && (schlafTyp === 'regeneration' || schlafTyp === 'rhythmus'))
    return 'Zu wenig Bewegung macht den Schlaf flacher. Flacher Schlaf erhöht das Stressgefühl. Mehr Stress bedeutet weniger Antrieb. Der Kreis schließt sich.';
  if (mentalTyp === 'reizueberflutung' && (schlafTyp === 'abschalten' || schlafTyp === 'zu-wenig'))
    return 'Viel Bildschirmzeit hält das Nervensystem im Alarm-Modus: schwerer abschalten → kürzerer Schlaf → niedrigere Reizschwelle → noch mehr Ablenkungssuche.';
  if (bewegungsTyp === 'ueberlastet' && (schlafTyp === 'regeneration' || mentalTyp === 'emotionales-essen'))
    return 'Zu viel Training ohne Erholung erhöht Cortisol dauerhaft: mehr Training → schlechtere Regeneration → mehr Stress → schlechtere Entscheidungen am Abend.';
  if (mentalTyp === 'decision-fatigue' && (ernaehrungsTyp === 'craving' || ernaehrungsTyp === 'chaos'))
    return 'Leeres Entscheidungsbudget abends und chaotisches Essen verstärken sich: zu viele Entscheidungen → kein Rahmen mehr → Abend-Essen unkontrolliert.';
  // Fallback: single weakest pillar
  const ov = getSaeulenStatus(ernaehrungsTyp, bewegungsTyp, schlafTyp, mentalTyp);
  const weakest = getSchwaechsteSaeule(ov);
  const labels: Record<keyof SaeulenOverview, string> = {
    ernaehrung: 'Ernährung', bewegung: 'Bewegung', schlaf: 'Schlaf', mental: 'Mentale Klarheit',
  };
  return `Deine schwächste Säule ist ${labels[weakest]}. Eine Säule zu stabilisieren zieht die anderen mit.`;
}

// ─── Mini-Rahmen (ein Hebel pro Säule) ───────────────────────────────────────

export interface MiniRahmenEntry {
  icon: string;
  label: string;
  hebel: string;
  status: SaeulenStatus;
}

export function getMiniRahmen(
  ernaehrungsTyp: ErnaehrungsTyp | null,
  bewegungsTyp: BewegungsTyp | null,
  schlafTyp: SchlafTyp | null,
  mentalTyp: MentalTyp | null,
  mentalTrigger: MentalTrigger,
  ov: SaeulenOverview,
): MiniRahmenEntry[] {
  return [
    {
      icon: '⚡',
      label: 'Ernährung & Energie',
      hebel: ernaehrungsTyp ? getErnaehrungsContent(ernaehrungsTyp).hebel : 'Zwei feste Mahlzeiten mit Protein-Anker täglich.',
      status: ov.ernaehrung,
    },
    {
      icon: '🏃',
      label: 'Bewegung & Training',
      hebel: bewegungsTyp ? getBewegungsContent(bewegungsTyp).hebel : 'Post-Meal Walk: 10 bis 15 Minuten direkt nach der größten Mahlzeit.',
      status: ov.bewegung,
    },
    {
      icon: '🌙',
      label: 'Regeneration & Schlaf',
      hebel: schlafTyp ? getSchlafContent(schlafTyp).hebel : 'Alarm auf EINSCHLAFEN stellen, nicht auf Aufwachen.',
      status: ov.schlaf,
    },
    {
      icon: '🧠',
      label: 'Mentale Klarheit',
      hebel: mentalTyp ? getMentalContent(mentalTyp, mentalTrigger).hebel : 'Zwischen 15 und 16 Uhr: 10 Minuten ohne Bildschirm.',
      status: ov.mental,
    },
  ];
}

// ─── Sprint-Bridge: empfohlener nächster Schritt ──────────────────────────────

type GoalKey = 'energie' | 'abnehmen' | 'muskel' | 'gesundheit';

const SPRINT_STEP: Record<keyof SaeulenOverview, Partial<Record<GoalKey, string>>> = {
  ernaehrung: {
    energie:    'Dein Energie-Problem hat eine Ernährungs-Wurzel. Im Sprint bekommst du einen Mahlzeitenplan der das konkret löst.',
    abnehmen:   'Fettverlust beginnt mit Ernährungsstruktur. Im Sprint bauen wir genau das auf.',
    muskel:     'Ohne ausreichend Protein bleiben Muskeln aus. Im Sprint definieren wir deine konkrete Protein-Strategie.',
    gesundheit: 'Ernährungsstruktur ist die Basis für alles. Im Sprint übersetzen wir deinen Rahmen in einen konkreten Plan.',
  },
  bewegung: {
    energie:    'Mehr Energie kommt oft von Bewegungsrhythmus, nicht von Training. Im Sprint bauen wir deinen Rhythmus.',
    abnehmen:   'Bewegung ist dein zweitstärkster Fettverlust-Hebel. Im Sprint entwickeln wir deinen Plan.',
    muskel:     'Im Sprint baust du einen Trainingsplan der zu deinem Alltag passt, nicht gegen ihn.',
    gesundheit: 'Bewegungsrhythmus ist einfacher als Training. Im Sprint zeigen wir dir was wirklich nötig ist.',
  },
  schlaf: {
    energie:    'Schlechter Schlaf ist der häufigste Energie-Räuber. Im Sprint lösen wir das Problem an der Wurzel.',
    abnehmen:   'Schlafmangel erhöht das Hungerhormon. Im Sprint optimieren wir deinen Schlaf für Fettverlust.',
    muskel:     'Regeneration passiert im Schlaf. Im Sprint bauen wir deinen persönlichen Schlafplan.',
    gesundheit: 'Schlaf ist die Basis für alles andere. Im Sprint entwickeln wir deinen Schlafplan.',
  },
  mental: {
    energie:    'Stress-Management ist oft der direkteste Weg zu mehr Energie. Im Sprint arbeiten wir an deinem Muster.',
    abnehmen:   'Emotionales Essen ist einer der häufigsten Fettverlust-Blocker. Im Sprint gehen wir gezielt dagegen vor.',
    muskel:     'Mentale Klarheit unterstützt Trainings-Konsistenz. Im Sprint bauen wir beides zusammen.',
    gesundheit: 'Stressmanagement ist für langfristige Gesundheit wichtiger als die meisten Supplements.',
  },
};

export function getSprintNextStep(
  schwaechsteSaeule: keyof SaeulenOverview,
  goal: string | null,
): string {
  const goalKey = (goal as GoalKey) ?? 'gesundheit';
  return SPRINT_STEP[schwaechsteSaeule]?.[goalKey]
    ?? 'Im Sprint bauen wir aus deinen 4 Säulen ein konkretes System für deinen Alltag.';
}
