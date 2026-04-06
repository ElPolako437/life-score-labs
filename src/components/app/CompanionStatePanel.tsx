import type { CompanionData } from '@/lib/companionState';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Sparkles, TrendingDown, TrendingUp, Minus, Lightbulb, Heart } from 'lucide-react';

interface CompanionStatePanelProps {
  companion: CompanionData;
  open: boolean;
  onClose: () => void;
}

const IMPACT_ICON = {
  positive: TrendingUp,
  neutral: Minus,
  negative: TrendingDown,
};

const IMPACT_COLOR = {
  positive: 'text-primary',
  neutral: 'text-muted-foreground',
  negative: 'text-destructive',
};

export default function CompanionStatePanel({ companion, open, onClose }: CompanionStatePanelProps) {
  const topInfluences = companion.influences.slice(0, 4);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t border-border/40 px-5 pb-8 pt-3 max-h-[70vh]" style={{ background: 'var(--gradient-card)' }}>
        {/* Drag handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-border/60" />
        </div>

        {/* State header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-primary/20"
            style={{
              background: `radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)`,
            }}
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-outfit text-base font-semibold text-foreground">{companion.label}</p>
            <p className="text-xs text-muted-foreground">Vitalität {companion.vitality}/100</p>
          </div>
        </div>

        {/* Insight */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">{companion.insight}</p>

        {/* Influences */}
        {topInfluences.length > 0 && (
          <div className="space-y-2 mb-5">
            <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-semibold">Was deinen Companion beeinflusst</span>
            <div className="space-y-1.5">
              {topInfluences.map((inf, i) => {
                const Icon = IMPACT_ICON[inf.impact];
                const color = IMPACT_COLOR[inf.impact];
                return (
                  <div key={i} className="flex items-center gap-2.5 py-1.5">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                    <span className="text-sm text-foreground">{inf.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action suggestion */}
        <div
          className="rounded-xl border border-primary/15 p-4 space-y-2 mb-4"
          style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.04) 0%, transparent 100%)` }}
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">Nächster Schritt</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{companion.actionSuggestion}</p>
        </div>

        {/* Emotional reflection */}
        <div className="flex items-start gap-2.5 px-1">
          <Heart className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed italic">{companion.emotionalReflection}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
