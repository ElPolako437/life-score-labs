---
name: Preferences Persistence Pattern
description: How user_profiles.preferences JSONB is used to persist UI state (protocol progress, focus checked) with merge-upsert pattern
type: project
---

## user_profiles.preferences JSONB Pattern (added 2026-04-01)

The `user_profiles` table has a `preferences` JSONB column (not in TypeScript types, accessed via `as any` casts).

### Helper Function
`upsertPreferences(userId, patch, prefsRef)` in AppContext.tsx:
- Merges `patch` into `prefsRef.current` (a ref holding the full preferences object)
- Calls `supabase.from('user_profiles').update({ preferences: merged })` fire-and-forget with error toast
- Pattern: always merge, never replace the whole object

### Data Stored
- `protocolProgress: ProtocolProgress[]` -- protocol start/completion state (migrated from localStorage)
- `focusChecked: boolean[]` -- weekly focus checklist state from GoalSummaryDashboard (migrated from local React state)

### Load Path
- On mount in the big `useEffect`, after loading profile: reads `p.preferences.protocolProgress` and `p.preferences.focusChecked`
- Falls back to localStorage for both
- localStorage kept as same-session cache

### Write Path
- `startProtocol()`, `toggleProtocolDay()`, `updateProtocolProgress()` all call `upsertPreferences`
- `toggleFocusChecked(idx)` and `setFocusChecked(valOrFn)` both call `upsertPreferences`

### Error Handling (BLK-3, added 2026-04-01)
All Supabase writes in AppContext now have error toasts: `toast.error('Sync-Fehler – Daten lokal gespeichert')`
Previously missing on: addNutritionLog, addTrainingLog, addActivityLog, score_history upserts.

**Why:** Centralizes UI state persistence that was previously scattered across localStorage and React state.
**How to apply:** Use `upsertPreferences()` for any new user-level UI state that needs persistence across sessions/devices.
