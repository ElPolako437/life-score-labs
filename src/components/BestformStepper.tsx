import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalinessLogo } from "./CalinessLogo";
import { ChevronRight, ChevronLeft, User, Target, Dumbbell, Moon, Utensils } from "lucide-react";
import {
  BestformInputs,
  initialBestformInputs,
  Gender,
  Goal,
  TrainingType,
  NutritionLevel,
} from "@/types/bestform";

interface BestformStepperProps {
  onComplete: (inputs: BestformInputs) => void;
}

const TOTAL_STEPS = 5;

const stepMeta = [
  { icon: User, title: "Körperdaten", subtitle: "Grundlegende Angaben" },
  { icon: Target, title: "Dein Ziel", subtitle: "Was möchtest du erreichen?" },
  { icon: Dumbbell, title: "Training", subtitle: "Deine aktuelle Trainingsroutine" },
  { icon: Moon, title: "Regeneration", subtitle: "Schlaf & Erholung" },
  { icon: Utensils, title: "Ernährung", subtitle: "Deine Ernährungsstruktur" },
];

export const BestformStepper = ({ onComplete }: BestformStepperProps) => {
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState<BestformInputs>(initialBestformInputs);

  const update = (partial: Partial<BestformInputs>) =>
    setInputs((prev) => ({ ...prev, ...partial }));

  const canAdvance = (): boolean => {
    switch (step) {
      case 0:
        return inputs.gender !== null && inputs.age !== null && inputs.height !== null && inputs.currentWeight !== null;
      case 1:
        return inputs.goal !== null;
      case 2:
        return inputs.trainingDays !== null && inputs.trainingType !== null;
      case 3:
        return inputs.sleepHours !== null && inputs.wakesAtNight !== null;
      case 4:
        return inputs.nutrition !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else onComplete(inputs);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const OptionButton = ({
    selected,
    label,
    onClick,
  }: {
    selected: boolean;
    label: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-4 py-3.5 text-left text-sm md:text-base rounded-xl border transition-all duration-200 ${
        selected
          ? "bg-primary/20 border-primary/50 text-primary font-medium"
          : "bg-darker-surface/40 border-border/30 text-text-secondary hover:border-primary/30 hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-5">
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Geschlecht</label>
              <div className="grid grid-cols-2 gap-3">
                {(["male", "female"] as Gender[]).map((g) => (
                  <OptionButton
                    key={g}
                    selected={inputs.gender === g}
                    label={g === "male" ? "Männlich" : "Weiblich"}
                    onClick={() => update({ gender: g })}
                  />
                ))}
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Alter</label>
              <Input
                type="number"
                placeholder="z.B. 32"
                value={inputs.age ?? ""}
                onChange={(e) => update({ age: e.target.value ? parseInt(e.target.value) : null })}
                className="bg-darker-surface/60 border-border/50 text-text-primary"
                min={14}
                max={99}
              />
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Größe (cm)</label>
              <Input
                type="number"
                placeholder="z.B. 178"
                value={inputs.height ?? ""}
                onChange={(e) => update({ height: e.target.value ? parseInt(e.target.value) : null })}
                className="bg-darker-surface/60 border-border/50 text-text-primary"
                min={120}
                max={230}
              />
            </div>

            {/* Current weight */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Aktuelles Gewicht (kg)</label>
              <Input
                type="number"
                placeholder="z.B. 82"
                value={inputs.currentWeight ?? ""}
                onChange={(e) => update({ currentWeight: e.target.value ? parseFloat(e.target.value) : null })}
                className="bg-darker-surface/60 border-border/50 text-text-primary"
                min={30}
                max={300}
              />
            </div>

            {/* Target weight (optional) – disabled for muscle gain */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Zielgewicht (kg) <span className="text-text-muted">(optional)</span>
              </label>
              {inputs.goal === "muscle_gain" ? (
                <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-text-secondary">
                  Für Muskelaufbau berechnen wir Zeit auf Basis von Leistungs- und Regenerationsdaten – nicht über ein Zielgewicht.
                </div>
              ) : (
                <>
                  <Input
                    type="number"
                    placeholder="z.B. 75"
                    value={inputs.targetWeight ?? ""}
                    onChange={(e) => update({ targetWeight: e.target.value ? parseFloat(e.target.value) : null })}
                    className="bg-darker-surface/60 border-border/50 text-text-primary"
                    min={30}
                    max={300}
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Ohne Zielgewicht fokussieren wir auf Straffung / Muskelaufbau.
                  </p>
                </>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-3">
            {([
              ["fat_loss", "Fett reduzieren"],
              ["toning", "Straffer werden"],
              ["muscle_gain", "Muskelaufbau"],
              ["unsure", "Unsicher"],
            ] as [Goal, string][]).map(([value, label]) => (
              <OptionButton
                key={value}
                selected={inputs.goal === value}
                label={label}
                onClick={() => {
                  // Clear targetWeight when switching to muscle_gain
                  if (value === "muscle_gain") {
                    update({ goal: value, targetWeight: null });
                  } else {
                    update({ goal: value });
                  }
                }}
              />
            ))}
            {inputs.goal === "muscle_gain" && (
              <p className="text-xs text-primary/70 mt-2 px-1">
                Für Muskelaufbau berechnen wir Zeit auf Basis von Leistungs- und Regenerationsdaten – nicht über ein Zielgewicht.
              </p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Trainingstage pro Woche
              </label>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }, (_, i) => (
                  <OptionButton
                    key={i}
                    selected={inputs.trainingDays === i}
                    label={String(i)}
                    onClick={() => update({ trainingDays: i })}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Trainingsart</label>
              <div className="space-y-2">
                {([
                  ["strength", "Kraft"],
                  ["cardio", "Cardio"],
                  ["both", "Beides"],
                ] as [TrainingType, string][]).map(([value, label]) => (
                  <OptionButton
                    key={value}
                    selected={inputs.trainingType === value}
                    label={label}
                    onClick={() => update({ trainingType: value })}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Schlafstunden pro Nacht</label>
              <Input
                type="number"
                placeholder="z.B. 7"
                value={inputs.sleepHours ?? ""}
                onChange={(e) => update({ sleepHours: e.target.value ? parseFloat(e.target.value) : null })}
                className="bg-darker-surface/60 border-border/50 text-text-primary"
                min={3}
                max={12}
                step={0.5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Wachst du nachts regelmäßig auf?</label>
              <div className="grid grid-cols-2 gap-3">
                <OptionButton
                  selected={inputs.wakesAtNight === true}
                  label="Ja"
                  onClick={() => update({ wakesAtNight: true })}
                />
                <OptionButton
                  selected={inputs.wakesAtNight === false}
                  label="Nein"
                  onClick={() => update({ wakesAtNight: false })}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-3">
            {([
              ["none", "Kein Tracking"],
              ["rough", "Grob strukturiert"],
              ["structured", "Strukturiert + Protein bewusst"],
            ] as [NutritionLevel, string][]).map(([value, label]) => (
              <OptionButton
                key={value}
                selected={inputs.nutrition === value}
                label={label}
                onClick={() => update({ nutrition: value })}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const meta = stepMeta[step];

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient opacity-50 pointer-events-none" />

      <div className="w-full max-w-lg mx-auto relative z-10 animate-enter">
        <CalinessLogo size="md" className="justify-center mb-6 md:mb-8" showText={true} />

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-text-muted mb-2">
            <span>Schritt {step + 1} von {TOTAL_STEPS}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-elevated-surface rounded-full overflow-hidden">
            <div
              className="h-full progress-glow rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card className="card-elegant">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-primary/10">
                <meta.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl md:text-2xl section-title">{meta.title}</CardTitle>
                <p className="text-sm text-text-muted">{meta.subtitle}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-6">
            {renderStep()}

            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <Button variant="outline" onClick={handleBack} className="flex-1 gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Zurück
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canAdvance()}
                className={`flex-1 gap-2 glow-neon ${!canAdvance() ? "opacity-50" : ""}`}
              >
                {step === TOTAL_STEPS - 1 ? "Berechnen" : "Weiter"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
