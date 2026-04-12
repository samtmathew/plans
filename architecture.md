# Plans — Technical Architecture

## Frontend Structure

### Framework & Routing
- Next.js 14 App Router
- Route groups: `/(auth)` for public auth pages, `/(app)` for protected pages
- Middleware in `/lib/supabase/middleware.ts` protects all `/(app)` routes and redirects unauthenticated users to `/login`
- Middleware also checks for profile existence — redirects to `/onboarding` if profile record is missing

### State Management
- React Server Components (RSC) for all data-fetching pages — no client state needed
- `"use client"` components for interactive forms (plan builder, profile form, attendee search)
- Plan builder form state managed via Zustand or React Context (tracks items + attendees locally before form submit)
- Optimistic UI: attendee additions appear immediately before API confirmation

### Key Component Interactions

**CostBreakdown** (client component)
- Props: `items: PlanItem[]`, `approvedAttendeeCount: number`, `onChange: (items) => void`
- Computes totals reactively:
  - `perHeadTotal` = sum of all `per_head` items
  - `groupShareTotal` = sum of `(item.price / Math.max(approvedAttendeeCount, 1))` for all `group` items
  - `estimatedPerPerson` = `perHeadTotal + groupShareTotal`
- Group split is display-only; DB always stores the total group price

**AttendeeSearch** (client component)
- Debounced input (300ms) calls `/api/users/search?q=`
- Dropdown: avatar + name + bio snippet
- Filters out already-added users and the organiser themselves

---

## API Routes

All routes live under `/app/api/`. All responses follow: `{ data: T | null, error: string | null }`.

### Profile & Users

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/profile` | Create or update own profile | Required |
| GET | `/api/users/search?q=` | Search users by name | Required |
| GET | `/api/users/[id]` | Get a user's public profile | Required |

### Plans

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/plans` | Create a new plan | Required |
| GET | `/api/plans/[id]` | Get plan details (checks attendee access) | Required |
| PUT | `/api/plans/[id]` | Update plan | Organiser only |

### Plan Items

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/plans/[id]/items` | Add cost item | Organiser only |
| PUT | `/api/plans/[id]/items/[itemId]` | Update cost item | Organiser only |
| DELETE | `/api/plans/[id]/items/[itemId]` | Delete cost item | Organiser only |

### Attendees

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/plans/[id]/attendees` | Add attendee by user ID | Organiser only |
| PATCH | `/api/plans/[id]/attendees/[attendeeId]` | Approve or reject attendee | Organiser only |
| DELETE | `/api/plans/[id]/attendees/[attendeeId]` | Remove attendee | Organiser only |

### Join Flow

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/join/[join_token]` | Resolve token → plan preview | None (public) |
| POST | `/api/join/[join_token]` | Request to join via link | Required |

---

## Database Schema

### `profiles`
```
id              uuid (PK, FK → auth.users.id)
name            text
bio             text
date_of_birth   date
gender          text
instagram       text
linkedin        text
twitter_x       text
avatar_url      text
photos          text[]
created_at      timestamp
```

### `plans`
```
id              uuid (PK)
organiser_id    uuid (FK → profiles.id)
title           text
description     text
itinerary       text
start_date      date          (optional)
status          text          CHECK IN ('draft', 'active', 'closed')
join_token      uuid          UNIQUE (generated on creation)
join_approval   boolean       DEFAULT true
created_at      timestamp
updated_at      timestamp
```

### `plan_items`
```
id              uuid (PK)
plan_id         uuid (FK → plans.id ON DELETE CASCADE)
title           text
price           numeric
pricing_type    text          CHECK IN ('per_head', 'group')
description     text
sort_order      integer
created_at      timestamp
```

### `plan_attendees`
```
id              uuid (PK)
plan_id         uuid (FK → plans.id ON DELETE CASCADE)
user_id         uuid (FK → profiles.id)
role            text          CHECK IN ('organiser', 'attendee')
status          text          CHECK IN ('pending', 'approved', 'rejected')
invited_by      uuid          (FK → profiles.id)
joined_via      text          CHECK IN ('invite_link', 'organiser_added')
created_at      timestamp
```

---

## Row Level Security (RLS) Policies

Two SECURITY DEFINER helper functions break circular references between `plans` and `plan_attendees` policies:

```sql
-- Helpers (bypass RLS to avoid recursion)
public.is_plan_organiser(p_plan_id UUID) → boolean
public.is_approved_plan_attendee(p_plan_id UUID) → boolean
```

```sql
-- profiles
CREATE POLICY "public read"  ON profiles FOR SELECT USING (true);
CREATE POLICY "own write"    ON profiles FOR ALL    USING (auth.uid() = id);

-- plans
CREATE POLICY "organiser all"  ON plans FOR ALL    USING (organiser_id = auth.uid());
CREATE POLICY "attendee read"  ON plans FOR SELECT USING (public.is_approved_plan_attendee(plans.id));
CREATE POLICY "join token read" ON plans FOR SELECT USING (join_token IS NOT NULL);

-- plan_items
CREATE POLICY "attendee/organiser read" ON plan_items FOR SELECT USING (
  public.is_plan_organiser(plan_items.plan_id)
  OR public.is_approved_plan_attendee(plan_items.plan_id)
);
CREATE POLICY "organiser write" ON plan_items FOR ALL USING (
  public.is_plan_organiser(plan_items.plan_id)
);

-- plan_attendees
CREATE POLICY "organiser all" ON plan_attendees FOR ALL USING (
  public.is_plan_organiser(plan_attendees.plan_id)
);
CREATE POLICY "own row read"  ON plan_attendees FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "approved attendees read approved" ON plan_attendees FOR SELECT USING (
  status = 'approved' AND public.is_approved_plan_attendee(plan_attendees.plan_id)
);
```

> **PostgREST FK hint:** `plan_attendees` has two FKs to `profiles` (`user_id` and `invited_by`). All queries embedding profiles from plan_attendees must use `profile:profiles!user_id(*)` to avoid the "more than one relationship" error.

---

## Supabase Storage

| Bucket | Access | Path Pattern | Description |
|--------|--------|--------------|-------------|
| `avatars` | Public | `avatars/{user_id}` | Single profile picture per user |
| `profile-photos` | Public | `profile-photos/{user_id}/{1,2,3}` | Up to 3 additional photos per user |

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL (safe for client)
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key (safe for client)
SUPABASE_SERVICE_ROLE_KEY=       # Server-only — NEVER expose to client
NEXT_PUBLIC_APP_URL=             # e.g. http://localhost:3000
```

---

## V2 Additions (Not in MVP)

### `plan_suggestions` table (for attendee messaging feature)
```
id          uuid (PK)
plan_id     uuid (FK → plans.id)
user_id     uuid (FK → profiles.id)
content     text
created_at  timestamp
read_at     timestamp
```

### Co-organisers
- `plan_attendees.role` already supports `'organiser'` — UI just needs a promote action
