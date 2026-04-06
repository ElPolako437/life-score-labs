import { useState } from 'react';
import { type MentalPlan, type MentalTip, generateMentalTips, getMoreMentalTips } from '@/lib/pillarPlans';
import { type FullAssessment } from '@/lib/goalAssessment';
import { Button } from '@/components/ui/button';
import { Brain, ChevronLeft, Plus, Sparkles, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  Stress: 'bg-amber-500/10 text-amber-400',
  Mindset: 'bg-primary/10 text-primary',
  Routine: 'bg-blue-500/10 text-blue-400',
  'Emotional Eating': 'bg-rose-500/10 text-rose-400',
};

interface Props {
  assessment: FullAssessment;
  answers: Record<string, any>;
  onBack: () => void;
  onTipsGenerated?: (tips: MentalTip[]) => void;
}

export default function PillarDetailMental({ assessment, answers, onBack, onTipsGenerated }: Props) {
  const [plan, setPlan] = useState<MentalPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      const newPlan = generateMentalTips(assessment, answers);
      setPlan(newPlan);
      onTipsGenerated?.(newPlan.tips);
      setLoading(false);
    }, 800);
  };

  const loadMore = () => {
    if (!plan) return;
    const more = getMoreMentalTips(plan.tips);
    setPlan({ ...plan, tips: [...plan.tips, ...more] });
  };

  if (!plan && !loading) {
    return (
      <div className="space-y-4 animate-enter">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <ChevronLeft className="w-4 h-4" /> Zurück
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-outfit text-lg font-bold text-foreground">Mentale Balance</h2>
            <p className="text-xs text-muted-foreground">Personalisierte Stress- & Mindset-Tipps</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border/30 p-6 text-center space-y-4" style={{ background: 'var(--gradient-card)' }}>
          <Brain className="w-10 h-10 text-amber-400/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Erhalte personalisierte Tipps für Stressmanagement, Mindset und emotionale Balance.</p>
          <Button onClick={generate} className="w-full">Mental-Tipps generieren</Button>
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
              <div key={i} className="w-2 h-2 rounded-full bg-amber-400/40" style={{ animation: 'floatParticle 1.2s ease-in-out infinite', animationDelay: `${i * 200}ms` }} />
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
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="font-outfit text-lg font-bold text-foreground">Mentale Balance</h2>
          <p className="text-xs text-muted-foreground">Deine personalisierten Tipps</p>
        </div>
      </div>

      {/* Focus Action */}
      <div className="rounded-xl border border-amber-500/20 p-4" style={{ background: 'linear-gradient(135deg, hsl(40 80% 50% / 0.06), hsl(40 80% 50% / 0.02))' }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Dein Mental-Fokus</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{plan!.focusAction}</p>
      </div>

      {/* Craving Card */}
      {plan!.cravingCard && (
        <div className="rounded-xl border border-rose-500/20 p-4 space-y-2" style={{ background: 'linear-gradient(135deg, hsl(350 70% 50% / 0.06), hsl(350 70% 50% / 0.02))' }}>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">{plan!.cravingCard.title}</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{plan!.cravingCard.text}</p>
        </div>
      )}

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
