export interface Question {
  id: number;
  question: string;
  options: {
    text: string;
    points: number;
  }[];
}

export type SelfAssessment = 'younger' | 'matching' | 'older' | 'unsure';

export interface TestState {
  currentQuestion: number;
  answers: Record<number, number>;
  userAge: number | null;
  selfAssessment: SelfAssessment | null;
  userInfo: {
    firstName: string;
    email: string;
  } | null;
  isComplete: boolean;
}

// Lifestyle Age Estimation (purely derived from score, NOT affecting score)
export interface LifestyleAgeEstimation {
  chronologicalAge: number;
  lifestyleAgeMin: number;
  lifestyleAgeMax: number;
  tendencyLabel: string;
  deltaCenter: number;
}

export function calculateLifestyleAge(
  totalPoints: number,
  maxPoints: number,
  userAge: number,
  selfAssessment: SelfAssessment | null
): LifestyleAgeEstimation {
  // Convert score to 0-100 scale for estimation only
  const score0_100 = (totalPoints / maxPoints) * 100;
  
  // Calculate delta from score (higher score = younger, lower score = older)
  // Score 50 = no change, score 0 = +6 years, score 100 = -6 years
  const deltaCenterYears = Math.round(((50 - score0_100) / 50) * 6);
  
  // Self-assessment offset (ONLY for display, NOT for score)
  let selfOffset = 0;
  if (selfAssessment === 'younger') selfOffset = -1;
  else if (selfAssessment === 'older') selfOffset = 1;
  // 'matching' and 'unsure' = 0
  
  const finalDeltaCenter = deltaCenterYears + selfOffset;
  
  // Range calculation
  const rangeWidth = 2;
  let lifestyleAgeMin = userAge + (finalDeltaCenter - rangeWidth);
  let lifestyleAgeMax = userAge + (finalDeltaCenter + rangeWidth);
  
  // Clamp to sensible bounds
  lifestyleAgeMin = Math.max(10, Math.min(110, lifestyleAgeMin));
  lifestyleAgeMax = Math.max(10, Math.min(110, lifestyleAgeMax));
  
  // Ensure min <= max
  if (lifestyleAgeMin > lifestyleAgeMax) {
    [lifestyleAgeMin, lifestyleAgeMax] = [lifestyleAgeMax, lifestyleAgeMin];
  }
  
  // Tendency label
  let tendencyLabel: string;
  if (finalDeltaCenter <= -2) {
    tendencyLabel = 'tendenziell jünger';
  } else if (finalDeltaCenter >= 2) {
    tendencyLabel = 'tendenziell älter';
  } else {
    tendencyLabel = 'ähnlich';
  }
  
  return {
    chronologicalAge: userAge,
    lifestyleAgeMin,
    lifestyleAgeMax,
    tendencyLabel,
    deltaCenter: finalDeltaCenter,
  };
}

export interface LifestyleProfile {
  id: 'foundation' | 'awakening' | 'momentum' | 'mastery';
  title: string;
  subtitle: string;
  description: string;
  insights: {
    stabilizing: string;
    limiting: string;
    leverage: string;
  };
  valueAsset: {
    type: 'pdf' | 'call';
    title: string;
    description: string;
  };
  cta: {
    primary: string;
    secondary?: string;
  };
}

export interface BioAgeResult {
  totalPoints: number;
  maxPoints: number;
  biologicalAge: number;
  bioAgeModifier: string;
  interpretation: string;
  category: 'critical' | 'risk' | 'normal' | 'good' | 'excellent';
  profile: LifestyleProfile;
}

// Optimized questions with non-judgmental, realistic A-D options
// Internal logic: A = 0pts (burdensome), B = 1pt (functional but suboptimal), C = 2pts (aware but inconsistent), D = 3pts (stable and supportive)
export const questions: Question[] = [
  {
    id: 1,
    question: "Wie sieht dein Schlaf in einer typischen Woche aus?",
    options: [
      { text: "Ich schlafe oft weniger als 5 Stunden und wache erschöpft auf", points: 0 },
      { text: "Ich bekomme meist 5-6 Stunden, würde aber gerne mehr schlafen", points: 1 },
      { text: "Ich schlafe 7-8 Stunden, aber die Qualität schwankt", points: 2 },
      { text: "Ich habe einen stabilen Schlafrhythmus mit erholsamen Nächten", points: 3 }
    ]
  },
  {
    id: 2,
    question: "Wie integrierst du Bewegung in deinen Alltag?",
    options: [
      { text: "Bewegung kommt im Moment kaum vor – der Alltag lässt wenig Raum", points: 0 },
      { text: "Ich bewege mich gelegentlich, aber ohne feste Routine", points: 1 },
      { text: "Ich habe gute Phasen, aber es fehlt manchmal die Kontinuität", points: 2 },
      { text: "Bewegung ist fester Bestandteil meiner Woche", points: 3 }
    ]
  },
  {
    id: 3,
    question: "Wie würdest du deine Ernährungsgewohnheiten beschreiben?",
    options: [
      { text: "Im Alltag greife ich oft zu schnellen, praktischen Optionen", points: 0 },
      { text: "Ich achte teilweise auf meine Ernährung, aber nicht konsequent", points: 1 },
      { text: "Ich ernähre mich meist bewusst, mit gelegentlichen Ausnahmen", points: 2 },
      { text: "Ich wähle überwiegend natürliche, unverarbeitete Lebensmittel", points: 3 }
    ]
  },
  {
    id: 4,
    question: "Wie erlebst du Stress in deinem Alltag?",
    options: [
      { text: "Ich fühle mich oft überlastet und finde wenig Ausgleich", points: 0 },
      { text: "Stress ist regelmäßig da, aber ich manage es irgendwie", points: 1 },
      { text: "Ich habe Strategien, die ich aber nicht immer umsetze", points: 2 },
      { text: "Ich habe wirksame Wege gefunden, mit Stress umzugehen", points: 3 }
    ]
  },
  {
    id: 5,
    question: "Welche Rolle spielt Alkohol in deinem Leben?",
    options: [
      { text: "Alkohol gehört regelmäßig zu meinem Alltag", points: 0 },
      { text: "Ich trinke gesellschaftlich, meist mehrmals pro Woche", points: 1 },
      { text: "Gelegentlich, aber ich achte auf maßvollen Konsum", points: 2 },
      { text: "Alkohol spielt für mich keine oder kaum eine Rolle", points: 3 }
    ]
  },
  {
    id: 6,
    question: "Wie gehst du mit mentaler Entspannung und Achtsamkeit um?",
    options: [
      { text: "Entspannung kommt im Alltag oft zu kurz", points: 0 },
      { text: "Ich nehme mir selten bewusst Zeit für mentale Erholung", points: 1 },
      { text: "Ich praktiziere gelegentlich Entspannungstechniken", points: 2 },
      { text: "Mentale Hygiene ist Teil meiner täglichen Routine", points: 3 }
    ]
  },
  {
    id: 7,
    question: "Wie sieht deine Bildschirmzeit vor dem Schlafen aus?",
    options: [
      { text: "Ich bin meist bis kurz vor dem Einschlafen am Bildschirm", points: 0 },
      { text: "Ich versuche es zu reduzieren, aber es gelingt nicht immer", points: 1 },
      { text: "Ich lege das Handy meist rechtzeitig weg", points: 2 },
      { text: "Ich habe eine klare Routine ohne Bildschirme vor dem Schlaf", points: 3 }
    ]
  },
  {
    id: 8,
    question: "Wie steht es um deine Flüssigkeitszufuhr?",
    options: [
      { text: "Ich vergesse oft zu trinken und merke es erst spät", points: 0 },
      { text: "Ich trinke etwas, aber weniger als ich sollte", points: 1 },
      { text: "Ich achte darauf, genug zu trinken, aber nicht täglich", points: 2 },
      { text: "Ausreichend Wasser zu trinken ist für mich selbstverständlich", points: 3 }
    ]
  },
  {
    id: 9,
    question: "Wie bewusst gestaltest du deinen Lebensstil?",
    options: [
      { text: "Ich lebe eher im Reaktionsmodus ohne klare Struktur", points: 0 },
      { text: "Ich habe Vorsätze, aber setze sie selten um", points: 1 },
      { text: "Ich optimiere in manchen Bereichen, andere vernachlässige ich", points: 2 },
      { text: "Ich gestalte meinen Lebensstil aktiv und reflektiert", points: 3 }
    ]
  },
  {
    id: 10,
    question: "Wie nimmst du dein körperliches Wohlbefinden wahr?",
    options: [
      { text: "Ich spüre oft, dass mein Körper nicht optimal funktioniert", points: 0 },
      { text: "Es gibt gute und weniger gute Tage – ohne klares Muster", points: 1 },
      { text: "Ich fühle mich meist gut, mit gelegentlichen Einschränkungen", points: 2 },
      { text: "Ich fühle mich energiegeladen und körperlich vital", points: 3 }
    ]
  },
  {
    id: 11,
    question: "Wie integrierst du Krafttraining in dein Leben?",
    options: [
      { text: "Krafttraining ist aktuell kein Teil meines Alltags", points: 0 },
      { text: "Ich trainiere sporadisch, ohne festen Plan", points: 1 },
      { text: "Ich trainiere regelmäßig, aber nicht systematisch", points: 2 },
      { text: "Krafttraining ist ein fester Bestandteil meiner Routine", points: 3 }
    ]
  },
  {
    id: 12,
    question: "Wie gehst du mit Ausdaueraktivitäten um?",
    options: [
      { text: "Ausdauer ist im Moment kein Thema für mich", points: 0 },
      { text: "Ich mache gelegentlich etwas, aber unregelmäßig", points: 1 },
      { text: "Ich bewege mich regelmäßig mit moderater Intensität", points: 2 },
      { text: "Ausdauertraining gehört fest zu meiner Woche", points: 3 }
    ]
  },
  {
    id: 13,
    question: "Wie planst du Regeneration und Erholung?",
    options: [
      { text: "Erholung passiert, wenn Zeit übrig bleibt – selten geplant", points: 0 },
      { text: "Ich weiß, dass ich mehr regenerieren sollte", points: 1 },
      { text: "Ich plane gelegentlich bewusste Erholungsphasen ein", points: 2 },
      { text: "Regeneration hat für mich denselben Stellenwert wie Training", points: 3 }
    ]
  },
  {
    id: 14,
    question: "Wie informiert bist du über deinen körperlichen Zustand?",
    options: [
      { text: "Ich kenne meine Werte nicht und lasse sie nicht prüfen", points: 0 },
      { text: "Ich habe sie einmal checken lassen, aber nicht regelmäßig", points: 1 },
      { text: "Ich lasse mich gelegentlich untersuchen", points: 2 },
      { text: "Ich beobachte meine Werte regelmäßig und gezielt", points: 3 }
    ]
  },
  {
    id: 15,
    question: "Wie beweglich und schmerzfrei fühlst du dich?",
    options: [
      { text: "Ich habe öfter Beschwerden, die mich einschränken", points: 0 },
      { text: "Ich bin etwas steif, aber es beeinträchtigt mich nicht stark", points: 1 },
      { text: "Ich bin recht beweglich mit gelegentlichen Verspannungen", points: 2 },
      { text: "Ich fühle mich beweglich, frei und ohne Einschränkungen", points: 3 }
    ]
  }
];

// Lifestyle profiles for result mapping
export const lifestyleProfiles: Record<string, LifestyleProfile> = {
  foundation: {
    id: 'foundation',
    title: 'Das Fundament-Profil',
    subtitle: 'Am Anfang einer wichtigen Veränderung',
    description: 'Dein aktuelles Muster zeigt, dass bestimmte Lebensbereiche unter Druck stehen. Das ist keine Schwäche – es ist ein ehrlicher Ausgangspunkt. Viele Menschen in dieser Situation erleben bereits nach wenigen Wochen spürbare Veränderungen, wenn sie an den richtigen Stellschrauben drehen.',
    insights: {
      stabilizing: 'Du hast den ersten Schritt getan: Bewusstsein. Das ist die wichtigste Grundlage für nachhaltige Veränderung.',
      limiting: 'Aktuell arbeiten mehrere Faktoren gegen dein körperliches Gleichgewicht. Das kostet Energie und beschleunigt Alterungsprozesse.',
      leverage: 'Der größte Hebel liegt in der Stabilisierung deiner Basisgewohnheiten: Schlaf, Bewegung und Stressregulation.'
    },
    valueAsset: {
      type: 'call',
      title: 'Orientierungsgespräch',
      description: 'In einem persönlichen Gespräch analysieren wir gemeinsam, welche Veränderungen den größten Unterschied für dich machen können.'
    },
    cta: {
      primary: 'Kostenfreies Orientierungsgespräch vereinbaren',
      secondary: 'Grundlagen-Guide herunterladen'
    }
  },
  awakening: {
    id: 'awakening',
    title: 'Das Erwachungs-Profil',
    subtitle: 'Zwischen Wissen und Umsetzung',
    description: 'Du weißt bereits, was wichtig ist – und setzt es teilweise um. Dein Profil zeigt das typische Muster von Menschen, die auf dem Weg zu mehr Vitalität sind, aber noch nach Konsistenz suchen. Die gute Nachricht: Du bist näher am Ziel, als du vielleicht denkst.',
    insights: {
      stabilizing: 'Du hast bereits funktionierende Gewohnheiten entwickelt. Diese bilden die Basis für den nächsten Schritt.',
      limiting: 'Inkonsistenz in Schlüsselbereichen verhindert aktuell, dass dein Körper sein Gleichgewicht findet.',
      leverage: 'Fokussiere auf einen Bereich und bringe ihn zur Stabilität, bevor du den nächsten angehst.'
    },
    valueAsset: {
      type: 'pdf',
      title: 'Prioritäten-Framework',
      description: 'Ein strukturierter Guide, der dir hilft, die wichtigsten Stellschrauben für deine Situation zu identifizieren.'
    },
    cta: {
      primary: 'Framework kostenlos herunterladen'
    }
  },
  momentum: {
    id: 'momentum',
    title: 'Das Momentum-Profil',
    subtitle: 'Auf einem soliden Weg',
    description: 'Dein Lebensstil zeigt bereits ein gesundes Fundament. Du machst vieles richtig – und hast gleichzeitig noch Potenzial, das du nutzen kannst. Menschen mit diesem Profil profitieren am meisten von gezielter Optimierung statt grundlegender Veränderung.',
    insights: {
      stabilizing: 'Deine Grundgewohnheiten funktionieren. Du hast eine Basis, auf die du aufbauen kannst.',
      limiting: 'Einzelne Bereiche sind noch nicht im Gleichgewicht und bremsen dein Gesamtpotenzial.',
      leverage: 'Gezielte Feinabstimmung in Regeneration oder Ernährung kann überproportionale Wirkung entfalten.'
    },
    valueAsset: {
      type: 'pdf',
      title: 'Optimierungs-Playbook',
      description: 'Konkrete Strategien für Menschen, die bereits gut aufgestellt sind und den nächsten Schritt gehen wollen.'
    },
    cta: {
      primary: 'Playbook kostenlos herunterladen',
      secondary: 'Vertiefungsgespräch buchen'
    }
  },
  mastery: {
    id: 'mastery',
    title: 'Das Meisterschaft-Profil',
    subtitle: 'Exzellenz in der Umsetzung',
    description: 'Dein Profil zeigt einen bemerkenswert stabilen und unterstützenden Lebensstil. Du hast Systeme entwickelt, die funktionieren. Was jetzt zählt, ist Feinschliff und das Bewahren dessen, was du aufgebaut hast.',
    insights: {
      stabilizing: 'Du lebst bereits einen Lebensstil, der biologische Alterungsprozesse verlangsamt.',
      limiting: 'Bei so hoher Stabilität liegt das Risiko oft im Übertreiben oder in blinden Flecken.',
      leverage: 'Periodische Überprüfung und gezielte Biomarker-Analyse sichern deinen Fortschritt langfristig.'
    },
    valueAsset: {
      type: 'call',
      title: 'Experten-Review',
      description: 'Ein Gespräch auf Augenhöhe: Wir identifizieren gemeinsam verbliebene Optimierungspotenziale und blinde Flecken.'
    },
    cta: {
      primary: 'Experten-Review anfragen'
    }
  }
};

// Scoring explanation texts (transparent but not exposing numbers)
export const scoringExplanation = {
  intro: 'Dein Profil entsteht aus wiederkehrenden Mustern in deinen Antworten.',
  methodology: 'Manche Gewohnheiten beeinflussen das biologische Gleichgewicht stärker als andere. Das Ergebnis spiegelt das Gesamtbild wider – nicht einzelne Antworten.',
  interpretation: 'Dieses Profil ist keine Diagnose, sondern eine Orientierungshilfe für deinen individuellen Lebensstil.'
};

// Emotional transition text before results
export const transitionText = {
  heading: 'Deine Auswertung ist bereit.',
  subtext: 'Lade jetzt deine Ergebnisse als PDF herunter.',
  body: 'Viele Menschen sind überrascht, wie klar bestimmte Muster in ihren Antworten erkennbar werden. Dieses Ergebnis ist keine Bewertung – es ist ein Ausgangspunkt für bewusste Entscheidungen.',
  encouragement: 'Nimm dir einen Moment Zeit, bevor du weiterliest.'
};

// Legal disclaimer
export const legalDisclaimer = 'Dieser Test ersetzt keine medizinische Beratung, Diagnose oder Behandlung. Die Ergebnisse dienen ausschließlich der persönlichen Orientierung und Selbstreflexion im Bereich Lebensstil und Gewohnheiten.';

export const calculateBioAge = (answers: Record<number, number>, actualAge: number): BioAgeResult => {
  const totalPoints = Object.values(answers).reduce((sum, points) => sum + points, 0);
  const maxPoints = 45;

  let ageModifier: number;
  let bioAgeModifier: string;
  let interpretation: string;
  let category: BioAgeResult['category'];
  let profile: LifestyleProfile;

  if (totalPoints <= 15) {
    ageModifier = 8;
    bioAgeModifier = "+6-10 Jahre";
    interpretation = "Dein aktuelles Lebensstilmuster zeigt Bereiche mit deutlichem Optimierungspotenzial.";
    category = "critical";
    profile = lifestyleProfiles.foundation;
  } else if (totalPoints <= 25) {
    ageModifier = 4;
    bioAgeModifier = "+3-5 Jahre";
    interpretation = "Du bist auf dem Weg – mit gezielten Anpassungen kannst du spürbare Fortschritte erzielen.";
    category = "risk";
    profile = lifestyleProfiles.awakening;
  } else if (totalPoints <= 34) {
    ageModifier = 0;
    bioAgeModifier = "≈ Chronologisches Alter";
    interpretation = "Du hast ein solides Fundament und Raum für gezielte Optimierung.";
    category = "normal";
    profile = lifestyleProfiles.momentum;
  } else if (totalPoints <= 42) {
    ageModifier = -3;
    bioAgeModifier = "-3 Jahre";
    interpretation = "Dein Lebensstil unterstützt deine biologische Vitalität aktiv.";
    category = "good";
    profile = lifestyleProfiles.mastery;
  } else {
    ageModifier = -5;
    bioAgeModifier = "-5 Jahre";
    interpretation = "Du lebst einen bemerkenswert unterstützenden Lebensstil mit exzellenter Balance.";
    category = "excellent";
    profile = lifestyleProfiles.mastery;
  }

  const biologicalAge = Math.max(18, actualAge + ageModifier);

  return {
    totalPoints,
    maxPoints,
    biologicalAge,
    bioAgeModifier,
    interpretation,
    category,
    profile
  };
};
