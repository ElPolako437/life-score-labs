import { useState } from "react";
import { Helmet } from "react-helmet";
import { BestformLanding } from "@/components/BestformLanding";
import { BestformStepper } from "@/components/BestformStepper";
import { BestformResults } from "@/components/BestformResults";
import { BestformInputs, BestformResult, calculateBestform, initialBestformInputs } from "@/types/bestform";
import { CookieConsent } from "@/components/CookieConsent";

type BestformState = "landing" | "calculator" | "results";

const BestformCalculator = () => {
  const [state, setState] = useState<BestformState>("landing");
  const [result, setResult] = useState<BestformResult | null>(null);
  const [lastInputs, setLastInputs] = useState<BestformInputs>(initialBestformInputs);

  const handleStart = () => setState("calculator");

  const handleComplete = (inputs: BestformInputs) => {
    const calculated = calculateBestform(inputs);
    setLastInputs(inputs);
    setResult(calculated);
    setState("results");
  };

  const handleRestart = () => {
    setResult(null);
    setState("landing");
  };

  return (
    <>
      <Helmet>
        <title>Bestform Calculator™ – Wann erreichst du dein Ziel realistisch? | Caliness Academy</title>
        <meta
          name="description"
          content="Berechne realistisch, wie lange du für Fettverlust, Straffung oder Muskelaufbau brauchst. Premium Bestform Calculator basierend auf Training, Schlaf und Ernährung."
        />
        <meta property="og:title" content="Bestform Calculator™ – Realistische Zielprognose | Caliness Academy" />
        <meta property="og:description" content="Berechne realistisch, wie lange du für Fettverlust, Straffung oder Muskelaufbau brauchst." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${window.location.origin}/bestform-calculator`} />
      </Helmet>

      {state === "landing" && <BestformLanding onStart={handleStart} />}
      {state === "calculator" && <BestformStepper onComplete={handleComplete} />}
      {state === "results" && result && (
        <BestformResults result={result} inputs={lastInputs} onRestart={handleRestart} />
      )}

      <CookieConsent />
    </>
  );
};

export default BestformCalculator;
