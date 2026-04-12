# Plans — MVP Brainstorming Document

> Version: 1.0 (MVP)
> Stack: Next.js 14 (App Router) + Supabase + Tailwind CSS
> Team: 2 developers — Dev A (Auth/Profile) · Dev B (Plans/Attendees)

---

## 1. The Idea

**Plans** is a social trip-planning web app. It lets users create structured plans for trips, outings, or any group activity — complete with itineraries, itemised cost breakdowns (per-head or group), and attendee management. Think of it as a lightweight shared itinerary builder that lives on the web and doesn't require a spreadsheet or WhatsApp thread to organise a group trip.

The core insight: when you're organising a group trip, you're always answering the same questions for everyone — where are we staying, what does it cost, who's coming, what's the plan? **Plans** gives the organiser one place to answer all of that, and gives attendees one place to see it.

---

## 2. Version Roadmap Overview

| Version | Scope |
|---------|-------|
| **V1 (MVP — this doc)** | Auth, profiles, plan creation, cost breakdown, attendee management, public join links, plan detail view |
| **V2 (post-hackathon)** | Suggestions/chat from attendees to organiser, multiple co-organisers per plan |

---

## 3. Core Entities & Data Model

### 3.1 Users
Every person who signs up has a user record (managed by Supabase Auth) and a profile record (managed in the `profiles` table).

**profiles table**
```
id              uuid (FK → auth.users.id)
name            text
bio             text
date_of_birth   date
gender          text
instagram       text
linkedin        text
twitter_x       text
avatar_url      text          (single profile picture, stored in Supabase Storage)
photos          text[]        (array of up to 3 additional photo URLs)
created_at      timestamp
```

### 3.2 Plans
A plan is the central object. It is created by one user (the organiser).

**plans table**
```
id              uuid (PK)
organiser_id    uuid (FK → profiles.id)
title           text
description     text          (the "vibe" — short, punchy)
itinerary       text          (long-form, detailed description of the plan)
status          text          (draft | active | closed)
join_token      uuid          (unique token for public join URL — generated on creation)
join_approval   boolean       (true = organiser must approve join requests)
created_at      timestamp
updated_at      timestamp
```

### 3.3 Plan Items (Cost Breakdown)
Each plan has a list of cost line items. These are the itemised expenses.

**plan_items table**
```
id              uuid (PK)
plan_id         uuid (FK → plans.id)
title           text          (e.g. "Stay", "Food", "Transport")
price           numeric       (in USD or chosen currency)
pricing_type    text          (per_head | group)
description     text          (optional notes about this item)
sort_order      integer       (for manual ordering)
created_at      timestamp
```

### 3.4 Attendees
Tracks who is part of a plan and their status.

**plan_attendees table**
```
id              uuid (PK)
plan_id         uuid (FK → plans.id)
user_id         uuid (FK → profiles.id)
role            text          (organiser | attendee)
status          text          (pending | approved | rejected)
invited_by      uuid          (FK → profiles.id — who added them)
joined_via      text          (invite_link | organiser_added)
created_at      timestamp
```

---

## 4. User Flow (Detailed)

### 4.1 Onboarding Flow

```
Land on homepage (marketing/splash)
    ↓
Sign Up → Email + Password (Supabase Auth)
    ↓
Email verification (Supabase handles this)
    ↓
Profile Setup (required before accessing app)
    - Full name (required)
    - Date of birth (required)
    - Gender (optional, dropdown)
    - Bio (optional, max 200 chars)
    - Instagram handle (optional)
    - LinkedIn URL (optional)
    - X/Twitter handle (optional)
    - Profile picture upload (optional but encouraged)
    - Up to 3 additional photos (optional)
    ↓
Redirect → Home Dashboard
```

> Note: Profile setup should be a dedicated `/onboarding` page. If a logged-in user has no profile record, middleware should redirect them here before they can access any other protected page.

### 4.2 Log In Flow

```
Log In → Email + Password
    ↓
Check: does profile exist?
    ↓ Yes → Home Dashboard
    ↓ No  → /onboarding
```

### 4.3 Home Dashboard

The home page for a logged-in user. Shows:

- **Header/Nav**: user avatar, name, link to their profile, log out
- **"Your Plans" section**: cards for every plan the user is part of (as organiser OR attendee), ordered by most recently updated
  - Each card shows: plan title, description snippet, organiser name + avatar, attendee count, user's role (organiser badge or attendee), status badge
  - Empty state: friendly message + CTA to create their first plan
- **"Create a Plan" button**: prominent, top right or floating action button

### 4.4 Plan Creation Flow

```
Click "Create Plan"
    ↓
/plans/new — multi-section form (single page, scroll or stepped)

Section 1: Basics
    - Title (required, max 80 chars)
    - Description / vibe (required, max 300 chars)
    - Itinerary (required, rich text or large textarea, no length limit)

Section 2: Cost Breakdown
    - List of items, each item has:
        · Title (e.g. "Stay")
        · Price (numeric input, $ prefix)
        · Pricing type toggle: "Per Head" / "Group Total"
        · Description (optional, max 150 chars)
    - "Add Item" button adds a new row
    - Items can be reordered (drag handle) or deleted
    - Running total shown dynamically:
        · Per-head total = sum of all per_head items
        · Group total = sum of all group items
        · If group total: show per-head estimate = group_total ÷ attendee_count (updates live as attendees are added)

Section 3: Attendees
    - Search by name: live dropdown searches existing users by name in the profiles table
    - Selecting a user adds them as a pending attendee (they get a notification or see it on their dashboard)
    - Public join link: toggle to enable a shareable URL
        · URL format: /join/[join_token]
        · Toggle: "Require organiser approval" (on by default)
    - Current attendees list: shows each person's avatar + name + status chip

Section 4: Review & Publish
    - Summary of everything entered
    - "Publish Plan" button → sets status to active, saves to DB
    - "Save as Draft" button → sets status to draft, not visible to attendees yet
```

### 4.5 Public Join Flow

```
Non-member clicks shared link: /join/[join_token]
    ↓
Is user logged in?
    ↓ No  → Redirect to /login?redirect=/join/[join_token]
              (after login/signup, redirect back to join page)
    ↓ Yes →
        Is user already an attendee? → Show "You're already in this plan" + link to plan
        Is plan closed? → Show "This plan is no longer accepting new members"
        Otherwise → Show plan preview (title, description, organiser info)
            ↓
        Click "Request to Join"
            ↓
        join_approval = true  → status = pending, organiser sees request on plan page
        join_approval = false → status = approved immediately, user added to plan
```

### 4.6 Plan Detail View (Organiser)

The full plan page at `/plans/[id]`. Organiser sees:

- Plan title + description
- Itinerary (full text, formatted)
- Cost breakdown table: all items with title, price, pricing type, description
  - Summary: per-head total, group total, estimated per-person cost (auto-splits group items by approved attendee count — updates live)
- Attendees section:
  - **Avatar stack**: horizontal strip of circular avatars for all approved attendees, overlapping slightly, with total count (e.g. "8 going"). Clicking any avatar opens that user's public profile.
  - Full attendee list below the avatar stack: name, avatar, status chip, role badge
  - Pending requests: "Approve" / "Reject" buttons — approving updates the attendee count and recalculates all group-type cost splits automatically
  - "Add Attendee" button (opens search modal)
  - Shareable join link (copy button)
- Edit plan button (takes back to edit form)

### 4.7 Plan Detail View (Attendee)

Same page, but:

- No edit button
- No pending requests panel (they can't see other pending requests)
- No add attendee option
- Can see their own status (pending / approved)
- If pending: "Waiting for organiser approval" message — cost breakdown and attendee list are hidden until approved
- Can see the join link to share with others (if join link is enabled)
- **Approved attendees see the full attendee list**: a horizontal avatar stack showing all approved attendees (including themselves). Avatars are circular, overlapping slightly (like a group photo strip). Clicking an avatar opens that user's public profile. The count of approved attendees is shown next to the stack (e.g. "8 going"). Pending attendees are not shown in this list to non-organisers.

---

## 5. Pages & Routes

```
/                           → Landing / marketing page (logged out) OR redirect to /home (logged in)
/login                      → Login page
/signup                     → Signup page
/onboarding                 → Profile setup (required after first signup)
/home                       → Dashboard (protected)
/profile                    → View/edit own profile (protected)
/profile/[id]               → View another user's public profile (protected)
/plans/new                  → Create plan form (protected)
/plans/[id]                 → Plan detail view (protected, attendees + organiser)
/plans/[id]/edit            → Edit plan (protected, organiser only)
/join/[join_token]          → Public join page (redirects to login if not authenticated)
```

---

## 6. Frontend Architecture

### 6.1 Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (built on Radix UI — accessible, unstyled primitives)
- **Forms**: React Hook Form + Zod (validation)
- **State**: React Server Components where possible, Zustand or React Context for client-side state (e.g. plan builder form state)
- **File Uploads**: Supabase Storage via the JS client
- **Icons**: Lucide React

### 6.2 Folder Structure (App Router)
```
/app
  /layout.tsx                 → Root layout (fonts, global nav wrapper)
  /page.tsx                   → Landing page
  /(auth)
    /login/page.tsx
    /signup/page.tsx
  /(app)                      → Protected route group (middleware-guarded)
    /layout.tsx               → App shell (nav, sidebar if any)
    /home/page.tsx
    /onboarding/page.tsx
    /profile/page.tsx
    /profile/[id]/page.tsx
    /plans
      /new/page.tsx
      /[id]/page.tsx
      /[id]/edit/page.tsx
  /join
    /[join_token]/page.tsx    → Public, but redirects to login
/components
  /ui/                        → shadcn/ui generated components
  /plan/
    PlanCard.tsx              → Plan summary card (used on home dashboard)
    PlanForm.tsx              → Multi-section plan creation/edit form
    CostBreakdown.tsx         → Cost items list with running totals
    AttendeeSearch.tsx        → Live search dropdown for adding attendees
    AttendeeList.tsx          → Attendee list with status chips + approve/reject
    PlanDetail.tsx            → Full plan view
  /profile/
    ProfileForm.tsx           → Profile setup/edit form
    ProfileCard.tsx           → User avatar + name card (used in attendee lists)
    PhotoUpload.tsx           → Multi-photo upload component
  /common/
    Avatar.tsx
    StatusBadge.tsx
    CopyLink.tsx
    EmptyState.tsx
/lib
  /supabase/
    client.ts                 → Browser-side Supabase client
    server.ts                 → Server-side Supabase client (for RSC / API routes)
    middleware.ts             → Auth middleware (protects routes, redirects)
  /validations/
    plan.ts                   → Zod schemas for plan creation
    profile.ts                → Zod schemas for profile
  /utils/
    cost.ts                   → Cost calculation helpers (per-head totals, etc.)
    format.ts                 → Currency formatting, date formatting
/types
  index.ts                    → Shared TypeScript types (Plan, Profile, PlanItem, etc.)
```

### 6.3 Key Component Logic

**CostBreakdown component**
- Maintains local array of plan items
- "Add Item" appends an empty item to the array
- Each item row has: title input, price input, per_head/group toggle, description input, delete button, drag handle
- `approvedAttendeeCount` is passed as a prop (derived from the attendees array, count of approved only)
- Running totals computed reactively on every change:
  - `perHeadTotal = items.filter(i => i.pricing_type === 'per_head').reduce((sum, i) => sum + i.price, 0)`
  - `groupShareTotal = items.filter(i => i.pricing_type === 'group').reduce((sum, i) => sum + (i.price / Math.max(approvedAttendeeCount, 1)), 0)`
  - `estimatedPerPerson = perHeadTotal + groupShareTotal`
- Each group-type item row shows an inline derived label: e.g. `$200 total → $20.00 / person` — this updates as attendee count changes
- Group split is purely a display/calculation concern — `price` stored in DB is always the total group price, never the per-person share
- If `approvedAttendeeCount === 0`, group rows show "—/person" and the totals box shows a helper prompt

**AttendeeSearch component**
- Controlled input with debounced search (300ms)
- Calls `/api/users/search?q=name` → returns matching profiles
- Dropdown shows avatar + name + bio snippet
- On select: adds user to local attendees array (not saved until form submit)
- Shows already-added users as greyed out in dropdown

---

## 7. Backend Architecture

### 7.1 Approach: Next.js API Routes + Supabase

For local development in a hackathon context, Next.js API routes (in `/app/api/`) are the right call. No separate server to run, no CORS config, everything in one repo. Supabase handles:
- Auth (email/password, sessions, JWTs)
- Database (Postgres)
- Storage (profile pictures, photos)
- Row Level Security (RLS) policies for data access control

### 7.2 API Routes

```
POST   /api/profile                  → Create or update own profile
GET    /api/users/search?q=          → Search users by name (for attendee search)
GET    /api/users/[id]               → Get a user's public profile

POST   /api/plans                    → Create a new plan
GET    /api/plans/[id]               → Get plan details (checks attendee access)
PUT    /api/plans/[id]               → Update plan (organiser only)

POST   /api/plans/[id]/items         → Add cost item to plan
PUT    /api/plans/[id]/items/[itemId] → Update cost item
DELETE /api/plans/[id]/items/[itemId] → Delete cost item

POST   /api/plans/[id]/attendees     → Add attendee by user ID (organiser only)
PATCH  /api/plans/[id]/attendees/[attendeeId] → Approve or reject attendee
DELETE /api/plans/[id]/attendees/[attendeeId] → Remove attendee

GET    /api/join/[join_token]        → Resolve join token → plan preview info
POST   /api/join/[join_token]        → Request to join via public link
```

### 7.3 Row Level Security (RLS) Policies

These live in Supabase and enforce access at the DB level, as a second layer of protection on top of API route auth checks.

```sql
-- profiles: anyone logged in can read, only owner can write
CREATE POLICY "public read" ON profiles FOR SELECT USING (true);
CREATE POLICY "own write"   ON profiles FOR ALL    USING (auth.uid() = id);

-- plans: organiser can do anything; attendees (approved) can read
CREATE POLICY "organiser all"   ON plans FOR ALL    USING (organiser_id = auth.uid());
CREATE POLICY "attendee read"   ON plans FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM plan_attendees
    WHERE plan_id = plans.id
    AND user_id = auth.uid()
    AND status = 'approved'
  )
);
-- Public join token resolution (unauthenticated read for join page preview)
CREATE POLICY "join token read" ON plans FOR SELECT USING (join_token IS NOT NULL);

-- plan_items: same access as the parent plan
CREATE POLICY "attendee/organiser read" ON plan_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM plans p
    LEFT JOIN plan_attendees pa ON pa.plan_id = p.id
    WHERE p.id = plan_items.plan_id
    AND (p.organiser_id = auth.uid() OR (pa.user_id = auth.uid() AND pa.status = 'approved'))
  )
);
CREATE POLICY "organiser write" ON plan_items FOR ALL USING (
  EXISTS (SELECT 1 FROM plans WHERE id = plan_items.plan_id AND organiser_id = auth.uid())
);

-- plan_attendees: organiser sees all; users see their own row
CREATE POLICY "organiser all"  ON plan_attendees FOR ALL    USING (
  EXISTS (SELECT 1 FROM plans WHERE id = plan_attendees.plan_id AND organiser_id = auth.uid())
);
CREATE POLICY "own row read"   ON plan_attendees FOR SELECT USING (user_id = auth.uid());
```

### 7.4 Supabase Storage Buckets

```
avatars/          → profile pictures (public bucket, 1 file per user, path: avatars/{user_id})
profile-photos/   → up to 3 extra photos per user (public, path: profile-photos/{user_id}/{1,2,3})
```

---

## 8. Feature Details

### 8.1 Plan Cost Summary Logic

On the plan detail view, show a summary table:

| Item | Total Price | Type | Per Person |
|------|-------------|------|------------|
| Stay | $200 | Group | $20.00 ÷ 10 |
| Food | $80  | Per head | $80.00 |
| Bus  | $150 | Group | $15.00 ÷ 10 |

**How group items are split:**
- `approvedAttendeeCount` = number of attendees with `status = 'approved'` (includes the organiser)
- For each item where `pricing_type = 'group'`: display a derived `per_person_share = price ÷ approvedAttendeeCount`
- This derived value is **never stored in the DB** — it is always calculated at render time from the live attendee count
- When an attendee is approved or removed, the split recalculates automatically (no page reload needed — reactive on client)

**Totals box (shown to all approved members):**
- Per-head subtotal: sum of all `per_head` items (fixed, doesn't change with attendee count)
- Group items subtotal (your share): sum of all `price ÷ approvedAttendeeCount` for group items
- **Your estimated total**: per-head subtotal + group share subtotal
- Label shown below totals: "Based on N people" — updates live as attendee count changes

**Edge cases:**
- `approvedAttendeeCount = 0`: show "—" for all group splits, show tooltip "Add attendees to see per-person cost"
- `approvedAttendeeCount = 1` (only organiser): show full group price as their share (divide by 1), with a note "You're the only one so far"
- Group item price changes while plan is active: recalculates for everyone immediately since it's always derived

**In the plan creation form (Section 2):**
- As the organiser adds attendees in Section 3, the per-person estimate in Section 2 updates live
- The form shows a live preview row: "Estimated cost per person: $X" below the items list
- This uses the local attendee count from the form state, not yet-saved DB values

### 8.2 Attendee Management

- Organiser can add attendees two ways:
  1. **Search by name** — finds existing users, adds them directly as `pending`
  2. **Share join link** — generates a URL; anyone with the link can request to join
- Attendee statuses: `pending → approved` or `pending → rejected`
- Rejected attendees are removed from the list (or shown greyed out with option to re-approve)
- Approved attendee count is used for the per-person cost estimate

### 8.3 Public Join Link

- Each plan gets a `join_token` (UUID) on creation
- The shareable URL: `https://yourapp.com/join/{join_token}`
- The join page shows:
  - Plan title, description, organiser name + avatar
  - "Request to Join" button (only if logged in)
- If `join_approval = false`: user is immediately approved
- If `join_approval = true`: user enters `pending`, organiser sees a "Requests" section on the plan page with approve/reject buttons

### 8.4 Profile Page

Displays:
- Cover area: 3 photos as a grid or strip (if uploaded)
- Avatar (large), name, bio
- Social links: Instagram, LinkedIn, X — icon links
- Date of birth shown as age (e.g. "24 years old")
- Gender (if provided)
- Plans they're part of (if public/shared): optional for MVP, can be omitted

Edit mode: same page with form fields toggling inline or a separate `/profile/edit` route.

---

## 9. Developer Task Split

### Dev A — Auth + Profile

**Owns:**
- Supabase project setup (DB schema, RLS policies, storage buckets)
- Auth flow: `/signup`, `/login`, logout, Supabase auth middleware
- Onboarding flow: `/onboarding` page + profile form
- Profile view/edit: `/profile` + `/profile/[id]`
- Photo upload components + Supabase Storage integration
- API routes: `/api/profile`, `/api/users/search`, `/api/users/[id]`
- Global nav/header component (avatar, name, logout)
- Shared types and Supabase client setup (`/lib/supabase/`)
- Middleware: route protection + onboarding redirect

**Deliverables checklist:**
- [ ] Supabase project created, `.env.local` template documented
- [ ] Database schema SQL file (all tables + RLS policies)
- [ ] `/signup` and `/login` pages working with Supabase Auth
- [ ] `/onboarding` page saves profile to DB, redirects to `/home`
- [ ] `/profile` shows and edits own profile
- [ ] `/profile/[id]` shows another user's public profile
- [ ] Avatar upload working (single image → Supabase Storage)
- [ ] Up to 3 additional photos upload working
- [ ] User search API route (`/api/users/search?q=`)
- [ ] Middleware protecting all `/(app)` routes

---

### Dev B — Plans + Attendees

**Owns:**
- Home dashboard: `/home` — plan cards, empty state, "Create Plan" CTA
- Plan creation form: `/plans/new` — all 4 sections
- Plan edit: `/plans/[id]/edit`
- Plan detail view: `/plans/[id]` (organiser view + attendee view)
- Cost breakdown component with running totals
- Attendee search + add component (uses Dev A's `/api/users/search`)
- Attendee list with approve/reject (organiser view)
- **Attendee avatar stack component** (approved members strip, shown to both organiser and approved attendees)
- Live group cost splitting logic (reactive on attendee count changes)
- Public join page: `/join/[join_token]`
- API routes: all `/api/plans/*` and `/api/join/*`
- Plan card component (used on home)
- Copy-to-clipboard join link component

**Deliverables checklist:**
- [ ] `/home` dashboard with plan cards
- [ ] Plan card component with all fields
- [ ] `/plans/new` form — Section 1 (basics) working
- [ ] `/plans/new` form — Section 2 (cost breakdown) with live totals
- [ ] `/plans/new` form — Section 3 (attendee search + add) working
- [ ] `/plans/new` form — Section 4 (review + publish/draft)
- [ ] `/plans/[id]` detail view (organiser)
- [ ] `/plans/[id]` detail view (attendee, with role-based UI differences)
- [ ] Approved attendee avatar stack shown to both organiser and approved attendees
- [ ] Pending attendees hidden from avatar stack for non-organisers
- [ ] Group items auto-split by approved attendee count (live, reactive)
- [ ] Per-person estimate updates when attendee is approved/removed
- [ ] Approve/reject attendee flow working
- [ ] Public join link generation + copy button
- [ ] `/join/[join_token]` page with plan preview + join request
- [ ] Join approval flow (pending → approved/rejected)
- [ ] All plan API routes tested

---

## 10. Shared Contracts (Dev A ↔ Dev B)

These are things both devs need to agree on before starting to avoid merge conflicts and integration pain.

### TypeScript Types (define in `/types/index.ts` — Dev A creates, Dev B extends)

```typescript
export type Profile = {
  id: string
  name: string
  bio: string | null
  date_of_birth: string | null
  gender: string | null
  instagram: string | null
  linkedin: string | null
  twitter_x: string | null
  avatar_url: string | null
  photos: string[]
  created_at: string
}

export type Plan = {
  id: string
  organiser_id: string
  title: string
  description: string
  itinerary: string
  status: 'draft' | 'active' | 'closed'
  join_token: string
  join_approval: boolean
  created_at: string
  updated_at: string
  organiser?: Profile            // joined
  attendees?: PlanAttendee[]     // joined
  items?: PlanItem[]             // joined
}

export type PlanItem = {
  id: string
  plan_id: string
  title: string
  price: number
  pricing_type: 'per_head' | 'group'
  description: string | null
  sort_order: number
}

export type PlanAttendee = {
  id: string
  plan_id: string
  user_id: string
  role: 'organiser' | 'attendee'
  status: 'pending' | 'approved' | 'rejected'
  joined_via: 'invite_link' | 'organiser_added'
  created_at: string
  profile?: Profile              // joined
}
```

### API Response Shape

All API routes return:
```typescript
{ data: T | null, error: string | null }
```

### Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       // server-side only, never expose to client
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 11. Edge Cases & Things To Handle

| Scenario | Handling |
|----------|----------|
| User signs up but never completes onboarding | Middleware redirects to `/onboarding` on every protected page visit |
| Organiser visits their own plan via join link | Show "You're the organiser of this plan" → link to plan page |
| Attendee tries to edit a plan | `/plans/[id]/edit` returns 403, edit button not shown |
| Plan has 0 attendees — show per-person cost estimate | Show "—" or "Add attendees to estimate per-person cost" |
| Avatar stack has many attendees (10+) | Show first 7 avatars + "+N more" pill, clicking opens full attendee list |
| Attendee has no avatar uploaded | Show a fallback circle with their initials in a neutral colour |
| Group item with 1 approved attendee (organiser only) | Show full price as their share, with note "You're the only one so far" |
| Attendee is approved then later removed — group split changes | Recalculate all group items live; no stored value to update in DB |
| User searches for themselves to add as attendee | Filter them out of search results |
| Organiser tries to add someone already in the plan | Show "Already added" in the dropdown |
| User rejects a join request then reconsiders | Re-approve button stays visible on the rejected attendee row |
| Image upload fails | Show inline error, do not block form submission (avatar is optional) |
| Join token plan is a draft | Show "This plan isn't public yet" on the join page |

---

## 12. V2 Features (Do Not Build in MVP — Plan Now, Build Later)

These are called out here so the DB schema and component structure don't paint us into a corner.

### 12.1 Suggestions / Attendee Messaging
- Attendees can send a text suggestion/message to the organiser
- Only the organiser sees suggestions (not other attendees)
- Table needed: `plan_suggestions (id, plan_id, user_id, content, created_at, read_at)`
- On the plan page: organiser sees a "Suggestions" panel; attendees see a "Send suggestion" form
- No real-time needed for MVP V2 — polling or page refresh is fine

### 12.2 Multiple Co-Organisers
- Plans can have more than one organiser
- `plan_attendees.role` already supports this — just need UI for the organiser to promote an attendee to co-organiser
- All organisers can edit the plan, approve/reject attendees, see suggestions

---

## 13. Design Principles for MVP

- **Mobile-first**: most users will view plans on their phones
- **One scroll per task**: plan creation should feel like one focused form, not a wizard with 10 steps
- **Status at a glance**: badges everywhere — plan status (draft/active), attendee status (pending/approved), role (organiser/attendee)
- **Copy-paste friendly**: join links should have a one-tap copy button, no friction
- **Empty states that explain**: when a user has no plans, tell them exactly what to do and why
- **Optimistic UI where possible**: when adding an attendee, show them in the list immediately without waiting for the API

---

## 14. Local Development Setup

```bash
# 1. Clone repo
git clone ...
cd plans

# 2. Install dependencies
npm install

# 3. Set up Supabase locally (optional: use Supabase cloud for hackathon)
# If using cloud: create project at supabase.com, grab URL + keys
# If using local: npx supabase init && npx supabase start

# 4. Copy env file and fill in values
cp .env.example .env.local

# 5. Run DB migrations
npx supabase db push    # if using local
# OR run the schema SQL manually in Supabase dashboard SQL editor

# 6. Start dev server
npm run dev
# → http://localhost:3000
```

---

## 15. Files To Generate From This Document

Using this brainstorm, the following project files should be created:

| File | Contents |
|------|----------|
| `claude.md` | Claude Code instructions: project overview, stack, folder structure, coding conventions, how to run |
| `architecture.md` | Technical architecture: frontend structure, API routes, DB schema, RLS policies, storage |
| `projectspec.md` | Feature spec: all user flows, pages, components, edge cases |
| `tasks-dev-a.md` | Dev A task checklist: auth, profile, setup |
| `tasks-dev-b.md` | Dev B task checklist: plans, attendees, join flow |
| `schema.sql` | Full Supabase schema SQL: tables, indexes, RLS policies |
| `.env.example` | All required environment variables with placeholder values |
| `types/index.ts` | Shared TypeScript type definitions |

---

*End of brainstorming document — V1 MVP*
