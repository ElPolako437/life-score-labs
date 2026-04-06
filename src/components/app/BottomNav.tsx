import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, TrendingUp, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

const tabs = [
  { path: '/app/home', label: 'Home', icon: null as any, isLogo: true },
  { path: '/app/heute', label: 'Heute', icon: Sun, isLogo: false, checkInIndicator: true },
  { path: '/app/zielsystem', label: 'Ziel', icon: Target, isLogo: false },
  { path: '/app/progress', label: 'Fortschritt', icon: TrendingUp, isLogo: false },
  { path: '/app/coach', label: 'Coach', icon: Sparkles, isLogo: false },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkInHistory } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const checkedInToday = checkInHistory.some(c => c.date === today);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-card/95 backdrop-blur-xl safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map(tab => {
          const active = location.pathname === tab.path ||
            (tab.path === '/app/heute' && (location.pathname.startsWith('/app/heute') || location.pathname.startsWith('/app/checkin'))) ||
            (tab.path === '/app/zielsystem' && (location.pathname.startsWith('/app/zielsystem') || location.pathname.startsWith('/app/goal-planner') || location.pathname.startsWith('/app/nutrition') || location.pathname.startsWith('/app/protocols') || location.pathname.startsWith('/app/my-plans'))) ||
            (tab.path === '/app/progress' && (location.pathname.startsWith('/app/progress') || location.pathname.startsWith('/app/weekly-report'))) ||
            (tab.path === '/app/coach' && (location.pathname.startsWith('/app/coach') || location.pathname.startsWith('/app/companion')));
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl relative',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.isLogo ? (
                <img
                  src="/images/caliness-logo-white.png"
                  alt="Home"
                  className={cn('w-5 h-5 object-contain transition-all', active ? 'opacity-100' : 'opacity-40')}
                  style={active ? { filter: 'drop-shadow(0 0 6px hsl(142 76% 46% / 0.6))' } : {}}
                />
              ) : (
                <tab.icon className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_hsl(142_76%_46%/0.6)]')} />
              )}
              <span className="text-[10px] font-medium">{tab.label}</span>
              {(tab as any).checkInIndicator && !checkedInToday && !active && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" />
              )}
              {active && (
                <div
                  className="absolute -bottom-1 w-4 h-0.5 rounded-full bg-primary"
                  style={{ animation: 'cardSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 0 8px hsl(142 76% 46% / 0.5)' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
