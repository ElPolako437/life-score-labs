import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Moon, Dumbbell, Droplets, Brain, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const GrundlagenGuide = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Helmet>
        <title>Grundlagen-Guide | Caliness</title>
        <meta name="description" content="Dein strukturierter Einstieg in die wichtigsten Stellschrauben für körperliches Gleichgewicht und nachhaltige Vitalität." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Print-hidden navigation */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Zurück</span>
          </Link>
          <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Als PDF speichern
          </Button>
        </div>
      </div>

      {/* Main Content - Optimized for printing */}
      <main className="min-h-screen bg-background text-foreground print:bg-white print:text-black">
        <div className="container mx-auto px-6 py-24 print:py-8 max-w-3xl">
          
          {/* Header */}
          <header className="mb-16 print:mb-10">
            <div className="flex items-center gap-3 mb-6 print:mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center print:border print:border-gray-300">
                <span className="text-primary font-bold text-xl print:text-black">C</span>
              </div>
              <span className="text-muted-foreground text-sm font-medium print:text-gray-600">Caliness Academy</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 print:text-3xl print:text-black">
              Grundlagen-Guide
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed print:text-gray-700 print:text-base">
              Dein strukturierter Einstieg in die wichtigsten Stellschrauben für körperliches Gleichgewicht und nachhaltige Vitalität.
            </p>
          </header>

          {/* Introduction */}
          <section className="mb-16 print:mb-10">
            <div className="p-6 rounded-2xl bg-card border border-border/50 print:border-gray-300 print:bg-gray-50">
              <h2 className="text-lg font-semibold mb-3 print:text-black">Bevor du beginnst</h2>
              <p className="text-muted-foreground leading-relaxed print:text-gray-700">
                Dieser Guide ist keine vollständige Anleitung – er ist ein Kompass. Er zeigt dir die fünf Bereiche, 
                die den größten Einfluss auf dein körperliches Gleichgewicht haben. Wähle einen Bereich, 
                der dich am meisten anspricht, und beginne dort. Kleine, konsistente Schritte führen zu nachhaltigen Veränderungen.
              </p>
            </div>
          </section>

          {/* Section 1: Sleep */}
          <section className="mb-12 print:mb-8 print:break-inside-avoid">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 print:border print:border-gray-300">
                <Moon className="w-5 h-5 text-primary print:text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 print:text-xl print:text-black">1. Schlaf als Fundament</h2>
                <p className="text-muted-foreground print:text-gray-600">Die wichtigste Regenerationsphase deines Körpers</p>
              </div>
            </div>
            
            <div className="ml-14 print:ml-12">
              <p className="text-muted-foreground mb-6 leading-relaxed print:text-gray-700">
                Schlaf ist der Zeitraum, in dem dein Körper repariert, regeneriert und konsolidiert. 
                Ohne ausreichend qualitativ hochwertigen Schlaf arbeiten alle anderen Systeme unter erschwerten Bedingungen.
              </p>
              
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground print:text-gray-600">Praktische Schritte</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Lege eine feste Schlafenszeit fest und halte sie auch am Wochenende ein (±30 Minuten).</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Reduziere Bildschirmnutzung 60 Minuten vor dem Schlaf. Nutze stattdessen ein Buch oder ruhige Musik.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Sorge für ein kühles, dunkles Schlafzimmer (18-19°C optimal).</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Vermeide Koffein nach 14 Uhr.</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 print:bg-gray-100 print:border-gray-300">
                <p className="text-sm text-muted-foreground print:text-gray-700">
                  <strong className="text-foreground print:text-black">Hebelpunkt:</strong> Die Konsistenz deiner Schlafenszeit ist wichtiger als die Dauer. 
                  Ein regelmäßiger Rhythmus stabilisiert deine innere Uhr nachhaltig.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Movement */}
          <section className="mb-12 print:mb-8 print:break-inside-avoid">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 print:border print:border-gray-300">
                <Dumbbell className="w-5 h-5 text-primary print:text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 print:text-xl print:text-black">2. Bewegung integrieren</h2>
                <p className="text-muted-foreground print:text-gray-600">Körperliche Aktivität als natürlicher Bestandteil</p>
              </div>
            </div>
            
            <div className="ml-14 print:ml-12">
              <p className="text-muted-foreground mb-6 leading-relaxed print:text-gray-700">
                Bewegung ist kein Luxus – sie ist eine biologische Notwendigkeit. Dein Körper wurde für Aktivität gebaut. 
                Ohne regelmäßige Bewegung verliert er schrittweise seine Funktionsfähigkeit.
              </p>
              
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground print:text-gray-600">Praktische Schritte</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Beginne mit 10-Minuten-Spaziergängen nach den Mahlzeiten – dreimal täglich.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Integriere Bewegung in den Alltag: Treppen statt Aufzug, Telefonate im Gehen.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Plane zwei feste Bewegungstermine pro Woche ein – wie einen wichtigen Termin.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Wähle eine Aktivität, die dir Freude macht – Konsistenz kommt vor Intensität.</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 print:bg-gray-100 print:border-gray-300">
                <p className="text-sm text-muted-foreground print:text-gray-700">
                  <strong className="text-foreground print:text-black">Hebelpunkt:</strong> Es geht nicht um Perfektion. 
                  20 Minuten moderate Bewegung an 5 Tagen pro Woche haben einen größeren Langzeiteffekt als gelegentliche intensive Trainingseinheiten.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Hydration */}
          <section className="mb-12 print:mb-8 print:break-inside-avoid">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 print:border print:border-gray-300">
                <Droplets className="w-5 h-5 text-primary print:text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 print:text-xl print:text-black">3. Hydration optimieren</h2>
                <p className="text-muted-foreground print:text-gray-600">Wasser als Grundlage aller Körperfunktionen</p>
              </div>
            </div>
            
            <div className="ml-14 print:ml-12">
              <p className="text-muted-foreground mb-6 leading-relaxed print:text-gray-700">
                Dein Körper besteht zu etwa 60% aus Wasser. Selbst leichte Dehydrierung beeinträchtigt kognitive Funktionen, 
                Energielevel und körperliche Leistungsfähigkeit.
              </p>
              
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground print:text-gray-600">Praktische Schritte</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Trinke direkt nach dem Aufwachen ein großes Glas Wasser (250-500ml).</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Stelle eine Wasserflasche sichtbar auf deinen Schreibtisch oder Arbeitsplatz.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Setze dir stündliche Erinnerungen, bis das Trinken zur Gewohnheit wird.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Ziel: mindestens 2 Liter pro Tag, bei Hitze oder Sport entsprechend mehr.</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 print:bg-gray-100 print:border-gray-300">
                <p className="text-sm text-muted-foreground print:text-gray-700">
                  <strong className="text-foreground print:text-black">Hebelpunkt:</strong> Durst ist bereits ein Zeichen von Dehydrierung. 
                  Trinke regelmäßig, bevor du Durst verspürst.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Stress */}
          <section className="mb-12 print:mb-8 print:break-inside-avoid">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 print:border print:border-gray-300">
                <Brain className="w-5 h-5 text-primary print:text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 print:text-xl print:text-black">4. Stress regulieren</h2>
                <p className="text-muted-foreground print:text-gray-600">Bewusste Erholung als Gegenpol zur Anspannung</p>
              </div>
            </div>
            
            <div className="ml-14 print:ml-12">
              <p className="text-muted-foreground mb-6 leading-relaxed print:text-gray-700">
                Chronischer Stress ist einer der größten Beschleuniger biologischer Alterungsprozesse. 
                Er beeinflusst Schlaf, Verdauung, Immunsystem und kognitive Funktionen. Aktive Stressregulation ist keine Schwäche – sie ist eine Investition.
              </p>
              
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground print:text-gray-600">Praktische Schritte</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Beginne mit 5 Minuten bewusster Atmung am Morgen oder Abend.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Plane täglich 15 Minuten für eine Aktivität, die dich entspannt (lesen, spazieren, Musik).</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Identifiziere deine größten Stressoren und überlege, welche du beeinflussen kannst.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Lerne, Nein zu sagen – Grenzen setzen ist Teil der Selbstfürsorge.</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 print:bg-gray-100 print:border-gray-300">
                <p className="text-sm text-muted-foreground print:text-gray-700">
                  <strong className="text-foreground print:text-black">Hebelpunkt:</strong> Kurze, regelmäßige Erholungsphasen sind effektiver als gelegentliche lange Pausen. 
                  5 Minuten Ruhe mehrmals täglich machen den Unterschied.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Routine */}
          <section className="mb-12 print:mb-8 print:break-inside-avoid">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 print:border print:border-gray-300">
                <Clock className="w-5 h-5 text-primary print:text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 print:text-xl print:text-black">5. Routinen etablieren</h2>
                <p className="text-muted-foreground print:text-gray-600">Struktur als Grundlage für nachhaltige Veränderung</p>
              </div>
            </div>
            
            <div className="ml-14 print:ml-12">
              <p className="text-muted-foreground mb-6 leading-relaxed print:text-gray-700">
                Einzelne gute Entscheidungen bringen wenig, wenn sie nicht wiederholt werden. 
                Routinen reduzieren den Entscheidungsaufwand und machen gesundes Verhalten zur Normalität.
              </p>
              
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground print:text-gray-600">Praktische Schritte</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Wähle eine einzige neue Gewohnheit und fokussiere dich 30 Tage darauf.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Verknüpfe die neue Gewohnheit mit einer bestehenden (z.B. "Nach dem Zähneputzen meditiere ich").</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Mache es dir so einfach wie möglich: Lege Sportkleidung bereit, stelle Wasser sichtbar hin.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 print:text-black" />
                    <span className="text-foreground print:text-black">Akzeptiere Rückschläge – sie sind Teil des Prozesses, nicht das Ende.</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 print:bg-gray-100 print:border-gray-300">
                <p className="text-sm text-muted-foreground print:text-gray-700">
                  <strong className="text-foreground print:text-black">Hebelpunkt:</strong> Konzentriere dich auf Systeme, nicht auf Ziele. 
                  Ein gutes System führt automatisch zu guten Ergebnissen.
                </p>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="mb-12 print:mb-8 print:break-inside-avoid">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center print:bg-gray-100 print:border-gray-300">
              <h2 className="text-2xl font-bold mb-4 print:text-xl print:text-black">Dein nächster Schritt</h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto print:text-gray-700">
                Wähle einen der fünf Bereiche und setze diese Woche eine konkrete Maßnahme um. 
                Kleine Schritte, konsequent wiederholt, führen zu nachhaltiger Veränderung.
              </p>
              <p className="text-sm text-muted-foreground print:text-gray-600">
                Wenn du dir Unterstützung bei der Umsetzung wünschst, vereinbare ein unverbindliches Orientierungsgespräch unter <strong className="text-foreground print:text-black">caliness-academy.de/termin</strong>
              </p>
            </div>
          </section>

          {/* Disclaimer */}
          <footer className="text-center print:break-inside-avoid">
            <div className="p-6 rounded-xl bg-muted/30 print:bg-gray-100">
              <p className="text-xs text-muted-foreground leading-relaxed print:text-gray-600">
                <strong>Hinweis:</strong> Dieser Guide dient ausschließlich der allgemeinen Lebensstil-Orientierung. 
                Er ersetzt keine medizinische Beratung, Diagnose oder professionelle Behandlung. 
                Bei gesundheitlichen Fragen oder Beschwerden wenden Sie sich bitte an einen qualifizierten Arzt oder Therapeuten.
              </p>
              <p className="text-xs text-muted-foreground mt-4 print:text-gray-500">
                © Caliness Academy · caliness-academy.de
              </p>
            </div>
          </footer>
        </div>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 1.5cm;
            size: A4;
          }
          body {
            font-size: 11pt;
            line-height: 1.4;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default GrundlagenGuide;
