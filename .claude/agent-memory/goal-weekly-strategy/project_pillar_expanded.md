---
name: pillar_card_expanded
description: PillarCardExpanded component - context-aware expanded pillar card in the Wochenform section
type: project
---

PillarCardExpanded component created at `src/components/goal/PillarCardExpanded.tsx`.

**Why:** The previous expanded pillar cards were completely generic -- showing static assessment sub-indicators, a score-band tip, and a plan-creation button regardless of context. No awareness of live check-in data, plan state, or goal relevance.

**How to apply:** The new component renders 5-6 contextual sections per pillar:
1. WOCHENSTATUS: Score badge + trend + pillar-specific status line (training days, sleep hours, stress, meal logs)
2. BEOBACHTUNG: Data-driven 1-2 sentence observation using actual check-in values
3. ZIEL-RELEVANZ: Goal-specific text connecting this pillar to the user's goal type (shown when goalPlan exists)
4. AKTIVER PLAN: Compact preview of today's plan data with "Anpassen" button (shown when plan exists)
5. EMPFEHLUNG: Intelligent no-plan recommendation with context-specific text (shown when no plan)
6. NACHSTE AKTION: Context-aware CTA that varies based on score strength + plan existence

Context detection: computes weeklyScore, trend, isStrong/isWeak/isCritical, hasPlan, isGoalPrimary/Secondary, dayActivityCount, and pillar-specific metrics (trainingDays, avgSleepHours, avgStress, mealLogDays, etc.)

Props receive: checkInHistory, scoreHistory, activityLog, nutritionLogs, goalPlan from AppContext.

Integrated in GoalSummaryDashboard.tsx by replacing the old expanded section (lines ~579-593).
