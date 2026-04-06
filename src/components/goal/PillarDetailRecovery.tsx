import { useState } from 'react';
import { type RecoveryPlan, type TipCard, generateRecoveryTips, getMoreRecoveryTips } from '@/lib/pillarPlans';
import { type FullAssessment } from '@/lib/goalAssessment';
import { Button } from '@/components/ui/button';
import { Moon, ChevronLeft, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  Sleep: 'bg-indigo-500/10 text-indigo-400',
  Recovery: 'bg-primary/10 text-primary',
  'Rest Day': 'bg-amber-500/10 text-amber-400',
};

interface Props {
  assessment: FullAssessment;
  answers: Record<string, any>;
  onBack: () => void;
  onTipsGenerated?: (tips: TipCard[]) => void;
}

export default function PillarDetailRecovery({ assessment, answers, onBack, onTipsGenerated }: Props) {
  const [plan, setPlan] = useState<RecoveryPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      const newPlan = generateRecoveryTips(assessment, answers);
      setPlan(newPlan);
      onTipsGenerated?.(newPlan.tips);
      setLoading(false);
    }, 800);
  };

  const loadMore = () => {
    if (!plan) return;
    const more = getMoreRecoveryTips(plan.tips);
    setPlan({ ...plan, tips: [...plan.tips, ...more] });
  };

  if (!plan && !loading) {
    return (
      <div className="space-y-4 animate-enter">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <ChevronLeft className="w-4 h-4" /> Zurück
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Moon className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-outfit text-lg font-bold text-foreground">Recovery & Schlaf</h2>
            <p className="text-xs text-muted-foreground">Personalisierte Recovery-Tipps</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border/30 p-6 text-center space-y-4" style={{ background: 'var(--gradient-card)' }}>
          <Moon className="w-10 h-10 text-indigo-400/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Erhalte personalisierte Recovery-Tipps basierend auf deinem Schlaf- und Erholungsprofil.</p>
          <Button onClick={generate} className="w-full">Recovery-Tipps generieren</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-enter">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <ChevronLeft className="w-4 h-4" /> Zurück
        </button>
        <div className="rounded-2xl border border-border/30 p-8 text-center space-y-3" style={{ background: 'var(--gradient-card)' }}>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-indigo-400/40" style={{ animation: 'floatParticle 1.2s ease-in-out infinite', animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Analysiere dein Profil…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-enter">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <ChevronLeft className="w-4 h-4" /> Zurück
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <Moon className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="font-outfit text-lg font-bold text-foreground">Recovery & Schlaf</h2>
          <p className="text-xs text-muted-foreground">Deine personalisierten Tipps</p>
        </div>
      </div>

      {/* Focus Action */}
      <div className="rounded-xl border border-indigo-500/20 p-4" style={{ background: 'linear-gradient(135deg, hsl(240 60% 50% / 0.06), hsl(240 60% 50% / 0.02))' }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Dein Recovery-Fokus</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{plan!.focusAction}</p>
      </div>

      {/* Tips */}
      <div className="space-y-3">
        {plan!.tips.map((tip, i) => (
          <div key={tip.id + i} className="rounded-xl border border-border/30 p-4 space-y-2 animate-enter" style={{ background: 'var(--gradient-card)', animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">{tip.title}</p>
              <span className={cn('text-[9px] font-semibold px-2 py-0.5 rounded-full', CATEGORY_COLORS[tip.category] || 'bg-secondary/40 text-muted-foreground')}>{tip.category}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{tip.text}</p>
          </div>
        ))}
      </div>

      <button onClick={loadMore} className="w-full rounded-xl border border-border/30 p-3 flex items-center justify-center gap-2 text-xs font-medium text-primary active:scale-[0.99] transition-transform" style={{ background: 'var(--gradient-card)' }}>
        <Plus className="w-3.5 h-3.5" /> Mehr Tipps
      </button>
    </div>
  );
}
