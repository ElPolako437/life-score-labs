

# Premium Access Control System

## Current State
- `user_profiles.is_premium` boolean exists, set by `check-subscription` edge function (Stripe-only)
- No `premium_source`, `premium_until`, or `role` columns
- No admin user management UI beyond the existing `AdminDashboard` (which manages bioage submissions, not users)
- `isPremium` in AppContext is set from either `is_premium` DB field or Stripe check result

## Plan

### 1. Database Migration
Add columns to `user_profiles`:
- `premium_source` text, default `'none'` (values: `none`, `stripe`, `manual`, `beta`, `founder`, `developer`)
- `premium_until` timestamptz, nullable
- `role` text, default `'user'` (values: `user`, `admin`, `tester`, `founding_member`)

No new tables needed — extending the existing `user_profiles` table keeps it simple.

### 2. Update `check-subscription` Edge Function
After Stripe check, also check `premium_source` and `premium_until`:
- If Stripe says active → premium = true, source = `stripe`
- Else if `premium_source` in (`manual`, `beta`, `founder`, `developer`) AND (`premium_until` is null OR > now()) → premium = true
- Return `premium_source` and `role` alongside `subscribed`

This makes the edge function the **single source of truth** for premium status.

### 3. Create `admin-users` Edge Function
New edge function for admin user management:
- `list`: Query `user_profiles` joined with `auth.users` email (via service role). Returns id, name, email, is_premium, premium_source, premium_until, role.
- `search`: Filter by email or name
- `update`: Set `is_premium`, `premium_source`, `premium_until`, `role` for a given user ID
- Auth: Verify admin session token (same pattern as existing `admin-data`)

### 4. Admin User Management Page (`src/pages/AdminUsers.tsx`)
New page at `/admin/users`:
- Table of users with name, email, premium status, source, role
- Search bar
- Click user → inline edit: toggle premium, set source, set role, set premium_until
- Uses admin session auth (same as existing admin pages)
- Add route in `App.tsx`

### 5. Update `AppContext.tsx`
- Add `premiumSource` and `userRole` to state
- Load from `check-subscription` response
- Premium logic: `isPremium = subscription.subscribed || premiumSource in [manual, beta, founder, developer]`
- Expose `userRole` and `premiumSource` for admin-specific UI
- Add `isDevPreview` computed: `userRole === 'admin' || premiumSource === 'developer'`

### 6. Developer Preview Toggle
For users with `role === 'admin'` or `premiumSource === 'developer'`:
- Show a small toggle on the profile page: "Premium-Vorschau" switch
- When toggled off, forces `isPremium = false` in context (client-side only, stored in sessionStorage)
- Allows admins to see both free and premium views
- Not visible to normal users

### 7. Profile Page Update (`AppProfile.tsx`)
- Premium section shows source label: "Manuell freigeschaltet", "Beta-Zugang", "Founder", "Stripe-Abo", "Entwickler"
- If admin/developer: show role badge and dev preview toggle
- For non-premium users: existing upgrade flow unchanged

### 8. Premium Gating (No Changes Needed)
All premium gating already uses `isPremium` from context. Since we're updating how `isPremium` is computed (now includes manual/beta/founder/developer sources), all existing gates automatically work.

## Files

**Create:**
- `supabase/functions/admin-users/index.ts` — admin user management endpoint
- `src/pages/AdminUsers.tsx` — admin user management UI

**Modify:**
- `user_profiles` table — add 2 columns via migration
- `supabase/functions/check-subscription/index.ts` — check manual premium too
- `src/contexts/AppContext.tsx` — add premiumSource, userRole, dev preview
- `src/pages/AppProfile.tsx` — show source label, dev toggle for admins
- `src/App.tsx` — add admin/users route
- `supabase/config.toml` — add admin-users function config

**No changes to:** existing premium paywalls, feature gates, or edge functions.

