import type { ComponentType } from 'react';
import type { ResetState } from '@/contexts/ResetContext';
import Day1Calculator from './Day1Calculator';
import Day2Meals from './Day2Meals';
import Day3Movement from './Day3Movement';
import Day4Sleep from './Day4Sleep';
import Day5Saboteur from './Day5Saboteur';
import Day6WeekBuilder from './Day6WeekBuilder';

export interface DayToolEntry {
  Component: ComponentType;
  /** Whether the tool's interactive part is done — gates the Tagesauftrag + CTA. */
  isComplete: (ctx: ResetState) => boolean;
}

const hasTool = (ctx: ResetState, key: string) => !!ctx.tools?.[key];

export const DAY_TOOLS: Record<string, DayToolEntry> = {
  day1: { Component: Day1Calculator, isComplete: ctx => !!ctx.profile },
  day2: { Component: Day2Meals, isComplete: ctx => hasTool(ctx, 'day2') },
  day3: { Component: Day3Movement, isComplete: ctx => hasTool(ctx, 'day3') },
  day4: { Component: Day4Sleep, isComplete: ctx => hasTool(ctx, 'day4') },
  day5: { Component: Day5Saboteur, isComplete: ctx => hasTool(ctx, 'day5') },
  day6: { Component: Day6WeekBuilder, isComplete: ctx => hasTool(ctx, 'day6') },
};
