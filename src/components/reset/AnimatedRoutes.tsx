import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import ResetWelcome from '@/pages/reset/ResetWelcome';
import ResetInstall from '@/pages/reset/ResetInstall';
import ResetWhatsApp from '@/pages/reset/ResetWhatsApp';
import ResetOnboarding from '@/pages/reset/ResetOnboarding';
import ResetFocus from '@/pages/reset/ResetFocus';
import ResetWeek from '@/pages/reset/ResetWeek';
import ResetDay from '@/pages/reset/ResetDay';
import ResetCheckIn from '@/pages/reset/ResetCheckIn';
import ResetReflection from '@/pages/reset/ResetReflection';
import ResetSprintReady from '@/pages/reset/ResetSprintReady';
import ResetApp from '@/pages/reset/ResetApp';
import ResetNext from '@/pages/reset/ResetNext';
import Datenschutz from '@/pages/Datenschutz';
import Impressum from '@/pages/Impressum';
import NotFound from '@/pages/NotFound';

/**
 * App-grade page transitions. Each route change fades + glides the new screen in
 * (and the old one out) so navigation feels like an app sliding, not a website
 * reloading. Respects prefers-reduced-motion and resets scroll on every change.
 */
export default function AnimatedRoutes() {
  const location = useLocation();
  const reduce = useReducedMotion();

  // Apps reset scroll on navigation; websites keep it. Reset to top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  const variants = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.12 } },
      }
    : {
        initial: { opacity: 0, y: 12 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
        },
        exit: {
          opacity: 0,
          y: -8,
          transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
        },
      };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Routes location={location}>
          <Route path="/" element={<ResetWelcome />} />
          <Route path="/install" element={<ResetInstall />} />
          <Route path="/whatsapp" element={<ResetWhatsApp />} />
          <Route path="/onboarding" element={<ResetOnboarding />} />
          <Route path="/focus" element={<ResetFocus />} />
          <Route path="/week" element={<ResetWeek />} />
          <Route path="/day/:id" element={<ResetDay />} />
          <Route path="/checkin/:id" element={<ResetCheckIn />} />
          <Route path="/reflection" element={<ResetReflection />} />
          <Route path="/sprint-ready" element={<ResetSprintReady />} />
          <Route path="/app" element={<ResetApp />} />
          <Route path="/next" element={<ResetNext />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
