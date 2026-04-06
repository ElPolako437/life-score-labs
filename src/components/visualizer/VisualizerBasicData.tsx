import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalinessLogo } from "@/components/CalinessLogo";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, Ruler, Weight, Dumbbell, Moon } from "lucide-react";
import type { VisualizerData } from "@/pages/BestformVisualizer";

interface Props {
  onComplete: (data: { height: number; weight: number; trainingDays: number; sleepHours: number }) => void;
  initialData: VisualizerData;
}

export const VisualizerBasicData = ({ onComplete, initialData }: Props) => {
  const [height, setHeight] = useState(initialData.height);
  const [weight, setWeight] = useState(initialData.weight);
  const [trainingDays, setTrainingDays] = useState(initialData.trainingDays);
  const [sleepHours, setSleepHours] = useState(initialData.sleepHours);

  const isValid = height >= 140 && height <= 220 && weight >= 40 && weight <= 200;

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient pointer-events-none" aria-hidden="true" />

      <header className="brand-header relative z-50 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <CalinessLogo size="lg" className="brand-logo-premium" showText={true} />
        </div>
      </header>

      <main className="relative z-10 pt-8 md:pt-16 pb-24">
        <div className="max-w-2xl mx-auto px-5 md:px-8">
          <div className="text-center mb-12 animate-enter">
            <h2 className="section-title text-3xl md:text-4xl font-bold mb-4">Basisdaten</h2>
            <p className="text-muted-foreground text-lg">Für eine präzisere Einschätzung</p>
          </div>

          <Card className="card-elegant mb-8 animate-enter">
            <CardContent className="p-7 md:p-8 space-y-8">
              {/* Height */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Ruler className="w-4 h-4 text-primary" /> Größe (cm)
                </label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min={140}
                  max={220}
                  className="input-premium"
                />
              </div>

              {/* Weight */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Weight className="w-4 h-4 text-primary" /> Gewicht (kg)
                </label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  min={40}
                  max={200}
                  className="input-premium"
                />
              </div>

              {/* Training days */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Dumbbell className="w-4 h-4 text-primary" /> Trainingstage pro Woche
                </label>
                <Slider
                  value={[trainingDays]}
                  onValueChange={(v) => setTrainingDays(v[0])}
                  min={0}
                  max={7}
                  step={1}
                />
                <p className="text-center text-lg font-semibold text-primary">{trainingDays} Tage</p>
              </div>

              {/* Sleep */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Moon className="w-4 h-4 text-primary" /> Schlaf pro Nacht (Stunden)
                </label>
                <Slider
                  value={[sleepHours]}
                  onValueChange={(v) => setSleepHours(v[0])}
                  min={4}
                  max={10}
                  step={0.5}
                />
                <p className="text-center text-lg font-semibold text-primary">{sleepHours}h</p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button
              onClick={() => isValid && onComplete({ height, weight, trainingDays, sleepHours })}
              disabled={!isValid}
              size="xl"
              variant="premium"
              className="text-base md:text-lg px-10 py-6 rounded-2xl group"
            >
              KI-Analyse starten
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
