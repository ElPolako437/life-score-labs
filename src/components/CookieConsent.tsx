import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

const COOKIE_CONSENT_KEY = "caliness_cookie_consent";

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ 
      accepted: true, 
      timestamp: new Date().toISOString() 
    }));
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ 
      accepted: false, 
      timestamp: new Date().toISOString() 
    }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto bg-card/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Icon & Text */}
          <div className="flex items-start gap-4 flex-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Cookie-Einstellungen</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Wir verwenden technisch notwendige Cookies, um die Funktionalität unserer Website sicherzustellen. 
                Weitere Informationen findest du in unserer{" "}
                <Link to="/datenschutz" className="text-primary hover:underline">
                  Datenschutzerklärung
                </Link>.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="text-sm"
            >
              Nur notwendige
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="text-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Alle akzeptieren
            </Button>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={handleDecline}
            className="absolute top-3 right-3 md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Schließen"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};
