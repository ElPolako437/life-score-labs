// Rückbezug-Logik: zeigt dem Nutzer wie seine Säulen zusammenhängen.
// Nur anzeigen wenn eine echte Verbindung besteht. Kein Fallback-Text erzwingen.

import type { ErnaehrungsTyp, BewegungsTyp, SchlafTyp, MentalTyp } from '@/contexts/ResetContext';

export function getRueckbezug(
  day: number,
  ernaehrungsTyp: ErnaehrungsTyp | null,
  bewegungsTyp: BewegungsTyp | null,
  schlafTyp: SchlafTyp | null,
  mentalTyp: MentalTyp | null,
): string | null {
  // Defensive: frühere Typen fehlen noch → kein Rückbezug
  if (day === 2) {
    if (ernaehrungsTyp === 'craving') {
      return 'Dein Abend-Craving von gestern hängt direkt mit Bewegung zusammen. Ein Post-Meal-Walk senkt den Insulinspiegel und dämpft beides.';
    }
    if (ernaehrungsTyp === 'chaos') {
      return 'Unregelmäßiges Essen und wenig Bewegung verstärken sich gegenseitig. Heute zeigen wir wie du beides mit einem Hebel angehst.';
    }
  }

  if (day === 3) {
    if (bewegungsTyp === 'unteraktiviert') {
      return 'Wenig Bewegung und unruhiger Schlaf verstärken sich. Dein erster Walk von gestern hat bereits die Voraussetzung für besseren Schlaf geschaffen.';
    }
    if (bewegungsTyp === 'ueberlastet') {
      return 'Zu intensives Training ohne Erholung stört auch den Schlaf. Heute schauen wir was wirklich für deine Regeneration nötig ist.';
    }
    if (ernaehrungsTyp === 'craving' || ernaehrungsTyp === 'chaos') {
      return 'Unregelmäßige Mahlzeiten und schlechter Schlaf sind fast immer ein Kreislauf. Heute kommt der zweite Teil des Bildes.';
    }
  }

  if (day === 4) {
    if (ernaehrungsTyp === 'craving' && mentalTyp === 'emotionales-essen') {
      return 'Jetzt schließt sich der Kreis: Dein Abend-Craving von Tag 1 ist kein Hunger. Es ist dein Ventil.';
    }
    if (schlafTyp && schlafTyp !== 'stabil' && (mentalTyp === 'reizueberflutung' || mentalTyp === 'emotionales-essen')) {
      return 'Dein Schlafproblem von gestern und dieses Muster hängen zusammen. Stress und schlechter Schlaf sind fast immer ein Kreislauf.';
    }
    if (bewegungsTyp === 'unteraktiviert' && (mentalTyp === 'struktur' || mentalTyp === 'decision-fatigue')) {
      return 'Wenig Bewegung verstärkt Decision Fatigue. Körperliche Aktivität ist einer der stärksten Hebel für mentale Klarheit.';
    }
  }

  return null;
}
