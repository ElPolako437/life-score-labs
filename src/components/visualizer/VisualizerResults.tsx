import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalinessLogo } from "@/components/CalinessLogo";
import { RotateCcw, Target, Wrench, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { VisualizerAnalysis } from "@/pages/BestformVisualizer";

interface Props {
  analysis: VisualizerAnalysis;
  onRestart: () => void;
}

const categoryColor: Record<string, string> = {
  leicht: "text-primary",
  moderat: "text-yellow-400",
  deutlich: "text-orange-400",
  gross: "text-red-400",
};

export const VisualizerResults = ({ analysis, onRestart }: Props) => {
  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient pointer-events-none" aria-hidden="true" />

      <header className="brand-header relative z-50 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex justify-between items-center">
          <CalinessLogo size="lg" className="brand-logo-premium" showText={true} />
          <Button variant="ghost" size="sm" onClick={onRestart} className="text-muted-foreground hover:text-foreground">
            <RotateCcw className="w-4 h-4 mr-2" /> Neue Analyse
          </Button>
        </div>
      </header>

      <main className="relative z-10 pt-8 md:pt-16 pb-24">
        <div className="max-w-3xl mx-auto px-5 md:px-8">
          {/* Headline */}
          <div className="text-center mb-12 animate-enter">
            <p className="text-sm uppercase tracking-widest text-primary font-semibold mb-4">Dein Ergebnis</p>
            <h1 className="hero-headline text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Deine realistische Transformationsdauer
            </h1>

            {/* Big number */}
            <div className="my-10">
              <p className="text-6xl md:text-8xl font-bold gradient-text text-glow mb-2 font-outfit">
                {analysis.timeLabel}
              </p>
              <p className="text-muted-foreground text-lg">
                Basierend auf visueller Differenz und deinem aktuellen Setup.
              </p>
            </div>
          </div>

          {/* Analysis cards */}
          <div className="grid gap-4 md:gap-5 mb-10 stagger-children">
            <Card className="card-elegant">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="icon-container w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Visuelle Differenz</p>
                  <p className={`text-lg font-semibold ${categoryColor[analysis.category] || "text-foreground"}`}>
                    {analysis.categoryLabel}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="icon-container w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Primärer Fokus</p>
                  <p className="text-lg font-semibold text-foreground">{analysis.primaryFocus}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="icon-container w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Struktureller Hebel</p>
                  <p className="text-lg font-semibold text-foreground">{analysis.structuralLever}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Motivation */}
          <Card className="card-elegant mb-10 animate-enter">
            <CardContent className="p-7">
              <p className="text-foreground/90 leading-relaxed body-text">{analysis.motivation}</p>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <p className="text-sm text-muted-foreground/60 text-center mb-14 max-w-xl mx-auto leading-relaxed">
            Diese Analyse basiert auf visuellen Merkmalen und stellt keine medizinische Diagnose dar.
            Die Prognose ist eine realistische Orientierung.
          </p>

          {/* Premium CTA */}
          <Card className="card-elegant border-primary/20 animate-enter">
            <CardContent className="p-8 md:p-10 text-center">
              <h3 className="section-title text-xl md:text-2xl font-bold mb-3">
                Willst du diese Zeit verkürzen?
              </h3>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
                Im 14-Tage Sprint analysieren wir deinen Ist-Zustand entlang unserer 5 Säulen und setzen die entscheidenden Hebel direkt um.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://caliness-academy.de" target="_blank" rel="noopener noreferrer">
                  <Button variant="premium" size="lg" className="rounded-2xl group w-full sm:w-auto">
                    14-Tage Sprint starten
                    <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </a>
                <Link to="/bestform-calculator">
                  <Button variant="outline" size="lg" className="rounded-2xl group w-full sm:w-auto">
                    Bestform Calculator nutzen
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="relative z-10 py-8 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-sm text-muted-foreground">
            <Link to="/impressum" className="hover:text-primary transition-colors">Impressum</Link>
            <span className="hidden md:inline text-border">|</span>
            <Link to="/datenschutz" className="hover:text-primary transition-colors">Datenschutz</Link>
            <span className="hidden md:inline text-border">|</span>
            <Link to="/medical-disclaimer" className="hover:text-primary transition-colors">Medizinischer Hinweis</Link>
            <span className="hidden md:inline text-border">|</span>
            <Link to="/nutzungsbedingungen" className="hover:text-primary transition-colors">Nutzungsbedingungen</Link>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">© {new Date().getFullYear()} Caliness Academy. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
};
