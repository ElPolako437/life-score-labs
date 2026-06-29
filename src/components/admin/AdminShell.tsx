import { ReactNode, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getToken, adminLogout } from '@/lib/resetAdmin';

/** Geschützte Admin-Hülle: Token-Gate + Top-Nav. Login-Seite nutzt sie NICHT. */
export default function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!getToken()) navigate('/admin/login', { replace: true });
  }, [navigate]);

  const nav = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/leads', label: 'Leads' },
  ];
  const isActive = (to: string) => (to === '/admin' ? pathname === '/admin' : pathname.startsWith(to));

  const logout = async () => { await adminLogout(); navigate('/admin/login', { replace: true }); };

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0c0f]/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold tracking-tight text-sm">
              CALI<span className="text-emerald-400">·</span>NESS <span className="text-slate-400 font-medium">Admin</span>
            </span>
            <nav className="flex items-center gap-1">
              {nav.map(n => (
                <Link key={n.to} to={n.to}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(n.to) ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                  }`}>{n.label}</Link>
              ))}
            </nav>
          </div>
          <button onClick={logout} className="text-xs text-slate-400 hover:text-slate-100 transition-colors">Abmelden</button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-5 py-8">{children}</main>
    </div>
  );
}
