import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '@/components/admin/AdminShell';
import { getLeads, type Lead } from '@/lib/resetAdmin';

const TEMP_BADGE: Record<string, string> = {
  hot: 'bg-red-500/15 text-red-300 border-red-500/30',
  warm: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  cold: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '–');

function toCsv(rows: Lead[]): string {
  const cols = ['email', 'vorname', 'start_datum', 'last_seen_at', 'last_day_reached', 'reset_status', 'contact_status', 'ziel', 'main_lever', 'protein_low', 'protein_high', 'avg_rating', 'coaching_interest', 'app_interest', 'readiness_score', 'temperature', 'consent'];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map(r => cols.map(c => esc((r as Record<string, unknown>)[c])).join(','))].join('\n');
}

export default function AdminLeads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [temp, setTemp] = useState('all');

  useEffect(() => {
    getLeads().then(r => {
      if (r.unauthorized) { navigate('/admin/login', { replace: true }); return; }
      if (r.data) setLeads(r.data.leads);
      setLoading(false);
    });
  }, [navigate]);

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (status !== 'all' && l.reset_status !== status) return false;
      if (temp !== 'all' && l.temperature !== temp) return false;
      if (q) {
        const hay = `${l.email} ${l.vorname ?? ''} ${l.ziel ?? ''}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [leads, q, status, temp]);

  const downloadCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `caliness-reset-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Leads <span className="text-slate-500 font-normal text-base">({filtered.length})</span></h1>
        <button onClick={downloadCsv} className="text-xs px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">CSV exportieren</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Suche Name / E-Mail / Ziel"
          className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 flex-1 min-w-[200px]" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="h-9 px-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300">
          <option value="all">Alle Status</option><option value="started">started</option><option value="active">active</option><option value="completed">completed</option><option value="abandoned">abandoned</option>
        </select>
        <select value={temp} onChange={e => setTemp(e.target.value)} className="h-9 px-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300">
          <option value="all">Alle Temperaturen</option><option value="hot">🔥 heiß</option><option value="warm">warm</option><option value="cold">kalt</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Lädt …</p>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-slate-400 text-xs">
              <tr>
                <th className="text-left font-medium px-4 py-3">Lead</th>
                <th className="text-left font-medium px-3 py-3">Start</th>
                <th className="text-center font-medium px-3 py-3">Tag</th>
                <th className="text-left font-medium px-3 py-3">Status</th>
                <th className="text-left font-medium px-3 py-3">Ziel</th>
                <th className="text-center font-medium px-3 py-3">Ø</th>
                <th className="text-center font-medium px-3 py-3">Score</th>
                <th className="text-left font-medium px-3 py-3">Aktiv</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.email} onClick={() => navigate(`/admin/leads/${encodeURIComponent(l.email)}`)}
                  className="border-t border-white/5 hover:bg-white/[0.04] cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-100">{l.vorname || '—'}</p>
                    <p className="text-xs text-slate-500">{l.email}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-400 text-xs">{fmtDate(l.start_datum)}</td>
                  <td className="px-3 py-3 text-center text-slate-300">{l.last_day_reached}/7</td>
                  <td className="px-3 py-3 text-slate-400 text-xs">{l.reset_status}</td>
                  <td className="px-3 py-3 text-slate-400 text-xs">{l.ziel || '–'}</td>
                  <td className="px-3 py-3 text-center text-slate-300">{l.avg_rating !== null ? l.avg_rating.toFixed(1) : '–'}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold border ${TEMP_BADGE[l.temperature]}`}>{l.readiness_score}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-500 text-xs">{fmtDate(l.last_seen_at)}</td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500 text-sm">Keine Leads.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
