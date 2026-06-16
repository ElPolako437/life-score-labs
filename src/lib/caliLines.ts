import type { ResetState } from '@/contexts/ResetContext';

/**
 * Cali — a calm, intelligent coach voice. One short, data-aware line per day.
 * Never salesy, never over-the-top. Uses the user's own data when available.
 */
export function caliLine(dayNum: number, state: ResetState): string {
  const name = state.name?.trim();
  const hi = name ? `, ${name}` : '';
  const profile = state.profile;

  switch (dayNum) {
    case 1:
      return profile
        ? `Das sind deine echten Zahlen${hi} — kein Raten mehr. Heute zählt nur der erste Schritt.`
        : `Schön, dass du da bist${hi}. Lass uns mit deinen echten Zahlen starten — nicht mit Allgemeinplätzen.`;
    case 2:
      return profile
        ? `${profile.proteinLow}–${profile.proteinHigh} g klingt viel — auf ${profile.mealCount} Mahlzeiten verteilt ist es machbar. Heute zählt Umsetzung, nicht Perfektion.`
        : `Heute geht's um Umsetzung${hi}, nicht um neue Regeln.`;
    case 3:
      return `Bewegung schlägt Perfektion${hi}. Ein ruhiger Spaziergang zählt mehr, als die meisten glauben.`;
    case 4:
      return `Schlaf ist dein Reset-Knopf${hi}. Heute eine Sache besser zu machen reicht völlig.`;
    case 5:
      return `Wenn dein Tag kippt, liegt's selten an Disziplin${hi}. Wir finden das Muster dahinter.`;
    case 6:
      return `Fast eine ganze Woche${hi} — das ist kein Zufall mehr, das ist ein System. Jetzt baust du das Gerüst dafür.`;
    case 7:
      return `Letzter Tag${hi}. Schau ehrlich hin — die Daten gehören dir, egal wie es weitergeht.`;
    default:
      return `Schritt für Schritt${hi}. Konstanz schlägt Intensität.`;
  }
}
