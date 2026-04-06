---
name: nutrition_system_architecture
description: Complete architecture of CALINESS nutrition plan system - meal swap, customize, tracking, scoring, weekly report integration
type: project
---

## Nutrition System Architecture

### Key Types (AppContext.tsx)
- `NutritionLogMeal`: name, type, description, proteinLevel, estimatedProtein, time, customIngredients?, estimatedCalories?, status?('eaten'|'swapped'|'skipped'), swappedFrom?
- `NutritionLogEntry`: date, meals: NutritionLogMeal[], estimatedProteinTotal, qualityRating
- `NutritionLogMealIngredient`: name, amount, unit, protein_per_100, calories_per_100
- `GoalPlanData.nutritionPlan.days[idx].meals`: MealItem[] (from pillarPlans.ts)
- `MealItem`: id, name, calories, protein, ingredients, nutritionIngredients? (MealIngredient[]), steps?, prepTime?, longevityBenefit?

### Data Flow: Meal Actions
1. User action (eat/swap/customize/skip) in AppNutrition, AppMyPlans, or TodaysPlanSection
2. `addNutritionLog()` writes to state + Supabase `nutrition_logs` table
3. `setGoalPlan()` updates `planCheckInHistory[today][meal_X_Y]` = 'done'|'skipped'
4. `addNutritionLog` also recalculates pillar scores + score_history immediately
5. NutritionDayFeed reads from nutritionLogs + planCheckInHistory to build feed

### Key Components
- `AppNutrition.tsx` (page) - Dashboard with planned meals, protein tracker, scoring, 3-action UI (Gegessen/Tauschen/Anpassen)
- `AppMyPlans.tsx` (page) - Ernährung tab with NutritionDayCard, 3-action UI (Gegessen/Tauschen/Anpassen), MealSwapSheet + MealCustomizeSheet integration
- `TodaysPlanSection.tsx` - Home screen plan items with meal swap/customize support
- `NutritionDayFeed.tsx` - Timeline feed showing eaten/swapped/skipped/planned meals
- `MealSwapSheet.tsx` - Bottom sheet showing 3 scored alternatives from RECIPE_TEMPLATES
- `MealCustomizeSheet.tsx` - Bottom sheet for ingredient-level customization with live totals
- `QuickMealLog.tsx` - Free-text meal logging with AI protein estimation

### Key Libraries
- `pillarPlans.ts`: RECIPE_TEMPLATES (80 recipes: 20 breakfast, 20 lunch, 20 dinner, 20 snack), INGREDIENT_DB (~100 items), generateNutritionPlan(), calcMealNutrition(), buildNutritionIngredients(). Recipe type has isVegetarian/isMeat/tags fields. NutritionPreferences interface for intolerance/activity/goal filtering. Plan generation uses weekly deduplication (usedIds per mealType), calorie-budget-aware slot allocation, goal-specific scoring, and intolerance ingredient filtering.
- `mealSwap.ts`: findSwapCandidates() scores by protein/calorie similarity, filters by mealType
- `nutritionDayInsight.ts`: generateNutritionDayInsight() for daily + generateWeeklyNutritionContext() for weekly
- `longevityNutrition.ts`: calculateLongevityNutritionScore() (6 factors), getNutritionInsight(), calculateWeeklyNutritionSummary(). calorieAdherence now uses actual estimatedCalories from logged meals (not hardcoded 50); falls back to neutral 50 when no calorie data available.
- `scoring.ts`: calculatePillarScores() uses todayNutritionLogs for ernaehrung score
- `weeklyAggregation.ts`: computeWeeklyAggregation() counts totalMealsLogged, swappedMeals, uniqueMealCount, builds nutritionContext

### Score Impact
- ernaehrung score: if >=2 nutrition logs + targets -> longevityNutritionScore blended with feeling; if >=2 logs without targets -> protein % based; else -> checkIn proteinQuality/hydration only
- Activity log bonus: ernaehrung pillar logs add +3 per log (max +10)

### Weekly Report Integration
- weekAgg.nutritionContext passed as nutritionData.nutritionContext to AI weekly-report function
- Report renders nutritionReview section with proteinConsistency, mealStructure, topPattern, nextWeekNutritionFocus

### AppMyPlans Nutrition Tab Architecture
- NutritionDayCard component: local to AppMyPlans.tsx (not extracted)
- Accepts onSwap, onCustomize, onSkip, isSkipped props for 3-action UI
- swapMealState/customizeMealState stored in AppMyPlans and drives MealSwapSheet/MealCustomizeSheet
- handleSwapMeal: logs swap with status:'swapped' + swappedFrom + marks planCheckIn as 'done'
- handleSkipMeal: only updates planCheckInHistory to 'skipped' (no nutrition log)
- handleCustomizeSheetComplete: delegates to handleCustomMealLog
- MealIngredientEditor: inline ingredient editor in NutritionDayCard (kept as fallback)

**Why:** Understanding this full chain prevents breaking data flow when modifying any single component.
**How to apply:** Always trace changes through the full meal action -> log -> score -> display chain.
