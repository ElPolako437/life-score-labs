import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalinessLogo } from "./CalinessLogo";
import { Activity, Heart, Brain, Shield, Star, ArrowRight, Check, Users, Award, Zap, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface LandingPageProps {
  onStartTest: () => void;
}

export const LandingPage = ({ onStartTest }: LandingPageProps) => {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Secret admin access: triple-click on copyright text
  const handleSecretClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 500) {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount >= 3) {
        navigate("/admin");
        setClickCount(0);
      }
    } else {
      setClickCount(1);
    }
    setLastClickTime(now);
  };
  const benefits = [
    {
      icon: Brain,
      title: "Fundiert auf 15 Gesundheitsfaktoren",
      description: "Wissenschaftlich validierte Analyse deiner Lebensweise"
    },
    {
      icon: Zap,
      title: "In 2 Minuten ausgefüllt", 
      description: "Schneller, präziser Test ohne komplizierte Verfahren"
    },
    {
      icon: Heart,
      title: "Sofortige Auswertung",
      description: "Direktes Feedback zu deiner geschätzten Vitalität"
    },
    {
      icon: Shield,
      title: "DSGVO-konform",
      description: "Sicher, vertraulich und datenschutzkonform"
    }
  ];

  const trustSignals = [
    { icon: Users, text: "Ärztenetzwerk-validiert" },
    { icon: Award, text: "Coaching-zertifiziert" }, 
    { icon: Activity, text: "Wissenschaftlich fundiert" }
  ];

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Hero gradient overlay */}
      <div className="absolute inset-0 hero-gradient pointer-events-none" aria-hidden="true" />
      
      {/* Premium Brand Watermarks - decorative */}
      <div className="absolute inset-0 brand-watermark" aria-hidden="true">
        <div className="absolute top-32 right-32 w-40 h-40 opacity-25">
          <img src="/images/caliness-logo-white.png" alt="" className="w-full h-full object-contain floating-icon" loading="lazy" />
        </div>
        <div className="absolute bottom-32 left-32 w-32 h-32 opacity-20">
          <img src="/images/caliness-logo-white.png" alt="" className="w-full h-full object-contain floating-icon" style={{ animationDelay: '1s' }} loading="lazy" />
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-[0.04]">
          <img src="/images/caliness-logo-white.png" alt="" className="w-full h-full object-contain" loading="lazy" />
        </div>
      </div>

      {/* Premium Brand Header */}
      <header className="brand-header relative z-50 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex justify-between items-center">
          <CalinessLogo size="lg" className="brand-logo-premium scale-110 md:scale-125" showText={true} />
          <div className="flex items-center gap-3">
            <Link to="/bestform-calculator">
              <Button variant="ghost" size="sm" className="text-text-muted hover:text-text-primary">
                Bestform Calculator™
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="sm" className="gap-2 backdrop-blur-sm">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-8 md:pt-16 pb-24 md:pb-32" role="main">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          {/* Hero Content */}
          <article className="text-center mb-20 md:mb-28 animate-enter">
            <h1 className="hero-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 md:mb-10 leading-[1.05] max-w-5xl mx-auto">
              Biologisches Alter Test –{" "}
              <span className="gradient-text text-glow-subtle">Longevity Score kostenlos berechnen</span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-text-secondary max-w-3xl mx-auto mb-12 md:mb-16 leading-relaxed body-text">
              Berechne dein biologisches Alter in nur 2 Minuten mit unserem wissenschaftlich fundierten Longevity Test. 
              Erhalte sofort 1 von 4 Longevity-Profilen + eine Lifestyle-basierte Altersschätzung – kostenlos und ohne Anmeldung.
            </p>

            {/* Main CTA */}
            <div className="mb-20 md:mb-24">
              <Button 
                onClick={onStartTest}
                size="xl"
                className="glow-neon text-base md:text-lg px-8 py-6 md:px-14 md:py-7 font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-2xl group animate-glow-pulse"
              >
                Jetzt Longevity Score starten
                <ArrowRight className="ml-2 w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Button>
              
              <p className="text-sm md:text-base text-text-muted mt-6 md:mt-8 tracking-wide">
                Start ohne Anmeldung • Sofort verfügbar • Dauert nur 2 Minuten
              </p>
            </div>
          </article>
          
          {/* Benefits Section */}
          <section className="mb-20 md:mb-28" aria-labelledby="benefits-heading">
            <div className="flex items-center justify-center gap-4 mb-12 md:mb-16">
              <img src="/images/caliness-logo-white.png" alt="" className="w-5 h-5 md:w-6 md:h-6 opacity-50" aria-hidden="true" loading="lazy" />
              <h2 id="benefits-heading" className="section-title text-2xl md:text-3xl lg:text-4xl font-bold text-center">
                Biologisches Alter berechnen – wissenschaftlich & präzise
              </h2>
              <img src="/images/caliness-logo-white.png" alt="" className="w-5 h-5 md:w-6 md:h-6 opacity-50" aria-hidden="true" loading="lazy" />
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 stagger-children">
              {benefits.map((benefit, index) => (
                <Card key={index} className="benefit-card hover-lift group">
                  <CardContent className="p-7 md:p-8 text-center relative z-10">
                    <div className="icon-container w-14 h-14 md:w-16 md:h-16 mx-auto mb-5 md:mb-6 rounded-2xl flex items-center justify-center">
                      <benefit.icon className="w-7 h-7 md:w-8 md:h-8 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" strokeWidth={2.5} />
                      <h3 className="text-base md:text-lg font-semibold text-text-primary leading-tight">
                        {benefit.title}
                      </h3>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Trust Signals */}
          <section className="text-center" aria-label="Vertrauenssiegel und Zertifizierungen">
            <div className="flex items-center justify-center gap-3 mb-8 md:mb-10">
              <img src="/images/caliness-logo-white.png" alt="" className="w-4 h-4 md:w-5 md:h-5 opacity-60" aria-hidden="true" loading="lazy" />
              <span className="text-base md:text-lg text-text-muted tracking-wide">DSGVO-konform • Vertrauliche Datenverarbeitung</span>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-sm md:text-base text-text-muted">
              {trustSignals.map((signal, index) => (
                <div key={index} className="flex items-center gap-2.5 md:gap-3 px-5 py-2.5 md:py-3 rounded-xl bg-elevated-surface/50 border border-border/30 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-elevated-surface/70">
                  <signal.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" strokeWidth={1.5} />
                  <span className="font-medium">{signal.text}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Legal Footer */}
      <footer className="relative z-10 py-8 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-sm text-text-muted">
            <Link to="/impressum" className="hover:text-primary transition-colors">
              Impressum
            </Link>
            <span className="hidden md:inline text-border">|</span>
            <Link to="/datenschutz" className="hover:text-primary transition-colors">
              Datenschutz
            </Link>
            <span className="hidden md:inline text-border">|</span>
            <Link to="/medical-disclaimer" className="hover:text-primary transition-colors">
              Medizinischer Hinweis
            </Link>
            <span className="hidden md:inline text-border">|</span>
            <Link to="/nutzungsbedingungen" className="hover:text-primary transition-colors">
              Nutzungsbedingungen
            </Link>
            <span className="hidden md:inline text-border">|</span>
            <Link to="/downloads" className="hover:text-primary transition-colors">
              Downloads
            </Link>
          </div>
          <p 
            className="text-center text-xs text-text-muted mt-4 cursor-default select-none"
            onClick={handleSecretClick}
          >
            © {new Date().getFullYear()} Caliness Academy. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  );
};