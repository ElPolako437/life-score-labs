import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DAY_CONTENT } from '@/lib/dayContent';

export type Goal = 'energy' | 'fatloss' | 'structure' | 'sleep';
export type Hurdle = 'stress' | 'time' | 'nutrition' | 'consistency' | 'evening';
export type Rating = 'good' | 'difficult' | 'failed';
export type Sex = 'male' | 'female';
export type Activity = 'low' | 'moderate' | 'high';
export type Daily = 'sedentary' | 'mixed' | 'active';
export type LeverKey = 'protein' | 'meals' | 'movement' | 'sleep' | 'stress' | 'structure';

/** Tag-1 start profile: body inputs + derived nutrition anchors. */
export interface StartProfile {
  sex: Sex;
  age: number;
  height: number;
  weight: number;
  activity: Activity;
  daily: Daily;
  bmr: number;
  tdee: number;
  calLow: number;
  calHigh: number;
  proteinLow: number;
  proteinHigh: number;
  mealCount: number;
  mainLever: LeverKey;
  createdAt: number;
}

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

export interface ResetState {
  email: string | null;
  name: string | null;
  goal: Goal | null;
  hurdle: Hurdle | null;
  sex: Sex | null;
  weight: number | null;
  currentDay: number;
  days: Record<string, DayData>;
  baseline: BaselineData | null;
  reflection: ReflectionData | null;
  homescreenHintShown: boolean;
  midFunnelIntent: 'alone' | 'guided' | null;
  frictionNote: string | null;
  profile: StartProfile | null;
  tools: Record<string, unknown>;
}

interface ResetContextValue extends ResetState {
  setEmail: (email: string) => void;
  setName: (name: string) => void;
  setGoal: (goal: Goal) => void;
  setHurdle: (hurdle: Hurdle) => void;
  setBody: (sex: Sex, weight: number) => void;
  setProfile: (profile: StartProfile) => void;
  setTool: (key: string, data: unknown) => void;
  setBaseline: (data: BaselineData) => void;
  setMidFunnelIntent: (intent: 'alone' | 'guided') => void;
  setFrictionNote: (note: string) => void;
  toggleTask: (day: number, taskIndex: number) => void;
  completeDay: (day: number, rating: Rating, note?: string) => void;
  setReflection: (data: ReflectionData) => void;
  markHomescreenHintShown: () => void;
  restoreState: (partial: Partial<ResetState>) => void;
  resetAll: () => void;
  getDayData: (day: number) => DayData;
  completedTaskCount: (day: number) => number;
}

function getDefaultDay(dayNum: number): DayData {
  const content = DAY_CONTENT[dayNum - 1];
  const taskCount = content ? content.tasks.length : 3;
  return {
    tasks: new Array(taskCount).fill(false),
    rating: null,
    note: null,
    completed: false,
    completedAt: null,
  };
}

const STORAGE_KEY = 'caliness_reset';

function loadState(): ResetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    email: null,
    name: null,
    goal: null,
    hurdle: null,
    sex: null,
    weight: null,
    currentDay: 1,
    days: {},
    baseline: null,
    reflection: null,
    homescreenHintShown: false,
    midFunnelIntent: null,
    frictionNote: null,
    profile: null,
    tools: {},
  };
}

function saveState(state: ResetState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const ResetContext = createContext<ResetContextValue | null>(null);

export function ResetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ResetState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setEmail = useCallback((email: string) => {
    setState(s => ({ ...s, email }));
  }, []);

  const setName = useCallback((name: string) => {
    setState(s => ({ ...s, name }));
  }, []);

  const setGoal = useCallback((goal: Goal) => {
    setState(s => ({ ...s, goal }));
  }, []);

  const setHurdle = useCallback((hurdle: Hurdle) => {
    setState(s => ({ ...s, hurdle }));
  }, []);

  const setBody = useCallback((sex: Sex, weight: number) => {
    setState(s => ({ ...s, sex, weight }));
  }, []);

  const setProfile = useCallback((profile: StartProfile) => {
    // Mirror sex/weight at top level so legacy consumers (getPersonalAnchor) keep working.
    setState(s => ({ ...s, profile, sex: profile.sex, weight: profile.weight }));
  }, []);

  const setTool = useCallback((key: string, data: unknown) => {
    setState(s => ({ ...s, tools: { ...s.tools, [key]: data } }));
  }, []);

  const setBaseline = useCallback((data: BaselineData) => {
    setState(s => ({ ...s, baseline: data }));
  }, []);

  const setMidFunnelIntent = useCallback((intent: 'alone' | 'guided') => {
    setState(s => ({ ...s, midFunnelIntent: intent }));
  }, []);

  const setFrictionNote = useCallback((note: string) => {
    setState(s => ({ ...s, frictionNote: note }));
  }, []);

  const toggleTask = useCallback((day: number, taskIndex: number) => {
    setState(s => {
      const dayKey = String(day);
      const existing = s.days[dayKey] || getDefaultDay(day);
      const newTasks = [...existing.tasks];
      newTasks[taskIndex] = !newTasks[taskIndex];
      return {
        ...s,
        days: { ...s.days, [dayKey]: { ...existing, tasks: newTasks } },
      };
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

  const setReflection = useCallback((data: ReflectionData) => {
    setState(s => ({ ...s, reflection: data }));
  }, []);

  const markHomescreenHintShown = useCallback(() => {
    setState(s => ({ ...s, homescreenHintShown: true }));
  }, []);

  const restoreState = useCallback((partial: Partial<ResetState>) => {
    // Merge des serverseitig wiederhergestellten Stands über den (leeren) State.
    setState(s => ({ ...s, ...partial }));
  }, []);

  const resetAll = useCallback(() => {
    const fresh: ResetState = {
      email: null,
      name: null,
      goal: null,
      hurdle: null,
      sex: null,
      weight: null,
      currentDay: 1,
      days: {},
      baseline: null,
      reflection: null,
      homescreenHintShown: false,
      midFunnelIntent: null,
      frictionNote: null,
      profile: null,
      tools: {},
    };
    setState(fresh);
  }, []);

  const getDayData = useCallback((day: number): DayData => {
    return state.days[String(day)] || getDefaultDay(day);
  }, [state.days]);

  const completedTaskCount = useCallback((day: number): number => {
    const d = state.days[String(day)];
    if (!d) return 0;
    return d.tasks.filter(Boolean).length;
  }, [state.days]);

  return (
    <ResetContext.Provider
      value={{
        ...state,
        setEmail,
        setName,
        setGoal,
        setHurdle,
        setBody,
        setProfile,
        setTool,
        setBaseline,
        setMidFunnelIntent,
        setFrictionNote,
        toggleTask,
        completeDay,
        setReflection,
        markHomescreenHintShown,
        restoreState,
        resetAll,
        getDayData,
        completedTaskCount,
      }}
    >
      {children}
    </ResetContext.Provider>
  );
}

const FALLBACK: ResetContextValue = {
  email: null, name: null, goal: null, hurdle: null, sex: null, weight: null, currentDay: 1,
  days: {}, baseline: null, reflection: null, homescreenHintShown: false,
  midFunnelIntent: null, frictionNote: null, profile: null, tools: {},
  setEmail: () => {}, setName: () => {}, setGoal: () => {}, setHurdle: () => {},
  setBody: () => {}, setProfile: () => {}, setTool: () => {}, setBaseline: () => {}, setMidFunnelIntent: () => {}, setFrictionNote: () => {},
  toggleTask: () => {}, completeDay: () => {}, setReflection: () => {},
  markHomescreenHintShown: () => {}, restoreState: () => {}, resetAll: () => {},
  getDayData: (day: number) => getDefaultDay(day),
  completedTaskCount: () => 0,
};

export function useReset() {
  const ctx = useContext(ResetContext);
  return ctx ?? FALLBACK;
}
