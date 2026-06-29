import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, getToken } from '@/lib/resetAdmin';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (getToken()) navigate('/admin', { replace: true }); }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw) return;
    setLoading(true); setErr(null);
    const r = await adminLogin(pw);
    setLoading(false);
    if (r.ok) navigate('/admin', { replace: true });
    else setErr(r.error || 'Login fehlgeschlagen');
  };

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-slate-100 flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-bold tracking-tight text-lg">CALI<span className="text-emerald-400">·</span>NESS</p>
          <p className="text-sm text-slate-400 mt-1">Reset Admin</p>
        </div>
        <label className="block text-xs text-slate-400 mb-2">Admin-Passwort</label>
        <input
          type="password" value={pw} onChange={e => setPw(e.target.value)} autoFocus
          className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
          placeholder="••••••••••••"
        />
        {err && <p className="text-xs text-red-400 mt-2">{err}</p>}
        <button type="submit" disabled={loading}
          className="mt-4 w-full h-11 rounded-xl bg-emerald-500 text-[#0b0c0f] font-semibold text-sm transition-all hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-60">
          {loading ? 'Anmelden …' : 'Anmelden'}
        </button>
        <p className="text-[11px] text-slate-500 mt-4 leading-relaxed text-center">
          Beim ersten Login wird das Passwort gesetzt (min. 12 Zeichen, Groß-/Kleinbuchstabe + Zahl).
        </p>
      </form>
    </div>
  );
}
