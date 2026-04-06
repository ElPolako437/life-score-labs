---
name: Plan System Architecture
description: Complete data flow map of CALINESS plan system - tables, hooks, scoring, persistence
type: project
---

## Plan System Data Flow (verified 2026-03-20)

### Key Tables (Supabase)
- `goal_plans` - stores plan data in `weekly_plan` JSONB column (contains nutritionPlan, trainingPlanData, recoveryTips, mentalTips, planCheckInHistory, activePillars, etc.)
- `activity_logs` - individual activity log entries (pillar, type, label, duration, source)
- `score_history` - daily score snapshots (score + per-pillar scores)
- `nutrition_logs` - nutrition log entries (meals, estimatedProteinTotal, qualityRating)
- `daily_checkins` - daily check-in data

### State Management
- AppContext.tsx (React Context) is the central state store
- `activityLogState` (useState) holds in-memory activity logs, initialized from localStorage, loaded from Supabase `activity_logs`
- `goalPlan` (GoalPlanData) holds all plan data including `planCheckInHistory`
- `pillarScores` is a useMemo that depends on `todayCheckIn`, `nutritionLogs`, `nutritionTargets`, `activityLogState`

### Plan Check Flow
1. User checks item -> `toggleCheck(key)` in AppMyPlans.tsx
2. Updates `planCheckInHistory` via `setGoalPlan` -> persists to `goal_plans.weekly_plan` in Supabase
3. Calls `addActivityLog()` with pillar/type/label/source='plan'
4. `addActivityLog` in AppContext: writes to `activityLogState` + localStorage + Supabase `activity_logs` + appends to `goalPlan.activityLogs`
5. Also recalculates pillarScores and upserts to `score_history`
6. For meal items: also calls `addNutritionLog()` to feed protein tracking into ernaehrung score

### Pillar Score Calculation
- `calculatePillarScores()` in scoring.ts
- Takes: checkIn, todayNutritionLogs, nutritionTargets, todayActivityLog
- Each pillar has a base score from checkIn data + bonus from activityLog entries for that pillar
- Bewegung bonus: +5 per log + duration-based bonus (max 15)
- Ernaehrung bonus: +3 per log (max 10); also full nutrition score path if >=2 nutrition logs
- Regeneration bonus: +5 per log + duration-based (max 15)
- Mental bonus: +5 per log + duration-based (max 15)

### Reload Persistence
- `planCheckInHistory` stored inside `goal_plans.weekly_plan` JSONB -> restored on load (AppContext line ~487)
- Activity logs loaded from `activity_logs` table on app hydration
- Score history loaded from `score_history` table

### Weekly Aggregation
- `computeWeeklyAggregation()` in weeklyAggregation.ts
- Takes `weekActivityLog` -> counts per-pillar consistency (days with >=1 log per pillar)
- Plan-sourced logs count equally to manual logs (both are ActivityLog entries)

### Training Log System (added 2026-03-20)
- `training_logs` table: id, user_id, date, type, duration, exercises (jsonb), source, note, plan_session_type, created_at
- `TrainingLog` type in AppContext: { date, exercises: TrainingExercise[], duration, type, source?, planSessionType?, note? }
- `TrainingExercise`: { name, sets, reps (string), weight (number) }
- `addTrainingLog()` in AppContext: writes to state + localStorage + Supabase
- Loaded from Supabase on hydration (AppContext line ~554)
- TrainingLog is SEPARATE from ActivityLog -- both needed for a complete training entry:
  - ActivityLog -> pillar scoring (via `addActivityLog()`)
  - TrainingLog -> exercise detail persistence (via `addTrainingLog()`)
- ExerciseDetailForm component: reusable exercise entry with autocomplete + previous performance lookup
- Used in: AppMyPlans (inline in TrainingDayCard), AppTrainingLog (full page), ActivityLogSheet (optional for Krafttraining)

### Ingredient-Level Meal Customization (added 2026-03-20)
- `MealIngredient` type in pillarPlans.ts: { name, amount, unit ('g'|'ml'|'stk'), protein_per_100, calories_per_100 }
- `NutritionLogMealIngredient` mirror type in AppContext.tsx (for log persistence)
- `INGREDIENT_DB` in pillarPlans.ts: ~50 common German ingredients with protein/calorie per 100g
- `buildNutritionIngredients()`: auto-generates MealIngredient[] from Recipe.ingredients using INGREDIENT_DB + amount parsing
- `calcMealNutrition()`: pure function reducing MealIngredient[] to { protein, calories }
- `MealItem.nutritionIngredients?: MealIngredient[]`: carried through `recipeToMealItem()` into every generated meal
- `MealIngredientEditor` component in AppMyPlans.tsx: inline expandable editor within NutritionDayCard
- Three-tier meal interaction: (1) quick check=Gegessen, (2) expand detail, (3) "Anpassen" opens ingredient editor
- Custom logs include `customIngredients` and `estimatedCalories` in the meals JSONB -- no migration needed
- `handleCustomMealLog()`: marks checked + addActivityLog + addNutritionLog with custom protein/calories
- `nutrition_logs.meals` JSONB column accepts arbitrary structure, so new fields persist without schema changes

### Nutrition Plan System (added 2026-03-21)
- `NutritionLogMeal` type in AppContext: { name, type, description, proteinLevel, estimatedProtein, time, customIngredients?, estimatedCalories?, status?, swappedFrom? }
- `status` field: 'eaten' | 'swapped' | 'skipped' -- tracks how a planned meal was handled
- `swappedFrom` field: original meal name when user swaps via MealSwapSheet
- `MealSwapSheet` component: bottom sheet showing 3 alternatives scored by similarity (protein/calorie/prepTime match)
- `MealCustomizeSheet` component: bottom sheet for ingredient-level amount adjustment with live nutrition recalculation
- `NutritionDayFeed` component: daily "what I ate" feed showing status icons (check/swap/skip), used on AppHome (compact) and AppNutrition
- `nutritionDayInsight.ts`: generates contextual longevity-style interpretation per day, goal-aware
- `mealSwap.ts`: `findSwapCandidates()` uses `RECIPE_TEMPLATES` to find alternatives by mealType + similarity scoring
- `dailyPlanItems.ts`: `getTodaysMealItems()` extracts today's meals from goalPlan.nutritionPlan for the feed
- `TodaysPlanSection` orchestrates: eat (handleLog), swap (handleSwapComplete), customize (handleCustomizeComplete), skip (handleSkip)
- Day index calculation: `jsDay === 0 ? 6 : jsDay - 1` (Montag=0 .. Sonntag=6, matching pillarPlans.ts DAYS array)
- planCheckInHistory keys for meals: `meal_${dayIdx}_${mealIdx}` -- must use correct dayIdx!
- Weekly aggregation counts swapped meals via `m.swappedFrom || m.status === 'swapped'`
- `nutritionContext` summary string included in weeklyAggregation for AI weekly report

### 4 Pillars
- bewegung (Activity icon, primary/green)
- ernaehrung (Apple icon, orange)
- regeneration (Moon icon, blue)
- mental (Brain icon, purple)

**Why:** This architecture map eliminates the need to re-trace the full data flow in future conversations.
**How to apply:** Use this as the starting point for any plan system debugging or feature work.
