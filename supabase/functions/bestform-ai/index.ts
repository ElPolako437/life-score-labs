import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildUserProfile(inputs: any, result: any) {
  const gender = inputs.gender === "male" ? "Mann" : "Frau";
  const age = inputs.age ?? "unbekannt";
  const currentWeight = inputs.currentWeight ?? 80;
  const targetWeight = inputs.targetWeight;
  const goal = inputs.goal;
  const trainingDays = inputs.trainingDays ?? 0;
  const trainingType = inputs.trainingType ?? "both";
  const sleepHours = inputs.sleepHours ?? 7;
  const wakesAtNight = inputs.wakesAtNight ?? false;
  const nutrition = inputs.nutrition ?? "rough";
  const height = inputs.height ?? 175;
  const deltaKg = targetWeight ? Math.max(currentWeight - targetWeight, 0) : 0;

  // Mifflin-St Jeor BMR
  const bmr = inputs.gender === "male"
    ? 10 * currentWeight + 6.25 * height - 5 * age + 5
    : 10 * currentWeight + 6.25 * height - 5 * age - 161;

  const activityMultiplier = trainingDays <= 1 ? 1.2
    : trainingDays <= 3 ? 1.375
    : trainingDays <= 5 ? 1.55
    : 1.725;

  const tdee = Math.round(bmr * activityMultiplier);
  const bmi = (currentWeight / ((height / 100) ** 2)).toFixed(1);

  let calorieInfo = "";
  if (goal === "fat_loss" && deltaKg > 0) {
    const weeklyLoss = currentWeight * 0.006;
    const dailyDeficit = Math.round((weeklyLoss * 7700) / 7);
    const targetCalories = tdee - dailyDeficit;
    calorieInfo = `Geschätzter TDEE: ~${tdee} kcal/Tag. Für nachhaltigen Fettabbau von ~${weeklyLoss.toFixed(2)} kg/Woche (0.6% KG): Defizit ~${dailyDeficit} kcal/Tag → Zielaufnahme: ~${targetCalories} kcal/Tag. Gesamt: ${deltaKg} kg.`;
  } else if (goal === "muscle_gain") {
    calorieInfo = `Geschätzter TDEE: ~${tdee} kcal/Tag. Für Muskelaufbau: Überschuss ~300 kcal/Tag → ~${tdee + 300} kcal/Tag. Protein: ${Math.round(currentWeight * 1.8)}–${Math.round(currentWeight * 2.2)} g/Tag.`;
  } else if (goal === "toning") {
    calorieInfo = `Geschätzter TDEE: ~${tdee} kcal/Tag. Für Straffung: leichtes Defizit ~250 kcal/Tag → ~${tdee - 250} kcal/Tag. Protein: mindestens ${Math.round(currentWeight * 1.8)} g/Tag.`;
  } else {
    calorieInfo = `Geschätzter TDEE: ~${tdee} kcal/Tag.`;
  }

  const goalLabels: Record<string, string> = {
    fat_loss: "Fett reduzieren", muscle_gain: "Muskelaufbau",
    toning: "Straffer werden", unsure: "Allgemeine Bestform",
  };

  // Sleep score
  let sleepScore = "gut";
  if (sleepHours < 6) sleepScore = "kritisch";
  else if (sleepHours < 7 || wakesAtNight) sleepScore = "verbesserungswürdig";

  // Training score
  let trainingScore = "gut";
  if (trainingDays <= 1) trainingScore = "kritisch";
  else if (trainingDays <= 2) trainingScore = "verbesserungswürdig";
  else if (trainingDays >= 4 && (trainingType === "strength" || trainingType === "both")) trainingScore = "optimal";

  // Nutrition score
  let nutritionScore = "gut";
  if (nutrition === "none") nutritionScore = "kritisch";
  else if (nutrition === "structured") nutritionScore = "optimal";

  return {
    profileText: `Profil: ${gender}, ${age} Jahre, ${height} cm, ${currentWeight} kg, BMI ${bmi}${targetWeight ? `, Zielgewicht: ${targetWeight} kg` : ""}.
Ziel: ${goalLabels[goal] || "Allgemein"}.
Training: ${trainingDays} Tage/Woche, Typ: ${trainingType === "strength" ? "Kraft" : trainingType === "cardio" ? "Cardio" : "Kraft + Cardio"}.
Schlaf: ${sleepHours}h/Nacht${wakesAtNight ? ", wacht regelmäßig nachts auf" : ""} → Status: ${sleepScore}.
Ernährung: ${nutrition === "none" ? "kein Tracking" : nutrition === "rough" ? "grob strukturiert" : "strukturiert mit Proteinbewusstsein"} → Status: ${nutritionScore}.
Training-Status: ${trainingScore}.
Berechnete Zielzeit: ${result?.rangeLabel || "unbekannt"}.
${calorieInfo}`,
    tdee,
    calorieInfo,
    scores: { sleep: sleepScore, training: trainingScore, nutrition: nutritionScore },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { inputs, result, mode, chatHistory } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { profileText, tdee, calorieInfo, scores } = buildUserProfile(inputs, result);

    let messages: { role: string; content: string }[] = [];
    let stream = false;

    if (mode === "analyze") {
      messages = [
        {
          role: "system",
          content: `Du bist ein erfahrener Fitness- und Ernährungscoach der Caliness Academy mit tiefem Verständnis für evidenzbasierte Trainings- und Ernährungswissenschaft. Du gibst realistische, wissenschaftlich fundierte Einschätzungen auf Deutsch. KEINE medizinischen Diagnosen. Immer "Du"-Anrede. Schreibe persönlich und motivierend, aber faktenbasiert.

WICHTIG: Zitiere KEINE Wissenschaftler, Studien oder Autoren namentlich in den Feldern whyExplanation, biggestLever und commonMistake. Verwende stattdessen allgemeine Formulierungen wie "Studien zeigen", "Die Forschung bestätigt" oder erkläre den Sachverhalt direkt ohne Quellenangabe. Das Feld scienceInsight darf Studien/Autoren nennen.

Antworte IMMER im folgenden JSON-Format:

{
  "whyExplanation": "2-3 Sätze warum die berechnete Zeit realistisch ist, mit Bezug auf die konkreten Daten. KEINE Autorennamen oder Studienverweise.",
  "biggestLever": "1-2 konkrete Sätze zum wichtigsten Hebel mit Handlungsanweisung. KEINE Autorennamen oder Studienverweise.",
  "calorieAdvice": "2-3 Sätze mit konkreten Kalorienzahlen (Defizit/Überschuss), Makroverteilung und Proteinempfehlung",
  "weeklyPlan": "Konkrete Empfehlung für die Wochenstruktur (Trainingstage, Regeneration, Ernährungsfokus)",
  "sustainabilityTip": "1-2 Sätze zu nachhaltigem Vorgehen",
  "scienceInsight": "2-3 Sätze mit einem konkreten wissenschaftlichen Fakt, der für dieses Profil besonders relevant ist. Hier darfst du Studien/Autoren nennen.",
  "commonMistake": "2-3 Sätze zum häufigsten Fehler bei diesem Ziel und wie man ihn konkret vermeidet. KEINE Autorennamen oder Studienverweise.",
  "weeklyMilestones": "Beschreibe in 3 Phasen was realistisch passiert: Phase 1 (Woche 1-4), Phase 2 (Woche 5-8), Phase 3 (Woche 9-12+). Pro Phase 1 Satz."
}

Nutze die berechneten Kalorienwerte. Erfinde keine Zahlen. Sei konkret und personalisiert.`,
        },
        { role: "user", content: `Analysiere:\n\n${profileText}` },
      ];
    } else if (mode === "chat") {
      stream = true;
      const systemMsg = {
        role: "system",
        content: `Du bist ein freundlicher, kompetenter Fitness-Coach der Caliness Academy. Antworte auf Deutsch, kurz (max 4 Sätze). "Du"-Anrede. KEINE medizinischen Diagnosen. Nutze wissenschaftliche Fakten wenn passend.

WICHTIGE EINSCHRÄNKUNGEN:
- Du darfst Grundlagen erklären, Konzepte erläutern und Motivation geben.
- Du darfst KEINE vollständigen individuellen Trainingspläne erstellen.
- Du darfst KEINE kompletten Ernährungspläne mit Mahlzeiten berechnen.
- Du darfst KEINE Sprint-Level Betreuung ersetzen.
- Wenn jemand sehr spezifische Detail-Fragen stellt (z.B. "Erstell mir einen kompletten Trainingsplan", "Was genau soll ich jeden Tag essen?"), gib eine kurze hilfreiche Grundlage und beende deine Antwort IMMER mit: "Für eine präzise individuelle Optimierung schreib uns gerne ‚SPRINT' per Instagram DM."

Nutzerprofil:
${profileText}

Beantworte Rückfragen basierend auf diesen Daten. Sei konkret und praxisnah.`,
      };
      messages = [systemMsg, ...(chatHistory || [])];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Bitte warte kurz." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI-Credits aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI nicht erreichbar" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let analysis = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
    } catch { /* fallback */ }

    return new Response(JSON.stringify({ analysis, calorieInfo, tdee, scores }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bestform-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
