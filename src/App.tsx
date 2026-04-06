import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ResetProvider } from "./contexts/ResetContext";
import ResetWelcome from "./pages/reset/ResetWelcome";
import ResetOnboarding from "./pages/reset/ResetOnboarding";
import ResetFocus from "./pages/reset/ResetFocus";
import ResetWeek from "./pages/reset/ResetWeek";
import ResetDay from "./pages/reset/ResetDay";
import ResetCheckIn from "./pages/reset/ResetCheckIn";
import ResetReflection from "./pages/reset/ResetReflection";
import ResetNext from "./pages/reset/ResetNext";
import Datenschutz from "./pages/Datenschutz";
import Impressum from "./pages/Impressum";
import NotFound from "./pages/NotFound";

const App = () => (
  <ResetProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ResetWelcome />} />
          <Route path="/onboarding" element={<ResetOnboarding />} />
          <Route path="/focus" element={<ResetFocus />} />
          <Route path="/week" element={<ResetWeek />} />
          <Route path="/day/:id" element={<ResetDay />} />
          <Route path="/checkin/:id" element={<ResetCheckIn />} />
          <Route path="/reflection" element={<ResetReflection />} />
          <Route path="/next" element={<ResetNext />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </ResetProvider>
);

export default App;
