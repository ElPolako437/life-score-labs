import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalinessLogo } from "@/components/CalinessLogo";
import { ArrowRight, Eye, Clock, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  onStart: () => void;
}

export const VisualizerLanding = ({ onStart }: Props) => {
  const benefits = [
    { icon: Eye, title: "Visuelle KI-Analyse", description: "Deine Bilder werden durch KI visuell ausgewertet – keine Standardformeln" },
    { icon: Clock, title: "Realistische Zeitspanne", description: "Basierend auf visueller Differenz und deinem Setup" },
    { icon: Sparkles, title: "Premium Ergebnis", description: "Fokusbereich, Hebel und individuelle Einschätzung" },
    { icon: Shield, title: "Keine Veröffentlichung", description: "Bilder werden nicht gespeichert und nicht weitergegeben" },
  ];

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient pointer-events-none" aria-hidden="true" />

      <div className="absolute inset-0 brand-watermark" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-[0.04]">
          <img src="/images/caliness-logo-white.png" alt="" className="w-full h-full object-contain" loading="lazy" />
        </div>
      </div>

      <header className="brand-header relative z-50 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex justify-between items-center">
          <CalinessLogo size="lg" className="brand-logo-premium scale-110 md:scale-125" showText={true} />
          <div className="flex items-center gap-3">
            <Link to="/"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Longevity Score</Button></Link>
            <Link to="/bestform-calculator"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Calculator</Button></Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-8 md:pt-16 pb-24 md:pb-32" role="main">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <article className="text-center mb-20 md:mb-28 animate-enter">
            <h1 className="hero-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 md:mb-10 leading-[1.05] max-w-5xl mx-auto">
              Bestform Visualizer
              <span className="gradient-text text-glow-subtle">™</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-medium">
              Wie groß ist der Unterschied zwischen deinem aktuellen Stand und deinem Ziel?
            </p>

            <p className="text-lg md:text-xl text-muted-foreground/70 max-w-3xl mx-auto mb-4 leading-relaxed body-text">
              Lade ein aktuelles Bild und dein Wunschziel hoch.<br />
              Wir schätzen den notwendigen Veränderungsumfang und berechnen eine realistische Zeitspanne.
            </p>

            <p className="text-base md:text-lg text-primary font-medium mb-12 md:mb-16">
              KI-gestützte Analyse statt Schätzung.
            </p>

            <div className="mb-20 md:mb-24">
              <Button
                onClick={onStart}
                size="xl"
                className="glow-neon text-base md:text-lg px-8 py-6 md:px-14 md:py-7 font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-2xl group"
              >
                Analyse starten
                <ArrowRight className="ml-2 w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Button>

              <p className="text-sm text-muted-foreground/60 mt-6 md:mt-8 tracking-wide">
                Keine Veröffentlichung deiner Bilder. Keine medizinische Bewertung.
              </p>
            </div>
          </article>

          <section className="mb-20 md:mb-28" aria-labelledby="benefits-heading">
            <h2 id="benefits-heading" className="section-title text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12 md:mb-16">
              Visuelle Differenz – datenbasiert analysiert
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 stagger-children">
              {benefits.map((b, i) => (
                <Card key={i} className="benefit-card hover-lift group">
                  <CardContent className="p-7 md:p-8 text-center relative z-10">
                    <div className="icon-container w-14 h-14 md:w-16 md:h-16 mx-auto mb-5 md:mb-6 rounded-2xl flex items-center justify-center">
                      <b.icon className="w-7 h-7 md:w-8 md:h-8 text-primary" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-foreground leading-tight mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
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
