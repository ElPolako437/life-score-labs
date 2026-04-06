import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CalinessLogo } from "@/components/CalinessLogo";
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Target,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Zap,
  ExternalLink,
  Save,
  Download,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EvaluationData {
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
}

const AdminEvaluation = () => {
  const { id } = useParams<{ id: string }>();
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const sessionToken = localStorage.getItem("adminSessionToken");

  useEffect(() => {
    if (!sessionToken) {
      navigate("/admin");
      return;
    }
    fetchEvaluation();
  }, [id]);

  const fetchEvaluation = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: { action: "getEvaluation", sessionToken, submissionId: id },
      });

      if (error || data?.error) {
        throw new Error(data?.error || "Failed to fetch");
      }

      setEvaluation(data.evaluation);
      setNotes(data.evaluation.notes || "");
    } catch (err) {
      console.error("Fetch error:", err);
      toast({
        title: "Fehler",
        description: "Evaluation konnte nicht geladen werden",
        variant: "destructive",
      });
      navigate("/admin/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await supabase.functions.invoke("admin-data", {
        body: { action: "updateNotes", sessionToken, submissionId: id, notes },
      });
      toast({
        title: "Gespeichert",
        description: "Notizen wurden aktualisiert",
      });
    } catch (err) {
      console.error("Save error:", err);
      toast({
        title: "Fehler",
        description: "Notizen konnten nicht gespeichert werden",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    const currentToken = sessionStorage.getItem("adminSessionToken");
    if (!currentToken) {
      navigate("/admin");
      return;
    }

    if (!id) {
      toast({
        title: "Fehler",
        description: "Keine Submission-ID gefunden",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: { action: "generatePDF", sessionToken: currentToken, submissionId: id },
      });

      if (error || data?.error) {
        throw new Error(data?.error || "Failed to generate PDF");
      }

      const html = (data?.html as string | undefined) || "";
      const filename = (data?.filename as string | undefined) || `auswertung-${evaluation?.overview?.name || "lead"}.html`;

      if (!html) {
        throw new Error("No HTML returned");
      }

      // Always download the HTML file (most reliable method)
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "✅ Auswertung heruntergeladen",
        description: (
          <div className="space-y-2">
            <p>Die Datei wurde heruntergeladen: <strong>{filename}</strong></p>
            <p className="text-xs text-muted-foreground">
              Öffne die Datei im Browser → Drucken (Strg+P) → Als PDF speichern
            </p>
          </div>
        ),
        duration: 8000,
      });
    } catch (err) {
      console.error("Download error:", err);
      toast({
        title: "Fehler",
        description: "Auswertung konnte nicht generiert werden",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getResultLevelInfo = (level: string) => {
    const info: Record<string, { label: string; color: string; description: string }> = {
      foundation: {
        label: "Fundament (A)",
        color: "text-orange-400",
        description: "Deutliches Optimierungspotenzial in mehreren Bereichen"
      },
      awakening: {
        label: "Erwachen (B)",
        color: "text-yellow-400",
        description: "Auf dem Weg, benötigt mehr Konsistenz"
      },
      momentum: {
        label: "Momentum (C)",
        color: "text-blue-400",
        description: "Solide Basis, Potenzial für Feinabstimmung"
      },
      mastery: {
        label: "Meisterschaft (D)",
        color: "text-primary",
        description: "Bemerkenswert stabiler Lebensstil"
      },
    };
    return info[level] || { label: level, color: "text-text-muted", description: "" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <p className="text-text-muted">Laden...</p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <p className="text-text-muted">Evaluation nicht gefunden</p>
      </div>
    );
  }

  const levelInfo = getResultLevelInfo(evaluation.overview.resultLevel);

  return (
    <div className="min-h-screen bg-gradient-dark p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
            <CalinessLogo size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isDownloading ? "Generiert..." : "Als PDF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(evaluation.calendlyLink, "_blank")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Meeting buchen
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Evaluation Sheet
          </h1>
          <p className="text-text-muted">
            Interne Gesprächsvorbereitung (nur für Admin sichtbar)
          </p>
        </div>

        {/* 1. Overview */}
        <Card className="card-elegant mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Übersicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-muted">Name</p>
                  <p className="text-lg font-medium text-text-primary">{evaluation.overview.name}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">E-Mail</p>
                  <p className="text-text-primary">{evaluation.overview.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-muted">Ergebnis-Level</p>
                  <p className={`text-lg font-bold ${levelInfo.color}`}>{levelInfo.label}</p>
                  <p className="text-sm text-text-muted mt-1">{levelInfo.description}</p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-sm text-text-muted">Datum</p>
                    <p className="text-text-primary">{evaluation.overview.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Score</p>
                    <p className="text-text-primary">{evaluation.overview.score} / 45</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Lifestyle Pattern Summary */}
        <Card className="card-elegant mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Lifestyle-Muster Zusammenfassung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-text-muted mb-2">Dominantes Antwortmuster</p>
              <p className="text-text-primary font-medium">{evaluation.patternSummary.dominantPattern}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-text-muted mb-3">Stabilitätsbereiche</p>
                {evaluation.patternSummary.stabilityAreas.length > 0 ? (
                  <div className="space-y-2">
                    {evaluation.patternSummary.stabilityAreas.map((area, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-text-primary">{area}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-muted italic">Keine identifiziert</p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-text-muted mb-3">Friktionsbereiche</p>
                {evaluation.patternSummary.frictionAreas.length > 0 ? (
                  <div className="space-y-2">
                    {evaluation.patternSummary.frictionAreas.map((area, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                        <span className="text-text-primary">{area}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-muted italic">Keine identifiziert</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Key Leverage Points */}
        <Card className="card-elegant mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Schlüssel-Hebelpunkte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-muted mb-4">
              2-3 Lifestyle-Bereiche mit höchstem Impact-Potenzial
            </p>
            {evaluation.leveragePoints.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">
                {evaluation.leveragePoints.map((point, i) => (
                  <Card key={i} className="bg-elevated-surface/50 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-bold">{i + 1}</span>
                        </div>
                        <span className="text-text-primary font-medium">{point}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-text-muted italic">Basierend auf dem Score keine spezifischen Hebelpunkte identifiziert</p>
            )}
          </CardContent>
        </Card>

        {/* 4. Conversation Preparation */}
        <Card className="card-elegant mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Gesprächsvorbereitung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-text-muted mb-2">Empfohlene Eröffnungsfrage</p>
              <p className="text-text-primary font-medium italic">
                "{evaluation.conversationPrep.openingQuestion}"
              </p>
            </div>
            
            <div>
              <p className="text-sm text-text-muted mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Themen zum Erkunden
              </p>
              <div className="space-y-2">
                {evaluation.conversationPrep.topicsToExplore.map((topic, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-elevated-surface/30 rounded-lg">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-text-secondary">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm text-text-muted mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Red Flags (Achtung)
              </p>
              <div className="space-y-2">
                {evaluation.conversationPrep.redFlags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <span className="text-text-secondary">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Admin Notes */}
        <Card className="card-elegant mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Notizen</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Eigene Notizen für diesen Lead hinzufügen..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[150px] bg-darker-surface/60 border-border/50"
            />
            <div className="flex justify-end mt-4">
              <Button onClick={handleSaveNotes} disabled={isSaving} className="glow-neon">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Speichert..." : "Notizen speichern"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Calendly CTA */}
        <Card className="card-elegant border-primary/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Bereit für das Gespräch?</p>
                  <p className="text-sm text-text-muted">Universeller Meeting-Link: {evaluation.calendlyLink}</p>
                </div>
              </div>
              <Button
                className="glow-neon"
                onClick={() => window.open(evaluation.calendlyLink, "_blank")}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendly öffnen
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminEvaluation;
