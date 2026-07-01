import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '@/components/admin/AdminShell';
import { getDashboard, type DashboardData } from '@/lib/resetAdmin';

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [d, setD] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(r => {
      if (r.unauthorized) { navigate('/admin/login', { replace: true }); return; }
      if (r.data) setD(r.data);
      setLoading(false);
    });
  }, [navigate]);

  const maxReached = d?.funnel?.[0]?.reached || 1;

  return (
    <AdminShell>
      <h1 className="text-xl font-bold mb-6">Dashboard</h1>
      {loading ? (
        <p className="text-slate-400 text-sm">Lädt …</p>
      ) : !d ? (
        <p className="text-slate-400 text-sm">Keine Daten.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Kpi label="Leads gesamt" value={d.kpis.total} />
            <Kpi label="Neu heute" value={d.kpis.newToday} />
            <Kpi label="Aktiv im Reset" value={d.kpis.active} />
            <Kpi label="Abgeschlossen" value={d.kpis.completed} />
            <Kpi label="Completion-Rate" value={`${d.kpis.completionRate}%`} />
            <Kpi label="Ø Rating" value={d.kpis.avgRating ?? '–'} hint="Skala 1–3 · höher = besser" />
            <Kpi label="Coaching-ready" value={d.kpis.coachingReady} hint="heiße Leads" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-sm font-semibold mb-4">Funnel — wie weit kommen sie?</h2>
              <div className="space-y-2">
                {d.funnel.map(f => (
                  <div key={f.day} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-12">Tag {f.day}</span>
                    <div className="flex-1 h-5 rounded-md bg-white/5 overflow-hidden">
                      <div className="h-full bg-emerald-500/70 rounded-md transition-all"
                        style={{ width: `${Math.round((f.reached / maxReached) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-slate-300 w-8 text-right">{f.reached}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-sm font-semibold mb-4">Abbrüche pro Tag</h2>
              <div className="space-y-2">
                {d.dropoff.map(f => (
                  <div key={f.day} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-20">Tag {f.day}→{f.day + 1}</span>
                    <div className="flex-1 h-5 rounded-md bg-white/5 overflow-hidden">
                      <div className="h-full bg-red-500/50 rounded-md transition-all"
                        style={{ width: `${Math.round((f.dropped / maxReached) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-slate-300 w-8 text-right">{f.dropped}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
