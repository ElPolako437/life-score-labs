import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Trash2, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <div className="p-6 rounded-2xl border border-border/40 bg-card/60">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h2 className="font-outfit text-lg font-bold text-foreground">{title}</h2>
    </div>
    <div className="text-sm text-muted-foreground/80 leading-relaxed space-y-3">
      {children}
    </div>
  </div>
);

const Datenschutz = () => {
  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-sm mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/">
            <button className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              ← Zurück
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="font-outfit text-2xl font-bold text-foreground">Datenschutz</h1>
        </div>
        <p className="text-xs text-muted-foreground/60 mb-8">
          Gemäß Art. 13 DSGVO — Stand: April 2026
        </p>

        <div className="space-y-4">

          <Section icon={Mail} title="1. Verantwortlicher">
            <p><strong className="text-foreground">Caliness Academy</strong><br />
            David Gogulla<br />
            Rudolf Harbig Weg 57<br />
            48149 Münster<br />
            E-Mail: <a href="mailto:hi@caliness.de" className="text-primary hover:underline">hi@caliness.de</a>
            </p>
          </Section>

          <Section icon={Eye} title="2. Welche Daten wir verarbeiten">
            <p>Der CALINESS 7-Tage Reset verarbeitet ausschließlich Daten, die du selbst eingibst:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Dein persönliches Ziel und deine aktuelle Hürde (Onboarding)</li>
              <li>Tägliche Aufgaben-Fortschritte und Check-in Bewertungen</li>
              <li>Optionale Notizen zu einzelnen Tagen</li>
              <li>Selbsteinschätzungen zur Reflexion (Energie, Schlaf, Wohlbefinden)</li>
            </ul>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mt-2">
              <p className="font-medium text-foreground">Alle Daten bleiben auf deinem Gerät.</p>
              <p className="mt-1">Es gibt keinen Server, keine Datenbank, keine Cloud. Alle Informationen werden ausschließlich im lokalen Speicher deines Browsers (localStorage) gespeichert. Wir haben keinen Zugriff darauf.</p>
            </div>
          </Section>

          <Section icon={Lock} title="3. Rechtsgrundlage">
            <p>Die Verarbeitung erfolgt auf Basis deiner Einwilligung gemäß <strong className="text-foreground">Art. 6 Abs. 1 lit. a DSGVO</strong>, die du durch die aktive Nutzung der App erteilst.</p>
            <p>Selbsteinschätzungen zu Wohlbefinden und Schlaf können als gesundheitsbezogene Daten im Sinne von Art. 9 DSGVO eingestuft werden. Da diese Daten ausschließlich lokal auf deinem Gerät gespeichert werden und wir keinerlei Zugriff darauf haben, findet keine Übermittlung oder externe Verarbeitung statt.</p>
          </Section>

          <Section icon={Trash2} title="4. Speicherdauer und Löschung">
            <p>Deine Daten verbleiben so lange im lokalen Speicher deines Geräts, bis du sie selbst löschst.</p>
            <p><strong className="text-foreground">Daten löschen:</strong> Nutze die Funktion "Reset wiederholen" in der App — sie löscht alle gespeicherten Daten vollständig. Alternativ kannst du den Browser-Verlauf und Website-Daten in deinen Browser-Einstellungen löschen.</p>
            <p>Da wir keine Daten erhalten, können wir auf Anfrage keine Löschung auf Servern durchführen — es gibt keine.</p>
          </Section>

          <Section icon={Shield} title="5. Keine Drittanbieter, kein Tracking">
            <p>Die App verwendet:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Keine Analytics (kein Google Analytics, kein Plausible, nichts)</li>
              <li>Keine Werbe-Tracker oder Pixel</li>
              <li>Keine externen Schriften — Fonts sind lokal eingebunden</li>
              <li>Keine Cookies</li>
            </ul>
            <p className="mt-1">Es werden keine Daten an Dritte übermittelt.</p>
          </Section>

          <Section icon={Lock} title="6. Deine Rechte">
            <p>Gemäß DSGVO hast du das Recht auf:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Auskunft über deine Daten (Art. 15)</li>
              <li>Berichtigung (Art. 16)</li>
              <li>Löschung (Art. 17) — jederzeit über die App selbst möglich</li>
              <li>Einschränkung der Verarbeitung (Art. 18)</li>
              <li>Widerspruch (Art. 21)</li>
              <li>Beschwerde bei einer Aufsichtsbehörde (Art. 77)</li>
            </ul>
            <p className="mt-1">
              Für Anfragen: <a href="mailto:hi@caliness.de" className="text-primary hover:underline">hi@caliness.de</a>
            </p>
          </Section>

          <Section icon={Mail} title="7. Kontakt bei Datenschutzfragen">
            <p>Bei Fragen zum Datenschutz erreichst du uns unter:<br />
            <a href="mailto:hi@caliness.de" className="text-primary hover:underline">hi@caliness.de</a>
            </p>
            <p className="text-xs text-muted-foreground/50 mt-2">
              Hinweis: Diese Datenschutzerklärung wurde nach bestem Wissen erstellt und beschreibt den tatsächlichen Betrieb der App. Sie ersetzt keine individuelle Rechtsberatung. Bei rechtlichen Fragen empfehlen wir die Konsultation eines Fachanwalts für IT-Recht.
            </p>
          </Section>

        </div>

        <div className="text-center mt-10 mb-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-3 h-3" />
              Zurück zur App
            </Button>
          </Link>
        </div>

        <div className="flex justify-center gap-4 text-xs text-muted-foreground/40 pb-8">
          <Link to="/impressum" className="hover:text-muted-foreground transition-colors">Impressum</Link>
        </div>

      </div>
    </div>
  );
};

export default Datenschutz;
