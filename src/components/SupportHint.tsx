// ═══════════════════════════════════════════════════════════════════════════
// SUPPORT-HINWEIS KOMPONENTE
// Dezenter Hilfe-Hinweis für die Testseite
// Sehr zurückhaltend, Service-orientiert, nicht Angebot
// ═══════════════════════════════════════════════════════════════════════════

import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { SUPPORT_COPY, CALENDLY_URL } from "@/config/constants";

interface SupportHintProps {
  className?: string;
}

export const SupportHint = ({ className = "" }: SupportHintProps) => {
  const handleRequestHelp = () => {
    window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`text-center py-6 border-t border-border/30 mt-8 ${className}`}>
      <div className="flex items-center justify-center gap-2 text-text-muted mb-3">
        <HelpCircle className="w-4 h-4" />
        <span className="text-sm font-medium">{SUPPORT_COPY.headline}</span>
      </div>
      <p className="text-xs text-text-muted/70 mb-4 max-w-sm mx-auto">
        {SUPPORT_COPY.description}
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRequestHelp}
        className="text-text-muted hover:text-text-primary text-xs"
      >
        {SUPPORT_COPY.buttonText}
      </Button>
    </div>
  );
};
