---
name: Navigation restructure to 5 meaningful tabs
description: Bottom nav changed from Home/Check-In/Ziel/Fortschritt/CALI to Home/Heute/Ziel/Fortschritt/Coach
type: project
---

Bottom nav (BottomNav.tsx) restructured on 2026-03-22 to Option A:

- **Home** (logo) -- /app/home
- **Heute** (Sun icon) -- /app/heute (new AppHeute.tsx page, daily hub)
- **Ziel** (Target) -- /app/zielsystem (added pillar sub-nav grid on summary view)
- **Fortschritt** (TrendingUp) -- /app/progress (added prominent Wochenbericht button)
- **Coach** (Sparkles) -- /app/coach

**AppHeute page:** If check-in not done, renders AppCheckIn directly. If done, shows TodaysPlanSection + NutritionDayFeed + QuickMealLog button + link to nutrition page.

**Why:** Nutrition, Training Log, My Plans, Weekly Report, Companion were only reachable via deep links. Users never discovered these features.

**How to apply:** All existing routes in App.tsx preserved. The /app/checkin route still works for deep links. BottomNav active state matches `/app/heute` OR `/app/checkin`. Fortschritt matches `/app/progress` OR `/app/weekly-report`. Ziel matches several sub-routes including `/app/my-plans`.
