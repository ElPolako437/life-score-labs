

## Plan: Real Coach Photos + Build Fixes

### 1. Add real profile photos to the project
- Copy `Peachy_Saved_Photo.jpg` → `public/images/david.jpg` (David)
- Copy `Bildschirmfoto_2026-04-05_um_18.01.44.png` → `public/images/sarah.jpg` (Sarah)

### 2. Update the human-touch section in `ResetNext.tsx` (lines 297-311)
Replace the single placeholder image with two separate, real profile photos side by side:
- Two round images (David + Sarah), slightly overlapping for visual cohesion
- Keep grayscale + slight brightness reduction for premium look
- Update the text to feel more personal and trust-building

### 3. Fix build error in `src/lib/analytics.ts`
The `reset_events` and `reset_leads` tables don't exist in the database schema. Change the analytics functions to use `localStorage` instead of Supabase, since the Reset app is designed to work without login/backend.

### 4. Fix edge function build error
The `admin-users` function has a Deno import resolution issue. This is unrelated to the Reset app but blocks the build. Will check if a simple import path fix resolves it.

### Technical details
- Profile images: `object-cover` with `rounded-full`, ~44px each, overlapping via negative margin
- Analytics: Replace Supabase `.insert()` calls with `console.log` or remove entirely since these tables don't exist
- No design system changes

