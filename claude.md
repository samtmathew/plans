# Plans — Claude Code Instructions

## Project Overview

**Plans** is a social trip-planning web app. Users create structured plans for trips or group activities, complete with itineraries, itemised cost breakdowns (per-head or group), and attendee management.

- **Version**: V1 (MVP)
- **Stack**: Next.js 14 (App Router) + Supabase + Tailwind CSS + TypeScript
- **Team**: 2 developers — Dev A (Auth/Profile) · Dev B (Plans/Attendees)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14, App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (Radix UI) |
| Forms | React Hook Form + Zod |
| State | React Server Components + Zustand/Context for client state |
| Backend | Next.js API Routes (`/app/api/`) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (email/password) |
| File Storage | Supabase Storage |
| Icons | Lucide React |

---

## Folder Structure

```
/app
  /layout.tsx                 → Root layout (fonts, global nav wrapper)
  /page.tsx                   → Landing page
  /(auth)
    /login/page.tsx
    /signup/page.tsx
  /(app)                      → Protected route group (middleware-guarded)
    /layout.tsx               → App shell (nav)
    /home/page.tsx
    /onboarding/page.tsx
    /profile/page.tsx
    /profile/[id]/page.tsx
    /plans
      /new/page.tsx
      /[id]/page.tsx
      /[id]/edit/page.tsx
  /join
    /[join_token]/page.tsx    → Public, but redirects to login if unauthenticated
/components
  /ui/                        → shadcn/ui generated components
  /plan/
    PlanCard.tsx
    PlanForm.tsx
    CostBreakdown.tsx
    AttendeeSearch.tsx
    AttendeeList.tsx
    PlanDetail.tsx
  /profile/
    ProfileForm.tsx
    ProfileCard.tsx
    PhotoUpload.tsx
  /common/
    Avatar.tsx
    StatusBadge.tsx
    CopyLink.tsx
    EmptyState.tsx
/lib
  /supabase/
    client.ts                 → Browser-side Supabase client
    server.ts                 → Server-side Supabase client (RSC / API routes)
    middleware.ts             → Auth middleware (protects routes, redirects)
  /validations/
    plan.ts                   → Zod schemas for plan creation
    profile.ts                → Zod schemas for profile
  /utils/
    cost.ts                   → Cost calculation helpers
    format.ts                 → Currency + date formatting
/types
  index.ts                    → Shared TypeScript types
```

---

## Coding Conventions

- Use TypeScript strictly — no `any` types
- All API routes return `{ data: T | null, error: string | null }`
- Use React Server Components by default; add `"use client"` only when needed
- Zod validation for all form inputs and API request bodies
- Never store derived values (e.g. per-person cost splits) in the DB — always calculate at render time
- RLS policies in Supabase enforce access at DB level; API routes enforce at application level (both layers required)
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never expose to the client or include in `NEXT_PUBLIC_*` vars
- Mobile-first design: style for small screens first, enhance for larger

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page (logged out) or redirect to `/home` |
| `/login` | Login |
| `/signup` | Sign up |
| `/onboarding` | Profile setup (required after first signup) |
| `/home` | Dashboard (protected) |
| `/profile` | Own profile view/edit (protected) |
| `/profile/[id]` | Another user's public profile (protected) |
| `/plans/new` | Create plan (protected) |
| `/plans/[id]` | Plan detail (protected) |
| `/plans/[id]/edit` | Edit plan (organiser only, protected) |
| `/join/[join_token]` | Public join page (redirects to login if not authed) |

---

## Testing Protocol
- After every bug fix, start the dev server and visually verify the fix on localhost
- Do not report a bug as fixed until you have confirmed it yourself in the browser
- If the fix didn't work, iterate and test again without waiting for me
- Only report back when the bug is confirmed fixed or you are genuinely stuck

## Dev Environment
- Dev server: `npm run dev`
- Local URL: http://localhost:3000
- To verify a fix, always run the dev server and check the relevant page

## How to Run

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.example .env.local

# Run dev server
npm run dev
# → http://localhost:3000
```

### Supabase Setup

Option A — Cloud (recommended for hackathon):
1. Create a project at supabase.com
2. Copy URL and anon key into `.env.local`
3. Run `schema.sql` in the Supabase dashboard SQL editor
4. Apply any subsequent migrations from `SQL_CHANGELOG.md`

Option B — Local:
```bash
npx supabase init
npx supabase start
npx supabase db push
```

### SQL Documentation

**All schema changes, migrations, RLS policies, and storage policies are recorded in [`SQL_CHANGELOG.md`](./SQL_CHANGELOG.md).**

> **Rule:** Any time a major SQL statement is introduced — new table, ALTER TABLE, new RLS policy, storage policy, or new index — append a dated entry to `SQL_CHANGELOG.md` before considering the task complete. Include the SQL itself, what it does, and why it was added.

---

## Key Business Rules

1. Users must complete `/onboarding` before accessing any protected page — middleware enforces this
2. Plan cost items store the **total group price**, never the per-person share (that's always derived)
3. `approvedAttendeeCount` includes the organiser
4. Attendee avatar stacks show only approved attendees; pending are hidden from non-organisers
5. Avatar stacks cap at 7 visible avatars + "+N more" pill
6. Plans with `status = 'draft'` are not visible to attendees and show "not public yet" on the join page
