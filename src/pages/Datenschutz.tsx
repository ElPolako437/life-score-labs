import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Trash2, Mail, BarChart2 } from "lucide-react";
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
            <p>Der CALINESS 7-Tage Reset verarbeitet zwei Kategorien von Daten:</p>
            <p><strong className="text-foreground">a) Lokal auf deinem Gerät (kein Serverzugriff):</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Dein Name (optional), persönliches Ziel und Hürde (Onboarding)</li>
              <li>Tägliche Aufgaben-Fortschritte und Check-in Bewertungen</li>
              <li>Optionale Notizen zu einzelnen Tagen</li>
              <li>Selbsteinschätzungen (Energie, Schlaf, Wohlbefinden)</li>
            </ul>
            <p className="mt-2"><strong className="text-foreground">b) Nutzungs-Ereignisse (anonymisiert, EU-Server):</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Welche Schritte du in der App durchläufst (z.B. "Reset gestartet", "Tag 3 abgeschlossen")</li>
              <li>Technische Informationen: Browser-Typ, Gerätekategorie, anonymisierte IP-Adresse</li>
            </ul>
            <p className="text-xs text-muted-foreground/60 mt-2">Diese Ereignis-Daten enthalten keine persönlichen Inhalte deiner Eingaben. Sie dienen ausschließlich der Produktverbesserung.</p>
          </Section>

          <Section icon={Lock} title="3. Rechtsgrundlage">
            <p><strong className="text-foreground">Lokale Daten (Abschnitt 2a):</strong> Verarbeitung erfolgt auf Basis deiner Einwilligung gemäß <strong className="text-foreground">Art. 6 Abs. 1 lit. a DSGVO</strong>. Da wir keinen Serverzugriff auf diese Daten haben, findet keine externe Übermittlung statt.</p>
            <p><strong className="text-foreground">Nutzungs-Ereignisse (Abschnitt 2b):</strong> Verarbeitung auf Basis unseres berechtigten Interesses gemäß <strong className="text-foreground">Art. 6 Abs. 1 lit. f DSGVO</strong>, d.h. der Optimierung und Weiterentwicklung des kostenlosen Produktangebots. Die Ereignisse sind anonymisiert und enthalten keine Gesundheitsdaten.</p>
            <p>Selbsteinschätzungen zu Wohlbefinden und Schlaf verbleiben ausschließlich lokal auf deinem Gerät und werden nicht an externe Dienste übermittelt.</p>
          </Section>

          <Section icon={Trash2} title="4. Speicherdauer und Löschung">
            <p><strong className="text-foreground">Lokale Daten:</strong> Verbleiben im Browser-localStorage bis du sie selbst löschst. Nutze "Reset wiederholen" in der App oder lösche die Website-Daten in deinen Browser-Einstellungen.</p>
            <p><strong className="text-foreground">Nutzungs-Ereignisse:</strong> Werden bei PostHog EU (Frankfurt) für maximal 12 Monate gespeichert. Du kannst jederzeit per E-Mail an <a href="mailto:hi@caliness.de" className="text-primary hover:underline">hi@caliness.de</a> die Löschung beantragen.</p>
          </Section>

          <Section icon={BarChart2} title="5. Analytics — PostHog EU">
            <p>Wir nutzen <strong className="text-foreground">PostHog</strong> zur anonymisierten Nutzungsanalyse. PostHog verarbeitet Daten ausschließlich auf EU-Servern in Frankfurt (Deutschland) und ist DSGVO-konform zertifiziert.</p>
            <ul className="list-disc list-inside space-y-1">
              <li>IP-Adressen werden vor der Speicherung anonymisiert</li>
              <li>Kein Einsatz von Cookies oder Cross-Site-Tracking</li>
              <li>Daten verlassen die EU nicht</li>
              <li>Keine Weitergabe an Dritte zu Werbezwecken</li>
            </ul>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Datenschutzerklärung PostHog: <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">posthog.com/privacy</a>
            </p>
          </Section>

          <Section icon={Shield} title="6. Keine Werbung, keine Drittanbieter-Tracker">
            <p>Die App verwendet:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Keine Werbe-Tracker oder Pixel (kein Meta Pixel, kein Google Ads)</li>
              <li>Kein Google Analytics, kein Facebook Analytics</li>
              <li>Keine externen Schriften — Fonts sind lokal eingebunden</li>
              <li>Keine Third-Party-Cookies</li>
            </ul>
          </Section>

          <Section icon={Lock} title="7. Deine Rechte">
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

          <Section icon={Mail} title="8. Kontakt bei Datenschutzfragen">
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
