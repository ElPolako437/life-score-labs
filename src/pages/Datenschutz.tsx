import { LegalFooter } from "@/components/LegalFooter";
import { CalinessLogo } from "@/components/CalinessLogo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Trash2, Mail, Server } from "lucide-react";
import { Link } from "react-router-dom";

const Datenschutz = () => {
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
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="hero-headline text-3xl md:text-4xl lg:text-5xl font-bold">
                Datenschutzerklärung
              </h1>
            </div>
            <p className="text-text-secondary text-lg">
              Gemäß Art. 13, 14 DSGVO – Stand: Dezember 2024
            </p>
          </div>

          <div className="space-y-8">
            {/* Section 1: Verantwortlicher */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">1. Verantwortlicher</h2>
                    <div className="text-text-secondary space-y-2">
                      <p><strong>Verantwortlicher im Sinne der DSGVO:</strong></p>
                      <p>Caliness Academy<br />
                      [Vollständige Adresse einfügen]<br />
                      E-Mail: datenschutz@caliness-academy.de</p>
                      <p className="mt-4">
                        <strong>Datenschutzbeauftragter:</strong><br />
                        Bei Fragen zum Datenschutz erreichen Sie uns unter: datenschutz@caliness-academy.de
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Erhobene Daten */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">2. Erhobene personenbezogene Daten</h2>
                    <div className="text-text-secondary space-y-4">
                      <p>Im Rahmen des biologischen Alterstests erheben wir folgende Daten:</p>
                      
                      <div className="bg-elevated-surface/50 rounded-lg p-4 border border-border/30">
                        <h3 className="font-semibold text-text-primary mb-2">Allgemeine personenbezogene Daten:</h3>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Vorname</li>
                          <li>E-Mail-Adresse</li>
                          <li>Chronologisches Alter</li>
                        </ul>
                      </div>
                      
                      <div className="bg-elevated-surface/50 rounded-lg p-4 border border-border/30">
                        <h3 className="font-semibold text-text-primary mb-2">Gesundheitsbezogene Daten (Art. 9 DSGVO):</h3>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Angaben zu Lebensstilgewohnheiten (Bewegung, Ernährung, Schlaf)</li>
                          <li>Selbsteinschätzungen zu Stresslevel und mentalem Wohlbefinden</li>
                          <li>Angaben zu Rauch- und Alkoholkonsum</li>
                          <li>Allgemeine Gesundheitsindikatoren</li>
                        </ul>
                        <p className="mt-3 text-sm italic">
                          Diese Daten gelten als besondere Kategorien personenbezogener Daten gemäß Art. 9 Abs. 1 DSGVO 
                          und werden nur mit Ihrer ausdrücklichen Einwilligung verarbeitet.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Zweck der Verarbeitung */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Server className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">3. Zweck und Rechtsgrundlage der Datenverarbeitung</h2>
                    <div className="text-text-secondary space-y-4">
                      <p><strong>Zwecke der Verarbeitung:</strong></p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Berechnung und Bereitstellung Ihres geschätzten biologischen Alters</li>
                        <li>Zusendung der personalisierten Testergebnisse per E-Mail</li>
                        <li>Bereitstellung allgemeiner Informationen zur Gesundheitsoptimierung</li>
                        <li>Möglichkeit zur Kontaktaufnahme für ein unverbindliches Beratungsgespräch (nur auf Ihren Wunsch)</li>
                      </ul>
                      
                      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 mt-4">
                        <h3 className="font-semibold text-text-primary mb-2">Rechtsgrundlagen gemäß DSGVO:</h3>
                        <ul className="space-y-2">
                          <li><strong>Art. 6 Abs. 1 lit. a DSGVO:</strong> Ihre Einwilligung für die Verarbeitung allgemeiner personenbezogener Daten</li>
                          <li><strong>Art. 9 Abs. 2 lit. a DSGVO:</strong> Ihre ausdrückliche Einwilligung für die Verarbeitung gesundheitsbezogener Daten</li>
                          <li><strong>Art. 6 Abs. 1 lit. f DSGVO:</strong> Berechtigtes Interesse für technisch notwendige Verarbeitungen (z.B. Server-Logs)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Speicherdauer */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">4. Speicherdauer und Löschung</h2>
                    <div className="text-text-secondary space-y-4">
                      <p>Ihre personenbezogenen Daten werden nur so lange gespeichert, wie es für die genannten Zwecke erforderlich ist:</p>
                      
                      <ul className="list-disc list-inside space-y-2">
                        <li><strong>Testergebnisse:</strong> 90 Tage nach Durchführung des Tests, sofern Sie nicht um frühere Löschung bitten</li>
                        <li><strong>E-Mail-Adresse:</strong> Bis zum Widerruf Ihrer Einwilligung oder maximal 12 Monate</li>
                        <li><strong>Server-Logs:</strong> 7 Tage (technisch bedingt)</li>
                      </ul>
                      
                      <div className="bg-elevated-surface/50 rounded-lg p-4 border border-border/30 mt-4">
                        <p className="font-semibold text-text-primary">Recht auf Löschung:</p>
                        <p className="mt-2">
                          Sie können jederzeit die sofortige Löschung Ihrer Daten verlangen. 
                          Senden Sie dazu eine E-Mail an: <a href="mailto:datenschutz@caliness-academy.de" className="text-primary hover:underline">datenschutz@caliness-academy.de</a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Ihre Rechte */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">5. Ihre Rechte als betroffene Person</h2>
                    <div className="text-text-secondary space-y-4">
                      <p>Sie haben gemäß DSGVO folgende Rechte:</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-elevated-surface/50 rounded-lg p-4 border border-border/30">
                          <h3 className="font-semibold text-text-primary mb-2">Auskunftsrecht (Art. 15)</h3>
                          <p className="text-sm">Recht auf Bestätigung und Auskunft über Ihre gespeicherten Daten</p>
                        </div>
                        <div className="bg-elevated-surface/50 rounded-lg p-4 border border-border/30">
                          <h3 className="font-semibold text-text-primary mb-2">Berichtigungsrecht (Art. 16)</h3>
                          <p className="text-sm">Recht auf Korrektur unrichtiger Daten</p>
                        </div>
                        <div className="bg-elevated-surface/50 rounded-lg p-4 border border-border/30">
                          <h3 className="font-semibold text-text-primary mb-2">Löschungsrecht (Art. 17)</h3>
                          <p className="text-sm">Recht auf Löschung Ihrer personenbezogenen Daten</p>
                        </div>
                        <div className="bg-elevated-surface/50 rounded-lg p-4 border border-border/30">
                          <h3 className="font-semibold text-text-primary mb-2">Einschränkung (Art. 18)</h3>
                          <p className="text-sm">Recht auf Einschränkung der Verarbeitung</p>
                        </div>
                        <div className="bg-elevated-surface/50 rounded-lg p-4 border border-border/30">
                          <h3 className="font-semibold text-text-primary mb-2">Datenübertragbarkeit (Art. 20)</h3>
                          <p className="text-sm">Recht, Ihre Daten in einem gängigen Format zu erhalten</p>
                        </div>
                        <div className="bg-elevated-surface/50 rounded-lg p-4 border border-border/30">
                          <h3 className="font-semibold text-text-primary mb-2">Widerspruchsrecht (Art. 21)</h3>
                          <p className="text-sm">Recht auf Widerspruch gegen die Verarbeitung</p>
                        </div>
                      </div>
                      
                      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 mt-4">
                        <h3 className="font-semibold text-text-primary mb-2">Widerruf der Einwilligung</h3>
                        <p>
                          Sie können Ihre Einwilligung zur Datenverarbeitung <strong>jederzeit und ohne Angabe von Gründen</strong> widerrufen. 
                          Der Widerruf berührt nicht die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung. 
                          Kontaktieren Sie uns unter: <a href="mailto:datenschutz@caliness-academy.de" className="text-primary hover:underline">datenschutz@caliness-academy.de</a>
                        </p>
                      </div>
                      
                      <div className="bg-elevated-surface/50 rounded-lg p-4 border border-border/30">
                        <h3 className="font-semibold text-text-primary mb-2">Beschwerderecht</h3>
                        <p>
                          Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren, 
                          insbesondere in dem Mitgliedstaat Ihres gewöhnlichen Aufenthaltsortes (Art. 77 DSGVO).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 6: Datensicherheit */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="section-title text-xl md:text-2xl font-bold mb-4">6. Technische und organisatorische Maßnahmen</h2>
                    <div className="text-text-secondary space-y-4">
                      <p>Wir setzen umfassende Sicherheitsmaßnahmen zum Schutz Ihrer Daten ein:</p>
                      
                      <ul className="list-disc list-inside space-y-2">
                        <li><strong>SSL/TLS-Verschlüsselung:</strong> Alle Datenübertragungen erfolgen verschlüsselt</li>
                        <li><strong>Zugangsbeschränkungen:</strong> Nur autorisiertes Personal hat Zugang zu personenbezogenen Daten</li>
                        <li><strong>Sichere Server:</strong> Hosting in der Europäischen Union mit modernen Sicherheitsstandards</li>
                        <li><strong>Regelmäßige Sicherheitsupdates:</strong> Kontinuierliche Aktualisierung unserer Systeme</li>
                        <li><strong>Datensparsamkeit:</strong> Wir erheben nur die für den Dienst notwendigen Daten</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 7: Minderjährige */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <h2 className="section-title text-xl md:text-2xl font-bold mb-4">7. Minderjährige und Altersanforderungen</h2>
                <div className="text-text-secondary space-y-4">
                  <p>
                    Dieser Test richtet sich ausschließlich an <strong>Personen ab 16 Jahren</strong>. 
                    Personen unter 16 Jahren dürfen den Test nur mit ausdrücklicher Einwilligung eines Erziehungsberechtigten durchführen.
                  </p>
                  <p>
                    Gemäß Art. 8 DSGVO ist die Einwilligung eines Kindes unter 16 Jahren nur rechtmäßig, 
                    wenn sie vom Träger der elterlichen Verantwortung erteilt oder genehmigt wurde.
                  </p>
                  <p>
                    Bei der Eingabe Ihres Alters wird geprüft, ob Sie die Altersanforderung erfüllen.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 8: Drittlandtransfers */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <h2 className="section-title text-xl md:text-2xl font-bold mb-4">8. Datenübermittlung und Drittlandsübermittlung</h2>
                <div className="text-text-secondary space-y-4">
                  <p>
                    Ihre Daten werden grundsätzlich nur innerhalb der Europäischen Union (EU) bzw. 
                    des Europäischen Wirtschaftsraums (EWR) verarbeitet.
                  </p>
                  <p>
                    Für den E-Mail-Versand nutzen wir Resend, einen Dienst der unter Einhaltung der DSGVO-Anforderungen operiert. 
                    Sollte eine Übermittlung in Drittländer erfolgen, geschieht dies nur unter Einhaltung der 
                    gesetzlichen Voraussetzungen (z.B. Standardvertragsklauseln gemäß Art. 46 DSGVO).
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 9: Änderungen */}
            <Card className="card-elegant">
              <CardContent className="p-6 md:p-8">
                <h2 className="section-title text-xl md:text-2xl font-bold mb-4">9. Änderungen dieser Datenschutzerklärung</h2>
                <div className="text-text-secondary">
                  <p>
                    Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslagen oder 
                    bei Änderungen des Dienstes anzupassen. Die jeweils aktuelle Fassung gilt für Ihre Nutzung.
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

export default Datenschutz;
