import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '@/components/admin/AdminShell';
import { getAnalytics, type AnalyticsData } from '@/lib/resetAdmin';

const GOAL_LABEL: Record<string, string> = { energy: 'Energie', fatloss: 'Fettabbau', structure: 'Struktur', sleep: 'Schlaf' };
const lbl = (k: string) => GOAL_LABEL[k] ?? k;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-sm font-semibold mb-4 text-slate-200">{title}</h2>
      {children}
    </div>
  );
}

function TopList({ items }: { items: { key: string; count: number }[] }) {
  const max = items[0]?.count || 1;
  if (!items.length) return <p className="text-sm text-slate-500">Noch keine Daten.</p>;
  return (
    <div className="space-y-2">
      {items.map(i => (
        <div key={i.key} className="flex items-center gap-3">
          <span className="text-xs text-slate-300 w-28 truncate">{lbl(i.key)}</span>
          <div className="flex-1 h-4 rounded bg-white/5 overflow-hidden">
            <div className="h-full bg-emerald-500/60 rounded" style={{ width: `${Math.round((i.count / max) * 100)}%` }} />
          </div>
          <span className="text-xs text-slate-400 w-6 text-right">{i.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [d, setD] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then(r => {
      if (r.unauthorized) { navigate('/admin/login', { replace: true }); return; }
      if (r.data) setD(r.data);
      setLoading(false);
    });
  }, [navigate]);

  return (
    <AdminShell>
      <h1 className="text-xl font-bold mb-6">Analytics</h1>
      {loading ? (
        <p className="text-slate-400 text-sm">Lädt …</p>
      ) : !d ? (
        <p className="text-slate-400 text-sm">Keine Daten.</p>
      ) : (
        <>
          <Card title="Pro Tag — Completion-Rate & Ø-Rating">
            <table className="w-full text-sm">
              <thead className="text-slate-400 text-xs">
                <tr><th className="text-left font-medium py-1">Tag</th><th className="text-right font-medium py-1">erreicht</th><th className="text-right font-medium py-1">abgeschlossen</th><th className="text-right font-medium py-1">Completion</th><th className="text-right font-medium py-1">Ø Rating</th></tr>
              </thead>
              <tbody>
                {d.perDay.map(p => (
                  <tr key={p.day} className="border-t border-white/5">
                    <td className="py-2 text-slate-300">Tag {p.day}</td>
                    <td className="py-2 text-right text-slate-400">{p.reached}</td>
                    <td className="py-2 text-right text-slate-400">{p.completed}</td>
                    <td className="py-2 text-right text-slate-200">{p.completionRate}%</td>
                    <td className="py-2 text-right text-slate-200">{p.avgRating ?? '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="grid md:grid-cols-2 gap-5 mt-5">
            <Card title="Häufigste Ziele"><TopList items={d.topGoals} /></Card>
            <Card title="Häufigste Hürden"><TopList items={d.topHurdles} /></Card>
            <Card title="Häufigste Haupthebel"><TopList items={d.topLevers} /></Card>
            <Card title="Häufigste Saboteure (Tag 5)"><TopList items={d.topSaboteurs} /></Card>
          </div>

          <Card title="CTA-Klicks (Conversion)">
            <div className="grid grid-cols-3 gap-3">
              {[['Sprint', d.ctaClicks.sprint], ['App', d.ctaClicks.app], ['Coaching', d.ctaClicks.coaching]].map(([k, v]) => (
                <div key={k as string} className="rounded-xl bg-white/[0.03] border border-white/10 p-4 text-center">
                  <p className="text-2xl font-bold">{v as number}</p>
                  <p className="text-xs text-slate-400 mt-1">{k as string}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </AdminShell>
  );
}
