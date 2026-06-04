import type { Goal, Hurdle } from '@/contexts/ResetContext';

const texts: Record<Goal, Record<Hurdle, string>> = {
  energy: {
    stress: 'Du schläfst eigentlich genug, aber wachst trotzdem platt auf. Das ist fast immer kein Schlaf-Problem. Dein Nervensystem kommt den ganzen Tag nicht wirklich zur Ruhe. Die nächsten 7 Tage sind nicht für mehr Schlaf. Sie sind für weniger Alarm.',
    time: 'Du machst schon zu viel. Das Problem ist nicht zu wenig tun, sondern dass du nie wirklich aufhörst. 7 Tage in denen wir das Gegenteil testen.',
    nutrition: 'Dein Energieniveau folgt deinem Blutzucker. Und der folgt deinen Mahlzeiten. Keine Raketenwissenschaft, aber trotzdem ignorieren das die meisten. Das ändert sich gerade.',
    consistency: 'Du kennst die Regeln. Das Problem ist nicht Wissen, sondern das Dranbleiben wenn der Reiz des Neuen weg ist. Dafür ist dieser Reset gemacht.',
    evening: 'Wenn abends die Kontrolle wegbricht ist das fast nie Schwäche. Es ist ein Zeichen dass der Tag zu viel verlangt hat. Wir bauen den Tag so, dass der Abend nicht mehr kämpft.',
  },
  fatloss: {
    stress: 'Fettverlust unter Dauerstress ist biologisch eine Sackgasse. Cortisol hält Fett fest und das ist kein Mythos. Erst das System beruhigen, dann optimieren. In dieser Reihenfolge.',
    time: 'Fettverlust braucht kein aufwendiges Programm. Zwei gute Mahlzeiten, Bewegung und Schlaf. Klingt zu einfach. Probiere es 7 Tage.',
    nutrition: 'Kein Kalorienzählen. Kein Verzicht. Nur eine klare Mahlzeitenstruktur die Heißhunger von alleine reduziert. Genau das testen wir.',
    consistency: 'Jede Diät scheitert irgendwann. Nicht am Anfang, in Woche 3. Dieser Reset gibt dir kein neues Programm. Er gibt dir ein Fundament das tatsächlich hält.',
    evening: 'Abends die Kontrolle verlieren ist das häufigste Thema das ich höre. Fast immer liegt der echte Grund mittags. Wir bauen deinen Tag von hinten auf.',
  },
  structure: {
    stress: 'Mehr Planung hilft nicht wenn das System überlastet ist. Wir reduzieren zuerst und Klarheit kommt von selbst. Das klingt passiv. Es ist das Gegenteil.',
    time: 'Du brauchst keine Stunde am Tag für das hier. Du brauchst drei feste Punkte die nicht verhandelbar sind. Die bekommst du hier.',
    nutrition: 'Wenn Mahlzeiten planlos sind fehlt dem ganzen Tag der Rahmen. Klingt übertrieben, ist es nicht. Feste Essenszeiten geben deinem Tag mehr Struktur als jeder Kalender.',
    consistency: '7 Tage identische Struktur. Keine Abwechslung, kein Optimieren. Nur Wiederholung bis sie sitzt. Das ist der Plan.',
    evening: 'Wenn der Abend kippt war der Tag nicht schlecht, er hatte keine Struktur. Wir bauen sie auf, von vorne, Schritt für Schritt.',
  },
  sleep: {
    stress: 'Guter Schlaf beginnt nicht im Bett. Er beginnt darin wie viel Alarm du tagsüber ausgesetzt bist. 7 Tage bewusste Entlastung. Das ist der einzige Einstiegspunkt der funktioniert.',
    time: 'Nicht mehr Schlafzeit finden, sondern die vorhandene Zeit anders nutzen. Eine feste Schlafenszeit macht mehr als zwei Stunden länger im Bett.',
    nutrition: 'Späte, schwere Mahlzeiten stören den Schlaf mehr als jedes Handy. Zwei klare Mahlzeiten tagsüber und du wirst nachts den Unterschied merken.',
    consistency: 'Schlaf optimieren funktioniert nicht. Schlafrhythmus stabilisieren schon. 7 Tage gleiche Zeit ins Bett. Das ist buchstäblich alles was wir brauchen.',
    evening: 'Wenn abends Bildschirm, Snacks und Reize dominieren hat der Schlaf keine Chance, egal wie früh du ins Bett gehst. Wir ändern den Abend.',
  },
};

export function getFocusText(goal: Goal, hurdle: Hurdle): string {
  return texts[goal]?.[hurdle] || texts.energy.stress;
}
