import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Datenschutz from "./pages/Datenschutz";
import MedicalDisclaimer from "./pages/MedicalDisclaimer";
import Nutzungsbedingungen from "./pages/Nutzungsbedingungen";
import Impressum from "./pages/Impressum";
import AdminUsers from "./pages/AdminUsers";
import AppWelcome from "./pages/AppWelcome";
import AppOnboarding from "./pages/AppOnboarding";
import AppHome from "./pages/AppHome";
import AppProtocols from "./pages/AppProtocols";
import AppProtocolDetail from "./pages/AppProtocolDetail";
import AppCheckIn from "./pages/AppCheckIn";
import AppProgress from "./pages/AppProgress";
import AppProfile from "./pages/AppProfile";
import AppCoach from "./pages/AppCoach";
import AppPlans from "./pages/AppPlans";
import AppTrainingLog from "./pages/AppTrainingLog";
import AppWearables from "./pages/AppWearables";
import AppWeeklyReport from "./pages/AppWeeklyReport";
import AppHabits from "./pages/AppHabits";
import AppCompanion from "./pages/AppCompanion";
import AppGoalPlanner from "./pages/AppGoalPlanner";
import AppNutrition from "./pages/AppNutrition";
import AppHeute from "./pages/AppHeute";
import AppZielsystem from "./pages/AppZielsystem";
import AppMyPlans from "./pages/AppMyPlans";
import AppLayout from "./components/app/AppLayout";
import ErrorBoundary from "./components/app/ErrorBoundary";
import ProtectedRoute from "./components/app/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Root redirects to app */}
              <Route path="/" element={<Navigate to="/app" replace />} />
              <Route path="/auth" element={<Auth />} />
              {/* Legal pages */}
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/datenschutz" element={<Datenschutz />} />
              <Route path="/medical-disclaimer" element={<MedicalDisclaimer />} />
              <Route path="/nutzungsbedingungen" element={<Nutzungsbedingungen />} />
              {/* CALINESS App Routes */}
              <Route path="/app" element={<ProtectedRoute><AppWelcome /></ProtectedRoute>} />
              <Route path="/app/onboarding" element={<ProtectedRoute><AppOnboarding /></ProtectedRoute>} />
              <Route element={<ProtectedRoute><ErrorBoundary><AppLayout /></ErrorBoundary></ProtectedRoute>}>
                <Route path="/app/home" element={<AppHome />} />
                <Route path="/app/heute" element={<AppHeute />} />
                <Route path="/app/protocols" element={<AppProtocols />} />
                <Route path="/app/protocols/:id" element={<AppProtocolDetail />} />
                <Route path="/app/checkin" element={<AppCheckIn />} />
                <Route path="/app/progress" element={<AppProgress />} />
                <Route path="/app/profile" element={<AppProfile />} />
                <Route path="/app/coach" element={<AppCoach />} />
                <Route path="/app/plans" element={<AppPlans />} />
                <Route path="/app/training-log" element={<AppTrainingLog />} />
                <Route path="/app/wearables" element={<AppWearables />} />
                <Route path="/app/weekly-report" element={<AppWeeklyReport />} />
                <Route path="/app/habits" element={<AppHabits />} />
                <Route path="/app/companion" element={<AppCompanion />} />
                <Route path="/app/goal-planner" element={<AppGoalPlanner />} />
                <Route path="/app/nutrition" element={<AppNutrition />} />
                <Route path="/app/zielsystem" element={<AppZielsystem />} />
                <Route path="/app/my-plans" element={<AppMyPlans />} />
              </Route>
              <Route path="/app/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
