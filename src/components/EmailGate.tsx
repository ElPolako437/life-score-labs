import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalinessLogo } from "./CalinessLogo";
import { CheckCircle, Shield, Clock, Target, Sparkles } from "lucide-react";

import { TestState, calculateBioAge } from "@/types/bioage";

interface EmailGateProps {
  testState: TestState;
  onEmailSubmit: (firstName: string, email: string, gdprConsent: boolean) => Promise<void>;
}

export const EmailGate = ({ testState, onEmailSubmit }: EmailGateProps) => {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{firstName?: string; email?: string; gdpr?: string}>({});
  
  // Debug logging and safety check
  console.log("EmailGate testState:", testState);
  
  // Safety check for testState
  if (!testState || !testState.answers) {
    console.error("EmailGate: testState or testState.answers is undefined", testState);
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Fehler aufgetreten</h1>
          <p className="text-text-muted">Test-Daten nicht gefunden. Bitte starten Sie den Test erneut.</p>
        </div>
      </div>
    );
  }
  
  const result = calculateBioAge(testState.answers, testState.userAge || 30);
  const answeredQuestions = Object.keys(testState.answers).length;

  const validateInputs = () => {
    const errors: {firstName?: string; email?: string; gdpr?: string} = {};
    
    // Validate firstName
    if (!firstName.trim()) {
      errors.firstName = "Vorname ist erforderlich";
    } else if (firstName.trim().length < 2) {
      errors.firstName = "Vorname muss mindestens 2 Zeichen haben";
    } else if (firstName.trim().length > 50) {
      errors.firstName = "Vorname darf maximal 50 Zeichen haben";
    }
    
    // Validate email
    if (!email.trim()) {
      errors.email = "E-Mail-Adresse ist erforderlich";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein";
      }
    }

    // Validate GDPR consent
    if (!gdprConsent) {
      errors.gdpr = "Bitte stimme der Datenverarbeitung zu";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onEmailSubmit(firstName.trim(), email.trim(), gdprConsent);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const benefits = [
    {
      icon: Target,
      title: "Individuelle BioAge-Auswertung",
      description: "Erfahre dein biologisches Alter basierend auf wissenschaftlichen Daten"
    },
    {
      icon: CheckCircle,
      title: "Fundiert auf 15 Gesundheitsfaktoren", 
      description: "Umfassende Analyse deiner Lebensweise und Gesundheitsgewohnheiten"
    },
    {
      icon: Clock,
      title: "Personalisiertes Feedback & Empfehlungen",
      description: "Individuelle Strategien zur Optimierung deiner Langlebigkeit"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 hero-gradient opacity-60 pointer-events-none" />
      
      <div className="w-full max-w-4xl mx-auto relative z-10 animate-enter">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <CalinessLogo size="lg" className="justify-center mb-8 md:mb-10" />
          <h1 className="hero-headline text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Dein BioAge wurde <span className="gradient-text text-glow-subtle">berechnet!</span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Du hast <span className="font-semibold text-primary">{answeredQuestions} von 15 Fragen</span> beantwortet. 
            Trage deinen Vornamen und deine E-Mail-Adresse ein, um dein Schnellresultat 
            & eine kostenlose, unverbindliche Analyse zu erhalten.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-5 md:gap-6 mb-10 md:mb-14 stagger-children">
          {benefits.map((benefit, index) => (
            <Card key={index} className="card-elegant hover:border-primary/20 transition-all duration-300">
              <CardContent className="p-6 md:p-7 text-center">
                <div className="icon-container w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 md:mb-5 rounded-2xl flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 md:w-7 md:h-7 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold mb-2 text-text-primary text-base md:text-lg leading-tight">{benefit.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Email Gate Form */}
        <Card className="card-elegant max-w-md mx-auto">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl md:text-2xl font-bold section-title">
              Erhalte dein <span className="gradient-text">Schnellresultat</span>
            </CardTitle>
            <p className="text-text-muted text-sm md:text-base mt-2">
              Deine Auswertung wartet auf dich
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Vorname"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (validationErrors.firstName) {
                      setValidationErrors(prev => ({ ...prev, firstName: undefined }));
                    }
                  }}
                  className={`bg-darker-surface/60 border-border/50 focus:border-primary/50 text-text-primary ${
                    validationErrors.firstName ? 'border-destructive/60 focus:border-destructive' : ''
                  }`}
                  maxLength={50}
                  required
                />
                {validationErrors.firstName && (
                  <p className="text-destructive text-sm mt-2 font-medium">{validationErrors.firstName}</p>
                )}
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="E-Mail-Adresse"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) {
                      setValidationErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  className={`bg-darker-surface/60 border-border/50 focus:border-primary/50 text-text-primary ${
                    validationErrors.email ? 'border-destructive/60 focus:border-destructive' : ''
                  }`}
                  required
                />
                {validationErrors.email && (
                  <p className="text-destructive text-sm mt-2 font-medium">{validationErrors.email}</p>
                )}
              </div>
              
              {/* GDPR Consent Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="gdpr-consent"
                  checked={gdprConsent}
                  onChange={(e) => {
                    setGdprConsent(e.target.checked);
                    if (validationErrors.gdpr) {
                      setValidationErrors(prev => ({ ...prev, gdpr: undefined }));
                    }
                  }}
                  className="mt-1 w-4 h-4 rounded border-border/50 bg-darker-surface/60 text-primary focus:ring-primary"
                />
                <label htmlFor="gdpr-consent" className="text-sm text-text-muted leading-relaxed">
                  Ich stimme zu, dass meine Antworten gespeichert und zur Vorbereitung eines unverbindlichen Orientierungsgesprächs verwendet werden dürfen. Mehr dazu in der{" "}
                  <a href="/datenschutz" target="_blank" className="text-primary hover:underline">
                    Datenschutzerklärung
                  </a>.
                </label>
              </div>
              {validationErrors.gdpr && (
                <p className="text-destructive text-sm font-medium">{validationErrors.gdpr}</p>
              )}
              <Button 
                type="submit" 
                className="w-full glow-neon text-base"
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Lädt...
                  </span>
                ) : "Ergebnis anzeigen"}
              </Button>
            </form>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-2.5 justify-center text-sm text-text-muted">
                <Shield className="w-4 h-4 text-primary" />
                <span>DSGVO-konform • Vertrauliche Datenverarbeitung</span>
              </div>
              
              <div className="grid gap-2.5 text-sm text-text-muted">
                <div className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Keine Werbung – nur dein Ergebnis</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Kostenlose & unverbindliche Analyse</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>DSGVO-konform & sicher</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Signals */}
        <div className="mt-10 md:mt-14 text-center">
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-sm text-text-muted">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Ärztenetzwerk-validiert
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Coaching-zertifiziert
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Wissenschaftlich fundiert
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};