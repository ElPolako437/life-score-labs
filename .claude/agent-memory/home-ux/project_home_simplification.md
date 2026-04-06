---
name: Home screen simplification architecture
description: How the Home screen was restructured into Hero + primary action + quick stats + collapsible detail section
type: project
---

Home screen (AppHome.tsx) restructured on 2026-03-22 into 4 visible zones:

1. **Hero** (unchanged) -- Score ring, companion, pillar 2x2 grid, greatest leverage hint
2. **Primary action card** -- "Heute wichtig" CTA (check-in if not done, focus action if done)
3. **Quick stats strip** -- horizontal scrollable chips: Streak, Protein progress, Focus pillar (only visible after check-in)
4. **"Dein Tag im Detail"** -- collapsible section (collapsed by default) containing: TodaysPlanSection, NutritionDayFeed, Mini-Aktionen/Autopilot, Coach-Impuls quote. Shows action count badge when collapsed.

**Why:** Previous Home had 10+ visible blocks causing cognitive overload. Users couldn't identify their single most important next action.

**How to apply:** Any new Home content should go inside the collapsible detail section unless it is the single most important daily action. The quick stats strip is the place for compact at-a-glance metrics.

State: `detailExpanded` (useState, default false) controls the collapsible section.
