// Admin data access edge function
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CALENDLY_LINK = "https://calendly.com/team-calinessacademy/new-meeting";

interface Submission {
  id: string;
  email: string;
  firstname: string;
  answers: number[];
  score_total: number;
  user_age: number;
  result_level: string;
  gdpr_consent: boolean;
  consent_timestamp: string;
  meeting_booked: boolean;
  notes: string;
  created_at: string;
}

// Question mapping for evaluation with full question text
const questionData = [
  { id: 1, category: "Schlaf", domain: "Regeneration", question: "Wie sieht dein Schlaf in einer typischen Woche aus?", options: [
    { text: "Ich schlafe oft weniger als 5 Stunden und wache erschöpft auf", points: 0 },
    { text: "Ich bekomme meist 5-6 Stunden, würde aber gerne mehr schlafen", points: 1 },
    { text: "Ich schlafe 7-8 Stunden, aber die Qualität schwankt", points: 2 },
    { text: "Ich habe einen stabilen Schlafrhythmus mit erholsamen Nächten", points: 3 }
  ]},
  { id: 2, category: "Bewegung", domain: "Aktivität", question: "Wie integrierst du Bewegung in deinen Alltag?", options: [
    { text: "Bewegung kommt im Moment kaum vor – der Alltag lässt wenig Raum", points: 0 },
    { text: "Ich bewege mich gelegentlich, aber ohne feste Routine", points: 1 },
    { text: "Ich habe gute Phasen, aber es fehlt manchmal die Kontinuität", points: 2 },
    { text: "Bewegung ist fester Bestandteil meiner Woche", points: 3 }
  ]},
  { id: 3, category: "Ernährung", domain: "Ernährung", question: "Wie würdest du deine Ernährungsgewohnheiten beschreiben?", options: [
    { text: "Im Alltag greife ich oft zu schnellen, praktischen Optionen", points: 0 },
    { text: "Ich achte teilweise auf meine Ernährung, aber nicht konsequent", points: 1 },
    { text: "Ich ernähre mich meist bewusst, mit gelegentlichen Ausnahmen", points: 2 },
    { text: "Ich wähle überwiegend natürliche, unverarbeitete Lebensmittel", points: 3 }
  ]},
  { id: 4, category: "Stress", domain: "Mentale Gesundheit", question: "Wie erlebst du Stress in deinem Alltag?", options: [
    { text: "Ich fühle mich oft überlastet und finde wenig Ausgleich", points: 0 },
    { text: "Stress ist regelmäßig da, aber ich manage es irgendwie", points: 1 },
    { text: "Ich habe Strategien, die ich aber nicht immer umsetze", points: 2 },
    { text: "Ich habe wirksame Wege gefunden, mit Stress umzugehen", points: 3 }
  ]},
  { id: 5, category: "Alkohol", domain: "Substanzen", question: "Welche Rolle spielt Alkohol in deinem Leben?", options: [
    { text: "Alkohol gehört regelmäßig zu meinem Alltag", points: 0 },
    { text: "Ich trinke gesellschaftlich, meist mehrmals pro Woche", points: 1 },
    { text: "Gelegentlich, aber ich achte auf maßvollen Konsum", points: 2 },
    { text: "Alkohol spielt für mich keine oder kaum eine Rolle", points: 3 }
  ]},
  { id: 6, category: "Achtsamkeit", domain: "Mentale Gesundheit", question: "Wie gehst du mit mentaler Entspannung und Achtsamkeit um?", options: [
    { text: "Entspannung kommt im Alltag oft zu kurz", points: 0 },
    { text: "Ich nehme mir selten bewusst Zeit für mentale Erholung", points: 1 },
    { text: "Ich praktiziere gelegentlich Entspannungstechniken", points: 2 },
    { text: "Mentale Hygiene ist Teil meiner täglichen Routine", points: 3 }
  ]},
  { id: 7, category: "Bildschirmzeit", domain: "Regeneration", question: "Wie sieht deine Bildschirmzeit vor dem Schlafen aus?", options: [
    { text: "Ich bin meist bis kurz vor dem Einschlafen am Bildschirm", points: 0 },
    { text: "Ich versuche es zu reduzieren, aber es gelingt nicht immer", points: 1 },
    { text: "Ich lege das Handy meist rechtzeitig weg", points: 2 },
    { text: "Ich habe eine klare Routine ohne Bildschirme vor dem Schlaf", points: 3 }
  ]},
  { id: 8, category: "Hydration", domain: "Ernährung", question: "Wie steht es um deine Flüssigkeitszufuhr?", options: [
    { text: "Ich vergesse oft zu trinken und merke es erst spät", points: 0 },
    { text: "Ich trinke etwas, aber weniger als ich sollte", points: 1 },
    { text: "Ich achte darauf, genug zu trinken, aber nicht täglich", points: 2 },
    { text: "Ausreichend Wasser zu trinken ist für mich selbstverständlich", points: 3 }
  ]},
  { id: 9, category: "Lebensstil-Bewusstsein", domain: "Mindset", question: "Wie bewusst gestaltest du deinen Lebensstil?", options: [
    { text: "Ich lebe eher im Reaktionsmodus ohne klare Struktur", points: 0 },
    { text: "Ich habe Vorsätze, aber setze sie selten um", points: 1 },
    { text: "Ich optimiere in manchen Bereichen, andere vernachlässige ich", points: 2 },
    { text: "Ich gestalte meinen Lebensstil aktiv und reflektiert", points: 3 }
  ]},
  { id: 10, category: "Körperliches Wohlbefinden", domain: "Körper", question: "Wie nimmst du dein körperliches Wohlbefinden wahr?", options: [
    { text: "Ich spüre oft, dass mein Körper nicht optimal funktioniert", points: 0 },
    { text: "Es gibt gute und weniger gute Tage – ohne klares Muster", points: 1 },
    { text: "Ich fühle mich meist gut, mit gelegentlichen Einschränkungen", points: 2 },
    { text: "Ich fühle mich energiegeladen und körperlich vital", points: 3 }
  ]},
  { id: 11, category: "Krafttraining", domain: "Aktivität", question: "Wie integrierst du Krafttraining in dein Leben?", options: [
    { text: "Krafttraining ist aktuell kein Teil meines Alltags", points: 0 },
    { text: "Ich trainiere sporadisch, ohne festen Plan", points: 1 },
    { text: "Ich trainiere regelmäßig, aber nicht systematisch", points: 2 },
    { text: "Krafttraining ist ein fester Bestandteil meiner Routine", points: 3 }
  ]},
  { id: 12, category: "Ausdauer", domain: "Aktivität", question: "Wie gehst du mit Ausdaueraktivitäten um?", options: [
    { text: "Ausdauer ist im Moment kein Thema für mich", points: 0 },
    { text: "Ich mache gelegentlich etwas, aber unregelmäßig", points: 1 },
    { text: "Ich bewege mich regelmäßig mit moderater Intensität", points: 2 },
    { text: "Ausdauertraining gehört fest zu meiner Woche", points: 3 }
  ]},
  { id: 13, category: "Regeneration", domain: "Regeneration", question: "Wie planst du Regeneration und Erholung?", options: [
    { text: "Erholung passiert, wenn Zeit übrig bleibt – selten geplant", points: 0 },
    { text: "Ich weiß, dass ich mehr regenerieren sollte", points: 1 },
    { text: "Ich plane gelegentlich bewusste Erholungsphasen ein", points: 2 },
    { text: "Regeneration hat für mich denselben Stellenwert wie Training", points: 3 }
  ]},
  { id: 14, category: "Gesundheitswissen", domain: "Mindset", question: "Wie informiert bist du über deinen körperlichen Zustand?", options: [
    { text: "Ich kenne meine Werte nicht und lasse sie nicht prüfen", points: 0 },
    { text: "Ich habe sie einmal checken lassen, aber nicht regelmäßig", points: 1 },
    { text: "Ich lasse mich gelegentlich untersuchen", points: 2 },
    { text: "Ich beobachte meine Werte regelmäßig und gezielt", points: 3 }
  ]},
  { id: 15, category: "Beweglichkeit", domain: "Körper", question: "Wie beweglich und schmerzfrei fühlst du dich?", options: [
    { text: "Ich habe öfter Beschwerden, die mich einschränken", points: 0 },
    { text: "Ich bin etwas steif, aber es beeinträchtigt mich nicht stark", points: 1 },
    { text: "Ich bin recht beweglich mit gelegentlichen Verspannungen", points: 2 },
    { text: "Ich fühle mich beweglich, frei und ohne Einschränkungen", points: 3 }
  ]},
];

// For backwards compatibility
const questionCategories = questionData.map(q => ({ id: q.id, category: q.category, domain: q.domain }));

function analyzeAnswerPattern(answers: number[]): {
  dominantPattern: string;
  stabilityAreas: string[];
  frictionAreas: string[];
  leveragePoints: string[];
} {
  const domainScores: Record<string, { total: number; count: number }> = {};
  const categoryDetails: { category: string; domain: string; score: number }[] = [];

  answers.forEach((score, index) => {
    const q = questionCategories[index];
    if (q) {
      categoryDetails.push({ category: q.category, domain: q.domain, score });
      if (!domainScores[q.domain]) {
        domainScores[q.domain] = { total: 0, count: 0 };
      }
      domainScores[q.domain].total += score;
      domainScores[q.domain].count += 1;
    }
  });

  // Calculate average scores per domain
  const domainAverages = Object.entries(domainScores).map(([domain, data]) => ({
    domain,
    average: data.total / data.count,
  }));

  // Sort domains
  const sortedDomains = domainAverages.sort((a, b) => b.average - a.average);

  // Stability areas (high scores)
  const stabilityAreas = sortedDomains
    .filter((d) => d.average >= 2)
    .map((d) => d.domain);

  // Friction areas (low scores)
  const frictionAreas = sortedDomains
    .filter((d) => d.average < 1.5)
    .map((d) => d.domain);

  // Leverage points (categories with highest impact potential)
  const leverageCategories = categoryDetails
    .filter((c) => c.score <= 1)
    .slice(0, 3)
    .map((c) => c.category);

  // Determine dominant answer pattern
  const answerCounts = { A: 0, B: 0, C: 0, D: 0 };
  answers.forEach((score) => {
    if (score === 0) answerCounts.A++;
    else if (score === 1) answerCounts.B++;
    else if (score === 2) answerCounts.C++;
    else if (score === 3) answerCounts.D++;
  });

  const dominant = Object.entries(answerCounts).sort((a, b) => b[1] - a[1])[0];
  const dominantPattern = `Überwiegend ${dominant[0]}-Antworten (${dominant[1]} von 15)`;

  return {
    dominantPattern,
    stabilityAreas,
    frictionAreas,
    leveragePoints: leverageCategories,
  };
}

function generateEvaluationSheet(submission: Submission): {
  overview: {
    name: string;
    email: string;
    resultLevel: string;
    date: string;
    score: number;
  };
  patternSummary: {
    dominantPattern: string;
    stabilityAreas: string[];
    frictionAreas: string[];
  };
  leveragePoints: string[];
  conversationPrep: {
    openingQuestion: string;
    topicsToExplore: string[];
    redFlags: string[];
  };
  notes: string;
  calendlyLink: string;
} {
  const answers = Array.isArray(submission.answers)
    ? submission.answers
    : [];

  const analysis = analyzeAnswerPattern(answers);

  // Generate opening question based on result level
  let openingQuestion = "";
  let topicsToExplore: string[] = [];
  let redFlags: string[] = [];

  switch (submission.result_level) {
    case "foundation":
      openingQuestion =
        "Was hat dich dazu bewogen, den Test zu machen? Gibt es einen konkreten Auslöser?";
      topicsToExplore = [
        "Tägliche Routinen und Hindernisse",
        "Bisherige Veränderungsversuche",
        "Unterstützungssystem (Familie, Freunde)",
        "Aktuelle Stressoren identifizieren",
      ];
      redFlags = [
        "Unrealistische Erwartungen an schnelle Ergebnisse",
        "Medizinische Beschwerden, die ärztliche Abklärung erfordern",
        "Fehlende Eigenverantwortung / externe Schuldzuweisung",
      ];
      break;
    case "awakening":
      openingQuestion =
        "Du hast bereits Schritte unternommen – was funktioniert aktuell am besten für dich?";
      topicsToExplore = [
        "Bestehende positive Gewohnheiten vertiefen",
        "Inkonsistenz-Muster identifizieren",
        "Prioritäten und Zeitmanagement",
        "Konkrete nächste 30-Tage-Ziele",
      ];
      redFlags = [
        "Perfektionismus als Hindernis",
        "Zu viele gleichzeitige Veränderungen",
        "Burnout-Anzeichen",
      ];
      break;
    case "momentum":
      openingQuestion =
        "Wo siehst du aktuell das größte Optimierungspotenzial in deinem Lebensstil?";
      topicsToExplore = [
        "Feinabstimmung bestehender Routinen",
        "Messbare Fortschritts-Indikatoren",
        "Blinde Flecken aufdecken",
        "Langfristige Ziele und Vision",
      ];
      redFlags = [
        "Überoptimierung / Orthorexie-Tendenzen",
        "Vernachlässigung von Erholung",
        "Soziale Isolation durch Lifestyle",
      ];
      break;
    case "mastery":
      openingQuestion =
        "Was hat dich motiviert, trotz deines bereits guten Lebensstils, an diesem Test teilzunehmen?";
      topicsToExplore = [
        "Langfristige Erhaltungsstrategien",
        "Wissensaustausch und Mentoring",
        "Biomarker-Tracking und Datenanalyse",
        "Neue Erkenntnisse und Trends",
      ];
      redFlags = [
        "Übertraining / fehlende Erholung",
        "Rigidität bei Routinen",
        "Leistungsdruck und Selbstkritik",
      ];
      break;
    default:
      openingQuestion = "Was hat dich zu diesem Test geführt?";
      topicsToExplore = ["Aktuelle Situation verstehen", "Ziele klären"];
      redFlags = [];
  }

  return {
    overview: {
      name: submission.firstname,
      email: submission.email,
      resultLevel: submission.result_level || "unknown",
      date: new Date(submission.created_at).toLocaleDateString("de-DE"),
      score: submission.score_total || 0,
    },
    patternSummary: {
      dominantPattern: analysis.dominantPattern,
      stabilityAreas: analysis.stabilityAreas,
      frictionAreas: analysis.frictionAreas,
    },
    leveragePoints: analysis.leveragePoints,
    conversationPrep: {
      openingQuestion,
      topicsToExplore,
      redFlags,
    },
    notes: submission.notes || "",
    calendlyLink: CALENDLY_LINK,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action, sessionToken, submissionId, filters, notes, meetingBooked } =
      await req.json();

    // Verify session
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: session } = await supabase
      .from("admin_sessions")
      .select("expires_at")
      .eq("session_token", sessionToken)
      .maybeSingle();

    if (!session || new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      let query = supabase
        .from("bioage_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.resultLevel) {
        query = query.eq("result_level", filters.resultLevel);
      }
      if (filters?.meetingBooked !== undefined) {
        query = query.eq("meeting_booked", filters.meetingBooked);
      }
      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error("List error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ submissions: data, calendlyLink: CALENDLY_LINK }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "getEvaluation") {
      if (!submissionId) {
        return new Response(JSON.stringify({ error: "Submission ID required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("bioage_submissions")
        .select("*")
        .eq("id", submissionId)
        .maybeSingle();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Submission not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const evaluation = generateEvaluationSheet(data as Submission);

      return new Response(JSON.stringify({ evaluation }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "updateNotes") {
      if (!submissionId) {
        return new Response(JSON.stringify({ error: "Submission ID required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("bioage_submissions")
        .update({ notes })
        .eq("id", submissionId);

      if (error) {
        return new Response(JSON.stringify({ error: "Failed to update notes" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "updateMeetingStatus") {
      if (!submissionId) {
        return new Response(JSON.stringify({ error: "Submission ID required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("bioage_submissions")
        .update({ meeting_booked: meetingBooked })
        .eq("id", submissionId);

      if (error) {
        return new Response(JSON.stringify({ error: "Failed to update meeting status" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "export") {
      const { data, error } = await supabase
        .from("bioage_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: "Failed to export data" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Convert to CSV
      const headers = [
        "ID",
        "E-Mail",
        "Vorname",
        "Alter",
        "Score",
        "Ergebnis-Level",
        "DSGVO-Consent",
        "Meeting gebucht",
        "Erstellt am",
        "Antworten",
      ];

      const rows = (data || []).map((s: Submission) => [
        s.id,
        s.email,
        s.firstname,
        s.user_age || "",
        s.score_total || "",
        s.result_level || "",
        s.gdpr_consent ? "Ja" : "Nein",
        s.meeting_booked ? "Ja" : "Nein",
        new Date(s.created_at).toLocaleDateString("de-DE"),
        Array.isArray(s.answers) ? s.answers.join(";") : "",
      ]);

      const csv =
        headers.join(",") +
        "\n" +
        rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

      return new Response(JSON.stringify({ csv, calendlyLink: CALENDLY_LINK }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generatePDF") {
      if (!submissionId) {
        return new Response(JSON.stringify({ error: "Submission ID required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("bioage_submissions")
        .select("*")
        .eq("id", submissionId)
        .maybeSingle();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Submission not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const evaluation = generateEvaluationSheet(data as Submission);
      const submission = data as Submission;
      const answers = Array.isArray(submission.answers) ? submission.answers : [];

      // Generate answers HTML with question details
      const answersHtml = questionData.map((q, index) => {
        const rawScore = answers[index];
        const userScore = typeof rawScore === "number" ? rawScore : null;
        const selectedOption = userScore === null ? null : q.options.find((opt) => opt.points === userScore);

        const scoreLabel =
          userScore === null
            ? "-"
            : userScore === 0
              ? "A"
              : userScore === 1
                ? "B"
                : userScore === 2
                  ? "C"
                  : "D";

        const scoreColor =
          userScore === null
            ? "#64748b"
            : userScore === 0
              ? "#ef4444"
              : userScore === 1
                ? "#f59e0b"
                : userScore === 2
                  ? "#3b82f6"
                  : "#22c55e";

        const scoreText = userScore === null ? "-" : `${userScore}/3`;

        return `
          <div class="question-item">
            <div class="question-header">
              <span class="question-number">${index + 1}</span>
              <span class="question-category">${q.category}</span>
              <span class="score-badge" style="background: ${scoreColor}20; color: ${scoreColor};">${scoreLabel} (${scoreText})</span>
            </div>
            <p class="question-text">${q.question}</p>
            <p class="answer-text">${selectedOption ? selectedOption.text : "Keine Antwort"}</p>
          </div>
        `;
      }).join("");

      // Generate conversation starters based on low-score areas
      const conversationStarters = answers.map((score, index) => {
        if (score <= 1) {
          const q = questionData[index];
          return { category: q.category, question: q.question, score };
        }
        return null;
      }).filter(Boolean);

      const startersHtml = conversationStarters.slice(0, 5).map((starter: any) => `
        <div class="starter-item">
          <strong>${starter.category}:</strong>
          <p>"Du hast erwähnt, dass ${starter.category.toLowerCase()} ein Bereich ist, in dem du dich verbessern möchtest. Was hindert dich aktuell am meisten daran?"</p>
        </div>
      `).join("");

      // Generate HTML content for PDF
      const resultLevelLabels: Record<string, string> = {
        foundation: "Fundament",
        awakening: "Erwachen",
        momentum: "Momentum",
        mastery: "Meisterschaft",
      };

      // Caliness Academy brand colors
      const brandColors = {
        primary: '#22c55e', // Neon green
        primaryDark: '#16a34a',
        dark: '#0a0b0f',
        darkSurface: '#111318',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        border: '#1e293b',
        accent: '#22c55e',
      };

      const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>BioAge Auswertung - ${submission.firstname}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      padding: 0; 
      background: linear-gradient(180deg, ${brandColors.dark} 0%, #050506 100%); 
      color: ${brandColors.text}; 
      line-height: 1.6;
      min-height: 100vh;
    }
    .container { 
      max-width: 900px; 
      margin: 0 auto; 
      background: linear-gradient(165deg, ${brandColors.darkSurface} 0%, ${brandColors.dark} 100%); 
      padding: 0; 
      border-radius: 0;
    }
    
    /* Header with Logo */
    .header { 
      background: linear-gradient(135deg, ${brandColors.darkSurface} 0%, rgba(34, 197, 94, 0.05) 100%);
      padding: 40px 50px;
      border-bottom: 1px solid rgba(34, 197, 94, 0.2);
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(ellipse at center, rgba(34, 197, 94, 0.08) 0%, transparent 50%);
      pointer-events: none;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      position: relative;
    }
    .logo-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.primaryDark} 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 24px rgba(34, 197, 94, 0.3), 0 0 48px rgba(34, 197, 94, 0.15);
    }
    .logo-icon svg {
      width: 32px;
      height: 32px;
      fill: ${brandColors.dark};
    }
    .logo-text {
      font-family: 'Outfit', sans-serif;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, ${brandColors.primary} 0%, #4ade80 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 0 30px rgba(34, 197, 94, 0.4);
    }
    .header-content {
      position: relative;
    }
    h1 { 
      font-family: 'Outfit', sans-serif;
      color: ${brandColors.text}; 
      font-size: 32px; 
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    .subtitle { 
      color: ${brandColors.textMuted}; 
      font-size: 14px;
      font-weight: 400;
    }
    
    /* Content area */
    .content {
      padding: 40px 50px;
    }
    
    .section { margin-bottom: 36px; }
    .section-title { 
      font-family: 'Outfit', sans-serif;
      font-size: 18px; 
      font-weight: 600; 
      color: ${brandColors.primary}; 
      margin-bottom: 18px; 
      padding-bottom: 12px; 
      border-bottom: 1px solid ${brandColors.border};
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .info-item { 
      background: linear-gradient(165deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%);
      border: 1px solid ${brandColors.border};
      padding: 18px; 
      border-radius: 12px;
      transition: all 0.2s;
    }
    .info-label { 
      font-size: 11px; 
      color: ${brandColors.textMuted}; 
      text-transform: uppercase; 
      letter-spacing: 0.8px;
      font-weight: 500;
    }
    .info-value { 
      font-size: 17px; 
      font-weight: 600; 
      color: ${brandColors.text}; 
      margin-top: 6px;
    }
    
    .result-badge { 
      display: inline-block; 
      padding: 10px 20px; 
      border-radius: 24px; 
      font-weight: 600; 
      font-size: 14px;
      letter-spacing: 0.3px;
    }
    .result-foundation { background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
    .result-awakening { background: rgba(245, 158, 11, 0.15); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3); }
    .result-momentum { background: rgba(59, 130, 246, 0.15); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }
    .result-mastery { background: rgba(34, 197, 94, 0.15); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.3); }
    
    .tag-list { display: flex; flex-wrap: wrap; gap: 10px; }
    .tag { 
      background: rgba(34, 197, 94, 0.1); 
      color: #86efac; 
      padding: 8px 14px; 
      border-radius: 8px; 
      font-size: 13px;
      font-weight: 500;
      border: 1px solid rgba(34, 197, 94, 0.2);
    }
    .tag-warning { background: rgba(239, 68, 68, 0.1); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.2); }
    .tag-success { background: rgba(34, 197, 94, 0.15); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.25); }
    
    .conversation-box { 
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.02) 100%);
      border-left: 4px solid ${brandColors.primary}; 
      padding: 24px; 
      border-radius: 0 12px 12px 0; 
      margin-bottom: 20px;
      border: 1px solid rgba(34, 197, 94, 0.15);
      border-left: 4px solid ${brandColors.primary};
    }
    .conversation-box h4 { color: #86efac; margin-bottom: 12px; font-weight: 600; }
    
    .list { list-style: none; }
    .list li { padding: 10px 0; padding-left: 24px; position: relative; color: ${brandColors.textMuted}; }
    .list li::before { content: "▸"; color: ${brandColors.primary}; position: absolute; left: 0; font-weight: bold; }
    
    /* Footer */
    .footer { 
      margin-top: 0;
      padding: 30px 50px;
      background: linear-gradient(180deg, transparent 0%, rgba(34, 197, 94, 0.03) 100%);
      border-top: 1px solid ${brandColors.border};
      text-align: center;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .footer-logo {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.primaryDark} 100%);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .footer-logo svg {
      width: 16px;
      height: 16px;
      fill: ${brandColors.dark};
    }
    .footer-text {
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: ${brandColors.textMuted};
    }
    .footer-copyright {
      color: #475569;
      font-size: 11px;
      margin-top: 8px;
    }
    
    .calendly-link { 
      display: inline-block; 
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.primaryDark} 100%);
      color: ${brandColors.dark}; 
      padding: 14px 28px; 
      border-radius: 10px; 
      text-decoration: none; 
      font-weight: 600; 
      margin-top: 16px;
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
    }
    
    /* Question styles */
    .question-item { 
      background: linear-gradient(165deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.4) 100%);
      border: 1px solid ${brandColors.border};
      border-radius: 10px; 
      padding: 18px; 
      margin-bottom: 14px; 
      border-left: 3px solid ${brandColors.border};
    }
    .question-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
    .question-number { 
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.primaryDark} 100%);
      color: ${brandColors.dark}; 
      width: 26px; 
      height: 26px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 12px; 
      font-weight: 700; 
      flex-shrink: 0;
    }
    .question-category { font-size: 11px; text-transform: uppercase; color: ${brandColors.textMuted}; letter-spacing: 0.8px; font-weight: 500; }
    .score-badge { padding: 5px 12px; border-radius: 14px; font-size: 11px; font-weight: 600; }
    .question-text { font-weight: 500; color: ${brandColors.text}; margin-bottom: 8px; font-size: 15px; }
    .answer-text { color: ${brandColors.textMuted}; font-style: italic; padding-left: 12px; border-left: 2px solid ${brandColors.primary}; }
    
    /* Starter styles */
    .starter-item { 
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.06) 0%, rgba(34, 197, 94, 0.02) 100%);
      border: 1px solid rgba(34, 197, 94, 0.15);
      border-radius: 10px; 
      padding: 18px; 
      margin-bottom: 14px;
    }
    .starter-item strong { color: #86efac; font-weight: 600; }
    .starter-item p { color: #6ee7b7; margin-top: 10px; font-style: italic; line-height: 1.5; }
    
    /* Page break styling */
    .page-break { margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span class="logo-text">CALINESS ACADEMY</span>
      </div>
      <div class="header-content">
        <h1>BioAge Auswertung</h1>
        <p class="subtitle">Vertrauliche Analyse • Generiert am ${new Date().toLocaleDateString("de-DE")} um ${new Date().toLocaleTimeString("de-DE")}</p>
      </div>
    </div>
    
    <div class="content">

    <div class="section">
      <h3 class="section-title">👤 Übersicht</h3>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Name</div>
          <div class="info-value">${evaluation.overview.name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">E-Mail</div>
          <div class="info-value">${evaluation.overview.email}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Alter</div>
          <div class="info-value">${submission.user_age || "Nicht angegeben"} Jahre</div>
        </div>
        <div class="info-item">
          <div class="info-label">Gesamtscore</div>
          <div class="info-value">${evaluation.overview.score} / 45 Punkte</div>
        </div>
        <div class="info-item">
          <div class="info-label">Ergebnis-Level</div>
          <div class="info-value">
            <span class="result-badge result-${evaluation.overview.resultLevel}">
              ${resultLevelLabels[evaluation.overview.resultLevel] || evaluation.overview.resultLevel}
            </span>
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Testdatum</div>
          <div class="info-value">${evaluation.overview.date}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h3 class="section-title">📊 Muster-Analyse</h3>
      <p style="margin-bottom: 15px; color: #64748b;">${evaluation.patternSummary.dominantPattern}</p>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #22c55e;">✅ Stabilitätsbereiche:</strong>
        <div class="tag-list" style="margin-top: 8px;">
          ${evaluation.patternSummary.stabilityAreas.length > 0 
            ? evaluation.patternSummary.stabilityAreas.map(area => `<span class="tag tag-success">${area}</span>`).join("")
            : '<span style="color: #64748b;">Keine identifiziert</span>'}
        </div>
      </div>
      
      <div>
        <strong style="color: #ef4444;">⚠️ Reibungsbereiche:</strong>
        <div class="tag-list" style="margin-top: 8px;">
          ${evaluation.patternSummary.frictionAreas.length > 0 
            ? evaluation.patternSummary.frictionAreas.map(area => `<span class="tag tag-warning">${area}</span>`).join("")
            : '<span style="color: #64748b;">Keine identifiziert</span>'}
        </div>
      </div>
    </div>

    <div class="section">
      <h3 class="section-title">🎯 Hebelpunkte</h3>
      <div class="tag-list">
        ${evaluation.leveragePoints.length > 0 
          ? evaluation.leveragePoints.map(point => `<span class="tag">${point}</span>`).join("")
          : '<span style="color: #64748b;">Keine spezifischen Hebelpunkte identifiziert</span>'}
      </div>
    </div>

    <div class="section page-break">
      <h3 class="section-title">💬 Gesprächsvorbereitung</h3>
      <div class="conversation-box">
        <h4>🎤 Empfohlene Eröffnungsfrage</h4>
        <p>"${evaluation.conversationPrep.openingQuestion}"</p>
      </div>

      ${conversationStarters.length > 0 ? `
      <div style="margin-bottom: 20px;">
        <strong style="color: #1e40af;">💡 Persönliche Gesprächsaufhänger (basierend auf Antworten):</strong>
        <div style="margin-top: 12px;">
          ${startersHtml}
        </div>
      </div>
      ` : ""}

      <div style="margin-bottom: 20px;">
        <strong>📋 Zu erkundende Themen:</strong>
        <ul class="list" style="margin-top: 10px;">
          ${evaluation.conversationPrep.topicsToExplore.map(topic => `<li>${topic}</li>`).join("")}
        </ul>
      </div>

      <div>
        <strong style="color: #ef4444;">🚩 Red Flags (beachten):</strong>
        <ul class="list" style="margin-top: 10px;">
          ${evaluation.conversationPrep.redFlags.map(flag => `<li>${flag}</li>`).join("")}
        </ul>
      </div>
    </div>

    <div class="section page-break">
      <h3 class="section-title">📝 Alle Fragen & Antworten</h3>
      ${answersHtml}
    </div>

    ${evaluation.notes ? `
    <div class="section">
      <h3 class="section-title">📌 Notizen</h3>
      <p style="white-space: pre-wrap; background: #f8fafc; padding: 15px; border-radius: 8px;">${evaluation.notes}</p>
    </div>
    ` : ""}

    </div>
    
    <div class="footer">
      <div class="footer-brand">
        <div class="footer-logo">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span class="footer-text">CALINESS ACADEMY</span>
      </div>
      <p style="color: #64748b; font-size: 13px; margin-bottom: 16px;">Diese vertrauliche Auswertung wurde für interne Zwecke generiert.</p>
      <a href="${evaluation.calendlyLink}" class="calendly-link">📅 Meeting buchen</a>
      <p class="footer-copyright">© ${new Date().getFullYear()} Caliness Academy • Alle Rechte vorbehalten</p>
    </div>
  </div>
</body>
</html>`;

      // Generate filename with client name
      const safeName = submission.firstname.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const date = new Date().toISOString().split("T")[0];
      const idSuffix = (submission.id || "").slice(0, 8) || "lead";
      const filename = `auswertung-${safeName}-${date}-${idSuffix}.html`;

      // Admin-only: return the HTML directly (no public upload)
      return new Response(
        JSON.stringify({
          success: true,
          html: htmlContent,
          filename,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Admin data error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
