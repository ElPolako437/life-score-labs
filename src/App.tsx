import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import { ResetProvider } from "./contexts/ResetContext";
import { captureInstallPrompt } from "./lib/installPrompt";
import AnimatedRoutes from "./components/reset/AnimatedRoutes";

const App = () => {
  useEffect(() => { captureInstallPrompt(); }, []);

  return (
  <ResetProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </ResetProvider>
  );
};

export default App;
