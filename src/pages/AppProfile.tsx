import { useApp } from '@/contexts/AppContext';
import { getProfileLevel } from '@/lib/scoring';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { User, Target, Bell, Watch, Crown, Lock, LogOut, ChevronRight, Check, Download, Trash2, FileText, Shield, Brain, Sparkles, Moon, Zap, Eye, EyeOff, Award, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import NotificationSettings from '@/components/app/NotificationSettings';

const PREMIUM_BENEFITS_SHORT = [
  'Unbegrenzter KI-Coach & Insights',
  'Wöchentlicher Coach-Brief',
  'Bio-Alter Delta & Muster-Erkennung',
  'KI-Wochen- & Ernährungspläne',
  'Adaptive Tagespläne',
  'CALI Evolution & Abendreflexion',
  'Wearable-Integration & Habits',
];

export default function AppProfile() {
  const { profile, longevityScore, streak, protocolProgress, isPremium, premiumSource, userRole, isDevPreview, subscription, startCheckout, openBillingPortal, checkInHistory, scoreHistory, trainingLogs, weightEntries, nutritionLogs, habits, habitHistory, goalPlan, coachMemory, chatHistory, badges } = useApp();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const level = getProfileLevel(longevityScore);
  const [notifSettingsOpen, setNotifSettingsOpen] = useState(false);

  const handleExportData = () => {
    const eveningReflections: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('caliness_evening_')) {
        try { eveningReflections[key] = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
      }
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile,
      checkInHistory,
      scoreHistory,
      trainingLogs,
      weightEntries,
      nutritionLogs,
      habits,
      habitHistory,
      goalPlan,
      coachMemory,
      chatHistory,
      eveningReflections,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caliness-datenexport-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Daten exportiert', description: 'Deine Daten wurden als JSON-Datei heruntergeladen.' });
  };

  const handleDeleteData = async () => {
    if (!confirm('Möchtest du wirklich ALLE deine Daten unwiderruflich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;
    if (!confirm('Bist du sicher? Alle Check-ins, Scores, Pläne und Reflexionen werden gelöscht.')) return;

    // Delete from Supabase (GDPR Art. 17)
    if (user) {
      await Promise.all([
        supabase.from('daily_checkins').delete().eq('user_id', user.id),
        supabase.from('score_history').delete().eq('user_id', user.id),
        supabase.from('nutrition_logs').delete().eq('user_id', user.id),
        supabase.from('goal_plans').delete().eq('user_id', user.id),
        supabase.from('coach_sessions').delete().eq('user_id', user.id),
        supabase.from('weight_entries').delete().eq('user_id', user.id),
        supabase.from('wearable_entries').delete().eq('user_id', user.id),
        supabase.from('habit_data').delete().eq('user_id', user.id),
        supabase.from('companion_evolution').delete().eq('user_id', user.id),
        supabase.from('user_profiles').delete().eq('id', user.id),
      ]);
    }

    // Clear localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('caliness_')) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    toast({ title: 'Daten gelöscht', description: 'Alle deine Daten wurden unwiderruflich gelöscht.' });
    if (signOut) await signOut();
    navigate('/');
  };

  const handleRevokeConsent = () => {
    if (!confirm('Möchtest du deine Einwilligung zur Verarbeitung von Gesundheitsdaten widerrufen? Du wirst zur Startseite weitergeleitet.')) return;
    localStorage.removeItem('caliness_consent');
    toast({ title: 'Einwilligung widerrufen', description: 'Deine Einwilligung wurde zurückgezogen.' });
    navigate('/');
  };

  return (
    <div className="px-5 pt-8 pb-4 space-y-6 animate-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
          <span className="font-outfit font-bold text-xl text-primary">
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'C'}
          </span>
        </div>
        <div>
          <h1 className="font-outfit text-xl font-bold text-foreground">{profile.name}</h1>
          <div className="flex items-center gap-1.5">
            <img src="/images/caliness-logo-white.png" alt="" className="w-3.5 h-3.5 object-contain opacity-50" />
            <span className="text-xs text-primary font-medium">{level} · Score {longevityScore}</span>
          </div>
        </div>
      </div>

      {/* Personal Data */}
      <div className="card-elegant rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Persönliche Daten</h3>
        <InfoRow label="Alter" value={`${profile.age} Jahre`} />
        <InfoRow label="Geschlecht" value={profile.gender} />
        <InfoRow label="Größe" value={`${profile.height} cm`} />
        <InfoRow label="Gewicht" value={`${profile.weight} kg`} />
        <InfoRow label="Aktivität" value={profile.activityLevel} />
      </div>

      {/* Goals */}
      <div className="card-elegant rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Meine Ziele</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.goals.map(g => (
            <span key={g} className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1">{g}</span>
          ))}
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="card-elegant rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Errungenschaften</h3>
            <span className="ml-auto text-[10px] text-muted-foreground">{badges.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {badges.map(b => (
              <div key={b.id} className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-center">
                <span className="text-xl block">{b.emoji}</span>
                <p className="text-[9px] font-semibold text-foreground mt-1 leading-tight">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Summary */}
      <div className="card-elegant rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Fortschritt</h3>
        <InfoRow label="Streak" value={`${streak} Tage`} />
        <InfoRow label="Aktive Protokolle" value={`${protocolProgress.length}`} />
        <InfoRow label="Longevity Score" value={`${longevityScore}/100`} />
      </div>

      {/* Settings */}
      <div className="card-elegant rounded-2xl overflow-hidden">
        <SettingRow icon={TrendingUp} label="Fortschritt" sublabel="Score-Verlauf & Pillar-Entwicklung" onClick={() => navigate('/app/progress')} />
        <SettingRow icon={Sparkles} label="KI-Coach öffnen" sublabel="Persönliche Empfehlungen & Chat" onClick={() => navigate('/app/coach')} />
        <SettingRow icon={Bell} label="Benachrichtigungen" sublabel="Push & In-App Benachrichtigungen" onClick={() => setNotifSettingsOpen(!notifSettingsOpen)} />
        {notifSettingsOpen && (
          <div className="px-4 pb-4">
            <NotificationSettings />
          </div>
        )}
        <SettingRow icon={Watch} label="Wearable-Daten" sublabel="Garmin, Apple Watch, Oura, Whoop" onClick={() => navigate('/app/wearables')} />
      </div>

      {/* Admin Section — only visible for admins */}
      {userRole === 'admin' && (
        <div className="card-elegant rounded-2xl overflow-hidden">
          <h3 className="text-sm font-semibold text-foreground px-4 pt-4 pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            Admin
          </h3>
          <SettingRow icon={User} label="Benutzerverwaltung" sublabel="User verwalten, Premium freischalten" onClick={() => navigate('/app/admin/users')} />
        </div>
      )}

      {/* DSGVO Data Rights */}
      <div className="card-elegant rounded-2xl overflow-hidden">
        <h3 className="text-sm font-semibold text-foreground px-4 pt-4 pb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Deine Datenrechte
        </h3>
        <SettingRow icon={Download} label="Daten exportieren" sublabel="Art. 20 DSGVO — JSON-Export" onClick={handleExportData} />
        <SettingRow icon={Trash2} label="Alle Daten löschen" sublabel="Art. 17 DSGVO — Recht auf Löschung" danger onClick={handleDeleteData} />
        <SettingRow icon={FileText} label="Einwilligung widerrufen" sublabel="Gesundheitsdaten-Einwilligung zurückziehen" danger onClick={handleRevokeConsent} />
      </div>

      {/* ═══ PREMIUM / SUBSCRIPTION SECTION ═══ */}
      <div className="card-elegant rounded-2xl p-5 space-y-4 border-primary/20">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">CALINESS Premium</h3>
          {isPremium && <span className="ml-auto text-xs text-primary font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> Aktiv</span>}
        </div>

        {isPremium ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-foreground font-medium">
                {premiumSource === 'stripe' ? 'CALINESS Premium · €39/Monat' :
                 premiumSource === 'manual' ? 'Manuell freigeschaltet' :
                 premiumSource === 'beta' ? 'Beta-Zugang' :
                 premiumSource === 'founder' ? 'Founder-Zugang' :
                 premiumSource === 'developer' ? 'Entwickler-Zugang' :
                 'Premium aktiv'}
              </p>
              {subscription.subscriptionEnd && premiumSource === 'stripe' && (
                <p className="text-xs text-muted-foreground">
                  {subscription.cancelAtPeriodEnd
                    ? `Endet am ${new Date(subscription.subscriptionEnd).toLocaleDateString('de-DE')}`
                    : `Nächste Abrechnung: ${new Date(subscription.subscriptionEnd).toLocaleDateString('de-DE')}`
                  }
                </p>
              )}
              {subscription.cancelAtPeriodEnd && premiumSource === 'stripe' && (
                <p className="text-xs text-amber-400">
                  Abo gekündigt — Zugriff bis Periodenende
                </p>
              )}
            </div>

            {premiumSource === 'stripe' && (
              <>
                <Button onClick={openBillingPortal} variant="outline" className="w-full">
                  Abo verwalten
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  Zahlungsmethode ändern, Rechnungen einsehen oder kündigen
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2.5">
              {PREMIUM_BENEFITS_SHORT.map(f => (
                <div key={f} className="flex items-center gap-3">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
            <Button onClick={startCheckout} variant="premium" className="w-full">
              Premium freischalten · €39/Monat
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Jederzeit kündbar · 14 Tage Widerrufsrecht · SSL-verschlüsselt
            </p>
          </div>
        )}
      </div>

      {/* ═══ DEV PREVIEW TOGGLE (admin/developer only) ═══ */}
      {isDevPreview && (
        <div className="card-elegant rounded-2xl p-4 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-foreground">Premium-Vorschau</p>
                <p className="text-[10px] text-muted-foreground">
                  {userRole === 'admin' ? 'Admin' : 'Entwickler'} · Free-Ansicht testen
                </p>
              </div>
            </div>
            <Switch
              checked={sessionStorage.getItem('caliness_dev_preview_off') !== 'true'}
              onCheckedChange={checked => {
                if (checked) {
                  sessionStorage.removeItem('caliness_dev_preview_off');
                } else {
                  sessionStorage.setItem('caliness_dev_preview_off', 'true');
                }
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}

      {/* Account */}
      <div className="card-elegant rounded-2xl overflow-hidden">
        <SettingRow icon={LogOut} label="Abmelden" danger onClick={() => { if (signOut) signOut(); navigate('/auth'); }} />
      </div>

      {/* Legal Links */}
      <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground pt-2 pb-4">
        <Link to="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
        <span>·</span>
        <Link to="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
        <span>·</span>
        <Link to="/nutzungsbedingungen" className="hover:text-foreground transition-colors">Nutzungsbedingungen</Link>
        <span>·</span>
        <Link to="/medical-disclaimer" className="hover:text-foreground transition-colors">Medizinischer Hinweis</Link>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

function SettingRow({ icon: Icon, label, sublabel, danger, onClick }: { icon: React.ElementType; label: string; sublabel?: string; danger?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors border-b border-border/20 last:border-0">
      <Icon className={`w-4 h-4 ${danger ? 'text-destructive' : 'text-muted-foreground'}`} />
      <div className="flex-1 text-left">
        <span className={`text-sm ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</span>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
    </button>
  );
}
