---
name: personalization_first_plan_creation
description: Architecture of the personalization-first plan creation flow - how plans are generated from user answers, not generic defaults
type: project
---

The plan creation flow was redesigned 2026-03-19 to be personalization-first.

**Why:** Previously, "Plan erstellen" navigated to a PillarDetail screen that generated a generic plan from initial goal answers. The personalization modal only appeared for existing plans ("Anpassen"). This felt weak because plans were not tailored.

**How to apply:**
- "Plan erstellen" (empty state) now opens `PillarPersonalizationModal` directly via `setPersonalizationPillar()` instead of calling `onOpenPillar()`
- "Anpassen" (existing plan) also opens the same modal with `existingAnswers` pre-filled
- The modal saves personalization answers to `goalPlan.weeklyPlan[pillarKey + 'Personalization']`
- Plan generation routes through `pillarPlanHelpers.generatePillarPlan()` which calls the upgraded generators in `pillarPlans.ts`

**Key files:**
- `src/components/goal/PillarPersonalizationModal.tsx` - Multi-step premium modal with slide animations
- `src/lib/pillarPlanHelpers.ts` - Bridge function that passes personalization + calorie/protein targets to generators
- `src/lib/pillarPlans.ts` - Contains exercise banks by location (gym/home/outdoor), focus-based session selection, dietary style filtering, targeted recovery/mental tip selection
- `src/components/goal/GoalSummaryDashboard.tsx` - PlanPreviewCard wired to open modal for both create and edit

**Personalization data flow:**
1. User answers 3-4 questions in modal
2. Answers saved as `Record<string, string>` to `goalPlan.weeklyPlan.{pillar}Personalization`
3. `generatePillarPlan()` receives answers + pillarScore + goalType
4. For nutrition: answers.mainGoal, .challenge, .style drive recipe selection and high-protein preference
5. For training: answers.location selects exercise bank (gym/home/outdoor), answers.mainFocus selects session sequence, answers.frequency determines days/duration
6. For recovery: answers.mainProblem + .mainCause drive targeted tip selection and focus action text
7. For mental: answers.mainProblem + .stressTiming + .desiredEffect drive targeted tip selection
