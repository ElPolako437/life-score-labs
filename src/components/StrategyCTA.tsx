// ═══════════════════════════════════════════════════════════════════════════
// STRATEGIE-CTA KOMPONENTE
// Einheitliche Darstellung des Strategiegespräch-CTAs überall
// Medizinisch-seriös, nicht pushy, ruhig
// ═══════════════════════════════════════════════════════════════════════════

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink } from "lucide-react";
import { CTA_COPY, CALENDLY_URL } from "@/config/constants";

interface StrategyCTAProps {
  // Style variant
  variant?: "prominent" | "subtle" | "minimal";
  // Custom className
  className?: string;
  // Animation delay for staggered animations
  animationDelay?: string;
}

export const StrategyCTA = ({ 
  variant = "subtle",
  className = "",
  animationDelay = "0ms"
}: StrategyCTAProps) => {
  const handleBookMeeting = () => {
    window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
  };

  // Minimal variant - just text and button (for test page)
  if (variant === "minimal") {
    return (
      <div className={`text-center py-8 ${className}`} style={{ animationDelay }}>
        <p className="text-sm text-text-muted mb-4 max-w-md mx-auto leading-relaxed">
          {CTA_COPY.description}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleBookMeeting}
          className="text-text-muted hover:text-text-primary"
        >
          <Calendar className="mr-2 w-4 h-4" />
          {CTA_COPY.buttonText}
        </Button>
        <p className="text-xs text-text-muted/60 mt-3">
          {CTA_COPY.disclaimerShort}
        </p>
      </div>
    );
  }

  return (
    <Card 
      className={`card-elegant animate-enter ${className}`}
      style={{ animationDelay }}
    >
      <CardContent className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${variant === "prominent" ? "bg-gradient-glow" : "bg-primary/10"}`}>
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">
            {CTA_COPY.headline}
          </h3>
        </div>

        {/* Description - exact copy from constants */}
        <p className="text-text-secondary mb-6 leading-relaxed">
          {CTA_COPY.description}
        </p>

        {/* Button */}
        <Button
          onClick={handleBookMeeting}
          className={variant === "prominent" ? "w-full glow-neon" : "w-full"}
          variant={variant === "prominent" ? "default" : "outline"}
          size="lg"
        >
          <Calendar className="mr-2 w-5 h-5" />
          {CTA_COPY.buttonText}
          <ExternalLink className="ml-2 w-4 h-4" />
        </Button>

        {/* Disclaimer under button */}
        <p className="text-xs text-text-muted text-center mt-4 leading-relaxed">
          {CTA_COPY.disclaimer}
        </p>
      </CardContent>
    </Card>
  );
};
