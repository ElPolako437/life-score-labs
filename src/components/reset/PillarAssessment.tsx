// Reset = Diagnose + 1 Hebel. Lösung & Plan = Sprint. Spannung offen halten.

import { useState } from 'react';
import { useReset, type Tag1Data, type Tag2Data, type Tag3Data, type Tag4Data } from '@/contexts/ResetContext';
import {
  calcTag1Energy,
  determineErnaehrungsTyp,
  determineBewegungsTyp,
  determineSchlafTyp,
  determineMentalTyp,
  getBewegungsContent,
  getSchlafContent,
  getMentalContent,
} from '@/lib/pillarAssessment';
import { cn } from '@/lib/utils';

interface PillarAssessmentProps {
  day: number;
  onComplete: () => void;
}

// ─── Tag 1 option configs ─────────────────────────────────────────────────────

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
  { value: 'snacking',       label: 'Viel Snacking zwischen den Mahlzeiten' },
  { value: 'abends_mehr',    label: 'Abends deutlich mehr als tagsüber' },
];

// ─── Tag 2 option configs ─────────────────────────────────────────────────────

const SCHRITTE_OPTIONS: { value: Tag2Data['schritte']; label: string }[] = [
  { value: 'u3000',      label: 'Unter 3.000 (wenig Alltagsbewegung)' },
  { value: '3000-6000',  label: '3.000 bis 6.000 (moderater Alltag)' },
  { value: '6000-10000', label: '6.000 bis 10.000 (aktiver Alltag)' },
  { value: 'ue10000',    label: 'Über 10.000' },
];

const FREQUENZ_OPTIONS: { value: Tag2Data['frequenz']; label: string }[] = [
  { value: 'keins', label: 'Gar nicht oder sehr selten' },
  { value: '1-2',   label: '1 bis 2 Mal pro Woche' },
  { value: '3-4',   label: '3 bis 4 Mal pro Woche' },
  { value: '5plus', label: '5 Mal oder mehr' },
];

const GEFUEHL_OPTIONS: { value: Tag2Data['gefuehl']; label: string }[] = [
  { value: 'gut',          label: 'Energetisiert und gut' },
  { value: 'erschoepft',   label: 'Erschöpft, brauche Zeit zum Erholen' },
  { value: 'kaum',         label: 'Ich trainiere kaum, kann ich nicht einschätzen' },
  { value: 'wechselhaft',  label: 'Wechselhaft, manchmal gut manchmal ausgepumpt' },
];

// ─── Tag 3 option configs ─────────────────────────────────────────────────────

const DAUER_OPTIONS: { value: Tag3Data['dauer']; label: string }[] = [
  { value: 'u6',    label: 'Unter 6 Stunden' },
  { value: '6-7',   label: '6 bis 7 Stunden' },
  { value: '7-8',   label: '7 bis 8 Stunden' },
  { value: '8plus', label: '8 Stunden oder mehr' },
];

const REGELMAESSIGKEIT_OPTIONS: { value: Tag3Data['regelmaessigkeit']; label: string }[] = [
  { value: 'sehr',  label: 'Immer ungefähr zur gleichen Zeit' },
  { value: 'ca1h',  label: 'Variiert um etwa eine Stunde' },
  { value: 'stark', label: 'Variiert stark, je nach Tag' },
  { value: 'keins', label: 'Sehr unregelmäßig, kein Muster' },
];

const MORGEN_OPTIONS: { value: Tag3Data['morgenBildschirm']; label: string }[] = [
  { value: 'frisch',      label: 'Frisch und bereit' },
  { value: 'maessig',     label: 'Etwas müde, aber ok nach kurzem Anlaufen' },
  { value: 'schwer',      label: 'Schwer wach zu werden, brauche lange' },
  { value: 'erschoepft',  label: 'Erschöpft, als hätte ich kaum geschlafen' },
];

// ─── Tag 4 option configs ─────────────────────────────────────────────────────

const KIPP_OPTIONS: { value: Tag4Data['kippPunkt']; label: string }[] = [
  { value: 'morgens',      label: 'Morgens, ich starte bereits angespannt' },
  { value: 'nachmittags',  label: 'Nachmittags, das Tief trifft mich hart' },
  { value: 'abends',       label: 'Abends, nach der Arbeit kippt die Kontrolle' },
  { value: 'selten',       label: 'Mein Tag kippt selten' },
];

const STRESS_OPTIONS: { value: Tag4Data['stress']; label: string }[] = [
  { value: 'gering',    label: 'Gering, meistens ausgeglichen' },
  { value: 'mittel',    label: 'Mittel, dauerhaft präsent aber manageable' },
  { value: 'hoch',      label: 'Hoch, oft angespannt oder überwältigt' },
  { value: 'sehr_hoch', label: 'Sehr hoch, kaum echte Momente der Ruhe' },
];

const ABEND_OPTIONS: { value: Tag4Data['abendVerhalten']; label: string }[] = [
  { value: 'kontrolliert', label: 'Ich bin abends strukturiert und kontrolliert' },
  { value: 'manchmal',     label: 'Manchmal esse oder handle ich impulsiv' },
  { value: 'oft_essen',    label: 'Ich esse abends oft ohne echten Hunger' },
  { value: 'leer',         label: 'Ich bin abends entscheidungsmüde und leer' },
];

// ─── Shared SelectGroup ───────────────────────────────────────────────────────

function SelectGroup<T extends string>({
  question,
  options,
  value,
  onChange,
}: {
  question: string;
  options: { value: T; label: string; sub?: string }[];
  value: T | '';
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-3">{question}</p>
      <div className="space-y-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'w-full text-left p-3.5 rounded-xl border transition-all duration-150',
              value === opt.value
                ? 'border-primary/50 bg-primary/8 text-foreground'
                : 'border-border/50 bg-card text-muted-foreground hover:border-border'
            )}
          >
            <span className="text-sm font-medium block">{opt.label}</span>
            {opt.sub && <span className="text-[11px] text-muted-foreground/50">{opt.sub}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Day1Step = 'koerperdaten' | 'verhalten' | 'preview';
type SlimStep = 'fragen' | 'preview';

export default function PillarAssessment({ day, onComplete }: PillarAssessmentProps) {
  const {
    setTag1Data, setTag2Data, setTag3Data, setTag4Data,
    markPillarAnswered, setKoerperdatenSyncConsent,
  } = useReset();

  // ── Day 1 state ──
  const [d1Step, setD1Step] = useState<Day1Step>('koerperdaten');
  const [alter, setAlter] = useState('');
  const [geschlecht, setGeschlecht] = useState<Tag1Data['geschlecht'] | ''>('');
  const [groesse, setGroesse] = useState('');
  const [gewicht, setGewicht] = useState('');
  const [aktivitaet, setAktivitaet] = useState<Tag1Data['aktivitaet'] | ''>('');
  const [ziel, setZiel] = useState<Tag1Data['ziel'] | ''>('');
  const [mahlzeiten, setMahlzeiten] = useState<Tag1Data['mahlzeiten'] | ''>('');
  const [dsgvoConsent, setDsgvoConsent] = useState(false);

  // ── Day 2 state ──
  const [schritte, setSchritte] = useState<Tag2Data['schritte'] | ''>('');
  const [frequenz, setFrequenz] = useState<Tag2Data['frequenz'] | ''>('');
  const [gefuehl, setGefuehl] = useState<Tag2Data['gefuehl'] | ''>('');

  // ── Day 3 state ──
  const [dauer, setDauer] = useState<Tag3Data['dauer'] | ''>('');
  const [regelmaessigkeit, setRegelmaessigkeit] = useState<Tag3Data['regelmaessigkeit'] | ''>('');
  const [morgenBildschirm, setMorgenBildschirm] = useState<Tag3Data['morgenBildschirm'] | ''>('');

  // ── Day 4 state ──
  const [kippPunkt, setKippPunkt] = useState<Tag4Data['kippPunkt'] | ''>('');
  const [stress, setStress] = useState<Tag4Data['stress'] | ''>('');
  const [abendVerhalten, setAbendVerhalten] = useState<Tag4Data['abendVerhalten'] | ''>('');

  // ── Shared ──
  const [slimStep, setSlimStep] = useState<SlimStep>('fragen');
  const [previewHeadline, setPreviewHeadline] = useState('');

  const done = (headline: string) => {
    setPreviewHeadline(headline);
    if (day === 1) setD1Step('preview');
    else setSlimStep('preview');
    markPillarAnswered(day);
    onComplete();
  };

  // ─── DAY 1 ───────────────────────────────────────────────────────────────────

  if (day === 1) {
    const step1Valid = !!alter && !!geschlecht && !!groesse && !!gewicht &&
      Number(alter) > 0 && Number(groesse) > 0 && Number(gewicht) > 0;
    const step2Valid = !!aktivitaet && !!ziel && !!mahlzeiten;
    const progress = d1Step === 'koerperdaten' ? 33 : d1Step === 'verhalten' ? 66 : 100;

    const handleD1Submit = () => {
      if (!step2Valid) return;
      const data: Tag1Data = {
        alter: Number(alter), geschlecht: geschlecht as Tag1Data['geschlecht'],
        groesse: Number(groesse), gewicht: Number(gewicht),
        aktivitaet: aktivitaet as Tag1Data['aktivitaet'],
        ziel: ziel as Tag1Data['ziel'],
        mahlzeiten: mahlzeiten as Tag1Data['mahlzeiten'],
      };
      const typ = determineErnaehrungsTyp(data);
      setTag1Data(data, typ);
      if (dsgvoConsent) setKoerperdatenSyncConsent(true);
      const headlines: Record<string, string> = {
        chaos: 'Dein Energiehaushalt hat keinen Rhythmus',
        craving: 'Dein Abend-Problem ist ein Mittags-Problem',
        struktur: 'Der Rahmen fehlt, nicht der Wille',
        stabil: 'Du hast eine Basis die wir optimieren können',
      };
      done(headlines[typ] ?? 'Deine Auswertung ist bereit');
    };

    return (
      <div className="w-full">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">
            {d1Step === 'koerperdaten' ? 'Schritt 1 von 2' : d1Step === 'verhalten' ? 'Schritt 2 von 2' : 'Fertig'}
          </span>
        </div>

        {d1Step === 'koerperdaten' && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-3 rounded-xl bg-secondary/40 border border-border/40">
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                Orientierung, keine medizinische Diagnose. Diese Werte dienen ausschließlich zur Berechnung deines persönlichen Energie-Rahmens.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground/70 block mb-1.5">Alter</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" placeholder="30" min={16} max={99}
                  value={alter} onChange={e => setAlter(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-card border border-border/60 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground/70 block mb-1.5">Geschlecht</label>
                <select value={geschlecht} onChange={e => setGeschlecht(e.target.value as Tag1Data['geschlecht'])}
                  className="w-full h-12 px-3 rounded-xl bg-card border border-border/60 text-sm focus:outline-none focus:border-primary/50 transition-all appearance-none text-foreground">
                  <option value="">Wählen</option>
                  <option value="m">Männlich</option>
                  <option value="w">Weiblich</option>
                  <option value="na">Keine Angabe</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground/70 block mb-1.5">Größe (cm)</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" placeholder="175" min={140} max={220}
                  value={groesse} onChange={e => setGroesse(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-card border border-border/60 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground/70 block mb-1.5">Gewicht (kg)</label>
                <input type="number" inputMode="numeric" pattern="[0-9]*" placeholder="75" min={40} max={200}
                  value={gewicht} onChange={e => setGewicht(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-card border border-border/60 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all" />
              </div>
            </div>
            <button onClick={() => setD1Step('verhalten')} disabled={!step1Valid}
              className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ boxShadow: step1Valid ? '0 0 20px hsl(142 76% 46% / 0.25)' : undefined }}>
              Weiter →
            </button>
          </div>
        )}

        {d1Step === 'verhalten' && (
          <div className="space-y-5 animate-fade-in">
            <SelectGroup question="Wie aktiv bist du im Alltag?" options={AKTIVITAET_OPTIONS} value={aktivitaet} onChange={setAktivitaet} />
            <SelectGroup question="Was ist dein wichtigstes Ziel?" options={ZIEL_OPTIONS} value={ziel} onChange={setZiel} />
            <SelectGroup question="Wie sieht dein Essalltag wirklich aus?" options={MAHLZEITEN_OPTIONS} value={mahlzeiten} onChange={setMahlzeiten} />
            <label className={cn('flex items-start gap-3 cursor-pointer rounded-xl border p-3.5 transition-colors', dsgvoConsent ? 'border-primary/30 bg-primary/5' : 'border-border/40 bg-card')}>
              <div className="relative mt-0.5 flex-shrink-0">
                <input type="checkbox" checked={dsgvoConsent} onChange={e => setDsgvoConsent(e.target.checked)} className="sr-only" />
                <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all', dsgvoConsent ? 'bg-primary border-primary' : 'border-border/60 bg-card')}>
                  {dsgvoConsent && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7L10 1" stroke="#080808" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground/65 leading-relaxed">
                Darf CALINESS diese Werte speichern, um dir im Sprint eine persönliche Beratung zu geben? (Optional)
              </p>
            </label>
            <div className="flex gap-3">
              <button onClick={() => setD1Step('koerperdaten')} className="h-12 px-5 rounded-xl border border-border/50 text-sm text-muted-foreground/70 hover:text-foreground hover:border-border transition-all">←</button>
              <button onClick={handleD1Submit} disabled={!step2Valid}
                className="flex-1 min-h-[48px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ boxShadow: step2Valid ? '0 0 20px hsl(142 76% 46% / 0.25)' : undefined }}>
                Auswertung starten →
              </button>
            </div>
          </div>
        )}

        {d1Step === 'preview' && <PreviewCard headline={previewHeadline} />}
      </div>
    );
  }

  // ─── DAYS 2–4: schlanke 3-Fragen-Form ────────────────────────────────────────

  const handleD2Submit = () => {
    if (!schritte || !frequenz || !gefuehl) return;
    const data: Tag2Data = { schritte, frequenz, gefuehl };
    const typ = determineBewegungsTyp(data);
    setTag2Data(data, typ);
    done(getBewegungsContent(typ).headline);
  };

  const handleD3Submit = () => {
    if (!dauer || !regelmaessigkeit || !morgenBildschirm) return;
    const data: Tag3Data = { dauer, regelmaessigkeit, morgenBildschirm };
    const typ = determineSchlafTyp(data);
    setTag3Data(data, typ);
    done(getSchlafContent(typ).headline);
  };

  const handleD4Submit = () => {
    if (!kippPunkt || !stress || !abendVerhalten) return;
    const data: Tag4Data = { kippPunkt, stress, abendVerhalten };
    const { typ, trigger } = determineMentalTyp(data);
    setTag4Data(data, typ, trigger);
    done(getMentalContent(typ, trigger).headline);
  };

  const d2Valid = !!schritte && !!frequenz && !!gefuehl;
  const d3Valid = !!dauer && !!regelmaessigkeit && !!morgenBildschirm;
  const d4Valid = !!kippPunkt && !!stress && !!abendVerhalten;

  const isSlimValid = day === 2 ? d2Valid : day === 3 ? d3Valid : d4Valid;
  const handleSlimSubmit = day === 2 ? handleD2Submit : day === 3 ? handleD3Submit : handleD4Submit;

  if (slimStep === 'preview') return <PreviewCard headline={previewHeadline} />;

  return (
    <div className="w-full space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary/40 rounded-full" style={{ width: '100%' }} />
        </div>
        <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">3 Fragen</span>
      </div>

      {day === 2 && (
        <>
          <SelectGroup question="Wie viele Schritte gehst du ungefähr täglich?" options={SCHRITTE_OPTIONS} value={schritte} onChange={setSchritte} />
          <SelectGroup question="Wie oft trainierst du pro Woche?" options={FREQUENZ_OPTIONS} value={frequenz} onChange={setFrequenz} />
          <SelectGroup question="Wie fühlst du dich nach einem typischen Training?" options={GEFUEHL_OPTIONS} value={gefuehl} onChange={setGefuehl} />
        </>
      )}

      {day === 3 && (
        <>
          <SelectGroup question="Wie viele Stunden schläfst du durchschnittlich?" options={DAUER_OPTIONS} value={dauer} onChange={setDauer} />
          <SelectGroup question="Wie regelmäßig ist deine Schlafenszeit?" options={REGELMAESSIGKEIT_OPTIONS} value={regelmaessigkeit} onChange={setRegelmaessigkeit} />
          <SelectGroup question="Wie wachst du morgens auf?" options={MORGEN_OPTIONS} value={morgenBildschirm} onChange={setMorgenBildschirm} />
        </>
      )}

      {day === 4 && (
        <>
          <SelectGroup question="Wann kippt dein Tag am häufigsten?" options={KIPP_OPTIONS} value={kippPunkt} onChange={setKippPunkt} />
          <SelectGroup question="Wie ist dein allgemeiner Stresslevel?" options={STRESS_OPTIONS} value={stress} onChange={setStress} />
          <SelectGroup question="Was passiert bei dir typischerweise abends?" options={ABEND_OPTIONS} value={abendVerhalten} onChange={setAbendVerhalten} />
        </>
      )}

      <button
        onClick={handleSlimSubmit}
        disabled={!isSlimValid}
        className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ boxShadow: isSlimValid ? '0 0 20px hsl(142 76% 46% / 0.25)' : undefined }}
      >
        Auswertung starten →
      </button>
    </div>
  );
}

// ─── Preview Card (shared) ────────────────────────────────────────────────────

function PreviewCard({ headline }: { headline: string }) {
  return (
    <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 animate-fade-in">
      <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2">Deine Auswertung</p>
      <p className="text-sm font-semibold text-foreground mb-1">{headline || 'Deine Einordnung ist bereit'}</p>
      <p className="text-xs text-muted-foreground/60 leading-relaxed">
        Die vollständige Karte siehst du nach dem Abschluss.
      </p>
    </div>
  );
}
