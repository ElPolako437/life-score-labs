---
name: setup_checklist_feature
description: Details of the post-onboarding setup checklist added to AppHome, including data sources, visibility logic, and localStorage keys used
type: project
---

A `SetupChecklist` component was added at `/Users/davidgogulla/Desktop/caliness-age-decoded/src/components/app/SetupChecklist.tsx`.

It renders on `/app/home` between the hero block and the "Heute wichtig" primary action card.

## 4 Steps and Completion Signals

1. **Profil erstellt** — always `true` (user is past onboarding)
2. **Erster Check-in** — `checkInHistory.length > 0` (from AppContext)
3. **Ziel setzen** — `goalPlan !== null && !!goalPlan.goalType` (from AppContext)
4. **Plan erstellen** — `goalPlan?.activePillars && goalPlan.activePillars.length > 0` (from AppContext)

## localStorage Keys

- `caliness_setup_dismissed` — `'true'` when user clicks X to dismiss permanently
- `caliness_setup_completed_at` — Unix timestamp (ms) when all 4 steps first completed

## Visibility Rules

Show if:
- Account is under 14 days old (checks `user.created_at` from Supabase Auth via `useAuth()`)
- OR not all 4 steps are done

Hide permanently if:
- User clicked X (sets `caliness_setup_dismissed`)
- All 4 done AND 2+ days have passed since `caliness_setup_completed_at`
- Account is older than 14 days AND all done

## Integration in AppHome.tsx

- `useAuth` is imported to get `user.created_at`
- `SetupChecklist` is imported and rendered with `checkInHistory`, `goalPlan`, and `userCreatedAt` props
- Placed between hero block (score/companion/pillars) and the primary "Heute wichtig" card

**Why:** New users churn within 3 days because they don't discover core features. The checklist provides quiet persistent guidance without being a tutorial popup.

**How to apply:** When adding new first-time-user actions or onboarding signals, update the `steps` array in `SetupChecklist.tsx` and add matching localStorage keys.
