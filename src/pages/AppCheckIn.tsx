import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, type DailyCheckIn } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import CompanionCreature from '@/components/app/CompanionCreature';
import AnimatedScore from '@/components/app/AnimatedScore';
import { computeCompanionState } from '@/lib/companionState';
import { calculatePillarScores, calculateLongevityScore, calculateRollingLongevityScore, getQuickRecommendation } from '@/lib/scoring';
import { calculateBioAgeDelta, formatBioAgeDelta } from '@/lib/bioAge';
import { pillarBarStyle } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { Activity, Apple, Moon, Brain, Sparkles, Target, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { rulesCheckInFeedback } from '@/lib/rulesEngine';
import { callAI } from '@/lib/aiWrapper';

/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */

const SLEEP_OPTIONS = [
  { label: 'Schlecht', sub: '<5.5h', sleepHours: 4.5, sleepQuality: 3 },
  { label: 'Okay', sub: '~6h', sleepHours: 5.5, sleepQuality: 5 },
  { label: 'Gut', sub: '~7h', sleepHours: 7, sleepQuality: 7 },
  { label: 'Sehr gut', sub: '8h+', sleepHours: 8.5, sleepQuality: 9 },
];

const RECOVERY_OPTIONS = [
  { label: 'Ausgelaugt', desc: 'Ich fühle mich nicht erholt', value: 2 },
  { label: 'Unerholt', desc: 'Schlechter Start', value: 4 },
  { label: 'Okay', desc: 'Es geht so', value: 6 },
  { label: 'Gut erholt', desc: 'Ich bin bereit', value: 8 },
  { label: 'Vollständig', desc: 'Ausgezeichnet', value: 10 },
];

const ENERGY_OPTIONS = [
  { label: 'Leer', desc: 'Ich funktioniere kaum', value: 2 },
  { label: 'Niedrig', desc: 'Mit Mühe', value: 4 },
  { label: 'Okay', desc: 'Durchschnittlich', value: 6 },
  { label: 'Gut', desc: 'Auf dem Level', value: 8 },
  { label: 'Stark', desc: 'In meiner Kraft', value: 10 },
];

const STRESS_OPTIONS = [
  { label: 'Entspannt', desc: 'Kaum Druck', value: 2 },
  { label: 'Leicht', desc: 'Spürbar, handhabbar', value: 4 },
  { label: 'Mittel', desc: 'Es fordert mich', value: 6 },
  { label: 'Hoch', desc: 'Ich bin unter Druck', value: 8 },
  { label: 'Sehr hoch', desc: 'Dauerhaft unter Last', value: 10 },
];

const MOOD_OPTIONS = [
  { label: 'Benebelt', desc: 'Kein klarer Gedanke', value: 2 },
  { label: 'Unkonz.', desc: 'Springend', value: 4 },
  { label: 'Okay', desc: 'Mittel', value: 6 },
  { label: 'Klar', desc: 'Ich denke gut', value: 8 },
  { label: 'Fokussiert', desc: 'Scharf', value: 10 },
];

const MOVEMENT_OPTIONS = [
  { label: 'Kaum bewegt', desc: 'Hauptsächlich sitzend', steps: 1500, training: false },
  { label: 'Leicht aktiv', desc: 'Bewegt, kein Training', steps: 5000, training: false },
  { label: 'Aktiv', desc: 'Training gemacht', steps: 9000, training: true },
  { label: 'Sehr aktiv', desc: 'Intensives Training', steps: 14000, training: true },
];

const NUTRITION_OPTIONS = [
  { label: 'Chaotisch', desc: 'Kaum Struktur', value: 'schlecht' },
  { label: 'Ausbaufähig', desc: 'Nicht ideal', value: 'okay' },
  { label: 'Solide', desc: 'Bewusste Entscheidungen', value: 'gut' },
  { label: 'Sehr bewusst', desc: 'Vollständig getroffen', value: 'sehr_gut' },
];

const HYDRATION_OPTIONS = [
  { label: 'Wenig', sub: '<1.5 L', value: 'wenig' },
  { label: 'Okay', sub: '1.5–2 L', value: 'okay' },
  { label: 'Gut', sub: '2 L+', value: 'gut' },
];

const PILLAR_META = [
  { key: 'bewegung', label: 'Bewegung', Icon: Activity },
  { key: 'ernaehrung', label: 'Ernährung', Icon: Apple },
  { key: 'regeneration', label: 'Schlaf', Icon: Moon },
  { key: 'mental', label: 'Mental', Icon: Brain },
];

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function getCheckinGreeting(step: number): { title: string; subtitle: string } {
  const h = new Date().getHours();
  if (step === 0) {
    if (h < 12) return { title: 'Guten Morgen', subtitle: 'Wie bist du aufgewacht?' };
    if (h < 18) return { title: 'Tag-Check', subtitle: 'Wie läuft dein Tag körperlich?' };
    return { title: 'Abend-Check', subtitle: 'Wie hat sich dein Körper erholt?' };
  }
  if (step === 1) return { title: 'Energie & Geist', subtitle: 'Wie läuft es mental?' };
  return { title: 'Dein Tag', subtitle: 'Was war heute los?' };
}

function pillarLevel(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 70) return { label: 'stark', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' };
  if (score >= 50) return { label: 'gut', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' };
  if (score >= 32) return { label: 'mittel', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' };
  return { label: 'gering', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30' };
}

function getSystemstatus(
  pillars: { bewegung: number; ernaehrung: number; regeneration: number; mental: number },
  stress: number, recovery: number, energy: number
): { label: string; sentence: string } {
  const avg = (pillars.bewegung + pillars.ernaehrung + pillars.regeneration + pillars.mental) / 4;
  const entries = Object.entries(pillars).sort((a, b) => a[1] - b[1]);
  const weakest = entries[0][0];
  const LABELS: Record<string, string> = { bewegung: 'Bewegung', ernaehrung: 'Ernährung', regeneration: 'Regeneration', mental: 'Mentale Balance' };

  if (stress >= 8 && recovery <= 4)
    return { label: 'Nervensystem unter Last', sentence: 'Hoher Stress trifft auf niedrige Erholung. Entlastung hat heute absoluten Vorrang.' };
  if (pillars.regeneration >= 75 && energy >= 8)
    return { label: 'Gut regeneriert', sentence: 'Dein Körper hat sich erholt und deine Energie ist hoch. Heute ist ein starker Tag.' };
  if (stress >= 8)
    return { label: 'Mentale Last spürbar', sentence: 'Hoher Stress heute. Bewusste Entlastungsmomente sind jetzt wichtiger als Leistung.' };
  if (pillars.mental >= 70 && pillars.regeneration >= 70)
    return { label: 'Stabil und fokussiert', sentence: 'Geist und Erholung sind heute im Einklang — nutze diesen Zustand bewusst.' };
  if (avg >= 65)
    return { label: 'System läuft stark', sentence: `Dein Profil ist heute solide. ${LABELS[weakest]} ist der einzige Bereich, den du beobachten solltest.` };
  if (avg >= 45)
    return { label: 'Solide mit klarem Hebel', sentence: `Gute Basis heute. ${LABELS[weakest]} zieht deinen Gesamtwert am stärksten nach unten.` };
  return { label: 'Erholung priorisieren', sentence: 'Mehrere Säulen sind heute niedrig. Dein System sendet klare Signale — höre hin.' };
}

function getHauptHebel(weakest: string, stress: number): { pillar: string; reason: string } {
  const LABELS: Record<string, string> = { bewegung: 'Bewegung', ernaehrung: 'Ernährung', regeneration: 'Schlaf & Erholung', mental: 'Mentale Balance' };
  const reasons: Record<string, string> = {
    bewegung: 'Mehr Bewegung heute würde deine Energie und deinen Gesamtscore direkt verbessern.',
    ernaehrung: 'Deine Ernährung ist heute der limitierende Faktor für Energie und Regeneration.',
    regeneration: 'Dein Körper hat sich nicht vollständig erholt. Regeneration ist heute dein stärkster Hebel.',
    mental: stress >= 7
      ? 'Hoher Stress komprimiert alle anderen Bereiche. Mentale Entlastung hat heute Priorität.'
      : 'Mentale Klarheit und Fokus sind heute dein Hebel für eine bessere Tagesleistung.',
  };
  return { pillar: LABELS[weakest] || weakest, reason: reasons[weakest] || `${LABELS[weakest]} ist heute dein stärkster Hebel.` };
}

function getPriorityAction(weakest: string): { label: string; action: string } {
  const time = getTimeOfDay();
  const actions: Record<string, Record<string, { label: string; action: string }>> = {
    morning: {
      bewegung: { label: 'Bewegung starten', action: 'Morgenspaziergang oder Training heute einplanen' },
      ernaehrung: { label: 'Protein-Start', action: 'Starte mit 30g Protein — das setzt den Ton für den Tag' },
      regeneration: { label: 'Schonend starten', action: 'Bewusst langsam in den Tag — keine Überbelastung heute' },
      mental: { label: 'Atemübung', action: '3 Min bewusstes Atmen — vor dem ersten Meeting' },
    },
    afternoon: {
      bewegung: { label: '10 Min gehen', action: 'Kurze Gehpause jetzt — Energie und Fokus steigen direkt' },
      ernaehrung: { label: 'Protein-Mahlzeit', action: 'Nächste Mahlzeit mit ausreichend Protein und Gemüse' },
      regeneration: { label: 'Regenerationspause', action: '15 Min Pause einlegen — liegen oder kurz schlafen' },
      mental: { label: 'Stille-Pause', action: '5 Minuten ohne Reize — Handy weg, Augen zu' },
    },
    evening: {
      bewegung: { label: 'Leichte Dehnung', action: '10 Min Mobilität oder Spaziergang vor dem Schlafen' },
      ernaehrung: { label: 'Leichtes Abendessen', action: 'Nicht zu spät, nicht zu schwer — und ausreichend Protein' },
      regeneration: { label: 'Schlaf-Routine', action: 'Bildschirm aus, Licht dimmen, spätestens um 22 Uhr' },
      mental: { label: 'Tag abschließen', action: 'Schreib 3 Dinge auf, die heute gut waren' },
    },
  };
  return actions[time][weakest] || actions[time].bewegung;
}

const HEUTE_ZAEHLT: Record<string, string> = {
  bewegung: 'Kein Bewegungsreiz heute senkt morgen deine Basalenergie.',
  ernaehrung: 'Fehlende Nährstoffe heute verlangsamen Regeneration und Konzentration.',
  regeneration: 'Schlechte Erholung erhöht morgen Hunger, Stress und Fehlerrate messbar.',
  mental: 'Unverarbeiteter Stress heute beeinträchtigt deinen Schlaf heute Nacht direkt.',
};

function getWeeklyPattern(history: DailyCheckIn[]): string | null {
  if (history.length < 3) return null;
  const last7 = history.slice(-7);
  const counts: Record<string, number> = { bewegung: 0, ernaehrung: 0, regeneration: 0, mental: 0 };
  last7.forEach(ci => {
    const p = calculatePillarScores(ci);
    const w = Object.entries(p).sort((a, b) => a[1] - b[1])[0][0];
    if (counts[w] !== undefined) counts[w]++;
  });
  const [top, freq] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (freq < 2) return null;
  const LABELS: Record<string, string> = { bewegung: 'Bewegung', ernaehrung: 'Ernährung', regeneration: 'Regeneration', mental: 'Mentale Balance' };
  return `Diese Woche war ${LABELS[top]} dein häufigster Schwachpunkt.`;
}

const PILLAR_LABELS_MAP: Record<string, string> = {
  bewegung: 'Bewegung', ernaehrung: 'Ernährung', regeneration: 'Regeneration', mental: 'Mentale Balance',
};

function GoalCheckInRelevance({ checkIn, goalPlan, pillars }: { checkIn: DailyCheckIn; goalPlan: any; pillars: any }) {
  const goalType = goalPlan.goalType;
  const focusPillar = goalPlan.weeklyPlan?.focusPillar;
  let observation = '';
  if (goalType === 'sleep_improvement') {
    if (checkIn.sleepHours >= 7.5) observation = 'Deine Schlafzeit heute unterstützt dein Ziel direkt.';
    else if (checkIn.sleepHours < 6) observation = 'Kurze Nacht — heute Abend: früh ins Bett, kein Bildschirm.';
    else observation = 'Solider Schlaf. Für dein Ziel wären 7.5h+ der nächste Schritt.';
  } else if (goalType === 'fat_loss') {
    if (checkIn.training) observation = 'Training erledigt — das pusht deinen Stoffwechsel direkt Richtung Ziel.';
    else if (checkIn.alcohol) observation = 'Alkohol bremst Fettverbrennung. Morgen wieder fokussiert.';
    else observation = 'Ernährung und Bewegung zusammen — das ist dein stärkster Hebel.';
  } else if (goalType === 'stress_reduction') {
    if (checkIn.stress <= 4) observation = 'Niedriger Stress heute — genau das baut Resilienz auf.';
    else if (checkIn.stress >= 7) observation = 'Hoher Stress — nutze heute bewusst eine Dekompressions-Pause.';
    else observation = 'Moderater Stress. Deine Routinen halten dich stabil.';
  } else if (goalType === 'energy_recovery') {
    if (checkIn.energy >= 7) observation = 'Hohe Energie — deine Balance-Arbeit zeigt Wirkung.';
    else if (checkIn.energy <= 4) observation = 'Niedrige Energie. Schlaf und Protein heute priorisieren.';
    else observation = 'Stabile Energie. Konsistenz ist dein stärkster Hebel.';
  } else if (focusPillar) {
    const focusKey = Object.entries(PILLAR_LABELS_MAP).find(([_, v]) => v === focusPillar)?.[0] || '';
    const focusScore = pillars[focusKey] || 50;
    observation = focusScore >= 70
      ? `${focusPillar} bei ${focusScore} — dein Fokus-Bereich ist heute stark.`
      : `${focusPillar} bei ${focusScore} — hier liegt dein größtes Potenzial.`;
  }
  if (!observation) return null;
  return <p className="text-xs text-muted-foreground leading-relaxed">{observation}</p>;
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */

export default function AppCheckIn() {
  const navigate = useNavigate();
  const {
    submitCheckIn, checkInHistory, longevityScore, pillarScores: appPillars,
    streak, weeklyConsistency, goalPlan, profile, scoreHistory, isPremium,
  } = useApp();

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [revealPhase, setRevealPhase] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);

  const today = new Date().toISOString().split('T')[0];
  const alreadyDoneToday = checkInHistory.some(c => c.date === today);

  // Screen 1 — Erholung & Schlaf
  const [recoveryLevel, setRecoveryLevel] = useState<number | null>(null);
  const [sleepIndex, setSleepIndex] = useState<number | null>(null);

  // Screen 2 — Energie & Geist
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [moodLevel, setMoodLevel] = useState<number | null>(null);
  const [hadRealBreaks, setHadRealBreaks] = useState(false);

  // Screen 3 — Dein Tag
  const [movementIndex, setMovementIndex] = useState<number | null>(null);
  const [proteinQuality, setProteinQuality] = useState('gut');
  const [hydration, setHydration] = useState<'wenig' | 'okay' | 'gut'>('okay');
  const [alcohol, setAlcohol] = useState(false);
  const [screenTimeNight, setScreenTimeNight] = useState(false);

  const totalSteps = 3;
  const progress = ((step + 1) / (totalSteps + 1)) * 100;
  const greeting = getCheckinGreeting(step);

  const startEditing = useCallback(() => {
    const existing = checkInHistory.find(c => c.date === today);
    if (existing) {
      const si = SLEEP_OPTIONS.reduce((best, opt, i) =>
        Math.abs(opt.sleepHours - existing.sleepHours) < Math.abs(SLEEP_OPTIONS[best].sleepHours - existing.sleepHours) ? i : best, 0);
      setSleepIndex(si);
      const ri = RECOVERY_OPTIONS.reduce((best, opt, i) =>
        Math.abs(opt.value - existing.recovery) < Math.abs(RECOVERY_OPTIONS[best].value - existing.recovery) ? i : best, 0);
      setRecoveryLevel(RECOVERY_OPTIONS[ri].value);
      const ei = ENERGY_OPTIONS.reduce((best, opt, i) =>
        Math.abs(opt.value - existing.energy) < Math.abs(ENERGY_OPTIONS[best].value - existing.energy) ? i : best, 0);
      setEnergyLevel(ENERGY_OPTIONS[ei].value);
      const sti = STRESS_OPTIONS.reduce((best, opt, i) =>
        Math.abs(opt.value - existing.stress) < Math.abs(STRESS_OPTIONS[best].value - existing.stress) ? i : best, 0);
      setStressLevel(STRESS_OPTIONS[sti].value);
      const mi = MOOD_OPTIONS.reduce((best, opt, i) =>
        Math.abs(opt.value - existing.mood) < Math.abs(MOOD_OPTIONS[best].value - existing.mood) ? i : best, 0);
      setMoodLevel(MOOD_OPTIONS[mi].value);
      const mvi = MOVEMENT_OPTIONS.reduce((best, opt, i) =>
        Math.abs(opt.steps - existing.steps) < Math.abs(MOVEMENT_OPTIONS[best].steps - existing.steps) ? i : best, 0);
      setMovementIndex(mvi);
      setProteinQuality(existing.proteinQuality);
      setHydration(existing.hydration as 'wenig' | 'okay' | 'gut');
      setAlcohol(existing.alcohol);
      setScreenTimeNight(existing.screenTimeNight);
    }
    setStep(0);
    setIsEditing(true);
  }, [checkInHistory, today]);

  const buildCheckIn = useCallback((): DailyCheckIn => {
    const movement = movementIndex !== null ? MOVEMENT_OPTIONS[movementIndex] : { steps: 5000, training: false };
    const finalMood = Math.min(10, (moodLevel ?? 6) + (hadRealBreaks ? 2 : 0));
    return {
      date: today,
      sleepHours: sleepIndex !== null ? SLEEP_OPTIONS[sleepIndex].sleepHours : 7,
      sleepQuality: sleepIndex !== null ? SLEEP_OPTIONS[sleepIndex].sleepQuality : 6,
      energy: energyLevel ?? 6,
      stress: stressLevel ?? 6,
      mood: finalMood,
      training: movement.training,
      steps: movement.steps,
      proteinQuality,
      hydration,
      recovery: recoveryLevel ?? 6,
      alcohol,
      screenTimeNight,
    };
  }, [today, sleepIndex, energyLevel, stressLevel, moodLevel, hadRealBreaks, movementIndex, proteinQuality, hydration, alcohol, screenTimeNight, recoveryLevel]);

  const previewCheckIn: DailyCheckIn = useMemo(() => buildCheckIn(), [buildCheckIn]);
  const previewCompanion = useMemo(
    () => computeCompanionState(longevityScore, appPillars, previewCheckIn, streak, weeklyConsistency, goalPlan, checkInHistory.length),
    [previewCheckIn, longevityScore, appPillars, streak, weeklyConsistency, goalPlan, checkInHistory.length],
  );

  const fetchInsight = useCallback(async (checkIn: DailyCheckIn) => {
    setAiLoading(true);
    try {
      const pillars = calculatePillarScores(checkIn);
      const rollingScore = calculateRollingLongevityScore(checkInHistory, checkIn);

      // Rules-first: try deterministic feedback
      const ruleResult = rulesCheckInFeedback(checkIn, pillars, profile.goals || []);
      if (ruleResult) {
        setAiInsight(ruleResult);
        setAiLoading(false);
        return;
      }

      // Fall back to AI only when rules don't match confidently
      const contextForCache = {
        date: checkIn.date, sleep: checkIn.sleepHours, stress: checkIn.stress,
        energy: checkIn.energy, mood: checkIn.mood, training: checkIn.training,
      };
      const insight = await callAI(
        'post_checkin',
        contextForCache,
        async () => {
          const { data, error } = await supabase.functions.invoke('longevity-coach', {
            body: {
              mode: 'post_checkin_insight',
              userContext: {
                name: profile.name, age: profile.age, goals: profile.goals,
                todayCheckIn: checkIn, pillarScores: pillars, longevityScore: rollingScore,
                last7CheckIns: checkInHistory.slice(-7),
                goalPlan: goalPlan ? { goalType: goalPlan.goalType, goalDescription: goalPlan.goalDescription } : null,
              },
            },
          });
          if (error) throw new Error(error.message);
          return data?.choices?.[0]?.message?.content || '';
        },
        { ttl: 6 * 60 * 60 * 1000 },
      );
      if (insight) setAiInsight(insight);
    } catch {
      // Fallback to local recommendation
    } finally {
      setAiLoading(false);
    }
  }, [checkInHistory, profile, goalPlan]);

  const handleSubmit = () => {
    const c = buildCheckIn();
    submitCheckIn(c);
    setDone(true);
    setIsEditing(false);
    fetchInsight(c);
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);

    setRevealPhase(1);
    setTimeout(() => setRevealPhase(2), 800);
    setTimeout(() => setRevealPhase(3), 1600);
    setTimeout(() => setRevealPhase(4), 2500);
    setTimeout(() => setRevealPhase(5), 3400);

    const targetScore = calculateRollingLongevityScore([...checkInHistory, c], c);
    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      if (current >= targetScore) { current = targetScore; clearInterval(interval); }
      setAnimatedScore(current);
    }, 20);
  };

  const canProceed = [
    recoveryLevel !== null && sleepIndex !== null,
    energyLevel !== null && stressLevel !== null && moodLevel !== null,
    movementIndex !== null,
  ];

  /* ═══════════════════════════════════════════
     RESULT SCREEN
  ═══════════════════════════════════════════ */
  if ((done || alreadyDoneToday) && !isEditing) {
    const displayCheckIn = (alreadyDoneToday && !done ? checkInHistory.find(c => c.date === today) : null) ?? buildCheckIn();
    const displayPillars = calculatePillarScores(displayCheckIn);
    const displayRollingScore = calculateRollingLongevityScore(
      alreadyDoneToday && !done ? checkInHistory : [...checkInHistory, displayCheckIn],
      displayCheckIn,
    );
    const yesterdayScore = scoreHistory.length > 0 ? scoreHistory[scoreHistory.length - 1]?.score : null;
    const newCompanion = computeCompanionState(displayRollingScore, displayPillars, displayCheckIn, streak, weeklyConsistency);
    const sortedPillars = Object.entries(displayPillars).sort((a, b) => a[1] - b[1]);
    const weakest = sortedPillars[0][0];
    const strongest = sortedPillars[sortedPillars.length - 1][0];
    const scoreDelta = yesterdayScore !== null ? Math.round(displayRollingScore - yesterdayScore) : 0;
    const isReturning = alreadyDoneToday && !done;
    const showPhase = isReturning ? 5 : revealPhase;
    const priority = getPriorityAction(weakest);
    const hebel = getHauptHebel(weakest, displayCheckIn.stress);
    const status = getSystemstatus(displayPillars, displayCheckIn.stress, displayCheckIn.recovery, displayCheckIn.energy);
    const weeklyPattern = getWeeklyPattern(checkInHistory);
    const weakestScore = displayPillars[weakest as keyof typeof displayPillars];
    const headsUp = weakestScore < 35 ? HEUTE_ZAEHLT[weakest] : null;

    const slideUp = (delay = 0) => isReturning ? undefined : `cardSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`;

    return (
      <div className="px-5 pt-8 pb-6 space-y-5">
        {/* Title */}
        <div className="text-center" style={{ animation: 'cardSlideUp 0.4s ease' }}>
          <h1 className="font-outfit text-xl font-bold text-foreground">
            {isReturning ? 'Dein heutiges Profil' : 'Dein Tages-Profil'}
          </h1>
          {isReturning && (
            <button
              onClick={startEditing}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors mt-1"
            >
              Check-in anpassen
            </button>
          )}
        </div>

        {/* Phase 1: Companion */}
        <div className="flex flex-col items-center">
          <div className={cn(
            'transition-all duration-[2000ms] ease-out relative',
            showPhase >= 1 ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
          )}>
            {scoreDelta > 0 && showPhase >= 2 && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-primary"
                    style={{ left: `${40 + Math.random() * 20}%`, top: `${40 + Math.random() * 20}%`,
                      animation: 'floatParticle 2s ease-out forwards', animationDelay: `${i * 100}ms`, opacity: 0 }} />
                ))}
              </div>
            )}
            <CompanionCreature companionState={newCompanion} size={160} interactive={false} />
          </div>
        </div>

        {/* Phase 2: Systemstatus + Score */}
        {showPhase >= 2 && (
          <div className="flex flex-col items-center gap-2" style={{ animation: slideUp() }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/40 bg-card/60">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-semibold text-primary tracking-wider uppercase">{status.label}</span>
            </div>

            <AnimatedScore
              value={isReturning ? displayRollingScore : animatedScore}
              previousValue={isReturning ? undefined : (yesterdayScore ?? 0)}
              size="xl"
              showDelta
            />
            <span className="text-xs text-muted-foreground">Longevity Score</span>

            <p className="text-xs text-muted-foreground/70 text-center leading-relaxed max-w-[260px]">{status.sentence}</p>

            {/* Bio-Age */}
            {isPremium ? (() => {
              const delta = calculateBioAgeDelta(displayRollingScore, streak, weeklyConsistency, displayPillars, checkInHistory.length);
              const display = formatBioAgeDelta(delta);
              return (
                <div className="flex flex-col items-center gap-0.5 mt-1">
                  <span className={cn('text-xs font-semibold', display.isPositive ? 'text-primary' : 'text-amber-400')}>{display.text}</span>
                  <span className="text-[8px] text-muted-foreground/50">Verhaltensbasierte Schätzung · kein medizinischer Wert</span>
                </div>
              );
            })() : (
              <button onClick={() => navigate('/app/profile')}
                className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                <Lock className="w-3 h-3" /> Bio-Alter freischalten
              </button>
            )}

            {/* Streak acknowledgment */}
            {streak >= 5 && (
              <span className="text-xs text-amber-400 font-medium mt-1">🔥 Tag {streak} in Folge — du baust etwas auf.</span>
            )}
          </div>
        )}

        {/* Phase 3: Pillar cards */}
        {showPhase >= 3 && (
          <div style={{ animation: slideUp(100) }}>
            <p className="text-[10px] text-muted-foreground/60 font-semibold tracking-widest uppercase mb-3">Säulen-Status heute</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PILLAR_META.map((p, i) => {
                const score = Math.round((displayPillars as any)[p.key] ?? 0);
                const level = pillarLevel(score);
                const Icon = p.Icon;
                return (
                  <div key={p.key} className={cn('rounded-xl border p-2.5 flex flex-col items-center gap-1', level.bg, level.border)}>
                    <Icon className={cn('w-3.5 h-3.5', level.color)} />
                    <span className={cn('font-outfit text-base font-bold', level.color)}>{score}</span>
                    <span className={cn('text-[9px] font-medium', level.color)}>{level.label}</span>
                    <span className="text-[8px] text-muted-foreground/60 text-center leading-tight">{p.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
                <p className="text-[8px] text-emerald-400 font-bold tracking-widest uppercase mb-0.5">Stärkste</p>
                <p className="text-xs font-semibold text-foreground">{PILLAR_LABELS_MAP[strongest]}</p>
              </div>
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2">
                <p className="text-[8px] text-amber-400 font-bold tracking-widest uppercase mb-0.5">Hebel heute</p>
                <p className="text-xs font-semibold text-foreground">{PILLAR_LABELS_MAP[weakest]}</p>
              </div>
            </div>
            {headsUp && (
              <p className="text-[10px] text-muted-foreground/60 italic mt-2 text-center leading-relaxed">{headsUp}</p>
            )}
          </div>
        )}

        {/* Phase 4: Haupthebel + Priority Action */}
        {showPhase >= 4 && (
          <>
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4" style={{ animation: slideUp() }}>
              <p className="text-[9px] text-amber-400 font-bold tracking-widest uppercase mb-1.5">Haupthebel heute</p>
              <p className="text-sm font-semibold text-foreground mb-1">{hebel.pillar}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{hebel.reason}</p>
            </div>

            <div className="rounded-xl border border-primary/20 p-4"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--primary) / 0.02) 100%)', animation: slideUp(100) }}>
              <p className="text-[9px] text-primary font-bold tracking-widest uppercase mb-1.5">
                Dein Fokus heute · {new Date().getHours() < 12 ? 'Morgen' : new Date().getHours() < 18 ? 'Nachmittag' : 'Abend'}
              </p>
              <p className="text-sm font-semibold text-foreground mb-0.5">{priority.label}</p>
              <p className="text-xs text-muted-foreground">{priority.action}</p>
            </div>

            {/* Goal relevance */}
            {goalPlan?.weeklyPlan && (
              <div className="rounded-xl border border-border/40 p-3.5" style={{ background: 'var(--gradient-card)', animation: slideUp(200) }}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">{goalPlan.goalDescription || 'Dein Ziel'}</span>
                </div>
                <GoalCheckInRelevance checkIn={displayCheckIn} goalPlan={goalPlan} pillars={displayPillars} />
              </div>
            )}
          </>
        )}

        {/* Phase 5: AI Coach Insight */}
        {showPhase >= 5 && (
          <>
            <div className="rounded-2xl border border-primary/20 p-4"
              style={{ background: 'linear-gradient(165deg, hsl(var(--primary) / 0.06), hsl(var(--primary) / 0.02))', animation: slideUp() }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary">Was CALI heute sieht</span>
              </div>
              {aiLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-4/5" />
                </div>
              ) : aiInsight ? (
                <p className="text-sm text-foreground leading-relaxed">{aiInsight}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">{getQuickRecommendation(displayCheckIn, displayPillars, goalPlan)}</p>
              )}
            </div>

            {weeklyPattern && (
              <p className="text-[10px] text-muted-foreground/50 text-center italic">{weeklyPattern}</p>
            )}

            {/* CALI deep dive CTA */}
            <button
              onClick={() => navigate('/app/coach')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/8 transition-colors"
              style={{ animation: slideUp(300) }}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-sm text-primary font-medium">Mehr Einblicke mit CALI</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-primary/60 shrink-0" />
            </button>

            <Button variant="premium" className="w-full" onClick={() => navigate('/app/home')} style={{ animation: slideUp(400) }}>
              Zum Home Screen <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <button
              onClick={startEditing}
              className="w-full text-center text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1"
              style={{ animation: slideUp(500) }}
            >
              Check-in anpassen
            </button>

            <div className="flex items-center justify-center gap-1.5 opacity-25">
              <img src="/images/caliness-logo-white.png" alt="" className="w-3.5 h-3.5 object-contain" />
              <span className="text-[9px] text-muted-foreground tracking-wider">CALINESS</span>
            </div>
          </>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     INPUT SCREENS
  ═══════════════════════════════════════════ */
  return (
    <div className="px-5 pt-8 pb-4 space-y-6">

      {/* Header: companion + title */}
      <div className="flex items-center gap-4">
        <div style={{ transition: 'all 0.8s ease' }}>
          <CompanionCreature companionState={previewCompanion} size={56} compact interactive={false} />
        </div>
        <div className="flex-1">
          <h1 className="font-outfit text-xl font-bold text-foreground">{greeting.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{greeting.subtitle}</p>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] text-primary/60 font-semibold tracking-widest uppercase">
            {step === 0 ? 'Erholung & Schlaf' : step === 1 ? 'Energie & Geist' : 'Dein Tag'}
          </span>
          <span className="text-[9px] text-muted-foreground/40">{step + 1} / {totalSteps}</span>
        </div>
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, boxShadow: '0 0 6px hsl(142 76% 46% / 0.4)' }} />
        </div>
      </div>

      {/* ── Screen 1: Erholung & Schlaf ── */}
      {step === 0 && (
        <div className="space-y-6" style={{ animation: 'cardSlideUp 0.4s cubic-bezier(0.22,1,0.36,1)' }}>
          {/* Recovery */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Wie erholt bist du heute?</p>
            <div className="flex flex-col gap-2">
              {RECOVERY_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setRecoveryLevel(opt.value)}
                  className={cn('rounded-xl border px-4 py-3 text-left flex items-center gap-3 transition-all duration-200',
                    recoveryLevel === opt.value ? 'border-primary bg-primary/10' : 'border-border/50 bg-card hover:border-primary/30')}>
                  <div className={cn('w-2 h-2 rounded-full shrink-0 transition-all',
                    recoveryLevel === opt.value ? 'bg-primary scale-125' : 'bg-border')} />
                  <div>
                    <span className={cn('text-sm font-medium', recoveryLevel === opt.value ? 'text-primary' : 'text-foreground')}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">— {opt.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* CALI micro-acknowledgment */}
          {recoveryLevel !== null && (
            <p className={cn('text-xs text-primary/70 italic text-center transition-all duration-500 animate-fade-in')}>
              {recoveryLevel <= 4
                ? 'Nicht dein bester Start — wir finden heute den richtigen Fokus.'
                : recoveryLevel >= 8
                  ? 'Starker Start. Lass uns sehen, wie dein Tag läuft.'
                  : 'Danke. Weiter mit dem Schlaf.'}
            </p>
          )}

          {/* Sleep */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Wie war dein Schlaf?</p>
            <div className="grid grid-cols-4 gap-2">
              {SLEEP_OPTIONS.map((opt, i) => (
                <button key={i} onClick={() => setSleepIndex(i)}
                  className={cn('flex flex-col items-center gap-1 p-3 rounded-xl border transition-all',
                    sleepIndex === i ? 'border-primary bg-primary/10' : 'border-border/50 bg-card hover:border-primary/30')}>
                  <span className={cn('text-xs font-semibold', sleepIndex === i ? 'text-primary' : 'text-foreground')}>{opt.label}</span>
                  <span className="text-[9px] text-muted-foreground">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Screen 2: Energie & Geist ── */}
      {step === 1 && (
        <div className="space-y-5" style={{ animation: 'cardSlideUp 0.4s cubic-bezier(0.22,1,0.36,1)' }}>
          {/* Energy */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Wie ist deine Energie heute?</p>
            <div className="flex gap-1.5">
              {ENERGY_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setEnergyLevel(opt.value)}
                  className={cn('flex-1 flex flex-col items-center gap-1 py-3 px-1 rounded-xl border transition-all',
                    energyLevel === opt.value ? 'border-primary bg-primary/10' : 'border-border/50 bg-card hover:border-primary/30')}>
                  <span className={cn('text-[10px] font-semibold text-center leading-tight',
                    energyLevel === opt.value ? 'text-primary' : 'text-foreground')}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stress */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Wie belastet bist du heute mental?</p>
            <div className="flex gap-1.5">
              {STRESS_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setStressLevel(opt.value)}
                  className={cn('flex-1 flex flex-col items-center gap-1 py-3 px-1 rounded-xl border transition-all',
                    stressLevel === opt.value ? 'border-primary bg-primary/10' : 'border-border/50 bg-card hover:border-primary/30')}>
                  <span className={cn('text-[10px] font-semibold text-center leading-tight',
                    stressLevel === opt.value ? 'text-primary' : 'text-foreground')}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mood / Focus */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Wie klar und fokussiert bist du?</p>
            <div className="flex gap-1.5">
              {MOOD_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setMoodLevel(opt.value)}
                  className={cn('flex-1 flex flex-col items-center gap-1 py-3 px-1 rounded-xl border transition-all',
                    moodLevel === opt.value ? 'border-primary bg-primary/10' : 'border-border/50 bg-card hover:border-primary/30')}>
                  <span className={cn('text-[10px] font-semibold text-center leading-tight',
                    moodLevel === opt.value ? 'text-primary' : 'text-foreground')}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Real breaks toggle */}
          <button onClick={() => setHadRealBreaks(!hadRealBreaks)}
            className={cn('w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200',
              hadRealBreaks ? 'border-primary/40 bg-primary/10' : 'border-border/50 bg-card')}>
            <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
              hadRealBreaks ? 'border-primary bg-primary' : 'border-muted-foreground/30')}>
              {hadRealBreaks && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
            </div>
            <div className="flex-1 text-left">
              <span className={cn('text-sm font-medium', hadRealBreaks ? 'text-primary' : 'text-foreground')}>
                Echte Pausen gehabt
              </span>
              <p className="text-xs text-muted-foreground">Momente echter Entlastung — nicht nur kurze Ablenkung</p>
            </div>
          </button>
        </div>
      )}

      {/* ── Screen 3: Dein Tag ── */}
      {step === 2 && (
        <div className="space-y-5" style={{ animation: 'cardSlideUp 0.4s cubic-bezier(0.22,1,0.36,1)' }}>
          {/* Movement */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Wie viel hast du dich heute bewegt?</p>
            <div className="flex flex-col gap-2">
              {MOVEMENT_OPTIONS.map((opt, i) => (
                <button key={i} onClick={() => setMovementIndex(i)}
                  className={cn('rounded-xl border px-4 py-3 text-left transition-all duration-200',
                    movementIndex === i ? 'border-primary bg-primary/10' : 'border-border/50 bg-card hover:border-primary/30')}>
                  <span className={cn('text-sm font-medium', movementIndex === i ? 'text-primary' : 'text-foreground')}>{opt.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">— {opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nutrition */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Wie war deine Ernährung heute?</p>
            <div className="grid grid-cols-2 gap-2">
              {NUTRITION_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setProteinQuality(opt.value)}
                  className={cn('flex flex-col items-center gap-0.5 p-3 rounded-xl border transition-all',
                    proteinQuality === opt.value ? 'border-primary bg-primary/10' : 'border-border/50 bg-card hover:border-primary/30')}>
                  <span className={cn('text-xs font-semibold', proteinQuality === opt.value ? 'text-primary' : 'text-foreground')}>{opt.label}</span>
                  <span className="text-[9px] text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hydration */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Wie viel Wasser heute?</p>
            <div className="grid grid-cols-3 gap-2">
              {HYDRATION_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setHydration(opt.value as 'wenig' | 'okay' | 'gut')}
                  className={cn('flex flex-col items-center gap-1 p-3 rounded-xl border transition-all',
                    hydration === opt.value ? 'border-primary bg-primary/10' : 'border-border/50 bg-card hover:border-primary/30')}>
                  <span className={cn('text-sm font-semibold', hydration === opt.value ? 'text-primary' : 'text-foreground')}>{opt.label}</span>
                  <span className="text-[9px] text-muted-foreground">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick facts: alcohol + screen time side by side */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Noch zwei Checks</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Alkohol heute', active: alcohol, toggle: () => setAlcohol(!alcohol) },
                { label: 'Spät am Bildschirm', active: screenTimeNight, toggle: () => setScreenTimeNight(!screenTimeNight) },
              ].map((item, i) => (
                <button key={i} onClick={item.toggle}
                  className={cn('flex items-center gap-2.5 p-3.5 rounded-xl border transition-all',
                    item.active ? 'border-rose-400/30 bg-rose-400/8' : 'border-border/50 bg-card')}>
                  <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                    item.active ? 'border-rose-400 bg-rose-400' : 'border-muted-foreground/30')}>
                    {item.active && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className={cn('text-xs font-medium leading-tight', item.active ? 'text-rose-400' : 'text-foreground')}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">Zurück</Button>
        )}
        {step < totalSteps - 1 ? (
          <Button variant="premium" onClick={() => setStep(s => s + 1)} className="flex-1" disabled={!canProceed[step]}>
            Weiter
          </Button>
        ) : (
          <Button variant="premium" onClick={handleSubmit} className="flex-1" disabled={!canProceed[step]}>
            Check-in abschließen
          </Button>
        )}
      </div>
    </div>
  );
}
