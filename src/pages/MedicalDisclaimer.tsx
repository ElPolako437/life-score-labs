import { LegalFooter } from "@/components/LegalFooter";
import { CalinessLogo } from "@/components/CalinessLogo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Stethoscope, FileText, Scale, Info } from "lucide-react";
import { Link } from "react-router-dom";

const MedicalDisclaimer = () => {
  return (
    <div className="min-h-screen bg-gradient-dark relative">
      <div className="absolute inset-0 hero-gradient opacity-40 pointer-events-none" />
      
      {/* Header */}
      <header className="brand-header relative z-50 py-6">
        <div className="max-w-5xl mx-auto px-5 md:px-8 flex justify-between items-center">
          <Link to="/">
            <CalinessLogo size="md" showText={true} />
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-5 md:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Stethoscope className="w-8 h-8 text-primary" />
              <h1 className="hero-headline text-3xl md:text-4xl lg:text-5xl font-bold">
                Medizinischer Hinweis
              </h1>
            </div>
            <p className="text-text-secondary text-lg">
              Wichtige Informationen zur Nutzung des Longevity Score
            </p>
          </div>

          <div className="space-y-8">
            {/* Important Notice Banner */}
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-destructive mb-3">Wichtiger Hinweis</h2>
                  <p className="text-text-secondary leading-relaxed">
                    Der Longevity Score der Caliness Academy ist <strong>kein medizinisches Produkt</strong>, 
                    <strong>kein Diagnoseinstrument</strong> und <strong>keine Grundlage für medizinische Entscheidungen</strong>. 
                    Die Ergebnisse dienen ausschließlich der allgemeinen Information und Selbstreflexion.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: Kein Medizinprodukt */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">1. Kein Medizinprodukt</h2>
                    <div className="text-text-secondary space-y-4">
                      <p>
                        Dieser Online-Test ist <strong>kein Medizinprodukt</strong> im Sinne der EU-Medizinprodukteverordnung (MDR 2017/745). 
                        Er wurde nicht als Medizinprodukt zertifiziert oder zugelassen und erfüllt nicht die Anforderungen an 
                        medizinische Diagnosegeräte.
                      </p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Es handelt sich um einen Selbsteinschätzungs-Fragebogen</li>
                        <li>Es werden keine medizinischen Messungen durchgeführt</li>
                        <li>Die Ergebnisse basieren auf Ihren subjektiven Angaben</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Keine Diagnose */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">2. Keine medizinische Diagnose</h2>
                    <div className="text-text-secondary space-y-4">
                      <p>
                        Die Berechnung Ihres "biologischen Alters" stellt <strong>keine medizinische Diagnose</strong> dar. 
                        Der Test kann und darf nicht:
                      </p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Krankheiten erkennen, diagnostizieren oder ausschließen</li>
                        <li>Den Gesundheitszustand medizinisch bewerten</li>
                        <li>Medizinische Untersuchungen, Laboranalysen oder ärztliche Konsultationen ersetzen</li>
                        <li>Therapieempfehlungen oder Behandlungsanleitungen geben</li>
                      </ul>
                      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 mt-4">
                        <p className="font-medium">
                          <strong>Bei gesundheitlichen Beschwerden oder Fragen wenden Sie sich bitte immer an qualifizierte 
                          medizinische Fachkräfte wie Ärzte oder Therapeuten.</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Informations- und Bildungszweck */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">3. Zweck: Information und Bildung</h2>
                    <div className="text-text-secondary space-y-4">
                      <p>
                        Der Longevity Score dient ausschließlich folgenden Zwecken:
                      </p>
                      <ul className="list-disc list-inside space-y-2">
                        <li><strong>Sensibilisierung:</strong> Bewusstsein für die Bedeutung eines gesunden Lebensstils schaffen</li>
                        <li><strong>Selbstreflexion:</strong> Anregung zur Reflexion über die eigenen Lebensgewohnheiten</li>
                        <li><strong>Allgemeine Information:</strong> Vermittlung von allgemeinen Informationen zu Gesundheitsthemen</li>
                        <li><strong>Unterhaltung:</strong> Spielerische Auseinandersetzung mit dem Thema Langlebigkeit und Vitalität</li>
                      </ul>
                      <p className="mt-4">
                        Die berechneten Ergebnisse sind <strong>Schätzungen</strong> auf Basis Ihrer Selbstangaben und 
                        erheben keinen Anspruch auf wissenschaftliche oder medizinische Genauigkeit.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Haftungsausschluss */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Scale className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">4. Haftungsausschluss</h2>
                    <div className="text-text-secondary space-y-4">
                      <p>
                        Die Caliness Academy übernimmt <strong>keine Haftung</strong> für:
                      </p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Entscheidungen, die auf Grundlage der Testergebnisse getroffen werden</li>
                        <li>Gesundheitliche Folgen durch Handlungen oder Unterlassungen basierend auf den Ergebnissen</li>
                        <li>Die Richtigkeit, Vollständigkeit oder Aktualität der bereitgestellten Informationen</li>
                        <li>Schäden jeglicher Art, die durch die Nutzung des Tests entstehen könnten</li>
                      </ul>
                      <div className="bg-elevated-surface/50 rounded-lg p-4 border border-border/30 mt-4">
                        <p>
                          Die Nutzung des Tests erfolgt <strong>auf eigene Verantwortung</strong>. 
                          Der Test ersetzt in keinem Fall die Konsultation qualifizierter Gesundheitsexperten.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Professionelle Beratung */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <h2 className="section-title text-xl md:text-2xl font-bold mb-4">5. Empfehlung: Professionelle Beratung</h2>
                <div className="text-text-secondary space-y-4">
                  <p>
                    Wir empfehlen ausdrücklich:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Regelmäßige ärztliche Vorsorgeuntersuchungen wahrzunehmen</li>
                    <li>Bei gesundheitlichen Fragen oder Beschwerden medizinische Fachkräfte zu konsultieren</li>
                    <li>Lebensstiländerungen nur nach Rücksprache mit qualifizierten Experten vorzunehmen</li>
                    <li>Die Ergebnisse dieses Tests nicht als Grundlage für medizinische Entscheidungen zu verwenden</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Section 6: Regulatorische Konformität */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <h2 className="section-title text-xl md:text-2xl font-bold mb-4">6. Regulatorische Einordnung</h2>
                <div className="text-text-secondary space-y-4">
                  <p>
                    Dieser Test fällt <strong>nicht</strong> unter die EU-Medizinprodukteverordnung (MDR), da er:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Keinen diagnostischen oder therapeutischen Zweck verfolgt</li>
                    <li>Keine physiologischen Prozesse misst oder beeinflusst</li>
                    <li>Keine medizinischen Daten erfasst oder analysiert</li>
                    <li>Ausschließlich zu Informations- und Bildungszwecken dient</li>
                  </ul>
                  <p className="mt-4">
                    Es handelt sich um ein <strong>Lifestyle- und Wellness-Angebot</strong> ohne medizinischen Anspruch.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Final Notice */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 md:p-8 text-center">
              <p className="text-text-secondary leading-relaxed">
                Durch die Nutzung dieses Tests bestätigen Sie, dass Sie diesen medizinischen Hinweis 
                gelesen und verstanden haben und dass Sie die Ergebnisse entsprechend einordnen.
              </p>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center mt-12">
            <Link to="/">
              <Button variant="outline" size="lg" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Zurück zur Startseite
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <LegalFooter />
    </div>
  );
};

export default MedicalDisclaimer;
