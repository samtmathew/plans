# Dev A — Task Checklist (Auth + Profile)

## Ownership

Dev A is responsible for the foundation layer that Dev B builds on top of. This includes Supabase project setup, all auth flows, profile management, photo uploads, and the shared infrastructure (types, Supabase clients, middleware).

**Coordinate with Dev B before starting**: agree on the TypeScript types in `/types/index.ts` and the Supabase client exports in `/lib/supabase/` — these are hard dependencies for Dev B.

---

## Setup & Infrastructure

- [ ] Create Supabase project (cloud at supabase.com)
- [ ] Copy `.env.example` → `.env.local`, fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`
- [ ] Run `schema.sql` in Supabase dashboard SQL editor (creates all tables + RLS policies)
- [ ] Create storage buckets: `avatars` (public) and `profile-photos` (public)
- [ ] Configure storage bucket policies (public read, auth-only write)
- [ ] Share `.env.local` values securely with Dev B

## Shared Contracts (Do First)

- [ ] Create `/types/index.ts` with `Profile`, `Plan`, `PlanItem`, `PlanAttendee` types
- [ ] Create `/lib/supabase/client.ts` — browser-side Supabase client
- [ ] Create `/lib/supabase/server.ts` — server-side Supabase client (for RSC + API routes)
- [ ] Document exports so Dev B can import without guessing

## Middleware & Route Protection

- [ ] Create `/lib/supabase/middleware.ts`
  - Protect all `/(app)` routes — redirect unauthenticated users to `/login`
  - After login check: if no profile record exists → redirect to `/onboarding`
  - Pass `?redirect=` param through so post-login redirects work (needed for join flow)
- [ ] Wire middleware into `middleware.ts` at project root

## Auth Pages

- [ ] `/signup` page
  - Email + password form
  - Calls Supabase `signUp()`
  - On success: redirects to `/onboarding`
  - Error states: email already in use, weak password
- [ ] `/login` page
  - Email + password form
  - Calls Supabase `signInWithPassword()`
  - On success: check profile → `/home` or `/onboarding`
  - Handles `?redirect=` param (for post-login join redirects)
  - Error states: wrong credentials, unverified email
- [ ] Logout functionality (button in nav, calls `signOut()`, redirects to `/`)

## Onboarding (`/onboarding`)

- [ ] Page only accessible to logged-in users with no profile record
- [ ] Form fields:
  - Full name (required)
  - Date of birth (required, date picker)
  - Gender (optional, dropdown: prefer not to say / male / female / non-binary / other)
  - Bio (optional, textarea, max 200 chars with counter)
  - Instagram handle (optional)
  - LinkedIn URL (optional)
  - X/Twitter handle (optional)
  - Profile picture upload (optional, single image)
  - Additional photos upload (optional, up to 3)
- [ ] Zod schema in `/lib/validations/profile.ts`
- [ ] On submit: `POST /api/profile` → redirect to `/home`

## Profile Pages

- [ ] `/profile` — own profile view
  - Cover strip showing up to 3 additional photos
  - Large avatar (initials fallback if none)
  - Name, bio, age (derived from date_of_birth), gender
  - Social links: Instagram / LinkedIn / X as icon links
  - "Edit Profile" button
- [ ] `/profile` edit mode (inline toggle or separate route)
  - Same fields as onboarding form
  - Pre-populated with existing values
  - On save: `POST /api/profile` (upsert)
- [ ] `/profile/[id]` — another user's public profile (read-only, same layout)

## Photo Upload Components

- [ ] `PhotoUpload` component (`/components/profile/PhotoUpload.tsx`)
  - Accepts single or multi (up to 3) mode
  - Upload to Supabase Storage via JS client
  - Preview uploaded image before saving
  - Returns public URL(s) to parent form
  - Inline error on upload failure (does not block form)
- [ ] `Avatar` component (`/components/common/Avatar.tsx`)
  - Props: `url?: string`, `name: string`, `size?: 'sm' | 'md' | 'lg'`
  - Shows image if url provided; otherwise initials in neutral circle

## API Routes

- [ ] `POST /api/profile`
  - Upserts profile record for the authenticated user
  - Validates body with Zod profile schema
  - Returns `{ data: Profile, error: null }` or `{ data: null, error: string }`
- [ ] `GET /api/users/search?q=`
  - Searches `profiles.name` with `ilike %q%`
  - Returns array of matching profiles (id, name, avatar_url, bio)
  - Used by Dev B's `AttendeeSearch` component
- [ ] `GET /api/users/[id]`
  - Returns a single user's public profile by ID
  - Returns 404 if not found

## Global Nav / Header

- [ ] Nav component used in `/(app)/layout.tsx`
  - Shows logged-in user's avatar + name
  - Link to `/profile`
  - Log out button
  - "Create Plan" link/button (Dev B uses this, but Nav is Dev A's)

---

## Acceptance Criteria

- Signup → email verification → onboarding → home works end to end
- Login with existing account works; missing profile redirects to onboarding
- Profile saves correctly to DB and reads back with correct values
- Avatar uploads to `avatars/{user_id}` in Supabase Storage and URL saves to profile
- Up to 3 photos upload to `profile-photos/{user_id}/{1,2,3}`
- `/profile/[id]` is accessible for any logged-in user viewing another's profile
- `/api/users/search?q=sam` returns matching profiles
- All `/(app)` routes redirect to `/login` when not authenticated
- Unauthenticated users with no profile are blocked from `/home` etc. and sent to `/onboarding`
