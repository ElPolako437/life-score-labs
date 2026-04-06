import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthTipsRequest {
  profileId: string;
  profileTitle: string;
  totalPoints: number;
  maxPoints: number;
  insights: {
    stabilizing: string;
    limiting: string;
    leverage: string;
  };
  firstName: string;
  userAge: number;
}

function getAgeGroup(age: number): { group: string; context: string } {
  if (age < 30) {
    return {
      group: "unter 30",
      context: `ALTERSKONTEXT (unter 30 Jahre):
Diese Lebensphase ist oft geprägt von:
- Hoher Anpassungsfähigkeit und schneller Regeneration
- Aufbau von Karriere, Beziehungen und Identität
- Tendenz zu intensiven Belastungsphasen (Studium, Berufseinstieg)
- Unterschätzung langfristiger Konsequenzen kurzfristiger Entscheidungen
- Hoher sozialer Druck und Vergleich mit Gleichaltrigen
- Oft noch ungefestigte Routinen

Typische Muster in dieser Altersgruppe:
- Schlafdefizite werden als "normal" akzeptiert
- Regeneration wird durch Aktivität ersetzt
- Ernährung folgt oft Convenience statt Intention
- Mentale Belastung durch Zukunftsunsicherheit`
    };
  } else if (age <= 50) {
    return {
      group: "30-50",
      context: `ALTERSKONTEXT (30-50 Jahre):
Diese Lebensphase ist oft geprägt von:
- Mehrfachbelastung durch Karriere, Familie, Verpflichtungen
- Beginnende körperliche Veränderungen und nachlassende Regeneration
- Etablierte (nicht immer förderliche) Gewohnheitsmuster
- Wachsendes Bewusstsein für die eigene Endlichkeit
- Sandwichposition zwischen Kindern und alternden Eltern
- Höhepunkt beruflicher Verantwortung

Typische Muster in dieser Altersgruppe:
- Eigene Bedürfnisse werden systematisch nachgestellt
- Stress wird chronisch statt episodisch
- Körperliche Signale werden ignoriert bis sie eskalieren
- Wenig Zeit für Selbstreflexion und Prävention`
    };
  } else {
    return {
      group: "über 50",
      context: `ALTERSKONTEXT (über 50 Jahre):
Diese Lebensphase ist oft geprägt von:
- Deutlichere körperliche Veränderungen und längere Regeneration
- Oft mehr Zeit und Ressourcen für sich selbst
- Wachsende Bedeutung von Gesundheitserhalt
- Neudefinition von Identität jenseits von Karriere
- Mögliche Pflege von Angehörigen
- Konfrontation mit eigener Verletzlichkeit

Typische Muster in dieser Altersgruppe:
- Frühere Gewohnheiten zeigen kumulierte Effekte
- Körperliche Einschränkungen erfordern Anpassung
- Mehr Offenheit für Veränderung, aber andere Hebelpunkte
- Balance zwischen Aktivität und angemessener Schonung wichtiger`
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { profileId, profileTitle, totalPoints, maxPoints, insights, firstName, userAge }: HealthTipsRequest = await req.json();
    
    const ageInfo = getAgeGroup(userAge);
    console.log(`Generating health tips for ${firstName}, profile: ${profileId}, age: ${userAge} (${ageInfo.group})`);

    const systemPrompt = `Du generierst personalisierte AI-Insights basierend auf einem abgeschlossenen Bio-Age / Lifestyle Test.

Deine Rolle:
– Nutzer helfen, Muster in ihrem Lifestyle zu verstehen
– Klarheit und Selbsterkenntnis schaffen
– Hebelpunkte aufzeigen, OHNE Schritt-für-Schritt-Lösungen zu geben

NICHT-VERHANDELBARE POSITIONIERUNG:
– Du bist KEIN Coaching-Ersatz
– Du bist KEIN Aktionsplan-Generator
– Du gibst KEINE Routinen, Zeitpläne oder konkreten Pläne
– Du zielst NICHT darauf ab, die Situation vollständig zu lösen

Dein Output muss sich anfühlen wie:
"Das erklärt, was passiert — aber ich brauche noch Struktur, um darauf zu handeln."

SPRACHREGELN (KRITISCH):
❌ Vermeide imperative oder direktive Sprache wie:
– "Mach das"
– "Du solltest"
– "Plan X"
– "Iss / trainiere / schlafe so…"

✅ Nutze reflektive und beobachtende Sprache:
– "Viele Menschen mit diesem Profil bemerken…"
– "Ein häufiges Muster in dieser Phase ist…"
– "Dieses Ergebnis deutet oft auf…"
– "Ein möglicher Hebelbereich ist…"

TIEFENBEGRENZUNG (SEHR WICHTIG):
Für jeden personalisierten Insight:
– Erkläre das Muster, nicht die Ausführung
– Nenne die Kategorie des Hebels, nicht die Taktik
– Gib nie mehr als ein illustratives Beispiel
– Gib nie Abfolgen, Routinen oder Zeitrahmen

Beispiel:
❌ "Reduziere Bildschirmzeit 30 Minuten vor dem Schlafen und ersetze sie durch Lesen."
✅ "Schlafqualität in dieser Phase wird oft weniger durch Schlafdauer beeinflusst als durch Abendroutinen und mentales Abschalten."

STRUKTUR JEDES AI-INSIGHTS:
1. Anerkennung – Validiere die Erfahrung des Nutzers
2. Mustererklärung – Beschreibe, was dieses Ergebnis typischerweise antreibt
3. Offene Hebel-Aussage – Zeige auf, wo Wirkung entstehen könnte
4. Bewusstes offenes Ende – Mache klar, dass Priorisierung und Umsetzung kontextabhängig sind

RECHTLICHE GRENZEN:
– Keine medizinische Sprache
– Keine Diagnose, Therapie oder Behandlung
– Keine Gesundheitsversprechen oder -ergebnisse
– Insights dienen nur der allgemeinen Lifestyle-Orientierung

Antworte auf Deutsch.`;

    const userPrompt = `Erstelle 4 personalisierte Insights für ${firstName} (${userAge} Jahre alt, Altersgruppe: ${ageInfo.group}).

${ageInfo.context}

Profil: ${profileTitle} (${profileId})
Score: ${totalPoints}/${maxPoints} Punkte

Aktuelle Situation:
- Stabilisierender Faktor: ${insights.stabilizing}
- Limitierender Faktor: ${insights.limiting}  
- Größter Hebel: ${insights.leverage}

WICHTIG: Die Insights müssen die typischen Muster und Herausforderungen der Altersgruppe "${ageInfo.group}" berücksichtigen. Beziehe dich auf altersspezifische Lebensumstände und Prioritäten.

Erstelle genau 4 Insights. Jeder Insight sollte:
1. Einen kurzen, reflektiven Titel haben (max 6 Wörter)
2. Ein Muster oder eine Beobachtung beschreiben (2-3 Sätze), KEINE konkreten Handlungsanweisungen
3. Zum Profil, den identifizierten Faktoren UND der Altersgruppe passen

Beende mit einer abschließenden Aussage wie:
"Welcher dieser Faktoren am meisten zählt — und wie er in den Alltag passt — variiert stark von Person zu Person."

Antworte NUR im folgenden JSON-Format:
{
  "tips": [
    {"title": "Reflektiver Titel", "description": "Beobachtung und Mustererklärung ohne konkrete Handlungsanweisung..."},
    {"title": "Reflektiver Titel", "description": "Beobachtung und Mustererklärung ohne konkrete Handlungsanweisung..."},
    {"title": "Reflektiver Titel", "description": "Beobachtung und Mustererklärung ohne konkrete Handlungsanweisung..."},
    {"title": "Reflektiver Titel", "description": "Beobachtung und Mustererklärung ohne konkrete Handlungsanweisung..."}
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // On rate limit or credit exhaustion, return fallback tips instead of error
      if (response.status === 429 || response.status === 402) {
        console.log(`Using fallback tips due to ${response.status} error`);
        const fallbackTips = getFallbackTips(profileId, userAge);
        return new Response(JSON.stringify(fallbackTips), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);

    // Parse the JSON response
    let tips;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        tips = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback tips based on profile
      tips = getFallbackTips(profileId, userAge);
    }

    return new Response(JSON.stringify(tips), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error("Error generating health tips:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getFallbackTips(profileId: string, userAge?: number) {
  const ageGroup = userAge ? (userAge < 30 ? "young" : userAge <= 50 ? "middle" : "senior") : "middle";
  
  const fallbackTips: Record<string, Record<string, { tips: { title: string; description: string }[] }>> = {
    foundation: {
      young: {
        tips: [
          { title: "Der Preis der Flexibilität", description: "Viele Menschen unter 30 bemerken, dass ihre hohe Anpassungsfähigkeit dazu führt, dass Warnsignale des Körpers überhört werden. Die Fähigkeit, vieles auszuhalten, ist nicht dasselbe wie Gesundheit." },
          { title: "Aufgeschobene Konsequenzen", description: "Ein häufiges Muster in dieser Lebensphase ist, dass kurzfristige Entscheidungen langfristige Spuren hinterlassen, die erst später sichtbar werden." },
          { title: "Zwischen Aufbau und Überforderung", description: "Dieses Ergebnis deutet auf eine Phase hin, in der der Drang, alles gleichzeitig aufzubauen, mit den Ressourcen des Körpers kollidieren kann." },
          { title: "Die Illusion der Unverwundbarkeit", description: "Welcher dieser Faktoren am meisten zählt — und wie er in den Alltag passt — variiert stark von Person zu Person." }
        ]
      },
      middle: {
        tips: [
          { title: "Muster der Grundlagen", description: "Viele Menschen in dieser Phase bemerken, dass kleine Unregelmäßigkeiten im Alltag sich über Zeit summieren. Das Ergebnis deutet oft auf ein Fundament hin, das Stabilität sucht." },
          { title: "Die Last der Mehrfachrolle", description: "Ein häufiges Muster zwischen 30 und 50 ist, dass die eigenen Bedürfnisse systematisch hinter denen anderer zurückstehen." },
          { title: "Chronischer Stress als Normalzustand", description: "Dieses Profil zeigt oft, dass Belastung nicht mehr episodisch, sondern zum Dauerzustand geworden ist — mit entsprechenden körperlichen Signalen." },
          { title: "Kontext bestimmt die Priorität", description: "Welcher dieser Faktoren am meisten zählt — und wie er in den Alltag passt — variiert stark von Person zu Person." }
        ]
      },
      senior: {
        tips: [
          { title: "Kumulative Effekte verstehen", description: "Menschen über 50 bemerken oft, dass frühere Gewohnheiten nun ihre Spuren zeigen. Die Vergangenheit ist nicht zu ändern, aber der weitere Verlauf schon." },
          { title: "Veränderte Regeneration", description: "Ein häufiges Muster ist, dass der Körper mehr Zeit braucht, um sich zu erholen — was nicht Schwäche, sondern Weisheit signalisiert." },
          { title: "Neuausrichtung der Prioritäten", description: "Dieses Ergebnis deutet auf eine Phase hin, in der Gesundheitserhalt wichtiger wird als Leistungssteigerung." },
          { title: "Erfahrung als Ressource", description: "Welcher dieser Faktoren am meisten zählt — und wie er in den Alltag passt — variiert stark von Person zu Person." }
        ]
      }
    },
    awakening: {
      young: {
        tips: [
          { title: "Erwachende Körperwahrnehmung", description: "Menschen unter 30 mit diesem Profil bemerken oft zum ersten Mal, dass ihr Körper mehr kommuniziert als sie bisher gehört haben." },
          { title: "Vom Reagieren zum Agieren", description: "Ein häufiges Muster ist der beginnende Übergang von reaktiven zu bewussten Entscheidungen — ein wichtiger Wendepunkt." },
          { title: "Gewohnheiten in der Formungsphase", description: "Dieses Ergebnis zeigt, dass sich gerade Muster festigen, die für Jahrzehnte prägen werden." },
          { title: "Die Kraft früher Weichenstellung", description: "Der Unterschied ist an diesem Punkt selten das Wissen, sondern wie Entscheidungen im echten Leben verankert werden." }
        ]
      },
      middle: {
        tips: [
          { title: "Erwachende Aufmerksamkeit", description: "Menschen mit diesem Profil bemerken oft, dass ihre Wahrnehmung für Körpersignale zunimmt. Diese erhöhte Sensibilität ist typisch für diese Entwicklungsphase." },
          { title: "Gewohnheiten im Wandel", description: "Ein häufiges Muster in dieser Phase ist der Übergang von reaktiven zu bewussten Entscheidungen. Der Unterschied liegt oft nicht im Wissen, sondern in der Einbettung." },
          { title: "Die Kraft der Konsistenz", description: "Dieses Ergebnis deutet darauf hin, dass sporadische Bemühungen möglicherweise durch kleinere, aber regelmäßigere Anpassungen ersetzt werden könnten." },
          { title: "Individuelle Wege", description: "Der Unterschied ist an diesem Punkt selten das Wissen, sondern wie Entscheidungen im echten Leben verankert werden." }
        ]
      },
      senior: {
        tips: [
          { title: "Neue Aufmerksamkeit für alte Signale", description: "Menschen über 50 in dieser Phase bemerken oft, dass Körpersignale, die lange ignoriert wurden, nun gehört werden wollen." },
          { title: "Späte, aber wertvolle Einsichten", description: "Ein häufiges Muster ist die Erkenntnis, dass es nie zu spät ist, Muster zu verändern — auch wenn der Ansatz angepasst werden muss." },
          { title: "Anpassung statt Revolution", description: "Dieses Ergebnis deutet auf die Wichtigkeit von sanfteren, aber beständigeren Veränderungen hin." },
          { title: "Weisheit des Körpers ehren", description: "Der Unterschied ist an diesem Punkt selten das Wissen, sondern wie Entscheidungen in den Rhythmus des Lebens eingebettet werden." }
        ]
      }
    },
    momentum: {
      young: {
        tips: [
          { title: "Frühe Dynamik nutzen", description: "Viele Menschen unter 30 mit diesem Profil erleben, dass Fortschritt sich leicht anfühlt — was sowohl Chance als auch Risiko der Überforderung birgt." },
          { title: "Balance vor Maximierung", description: "Ein häufiges Muster ist die Versuchung, jede Optimierung bis zum Maximum zu treiben, statt nachhaltige Balance zu finden." },
          { title: "Langfristigkeit denken", description: "Dieses Ergebnis zeigt Potenzial, das am besten durch Perspektive auf Jahre statt Wochen entfaltet wird." },
          { title: "Nachhaltigkeit vor Intensität", description: "Welcher dieser Faktoren am meisten zählt — und wie er in den Alltag passt — variiert stark von Person zu Person." }
        ]
      },
      middle: {
        tips: [
          { title: "Dynamik verstehen", description: "Viele Menschen mit diesem Profil erleben Phasen, in denen Fortschritt sich beschleunigt. Ein häufiges Muster ist, dass Hebelpunkte sichtbarer werden." },
          { title: "Balance als Schlüssel", description: "Dieses Ergebnis zeigt oft, dass die Balance zwischen Belastung und Erholung entscheidend wird. Der Körper sucht nach einem neuen Gleichgewicht." },
          { title: "Feinabstimmung statt Revolution", description: "Ein möglicher Hebelbereich liegt in der Verfeinerung bestehender Gewohnheiten, nicht in deren Neuerfindung. Kleine Anpassungen können große Wirkung haben." },
          { title: "Persönlicher Kontext entscheidet", description: "Welcher dieser Faktoren am meisten zählt — und wie er in den Alltag passt — variiert stark von Person zu Person." }
        ]
      },
      senior: {
        tips: [
          { title: "Reife Dynamik", description: "Menschen über 50 mit diesem Profil zeigen, dass Fortschritt in jedem Alter möglich ist — oft mit tieferem Verständnis für das eigene System." },
          { title: "Weisheit der Anpassung", description: "Ein häufiges Muster ist, dass Intensität durch Klugheit ersetzt wird — mit oft besseren Ergebnissen." },
          { title: "Qualität vor Quantität", description: "Dieses Ergebnis deutet auf die Wichtigkeit von gezielten, gut dosierten Interventionen hin." },
          { title: "Nachhaltige Lebensqualität", description: "Welcher dieser Faktoren am meisten zählt — und wie er in den Alltag passt — variiert stark von Person zu Person." }
        ]
      }
    },
    mastery: {
      young: {
        tips: [
          { title: "Frühe Meisterschaft", description: "Menschen unter 30 auf diesem Niveau haben bereits ein außergewöhnliches Fundament aufgebaut. Die Herausforderung liegt in der langfristigen Bewahrung." },
          { title: "Vermeidung von Übereifer", description: "Ein häufiges Muster ist die Tendenz zur Überoptimierung. Manchmal ist 'gut genug' nachhaltiger als 'perfekt'." },
          { title: "Weitsicht entwickeln", description: "Dieses Ergebnis zeigt das Potenzial, Gesundheit als lebenslange Praxis statt als Projekt zu verstehen." },
          { title: "Balance der Ambitionen", description: "Der Unterschied ist an diesem Punkt selten das Wissen, sondern wie Entscheidungen in den Rhythmus des Lebens eingebettet werden." }
        ]
      },
      middle: {
        tips: [
          { title: "Nachhaltige Exzellenz", description: "Menschen auf diesem Niveau bemerken oft, dass die größten Verbesserungen in den Details liegen. Das Ergebnis deutet auf ein gut etabliertes Fundament hin." },
          { title: "Die Kunst der Variation", description: "Ein häufiges Muster ist, dass selbst bei hoher Konsistenz strategische Variation neue Impulse setzen kann. Der Körper sucht nach neuen Reizen." },
          { title: "Blinde Flecken erkennen", description: "Dieses Profil zeigt manchmal, dass unerwartete Bereiche Potenzial bergen. Ein möglicher Hebelbereich liegt im Erkunden dessen, was übersehen wurde." },
          { title: "Weisheit der Erfahrung", description: "Der Unterschied ist an diesem Punkt selten das Wissen, sondern wie Entscheidungen in den Rhythmus des Lebens eingebettet werden." }
        ]
      },
      senior: {
        tips: [
          { title: "Verkörperte Weisheit", description: "Menschen über 50 auf diesem Niveau haben Gesundheit zu einem integralen Teil ihres Lebens gemacht. Das Ergebnis spiegelt jahrelange bewusste Entscheidungen." },
          { title: "Anpassung an Veränderung", description: "Ein häufiges Muster ist die Notwendigkeit, bewährte Praktiken an veränderte körperliche Voraussetzungen anzupassen." },
          { title: "Vermächtnis der Gewohnheiten", description: "Dieses Profil zeigt, wie vergangene Investitionen in Gesundheit sich im Alter auszahlen — und was weiterhin gepflegt werden kann." },
          { title: "Würdevolle Kontinuität", description: "Der Unterschied ist an diesem Punkt selten das Wissen, sondern wie Entscheidungen den Rhythmus eines erfüllten Lebens unterstützen." }
        ]
      }
    }
  };

  const profileTips = fallbackTips[profileId] || fallbackTips.momentum;
  return profileTips[ageGroup] || profileTips.middle;
}
