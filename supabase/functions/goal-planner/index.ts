import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildRealismCheckPrompt(goal: any, userContext: any): string {
  return "Du bist der CALINESS Zielplaner-KI – ein Premium-Longevity-Planungssystem.\n\n" +
    "Analysiere das Ziel des Nutzers und gib eine ehrliche, aber unterstützende Einschätzung.\n\n" +
    "Nutzer-Kontext:\n" +
    "- Name: " + userContext.name + "\n" +
    "- Alter: " + userContext.age + "\n" +
    "- Gewicht: " + userContext.weight + " kg\n" +
    "- Größe: " + userContext.height + " cm\n" +
    "- Aktivitätslevel: " + userContext.activityLevel + "\n" +
    "- Schlafqualität: " + userContext.sleepQuality + "\n" +
    "- Stresslevel: " + userContext.stressLevel + "\n" +
    "- Longevity-Score: " + userContext.longevityScore + "/100\n" +
    "- Schwächste Säule: " + userContext.weakestPillar + "\n" +
    "- Stärkste Säule: " + userContext.strongestPillar + "\n" +
    "- Streak: " + userContext.streak + " Tage\n" +
    "- Konsistenz: " + userContext.weeklyConsistency + "%\n\n" +
    "Ziel-Details:\n" +
    "- Ziel: " + goal.type + "\n" +
    "- Beschreibung: " + goal.description + "\n" +
    "- Zieldatum: " + goal.targetDate + "\n" +
    "- Wochen bis Ziel: " + goal.weeksToTarget + "\n" +
    "- Trainingstage/Woche: " + goal.trainingDays + "\n" +
    "- Verfügbare Tage: " + (goal.availableDays?.join(", ") || "") + "\n" +
    "- Zeit pro Einheit: " + goal.sessionMinutes + " Minuten\n" +
    "- Stressigste Tage: " + (goal.stressfulDays?.join(", ") || "") + "\n" +
    "- Gewünschte Routinen: " + (goal.desiredRoutines?.join(", ") || "") + "\n" +
    "- Bevorzugte Trainingszeit: " + goal.preferredTime + "\n" +
    "- Größtes Hindernis: " + goal.biggestObstacle + "\n\n" +
    "Bewerte realistisch:\n1. Ist das Zeitfenster realistisch?\n2. Passt die Trainingsfrequenz zum Alltag?\n3. Was ist der größte Hebel?\n4. Welche Anpassungen sind nötig?\n\nAntworte immer auf Deutsch. Sei ehrlich aber nie hart. Premium-Ton, ruhig und kompetent.";
}

function buildGeneratePlanPrompt(goal: any, userContext: any): string {
  return "Du bist der CALINESS Zielplaner-KI. Erstelle einen strukturierten Wochenplan.\n\n" +
    "Nutzer-Kontext:\n" +
    "- Ziel: " + goal.type + " – " + goal.description + "\n" +
    "- Trainingstage: " + goal.trainingDays + "/Woche\n" +
    "- Verfügbare Tage: " + (goal.availableDays?.join(", ") || "") + "\n" +
    "- Zeit pro Einheit: " + goal.sessionMinutes + " Min\n" +
    "- Stressige Tage: " + (goal.stressfulDays?.join(", ") || "") + "\n" +
    "- Routinen: " + (goal.desiredRoutines?.join(", ") || "") + "\n" +
    "- Bevorzugte Zeit: " + goal.preferredTime + "\n" +
    "- Schwächste Säule: " + userContext.weakestPillar + "\n" +
    "- Stresslevel: " + userContext.stressLevel + "\n\n" +
    "Regeln:\n- Stressige Tage: leichtere Planung, mehr Recovery\n- Schwächste Säule als Hebel einbauen\n- Konsistenz > Perfektion\n- Realistische Zeitslots\n- Nicht überladen\n- Jeden Tag mind. 1 Block, aber max 3\n- Check-in jeden Tag\n- Wochenreview am Sonntag\n- Alle Texte auf Deutsch";
}

function buildAdaptPlanPrompt(goal: any, userContext: any): string {
  return "Du bist der CALINESS Zielplaner-KI. Der Nutzer braucht eine Plan-Anpassung.\n\n" +
    "Kontext:\n" +
    "- Ursprüngliches Ziel: " + goal.type + "\n" +
    "- Adherence diese Woche: " + goal.adherence + "%\n" +
    "- Verpasste Sessions: " + goal.missedSessions + "\n" +
    "- Anpassungsgrund: " + goal.adaptReason + "\n" +
    "- Schwächste Säule: " + userContext.weakestPillar + "\n\n" +
    "Erstelle eine angepasste, realistischere Empfehlung. Nie beschämend. Immer unterstützend und lösungsorientiert.";
}

function buildAdjustPlanPrompt(goal: any, userContext: any): string {
  const currentPlanStr = goal.currentPlan ? JSON.stringify(goal.currentPlan) : "kein Plan";
  return "Du bist der CALINESS Zielplaner-KI. Der Nutzer möchte seinen bestehenden Wochenplan anpassen.\n\n" +
    "Anpassungsanfrage: " + (goal.adjustmentRequest || "") + "\n\n" +
    "Profil:\n" +
    "- Name: " + userContext.name + "\n" +
    "- Stresslevel: " + userContext.stressLevel + "\n" +
    "- Schwächste Säule: " + userContext.weakestPillar + "\n" +
    "- Streak: " + userContext.streak + " Tage\n\n" +
    "Aktueller Plan (JSON):\n" + currentPlanStr + "\n\n" +
    "WICHTIGE REGELN:\n" +
    "- Behalte alle bereits als completed markierten Blöcke exakt bei\n" +
    "- Ändere nur zukünftige/unvollständige Blöcke\n" +
    "- Erstelle einen komplett neuen weeklyBlocks Array mit den Anpassungen\n" +
    "- Erkläre kurz was du geändert hast\n" +
    "- Alle Texte auf Deutsch";
}

const realismTools = [{
  type: "function",
  function: {
    name: "realism_assessment",
    description: "Realismus-Bewertung des Nutzerziels",
    parameters: {
      type: "object",
      properties: {
        rating: { type: "string", enum: ["gut_realistisch", "machbar_mit_struktur", "ambitioniert", "zu_aggressiv"] },
        ratingLabel: { type: "string", description: "Deutscher Label" },
        summary: { type: "string", description: "2-3 Sätze Zusammenfassung" },
        keyInsight: { type: "string", description: "Wichtigster Hinweis" },
        adjustedWeeks: { type: "number" },
        weeklyFocus: { type: "string" },
        biggestLever: { type: "string" },
        riskFactors: { type: "array", items: { type: "string" } },
        recommendations: { type: "array", items: { type: "string" } },
      },
      required: ["rating", "ratingLabel", "summary", "keyInsight", "adjustedWeeks", "weeklyFocus", "biggestLever", "riskFactors", "recommendations"],
      additionalProperties: false,
    },
  },
}];

const weeklyPlanTools = [{
  type: "function",
  function: {
    name: "weekly_plan",
    description: "Strukturierter Wochenplan",
    parameters: {
      type: "object",
      properties: {
        weeklyBlocks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "string", enum: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"] },
              blocks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["training", "routine_morning", "routine_evening", "movement", "recovery", "checkin", "review", "meal_prep", "decompression"] },
                    label: { type: "string" },
                    time: { type: "string" },
                    duration: { type: "number" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["hoch", "mittel", "optional"] },
                  },
                  required: ["type", "label", "time", "duration", "description", "priority"],
                  additionalProperties: false,
                },
              },
              dayNote: { type: "string" },
            },
            required: ["day", "blocks", "dayNote"],
            additionalProperties: false,
          },
        },
        weeklyMotivation: { type: "string" },
        focusPillar: { type: "string" },
      },
      required: ["weeklyBlocks", "weeklyMotivation", "focusPillar"],
      additionalProperties: false,
    },
  },
}];

const adaptTools = [{
  type: "function",
  function: {
    name: "plan_adaptation",
    description: "Angepasster Plan-Vorschlag",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string" },
        adjustments: { type: "array", items: { type: "string" } },
        simplifiedFocus: { type: "string" },
      },
      required: ["message", "adjustments", "simplifiedFocus"],
      additionalProperties: false,
    },
  },
}];

const adjustTools = [{
  type: "function",
  function: {
    name: "plan_adjustment",
    description: "Angepasster Wochenplan mit Erklärung",
    parameters: {
      type: "object",
      properties: {
        weeklyBlocks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "string", enum: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"] },
              blocks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["training", "routine_morning", "routine_evening", "movement", "recovery", "checkin", "review", "meal_prep", "decompression"] },
                    label: { type: "string" },
                    time: { type: "string" },
                    duration: { type: "number" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["hoch", "mittel", "optional"] },
                    completed: { type: "boolean" },
                  },
                  required: ["type", "label", "time", "duration", "description", "priority"],
                  additionalProperties: false,
                },
              },
              dayNote: { type: "string" },
            },
            required: ["day", "blocks", "dayNote"],
            additionalProperties: false,
          },
        },
        weeklyMotivation: { type: "string" },
        focusPillar: { type: "string" },
        changesSummary: { type: "string", description: "Zusammenfassung der Änderungen in 1-2 Sätzen" },
      },
      required: ["weeklyBlocks", "weeklyMotivation", "focusPillar", "changesSummary"],
      additionalProperties: false,
    },
  },
}];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, goal, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let tools: any[] = [];
    let tool_choice: any = undefined;

    if (mode === "realism-check") {
      systemPrompt = buildRealismCheckPrompt(goal, userContext);
      tools = realismTools;
      tool_choice = { type: "function", function: { name: "realism_assessment" } };
    } else if (mode === "generate-plan") {
      systemPrompt = buildGeneratePlanPrompt(goal, userContext);
      tools = weeklyPlanTools;
      tool_choice = { type: "function", function: { name: "weekly_plan" } };
    } else if (mode === "adapt-plan") {
      systemPrompt = buildAdaptPlanPrompt(goal, userContext);
      tools = adaptTools;
      tool_choice = { type: "function", function: { name: "plan_adaptation" } };
    } else if (mode === "adjust-plan") {
      systemPrompt = buildAdjustPlanPrompt(goal, userContext);
      tools = adjustTools;
      tool_choice = { type: "function", function: { name: "plan_adjustment" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + LOVABLE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Bitte analysiere und erstelle die Antwort basierend auf den gegebenen Daten." },
        ],
        tools,
        tool_choice,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es in einer Minute erneut." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Nicht genügend Credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("goal-planner error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
