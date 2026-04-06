import { LegalFooter } from "@/components/LegalFooter";
import { CalinessLogo } from "@/components/CalinessLogo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Users, AlertCircle, Scale, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const Nutzungsbedingungen = () => {
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
              <FileText className="w-8 h-8 text-primary" />
              <h1 className="hero-headline text-3xl md:text-4xl lg:text-5xl font-bold">
                Nutzungsbedingungen
              </h1>
            </div>
            <p className="text-text-secondary text-lg">
              Allgemeine Geschäftsbedingungen für den Longevity Score – Stand: Dezember 2024
            </p>
          </div>

          <div className="space-y-8">
            {/* Section 1: Geltungsbereich */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">1. Geltungsbereich</h2>
                    <div className="text-text-secondary space-y-4">
                      <p>
                        Diese Nutzungsbedingungen gelten für die Nutzung des biologischen Alterstests 
                        auf bio.caliness-academy.de (nachfolgend "Dienst"), betrieben von:
                      </p>
                      <div className="bg-elevated-surface/50 rounded-lg p-4 border border-border/30">
                        <p>
                          <strong>Caliness Academy</strong><br />
                          [Vollständige Adresse einfügen]<br />
                          E-Mail: info@caliness-academy.de
                        </p>
                      </div>
                      <p>
                        Mit der Nutzung des Dienstes erklären Sie sich mit diesen Nutzungsbedingungen einverstanden.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Beschreibung des Dienstes */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">2. Beschreibung des Dienstes</h2>
                    <div className="text-text-secondary space-y-4">
                      <p>
                        Der Longevity Score ist ein kostenloser Online-Fragebogen, der auf Basis 
                        Ihrer Selbstangaben zu Lebensstil und Gesundheitsgewohnheiten eine Schätzung 
                        Ihrer Vitalität und Langlebigkeit berechnet.
                      </p>
                      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                        <p className="font-medium">
                          <strong>Wichtig:</strong> Der Dienst dient ausschließlich zu Informations- und Unterhaltungszwecken. 
                          Er stellt keine medizinische Leistung dar. Siehe hierzu unseren{" "}
                          <Link to="/medical-disclaimer" className="text-primary hover:underline">
                            Medizinischen Hinweis
                          </Link>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Teilnahmeberechtigung */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">3. Teilnahmeberechtigung und Altersanforderung</h2>
                    <div className="text-text-secondary space-y-4">
                      <p>
                        Die Nutzung des Dienstes ist <strong>Personen ab 16 Jahren</strong> gestattet.
                      </p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Personen unter 16 Jahren benötigen die Einwilligung eines Erziehungsberechtigten (Art. 8 DSGVO)</li>
                        <li>Mit der Angabe Ihres Alters bestätigen Sie, dass Sie die Altersanforderung erfüllen</li>
                        <li>Die Caliness Academy behält sich vor, die Altersberechtigung zu überprüfen</li>
                      </ul>
                      <div className="bg-elevated-surface/50 rounded-lg p-4 border border-border/30 mt-4">
                        <p>
                          <strong>Freiwilligkeit:</strong> Die Teilnahme am Test ist vollständig freiwillig. 
                          Sie können den Test jederzeit abbrechen, ohne dass Ihnen dadurch Nachteile entstehen.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Einwilligung */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Scale className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">4. Einwilligung zur Datenverarbeitung</h2>
                    <div className="text-text-secondary space-y-4">
                      <p>
                        Vor dem Start des Tests werden Sie um Ihre ausdrückliche Einwilligung zur Verarbeitung 
                        Ihrer personenbezogenen und gesundheitsbezogenen Daten gebeten.
                      </p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Die Einwilligung erfolgt durch aktives Ankreuzen einer Checkbox</li>
                        <li>Ohne Einwilligung ist die Nutzung des Tests nicht möglich</li>
                        <li>Die Einwilligung kann jederzeit widerrufen werden</li>
                      </ul>
                      <p className="mt-4">
                        Ausführliche Informationen finden Sie in unserer{" "}
                        <Link to="/datenschutz" className="text-primary hover:underline">
                          Datenschutzerklärung
                        </Link>.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Nutzungsrechte */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <h2 className="section-title text-xl md:text-2xl font-bold mb-4">5. Nutzungsrechte und geistiges Eigentum</h2>
                <div className="text-text-secondary space-y-4">
                  <p>
                    Alle Inhalte des Dienstes (Texte, Grafiken, Logos, Software) sind urheberrechtlich 
                    geschützt und Eigentum der Caliness Academy oder lizenziert.
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Die Nutzung ist nur für private, nicht-kommerzielle Zwecke gestattet</li>
                    <li>Eine Vervielfältigung, Verbreitung oder öffentliche Wiedergabe ist ohne schriftliche Genehmigung untersagt</li>
                    <li>Das Caliness Academy Logo und die Marke sind geschützt</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Section 6: Pflichten des Nutzers */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">6. Pflichten des Nutzers</h2>
                    <div className="text-text-secondary space-y-4">
                      <p>Als Nutzer verpflichten Sie sich:</p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Wahre und korrekte Angaben zu machen</li>
                        <li>Den Dienst nicht zu missbrauchen oder zu manipulieren</li>
                        <li>Keine automatisierten Zugriffe (Bots, Scraper) zu verwenden</li>
                        <li>Die Rechte Dritter zu respektieren</li>
                        <li>Den Dienst nicht für illegale Zwecke zu nutzen</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 7: Haftungsbeschränkung */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Scale className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">7. Haftungsbeschränkung</h2>
                    <div className="text-text-secondary space-y-4">
                      <p>
                        Die Caliness Academy haftet nur für Schäden, die auf Vorsatz oder grobe Fahrlässigkeit 
                        zurückzuführen sind.
                      </p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Die Haftung für leichte Fahrlässigkeit ist ausgeschlossen, soweit gesetzlich zulässig</li>
                        <li>Keine Haftung für die Richtigkeit der Testergebnisse</li>
                        <li>Keine Haftung für Entscheidungen, die auf Basis der Ergebnisse getroffen werden</li>
                        <li>Keine Haftung für temporäre Nichtverfügbarkeit des Dienstes</li>
                      </ul>
                      <div className="bg-elevated-surface/50 rounded-lg p-4 border border-border/30 mt-4">
                        <p>
                          Bitte beachten Sie unseren{" "}
                          <Link to="/medical-disclaimer" className="text-primary hover:underline">
                            Medizinischen Hinweis
                          </Link>{" "}
                          für wichtige Informationen zur Einordnung der Testergebnisse.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 8: Verfügbarkeit */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">8. Verfügbarkeit und Änderungen</h2>
                    <div className="text-text-secondary space-y-4">
                      <p>
                        Die Caliness Academy bemüht sich um eine hohe Verfügbarkeit des Dienstes, 
                        kann diese jedoch nicht garantieren.
                      </p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Der Dienst kann jederzeit geändert, eingeschränkt oder eingestellt werden</li>
                        <li>Wartungsarbeiten können zu temporären Ausfällen führen</li>
                        <li>Änderungen der Nutzungsbedingungen werden auf dieser Seite veröffentlicht</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 9: Anwendbares Recht */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <h2 className="section-title text-xl md:text-2xl font-bold mb-4">9. Anwendbares Recht und Gerichtsstand</h2>
                <div className="text-text-secondary space-y-4">
                  <p>
                    Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
                  </p>
                  <p>
                    Für Streitigkeiten mit Verbrauchern gilt der Gerichtsstand gemäß den gesetzlichen Bestimmungen. 
                    Für Unternehmer ist der Gerichtsstand der Sitz der Caliness Academy.
                  </p>
                  <div className="bg-elevated-surface/50 rounded-lg p-4 border border-border/30 mt-4">
                    <p>
                      <strong>Online-Streitbeilegung:</strong> Die Europäische Kommission stellt eine Plattform 
                      zur Online-Streitbeilegung bereit:{" "}
                      <a 
                        href="https://ec.europa.eu/consumers/odr" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        https://ec.europa.eu/consumers/odr
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 10: Salvatorische Klausel */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <h2 className="section-title text-xl md:text-2xl font-bold mb-4">10. Salvatorische Klausel</h2>
                <div className="text-text-secondary">
                  <p>
                    Sollten einzelne Bestimmungen dieser Nutzungsbedingungen unwirksam sein oder werden, 
                    bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. An die Stelle der 
                    unwirksamen Bestimmung tritt eine wirksame Regelung, die dem wirtschaftlichen 
                    Zweck der unwirksamen Bestimmung am nächsten kommt.
                  </p>
                  <p className="mt-4 text-sm italic">
                    Letzte Aktualisierung: Dezember 2024
                  </p>
                </div>
              </CardContent>
            </Card>
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

export default Nutzungsbedingungen;
