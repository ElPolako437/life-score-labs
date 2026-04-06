import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CalinessLogo } from "./CalinessLogo";
import { BestformResult, BestformInputs } from "@/types/bestform";
import { AlertTriangle, ArrowRight, RotateCcw, Brain, Zap, Info, MessageCircle, Send, Loader2, GraduationCap, Instagram, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface BestformResultsProps {
  result: BestformResult;
  inputs: BestformInputs;
  onRestart: () => void;
}

interface AIAnalysis {
  whyExplanation: string;
  biggestLever: string;
  calorieAdvice: string;
  weeklyPlan: string;
  sustainabilityTip: string;
  scienceInsight?: string;
  commonMistake?: string;
  weeklyMilestones?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const INSTAGRAM_PROFILE = "https://www.instagram.com/caliness_academy/";
const INSTAGRAM_DM_RESET = "https://ig.me/m/caliness_academy?text=RESET";
const INSTAGRAM_DM_SPRINT = "https://ig.me/m/caliness_academy?text=SPRINT";

export const BestformResults = ({ result, inputs, onRestart }: BestformResultsProps) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [scienceOpen, setScienceOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchAIAnalysis(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const fetchAIAnalysis = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("bestform-ai", {
        body: { inputs, result, mode: "analyze" },
      });
      if (error) throw error;
      if (data?.analysis) setAiAnalysis(data.analysis);
    } catch (e) {
      console.error("AI analysis error:", e);
    } finally {
      setAiLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput.trim() };
    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    setChatInput("");
    setChatLoading(true);
    let assistantContent = "";

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bestform-ai`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ inputs, result, mode: "chat", chatHistory: updatedHistory }),
      });
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setChatMessages([...updatedHistory, { role: "assistant", content: assistantContent }]);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      assistantContent = "Entschuldigung, der Chat ist gerade nicht verfügbar.";
      setChatMessages([...updatedHistory, { role: "assistant", content: assistantContent }]);
    } finally {
      setChatLoading(false);
    }
  };

  const AILoadingSkeleton = () => (
    <div className="space-y-2 animate-pulse">
      <div className="h-3 bg-elevated-surface/60 rounded w-full" />
      <div className="h-3 bg-elevated-surface/60 rounded w-4/5" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-dark py-8 px-4 md:px-6 relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient opacity-50 pointer-events-none" />

      <div className="w-full max-w-2xl mx-auto relative z-10">
        <CalinessLogo size="md" className="justify-center mb-8" />

        {/* Goal override notice */}
        {result.goalWasOverridden && result.goalOverrideMessage && (
          <Alert className="mb-6 bg-primary/10 border-primary/30 text-text-primary animate-enter">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-text-secondary leading-relaxed">
              {result.goalOverrideMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* ───── 1. HERO BLOCK ───── */}
        <div className="text-center mb-10 animate-enter">
          <p className="text-xs uppercase tracking-[0.25em] text-text-muted mb-6">
            Deine realistische Zielzeit
          </p>
          <p className="text-5xl md:text-7xl font-bold gradient-text tracking-tight leading-none mb-4">
            {result.rangeLabel}
          </p>
          <p className="text-text-secondary text-sm md:text-base font-medium mb-3">
            Konservativ. Nachhaltig. Planbar.
          </p>
          <p className="text-text-muted text-xs md:text-sm max-w-md mx-auto leading-relaxed">
            Diese Prognose ist bewusst konservativ berechnet, damit du nachhaltig Fortschritte machst – ohne Muskelverlust oder Jo-Jo-Effekt.
          </p>
        </div>

        {/* ───── 2. VERDICHTETE ANALYSE (3 Karten) ───── */}
        <div className="space-y-3 mb-8">
          {/* Warum diese Zeit? */}
          <Card className="card-elegant animate-enter" style={{ animationDelay: "80ms" }}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary mb-1">Warum diese Zeit?</p>
                  {aiLoading ? <AILoadingSkeleton /> : (
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {aiAnalysis?.whyExplanation || result.whyExplanation}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Größter Hebel */}
          <Card className="card-elegant animate-enter" style={{ animationDelay: "120ms" }}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary mb-1">Dein größter Hebel</p>
                  {aiLoading ? <AILoadingSkeleton /> : (
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {aiAnalysis?.biggestLever || result.biggestLever}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Häufigster Fehler */}
          <Card className="card-elegant animate-enter" style={{ animationDelay: "160ms" }}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary mb-1">Häufigster Fehler</p>
                  {aiLoading ? <AILoadingSkeleton /> : (
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {aiAnalysis?.commonMistake || "Wird geladen..."}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wissenschaftlicher Kontext – ausklappbar */}
        {(aiAnalysis?.scienceInsight || aiLoading) && (
          <div className="mb-8 animate-enter" style={{ animationDelay: "200ms" }}>
            <Collapsible open={scienceOpen} onOpenChange={setScienceOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors w-full justify-center group">
                <GraduationCap className="w-4 h-4" />
                <span>Wissenschaftlicher Kontext anzeigen</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${scienceOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="card-elegant mt-3 border-primary/10">
                  <CardContent className="p-5">
                    {aiLoading ? <AILoadingSkeleton /> : (
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {aiAnalysis?.scienceInsight}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* ───── 3. CONVERSION GAP ───── */}
        <Card className="card-elegant mb-8 animate-enter border-primary/40 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" style={{ animationDelay: "240ms" }}>
          <CardContent className="p-6 md:p-8 text-center">
            <p className="text-2xl md:text-3xl font-bold gradient-text mb-3">
              Kann man diese Zeit verkürzen?
            </p>
            <p className="text-base md:text-lg text-text-primary font-medium mb-2">
              Ja – aber nur mit präziser Steuerung.
            </p>
            <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
              Training, Kalorien, Regeneration – die meisten verlieren Monate durch kleine Steuerungsfehler.
            </p>
          </CardContent>
        </Card>

        {/* ───── 4. ENTSCHEIDUNGSBLOCK ───── */}
        <div className="text-center mb-6 animate-enter" style={{ animationDelay: "280ms" }}>
          <h2 className="text-lg md:text-xl font-semibold text-text-primary leading-snug">
            Willst du das alleine umsetzen –<br />
            oder die ersten 14 Tage sauber einstellen?
          </h2>
        </div>

        {/* ───── 5. HAUPT-CONVERSION (DM-FOKUS) ───── */}
        <Card className="card-elegant mb-6 animate-enter border-primary/30 bg-gradient-to-b from-primary/5 to-transparent" style={{ animationDelay: "320ms" }}>
          <CardContent className="p-6 md:p-8">
            <p className="text-lg md:text-xl font-bold text-text-primary text-center mb-2">
              Dein nächster Schritt
            </p>
            <p className="text-sm text-text-muted text-center mb-6">
              Schreib uns per Instagram DM – wir melden uns persönlich.
            </p>

            <div className="space-y-4 mb-8 max-w-sm mx-auto">
              <div className="flex items-start gap-3 bg-elevated-surface/40 rounded-xl p-4">
                <span className="text-primary font-bold text-sm mt-0.5 whitespace-nowrap">„RESET"</span>
                <p className="text-sm text-text-secondary leading-relaxed">
                  → 7-Tage Reset + individueller Mini-Trainingsplan
                </p>
              </div>
              <div className="flex items-start gap-3 bg-elevated-surface/40 rounded-xl p-4">
                <span className="text-primary font-bold text-sm mt-0.5 whitespace-nowrap">„SPRINT"</span>
                <p className="text-sm text-text-secondary leading-relaxed">
                  → Persönliche 14-Tage Begleitung erklärt
                </p>
              </div>
            </div>

            {/* ───── 6. BUTTONS ───── */}
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <a href={INSTAGRAM_DM_RESET} target="_blank" rel="noopener noreferrer">
                <Button variant="premium" size="lg" className="w-full gap-2 text-base py-4 h-auto">
                  <Instagram className="w-5 h-5" />
                  RESET per DM starten
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href={INSTAGRAM_DM_SPRINT} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="w-full gap-2">
                  <Instagram className="w-5 h-5" />
                  SPRINT per DM
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>

            <p className="text-[11px] text-text-muted text-center mt-5">
              Individuell. Persönlich.
            </p>
          </CardContent>
        </Card>

        {/* ───── AI COACH (begrenzt) ───── */}
        <Card className="card-elegant mb-6 animate-enter" style={{ animationDelay: "360ms" }}>
          <CardHeader className="pb-3 cursor-pointer" onClick={() => setChatOpen(!chatOpen)}>
            <CardTitle className="text-base section-title flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Frag deinen AI-Coach
              </span>
              <span className="text-xs text-text-muted">{chatOpen ? "Schließen" : "Öffnen"}</span>
            </CardTitle>
          </CardHeader>
          {chatOpen && (
            <CardContent>
              <div className="space-y-3 max-h-72 overflow-y-auto mb-4 pr-1">
                {chatMessages.length === 0 && (
                  <p className="text-xs text-text-muted text-center py-3">
                    Grundlagen, Konzepte & Motivation – frag einfach los.
                  </p>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary/20 text-text-primary"
                          : "bg-elevated-surface/60 text-text-secondary"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none [&_p]:m-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                  placeholder="z.B. Wie wichtig ist Schlaf für Fettabbau?"
                  className="bg-darker-surface/60 border-border/50 text-text-primary text-sm"
                  disabled={chatLoading}
                />
                <Button
                  size="icon"
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="shrink-0"
                >
                  {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Restart */}
        <div className="text-center animate-enter" style={{ animationDelay: "400ms" }}>
          <Button variant="ghost" onClick={onRestart} className="gap-2 text-text-muted hover:text-text-primary">
            <RotateCcw className="w-4 h-4" />
            Erneut berechnen
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border/30 text-center">
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm text-text-muted">
            <Link to="/impressum" className="hover:text-primary transition-colors">Impressum</Link>
            <Link to="/datenschutz" className="hover:text-primary transition-colors">Datenschutz</Link>
            <Link to="/medical-disclaimer" className="hover:text-primary transition-colors">Medizinischer Hinweis</Link>
            <Link to="/nutzungsbedingungen" className="hover:text-primary transition-colors">Nutzungsbedingungen</Link>
          </div>
          <p className="text-xs text-text-muted mt-4">
            © {new Date().getFullYear()} Caliness Academy. Alle Rechte vorbehalten.
          </p>
        </footer>
      </div>
    </div>
  );
};
