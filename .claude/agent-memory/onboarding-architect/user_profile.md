---
name: user_profile
description: Profile of the CALINESS project owner — role, goals, and working preferences observed so far
type: user
---

David Gogulla is the owner and lead developer of the CALINESS app, a Lovable Cloud project. He functions as both product lead and engineer.

## Working Style

- Gives detailed, specific implementation briefs with exact component names, file paths, data sources, and UX rules
- Expects implementation to follow the brief closely without deviating into unrelated changes
- German language is required for all UI text throughout the app (enforced constraint)
- No new npm packages — must use existing dependencies
- No backend migrations — all storage changes must use existing Supabase schema or localStorage

## Technical Context

- App is React + TypeScript + Vite + Tailwind + shadcn/ui
- Deployed on Lovable Cloud
- Supabase for auth and data persistence
- State management via React Context (AppContext + AuthContext)
- localStorage keys follow the pattern `caliness_*`
