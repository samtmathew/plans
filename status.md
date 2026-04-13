# Plans — Project Status

> Last updated: 2026-04-12
> Updated by: Claude (card redesign + Vercel lint fix session)

---

## Current Phase
**Phase 4 — Plan management fully working (create, edit, delete, media). Ready for polish pass.**

---

## What Has Been Done

### Documentation
- [x] `BRAINSTORM.md` — original product brainstorm (pre-existing)
- [x] `claude.md` — Claude Code instructions: stack, conventions, routes, how to run
- [x] `architecture.md` — frontend structure, API routes, DB schema, RLS policies, storage
- [x] `projectspec.md` — all user flows, pages, components, edge cases
- [x] `tasks-dev-a.md` — Dev A checklist (auth, profiles, shared infra)
- [x] `tasks-dev-b.md` — Dev B checklist (plans, attendees, join flow)
- [x] `schema.sql` — full Supabase schema: tables, indexes, RLS policies, updated_at trigger
- [x] `.env.example` — all required environment variables with placeholder values
- [x] `types/index.ts` — shared TypeScript types (Profile, Plan, PlanItem, PlanAttendee, ApiResponse, input types)

### Project Initialisation
- [x] Next.js 14 (App Router) initialised with TypeScript + Tailwind CSS
- [x] shadcn/ui initialised (Base UI-backed components)
- [x] Dependencies installed: `@supabase/supabase-js`, `@supabase/ssr`, `react-hook-form`, `@hookform/resolvers`, `zod`, `zustand`, `lucide-react`, `@radix-ui/react-slot`
- [x] shadcn components added: `button`, `input`, `label`, `textarea`, `select`, `card`, `separator`, `avatar`, `dropdown-menu`, `dialog`, `badge`
- [x] `tailwind.config.ts` updated with full CSS variable colour tokens
- [x] `app/globals.css` fixed for Tailwind v3 compatibility

### Scaffold — Infrastructure
- [x] `middleware.ts` — route protection, onboarding redirect
- [x] `lib/supabase/client.ts` — browser-side Supabase client
- [x] `lib/supabase/server.ts` — server-side Supabase client (RSC + API routes)
- [x] `lib/utils/cost.ts` — cost calculation helpers
- [x] `lib/utils/format.ts` — currency, date, age formatters
- [x] `lib/validations/plan.ts` — Zod schemas for plan creation
- [x] `lib/validations/profile.ts` — Zod schemas for profile

### Scaffold — Pages
- [x] `app/page.tsx` — landing page (redirects to /home if logged in)
- [x] `app/layout.tsx` — root layout
- [x] `app/(auth)/login/page.tsx` — login form
- [x] `app/(auth)/signup/page.tsx` — signup form
- [x] `app/(app)/layout.tsx` — app shell with nav bar
- [x] `app/(app)/home/page.tsx` — dashboard
- [x] `app/(app)/onboarding/page.tsx` — profile setup
- [x] `app/(app)/profile/page.tsx` — own profile view
- [x] `app/(app)/profile/[id]/page.tsx` — public profile view
- [x] `app/(app)/plans/new/page.tsx` — plan creation form (all 4 sections)
- [x] `app/(app)/plans/[id]/page.tsx` — plan detail (organiser + attendee views)
- [x] `app/(app)/plans/[id]/AttendeeActions.tsx` — client component for approve/reject
- [x] `app/(app)/plans/[id]/edit/page.tsx` — edit plan
- [x] `app/(app)/plans/[id]/edit/PlanEditForm.tsx` — edit form client component
- [x] `app/join/[join_token]/page.tsx` — public join page
- [x] `app/join/[join_token]/JoinButton.tsx` — join request button

### Scaffold — API Routes
- [x] `POST /api/profile` — create/update own profile
- [x] `GET /api/users/search?q=` — search users by name
- [x] `GET /api/users/[id]` — get public profile
- [x] `POST /api/plans` — create plan (with items + attendees in one call)
- [x] `GET /api/plans/[id]` — get plan details
- [x] `PUT /api/plans/[id]` — update plan (cover photo + gallery now included)
- [x] `DELETE /api/plans/[id]` — soft-delete plan (sets `deleted_at`)
- [x] `POST /api/plans/[id]/items` — add cost item
- [x] `PUT /api/plans/[id]/items/[itemId]` — update cost item
- [x] `DELETE /api/plans/[id]/items/[itemId]` — delete cost item
- [x] `POST /api/plans/[id]/attendees` — add attendee
- [x] `PATCH /api/plans/[id]/attendees/[attendeeId]` — approve/reject attendee
- [x] `DELETE /api/plans/[id]/attendees/[attendeeId]` — remove attendee
- [x] `GET /api/join/[join_token]` — resolve join token
- [x] `POST /api/join/[join_token]` — request to join
- [x] `GET /api/auth/logout` — sign out

### Scaffold — Components
- [x] `components/common/Avatar.tsx` — UserAvatar with initials fallback
- [x] `components/common/StatusBadge.tsx` — coloured status chips
- [x] `components/common/CopyLink.tsx` — copy-to-clipboard join link
- [x] `components/common/EmptyState.tsx` — empty state with optional CTA
- [x] `components/plan/PlanCard.tsx` — Pinterest-style 2-column grid card (date, cost/person, status strip)
- [x] `components/plan/CostBreakdown.tsx` — cost items list with live totals
- [x] `components/plan/AttendeeSearch.tsx` — debounced user search dropdown
- [x] `components/plan/AttendeeList.tsx` — attendee list with approve/reject
- [x] `components/plan/CoverPhotoUpload.tsx` — square cover photo uploader (plan-covers bucket)
- [x] `components/plan/GalleryUpload.tsx` — multi-image gallery uploader (plan-gallery bucket)
- [x] `app/(app)/plans/[id]/DeletePlanButton.tsx` — soft-delete with confirmation dialog
- [x] `components/ui/alert-dialog.tsx` — shadcn alert dialog
- [x] `components/profile/ProfileForm.tsx` — profile setup/edit form
- [x] `components/profile/ProfileCard.tsx` — user avatar + name card
- [x] `components/profile/PhotoUpload.tsx` — avatar upload + multi-photo upload
- [x] `SQL_CHANGELOG.md` — dated record of all schema, RLS, and storage SQL

### Build Verification
- [x] `npm run build` passes with 0 errors, 15 pages compiled
- [x] Vercel deployment unblocked — resolved 7 ESLint errors (`no-unused-vars`, `no-unescaped-entities`) across `manage/page.tsx`, `JoinStatusCard.tsx`, `PublicProfileContent.tsx`, `bg-animate-button.tsx`, `text-animate.tsx`

---

## Known Gaps / Not Yet Built
These are intentionally deferred — scaffold only, no logic wired yet:

- [ ] `PlanDetail` component (plan detail uses inline JSX in page.tsx — no separate component file yet)
- [ ] Profile edit page (`/profile/edit` route — currently edit is inline on `/profile`, route not wired)
- [ ] Cost per person not shown on home page cards — `plan_items` is excluded from the home query until `plan_items` RLS policies are confirmed fixed in Supabase
- [ ] No toast/notification system yet (errors shown inline only)
- [ ] No loading skeletons (pages show nothing while loading)
- [ ] Drag-to-reorder in `CostBreakdown` not implemented (drag handle UI exists but no drag library wired)

---

## Next Action Steps

### 1. Supabase Setup ✅ DONE
- [x] Create Supabase project at supabase.com
- [x] Copy `.env.example` → `.env.local`, fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`
- [x] Run `schema.sql` in Supabase dashboard → Database → SQL Editor
- [x] Create storage bucket `avatars` (public)
- [x] Create storage bucket `profile-photos` (public)
- [x] Verify RLS policies are active on all 4 tables

### 2. Smoke Test Auth Flow ✅ DONE
- [x] Run `npm run dev`
- [x] Sign up with a test email
- [x] Verify email verification flow works
- [x] Complete onboarding — confirm profile saves to `profiles` table
- [x] Log out, log back in — confirm redirect to `/home`
- [x] Visit a protected page without auth — confirm redirect to `/login`

### 3. Smoke Test Plan Flow ✅ DONE
- [x] Create a plan with cost items and attendees
- [x] Verify plan appears on `/home` dashboard
- [x] Open plan detail — verify cost splits calculate correctly
- [x] Test join link: copy URL, open in incognito, sign in as different user, request to join
- [x] Approve the join request — verify attendee count updates and group cost splits recalculate

### 4. Fix Known Gaps — NEXT UP
- [x] Clean up the home page dead broad-fetch query
- [ ] Wire `/profile/edit` route or confirm inline edit on `/profile` is sufficient
- [ ] Add a toast library (`sonner` recommended) for action feedback (approve/reject, copy link, save)
- [ ] Add loading skeletons for plan list and plan detail
- [ ] Run plan_items policy SQL fix in Supabase to re-enable cost per person on home page cards

### 5. Polish Pass
- [ ] Test mobile layout on all key pages (home, plan detail, plan creation)
- [ ] Verify avatar stack "+N more" behaviour with 8+ attendees
- [ ] Verify edge cases from `projectspec.md` section (0 attendees, draft plan join link, etc.)

---

## How to Run

```bash
# Install deps (already done)
npm install

# Copy and fill in env vars
cp .env.example .env.local

# Start dev server
npm run dev
# → http://localhost:3000
```

---

## File Map (key files only)

```
middleware.ts                         ← route protection
lib/supabase/{client,server}.ts       ← Supabase clients
lib/validations/{plan,profile}.ts     ← Zod schemas
lib/utils/{cost,format}.ts            ← helpers
types/index.ts                        ← shared types
app/(auth)/{login,signup}/page.tsx    ← auth pages
app/(app)/layout.tsx                  ← nav bar
app/(app)/home/page.tsx               ← dashboard
app/(app)/onboarding/page.tsx         ← profile setup
app/(app)/plans/new/page.tsx          ← create plan
app/(app)/plans/[id]/page.tsx         ← plan detail
app/join/[join_token]/page.tsx        ← public join
app/api/...                           ← all API routes
components/plan/...                   ← plan UI
components/profile/...                ← profile UI
components/common/...                 ← shared UI
```
