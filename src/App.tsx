import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import { ResetProvider } from "./contexts/ResetContext";
import { captureInstallPrompt } from "./lib/installPrompt";
import AnimatedRoutes from "./components/reset/AnimatedRoutes";
import ResetAura from "./components/reset/ResetAura";
import ResetFooter from "./components/reset/ResetFooter";
import { CookieConsent } from "./components/CookieConsent";

const App = () => {
  useEffect(() => { captureInstallPrompt(); }, []);

  return (
  <ResetProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ResetAura />
        <div className="relative z-10 flex min-h-screen flex-col">
          <div className="flex-1">
            <AnimatedRoutes />
          </div>
          <ResetFooter />
        </div>
        <CookieConsent />
      </BrowserRouter>
    </TooltipProvider>
  </ResetProvider>
  );
};

export default App;
