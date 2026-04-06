import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CalinessLogo } from "./CalinessLogo";
import { ChevronRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { SelfAssessment } from "@/types/bioage";

interface AgeInputProps {
  onAgeSubmit: (age: number, selfAssessment: SelfAssessment | null) => void;
}

export const AgeInput = ({ onAgeSubmit }: AgeInputProps) => {
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [selfAssessment, setSelfAssessment] = useState<SelfAssessment | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ageNumber = parseInt(age);
    
    if (!age.trim()) {
      setError("Bitte gib dein Alter ein");
      return;
    }
    
    if (isNaN(ageNumber) || ageNumber < 14 || ageNumber > 99) {
      setError("Bitte gib ein gültiges Alter zwischen 14 und 99 Jahren ein");
      return;
    }

    if (!consentGiven) {
      setConsentError("Bitte bestätige die Einwilligung zur Datenverarbeitung");
      return;
    }
    
    setError("");
    setConsentError("");
    onAgeSubmit(ageNumber, selfAssessment);
  };

  const selfAssessmentOptions: { value: SelfAssessment; label: string }[] = [
    { value: 'younger', label: 'Eher jünger' },
    { value: 'matching', label: 'Etwa passend' },
    { value: 'older', label: 'Eher älter' },
    { value: 'unsure', label: 'Unsicher' },
  ];

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 hero-gradient opacity-50 pointer-events-none" />
      
      <div className="w-full max-w-lg mx-auto relative z-10 animate-enter">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <CalinessLogo size="lg" className="justify-center mb-6 md:mb-8" showText={true} />
          <h1 className="section-title text-3xl md:text-4xl font-bold mb-4 leading-tight">
            Longevity Score starten
          </h1>
          <p className="text-base md:text-lg text-text-secondary leading-relaxed max-w-md mx-auto">
            Bevor wir mit der Auswertung beginnen, benötigen wir dein aktuelles Alter.
          </p>
        </div>

        {/* Age Input Card */}
        <Card className="card-elegant hover-lift">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl md:text-2xl font-bold section-title">
              Dein Alter
            </CardTitle>
            <p className="text-text-muted text-sm md:text-base mt-2">
              Dies hilft uns, deinen Longevity Score präzise zu berechnen
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="number"
                  placeholder="z.B. 28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="text-center text-2xl md:text-3xl h-16 md:h-18 bg-darker-surface/60 border-border/50 focus:border-primary/50 text-text-primary font-semibold tracking-wide"
                  min="14"
                  max="99"
                  required
                />
                {error && (
                  <p className="text-destructive text-sm mt-3 text-center font-medium">{error}</p>
                )}
              </div>

              {/* Self-Assessment (Lifestyle-Check) - Optional */}
              <div className="bg-elevated-surface/50 rounded-xl p-4 border border-border/30">
                <p className="text-sm font-medium text-text-primary mb-3">
                  Wie fühlst du dich im Vergleich zu deinem Alter? <span className="text-text-muted">(optional)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {selfAssessmentOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelfAssessment(selfAssessment === option.value ? null : option.value)}
                      className={`px-3 py-2.5 text-sm rounded-lg border transition-all duration-200 ${
                        selfAssessment === option.value
                          ? 'bg-primary/20 border-primary/50 text-primary font-medium'
                          : 'bg-darker-surface/40 border-border/30 text-text-secondary hover:border-primary/30 hover:text-text-primary'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Diese Angabe fließt nicht in deinen Score ein, sondern dient nur der Einordnung.
                </p>
              </div>

              {/* GDPR Consent Checkbox */}
              <div className="bg-elevated-surface/50 rounded-xl p-4 border border-border/30">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    id="consent" 
                    checked={consentGiven}
                    onCheckedChange={(checked) => {
                      setConsentGiven(checked === true);
                      if (checked) setConsentError("");
                    }}
                    className="mt-1"
                  />
                  <label htmlFor="consent" className="text-sm text-text-secondary leading-relaxed cursor-pointer">
                    Ich willige ein, dass meine personenbezogenen Daten und gesundheitsbezogenen Angaben 
                    gemäß <Link to="/datenschutz" className="text-primary hover:underline">Datenschutzerklärung</Link> (Art. 6, 9 DSGVO) 
                    verarbeitet werden. Ich habe den <Link to="/medical-disclaimer" className="text-primary hover:underline">Medizinischen Hinweis</Link> gelesen 
                    und verstanden, dass es sich nicht um eine medizinische Diagnose handelt. Die Einwilligung kann jederzeit widerrufen werden.
                  </label>
                </div>
                {consentError && (
                  <p className="text-destructive text-sm mt-2 font-medium">{consentError}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full glow-neon flex items-center justify-center gap-2 text-base"
                size="lg"
              >
                Test starten
                <ChevronRight className="w-5 h-5" />
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-text-muted bg-elevated-surface/50 px-4 py-2.5 rounded-xl border border-border/30">
                <Shield className="w-4 h-4 text-primary" />
                <span>DSGVO-konform • Deine Daten sind sicher</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-8 md:mt-10 text-center">
          <p className="text-sm md:text-base text-text-muted leading-relaxed">
            Der Test dauert nur 2-3 Minuten und basiert auf 15 wissenschaftlich fundierten Fragen
          </p>
        </div>
      </div>
    </div>
  );
};