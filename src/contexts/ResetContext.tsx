import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DAY_CONTENT } from '@/lib/dayContent';

export type Goal = 'energy' | 'fatloss' | 'structure' | 'sleep';
export type Hurdle = 'stress' | 'time' | 'nutrition' | 'consistency' | 'evening';
export type Rating = 'good' | 'difficult' | 'failed';

export interface DayData {
  tasks: boolean[];
  rating: Rating | null;
  note: string | null;
  completed: boolean;
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

interface ResetState {
  email: string | null;
  name: string | null;
  goal: Goal | null;
  hurdle: Hurdle | null;
  currentDay: number;
  days: Record<string, DayData>;
  reflection: ReflectionData | null;
  homescreenHintShown: boolean;
}

interface ResetContextValue extends ResetState {
  setEmail: (email: string) => void;
  setName: (name: string) => void;
  setGoal: (goal: Goal) => void;
  setHurdle: (hurdle: Hurdle) => void;
  toggleTask: (day: number, taskIndex: number) => void;
  completeDay: (day: number, rating: Rating, note?: string) => void;
  setReflection: (data: ReflectionData) => void;
  markHomescreenHintShown: () => void;
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
    currentDay: 1,
    days: {},
    reflection: null,
    homescreenHintShown: false,
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
          [dayKey]: { ...existing, rating, note: note || null, completed: true },
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

  const resetAll = useCallback(() => {
    const fresh: ResetState = {
      email: null,
      name: null,
      goal: null,
      hurdle: null,
      currentDay: 1,
      days: {},
      reflection: null,
      homescreenHintShown: false,
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
        toggleTask,
        completeDay,
        setReflection,
        markHomescreenHintShown,
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
  email: null, name: null, goal: null, hurdle: null, currentDay: 1,
  days: {}, reflection: null, homescreenHintShown: false,
  setEmail: () => {}, setName: () => {}, setGoal: () => {}, setHurdle: () => {},
  toggleTask: () => {}, completeDay: () => {}, setReflection: () => {},
  markHomescreenHintShown: () => {}, resetAll: () => {},
  getDayData: (day: number) => getDefaultDay(day),
  completedTaskCount: () => 0,
};

export function useReset() {
  const ctx = useContext(ResetContext);
  return ctx ?? FALLBACK;
}
