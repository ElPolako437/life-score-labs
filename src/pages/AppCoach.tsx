import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import {
  Send, Loader2, Activity, Apple, Moon, Brain, Flame,
  ChevronRight, Crown, Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ChatMessage from '@/components/app/ChatMessage';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { rulesCoachAnswer } from '@/lib/rulesEngine';
import { callAI } from '@/lib/aiWrapper';

type Msg = { role: 'user' | 'assistant'; content: string };

const COACH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/longevity-coach`;

// ─── Pillar metadata ───────────────────────────────────────────────────────────

const PILLAR_ICONS: Record<string, React.ElementType> = {
  bewegung: Activity, ernaehrung: Apple, regeneration: Moon, mental: Brain,
};
const PILLAR_LABELS: Record<string, string> = {
  bewegung: 'Bewegung', ernaehrung: 'Ernährung', regeneration: 'Recovery', mental: 'Mental',
};
const PILLAR_PILL: Record<string, string> = {
  bewegung: 'bg-green-500/10 text-green-400 border-green-500/20',
  ernaehrung: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  regeneration: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  mental: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};
const PILLAR_ICON_COLOR: Record<string, string> = {
  bewegung: 'text-green-400', ernaehrung: 'text-orange-400',
  regeneration: 'text-blue-400', mental: 'text-purple-400',
};

const ADJUST_PATTERNS: { pattern: RegExp; intent: string }[] = [
  { pattern: /stressig(e)?\s*(woche|zeit|phase)/i, intent: 'reduce_plan' },
  { pattern: /wenig(er)?\s*zeit/i, intent: 'reduce_plan' },
  { pattern: /nur\s*\d+\s*tag/i, intent: 'reduce_plan' },
  { pattern: /fokus\s*(auf|mehr)/i, intent: 'adjust_focus' },
  { pattern: /ich\s*will\s*mehr/i, intent: 'adjust_focus' },
  { pattern: /vegetarisch|vegan|kein\s*fleisch/i, intent: 'adjust_nutrition' },
  { pattern: /plan\s*leichter|einfacher|weniger/i, intent: 'simplify_plan' },
  { pattern: /plan\s*(schwieriger|härter|mehr\s*fordern|intensiver)/i, intent: 'intensify_plan' },
];

// ─── Local computation helpers (no API) ──────────────────────────────────────

function pillarLevel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'stark', color: 'text-green-400' };
  if (score >= 50) return { label: 'gut', color: 'text-primary' };
  if (score >= 32) return { label: 'mittel', color: 'text-amber-400' };
  return { label: 'gering', color: 'text-red-400' };
}

function getSystemStatus(
  pillarScores: Record<string, number>,
  todayCheckIn: any,
): { label: string; badge: string } {
  const stress = todayCheckIn?.stress ?? 5;
  const recovery = todayCheckIn?.recovery ?? 5;
  const energy = todayCheckIn?.energy ?? 5;
  const values = Object.values(pillarScores) as number[];
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const min = Math.min(...values);

  if (stress >= 8 || (stress >= 7 && recovery <= 4))
    return { label: 'Nervensystem unter Last', badge: 'bg-red-500/10 text-red-400 border-red-500/20' };
  if (recovery >= 7 && energy >= 7)
    return { label: 'Gut regeneriert', badge: 'bg-green-500/10 text-green-400 border-green-500/20' };
  if (stress >= 7)
    return { label: 'Mentale Last spürbar', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  if (avg >= 70 && min >= 50)
    return { label: 'System läuft stark', badge: 'bg-green-500/10 text-green-400 border-green-500/20' };
  if (avg >= 55)
    return { label: 'Stabil und fokussiert', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  if (min < 35)
    return { label: 'Erholung priorisieren', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  return { label: 'Solide mit klarem Hebel', badge: 'bg-primary/10 text-primary border-primary/20' };
}

function getWeakestPillar(pillarScores: Record<string, number>): string {
  return Object.entries(pillarScores).sort((a, b) => a[1] - b[1])[0][0];
}

function getTagesFokus(
  pillarScores: Record<string, number>,
  goalPlan: any,
): { title: string; action: string; pillar: string } {
  const weakest = getWeakestPillar(pillarScores);
  const goal = goalPlan?.goalType;

  const FOCUS: Record<string, Record<string, { title: string; action: string }>> = {
    bewegung: {
      fat_loss: { title: 'Bewegung ist heute dein Hebel', action: '20 Min Spaziergang oder Training erhöhen deinen Fettverbrauch direkt — auch bei wenig Zeit.' },
      muscle_gain: { title: 'Training heute einplanen', action: 'Auch eine kurze Einheit zählt. Konsistenz über Wochen schlägt Intensität über Tage.' },
      default: { title: 'Mehr Bewegung heute', action: '20 Minuten aktive Bewegung würden deinen Score heute am stärksten heben.' },
    },
    ernaehrung: {
      fat_loss: { title: 'Ernährung ist heute dein Hebel', action: 'Protein priorisieren, Kalorien im Zielbereich halten. Das ist heute dein wichtigster Zug.' },
      muscle_gain: { title: 'Protein heute im Fokus', action: 'Proteinziel bis heute Abend erreichen. Das ist dein direktester Weg zum Muskelaufbau.' },
      default: { title: 'Ernährung verbessern', action: 'Eine proteinreiche Mahlzeit und 2L Wasser heute — das reicht als erster Schritt.' },
    },
    regeneration: {
      sleep_improvement: { title: 'Schlaf ist dein Ziel — heute Abend zählt', action: 'Kein Bildschirm ab 21 Uhr. Schlaf-Routine starten. Dein System braucht das jetzt.' },
      default: { title: 'Recovery heute priorisieren', action: 'Früher ins Bett, kein Alkohol, weniger Reize nach 20 Uhr. Das ist der einfachste Hebel heute.' },
    },
    mental: {
      stress_reduction: { title: 'Stress ist heute das Thema', action: '5 Minuten bewusstes Atmen. Keine weiteren Aufgaben annehmen bis morgen. Das ist genug.' },
      energy_recovery: { title: 'Energie schonen heute', action: 'Nur das Notwendige. Pausen aktiv planen, keine neuen Verpflichtungen eingehen.' },
      default: { title: 'Mentale Balance stärken', action: '10 Min Natur, Atemübung oder bewusste Pause — das senkt den Stressspiegel messbar.' },
    },
  };

  const map = FOCUS[weakest] || FOCUS.bewegung;
  const item = (goal && map[goal]) ? map[goal] : map['default'];
  return { ...item, pillar: weakest };
}

function getDynamicQuestions(
  pillarScores: Record<string, number>,
  todayCheckIn: any,
  goalPlan: any,
): string[] {
  const weakest = getWeakestPillar(pillarScores);
  const goal = goalPlan?.goalType;
  const stress = todayCheckIn?.stress ?? 5;
  const recovery = todayCheckIn?.recovery ?? 5;

  const weakQ: Record<string, string> = {
    bewegung: 'Warum ist mein Bewegungsscore niedrig?',
    ernaehrung: 'Was sollte ich heute noch essen?',
    regeneration: 'Was hilft mir heute Abend besser zu schlafen?',
    mental: 'Was tue ich konkret gegen meinen Stress heute?',
  };
  const goalQ: Record<string, string> = {
    fat_loss: 'Bin ich noch auf Kurs mit meinem Gewichtsziel?',
    muscle_gain: 'Was brauche ich für mehr Muskelaufbau?',
    sleep_improvement: 'Wie verbessere ich meinen Schlaf diese Woche?',
    stress_reduction: 'Welche eine Gewohnheit hilft am meisten gegen Stress?',
    energy_recovery: 'Was blockiert meine Energie gerade am stärksten?',
    routine_building: 'Welche Routine bringt mich diese Woche am weitesten?',
    recomp: 'Wie optimiere ich heute Ernährung und Training?',
  };
  const ctxQ = stress >= 7
    ? 'Konkrete Tipps für einen Hochstress-Tag?'
    : recovery >= 8
    ? 'Wie nutze ich meine gute Form heute am besten?'
    : 'Was ist mein bester nächster Schritt?';

  return [
    weakQ[weakest] || 'Was ist mein größter Hebel heute?',
    (goal && goalQ[goal]) ? goalQ[goal] : 'Was soll ich diese Woche priorisieren?',
    ctxQ,
  ];
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function AppCoach() {
  const navigate = useNavigate();
  const {
    profile, longevityScore, pillarScores, todayCheckIn, streak,
    checkInHistory, scoreHistory, wearableEntries, coachMemory, chatHistory,
    setChatHistory, addCoachMemory, goalPlan, setGoalPlan,
    nutritionTargets, nutritionLogs, nutritionPatterns,
    isPremium, canSendCoachMessage, incrementCoachMessage, dailyCoachMessages,
    activityLog,
  } = useApp();

  const [messages, setMessages] = useState<Msg[]>(chatHistory);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Sync local messages with global chatHistory when it loads from Supabase (e.g. initial data load completes after mount)
  const prevChatHistoryLenRef = useRef(chatHistory.length);
  useEffect(() => {
    // Only sync if chatHistory changed from empty to populated (initial Supabase load),
    // and we haven't started a new conversation locally
    if (chatHistory.length > 0 && prevChatHistoryLenRef.current === 0 && messages.length === 0) {
      setMessages(chatHistory);
      setShowPanel(false);
    }
    prevChatHistoryLenRef.current = chatHistory.length;
  }, [chatHistory]); // eslint-disable-line react-hooks/exhaustive-deps
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(messages.length === 0);
  const [showPaywall, setShowPaywall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Locally computed panel data (zero API calls) ───────────────────────────
  const systemStatus = useMemo(
    () => getSystemStatus(pillarScores as unknown as Record<string, number>, todayCheckIn),
    [pillarScores, todayCheckIn],
  );
  const tagsFokus = useMemo(
    () => getTagesFokus(pillarScores, goalPlan),
    [pillarScores, goalPlan],
  );
  const weakest = useMemo(() => getWeakestPillar(pillarScores), [pillarScores]);
  const dynamicQuestions = useMemo(
    () => getDynamicQuestions(pillarScores, todayCheckIn, goalPlan),
    [pillarScores, todayCheckIn, goalPlan],
  );

  const hasCheckedIn = todayCheckIn !== null;
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Guten Morgen' : hour < 17 ? 'Guten Nachmittag' : 'Guten Abend';

  const WeakIcon = PILLAR_ICONS[weakest] || Activity;

  // ─── Rich user context for API calls ────────────────────────────────────────
  const userContext = useMemo(() => ({
    name: profile.name, age: profile.age, gender: profile.gender,
    height: profile.height, weight: profile.weight, goals: profile.goals,
    activityLevel: profile.activityLevel, longevityScore, pillarScores, streak,
    todayCheckIn, recentHistory: checkInHistory.slice(-7),
    scoreTrend: scoreHistory.slice(-7).map(s => ({ date: s.date, score: s.score })),
    wearableData: wearableEntries.slice(-7), memory: coachMemory,
    goalPlan: goalPlan ? {
      goalType: goalPlan.goalType, goalDescription: goalPlan.goalDescription,
      targetDate: goalPlan.targetDate, targetWeeks: goalPlan.targetWeeks,
      weeklyFocus: goalPlan.weeklyPlan?.focusPillar,
      weeklyMotivation: goalPlan.weeklyPlan?.weeklyMotivation,
      adherence: (() => {
        if (!goalPlan.weeklyPlan?.weeklyBlocks) return 0;
        const total = goalPlan.weeklyPlan.weeklyBlocks.reduce((s: number, d: any) => s + d.blocks.length, 0);
        const done = goalPlan.weeklyPlan.weeklyBlocks.reduce((s: number, d: any) => s + d.blocks.filter((b: any) => b.completed).length, 0);
        return total > 0 ? Math.round((done / total) * 100) : 0;
      })(),
      todayBlocks: (() => {
        if (!goalPlan.weeklyPlan?.weeklyBlocks) return [];
        const idx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
        const day = goalPlan.weeklyPlan.weeklyBlocks[idx];
        return day?.blocks?.map((b: any) => ({ label: b.label, type: b.type, time: b.time, completed: !!b.completed })) || [];
      })(),
      missedToday: (() => {
        if (!goalPlan.weeklyPlan?.weeklyBlocks) return [];
        const idx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
        const day = goalPlan.weeklyPlan.weeklyBlocks[idx];
        return day?.blocks?.filter((b: any) => !b.completed).map((b: any) => b.label) || [];
      })(),
      biggestObstacle: goalPlan.realismResult?.riskFactors?.[0] || null,
    } : null,
    nutrition: nutritionTargets ? {
      calorieRange: `${nutritionTargets.calorieMin}–${nutritionTargets.calorieMax} kcal`,
      proteinTarget: nutritionTargets.proteinTarget,
      todayProtein: nutritionLogs.filter(l => l.date === new Date().toISOString().split('T')[0]).reduce((s, l) => s + l.estimatedProteinTotal, 0),
      todayMeals: nutritionLogs.filter(l => l.date === new Date().toISOString().split('T')[0]).flatMap(l => l.meals).length,
      recentPatterns: nutritionPatterns?.patterns?.slice(0, 2) || [],
      topBottleneck: nutritionPatterns?.topBottleneck || null,
    } : null,
    recentActivity: (() => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      return activityLog
        .filter(l => l.date >= sevenDaysAgo)
        .slice(-30)
        .map(l => ({ date: l.date, pillar: l.pillar, type: l.type, duration: l.duration }));
    })(),
  }), [
    profile, longevityScore, pillarScores, streak, todayCheckIn,
    checkInHistory, scoreHistory, wearableEntries, coachMemory,
    goalPlan, nutritionTargets, nutritionLogs, nutritionPatterns, activityLog,
  ]);

  // ─── Chat history persistence ────────────────────────────────────────────────
  const setChatHistoryRef = useRef(setChatHistory);
  setChatHistoryRef.current = setChatHistory;
  const prevMsgCountRef = useRef(chatHistory.length);
  useEffect(() => {
    if (messages.length > 0 && messages.length !== prevMsgCountRef.current) {
      prevMsgCountRef.current = messages.length;
      setChatHistoryRef.current(messages);
    }
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // ─── Memory extraction ───────────────────────────────────────────────────────
  const extractMemory = useCallback(async (conversationMessages: Msg[]) => {
    try {
      const memoryContext = { msgCount: conversationMessages.length, lastMsg: conversationMessages.slice(-1)[0]?.content?.slice(0, 50) };
      const result = await callAI(
        'memory_extraction',
        memoryContext,
        async () => {
          const { data: { session } } = await supabase.auth.getSession();
          const resp = await fetch(COACH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: JSON.stringify({ mode: 'memory', messages: conversationMessages.slice(-10), userContext }),
          });
          if (!resp.ok) return '[]';
          const data = await resp.json();
          return data.choices?.[0]?.message?.content || '[]';
        },
        { ttl: 60 * 60 * 1000 },
      );
      if (result) {
        try {
          const facts = JSON.parse(result.replace(/```json\n?|\n```/g, '').trim());
          if (Array.isArray(facts)) facts.forEach((f: string) => {
            if (f && f.length > 5 && !coachMemory.includes(f)) addCoachMemory(f);
          });
        } catch { }
      }
    } catch { }
  }, [userContext, coachMemory, addCoachMemory]);

  // ─── Plan adjustment ─────────────────────────────────────────────────────────
  const detectAdjustmentIntent = useCallback((text: string): string | null => {
    if (!goalPlan?.weeklyPlan) return null;
    for (const { pattern, intent } of ADJUST_PATTERNS) {
      if (pattern.test(text)) return intent;
    }
    return null;
  }, [goalPlan]);

  const adjustPlan = useCallback(async (userText: string, intent: string) => {
    if (!goalPlan?.weeklyPlan) return;
    setIsAdjusting(true);
    setMessages(prev => [...prev, { role: 'assistant', content: 'Ich passe deinen Plan an. Einen Moment...' }]);
    try {
      const weakestPillar = Object.entries(pillarScores).sort((a, b) => (a[1] as number) - (b[1] as number))[0]?.[0] || 'bewegung';
      const { data, error } = await supabase.functions.invoke('goal-planner', {
        body: {
          mode: 'adjust-plan',
          goal: { type: goalPlan.goalType, description: goalPlan.goalDescription, currentPlan: goalPlan.weeklyPlan, adjustmentRequest: userText + ' (Intent: ' + intent + ')' },
          userContext: { name: profile.name, stressLevel: profile.stressLevel, weakestPillar, streak },
        },
      });
      if (error) throw error;
      setGoalPlan(prev => prev ? { ...prev, weeklyPlan: { weeklyBlocks: data.weeklyBlocks, weeklyMotivation: data.weeklyMotivation, focusPillar: data.focusPillar } } : prev);
      setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: 'Dein Plan wurde angepasst. ' + (data.changesSummary || 'Die Änderungen sind jetzt sichtbar.') } : m));
      toast.success('Plan angepasst!');
    } catch {
      setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: 'Plan-Anpassung konnte nicht durchgeführt werden.' } : m));
    } finally {
      setIsAdjusting(false);
    }
  }, [goalPlan, profile, pillarScores, streak, setGoalPlan]);

  // ─── Core send function ───────────────────────────────────────────────────────
  const sendMessageWithText = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || isAdjusting) return;

    // Soft paywall — show upgrade card instead of a fake assistant block
    if (!canSendCoachMessage) {
      setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
      setShowPaywall(true);
      setInput('');
      return;
    }

    setShowPanel(false);
    const userMsg: Msg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    incrementCoachMessage();

    const adjustIntent = detectAdjustmentIntent(trimmed);
    if (adjustIntent) { adjustPlan(trimmed, adjustIntent); return; }

    // Rules-first: try deterministic answer for simple questions
    const ruleAnswer = rulesCoachAnswer({
      question: trimmed,
      pillarScores,
      todayCheckIn,
      streak,
      goalType: goalPlan?.goalType,
    });
    if (ruleAnswer) {
      setMessages(prev => [...prev, { role: 'assistant', content: ruleAnswer }]);
      return;
    }

    setIsLoading(true);
    let assistantSoFar = '';
    const allMessages = [...messages, userMsg];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(COACH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ mode: 'chat', messages: allMessages, userContext }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Fehler ${resp.status}`);
      }
      if (!resp.body) throw new Error('Kein Stream');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '' || !line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const content = JSON.parse(jsonStr).choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                return last?.role === 'assistant'
                  ? prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m)
                  : [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch { textBuffer = line + '\n' + textBuffer; break; }
        }
      }
      if (assistantSoFar) extractMemory([...allMessages, { role: 'assistant', content: assistantSoFar }]);
    } catch (e: any) {
      toast.error(e.message || 'CALI nicht erreichbar');
      if (!assistantSoFar) setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading, isAdjusting, canSendCoachMessage, messages, userContext, extractMemory, incrementCoachMessage, detectAdjustmentIntent, adjustPlan]);

  const sendMessage = useCallback(() => sendMessageWithText(input), [input, sendMessageWithText]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-enter">

      {/* ═══ HEADER ═══ */}
      <div className="px-5 pt-6 pb-4 border-b border-border/20">
        <div className="flex items-start justify-between gap-3">
          {/* Identity + status */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/images/caliness-logo-white.png" alt="" className="w-5 h-5 object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-outfit text-base font-bold text-foreground">CALI</h1>
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0', systemStatus.badge)}>
                  {systemStatus.label}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                {!hasCheckedIn
                  ? 'Check in für eine tagesaktuelle Einschätzung'
                  : `${timeGreeting}, ${profile.name || 'du'}`}
              </p>
            </div>
          </div>

          {/* Pillar mini-indicators */}
          <div className="flex gap-2 shrink-0 pt-0.5">
            {Object.entries(pillarScores).map(([key, score]) => {
              const Icon = PILLAR_ICONS[key];
              const lv = pillarLevel(score as number);
              return (
                <div key={key} className="flex flex-col items-center gap-0.5" title={`${PILLAR_LABELS[key]}: ${score}`}>
                  <Icon className={cn('w-3 h-3', lv.color)} />
                  <span className="text-[8px] text-muted-foreground/50">{Math.round(score as number)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ SCROLLABLE BODY ═══ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

        {/* ── PANEL: visible when no messages ── */}
        {showPanel && messages.length === 0 && (
          <div className="space-y-3">

            {/* No check-in nudge */}
            {!hasCheckedIn && (
              <div className="rounded-2xl p-3.5 border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-400">Noch kein Check-in heute</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Mach erst den Check-in — dann kann CALI deinen heutigen Zustand präzise einschätzen.
                  </p>
                </div>
              </div>
            )}

            {/* Tages-Fokus card */}
            <div className="card-elegant rounded-2xl p-4 space-y-2.5 border border-border/20">
              <div className="flex items-center gap-2">
                <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center border', PILLAR_PILL[tagsFokus.pillar])}>
                  <WeakIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest">Tages-Fokus</span>
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug">{tagsFokus.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{tagsFokus.action}</p>
            </div>

            {/* Context pills */}
            {(goalPlan?.goalType || streak > 0 || longevityScore > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {goalPlan?.goalType && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full border border-border/30 text-muted-foreground bg-secondary/40">
                    Ziel: {goalPlan.goalDescription || goalPlan.goalType}
                  </span>
                )}
                {streak > 0 && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full border border-primary/20 text-primary bg-primary/5 flex items-center gap-1">
                    <Flame className="w-2.5 h-2.5" /> {streak} Tage
                  </span>
                )}
                {longevityScore > 0 && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full border border-border/30 text-muted-foreground bg-secondary/40">
                    Score: {longevityScore}
                  </span>
                )}
              </div>
            )}

            {/* Dynamic suggested questions */}
            <div className="pt-1 space-y-1.5">
              <p className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-widest">Frag CALI</p>
              {dynamicQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessageWithText(q)}
                  className="w-full text-left text-xs px-4 py-3 rounded-xl border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-between group"
                  style={{ background: 'var(--gradient-card)' }}
                >
                  <span>{q}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── COMPACT CONTEXT STRIP (when chat active) ── */}
        {!showPanel && messages.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pb-1">
            {Object.entries(pillarScores).map(([key, score]) => (
              <span key={key} className={cn('text-[9px] px-2 py-0.5 rounded-full border', PILLAR_PILL[key])}>
                {PILLAR_LABELS[key]} {Math.round(score as number)}
              </span>
            ))}
          </div>
        )}

        {/* ── CHAT MESSAGES ── */}
        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-secondary border border-border/40 flex items-center justify-center shrink-0 overflow-hidden">
                  <img src="/images/caliness-logo-white.png" alt="" className="w-4 h-4 object-contain opacity-60" />
                </div>
                <div className="card-elegant rounded-2xl px-4 py-3">
                  <span className="text-sm text-muted-foreground">Denkt nach…</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SOFT PAYWALL CARD ── */}
        {showPaywall && (
          <div className="card-elegant rounded-2xl p-4 border border-primary/20 bg-primary/5 space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-semibold text-foreground">Tageslimit erreicht (3/Tag)</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mit CALINESS Premium chattest du jeden Tag unbegrenzt mit CALI — und bekommst tiefere Analysen.
            </p>
            <button
              onClick={() => navigate('/app/profile')}
              className="text-xs text-primary font-medium hover:underline"
            >
              Premium entdecken →
            </button>
          </div>
        )}

        {/* ── RE-SHOW PANEL BUTTON ── */}
        {!showPanel && messages.length > 0 && (
          <button
            onClick={() => setShowPanel(true)}
            className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors py-1"
          >
            + Tages-Fokus wieder anzeigen
          </button>
        )}
      </div>

      {/* ═══ INPUT AREA ═══ */}
      <div className="px-5 py-4 border-t border-border/40 bg-card/80 backdrop-blur-xl space-y-2">
        {!isPremium && !showPaywall && (
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground">
              {dailyCoachMessages}/3 Nachrichten heute ·{' '}
              <span className="text-primary cursor-pointer" onClick={() => navigate('/app/profile')}>
                Unbegrenzt mit Premium
              </span>
            </span>
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Frag CALI…"
            disabled={isLoading || isAdjusting}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || isAdjusting || !input.trim()}
            className="shrink-0 rounded-xl"
          >
            {isLoading || isAdjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
