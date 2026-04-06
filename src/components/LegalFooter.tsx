import { Link } from 'react-router-dom';

export const LegalFooter = () => (
  <footer className="border-t border-border/30 py-6 mt-12">
    <div className="max-w-5xl mx-auto px-5 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
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
);
