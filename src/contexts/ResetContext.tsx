import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DAY_CONTENT } from '@/lib/dayContent';

// ─── Existing types (kept for compatibility) ──────────────────────────────────

export type Goal = 'energy' | 'fatloss' | 'structure' | 'sleep';
export type Hurdle = 'stress' | 'time' | 'nutrition' | 'consistency' | 'evening';
export type Rating = 'good' | 'difficult' | 'failed';

export interface DayData {
  tasks: boolean[];
  rating: Rating | null;
  note: string | null;
  completed: boolean;
  completedAt: number | null;
}

export interface BaselineData {
  energy: number;
  sleep: number;
  calm: number;
  eating: number;
  body: number;
}

export interface ReflectionData {
  energy: number;
  sleep: number;
  calm: number;
  eating: number;
  body: number;
  easiest: string;
  hardest: string;
}

// ─── V3: Pillar input types ───────────────────────────────────────────────────

export interface Tag1Data {
  alter: number;
  geschlecht: 'm' | 'w' | 'na';
  groesse: number;
  gewicht: number;
  aktivitaet: 'sitzend' | 'moderat' | 'aktiv' | 'sehr_aktiv';
  ziel: 'energie' | 'abnehmen' | 'muskel' | 'gesundheit';
  mahlzeiten: 'regelmaessig' | 'unregelmaessig' | 'snacking' | 'abends_mehr';
}

export interface Tag2Data {
  schritte: 'u3000' | '3000-6000' | '6000-10000' | 'ue10000';
  frequenz: 'keins' | '1-2' | '3-4' | '5plus';
  gefuehl: 'gut' | 'erschoepft' | 'kaum' | 'wechselhaft';
}

export interface Tag3Data {
  dauer: 'u6' | '6-7' | '7-8' | '8plus';
  regelmaessigkeit: 'sehr' | 'ca1h' | 'stark' | 'keins';
  morgenBildschirm: 'frisch' | 'maessig' | 'schwer' | 'erschoepft';
}

export interface Tag4Data {
  kippPunkt: 'morgens' | 'nachmittags' | 'abends' | 'selten';
  stress: 'gering' | 'mittel' | 'hoch' | 'sehr_hoch';
  abendVerhalten: 'kontrolliert' | 'manchmal' | 'oft_essen' | 'leer';
}

// ─── V3: Derived types ────────────────────────────────────────────────────────

export type ErnaehrungsTyp = 'chaos' | 'craving' | 'struktur' | 'stabil';
export type BewegungsTyp = 'unteraktiviert' | 'ueberlastet' | 'unstrukturiert' | 'stabil';
export type SchlafTyp = 'zu-wenig' | 'rhythmus' | 'abschalten' | 'regeneration' | 'stabil';
export type MentalTyp = 'emotionales-essen' | 'reizueberflutung' | 'struktur' | 'decision-fatigue';
export type MentalTrigger = 'stress' | 'belohnung' | null;

// ─── State ────────────────────────────────────────────────────────────────────

interface ResetState {
  // Existing fields
  email: string | null;
  name: string | null;
  goal: Goal | null;
  hurdle: Hurdle | null;
  currentDay: number;
  days: Record<string, DayData>;
  baseline: BaselineData | null;
  reflection: ReflectionData | null;
  homescreenHintShown: boolean;
  midFunnelIntent: 'alone' | 'guided' | null;
  frictionNote: string | null;
  // V3: Raw pillar inputs
  tag1Data: Tag1Data | null;
  tag2Data: Tag2Data | null;
  tag3Data: Tag3Data | null;
  tag4Data: Tag4Data | null;
  // V3: Derived types (persisted)
  ernaehrungsTyp: ErnaehrungsTyp | null;
  bewegungsTyp: BewegungsTyp | null;
  schlafTyp: SchlafTyp | null;
  mentalTyp: MentalTyp | null;
  mentalTrigger: MentalTrigger;
  // V3: Completion tracking
  pillarQuestionsAnswered: Record<number, boolean>;
  koerperdatenSyncConsent: boolean;
}

interface ResetContextValue extends ResetState {
  // Existing setters
  setEmail: (email: string) => void;
  setName: (name: string) => void;
  setGoal: (goal: Goal) => void;
  setHurdle: (hurdle: Hurdle) => void;
  setBaseline: (data: BaselineData) => void;
  setMidFunnelIntent: (intent: 'alone' | 'guided') => void;
  setFrictionNote: (note: string) => void;
  toggleTask: (day: number, taskIndex: number) => void;
  completeDay: (day: number, rating: Rating, note?: string) => void;
  setReflection: (data: ReflectionData) => void;
  markHomescreenHintShown: () => void;
  resetAll: () => void;
  getDayData: (day: number) => DayData;
  completedTaskCount: (day: number) => number;
  // V3 setters
  setTag1Data: (data: Tag1Data, typ: ErnaehrungsTyp) => void;
  setTag2Data: (data: Tag2Data, typ: BewegungsTyp) => void;
  setTag3Data: (data: Tag3Data, typ: SchlafTyp) => void;
  setTag4Data: (data: Tag4Data, typ: MentalTyp, trigger: MentalTrigger) => void;
  markPillarAnswered: (day: number) => void;
  setKoerperdatenSyncConsent: (consent: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDefaultDay(dayNum: number): DayData {
  const content = DAY_CONTENT[dayNum - 1];
  const taskCount = content ? content.tasks.length : 0;
  return { tasks: new Array(taskCount).fill(false), rating: null, note: null, completed: false, completedAt: null };
}

const STORAGE_KEY = 'caliness_reset';

const DEFAULT_STATE: ResetState = {
  email: null, name: null, goal: null, hurdle: null,
  currentDay: 1, days: {}, baseline: null, reflection: null,
  homescreenHintShown: false, midFunnelIntent: null, frictionNote: null,
  tag1Data: null, tag2Data: null, tag3Data: null, tag4Data: null,
  ernaehrungsTyp: null, bewegungsTyp: null, schlafTyp: null,
  mentalTyp: null, mentalTrigger: null,
  pillarQuestionsAnswered: {}, koerperdatenSyncConsent: false,
};

function loadState(): ResetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults so new fields always exist
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_STATE };
}

function saveState(state: ResetState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ResetContext = createContext<ResetContextValue | null>(null);

export function ResetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ResetState>(loadState);

  useEffect(() => { saveState(state); }, [state]);

  const setEmail = useCallback((email: string) => setState(s => ({ ...s, email })), []);
  const setName = useCallback((name: string) => setState(s => ({ ...s, name })), []);
  const setGoal = useCallback((goal: Goal) => setState(s => ({ ...s, goal })), []);
  const setHurdle = useCallback((hurdle: Hurdle) => setState(s => ({ ...s, hurdle })), []);
  const setBaseline = useCallback((baseline: BaselineData) => setState(s => ({ ...s, baseline })), []);
  const setMidFunnelIntent = useCallback((midFunnelIntent: 'alone' | 'guided') => setState(s => ({ ...s, midFunnelIntent })), []);
  const setFrictionNote = useCallback((frictionNote: string) => setState(s => ({ ...s, frictionNote })), []);

  const toggleTask = useCallback((day: number, taskIndex: number) => {
    setState(s => {
      const dayKey = String(day);
      const existing = s.days[dayKey] || getDefaultDay(day);
      const newTasks = [...existing.tasks];
      newTasks[taskIndex] = !newTasks[taskIndex];
      return { ...s, days: { ...s.days, [dayKey]: { ...existing, tasks: newTasks } } };
    });
  }, []);

  const completeDay = useCallback((day: number, rating: Rating, note?: string) => {
    setState(s => {
      const dayKey = String(day);
      const existing = s.days[dayKey] || getDefaultDay(day);
      return {
        ...s,
        currentDay: Math.max(s.currentDay, day + 1),
        days: {
          ...s.days,
          [dayKey]: { ...existing, rating, note: note || null, completed: true, completedAt: Date.now() },
        },
      };
    });
  }, []);

  const setReflection = useCallback((reflection: ReflectionData) => setState(s => ({ ...s, reflection })), []);
  const markHomescreenHintShown = useCallback(() => setState(s => ({ ...s, homescreenHintShown: true })), []);

  const resetAll = useCallback(() => setState({ ...DEFAULT_STATE }), []);

  const getDayData = useCallback((day: number): DayData => {
    return state.days[String(day)] || getDefaultDay(day);
  }, [state.days]);

  const completedTaskCount = useCallback((day: number): number => {
    const d = state.days[String(day)];
    if (!d) return 0;
    return d.tasks.filter(Boolean).length;
  }, [state.days]);

  // V3 setters
  const setTag1Data = useCallback((tag1Data: Tag1Data, ernaehrungsTyp: ErnaehrungsTyp) => {
    setState(s => ({ ...s, tag1Data, ernaehrungsTyp }));
  }, []);

  const setTag2Data = useCallback((tag2Data: Tag2Data, bewegungsTyp: BewegungsTyp) => {
    setState(s => ({ ...s, tag2Data, bewegungsTyp }));
  }, []);

  const setTag3Data = useCallback((tag3Data: Tag3Data, schlafTyp: SchlafTyp) => {
    setState(s => ({ ...s, tag3Data, schlafTyp }));
  }, []);

  const setTag4Data = useCallback((tag4Data: Tag4Data, mentalTyp: MentalTyp, mentalTrigger: MentalTrigger) => {
    setState(s => ({ ...s, tag4Data, mentalTyp, mentalTrigger }));
  }, []);

  const markPillarAnswered = useCallback((day: number) => {
    setState(s => ({
      ...s,
      pillarQuestionsAnswered: { ...s.pillarQuestionsAnswered, [day]: true },
    }));
  }, []);

  const setKoerperdatenSyncConsent = useCallback((koerperdatenSyncConsent: boolean) => {
    setState(s => ({ ...s, koerperdatenSyncConsent }));
  }, []);

  return (
    <ResetContext.Provider value={{
      ...state,
      setEmail, setName, setGoal, setHurdle, setBaseline,
      setMidFunnelIntent, setFrictionNote, toggleTask, completeDay,
      setReflection, markHomescreenHintShown, resetAll, getDayData, completedTaskCount,
      setTag1Data, setTag2Data, setTag3Data, setTag4Data,
      markPillarAnswered, setKoerperdatenSyncConsent,
    }}>
      {children}
    </ResetContext.Provider>
  );
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

const FALLBACK: ResetContextValue = {
  ...DEFAULT_STATE,
  setEmail: () => {}, setName: () => {}, setGoal: () => {}, setHurdle: () => {},
  setBaseline: () => {}, setMidFunnelIntent: () => {}, setFrictionNote: () => {},
  toggleTask: () => {}, completeDay: () => {}, setReflection: () => {},
  markHomescreenHintShown: () => {}, resetAll: () => {},
  getDayData: (day: number) => getDefaultDay(day),
  completedTaskCount: () => 0,
  setTag1Data: () => {}, setTag2Data: () => {}, setTag3Data: () => {}, setTag4Data: () => {},
  markPillarAnswered: () => {}, setKoerperdatenSyncConsent: () => {},
};

export function useReset() {
  const ctx = useContext(ResetContext);
  return ctx ?? FALLBACK;
}
