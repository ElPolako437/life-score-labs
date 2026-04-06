import { Helmet } from 'react-helmet';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LegalFooter } from '@/components/LegalFooter';

const Impressum = () => (
  <>
    <Helmet>
      <title>Impressum | Caliness Academy</title>
      <meta name="description" content="Impressum der Caliness Academy gemäß § 5 TMG." />
    </Helmet>

    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Button>
          </Link>
          <div className="text-sm font-medium text-primary tracking-widest uppercase">Caliness Academy</div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Impressum</h1>
        <p className="text-sm text-muted-foreground mb-10">Angaben gemäß § 5 TMG</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Angaben zum Unternehmen</h2>
            <p>
              [Vollständiger Name des Unternehmens / der Person]<br />
              [Rechtsform, z.B. Einzelunternehmen / GmbH / UG]<br />
              [Straße und Hausnummer]<br />
              [PLZ und Ort]<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Vertreten durch</h2>
            <p>[Vor- und Nachname des Vertretungsberechtigten]</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Kontakt</h2>
            <p>
              Telefon: [Telefonnummer]<br />
              E-Mail: [E-Mail-Adresse]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Umsatzsteuer-ID</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
              [USt-IdNr. oder „Nicht vorhanden / Kleinunternehmerregelung"]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
            <p>
              [Vor- und Nachname]<br />
              [Anschrift]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">EU-Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
              <br />
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground mt-8">
            <strong className="text-foreground">Hinweis:</strong> Felder in [eckigen Klammern] müssen vor Veröffentlichung
            durch die tatsächlichen Angaben des Betreibers ersetzt werden. Bei Unsicherheiten empfehlen wir die
            Prüfung durch einen spezialisierten Rechtsanwalt.
          </div>
        </div>

        <div className="text-center mt-12">
          <Link to="/">
            <Button variant="outline">Zurück zur Startseite</Button>
          </Link>
        </div>
      </main>

      <LegalFooter />
    </div>
  </>
);

export default Impressum;
