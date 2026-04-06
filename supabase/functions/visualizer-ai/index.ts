import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { currentImage, goalImage, height, weight, trainingDays, sleepHours } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contentParts: any[] = [
      {
        type: "text",
        text: `Du bist ein erfahrener Fitness- und Körpertransformations-Coach der Caliness Academy.

Analysiere die hochgeladenen Bilder und die folgenden Daten:
- Größe: ${height} cm
- Gewicht: ${weight} kg
- Trainingstage pro Woche: ${trainingDays}
- Schlaf pro Nacht: ${sleepHours} Stunden

Aufgabe:
1. Klassifiziere die visuelle Differenz zwischen aktuellem Körper und Zielkörper in eine der Kategorien:
   - "leicht" (minimaler Unterschied, kleine Feinjustierung)
   - "moderat" (sichtbarer Unterschied, z.B. mehr Definition nötig)
   - "deutlich" (deutlicher Unterschied in Körperkomposition)
   - "gross" (große Transformation nötig)

2. Identifiziere den primären Fokusbereich (z.B. "Bauch/Core-Spannung", "Gesamtkörper-Definition", "Oberkörper-Aufbau")

3. Empfehle den strukturellen Hebel (z.B. "Krafttraining 3-4x/Woche", "Ernährungsoptimierung + Cardio")

4. Berechne eine realistische Zeitspanne basierend auf:
   - Visueller Differenz
   - Trainingsfrequenz (mehr Training = schneller)
   - Schlafqualität (≥7h = optimal)
   
   Ranges:
   - leicht: 6-10 Wochen
   - moderat: 10-16 Wochen  
   - deutlich: 16-24 Wochen
   - gross: 24+ Wochen (6+ Monate)
   
   Passe die Range innerhalb der Kategorie an: mehr Training & besserer Schlaf = unteres Ende.

5. Gib eine kurze motivierende Einschätzung (2-3 Sätze), warum diese Zeit realistisch ist.

WICHTIG:
- Gib KEINE exakten Körperfettwerte oder kg-Angaben aus
- Mache KEINE medizinischen Aussagen
- Nutze "Du"-Anrede
- Wenn delta ≥ 15kg geschätzt wird, zeige NIEMALS unter 16 Wochen

${!goalImage ? "Es wurde kein Zielbild hochgeladen. Schätze basierend auf dem aktuellen Bild, was eine allgemein athletische/definierte Zielform wäre." : ""}

Antworte AUSSCHLIESSLICH im folgenden JSON-Format:
{
  "category": "leicht" | "moderat" | "deutlich" | "gross",
  "categoryLabel": "Leichte Veränderung" | "Moderate Transformation" | "Deutliche Transformation" | "Große Transformation",
  "timeRangeMin": number (Wochen),
  "timeRangeMax": number (Wochen),
  "timeLabel": "z.B. 12–18 Wochen",
  "primaryFocus": "string",
  "structuralLever": "string",
  "motivation": "string"
}`
      },
      {
        type: "image_url",
        image_url: { url: currentImage }
      }
    ];

    if (goalImage) {
      contentParts.push({
        type: "image_url",
        image_url: { url: goalImage }
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
          {
            role: "user",
            content: contentParts,
          },
        ],
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let analysis = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("Failed to parse AI response:", content);
    }

    if (!analysis) {
      return new Response(JSON.stringify({ error: "Analyse konnte nicht verarbeitet werden." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("visualizer-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
