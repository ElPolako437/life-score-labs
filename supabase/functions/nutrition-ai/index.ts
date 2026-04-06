import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let tools: any[] = [];
    let tool_choice: any = undefined;

    const profileCtx = `
Nutzer: ${userContext?.name || 'User'}, ${userContext?.age || 35} Jahre, ${userContext?.gender || 'männlich'}
Größe: ${userContext?.height || 180}cm, Gewicht: ${userContext?.weight || 80}kg
Aktivitätslevel: ${userContext?.activityLevel || 'moderat'}
Ziele: ${userContext?.goals?.join(', ') || 'Gesundheit verbessern'}
Kalorienziel: ${userContext?.calorieMin || 1800}–${userContext?.calorieMax || 2200} kcal
Proteinziel: ${userContext?.proteinTarget || 130}g
${userContext?.biggestStruggle ? `Größtes Problem: ${userContext.biggestStruggle}` : ''}
${userContext?.preferences ? `Vorlieben: ${userContext.preferences}` : ''}
${userContext?.restrictions ? `Einschränkungen: ${userContext.restrictions}` : ''}`;

    const goalCtx = userContext?.activeGoal ? `
AKTIVES ZIEL: ${userContext.activeGoal.goalDescription || userContext.activeGoal.goalType}
Berücksichtige das aktive Ziel bei allen Empfehlungen:
${userContext.activeGoal.goalType === 'fat_loss' ? '- Kaloriendefizit priorisieren, Protein hoch halten, abends leichter essen' : ''}
${userContext.activeGoal.goalType === 'sleep' ? '- Letzte Mahlzeit 3h vor Schlaf, magnesiumreich, kein Koffein nach 14 Uhr' : ''}
${userContext.activeGoal.goalType === 'stress' ? '- Regelmäßige Mahlzeiten, Blutzucker stabil, kein Meal-Skipping' : ''}
${userContext.activeGoal.goalType === 'energy' ? '- Protein-Timing optimieren, 30g zum Frühstück, regelmäßig über den Tag' : ''}
` : '';

    const toneRules = `
TON:
- Premium, praktisch, ruhig, klar, empathisch
- Nie generisch, nie klinisch, nie wie ein Diät-Bot
- Alltagstauglich für beschäftigte Erwachsene (30-50)
- Immer auf Deutsch
${goalCtx}`;

    if (mode === "day-plan") {
      systemPrompt = `Du bist der CALINESS Ernährungs-Planer. Erstelle einen realistischen Tages-Ernährungsplan.
${profileCtx}
${toneRules}

REGELN:
- 3-4 Mahlzeiten + optionale Snacks
- Protein gleichmäßig verteilen
- Mahlzeiten müssen praktisch und alltagstauglich sein
- Keine exotischen Zutaten
- Realistische Portionsgrößen
- Proteinanker pro Mahlzeit benennen
- Zeitvorschläge geben
- Alternativen anbieten
- Nicht überladen — einfach und umsetzbar`;

      tools = [{
        type: "function",
        function: {
          name: "daily_nutrition_plan",
          description: "Tages-Ernährungsplan",
          parameters: {
            type: "object",
            properties: {
              dailyFocus: { type: "string", description: "Ernährungsfokus des Tages in einem Satz" },
              meals: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "z.B. Frühstück, Mittagessen" },
                    time: { type: "string", description: "Vorgeschlagene Zeit z.B. 07:30" },
                    description: { type: "string", description: "Kurze Mahlzeit-Beschreibung" },
                    proteinAnchor: { type: "string", description: "Haupt-Proteinquelle" },
                    estimatedProtein: { type: "number", description: "Geschätzte Gramm Protein" },
                    estimatedCalories: { type: "number", description: "Geschätzte Kalorien" },
                    alternatives: { type: "array", items: { type: "string" }, description: "1-2 einfache Alternativen" },
                  },
                  required: ["name", "time", "description", "proteinAnchor", "estimatedProtein", "estimatedCalories"],
                  additionalProperties: false,
                },
              },
              tips: { type: "array", items: { type: "string" }, description: "2-3 praktische Tages-Tipps" },
              totalEstimatedProtein: { type: "number" },
              totalEstimatedCalories: { type: "number" },
            },
            required: ["dailyFocus", "meals", "tips", "totalEstimatedProtein", "totalEstimatedCalories"],
            additionalProperties: false,
          },
        },
      }];
      tool_choice = { type: "function", function: { name: "daily_nutrition_plan" } };

    } else if (mode === "week-plan") {
      systemPrompt = `Du bist der CALINESS Ernährungs-Planer. Erstelle einen 7-Tage-Ernährungsplan.
${profileCtx}
${toneRules}

REGELN:
- 7 Tage, 3-4 Mahlzeiten pro Tag
- Praktisch, abwechslungsreich, aber nicht überkompliziert
- Proteinanker in jeder Mahlzeit
- Wochenende darf etwas flexibler sein
- Meal-Prep-Hinweise wo sinnvoll
- Nicht wie ein Bodybuilder-Plan
- Wie Struktur von einem guten Ernährungscoach
- Kurz und knapp pro Mahlzeit`;

      tools = [{
        type: "function",
        function: {
          name: "weekly_nutrition_plan",
          description: "7-Tage-Ernährungsplan",
          parameters: {
            type: "object",
            properties: {
              weeklyFocus: { type: "string", description: "Ernährungsfokus der Woche" },
              days: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    dayName: { type: "string" },
                    meals: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          time: { type: "string" },
                          description: { type: "string" },
                          proteinAnchor: { type: "string" },
                          alternatives: { type: "array", items: { type: "string" } },
                        },
                        required: ["name", "description", "proteinAnchor"],
                        additionalProperties: false,
                      },
                    },
                    dayTip: { type: "string", description: "Ein Tages-Hinweis" },
                  },
                  required: ["dayName", "meals", "dayTip"],
                  additionalProperties: false,
                },
              },
              weeklyTips: { type: "array", items: { type: "string" }, description: "3 Wochen-Tipps" },
              groceryHighlights: { type: "array", items: { type: "string" }, description: "5-8 wichtigste Einkaufs-Basics" },
            },
            required: ["weeklyFocus", "days", "weeklyTips", "groceryHighlights"],
            additionalProperties: false,
          },
        },
      }];
      tool_choice = { type: "function", function: { name: "weekly_nutrition_plan" } };

    } else if (mode === "estimate-protein") {
      systemPrompt = `Du bist ein CALINESS Ernährungs-Assistent. Schätze den Proteingehalt einer Mahlzeit.
${toneRules}
Sei ehrlich und realistisch. Nutze typische Portionsgrößen.`;

      tools = [{
        type: "function",
        function: {
          name: "protein_estimate",
          description: "Protein-Schätzung einer Mahlzeit",
          parameters: {
            type: "object",
            properties: {
              level: { type: "string", enum: ["niedrig", "mittel", "hoch"], description: "Protein-Level" },
              estimatedGrams: { type: "number", description: "Geschätzte Gramm Protein" },
              explanation: { type: "string", description: "Kurze Erklärung (1 Satz)" },
              suggestion: { type: "string", description: "Verbesserungsvorschlag wenn nötig (1 Satz)" },
            },
            required: ["level", "estimatedGrams", "explanation"],
            additionalProperties: false,
          },
        },
      }];
      tool_choice = { type: "function", function: { name: "protein_estimate" } };

    } else if (mode === "patterns") {
      systemPrompt = `Du bist der CALINESS Muster-Erkenner für Ernährung. Analysiere die Ernährungs-Logs.
${profileCtx}

Ernährungs-Logs:
${JSON.stringify(userContext?.nutritionLogs || [], null, 2)}
${toneRules}

REGELN:
- Identifiziere 1-3 bedeutende Muster
- Keine erfundenen Korrelationen
- Nur Muster die klar erkennbar sind
- Praktische Relevanz priorisieren
- Jedes Muster muss einen echten Mehrwert bieten`;

      tools = [{
        type: "function",
        function: {
          name: "nutrition_patterns",
          description: "Erkannte Ernährungsmuster",
          parameters: {
            type: "object",
            properties: {
              patterns: { type: "array", items: { type: "string" }, description: "1-3 erkannte Muster" },
              topBottleneck: { type: "string", description: "Größter Ernährungs-Engpass" },
              bestNextStep: { type: "string", description: "Der beste nächste Schritt" },
              proteinConsistency: { type: "string", description: "Bewertung der Protein-Konsistenz" },
              mealStructure: { type: "string", description: "Bewertung der Mahlzeiten-Struktur" },
            },
            required: ["patterns", "topBottleneck", "bestNextStep", "proteinConsistency", "mealStructure"],
            additionalProperties: false,
          },
        },
      }];
      tool_choice = { type: "function", function: { name: "nutrition_patterns" } };
    }

    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: "Ungültiger Modus" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
          { role: "user", content: userContext?.userMessage || "Erstelle die Antwort basierend auf meinen Daten." },
        ],
        tools,
        tool_choice,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Zu viele Anfragen. Bitte versuche es in einer Minute erneut." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "KI-Credits aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "KI-Fehler aufgetreten." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Ungültiges AI-Ergebnis." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("nutrition-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
