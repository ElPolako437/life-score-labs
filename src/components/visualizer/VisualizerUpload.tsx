import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalinessLogo } from "@/components/CalinessLogo";
import { Upload, X, ArrowRight, Camera, Target } from "lucide-react";

interface Props {
  onComplete: (currentImage: string, goalImage: string | null) => void;
}

export const VisualizerUpload = ({ onComplete }: Props) => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [goalImage, setGoalImage] = useState<string | null>(null);
  const currentRef = useRef<HTMLInputElement>(null);
  const goalRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File, setter: (v: string) => void) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("Datei zu groß. Max 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent, setter: (v: string) => void) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file, setter);
  };

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient pointer-events-none" aria-hidden="true" />

      <header className="brand-header relative z-50 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <CalinessLogo size="lg" className="brand-logo-premium" showText={true} />
        </div>
      </header>

      <main className="relative z-10 pt-8 md:pt-16 pb-24">
        <div className="max-w-4xl mx-auto px-5 md:px-8">
          <div className="text-center mb-12 animate-enter">
            <h2 className="section-title text-3xl md:text-4xl font-bold mb-4">Bilder hochladen</h2>
            <p className="text-muted-foreground text-lg">Bitte neutrales Licht, entspannte Haltung. Analyse basiert auf visuellen Proportionen.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">
            {/* Current body */}
            <Card className="bg-secondary border border-border animate-enter">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  Aktueller Körper
                </CardTitle>
                <p className="text-sm text-muted-foreground">Front oder Front + Seite</p>
              </CardHeader>
              <CardContent>
                {currentImage ? (
                  <div className="relative group">
                    <img src={currentImage} alt="Aktuell" className="w-full h-64 object-cover rounded-xl" />
                    <button
                      onClick={() => setCurrentImage(null)}
                      className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <Upload className="w-8 h-8 text-primary/60 mb-3" />
                    <p className="text-sm text-foreground/80 font-medium">Bild hochladen</p>
                    <p className="text-xs text-muted-foreground mt-1">Klicken oder hierhin ziehen</p>
                    <input ref={currentRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], setCurrentImage)} />
                  </label>
                )}
              </CardContent>
            </Card>

            {/* Goal body */}
            <Card className="bg-secondary border border-border animate-enter" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="icon-container w-10 h-10 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  Ziel- / Wunschkörper
                </CardTitle>
                <p className="text-sm text-muted-foreground">Optional – Referenzbild deines Ziels</p>
              </CardHeader>
              <CardContent>
                {goalImage ? (
                  <div className="relative group">
                    <img src={goalImage} alt="Ziel" className="w-full h-64 object-cover rounded-xl" />
                    <button
                      onClick={() => setGoalImage(null)}
                      className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <Upload className="w-8 h-8 text-primary/60 mb-3" />
                    <p className="text-sm text-foreground/80 font-medium">Zielbild hochladen</p>
                    <p className="text-xs text-muted-foreground mt-1">optional</p>
                    <input ref={goalRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], setGoalImage)} />
                  </label>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button
              onClick={() => currentImage && onComplete(currentImage, goalImage)}
              disabled={!currentImage}
              size="xl"
              variant="premium"
              className="text-base md:text-lg px-10 py-6 rounded-2xl group"
            >
              Weiter zu Basisdaten
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
