import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { computeCompanionState } from '@/lib/companionState';
import type { EvolutionTier } from '@/lib/companionState';
import { lazy, Suspense, useEffect } from 'react';
import { cn } from '@/lib/utils';

const EvolutionMilestone = lazy(() => import('./EvolutionMilestone'));

export default function AppLayout() {
  const { pendingMilestone, clearMilestone, longevityScore, pillarScores, todayCheckIn, streak, weeklyConsistency, goalPlan, checkInHistory, profile } = useApp();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isEvening = new Date().getHours() >= 20;

  // Auth Guard: redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Consent Guard: redirect to onboarding if no consent recorded
  useEffect(() => {
    const hasConsent = localStorage.getItem('caliness_consent');
    if (!hasConsent && profile.onboardingComplete) {
      navigate('/app/onboarding');
    }
  }, [profile.onboardingComplete, navigate]);

  if (authLoading || !user) return null;

  const companion = pendingMilestone
    ? computeCompanionState(longevityScore, pillarScores, todayCheckIn, streak, weeklyConsistency, goalPlan, checkInHistory.length)
    : null;

  return (
    <div className={cn('min-h-screen bg-background text-foreground', isEvening && 'evening-mode')}>
      <div className="max-w-lg mx-auto pb-24">
        <div
          key={location.pathname}
          className="animate-enter"
        >
          <Outlet />
        </div>
      </div>
      <BottomNav />
      {pendingMilestone && companion && (
        <Suspense fallback={null}>
          <EvolutionMilestone
            oldTier={pendingMilestone.oldTier as EvolutionTier}
            newTier={pendingMilestone.newTier as EvolutionTier}
            companion={companion}
            onDismiss={clearMilestone}
          />
        </Suspense>
      )}
    </div>
  );
}
