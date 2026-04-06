import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userName = userContext?.name || "du";

    const agg = userContext?.weeklyAggregation;

    const aggregationSection = agg ? [
      "VORBERECHNETE WOCHEN-ZUSAMMENFASSUNG (nutze diese Zahlen — erfinde keine eigenen):",
      "- Wochen-Score Ø: " + agg.avgScore + " (" + (agg.scoreTrend >= 0 ? "+" : "") + agg.scoreTrend + " zur Vorwoche)",
      "- Bester Tag: " + agg.bestDay + " | Schlechtester Tag: " + agg.worstDay,
      "- Check-in Tage: " + agg.checkInDays + "/7",
      "",
      "SAEULEN-DURCHSCHNITTE:",
      "- Bewegung: " + agg.pillarAvgs.bewegung + " (aktiv an " + agg.pillarConsistency.bewegung + "/7 Tagen)",
      "- Ernaehrung: " + agg.pillarAvgs.ernaehrung + " (aktiv an " + agg.pillarConsistency.ernaehrung + "/7 Tagen)",
      "- Regeneration: " + agg.pillarAvgs.regeneration + " (aktiv an " + agg.pillarConsistency.regeneration + "/7 Tagen)",
      "- Mental: " + agg.pillarAvgs.mental + " (aktiv an " + agg.pillarConsistency.mental + "/7 Tagen)",
      "",
      "BEWEGUNG:",
      "- Training-Tage: " + agg.trainingDays + "/7",
      "- Trainingsminuten gesamt: " + agg.totalActivityMinutes + " Min",
      "- Schritte gesamt: " + agg.totalSteps,
      "",
      "ERNAEHRUNG:",
      "- Protein Ø/Tag: " + agg.avgProtein + "g (Ziel: " + agg.proteinTarget + "g)",
      "- Tage mit >=80% Proteinziel erreicht: " + agg.proteinAdherenceDays + "/7",
      "- Mahlzeiten geloggt an: " + agg.mealLogDays + "/7 Tagen",
      "- Alkohol-Tage: " + agg.alcoholDays,
      "",
      "REGENERATION:",
      "- Schlaf Ø: " + agg.avgSleepHours + "h (Qualitaet: " + agg.avgSleepQuality + "/10)",
      "- Gute Schlafnaechte (>=7h): " + agg.goodSleepDays + "/7",
      "- Bildschirm vor dem Schlafen: " + agg.screenNights + " Naechte",
      "",
      "MENTAL:",
      "- Stress Ø: " + agg.avgStress + "/10",
      "- Stimmung Ø: " + agg.avgMood + "/10",
      "- Energie Ø: " + agg.avgEnergy + "/10",
      "",
      agg.habitLogDays > 0 ? "GEWOHNHEITEN: " + agg.habitCompletionRate + "% Erfolgsrate, " + agg.habitLogDays + "/7 Tage getrackt, Top-Gewohnheit: " + agg.topHabit : "",
      agg.weightDelta !== null ? "GEWICHT: " + agg.weightStart + "kg → " + agg.weightEnd + "kg (" + (agg.weightDelta >= 0 ? "+" : "") + agg.weightDelta + "kg)" : "",
      agg.newBadgesThisWeek?.length > 0 ? "NEUE BADGES: " + agg.newBadgesThisWeek.join(", ") : "",
      "",
      agg.detectedPatterns?.length > 0 ? "AUTOMATISCH ERKANNTE MUSTER (valide diese oder widerlege sie mit den Daten):\n" + agg.detectedPatterns.map((p: string) => "- " + p).join("\n") : "",
    ].filter(Boolean).join("\n") : "";

    const goalSection = userContext?.goalPlan
      ? [
          "AKTIVER ZIELPLAN:",
          "- Ziel: " + userContext.goalPlan.goalType + " - " + (userContext.goalPlan.goalDescription || ""),
          "- Zieldatum: " + (userContext.goalPlan.targetDate || "nicht gesetzt"),
          "- Umsetzung: " + userContext.goalPlan.adherence + "%",
          "- Geplante Bloecke: " + userContext.goalPlan.totalBlocks,
          "- Erledigte Bloecke: " + userContext.goalPlan.completedBlocks,
          "- Wochenfokus: " + (userContext.goalPlan.weeklyFocus || "-"),
          "",
          "Analysiere die Woche IM KONTEXT dieses Ziels. Benenne den #1 Hebel fuer naechste Woche.",
          userContext.goalPlan.goalType === 'fat_loss' ? "Bewerte: Ernaehrungskonsistenz, Alkohol-Einfluss, Gewichtstrend." : "",
          userContext.goalPlan.goalType === 'sleep' ? "Bewerte: Schlafverlauf Mo-So, Bildschirmzeit-Einfluss, Regenerations-Tage." : "",
          userContext.goalPlan.goalType === 'stress' ? "Bewerte: Stressverlauf, Dekompressions-Massnahmen, Wochentag vs. Wochenende." : "",
          userContext.goalPlan.goalType === 'energy' ? "Bewerte: Energieverlauf, Schlaf-Energie-Korrelation, Protein-Einfluss auf Energie." : "",
          (userContext.goalPlan.goalType === 'consistency' || userContext.goalPlan.goalType === 'longevity') ? "Bewerte: Check-in Konsistenz, Plan-Adhaerenz, schwaechster Wochentag." : "",
        ].filter(Boolean).join("\n")
      : "";

    const nutritionSection = userContext?.nutritionData
      ? [
          "ERNAEHRUNGS-DETAILS:",
          "- Proteinziel: " + userContext.nutritionData.proteinTarget + "g/Tag",
          "- Protein Ø/Tag diese Woche: " + userContext.nutritionData.avgDailyProtein + "g",
          "- Tage mit Proteinziel erreicht: " + (userContext.nutritionData.proteinAdherenceDays || 0) + "/7",
          "- Mahlzeiten geloggt: " + userContext.nutritionData.totalMealsLogged,
          "- Mahlzeit-Log-Tage: " + (userContext.nutritionData.mealLogDays || 0) + "/7",
          "- Erkannte Muster: " + (userContext.nutritionData.patterns?.join("; ") || "keine"),
        ].join("\n")
      : "";

    const systemPrompt = [
      "Du bist der persoenliche CALINESS Coach. Du schreibst einen Wochenbrief an " + userName + ".",
      "",
      "PFLICHT-REGELN — KEINE AUSNAHMEN:",
      "1. Jeder Satz mit einer Behauptung MUSS eine konkrete Zahl aus den Daten enthalten (Score, Stunden, Gramm, Tage, Prozent).",
      "2. Keine generischen Saetze wie 'Bleib dran!', 'Du schaffst das!', 'Weiter so!'.",
      "3. Wenn du ein Muster beschreibst, braucht es mindestens 2 Datenpunkte als Beleg.",
      "4. Wenn Daten fehlen oder duenn sind, sag es explizit — erfinde nichts.",
      "5. Schreibe in der Ich-Form (du als Coach), 'du' fuer den Nutzer. Immer Deutsch.",
      "6. Nutze die vorberechnete weeklyAggregation als primaere Zahlenquelle.",
      "",
      "TON: Intelligent, persoenlich, warm, direkt. Wie ein Arzt der zuhört, nicht wie eine App.",
      "",
      "FORMAT:",
      "- introSentence: Persoenliche Anrede mit dem Score-Highlight (1-2 Saetze, KONKRETE Zahlen)",
      "- coachObservations: 2-3 Beobachtungen, jede mit spezifischer Zahl belegt",
      "- weeklyWin: Ein echtes, datenbasiertes Highlight — nenne Zahlen",
      "- bottleneck: Der #1 Engpass, ehrlich formuliert — nenne Zahlen",
      "- patterns: Maximal 3 Muster, nur wenn durch >= 2 Datenpunkte gestuetzt",
      "- nextWeekFocus: 3 konkrete, handlungsbare Prioritaeten — keine generischen Ratschlaege",
      "- closingNote: 1 Satz, der zeigt dass du den Menschen siehst — persoenlich, spezifisch",
      "",
      "NUTZERPROFIL:",
      "Name: " + userName + ", Alter: " + (userContext?.age || "?") + ", Ziele: " + (userContext?.goals?.join(", ") || "keine"),
      "Aktivitaetslevel: " + (userContext?.activityLevel || "?"),
      "Streak: " + (userContext?.streakDays || 0) + " Tage",
      "",
      aggregationSection,
      "",
      goalSection,
      nutritionSection,
      "",
      "VOLLSTAENDIGE ROHDATEN (fuer Detailanalyse):",
      JSON.stringify({
        last7CheckIns: userContext?.last7CheckIns,
        prev7CheckIns: userContext?.prev7CheckIns,
        last7Pillars: userContext?.last7Pillars,
        prev7Pillars: userContext?.prev7Pillars,
        activityLog: userContext?.activityLog?.slice(0, 30),
        wearableData: userContext?.wearableData,
        coachMemory: userContext?.coachMemory?.slice(0, 10),
        badgesThisWeek: userContext?.badgesThisWeek,
      }, null, 2),
      "",
      "REGELN:",
      "- Wenn weniger als 3 Check-ins: vereinfachten Report mit explizitem Hinweis auf fehlende Datenbasis",
      "- Vergleich mit Vorwoche nur wenn prev7CheckIns vorhanden",
      "- goalPlanReview und nutritionReview nur wenn entsprechende Daten vorhanden",
      "- comparison nur wenn prev7CheckIns vorhanden",
    ].filter(Boolean).join("\n");

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
          { role: "user", content: "Erstelle den woechentlichen CALINESS Wochenbrief basierend auf den bereitgestellten Daten." },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_weekly_report",
              description: "Generiert einen strukturierten woechentlichen CALINESS Wochenbrief",
              parameters: {
                type: "object",
                properties: {
                  weekLabel: { type: "string", description: "Kalenderwoche z.B. 'KW 12'" },
                  introSentence: { type: "string", description: "Persoenliche Anrede und Intro (1-2 Saetze)" },
                  coachObservations: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 spezifische Beobachtungen des Coaches aus den Daten",
                  },
                  scoreSummary: {
                    type: "object",
                    properties: {
                      avg: { type: "number" },
                      trend: { type: "number" },
                      bestDay: { type: "string" },
                      weakestDay: { type: "string" },
                      explanation: { type: "string" },
                    },
                    required: ["avg", "trend", "bestDay", "weakestDay", "explanation"],
                    additionalProperties: false,
                  },
                  strongestPillar: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      score: { type: "number" },
                      explanation: { type: "string" },
                    },
                    required: ["name", "score", "explanation"],
                    additionalProperties: false,
                  },
                  weakestPillar: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      score: { type: "number" },
                      explanation: { type: "string" },
                    },
                    required: ["name", "score", "explanation"],
                    additionalProperties: false,
                  },
                  patterns: {
                    type: "array",
                    items: { type: "string" },
                    description: "1-3 erkannte Muster",
                  },
                  bottleneck: { type: "string", description: "Hauptengpass als persoenliche Sorge formuliert" },
                  weeklyWin: { type: "string", description: "Positives Highlight als Wochensieg" },
                  nextWeekFocus: {
                    type: "array",
                    items: { type: "string" },
                    description: "3 konkrete Fokus-Empfehlungen",
                  },
                  closingNote: { type: "string", description: "Persoenliche warme Schlussbeobachtung (1-2 Saetze)" },
                  goalPlanReview: {
                    type: "object",
                    properties: {
                      adherencePercent: { type: "number" },
                      planRealistic: { type: "string" },
                      missedPattern: { type: "string" },
                      adjustment: { type: "string" },
                    },
                    required: ["adherencePercent", "planRealistic", "missedPattern", "adjustment"],
                    additionalProperties: false,
                  },
                  comparison: {
                    type: "object",
                    properties: {
                      scoreDiff: { type: "number" },
                      improvement: { type: "string" },
                      decline: { type: "string" },
                      consistencyChange: { type: "string" },
                    },
                    required: ["scoreDiff", "improvement", "decline", "consistencyChange"],
                    additionalProperties: false,
                  },
                  nutritionReview: {
                    type: "object",
                    properties: {
                      proteinConsistency: { type: "string" },
                      mealStructure: { type: "string" },
                      topPattern: { type: "string" },
                      nextWeekNutritionFocus: { type: "string" },
                    },
                    required: ["proteinConsistency", "mealStructure", "topPattern", "nextWeekNutritionFocus"],
                    additionalProperties: false,
                  },
                },
                required: ["weekLabel", "introSentence", "coachObservations", "scoreSummary", "strongestPillar", "weakestPillar", "patterns", "bottleneck", "weeklyWin", "nextWeekFocus", "closingNote"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_weekly_report" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Zu viele Anfragen. Bitte versuche es in einer Minute erneut." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "KI-Credits aufgebraucht. Bitte spaeter erneut versuchen." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Report konnte nicht generiert werden." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Report-Format ungueltig." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const report = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weekly-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
