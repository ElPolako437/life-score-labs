import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, preferences, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = type === 'training'
      ? `Du bist ein erfahrener Personal Trainer und Longevity-Experte. Erstelle einen personalisierten Trainingsplan auf Deutsch.

NUTZERPROFIL:
${JSON.stringify(userContext, null, 2)}

PRÄFERENZEN:
${JSON.stringify(preferences, null, 2)}

Erstelle einen detaillierten Wochenplan. Nutze die generate_training_plan Funktion.`
      : `Du bist ein erfahrener Ernährungswissenschaftler und Longevity-Experte. Erstelle einen personalisierten Ernährungsplan auf Deutsch.

NUTZERPROFIL:
${JSON.stringify(userContext, null, 2)}

PRÄFERENZEN:
${JSON.stringify(preferences, null, 2)}

Berechne den Kalorienbedarf und Makros basierend auf den Profildaten. Erstelle einen Tagesplan mit konkreten Mahlzeiten. Nutze die generate_nutrition_plan Funktion.`;

    const tools = type === 'training' ? [{
      type: "function",
      function: {
        name: "generate_training_plan",
        description: "Erstelle einen strukturierten Trainingsplan",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Titel des Plans" },
            description: { type: "string", description: "Kurze Beschreibung" },
            weeklyCalories: { type: "number", description: "Geschätzter Kalorienverbrauch pro Woche" },
            days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  focus: { type: "string" },
                  duration: { type: "string" },
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        sets: { type: "number" },
                        reps: { type: "string" },
                        rest: { type: "string" },
                        notes: { type: "string" }
                      },
                      required: ["name", "sets", "reps"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["day", "focus", "exercises"],
                additionalProperties: false
              }
            }
          },
          required: ["title", "description", "days"],
          additionalProperties: false
        }
      }
    }] : [{
      type: "function",
      function: {
        name: "generate_nutrition_plan",
        description: "Erstelle einen strukturierten Ernährungsplan",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            dailyCalories: { type: "number" },
            macros: {
              type: "object",
              properties: {
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" }
              },
              required: ["protein", "carbs", "fat"],
              additionalProperties: false
            },
            meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  time: { type: "string" },
                  calories: { type: "number" },
                  protein: { type: "number" },
                  items: {
                    type: "array",
                    items: { type: "string" }
                  },
                  longevityNote: { type: "string" }
                },
                required: ["name", "time", "calories", "items"],
                additionalProperties: false
              }
            },
            tips: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["title", "description", "dailyCalories", "macros", "meals"],
          additionalProperties: false
        }
      }
    }];

    const toolChoice = type === 'training'
      ? { type: "function", function: { name: "generate_training_plan" } }
      : { type: "function", function: { name: "generate_nutrition_plan" } };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Erstelle einen ${type === 'training' ? 'Trainings' : 'Ernährungs'}plan basierend auf meinem Profil und meinen Präferenzen.` },
        ],
        tools,
        tool_choice: toolChoice,
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
      console.error("Plan generation error:", response.status, t);
      return new Response(JSON.stringify({ error: "Plan-Generierung fehlgeschlagen." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const plan = typeof toolCall.function.arguments === 'string' 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;
      return new Response(JSON.stringify({ plan }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Keine Plan-Daten erhalten." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
