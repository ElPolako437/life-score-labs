// Reset = Diagnose + 1 Hebel. Lösung & Plan = Sprint. Spannung offen halten.

import { useState } from 'react';
import { useReset, type Tag1Data } from '@/contexts/ResetContext';
import { calcTag1Energy, determineErnaehrungsTyp } from '@/lib/pillarAssessment';
import { cn } from '@/lib/utils';

interface PillarAssessmentProps {
  day: number;
  onComplete: () => void;
}

type Step = 'koerperdaten' | 'verhalten' | 'preview';

const AKTIVITAET_OPTIONS: { value: Tag1Data['aktivitaet']; label: string; sub: string }[] = [
  { value: 'sitzend',    label: 'Überwiegend sitzend',  sub: 'Büro, Home Office, wenig Bewegung' },
  { value: 'moderat',    label: 'Moderat aktiv',         sub: 'Gelegentliche Spaziergänge, leichte Arbeit' },
  { value: 'aktiv',      label: 'Regelmäßig aktiv',      sub: 'Training 3 bis 4 Mal pro Woche' },
  { value: 'sehr_aktiv', label: 'Sehr aktiv',            sub: 'Täglich Sport oder körperliche Arbeit' },
];

const ZIEL_OPTIONS: { value: Tag1Data['ziel']; label: string }[] = [
  { value: 'energie',    label: 'Mehr Energie im Alltag' },
  { value: 'abnehmen',   label: 'Fett verlieren' },
  { value: 'muskel',     label: 'Muskeln aufbauen' },
  { value: 'gesundheit', label: 'Allgemeine Gesundheit verbessern' },
];

const MAHLZEITEN_OPTIONS: { value: Tag1Data['mahlzeiten']; label: string }[] = [
  { value: 'regelmaessig',   label: '3 Mahlzeiten, relativ regelmäßig' },
  { value: 'unregelmaessig', label: 'Unregelmäßig, manchmal Mahlzeiten auslassend' },
  { value: 'snacking',       label: 'Viel Snacking zwischen Mahlzeiten' },
  { value: 'abends_mehr',    label: 'Abends deutlich mehr als tagsüber' },
];

const TYP_PREVIEW: Record<string, string> = {
  chaos:    'Dein Energiehaushalt hat keinen Rhythmus',
  craving:  'Dein Abend-Problem ist ein Mittags-Problem',
  struktur: 'Der Rahmen fehlt, nicht der Wille',
  stabil:   'Du hast eine Basis die wir optimieren können',
};

export default function PillarAssessment({ day, onComplete }: PillarAssessmentProps) {
  const { setTag1Data, markPillarAnswered, setKoerperdatenSyncConsent } = useReset();

  const [step, setStep] = useState<Step>('koerperdaten');

  // Step 1 state
  const [alter, setAlter] = useState('');
  const [geschlecht, setGeschlecht] = useState<Tag1Data['geschlecht'] | ''>('');
  const [groesse, setGroesse] = useState('');
  const [gewicht, setGewicht] = useState('');

  // Step 2 state
  const [aktivitaet, setAktivitaet] = useState<Tag1Data['aktivitaet'] | ''>('');
  const [ziel, setZiel] = useState<Tag1Data['ziel'] | ''>('');
  const [mahlzeiten, setMahlzeiten] = useState<Tag1Data['mahlzeiten'] | ''>('');
  const [dsgvoConsent, setDsgvoConsent] = useState(false);

  // Computed preview
  const [previewTyp, setPreviewTyp] = useState<string>('');

  const step1Valid = !!alter && !!geschlecht && !!groesse && !!gewicht &&
    Number(alter) > 0 && Number(groesse) > 0 && Number(gewicht) > 0;

  const step2Valid = !!aktivitaet && !!ziel && !!mahlzeiten;

  const handleStep1Next = () => {
    if (step1Valid) setStep('verhalten');
  };

  const handleSubmit = () => {
    if (!step2Valid) return;

    const data: Tag1Data = {
      alter: Number(alter),
      geschlecht: geschlecht as Tag1Data['geschlecht'],
      groesse: Number(groesse),
      gewicht: Number(gewicht),
      aktivitaet: aktivitaet as Tag1Data['aktivitaet'],
      ziel: ziel as Tag1Data['ziel'],
      mahlzeiten: mahlzeiten as Tag1Data['mahlzeiten'],
    };

    const typ = determineErnaehrungsTyp(data);
    setTag1Data(data, typ);
    if (dsgvoConsent) setKoerperdatenSyncConsent(true);
    markPillarAnswered(day);
    setPreviewTyp(typ);
    setStep('preview');
    onComplete();
  };

  const progress = step === 'koerperdaten' ? 33 : step === 'verhalten' ? 66 : 100;

  return (
    <div className="w-full">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">
          {step === 'koerperdaten' ? 'Schritt 1 von 2' : step === 'verhalten' ? 'Schritt 2 von 2' : 'Fertig'}
        </span>
      </div>

      {/* ── STEP 1: Körperdaten ── */}
      {step === 'koerperdaten' && (
        <div className="space-y-5 animate-fade-in">
          {/* Disclaimer */}
          <div className="p-3 rounded-xl bg-secondary/40 border border-border/40">
            <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
              Orientierung, keine medizinische Diagnose. Diese Werte dienen ausschließlich zur Berechnung deines persönlichen Energie-Rahmens.
            </p>
          </div>

          {/* Alter + Geschlecht */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground/70 block mb-1.5">Alter</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="30"
                min={16}
                max={99}
                value={alter}
                onChange={e => setAlter(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-card border border-border/60 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground/70 block mb-1.5">Geschlecht</label>
              <select
                value={geschlecht}
                onChange={e => setGeschlecht(e.target.value as Tag1Data['geschlecht'])}
                className="w-full h-12 px-3 rounded-xl bg-card border border-border/60 text-sm focus:outline-none focus:border-primary/50 transition-all appearance-none text-foreground"
              >
                <option value="">Wählen</option>
                <option value="m">Männlich</option>
                <option value="w">Weiblich</option>
                <option value="na">Keine Angabe</option>
              </select>
            </div>
          </div>

          {/* Größe + Gewicht */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground/70 block mb-1.5">Größe (cm)</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="175"
                min={140}
                max={220}
                value={groesse}
                onChange={e => setGroesse(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-card border border-border/60 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground/70 block mb-1.5">Gewicht (kg)</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="75"
                min={40}
                max={200}
                value={gewicht}
                onChange={e => setGewicht(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-card border border-border/60 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleStep1Next}
            disabled={!step1Valid}
            className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ boxShadow: step1Valid ? '0 0 20px hsl(142 76% 46% / 0.25)' : undefined }}
          >
            Weiter →
          </button>
        </div>
      )}

      {/* ── STEP 2: Verhalten ── */}
      {step === 'verhalten' && (
        <div className="space-y-5 animate-fade-in">
          {/* Aktivitätslevel */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Wie aktiv bist du im Alltag?</p>
            <div className="space-y-2">
              {AKTIVITAET_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setAktivitaet(opt.value)}
                  className={cn(
                    'w-full text-left p-3.5 rounded-xl border transition-all duration-150',
                    aktivitaet === opt.value
                      ? 'border-primary/50 bg-primary/8 text-foreground'
                      : 'border-border/50 bg-card text-muted-foreground hover:border-border'
                  )}
                >
                  <span className="text-sm font-medium block">{opt.label}</span>
                  <span className="text-[11px] text-muted-foreground/50">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ziel */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Was ist dein wichtigstes Ziel?</p>
            <div className="space-y-2">
              {ZIEL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setZiel(opt.value)}
                  className={cn(
                    'w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all duration-150',
                    ziel === opt.value
                      ? 'border-primary/50 bg-primary/8 text-foreground'
                      : 'border-border/50 bg-card text-muted-foreground hover:border-border'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mahlzeiten-Realität */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Wie sieht dein Essalltag wirklich aus?</p>
            <div className="space-y-2">
              {MAHLZEITEN_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMahlzeiten(opt.value)}
                  className={cn(
                    'w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all duration-150',
                    mahlzeiten === opt.value
                      ? 'border-primary/50 bg-primary/8 text-foreground'
                      : 'border-border/50 bg-card text-muted-foreground hover:border-border'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* DSGVO Opt-In */}
          <label className={cn(
            'flex items-start gap-3 cursor-pointer rounded-xl border p-3.5 transition-colors',
            dsgvoConsent ? 'border-primary/30 bg-primary/5' : 'border-border/40 bg-card'
          )}>
            <div className="relative mt-0.5 flex-shrink-0">
              <input type="checkbox" checked={dsgvoConsent} onChange={e => setDsgvoConsent(e.target.checked)} className="sr-only" />
              <div className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                dsgvoConsent ? 'bg-primary border-primary' : 'border-border/60 bg-card'
              )}>
                {dsgvoConsent && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4L4 7L10 1" stroke="#080808" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground/65 leading-relaxed">
              Darf CALINESS diese Werte speichern, um dir im Sprint eine persönliche Beratung zu geben? (Optional)
            </p>
          </label>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('koerperdaten')}
              className="h-12 px-5 rounded-xl border border-border/50 text-sm text-muted-foreground/70 hover:text-foreground hover:border-border transition-all"
            >
              ←
            </button>
            <button
              onClick={handleSubmit}
              disabled={!step2Valid}
              className="flex-1 min-h-[48px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ boxShadow: step2Valid ? '0 0 20px hsl(142 76% 46% / 0.25)' : undefined }}
            >
              Auswertung starten →
            </button>
          </div>
        </div>
      )}

      {/* ── PREVIEW: Ergebnis bereit ── */}
      {step === 'preview' && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 animate-fade-in">
          <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2">Deine Auswertung</p>
          <p className="text-sm font-semibold text-foreground mb-1">
            {previewTyp ? TYP_PREVIEW[previewTyp] : 'Deine Einordnung ist bereit'}
          </p>
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            Die vollständige Karte mit deinem Protein-Anker, Energie-Rahmen und ersten Hebel siehst du nach dem Abschluss.
          </p>
        </div>
      )}
    </div>
  );
}
