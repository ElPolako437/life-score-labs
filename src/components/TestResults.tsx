import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalinessLogo } from "./CalinessLogo";
import { InstagramCTA } from "./InstagramCTA";
import { TestState, calculateBioAge, transitionText, scoringExplanation, legalDisclaimer, calculateLifestyleAge } from "@/types/bioage";
import { Mail, CheckCircle, ArrowRight, TrendingUp, AlertCircle, Zap, Info, Sparkles, Loader2, Heart, Calendar, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HealthTip {
  title: string;
  description: string;
}

interface TestResultsProps {
  testState: TestState;
  onRestart: () => void;
}

// Stage-specific configuration - simplified for Instagram-first flow
interface StageConfig {
  showAIInsights: boolean;
  tone: 'calming' | 'insightful' | 'strategic';
}

const getStageConfig = (profileId: string): StageConfig => {
  switch (profileId) {
    case 'foundation':
      return { showAIInsights: true, tone: 'calming' };
    case 'awakening':
      return { showAIInsights: true, tone: 'insightful' };
    case 'momentum':
      return { showAIInsights: true, tone: 'insightful' };
    case 'mastery':
      return { showAIInsights: true, tone: 'strategic' };
    default:
      return { showAIInsights: true, tone: 'insightful' };
  }
};

// Transition screen before showing results
const TransitionScreen = ({ onContinue, firstName }: { onContinue: () => void; firstName: string }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient opacity-50 pointer-events-none" />
      
      <div className="w-full max-w-xl mx-auto text-center relative z-10 animate-enter">
        <CalinessLogo size="md" className="justify-center mb-10" />
        
        <Card className="card-elegant">
          <CardContent className="p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 section-title">
              {transitionText.heading}
            </h2>
            
            <p className="text-lg text-text-secondary leading-relaxed mb-6">
              {firstName}, {transitionText.body.toLowerCase()}
            </p>
            
            <p className="text-base text-text-muted italic mb-10">
              {transitionText.encouragement}
            </p>

            <Button 
              onClick={onContinue}
              disabled={!isReady}
              className={`glow-neon px-8 ${!isReady ? 'opacity-50' : ''}`}
              size="lg"
            >
              {isReady ? 'Mein Profil ansehen' : 'Wird vorbereitet...'}
              {isReady && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Calming message for Stage A (foundation)
const CalmingMessage = ({ firstName }: { firstName: string }) => (
  <Card className="card-elegant mb-6 animate-enter border-l-4 border-orange-400/30" style={{ animationDelay: '200ms' }}>
    <CardContent className="p-6 md:p-8">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-orange-500/10">
          <Heart className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h4 className="font-semibold text-text-primary mb-3 text-lg">
            {firstName}, das ist ein ehrlicher Ausgangspunkt.
          </h4>
          <p className="text-text-secondary leading-relaxed mb-4">
            Viele Menschen befinden sich an diesem Punkt – und das ist nichts, wofür man sich schämen muss. 
            Die Tatsache, dass du diesen Test gemacht hast, zeigt bereits Bewusstsein und Bereitschaft zur Reflexion.
          </p>
          <p className="text-text-muted text-sm leading-relaxed">
            Wir haben einen Grundlagen-Guide erstellt, der dir ohne Druck oder Überforderung 
            einen ruhigen Einstieg ermöglicht. Keine To-Do-Listen, keine 30-Tage-Challenges – 
            nur Orientierung und Verständnis.
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const TestResults = ({ testState, onRestart }: TestResultsProps) => {
  const [showTransition, setShowTransition] = useState(true);
  const [emailSent, setEmailSent] = useState(false);
  const [healthTips, setHealthTips] = useState<HealthTip[]>([]);
  const [loadingTips, setLoadingTips] = useState(false);
  const [hasFetchedTips, setHasFetchedTips] = useState(false);
  
  // Newsletter 2-step opt-in state
  const [showNewsletterForm, setShowNewsletterForm] = useState(false);
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [syncingNewsletter, setSyncingNewsletter] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterError, setNewsletterError] = useState(false);
  
  const { toast } = useToast();
  
  const result = calculateBioAge(testState.answers, testState.userAge || 30);
  const { profile } = result;
  const stageConfig = getStageConfig(profile.id);

  // Calculate Lifestyle Age Estimation (purely derived from score, NOT affecting score)
  const lifestyleAge = calculateLifestyleAge(
    result.totalPoints,
    result.maxPoints,
    testState.userAge || 30,
    testState.selfAssessment
  );

  // Fallback tips based on profile (only used for stages with insights)
  const getFallbackTips = (profileId: string): HealthTip[] => {
    const fallbackTips: Record<string, HealthTip[]> = {
      awakening: [
        { title: "Muster der Gewohnheitsbildung", description: "Viele Menschen in dieser Phase bemerken, dass ihre Wahrnehmung für Körpersignale zunimmt. Diese erhöhte Sensibilität ist typisch für diese Entwicklungsphase." },
        { title: "Zwischen Wissen und Umsetzung", description: "Ein häufiges Muster ist der Übergang von reaktiven zu bewussten Entscheidungen. Der Unterschied liegt oft nicht im Wissen, sondern in der Verankerung." },
        { title: "Die Rolle der Konsistenz", description: "Dieses Ergebnis deutet darauf hin, dass sporadische Bemühungen möglicherweise durch kleinere, aber regelmäßigere Anpassungen ersetzt werden könnten." },
        { title: "Kontext bestimmt die Priorität", description: "Welcher dieser Faktoren am meisten zählt — und wie er in den Alltag passt — variiert stark von Person zu Person." }
      ],
      momentum: [
        { title: "Dynamik als Ressource", description: "Viele Menschen mit diesem Profil erleben Phasen, in denen Fortschritt sich beschleunigt. Ein häufiges Muster ist, dass Hebelpunkte sichtbarer werden." },
        { title: "Balance als Schlüsselfaktor", description: "Dieses Ergebnis zeigt oft, dass die Balance zwischen Belastung und Erholung entscheidend wird. Der Körper sucht nach einem neuen Gleichgewicht." },
        { title: "Feinabstimmung statt Revolution", description: "Ein möglicher Hebelbereich liegt in der Verfeinerung bestehender Gewohnheiten, nicht in deren Neuerfindung. Kleine Anpassungen können große Wirkung haben." },
        { title: "Persönlicher Kontext entscheidet", description: "Welcher dieser Faktoren am meisten zählt — und wie er in den Alltag passt — variiert stark von Person zu Person." }
      ],
      mastery: [
        { title: "Nachhaltigkeit als Prinzip", description: "Menschen mit diesem Profil haben bereits ein bemerkenswertes Fundament aufgebaut. Die Herausforderung liegt nun in der langfristigen Bewahrung und den diminishing returns." },
        { title: "Die Frage der blinden Flecken", description: "Ein häufiges Muster auf diesem Niveau ist, dass verbliebene Optimierungspotenziale oft in unerwarteten Bereichen liegen." },
        { title: "Strategische Periodisierung", description: "Dieses Ergebnis deutet auf die Möglichkeit hin, dass gezielte Variation nachhaltiger sein könnte als konstante Maximierung." },
        { title: "Weisheit der Balance", description: "Die Kunst liegt nicht mehr im Hinzufügen, sondern oft im bewussten Weglassen oder in der Priorisierung." }
      ]
    };
    return fallbackTips[profileId] || fallbackTips.momentum;
  };

  // Fetch AI-generated health tips when results are shown - only for eligible stages
  useEffect(() => {
    if (showTransition || hasFetchedTips || loadingTips || !stageConfig.showAIInsights) return;
    
    const fetchHealthTips = async () => {
      setLoadingTips(true);
      setHasFetchedTips(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-health-tips', {
          body: {
            profileId: profile.id,
            profileTitle: profile.title,
            totalPoints: result.totalPoints,
            maxPoints: result.maxPoints,
            insights: profile.insights,
            firstName: testState.userInfo?.firstName || 'Teilnehmer',
            userAge: testState.userAge || 30
          }
        });

        if (error || !data?.tips) {
          console.error('Error fetching health tips:', error);
          setHealthTips(getFallbackTips(profile.id));
          return;
        }

        if (Array.isArray(data.tips)) {
          setHealthTips(data.tips);
        } else {
          setHealthTips(getFallbackTips(profile.id));
        }
      } catch (err) {
        console.error('Failed to fetch health tips:', err);
        setHealthTips(getFallbackTips(profile.id));
      } finally {
        setLoadingTips(false);
      }
    };

    fetchHealthTips();
  }, [showTransition, hasFetchedTips, loadingTips, profile.id, stageConfig.showAIInsights]);

  const handleSendResults = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    setEmailSent(true);
  };

  // GDPR consent text for audit trail
  const CONSENT_VERSION = "2026-01";
  const CONSENT_TEXT = "Ja, ich möchte wöchentliche Longevity-Impulse per E-Mail erhalten und stimme der Verarbeitung meiner Daten gemäß Datenschutzerklärung zu.";
  
  // Handle 2-step newsletter opt-in confirmation (adds to list #2 only)
  const handleNewsletterSubmit = async () => {
    if (!newsletterConsent) return;
    
    setSyncingNewsletter(true);
    setNewsletterError(false);
    
    const email = testState.userInfo?.email;
    const consentTimestamp = new Date().toISOString();
    const consentUrl = window.location.href;
    
    try {
      // Update database with full GDPR consent audit trail
      if (email) {
        const consentData = {
          consent_email_marketing: true,
          consent_timestamp: consentTimestamp,
          consent_version: CONSENT_VERSION,
          consent_source: "bioage_results_page",
          consent_text: CONSENT_TEXT,
          consent_url: consentUrl,
        };
        
        await supabase
          .from('bioage_submissions')
          .update(consentData)
          .eq('email', email);
        
        await supabase
          .from('bio_age_results')
          .update(consentData)
          .eq('email', email);
      }
      
      // Sync to Brevo with newsletter opt-in = true (adds to list #2)
      const { error } = await supabase.functions.invoke('sync-brevo', {
        body: {
          email: email,
          firstname: testState.userInfo?.firstName || '',
          newsletterOptIn: true,  // This adds to list #2 (Newsletter)
        }
      });
      
      if (error) {
        console.error('Failed to sync to Brevo:', error);
        setNewsletterError(true);
      } else {
        setNewsletterSuccess(true);
      }
    } catch (err) {
      console.error('Newsletter sync error:', err);
      setNewsletterError(true);
    } finally {
      setSyncingNewsletter(false);
    }
  };

  const getProfileAccentColor = (profileId: string) => {
    switch (profileId) {
      case 'foundation': return 'text-orange-400 border-orange-400/30';
      case 'awakening': return 'text-yellow-400 border-yellow-400/30';
      case 'momentum': return 'text-blue-400 border-blue-400/30';
      case 'mastery': return 'text-primary border-primary/30';
      default: return 'text-primary border-primary/30';
    }
  };

  const firstName = testState.userInfo?.firstName || 'Teilnehmer';

  if (showTransition) {
    return <TransitionScreen onContinue={() => setShowTransition(false)} firstName={firstName} />;
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-60 pointer-events-none" />
        
        <div className="w-full max-w-2xl mx-auto text-center relative z-10 animate-enter">
          <CalinessLogo size="lg" className="justify-center mb-8 md:mb-10" />
          
          <Card className="card-elegant">
            <CardContent className="p-10 md:p-14">
              <div className="w-18 h-18 md:w-22 md:h-22 mx-auto mb-6 md:mb-8 rounded-full bg-gradient-glow flex items-center justify-center shadow-glow">
                <CheckCircle className="w-9 h-9 md:w-11 md:h-11 text-primary" strokeWidth={1.5} />
              </div>
              
              <h1 className="section-title text-2xl md:text-3xl font-bold mb-4 md:mb-5">
                Deine Anfrage ist eingegangen
              </h1>
              
              <p className="text-lg md:text-xl text-text-secondary mb-8 md:mb-10 leading-relaxed">
                Wir melden uns in Kürze bei{" "}
                <span className="text-primary font-semibold">
                  {testState.userInfo?.email}
                </span>
              </p>

              <div className="bg-elevated-surface/60 p-6 md:p-7 rounded-2xl mb-8 md:mb-10 border border-border/30">
                <h3 className="font-semibold mb-5 text-text-primary text-lg">Was dich erwartet:</h3>
                <div className="grid gap-4 text-sm text-text-muted text-left">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Persönliche Einordnung deines Profils</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Konkrete Empfehlungen für deinen nächsten Schritt</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Keine Verpflichtung – nur Orientierung</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" onClick={onRestart} className="w-full">
                Test erneut durchführen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark py-8 px-4 md:px-6 relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient opacity-50 pointer-events-none" />

      <div className="w-full max-w-3xl mx-auto relative z-10">
        <CalinessLogo size="md" className="justify-center mb-8" />
        
        {/* Profile Header */}
        <Card className="card-elegant mb-6 animate-enter">
          <CardHeader className="text-center pb-4">
            <p className="text-sm uppercase tracking-widest text-text-muted mb-2">Dein Ergebnis</p>
            <CardTitle className={`text-2xl md:text-3xl font-bold ${getProfileAccentColor(profile.id).split(' ')[0]}`}>
              {profile.title}
            </CardTitle>
            <p className="text-lg text-text-secondary mt-2">
              {profile.subtitle}
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-text-secondary leading-relaxed text-base md:text-lg max-w-2xl mx-auto">
              {profile.description}
            </p>
          </CardContent>
        </Card>

        {/* Instagram CTA - Top Position (highly visible after result) */}
        <InstagramCTA className="mb-6" animationDelay="50ms" />

        {/* Lifestyle Age Estimation - NEW SECTION */}
        <Card className="card-elegant mb-6 animate-enter" style={{ animationDelay: '50ms' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold text-text-primary">
                Lifestyle-Alter (Schätzung)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid gap-3">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-text-muted text-sm">Chronologisches Alter</span>
                <span className="text-text-primary font-semibold">{lifestyleAge.chronologicalAge} Jahre</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-text-muted text-sm">Lifestyle-Alter (Schätzung)</span>
                <span className="text-primary font-semibold">{lifestyleAge.lifestyleAgeMin}–{lifestyleAge.lifestyleAgeMax} Jahre</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-text-muted text-sm">Tendenz</span>
                <span className={`font-medium ${
                  lifestyleAge.tendencyLabel === 'tendenziell jünger' ? 'text-primary' :
                  lifestyleAge.tendencyLabel === 'tendenziell älter' ? 'text-orange-400' :
                  'text-text-secondary'
                }`}>
                  {lifestyleAge.tendencyLabel}
                </span>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-4 leading-relaxed">
              Orientierung auf Basis deiner Selbstauskunft – keine medizinische Diagnose.
            </p>
          </CardContent>
        </Card>

        {/* Scoring Methodology */}
        <Card className="card-elegant mb-6 animate-enter" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-muted italic">
                {scoringExplanation.intro} {scoringExplanation.methodology}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stage A: Calming Message (no AI insights, no call CTA) */}
        {profile.id === 'foundation' && <CalmingMessage firstName={firstName} />}

        {/* Insights - shown for all stages */}
        <div className="grid gap-4 mb-6">
          <Card className={`card-elegant border-l-4 ${getProfileAccentColor(profile.id).split(' ')[1]} animate-enter`} style={{ animationDelay: '200ms' }}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">Stabilisierender Faktor</h4>
                  <p className="text-text-secondary text-sm leading-relaxed">{profile.insights.stabilizing}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`card-elegant border-l-4 ${getProfileAccentColor(profile.id).split(' ')[1]} animate-enter`} style={{ animationDelay: '300ms' }}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">Limitierender Faktor</h4>
                  <p className="text-text-secondary text-sm leading-relaxed">{profile.insights.limiting}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`card-elegant border-l-4 ${getProfileAccentColor(profile.id).split(' ')[1]} animate-enter`} style={{ animationDelay: '400ms' }}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">Größter Hebel</h4>
                  <p className="text-text-secondary text-sm leading-relaxed">{profile.insights.leverage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personalized Insights - premium human language */}
        {stageConfig.showAIInsights && (
          <Card className="card-elegant mb-6 animate-enter" style={{ animationDelay: '450ms' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-glow">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold text-text-primary">
                  Vertiefte Einordnung
                </CardTitle>
              </div>
              <p className="text-sm text-text-muted mt-2">
                Muster und Zusammenhänge auf Basis deiner Antworten – als Orientierung, nicht als Anleitung
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingTips ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="ml-3 text-text-muted">Dein Profil wird eingeordnet...</span>
                </div>
              ) : healthTips.length > 0 ? (
                <div className="grid gap-4">
                  {healthTips.map((tip, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-xl bg-elevated-surface/60 border border-border/30 hover:border-primary/30 transition-colors"
                    >
                      <h4 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        {tip.title}
                      </h4>
                      <p className="text-text-secondary text-sm leading-relaxed pl-8">
                        {tip.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-center py-4">
                  Deine vertiefte Einordnung wird vorbereitet.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Email Confirmation - subtle */}
        <Card className="card-elegant mb-6 animate-enter" style={{ animationDelay: '500ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-text-muted">
              <Mail className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm">
                Deine Auswertung wird an <span className="font-semibold text-primary">{testState.userInfo?.email}</span> gesendet.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Newsletter Opt-in Card - Secondary CTA (kept but less prominent) */}
        <Card className="card-elegant mb-6 animate-enter border border-border/40 bg-background" style={{ animationDelay: '550ms' }}>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <p className="text-xs uppercase tracking-widest text-text-muted mb-2">Optional</p>
              <h3 className="text-base font-medium text-text-primary mb-2">
                Wöchentliche Longevity-Impulse
              </h3>
              <p className="text-sm text-text-muted leading-relaxed max-w-md mx-auto">
                Kurze Prioritäten & Routinen – 1–2×/Woche, jederzeit abmeldbar.
              </p>
            </div>
            
            <div className="text-center">
              <a
                href="https://5f7cea4e.sibforms.com/serve/MUIFAElF9JMOIPGGBIle3eDfBG9oGRHtFqOFgIMIJ4LC8FOItR9lAD_-IRgt6eD7G8WxnOP6mg4coXjoOpaUdN9KOhIE3yKnEewggOSj6vdSamk_kp92P95o0-OCn7Z-FBSLgMAbicAmmlMkoPAw47h8vAOZcbu2Rlh340PwtCsU4MrBEl2OYHABmXaQSgCK4jf3iM1ghGdAsu4RBg=="
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-border hover:border-primary/50 text-text-secondary hover:text-text-primary transition-all duration-300 px-6 py-2.5 text-sm font-medium rounded-lg"
              >
                <Send className="w-4 h-4" />
                Impulse abonnieren
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Instagram CTA - Bottom Position (reminder) */}
        <InstagramCTA className="mb-6" animationDelay="600ms" />

        {/* Legal Disclaimer */}
        <div className="text-center mb-6 animate-enter" style={{ animationDelay: '650ms' }}>
          <p className="text-xs text-text-muted leading-relaxed max-w-xl mx-auto">
            {legalDisclaimer}
          </p>
        </div>

        {/* Restart */}
        <div className="text-center animate-enter" style={{ animationDelay: '700ms' }}>
          <Button variant="ghost" onClick={onRestart} className="text-text-muted hover:text-text-primary">
            Test erneut durchführen
          </Button>
        </div>

        {/* Legal Footer */}
        <footer className="border-t border-border/30 py-6 mt-8">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link to="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
            <span>·</span>
            <Link to="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
            <span>·</span>
            <Link to="/nutzungsbedingungen" className="hover:text-foreground transition-colors">Nutzungsbedingungen</Link>
            <span>·</span>
            <Link to="/medical-disclaimer" className="hover:text-foreground transition-colors">Medizinischer Hinweis</Link>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            © {new Date().getFullYear()} Caliness Academy. Alle Rechte vorbehalten.
          </p>
        </footer>
      </div>
    </div>
  );
};
