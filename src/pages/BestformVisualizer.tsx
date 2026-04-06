import { useState } from "react";
import { Helmet } from "react-helmet";
import { CookieConsent } from "@/components/CookieConsent";
import { VisualizerLanding } from "@/components/visualizer/VisualizerLanding";
import { VisualizerUpload } from "@/components/visualizer/VisualizerUpload";
import { VisualizerBasicData } from "@/components/visualizer/VisualizerBasicData";
import { VisualizerAnalyzing } from "@/components/visualizer/VisualizerAnalyzing";
import { VisualizerResults } from "@/components/visualizer/VisualizerResults";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VisualizerData {
  currentImage: string | null;
  goalImage: string | null;
  height: number;
  weight: number;
  trainingDays: number;
  sleepHours: number;
}

export interface VisualizerAnalysis {
  category: "leicht" | "moderat" | "deutlich" | "gross";
  categoryLabel: string;
  timeRangeMin: number;
  timeRangeMax: number;
  timeLabel: string;
  primaryFocus: string;
  structuralLever: string;
  motivation: string;
}

type State = "landing" | "upload" | "data" | "analyzing" | "results";

const BestformVisualizer = () => {
  const [state, setState] = useState<State>("landing");
  const [data, setData] = useState<VisualizerData>({
    currentImage: null,
    goalImage: null,
    height: 175,
    weight: 80,
    trainingDays: 3,
    sleepHours: 7,
  });
  const [analysis, setAnalysis] = useState<VisualizerAnalysis | null>(null);

  const handleUploadComplete = (currentImage: string, goalImage: string | null) => {
    setData(prev => ({ ...prev, currentImage, goalImage }));
    setState("data");
  };

  const handleDataComplete = async (basicData: { height: number; weight: number; trainingDays: number; sleepHours: number }) => {
    const fullData = { ...data, ...basicData };
    setData(fullData);
    setState("analyzing");

    try {
      const { data: result, error } = await supabase.functions.invoke("visualizer-ai", {
        body: {
          currentImage: fullData.currentImage,
          goalImage: fullData.goalImage,
          height: fullData.height,
          weight: fullData.weight,
          trainingDays: fullData.trainingDays,
          sleepHours: fullData.sleepHours,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      setAnalysis(result.analysis);
      setState("results");
    } catch (e: any) {
      console.error("Analysis error:", e);
      toast.error(e.message || "Analyse fehlgeschlagen. Bitte versuche es erneut.");
      setState("data");
    }
  };

  const handleRestart = () => {
    setAnalysis(null);
    setData({ currentImage: null, goalImage: null, height: 175, weight: 80, trainingDays: 3, sleepHours: 7 });
    setState("landing");
  };

  return (
    <>
      <Helmet>
        <title>Bestform Visualizer™ – Visuelle Transformationsanalyse | Caliness Academy</title>
        <meta name="description" content="Lade ein Bild hoch und erfahre, wie lange deine Transformation realistisch dauert. KI-gestützte visuelle Analyse der Caliness Academy." />
        <meta property="og:title" content="Bestform Visualizer™ – Visuelle Transformationsanalyse" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${window.location.origin}/bestform-visualizer`} />
      </Helmet>

      {state === "landing" && <VisualizerLanding onStart={() => setState("upload")} />}
      {state === "upload" && <VisualizerUpload onComplete={handleUploadComplete} />}
      {state === "data" && <VisualizerBasicData onComplete={handleDataComplete} initialData={data} />}
      {state === "analyzing" && <VisualizerAnalyzing />}
      {state === "results" && analysis && <VisualizerResults analysis={analysis} onRestart={handleRestart} />}

      <CookieConsent />
    </>
  );
};

export default BestformVisualizer;
