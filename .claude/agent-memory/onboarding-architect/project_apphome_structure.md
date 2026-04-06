---
name: apphome_structure
description: Key structural facts about AppHome.tsx — block layout, data sources, and where to insert new components
type: project
---

`/Users/davidgogulla/Desktop/caliness-age-decoded/src/pages/AppHome.tsx`

## Data

All app state comes from `useApp()` (AppContext). User auth object (`user.created_at`) comes from `useAuth()` (AuthContext).

Key data destructured from useApp:
- `checkInHistory` — array of DailyCheckIn, used for check-in completion signals
- `goalPlan` — GoalPlanData | null, contains `goalType`, `activePillars`, `weeklyPlan`, etc.
- `todayCheckIn` — today's DailyCheckIn or null
- `streak`, `longevityScore`, `pillarScores`, `profile`, `badges`, `activityLog`, `nutritionLogs`

## JSX Block Order (top to bottom)

1. Celebrations overlay (StreakCelebration, confetti, daily banner)
2. **BLOCK 1 — Hero card**: Companion + ScoreRing + 4 Pillar grid + Hebel row + Share button
3. **SetupChecklist** (inserted 2025-03-22)
4. **BLOCK 2 — "Heute wichtig"** primary action card (check-in prompt or focus action)
5. Quick stats strip (streak chip, protein chip, focus pillar chip) — only when hasCheckedIn
6. [Rest of home content — plan sections, nutrition, mini actions, etc.]

## Routes referenced in AppHome

- `/app/checkin` — daily check-in
- `/app/zielsystem` — goal setting + plan creation
- `/app/companion` — companion detail
- `/app/nutrition` — nutrition log
- `/app/profile` — user profile
- `/app/progress` — progress/history
