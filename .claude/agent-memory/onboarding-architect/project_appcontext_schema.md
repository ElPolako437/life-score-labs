---
name: appcontext_schema
description: Key AppContext data structures relevant to onboarding — GoalPlanData, UserProfile, and the 4-pillar system
type: project
---

`/Users/davidgogulla/Desktop/caliness-age-decoded/src/contexts/AppContext.tsx`

## GoalPlanData (key fields for onboarding/pillar logic)

```ts
interface GoalPlanData {
  goalType: string;
  goalDescription: string;
  targetDate: string;
  targetWeeks: number;
  createdAt: string;
  weeklyPlan: any;
  completedBlocks: string[];
  // Progressive pillar activation
  activePillars?: string[];            // pillars the user has unlocked
  pillarActivationDates?: Record<string, string>;
  pillarActivationAnswers?: Record<string, Record<string, any>>;
  // Plan data
  nutritionPlan?: any;
  trainingPlanData?: any;
  recoveryTips?: any[];
  mentalTips?: any[];
  planCheckInHistory?: Record<string, Record<string, 'done' | 'partial' | 'skipped'>>;
  activityLogs?: ActivityLog[];
}
```

## 4 Pillars

Keys: `bewegung`, `ernaehrung`, `regeneration`, `mental`

Pillar scores range 0–100. Score of 50 with no check-in/activity = default (not real data).

Progressive pillar activation: users start with a subset of pillars active (`activePillars`). Locked pillars show at 35% opacity with a lock icon. Users can unlock via PillarActivationSheet.

## UserProfile

```ts
interface UserProfile {
  name: string; age: number;
  gender: 'männlich' | 'weiblich' | 'divers';
  height: number; weight: number;
  goals: string[];
  activityLevel: string; sleepQuality: string; stressLevel: string;
  onboardingComplete: boolean;
}
```

Onboarding is considered complete when `profile.onboardingComplete === true`.

## AuthContext

`/Users/davidgogulla/Desktop/caliness-age-decoded/src/contexts/AuthContext.tsx`

Exposes `user: User | null` (Supabase Auth User). `user.created_at` is an ISO string of account creation time — use this to determine account age for new-user features.
