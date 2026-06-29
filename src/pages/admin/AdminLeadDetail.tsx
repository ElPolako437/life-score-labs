import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AdminShell from '@/components/admin/AdminShell';
import { getLead, addNote, setStatus, type LeadDetail } from '@/lib/resetAdmin';

const TEMP: Record<string, { label: string; cls: string }> = {
  hot: { label: '🔥 Heiß', cls: 'bg-red-500/15 text-red-300 border-red-500/30' },
  warm: { label: 'Warm', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  cold: { label: 'Kalt', cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
};
const fmt = (s: unknown) => (s ? new Date(String(s)).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }) : '–');
const val = (v: unknown) => (v === null || v === undefined || v === '' ? '–' : String(v));

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-sm font-semibold mb-3 text-slate-200">{title}</h2>
      {children}
    </div>
  );
}
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4 py-1.5 border-b border-white/5 last:border-0"><span className="text-xs text-slate-400">{k}</span><span className="text-sm text-slate-200 text-right">{v}</span></div>;
}

export default function AdminLeadDetail() {
  const { email = '' } = useParams();
  const navigate = useNavigate();
  const decoded = decodeURIComponent(email);
  const [d, setD] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getLead(decoded).then(r => {
      if (r.unauthorized) { navigate('/admin/login', { replace: true }); return; }
      if (r.data) setD(r.data);
      setLoading(false);
    });
  }, [decoded, navigate]);
  useEffect(load, [load]);

  const saveNote = async () => {
    if (!note.trim()) return;
    setBusy(true); await addNote(decoded, note.trim()); setNote(''); setBusy(false); load();
  };
  const mark = async (contact_status: string) => { setBusy(true); await setStatus(decoded, { contact_status }); setBusy(false); load(); };

  const p = d?.participant ?? {};
  const prof = d?.profile;

  return (
    <AdminShell>
      <Link to="/admin/leads" className="text-xs text-slate-400 hover:text-slate-100">← zurück zur Liste</Link>

      {loading ? (
        <p className="text-slate-400 text-sm mt-6">Lädt …</p>
      ) : !d ? (
        <p className="text-slate-400 text-sm mt-6">Lead nicht gefunden.</p>
      ) : (
        <>
          <div className="flex items-start justify-between mt-3 mb-6">
            <div>
              <h1 className="text-xl font-bold">{val(p.vorname)}</h1>
              <p className="text-sm text-slate-400">{decoded}</p>
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${TEMP[d.temperature].cls}`}>
              {TEMP[d.temperature].label} · {d.readiness_score}/100
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <Card title="Kontakt & Status">
              <Row k="Status" v={val(p.reset_status)} />
              <Row k="Kontaktstatus" v={val(p.contact_status)} />
              <Row k="Aktueller Tag" v={`${val(p.last_day_reached)}/7`} />
              <Row k="Ziel" v={val(p.ziel ?? prof?.goal)} />
              <Row k="Telefon" v={val(p.whatsapp_nummer)} />
              <Row k="Consent" v={p.consent ? 'ja' : 'nein'} />
              <Row k="Coaching-Interesse" v={val(p.coaching_interest)} />
              <Row k="App-Interesse" v={val(p.app_interest)} />
              <Row k="Letzte Aktivität" v={fmt(p.last_seen_at)} />
            </Card>

            <Card title="Lead-Score — warum?">
              <ul className="space-y-1.5">
                {d.readiness_reasons.length ? d.readiness_reasons.map((r, i) => (
                  <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-emerald-400">✓</span>{r}</li>
                )) : <li className="text-sm text-slate-500">Noch keine Score-Signale.</li>}
              </ul>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                <button onClick={() => mark('contacted')} disabled={busy} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5">Kontaktiert</button>
                <button onClick={() => mark('coaching_ready')} disabled={busy} className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10">Coaching-ready</button>
                <button onClick={() => mark('not_relevant')} disabled={busy} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5">Nicht relevant</button>
              </div>
            </Card>

            {prof && (
              <Card title="Startprofil (Tag 1)">
                <Row k="Geschlecht / Alter" v={`${val(prof.sex)} · ${val(prof.age)}`} />
                <Row k="Größe / Gewicht" v={`${val(prof.height)} cm · ${val(prof.weight)} kg`} />
                <Row k="Aktivität / Alltag" v={`${val(prof.activity)} · ${val(prof.daily)}`} />
                <Row k="BMR / TDEE" v={`${val(prof.bmr)} · ${val(prof.tdee)} kcal`} />
                <Row k="Kalorienbereich" v={`${val(prof.cal_low)}–${val(prof.cal_high)} kcal`} />
                <Row k="Protein" v={`${val(prof.protein_low)}–${val(prof.protein_high)} g`} />
                <Row k="Mahlzeiten" v={val(prof.meal_count)} />
                <Row k="Haupthebel" v={val(prof.main_lever)} />
                <Row k="Hürde" v={val(prof.hurdle)} />
              </Card>
            )}

            <Card title={`Tagesfortschritt (${d.days.length})`}>
              {d.days.length ? (
                <div className="space-y-2">
                  {d.days.map((day) => (
                    <div key={String(day.day)} className="flex items-center justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-slate-300">Tag {val(day.day)}</span>
                      <span className="text-slate-400 text-xs">
                        {day.completed_at ? '✓ abgeschlossen' : 'offen'} · Rating {val(day.rating)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">Noch kein Tag abgeschlossen.</p>}
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-5">
            <Card title="Admin-Notizen">
              <div className="flex gap-2 mb-3">
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Notiz hinzufügen …"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none" />
                <button onClick={saveNote} disabled={busy || !note.trim()} className="text-xs px-3 rounded-lg bg-emerald-500 text-[#0b0c0f] font-semibold disabled:opacity-50">Speichern</button>
              </div>
              <div className="space-y-2">
                {(d.notes ?? []).map((n) => (
                  <div key={String(n.id)} className="text-sm text-slate-300 bg-white/[0.03] rounded-lg p-2.5">
                    <p>{val(n.note)}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{fmt(n.created_at)}</p>
                  </div>
                ))}
                {!d.notes?.length && <p className="text-sm text-slate-500">Noch keine Notizen.</p>}
              </div>
            </Card>

            <Card title={`Events (${d.events.length})`}>
              <div className="space-y-1.5 max-h-72 overflow-auto">
                {(d.events ?? []).map((e) => (
                  <div key={String(e.id)} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0">
                    <span className="text-slate-300">{val(e.event)}</span>
                    <span className="text-slate-500">{fmt(e.created_at)}</span>
                  </div>
                ))}
                {!d.events?.length && <p className="text-sm text-slate-500">Keine Events.</p>}
              </div>
            </Card>
          </div>
        </>
      )}
    </AdminShell>
  );
}
