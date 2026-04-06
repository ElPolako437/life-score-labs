import { LegalFooter } from "@/components/LegalFooter";
import { Helmet } from "react-helmet";
import { FileDown, ArrowLeft, BookOpen, Target, MessageCircle, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { PDF_DIRECT_PATHS, isSafeUrl } from "@/lib/pdfDownload";

interface PdfItem {
  title: string;
  description: string;
  url: string;
  icon: typeof BookOpen;
  pages: string;
}

const Downloads = () => {
  const navigate = useNavigate();

  // SAFE: Direct relative paths - work on ANY domain without Lovable login
  // These are static HTML files optimized for print-to-PDF
  const pdfs: PdfItem[] = [
    {
      title: "Grundlagen-Guide",
      description: "Orientierung und Klarheit für Phasen, in denen Veränderung schwer fällt. Die 5 Säulen der Longevity.",
      url: PDF_DIRECT_PATHS.foundation,
      icon: BookOpen,
      pages: "8 Seiten"
    },
    {
      title: "Prioritäten-Framework",
      description: "Strukturierte Analyse zur Identifikation deiner echten Longevity-Hebel.",
      url: PDF_DIRECT_PATHS.awakening,
      icon: Target,
      pages: "4 Seiten"
    },
    {
      title: "Das Longevity-Gespräch",
      description: "Was dich im Orientierungsgespräch erwartet – Struktur, Ablauf und Vorbereitung.",
      url: PDF_DIRECT_PATHS.mastery,
      icon: MessageCircle,
      pages: "1 Seite"
    },
    {
      title: "Longevity Framework",
      description: "Unser internes Framework – die wissenschaftlichen Grundlagen und Philosophie hinter dem CALINESS Ansatz.",
      url: PDF_DIRECT_PATHS.longevity,
      icon: Sparkles,
      pages: "10 Seiten"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Downloads | Caliness Academy</title>
        <meta name="description" content="Lade dir unsere Longevity-Guides und Frameworks als PDF herunter." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Button>
            <div className="text-sm font-medium text-primary tracking-widest uppercase">
              Caliness Academy
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-6 py-16 max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Downloads
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Unsere Longevity-Ressourcen für dich – kostenlos zum Speichern und Ausdrucken.
            </p>
          </div>

          <div className="grid gap-6">
            {pdfs.map((pdf) => (
              <a
                key={pdf.title}
                href={pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block w-full text-left p-6 md:p-8 rounded-xl border border-border bg-card hover:bg-accent/5 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <pdf.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                          {pdf.title}
                        </h2>
                        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                          {pdf.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="hidden md:inline">{pdf.pages}</span>
                        <ExternalLink className="h-4 w-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Help Section */}
          <div className="mt-16 p-6 rounded-xl bg-muted/30 border border-border/50">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileDown className="h-5 w-5 text-primary" />
              So speicherst du die Dokumente als PDF
            </h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Klicke auf ein Dokument, um es zu öffnen</li>
              <li>Nutze den Button <span className="text-primary font-medium">"Als PDF speichern"</span> oben rechts</li>
              <li>Alternativ: Drücke <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Strg+P</kbd> (Windows) oder <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Cmd+P</kbd> (Mac)</li>
              <li>Wähle "Als PDF speichern" als Drucker</li>
            </ol>
          </div>

          {/* Troubleshooting */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Probleme beim Download? Stelle sicher, dass Popups erlaubt sind, oder{" "}
              <a 
                href="mailto:team@caliness-academy.de" 
                className="text-primary hover:underline"
              >
                kontaktiere uns
              </a>.
            </p>
          </div>
        </main>
        <LegalFooter />
      </div>
    </>
  );
};

export default Downloads;
