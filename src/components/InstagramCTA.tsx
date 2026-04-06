import { Card, CardContent } from "@/components/ui/card";
import { Instagram, ArrowRight } from "lucide-react";

interface InstagramCTAProps {
  className?: string;
  animationDelay?: string;
}

const INSTAGRAM_URL = "https://ig.me/m/caliness_academy?text=RESET";

export const InstagramCTA = ({ className = "", animationDelay = "0ms" }: InstagramCTAProps) => {
  return (
    <Card 
      className={`animate-enter border-2 border-[#00B209]/40 bg-gradient-to-br from-background via-background to-[#00B209]/10 shadow-lg ${className}`}
      style={{ animationDelay }}
    >
      <CardContent className="p-6 md:p-8">
        {/* Headline */}
        <div className="text-center mb-5">
          <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-1">
            Nächster Schritt: In 7 Tagen ins Tun ✅
          </h3>
        </div>

        {/* Copy */}
        <p className="text-text-secondary text-sm md:text-base leading-relaxed mb-6 text-center max-w-xl mx-auto">
          Du hast deine smarte Auswertung – wenn du jetzt direkt starten willst, schicken wir dir den{" "}
          <span className="font-semibold text-text-primary">kostenlosen Caliness 7-Tage Reset</span>: eine klare 
          Start-Routine als Checkliste, die dir Struktur & Momentum gibt – alltagstauglich in 10–20 Min/Tag.
        </p>
        
        <p className="text-text-secondary text-sm md:text-base leading-relaxed mb-6 text-center max-w-xl mx-auto">
          Schreib uns privat auf Instagram „<span className="font-semibold text-[#00B209]">RESET</span>", 
          wähle dein Ziel (1 Klick) – wir geben dir den Wochenfokus in 1 Satz und du bekommst den Reset.
        </p>

        {/* Primary Button */}
        <div className="text-center mb-4">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 bg-[#00B209] hover:bg-[#00B209]/90 text-white font-semibold px-8 py-4 rounded-xl text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 min-h-[56px]"
          >
            <Instagram className="w-5 h-5 md:w-6 md:h-6" />
            Reset jetzt auf Instagram holen
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </a>
        </div>

        {/* Fallback text */}
        <p className="text-xs text-text-muted text-center">
          Falls Instagram nicht öffnet: suche{" "}
          <span className="font-medium text-text-secondary">@caliness_academy</span>{" "}
          und schreib uns „RESET".
        </p>
      </CardContent>
    </Card>
  );
};
