---
name: Ziel Module Architecture
description: File paths, component hierarchy, data models, and structure of the Ziel/Goal module in CALINESS
type: project
---

## Key Files

- **Page**: `src/pages/AppZielsystem.tsx` - Step-based goal setup wizard (selection -> questions -> realism -> assessment -> summary, plus pillar detail views)
- **Summary Dashboard**: `src/components/goal/GoalSummaryDashboard.tsx` - Main post-setup view, restructured as Weekly Strategy Center
- **Personalization Modal**: `src/components/goal/PillarPersonalizationModal.tsx` - Per-pillar personalization flow (2-4 questions per pillar)
- **Plans Page**: `src/pages/AppMyPlans.tsx` - Detailed plan execution page with check-in tracking
- **Legacy Planner**: `src/pages/AppGoalPlanner.tsx` - Older goal planner (large file, older design)
- **Goal Assessment**: `src/lib/goalAssessment.ts` - Question definitions, pillar assessment calculations, realism calculations
- **Focus Engine**: `src/lib/focusPillar.ts` - Weekly focus pillar selection, progressive pillar activation, next-pillar recommendations
- **Plan Generators**: `src/lib/pillarPlans.ts` - NutritionPlan, TrainingPlan, TipCard, MentalTip generation
- **Plan Helpers**: `src/lib/pillarPlanHelpers.ts` - generatePillarPlan() wraps individual generators

## Goal Components (src/components/goal/)

- `GoalSelection.tsx` - Goal type picker (7 extended goals)
- `GoalQuestions.tsx` - Follow-up questions per goal
- `GoalRealism.tsx` - Realism assessment display
- `GoalPillarAssessment.tsx` - 4-pillar assessment display
- `GoalTimeline.tsx` - Week progress timeline
- `PillarDetailNutrition/Training/Recovery/Mental.tsx` - Full plan generation views
- `PillarPersonalizationModal.tsx` - Bottom-sheet personalization per pillar

## Data Model

`GoalPlanData` (in AppContext.tsx, line 113):
- goalType, goalDescription, targetDate, targetWeeks, createdAt
- weeklyPlan (JSON blob - stores personalization data under `{pillar}Personalization` keys)
- realismResult, completedBlocks, remindersEnabled
- secondaryGoal, followUpAnswers, pillarAssessment
- activePillars, pillarActivationDates, pillarActivationAnswers
- nutritionPlan, trainingPlanData, recoveryTips, mentalTips
- planCheckInHistory (date -> key -> status)

Persisted via `setGoalPlan()` -> Supabase `goal_plans` table (upsert by user_id) + localStorage backup.
The `weekly_plan` column stores: nutritionPlan, trainingPlanData, recoveryTips, mentalTips, planCheckInHistory, activityLogs, activePillars, pillarActivationDates/Answers.

## Current Page Structure (as of 2026-03-19)

1. **Zielstatus** (compact) - Goal name + type chip + Ziel-Fit badge + Engpass + Wochenhebel + AI interpretation line
2. **Wochenfokus** - Weekly focus checklist with celebration feedback
3. **Aktive Plane** - 4 plan preview cards (Training/Ernahrung/Recovery/Mental) with real content previews + Anpassen/Plan erstellen buttons
4. **Wochenform** - 2x2 pillar grid with scores, trends, expandable sub-indicators
5. **Zielbereich** - Compact 2x2 macro grid (kcal, protein, fat, carbs)
6. **Wochenauswertung** - Helped/Hurt evaluation (conditional on check-in data)
7. **Fokus nachste Woche** - 1-3 next-week recommendations
8. **Vertiefende Details** - 4 direction accordions (lowest priority)
9. **Timeline** + footer

## Personalization Flow

Each pillar has a bottom-sheet modal (PillarPersonalizationModal) with 3-4 questions:
- Ernahrung: mainGoal, challenge, style, intolerances
- Training: location, daysPerWeek, minutesPerSession, mainFocus
- Recovery: mainProblem, screenTime, stressSleep, routineTime
- Mental: mainProblem, stressTiming, support

Answers save to `goalPlan.weeklyPlan.{pillar}Personalization`. After saving, `generatePillarPlan()` regenerates the plan.

**Why:** The old structure hid plans behind a link to /app/my-plans and had no personalization flow. Plans were auto-generated from initial assessment only.

**How to apply:** Any future work on the Ziel module should maintain the hierarchy order and plan preview card pattern established here.
