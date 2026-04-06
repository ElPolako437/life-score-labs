import { CalinessLogo } from "@/components/CalinessLogo";
import { Sparkles } from "lucide-react";

export const VisualizerAnalyzing = () => {
  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 hero-gradient pointer-events-none" aria-hidden="true" />

      <header className="brand-header relative z-50 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <CalinessLogo size="lg" className="brand-logo-premium" showText={true} />
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center pb-24">
        <div className="text-center animate-enter">
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl icon-container flex items-center justify-center pulse-glow">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="section-title text-2xl md:text-3xl font-bold mb-4">KI analysiert deine Bilder…</h2>
          <p className="text-muted-foreground text-lg mb-8">Visuelle Proportionen werden ausgewertet.</p>
          <div className="w-48 h-1.5 bg-secondary rounded-full mx-auto overflow-hidden">
            <div className="h-full progress-glow rounded-full" style={{ animation: "shimmer 1.5s infinite, grow 3s ease-out forwards" }} />
          </div>
          <style>{`@keyframes grow { from { width: 5%; } to { width: 90%; } }`}</style>
        </div>
      </main>
    </div>
  );
};
