import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { computeCompanionState, getTierMeta, getNextTier, getEvoPointsToNextTier, EVOLUTION_TIERS } from '@/lib/companionState';
import type { EvolutionTier, StreakTier } from '@/lib/companionState';
import CompanionCreature from '@/components/app/CompanionCreature';
import { Button } from '@/components/ui/button';
import { Activity, Apple, Moon, Brain, Shield, Heart, Sparkles, TrendingUp, Minus, CheckCircle2, AlertTriangle } from 'lucide-react';
import PremiumPaywall from '@/components/app/PremiumPaywall';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const PILLAR_META = [
  { key: 'bewegung' as const, label: 'Bewegung', icon: Activity, color: 'hsl(142, 76%, 46%)' },
  { key: 'ernaehrung' as const, label: 'Ernährung', icon: Apple, color: 'hsl(150, 70%, 42%)' },
  { key: 'regeneration' as const, label: 'Regeneration', icon: Moon, color: 'hsl(137, 70%, 44%)' },
  { key: 'mental' as const, label: 'Mental', icon: Brain, color: 'hsl(157, 65%, 40%)' },
];

const IMPACT_ICON = { positive: CheckCircle2, neutral: Minus, negative: AlertTriangle };
const IMPACT_COLOR = { positive: 'text-primary', neutral: 'text-muted-foreground', negative: 'text-amber-400' };

const MOOD_STATUS: Record<string, { label: string; color: string }> = {
  happy: { label: 'Zufrieden', color: 'hsl(142, 76%, 46%)' },
  celebrating: { label: 'Feiernd', color: 'hsl(45, 85%, 55%)' },
  concerned: { label: 'Nachdenklich', color: 'hsl(35, 50%, 50%)' },
  sleepy: { label: 'Ruhebedürftig', color: 'hsl(220, 30%, 50%)' },
  neutral: { label: 'Ausgeglichen', color: 'hsl(142, 55%, 40%)' },
};

const STAGE_BADGE_COLORS: Record<string, string> = {
  seedling: 'hsl(142, 40%, 30%)',
  awakening: 'hsl(142, 55%, 38%)',
  momentum: 'hsl(142, 65%, 42%)',
  mastery: 'hsl(45, 75%, 50%)',
  radiance: 'hsl(45, 90%, 55%)',
};

function StatRing({ value, max = 100, size = 44, label }: { value: number; max?: number; size?: number; label: string }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / max) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth={3} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth={3}
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: 'drop-shadow(0 0 4px hsl(142 76% 46% / 0.4))' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-outfit text-xs font-bold text-foreground">
          {Math.round(value)}
        </span>
      </div>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

function StreakArc({ streak, streakTier }: { streak: number; streakTier: StreakTier }) {
  if (streakTier === 'none') return null;
  const size = 80;
  const r = 34;
  const c = 2 * Math.PI * r;
  const arcRatio = streakTier === 'crown' ? 0.95 : streakTier === 'pulse' ? 0.75 : streakTier === 'golden' ? 0.55 : 0.35;
  const offset = c - arcRatio * c;
  const isGolden = streakTier === 'golden' || streakTier === 'pulse' || streakTier === 'crown';
  const strokeColor = isGolden ? 'hsl(45, 85%, 55%)' : 'hsl(142, 76%, 46%)';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth={2.5} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={strokeColor} strokeWidth={2.5}
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 ${isGolden ? 6 : 4}px ${strokeColor.replace(')', ' / 0.5)')})`,
              animation: streakTier === 'pulse' || streakTier === 'crown' ? 'cali-streak-arc-glow 3s ease-in-out infinite' : undefined,
            }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="font-outfit text-lg font-bold text-foreground">{streak}</span>
        </span>
      </div>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Tage Serie</span>
    </div>
  );
}

function TierTimeline({ currentTier, progress }: { currentTier: EvolutionTier; progress: number }) {
  const currentIndex = EVOLUTION_TIERS.indexOf(currentTier);
  const nextTier = getNextTier(currentTier);
  const nextMeta = nextTier ? getTierMeta(nextTier) : null;

  return (
    <div className="space-y-4">
      {/* Current tier badge */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl">{getTierMeta(currentTier).icon}</span>
        <span className="font-outfit text-lg font-bold text-foreground">{getTierMeta(currentTier).label}</span>
      </div>

      {/* Progress bar to next tier */}
      {nextMeta && (
        <div className="space-y-1.5">
          <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${progress * 100}%`,
                background: 'hsl(var(--primary))',
                boxShadow: '0 0 8px hsl(var(--primary) / 0.4)',
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Noch {Math.round((1 - progress) * 20)} Punkte bis <span className="text-foreground font-medium">{nextMeta.icon} {nextMeta.label}</span>
          </p>
        </div>
      )}

      {/* Tier timeline nodes */}
      <div className="flex items-center justify-between px-2">
        {EVOLUTION_TIERS.map((tier, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const meta = getTierMeta(tier);

          return (
            <div key={tier} className="flex flex-col items-center gap-1">
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-500 ${
                  isCompleted ? 'bg-primary border-primary' :
                  isCurrent ? 'bg-primary border-primary animate-pulse' :
                  'bg-transparent border-muted-foreground/30'
                }`}
                style={isCurrent ? { boxShadow: '0 0 8px hsl(var(--primary) / 0.5)' } : undefined}
              />
              <span className={`text-[8px] ${isCurrent ? 'text-primary font-bold' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
                {meta.icon}
              </span>
            </div>
          );
        })}
      </div>

      {/* Connecting lines */}
      <div className="flex items-center px-[18px] -mt-[42px] mb-4">
        {EVOLUTION_TIERS.slice(0, -1).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-0.5 mx-0.5"
            style={{
              background: i < currentIndex ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function AppCompanion() {
  const navigate = useNavigate();
  const { isPremium, longevityScore, pillarScores, todayCheckIn, streak, weeklyConsistency, scoreHistory, goalPlan, checkInHistory } = useApp();

  const companion = useMemo(
    () => computeCompanionState(longevityScore, pillarScores, todayCheckIn, streak, weeklyConsistency, goalPlan, checkInHistory.length),
    [longevityScore, pillarScores, todayCheckIn, streak, weeklyConsistency, goalPlan, checkInHistory.length]
  );

  const sparkData = scoreHistory.slice(-7).map(e => ({ score: e.score }));
  const moodStatus = MOOD_STATUS[companion.mood] || MOOD_STATUS.neutral;
  const stageBadgeColor = STAGE_BADGE_COLORS[companion.evolutionStage?.stage || 'seedling'];

  // Habitat background varies with evolution stage
  const habitatIntensity = companion.evolutionStage?.auraIntensity ?? 0.5;
  const isGoldenStage = companion.evolutionStage?.stage === 'mastery' || companion.evolutionStage?.stage === 'radiance';

  // ═══ FREE VERSION ═══
  if (!isPremium) {
    return (
      <PremiumPaywall feature="Companion Details">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <img src="/images/caliness-logo-white.png" alt="" className="w-5 h-5 object-contain" />
            <h1 className="font-outfit text-xl font-bold text-foreground">CALI</h1>
            <span className="text-[9px] text-muted-foreground font-medium tracking-wider uppercase">by CALINESS</span>
          </div>
          <div
            className="relative rounded-2xl overflow-hidden border border-border/30"
            style={{
              background: `
                radial-gradient(ellipse 100% 60% at 50% 30%, hsl(var(--primary) / ${0.02 + companion.coreGlow * 0.03}) 0%, transparent 60%),
                radial-gradient(ellipse 140% 80% at 50% 70%, hsl(var(--primary) / ${0.02 + companion.sanctuaryBrightness * 0.05}) 0%, transparent 60%),
                var(--gradient-card)
              `,
              boxShadow: `var(--shadow-card), 0 0 ${30 * companion.coreGlow}px hsl(var(--primary) / ${0.03 * companion.coreGlow})`,
            }}
          >
            <div className="flex flex-col items-center pt-8 pb-4">
              <CompanionCreature companionState={companion} size={240} id="comp-page" />
            </div>
            <div className="px-5 pb-5 text-center space-y-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5">
                {companion.label}
              </span>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed italic">{companion.emotionalReflection}</p>
            </div>
          </div>
        </div>
      </PremiumPaywall>
    );
  }

  // ═══ PREMIUM VIEW ═══
  return (
      <div className="px-5 pt-6 pb-4 space-y-4 animate-enter">
        {/* ═══ HEADER ═══ */}
        <div className="flex items-center gap-2">
          <img src="/images/caliness-logo-white.png" alt="" className="w-5 h-5 object-contain" />
          <h1 className="font-outfit text-xl font-bold text-foreground">CALI</h1>
          <span className="text-[9px] text-muted-foreground font-medium tracking-wider uppercase">by CALINESS</span>
        </div>

        {/* ═══ COMPANION + STATE — Living Habitat (enhanced with stage-driven background) ═══ */}
      <div
        className="relative rounded-2xl overflow-hidden border border-border/30"
        style={{
          background: `
            radial-gradient(ellipse 100% 60% at 50% 30%, ${isGoldenStage ? `hsl(45 85% 55% / ${0.03 + habitatIntensity * 0.04})` : `hsl(var(--primary) / ${0.03 + companion.coreGlow * 0.06})`} 0%, transparent 60%),
            radial-gradient(ellipse 140% 80% at 50% 70%, hsl(var(--primary) / ${0.04 + companion.sanctuaryBrightness * 0.09 * habitatIntensity}) 0%, transparent 55%),
            radial-gradient(circle at 20% 80%, hsl(var(--primary) / ${0.02 + companion.coreGlow * 0.03 * habitatIntensity}) 0%, transparent 40%),
            radial-gradient(circle at 80% 20%, ${isGoldenStage ? `hsl(45 85% 55% / ${0.02 + habitatIntensity * 0.02})` : `hsl(var(--primary) / ${0.015 + companion.coreGlow * 0.02})`} 0%, transparent 35%),
            var(--gradient-card)
          `,
          boxShadow: `var(--shadow-card), 0 0 ${60 * companion.coreGlow * habitatIntensity}px ${isGoldenStage ? `hsl(45 85% 55% / ${0.04 * habitatIntensity})` : `hsl(var(--primary) / ${0.06 * companion.coreGlow})`}, inset 0 0 ${80 * companion.sanctuaryBrightness}px hsl(var(--primary) / ${0.03 * companion.sanctuaryBrightness})`,
          minHeight: 340,
        }}
      >
        {/* Ambient atmospheric layer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 30% 20%, hsl(var(--primary) / ${0.04 * companion.coreGlow}) 0%, transparent 50%), radial-gradient(circle at 70% 80%, hsl(var(--primary) / ${0.03 * companion.coreGlow}) 0%, transparent 40%)`,
            animation: `habitat-ambient-pulse ${companion.breathCycle * 1.8}s ease-in-out infinite`,
          }}
        />

        {/* Floating habitat light motes */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
          const seeds = [
            { x: '15%', y: '25%', dx: 18, dy: -25, dx2: -8, dy2: -45, dur: 8, del: 0, sz: 2.5 },
            { x: '80%', y: '60%', dx: -15, dy: -20, dx2: 10, dy2: -40, dur: 9, del: 1.5, sz: 2 },
            { x: '45%', y: '80%', dx: 12, dy: -30, dx2: -5, dy2: -55, dur: 10, del: 3, sz: 1.8 },
            { x: '70%', y: '30%', dx: -20, dy: -18, dx2: 8, dy2: -35, dur: 7, del: 0.8, sz: 2.2 },
            { x: '25%', y: '65%', dx: 15, dy: -22, dx2: -12, dy2: -42, dur: 11, del: 2, sz: 1.5 },
            { x: '55%', y: '15%', dx: -10, dy: -15, dx2: 6, dy2: -30, dur: 8.5, del: 4, sz: 1.8 },
            { x: '90%', y: '45%', dx: -18, dy: -28, dx2: 10, dy2: -48, dur: 9.5, del: 1, sz: 1.6 },
            { x: '35%', y: '50%', dx: 14, dy: -20, dx2: -8, dy2: -38, dur: 10.5, del: 2.5, sz: 2 },
          ];
          const s = seeds[i];
          return (
            <div
              key={`hm-${i}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: s.x,
                top: s.y,
                width: s.sz * (1 + habitatIntensity * 0.3),
                height: s.sz * (1 + habitatIntensity * 0.3),
                background: isGoldenStage ? 'hsl(45 85% 55%)' : 'hsl(var(--primary))',
                opacity: 0,
                filter: 'blur(0.5px)',
                '--hm-dx': `${s.dx}px`,
                '--hm-dy': `${s.dy}px`,
                '--hm-dx2': `${s.dx2}px`,
                '--hm-dy2': `${s.dy2}px`,
                animation: `habitat-mote-drift ${s.dur}s ease-in-out infinite`,
                animationDelay: `${s.del}s`,
              } as React.CSSProperties}
            />
          );
        })}

        <div className="relative flex flex-col items-center pt-8 pb-4">
          <CompanionCreature companionState={companion} size={260} id="comp-full" interactive />
        </div>

        {/* ═══ STAGE BADGE + STATE + CALI SAYS ═══ */}
        <div className="relative px-5 pb-6 space-y-3 text-center">
          {/* Stage name badge */}
          <div className="flex items-center justify-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] rounded-full px-3 py-1"
              style={{
                color: stageBadgeColor,
                background: `${stageBadgeColor.replace(')', ' / 0.1)')}`,
                border: `1px solid ${stageBadgeColor.replace(')', ' / 0.2)')}`,
                boxShadow: `0 0 12px ${stageBadgeColor.replace(')', ' / 0.08)')}`,
              }}
            >
              {companion.evolutionStage?.stageName || 'Seedling'} Stage
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1"
              style={{ boxShadow: `0 0 20px hsl(var(--primary) / ${0.12 + companion.coreGlow * 0.12})` }}>
              {companion.label}
            </span>
          </div>

          {/* Mood status dot */}
          <div className="flex items-center justify-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: moodStatus.color,
                boxShadow: `0 0 6px ${moodStatus.color.replace(')', ' / 0.4)')}`,
              }}
            />
            <span className="text-[10px] text-muted-foreground">{moodStatus.label}</span>
          </div>

          {/* Cali says — emotional 1-liner */}
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto italic">
            {companion.caliSays || companion.emotionalReflection}
          </p>
        </div>
      </div>

      {/* ═══ STREAK + STAGE OVERVIEW ═══ */}
      <div className="rounded-2xl border border-border/30 p-5" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center justify-around">
          <StreakArc streak={streak} streakTier={companion.streakTier} />
          <div className="w-px h-12 bg-border/20" />
          <StatRing value={companion.vitality} label="Vitalität" />
          <div className="w-px h-12 bg-border/20" />
          <StatRing value={companion.harmonyScore * 100} label="Harmonie" />
        </div>
      </div>

      {/* ═══ EVOLUTION SECTION ═══ */}
      <div className="rounded-2xl border border-border/30 p-5" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">CALI wächst</span>
        </div>
        <TierTimeline currentTier={companion.evolutionTier} progress={companion.evolutionProgress} />
        <p className="text-[10px] text-muted-foreground text-center mt-2">{getTierMeta(companion.evolutionTier).description}</p>
      </div>

      {/* ═══ PILLAR INFLUENCE ═══ */}
      <div className="rounded-2xl border border-border/30 p-5 space-y-4" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Was CALI beeinflusst</span>
        </div>
        <div className="space-y-3">
          {PILLAR_META.map(p => {
            const intensity = companion.pillarIntensity[p.key];
            const score = Math.round(intensity * 100);
            const isWeakest = companion.weakestPillar === p.key;
            return (
              <div key={p.key} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-primary/15"
                  style={{
                    background: `linear-gradient(135deg, hsl(var(--primary) / ${0.06 + intensity * 0.1}) 0%, transparent 100%)`,
                    animation: isWeakest ? 'pulseWeakPillar 3s ease-in-out infinite' : undefined,
                  }}
                >
                  <p.icon className="w-3.5 h-3.5 text-primary" style={{ opacity: 0.4 + intensity * 0.6 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${isWeakest ? 'text-amber-400 font-medium' : 'text-muted-foreground'}`}>
                      {p.label} {isWeakest && '— braucht Aufmerksamkeit'}
                    </span>
                    <span className={`text-xs font-semibold ${score >= 60 ? 'text-primary' : score >= 40 ? 'text-foreground' : 'text-amber-400'}`}>{score}</span>
                  </div>
                  <div className="h-1 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${score}%`,
                        background: score >= 60 ? 'hsl(var(--primary))' : score >= 40 ? 'hsl(var(--primary) / 0.6)' : 'hsl(38, 92%, 50%)',
                        boxShadow: score > 60 ? '0 0 8px hsl(var(--primary) / 0.4)' : 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ INFLUENCES LIST ═══ */}
      {companion.influences.length > 0 && (
        <div className="rounded-2xl border border-border/30 p-5 space-y-3" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">Aktuelle Einflüsse</span>
          </div>
          {/* Primary influence */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs text-foreground font-medium">Haupteinfluss: {companion.primaryInfluence}</span>
          </div>
          <div className="space-y-1.5">
            {companion.influences.slice(0, 6).map((inf, i) => {
              const Icon = IMPACT_ICON[inf.impact];
              const color = IMPACT_COLOR[inf.impact];
              return (
                <div key={i} className="flex items-center gap-2.5 py-1">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                  <span className="text-sm text-foreground">{inf.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ ACTION SUGGESTION ═══ */}
      <div className="rounded-2xl border border-primary/20 p-4" style={{ background: 'linear-gradient(165deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--primary) / 0.02) 100%)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Was hilft jetzt</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{companion.actionSuggestion}</p>
      </div>

      {/* ═══ VITAL SIGNS ═══ */}
      <div className="rounded-2xl border border-border/30 p-5" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
        <span className="text-xs font-semibold text-foreground block mb-4">Vitalzeichen</span>
        <div className="flex justify-between">
          <StatRing value={companion.vitality} label="Vitalität" />
          <StatRing value={companion.harmonyScore * 100} label="Harmonie" />
          <StatRing value={companion.shellIntegrity * 100} label="Schild" />
          <StatRing value={companion.resilience * 100} label="Resilienz" />
        </div>
      </div>

      {/* ═══ VITALITY SPARKLINE ═══ */}
      {sparkData.length >= 3 && (
        <div className="rounded-2xl border border-border/30 p-5 space-y-3" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
          <span className="text-xs font-semibold text-foreground">7-Tage Vitalität</span>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="score" stroke="hsl(142, 76%, 46%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] text-muted-foreground">vor 7 Tagen</span>
            <span className="text-[10px] text-muted-foreground">heute</span>
          </div>
        </div>
      )}
    </div>
  );
}
