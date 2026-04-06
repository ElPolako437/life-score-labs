import { type FullAssessment, type SubIndicator } from '@/lib/goalAssessment';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, Activity, Apple, Moon, Brain, CheckCircle2, AlertTriangle, Minus } from 'lucide-react';

const PILLAR_ICONS = {
  bewegung: Activity,
  ernaehrung: Apple,
  regeneration: Moon,
  mental: Brain,
};

const PILLAR_COLORS = {
  bewegung: 'hsl(var(--primary))',
  ernaehrung: 'hsl(30, 80%, 55%)',
  regeneration: 'hsl(260, 60%, 60%)',
  mental: 'hsl(200, 70%, 55%)',
};

interface GoalPillarAssessmentProps {
  assessment: FullAssessment;
  onContinue: () => void;
  onBack: () => void;
}

export default function GoalPillarAssessment({ assessment, onContinue, onBack }: GoalPillarAssessmentProps) {
  return (
    <div className="space-y-4 animate-enter">
      {/* Header */}
      <div>
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">4-Säulen-Analyse</span>
        <h2 className="font-outfit text-xl font-bold text-foreground mt-1">Dein Ziel hängt von allen 4 Säulen ab</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Nicht nur Ernährung oder Training — jede Säule beeinflusst deinen Erfolg.
        </p>
      </div>

      {/* Overall Score */}
      <div className="flex items-center justify-center py-3">
        <div className="flex flex-col items-center">
          <span className="font-outfit text-4xl font-bold text-foreground">{assessment.overallScore}</span>
          <span className="text-xs text-muted-foreground">Gesamt-Bereitschaft</span>
        </div>
      </div>

      {/* Pillar Cards */}
      <div className="space-y-3">
        {assessment.pillars.map(pillar => {
          const Icon = PILLAR_ICONS[pillar.key as keyof typeof PILLAR_ICONS] || Activity;
          const color = PILLAR_COLORS[pillar.key as keyof typeof PILLAR_COLORS] || 'hsl(var(--primary))';
          const scoreColor = pillar.score >= 66 ? 'text-primary' : pillar.score >= 33 ? 'text-amber-400' : 'text-destructive';

          return (
            <div key={pillar.key} className="rounded-2xl border border-border/40 overflow-hidden" style={{ background: 'var(--gradient-card)' }}>
              {/* Pillar Header */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: color + '15', border: `1px solid ${color}30` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{pillar.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 rounded-full bg-secondary/40 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pillar.score}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className={cn('text-xs font-bold', scoreColor)}>{pillar.score}</span>
                  </div>
                </div>
              </div>

              {/* Sub-Indicators */}
              <div className="px-4 pb-3 space-y-1.5">
                {pillar.subIndicators.map((sub, i) => (
                  <SubIndicatorRow key={i} indicator={sub} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Key Insight */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
        <p className="text-xs text-primary font-semibold mb-1">Kernbotschaft</p>
        <p className="text-sm text-foreground leading-relaxed">
          {assessment.overallScore >= 66
            ? 'Deine Ausgangslage ist gut. Halte die Konsistenz — das ist dein wichtigster Hebel.'
            : assessment.overallScore >= 33
            ? 'Es gibt klare Hebel für Verbesserung. Fokussiere auf die roten Indikatoren.'
            : 'Dein Ziel ist erreichbar, aber erfordert gezielte Anpassungen in mehreren Bereichen.'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-none">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button className="flex-1" onClick={onContinue}>
          Ziel-Dashboard <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function SubIndicatorRow({ indicator }: { indicator: SubIndicator }) {
  const StatusIcon = indicator.status === 'green' ? CheckCircle2 : indicator.status === 'red' ? AlertTriangle : Minus;
  const statusColor = indicator.status === 'green' ? 'text-primary' : indicator.status === 'red' ? 'text-destructive' : 'text-amber-400';
  const dotColor = indicator.status === 'green' ? 'bg-primary' : indicator.status === 'red' ? 'bg-destructive' : 'bg-amber-400';

  return (
    <div className="flex items-start gap-2.5 py-1">
      <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', dotColor)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-foreground">{indicator.label}</p>
          <StatusIcon className={cn('w-3 h-3 shrink-0', statusColor)} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{indicator.detail}</p>
      </div>
    </div>
  );
}
