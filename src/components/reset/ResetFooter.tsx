import { Link } from 'react-router-dom';

/**
 * Minimal, always-reachable legal footer (Impressumspflicht + Datenschutz).
 * Rendered once globally below the routes so every Reset screen links to it.
 */
export default function ResetFooter() {
  return (
    <footer className="relative z-10 px-6 py-6 border-t border-border/15 text-center">
      <p className="text-[11px] text-muted-foreground/45 leading-relaxed">
        <Link to="/impressum" className="hover:text-muted-foreground/70 transition-colors">Impressum</Link>
        <span className="mx-2 text-muted-foreground/25">·</span>
        <Link to="/datenschutz" className="hover:text-muted-foreground/70 transition-colors">Datenschutz</Link>
      </p>
      <p className="text-[10px] text-muted-foreground/30 mt-1.5">© {new Date().getFullYear()} CALINESS Academy</p>
    </footer>
  );
}
