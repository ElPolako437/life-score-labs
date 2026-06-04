// Reset = Diagnose + 1 Hebel. Lösung & Plan = Sprint. Spannung offen halten.
// Tag 5: Auswertung + Muster + Sprint — Conversion-Tag, keine neuen Eingaben.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReset } from '@/contexts/ResetContext';
import {
  getSaeulenStatus, getStaerksteSaeule, getSchwaechsteSaeule,
  getHauptMuster, getMiniRahmen, getSprintNextStep,
  type SaeulenStatus,
} from '@/lib/pillarConnections';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const SAEULE_LABELS: Record<string, string> = {
  ernaehrung: 'Ernährung & Energie',
  bewegung:   'Bewegung & Training',
  schlaf:     'Regeneration & Schlaf',
  mental:     'Mentale Klarheit',
};

const SAEULE_ICONS: Record<string, string> = {
  ernaehrung: '⚡', bewegung: '🏃', schlaf: '🌙', mental: '🧠',
};

const TYP_LABEL: Record<string, string> = {
  // Ernährung
  chaos:                 'Kein Rhythmus',
  craving:               'Abend-Craving',
  struktur:              'Fehlende Struktur',
  stabil:                'Stabile Basis',
  // Bewegung
  unteraktiviert:        'Unteraktiviert',
  ueberlastet:           'Überlastet',
  unstrukturiert:        'Unstrukturiert',
  // Schlaf
  'zu-wenig':            'Zu wenig Schlaf',
  rhythmus:              'Kein Rhythmus',
  abschalten:            'Abschaltproblem',
  regeneration:          'Qualitätsproblem',
  // Mental
  'emotionales-essen':   'Emotionales Essen',
  reizueberflutung:      'Reizüberflutung',
  'decision-fatigue':    'Decision Fatigue',
};

function StatusBadge({ status }: { status: SaeulenStatus }) {
  return (
    <span className={cn(
      'text-[10px] font-semibold px-2 py-0.5 rounded-full',
      status === 'stark'  && 'bg-primary/15 text-primary',
      status === 'mittel' && 'bg-border/40 text-muted-foreground/70',
      status === 'schwach'&& 'bg-amber-500/15 text-amber-400',
    )}>
      {status === 'stark' ? 'Stabile Basis' : status === 'mittel' ? 'Potenzial' : 'Größter Hebel'}
    </span>
  );
}

function AccordionBlock({
  title, preview, children, open, onToggle,
}: {
  title: string;
  preview: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-4 text-left bg-card/60 hover:bg-card transition-colors"
      >
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {!open && <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">{preview}</p>}
        </div>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground/50 flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ResetSynthesis() {
  const navigate = useNavigate();
  const {
    name, goal,
    ernaehrungsTyp, bewegungsTyp, schlafTyp, mentalTyp, mentalTrigger,
  } = useReset();

  const [blockBOpen, setBlockBOpen] = useState(false);
  const [blockCOpen, setBlockCOpen] = useState(false);

  const ov = getSaeulenStatus(ernaehrungsTyp, bewegungsTyp, schlafTyp, mentalTyp);
  const staerkste = getStaerksteSaeule(ov);
  const schwaechste = getSchwaechsteSaeule(ov);
  const hauptMuster = getHauptMuster(ernaehrungsTyp, bewegungsTyp, schlafTyp, mentalTyp);
  const miniRahmen = getMiniRahmen(ernaehrungsTyp, bewegungsTyp, schlafTyp, mentalTyp, mentalTrigger, ov);
  const sprintSchritt = getSprintNextStep(schwaechste, goal ?? null);

  const saeuleEntries = Object.entries(ov) as [keyof typeof ov, SaeulenStatus][];

  const currentTyp = (saeule: string): string => {
    const map: Record<string, string | null> = {
      ernaehrung: ernaehrungsTyp, bewegung: bewegungsTyp, schlaf: schlafTyp, mental: mentalTyp,
    };
    const t = map[saeule];
    return t ? (TYP_LABEL[t] ?? t) : 'Noch offen';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <div className="max-w-sm mx-auto w-full animate-fade-in">

        {/* Header */}
        <button onClick={() => navigate('/week')} className="text-xs text-muted-foreground/60 mb-4 hover:text-muted-foreground transition-colors">
          ← Übersicht
        </button>

        <p className="text-xs text-primary font-semibold tracking-widest uppercase mb-1">Tag 5 von 5</p>
        <div className="w-full h-1.5 bg-secondary rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: '100%', boxShadow: '0 0 8px hsl(142 76% 46% / 0.5)' }} />
        </div>

        <h1 className="font-outfit text-2xl font-bold text-foreground mb-2 leading-tight">
          {name ? `${name}, deine Auswertung.` : 'Deine Auswertung.'}
        </h1>
        <p className="text-sm text-muted-foreground/70 mb-8">
          5 Tage Beobachtung. Jetzt siehst du was das bedeutet.
        </p>

        {/* ── BLOCK A: Deine 4 Säulen (immer sichtbar) ───────────────────────── */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3">Deine 4 Säulen</p>
          <div className="grid grid-cols-2 gap-2.5">
            {saeuleEntries.map(([key, status]) => {
              const isStaerkste = key === staerkste;
              const isSchwaechste = key === schwaechste;
              return (
                <div
                  key={key}
                  className={cn(
                    'p-3 rounded-xl border flex flex-col gap-1.5',
                    isStaerkste  && 'border-primary/30 bg-primary/5',
                    isSchwaechste && 'border-amber-500/30 bg-amber-500/5',
                    !isStaerkste && !isSchwaechste && 'border-border/40 bg-card/60',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{SAEULE_ICONS[key]}</span>
                    {isStaerkste && <span className="text-[9px] text-primary font-semibold">STÄRKE</span>}
                    {isSchwaechste && <span className="text-[9px] text-amber-400 font-semibold">FOKUS</span>}
                  </div>
                  <p className="text-[11px] font-semibold text-foreground/80 leading-tight">{SAEULE_LABELS[key]}</p>
                  <p className="text-[10px] text-muted-foreground/55">{currentTyp(key)}</p>
                  <StatusBadge status={status} />
                </div>
              );
            })}
          </div>

          {/* Stärkste / Schwächste Zusammenfassung */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-1">Darauf baust du auf</p>
              <p className="text-xs text-foreground/80">{SAEULE_ICONS[staerkste]} {SAEULE_LABELS[staerkste]}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mb-1">Größter Hebel</p>
              <p className="text-xs text-foreground/80">{SAEULE_ICONS[schwaechste]} {SAEULE_LABELS[schwaechste]}</p>
            </div>
          </div>
        </div>

        {/* ── BLOCK B: Dein Hauptmuster (ausklappbar) ─────────────────────────── */}
        <div className="mb-3">
          <AccordionBlock
            title="Dein Hauptmuster"
            preview={hauptMuster.split('.')[0] + '.'}
            open={blockBOpen}
            onToggle={() => setBlockBOpen(v => !v)}
          >
            <p className="text-sm text-foreground/80 leading-relaxed mb-3">{hauptMuster}</p>
            <p className="text-xs text-muted-foreground/55 leading-relaxed italic">
              Du musst nicht alle vier Säulen gleichzeitig anpacken. Eine zieht den Rest.
            </p>
          </AccordionBlock>
        </div>

        {/* ── BLOCK C: Dein Mini-Rahmen (ausklappbar) ─────────────────────────── */}
        <div className="mb-6">
          <AccordionBlock
            title="Dein Mini-Rahmen"
            preview="Ein Hebel pro Säule."
            open={blockCOpen}
            onToggle={() => setBlockCOpen(v => !v)}
          >
            <div className="space-y-3 mb-3">
              {miniRahmen.map(entry => (
                <div
                  key={entry.label}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border',
                    entry.status === 'schwach' ? 'border-amber-500/25 bg-amber-500/5' : 'border-border/40 bg-card/50',
                  )}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{entry.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-muted-foreground/60 mb-0.5">{entry.label}</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{entry.hebel}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/45 italic leading-relaxed">
              Das ist noch kein vollständiger Plan. Es ist dein erster Mini-Rahmen.
            </p>
          </AccordionBlock>
        </div>

        {/* ── BLOCK D: Sprint-Brücke + CTA (immer sichtbar) ──────────────────── */}
        <div className="space-y-4">
          {/* Metapher */}
          <div className="p-4 rounded-xl border border-border/30 bg-card/50">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Das ist deine Landkarte. <span className="text-foreground font-medium">Der Sprint ist die Route.</span>
            </p>
            <p className="text-xs text-muted-foreground/55 mt-2 leading-relaxed">{sprintSchritt}</p>
          </div>

          {/* David & Sarah */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 flex-shrink-0">
              <img src="/images/david.jpg" alt="David" loading="lazy" className="w-9 h-9 rounded-full object-cover ring-2 ring-background" />
              <img src="/images/sarah.jpg" alt="Sarah" loading="lazy" className="w-9 h-9 rounded-full object-cover ring-2 ring-background" />
            </div>
            <p className="text-xs text-muted-foreground/60 leading-snug">
              David & Sarah schauen sich deine Situation persönlich an.
            </p>
          </div>

          {/* Primär-CTA */}
          <button
            onClick={() => navigate('/next')}
            className="w-full min-h-[52px] rounded-xl flex items-center justify-center gap-2 text-base font-semibold transition-all duration-200"
            style={{ background: 'hsl(142 76% 46% / 1)', color: '#080808', boxShadow: '0 0 24px hsl(142 76% 46% / 0.35)' }}
          >
            Ich will meinen persönlichen Plan
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-muted-foreground/40 text-center">Kostenlos ansehen, keine Verpflichtung</p>

          {/* Sekundär: App-Warteliste */}
          <div className="pt-2 border-t border-border/20">
            <p className="text-xs text-muted-foreground/50 leading-relaxed mb-2">
              Noch nicht bereit für den Sprint? Wir bauen gerade die CALINESS App, damit du deine 4 Säulen langfristig tracken kannst.
            </p>
            <button
              onClick={() => navigate('/next')}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground/70 underline underline-offset-2 transition-colors"
            >
              Frühen Zugang sichern →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
