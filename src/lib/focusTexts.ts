import type { Goal, Hurdle } from '@/contexts/ResetContext';

const texts: Record<Goal, Record<Hurdle, string>> = {
  energy: {
    stress: 'Dein Fokus: Dein Nervensystem entlasten. Wenn Stress dominiert, fehlt dem Körper die Grundlage für Energie. In den nächsten 7 Tagen baust du genau diese Grundlage auf.',
    time: 'Dein Fokus: Weniger tun, aber richtig. Energie entsteht nicht durch mehr Maßnahmen, sondern durch klare Prioritäten. 7 Tage, um deinen Rhythmus zu finden.',
    nutrition: 'Dein Fokus: Blutzucker stabilisieren. Schwankende Energie hängt oft direkt an chaotischer Ernährung. Zwei strukturierte Mahlzeiten verändern mehr als du denkst.',
    consistency: 'Dein Fokus: Einen Rhythmus etablieren, der hält. Nicht Motivation ist dein Problem — sondern ein fehlendes System. 7 Tage reichen, um das zu ändern.',
    evening: 'Dein Fokus: Den Abend entschärfen. Wenn abends die Kontrolle wegbricht, fehlt tagsüber die Struktur. Wir bauen sie auf — Schritt für Schritt.',
  },
  fatloss: {
    stress: 'Dein Fokus: Erst das System beruhigen, dann optimieren. Fettverlust unter Dauerstress funktioniert nicht nachhaltig. Stabilität kommt vor Kaloriendefizit.',
    time: 'Dein Fokus: Einfachheit. Fettverlust braucht kein aufwendiges Programm — sondern zwei gute Mahlzeiten, Bewegung und Schlaf. Mehr nicht.',
    nutrition: 'Dein Fokus: Mahlzeiten ordnen. Kein Kalorienzählen, kein Verzicht. Sondern eine klare Struktur, die den Blutzucker stabilisiert und Heißhunger reduziert.',
    consistency: 'Dein Fokus: Verlässlichkeit aufbauen. Jede Diät scheitert ohne Konstanz. Dieser Reset gibt dir 7 Tage, um ein stabiles Fundament zu legen.',
    evening: 'Dein Fokus: Abends die Kontrolle behalten. Der Fettverlust scheitert selten am Frühstück. Wir stabilisieren deinen Tag so, dass der Abend nicht mehr kippt.',
  },
  structure: {
    stress: 'Dein Fokus: Reize reduzieren. Struktur entsteht nicht durch mehr Planung, sondern durch weniger Chaos. 7 Tage bewusste Entlastung schaffen Klarheit.',
    time: 'Dein Fokus: Nur das Wesentliche. Du brauchst keine Stunde am Tag. Du brauchst 5 klare Ankerpunkte. Die bekommst du hier.',
    nutrition: 'Dein Fokus: Essen als Struktur-Anker. Wenn Mahlzeiten planlos sind, fehlt dem ganzen Tag der Rahmen. Zwei feste Mahlzeiten verändern alles.',
    consistency: 'Dein Fokus: 7 Tage identische Struktur. Keine Variation, kein Optimieren. Nur Wiederholung — bis sie sitzt.',
    evening: 'Dein Fokus: Tagesstruktur, die bis zum Abend trägt. Wenn abends alles kippt, war der Tag nicht schlecht — er war nicht strukturiert genug.',
  },
  sleep: {
    stress: 'Dein Fokus: Das Nervensystem runterfahren. Guter Schlaf beginnt nicht im Bett, sondern im Umgang mit Reizen tagsüber. 7 Tage bewusste Entlastung.',
    time: 'Dein Fokus: Schlaf priorisieren. Nicht mehr Zeit finden — sondern die vorhandene Zeit anders nutzen. Feste Schlafenszeit vor allem anderen.',
    nutrition: 'Dein Fokus: Blutzucker und Schlaf verbinden. Späte, schwere Mahlzeiten stören die Nacht. Zwei klare Mahlzeiten tagsüber verändern deine Schlafqualität.',
    consistency: 'Dein Fokus: Einen Schlafrhythmus aufbauen. Nicht Schlaf optimieren — Rhythmus stabilisieren. 7 Tage gleiche Zeit ins Bett. Das ist alles.',
    evening: 'Dein Fokus: Den Abend zur Schlafvorbereitung machen. Wenn abends Bildschirm, Snacks und Reize dominieren, hat der Schlaf keine Chance. Wir ändern das.',
  },
};

export function getFocusText(goal: Goal, hurdle: Hurdle): string {
  return texts[goal]?.[hurdle] || texts.energy.stress;
}
