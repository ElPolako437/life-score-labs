---
name: TodaysPlanSection redesign
description: Home plan section simplified from 4-item card list to 1+2 spotlight layout with pillar diversity and collapsed done state
type: project
---

Redesigned TodaysPlanSection from a flat 4-item card list to a focused spotlight layout.

**Key decisions:**
- Max 3 items (was 4), enforced pillar diversity (no two items from same pillar)
- Primary item (first) gets left accent border in pillar color + source label
- Secondary items (up to 2) are compact inline rows without cards
- All-done state collapses to single "Heutige Plane erledigt" confirmation line
- Source labels ("Aus deinem Trainingsplan") link to /app/zielsystem
- Removed doneCount/totalCount counter from header
- Header now has "Alle Plane" link right-aligned to /app/zielsystem
- Footer "...und X weitere" link removed

**Files changed:**
- `src/components/app/TodaysPlanSection.tsx` — full rewrite with PrimaryPlanItem and SecondaryPlanItem sub-components
- `src/lib/dailyPlanItems.ts` — prioritizePlanItems now enforces pillar uniqueness via Set

**Why:** The old layout felt like a to-do list. The new layout feels like a smart daily focus prompt.

**How to apply:** Any future changes to the plan section should maintain the 1+2 hierarchy and the calm, non-list feel.
