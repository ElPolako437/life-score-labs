// Reset = Diagnose + 1 Hebel. Lösung & Plan = Sprint. Spannung offen halten.

import { useReset } from '@/contexts/ResetContext';
import {
  calcTag1Energy,
  getErnaehrungsContent,
  getBewegungsContent,
  getSchlafContent,
  getMentalContent,
} from '@/lib/pillarAssessment';

interface PillarResultProps {
  day: number; // 1–4
}

const PILLAR_ICON: Record<number, string> = {
  1: '⚡',
  2: '🏃',
  3: '🌙',
  4: '🧠',
};

const PILLAR_LABEL: Record<number, string> = {
  1: 'Ernährung & Energie',
  2: 'Bewegung & Training',
  3: 'Regeneration & Schlaf',
  4: 'Mentale Klarheit',
};

export default function PillarResult({ day }: PillarResultProps) {
  const {
    ernaehrungsTyp, bewegungsTyp, schlafTyp, mentalTyp, mentalTrigger,
    tag1Data, name,
  } = useReset();

  // Get content based on day
  const content = (() => {
    if (day === 1 && ernaehrungsTyp) return getErnaehrungsContent(ernaehrungsTyp);
    if (day === 2 && bewegungsTyp) return getBewegungsContent(bewegungsTyp);
    if (day === 3 && schlafTyp) return getSchlafContent(schlafTyp);
    if (day === 4 && mentalTyp) return getMentalContent(mentalTyp, mentalTrigger);
    return null;
  })();

  const energy = day === 1 && tag1Data ? calcTag1Energy(tag1Data) : null;

  if (!content) return null;

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {/* Pillar badge */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{PILLAR_ICON[day]}</span>
        <div>
          <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">
            Säule {day}: {PILLAR_LABEL[day]}
          </p>
        </div>
      </div>

      {/* Headline */}
      <div>
        {name && (
          <p className="text-[11px] text-muted-foreground/50 mb-1">{name},</p>
        )}
        <h3 className="font-outfit text-xl font-bold text-foreground leading-tight">
          {content.headline}
        </h3>
      </div>

      {/* Einordnung */}
      <p className="text-sm text-foreground/75 leading-relaxed">
        {content.einordnung}
      </p>

      {/* Tag 1 only: Energie-Rahmen + Protein-Anker */}
      {day === 1 && energy && energy.hasValidData && (
        <div className="p-4 rounded-xl border border-primary/25 bg-primary/5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-0.5">Protein-Anker</p>
              <p className="text-2xl font-bold text-foreground">
                {energy.proteinAnker.min}<span className="text-lg text-muted-foreground/60">–{energy.proteinAnker.max} g</span>
              </p>
              <p className="text-[11px] text-muted-foreground/50">täglich</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-0.5">Energie-Rahmen</p>
              <p className="text-base font-semibold text-muted-foreground/70">
                {energy.energieRahmen.min}–{energy.energieRahmen.max}
              </p>
              <p className="text-[11px] text-muted-foreground/40">kcal (Orientierung)</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/45 leading-relaxed border-t border-border/30 pt-2.5">
            Kein Tracking-Ziel. Nur deine persönliche Orientierung.
          </p>
        </div>
      )}

      {/* Hebel */}
      <div className="p-4 rounded-xl border border-primary/40 bg-primary/5">
        <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-1.5">Dein Hebel für heute</p>
        <p className="text-sm text-foreground/90 leading-relaxed font-medium">{content.hebel}</p>
      </div>

      {/* Tagesaufgabe */}
      <div className="p-4 rounded-xl border border-border/40 bg-card/60">
        <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-1.5">Tagesaufgabe</p>
        <p className="text-sm text-foreground/80 leading-relaxed">{content.tagesaufgabe}</p>
      </div>

      {/* Sprint-Brücke (Text, kein Button — nur Tag 1 kein Button, Tag 2-4 gleich) */}
      <div className="pt-1">
        <p className="text-xs text-muted-foreground/50 leading-relaxed italic">
          {content.sprintBruecke}
        </p>
      </div>

      {/* App-Teaser — nur Tage 2-4, subtil */}
      {day > 1 && content.appTeaser && (
        <p className="text-[11px] text-muted-foreground/35 leading-relaxed">
          {content.appTeaser}
        </p>
      )}
    </div>
  );
}
