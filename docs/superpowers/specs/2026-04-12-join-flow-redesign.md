# Join Flow Redesign — Design Spec
**Date:** 2026-04-12  
**Status:** Approved for implementation

---

## Context

Plans are shared via WhatsApp links. The current join flow requires the invitee to have an account and be logged in before they can even see the plan — this kills conversion. Real-world usage: someone gets a link in a group chat, taps it, hits a login wall, and drops off.

Goal: Let anyone see the plan preview instantly, request a spot with just their name, and come back to the same link later to check approval status — all without creating an account.

---

## What We're Building

A frictionless guest join flow on `/join/[join_token]` that:
1. Shows a public plan preview card (no auth required)
2. Lets guests request a spot with just a name (+ optional email)
3. Persists identity in localStorage so returning visitors see their status
4. Unlocks the full plan on approval — on the same page, same link
5. Shows guest requests in the organiser's manage UI alongside regular attendees

---

## Schema Changes

### New table: `guest_attendees`

```sql
CREATE TABLE guest_attendees (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id      UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  guest_token  UUID UNIQUE DEFAULT uuid_generate_v4() NOT NULL,
  name         TEXT NOT NULL,
  email        TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  joined_via   TEXT NOT NULL DEFAULT 'public_join',
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Why a separate table (not extending `plan_attendees`):**  
`plan_attendees.user_id` is a non-null FK to `profiles` — making it nullable would require schema surgery and RLS rewrites across the whole attendee system. A separate table is clean, additive, and zero-risk to existing flows.

### RLS policies for `guest_attendees`

```sql
-- Anyone can insert (anonymous guest join)
CREATE POLICY "guest_attendees: public insert"
  ON guest_attendees FOR INSERT
  WITH CHECK (true);

-- Anyone can read their own row by guest_token (status polling)
CREATE POLICY "guest_attendees: read by token"
  ON guest_attendees FOR SELECT
  USING (true);  -- filtered in API by guest_token param, not user identity

-- Organiser can read/update/delete guest attendees on their plans
CREATE POLICY "guest_attendees: organiser full access"
  ON guest_attendees FOR ALL
  USING (
    plan_id IN (
      SELECT id FROM plans WHERE organiser_id = auth.uid()
    )
  );
```

> **Note:** The "read by token" policy is permissive at DB level; the API route enforces token-scoped access in code. For MVP this is acceptable — guest_tokens are UUIDs (unguessable).

---

## API Routes

### `POST /api/join/[join_token]/guest`
Creates a guest attendee record.

**Body:** `{ name: string, email?: string }`  
**Auth:** None required  
**Response:** `{ data: { id, guest_token, status }, error }`  

Logic:
- Resolve `join_token` → plan (must be `status = 'active'`)
- Reject if plan is draft or closed
- Insert into `guest_attendees`
- Return `guest_token` — client stores this in localStorage

### `GET /api/join/[join_token]/guest-status?token=[guest_token]`
Polls current status for a returning guest.

**Auth:** None required  
**Response:** `{ data: { status, name }, error }`  

Logic:
- Resolve `join_token` → plan_id
- Select from `guest_attendees` where `plan_id = X AND guest_token = Y`
- Returns `null` if not found (localStorage out of sync)

### `PATCH /api/plans/[id]/guest-attendees/[guestId]`
Approve or reject a guest (organiser only).

**Auth:** Required (organiser only)  
**Body:** `{ status: 'approved' | 'rejected' }`  
**Response:** `{ data: guest_attendee, error }`

### `DELETE /api/plans/[id]/guest-attendees/[guestId]`
Remove a guest attendee (organiser only).

### `GET /api/join/[join_token]/full-plan?token=[guest_token]`
Returns full plan data for an approved guest.

**Auth:** None required  
**Response:** `{ data: { items, attendees, itinerary }, error }`  

Logic:
- Resolve `join_token` → plan_id
- Validate `guest_token` → `guest_attendees` row must exist with `status = 'approved'`
- Return full `plan_items` and approved `plan_attendees` (with profiles)
- Returns 403 if token not found or not approved

---

## Frontend Architecture

### `/app/join/[join_token]/page.tsx` (server component)

**Changes:**
- Remove `if (!user) redirect('/login?...')` — page is now fully public
- Fetch plan data with anon Supabase client (existing RLS policy `"plans: join token read"` already permits public SELECT by join_token)
- Pass plan preview data + `join_token` to `<JoinCard>`
- If user is authenticated organiser: redirect to `/plans/[id]` as before
- If user is authenticated existing attendee: redirect to `/plans/[id]` as before

**Data fetched for preview (no auth):**
- `plan.title`, `plan.description`, `plan.cover_photo`
- `plan.start_date`, `plan.status`, `plan.join_approval`
- `organiser.name`, `organiser.avatar_url`
- `approvedAttendees.length` (count only)
- `calcEstimatedPerPerson(items, approvedCount)` (derived, not stored)

**Data NOT exposed until approved:**
- Full itinerary (`plan_items`)
- Full cost breakdown
- Attendee profiles/avatars

### `components/join/JoinCard.tsx` (new, client component)

The core component. Uses CSS 3D flip to transition between faces.

```
States:
  preview   → flip →   form   → submit →   pending
                                        →   approved  (full plan data fetched on client)
                                        →   rejected
```

**Face A (front): Plan preview**
- Cover photo (full-bleed top)
- Plan title + description
- Meta pills: date, attendee count, est. cost/pp
- Organiser avatar + name chip
- 🔒 locked teaser section (itinerary/costs)
- "I'm in 🎉" CTA using `bg-animate-button` from @cult-ui

**Face B (back): Join form**
- Back arrow (flips card back)
- Small plan context chip (cover thumbnail + title)
- Name field (required)
- Email field (optional, with "get notified" hint)
- "Request to join →" submit button
- "No account needed" micro-copy

**Post-submit states (replaces card content, no flip back):**
- **Pending:** hourglass icon, "Waiting for approval", "Come back to this link"
  - If no email given: soft nudge "Add your email to get notified →" (inline form)
- **Approved:** green badge, plan title, then full plan content renders below
- **Rejected:** muted state, "Not this time"

**localStorage logic:**
```ts
// Key per join link
const storageKey = `plans_join_${join_token}`

// On mount: check for existing guest session
const stored = localStorage.getItem(storageKey)
if (stored) {
  const { guest_token } = JSON.parse(stored)
  // Fetch current status from API
  // Update state accordingly
}

// After submit: store guest session
localStorage.setItem(storageKey, JSON.stringify({
  guest_token: data.guest_token,
  name: formData.name,
  status: 'pending',
}))
```

### `components/join/GuestFullPlan.tsx` (new, client component)

Renders when guest is approved. On mount, fetches from `GET /api/join/[join_token]/full-plan?token=[guest_token]` using the guest_token stored in localStorage. Server validates the token and returns full plan data only if status is approved. Shows:
- Full itinerary timeline
- Full cost breakdown
- Approved attendee avatars

### Organiser-side changes

**`app/(app)/plans/[id]/manage/ManagePending.tsx`**
- Extended to fetch `guest_attendees` alongside `plan_attendees`
- Renders guest requests in same grid with a "Guest" badge
- Approve/reject calls new `/api/plans/[id]/guest-attendees/[guestId]` endpoint

**`components/plan/AttendeeList.tsx`**
- Organiser view shows guest attendees section after regular pending attendees
- Guest rows show name + "Guest" pill instead of profile avatar

---

## cult-ui / cardcn Components

| Component | Registry | Used for |
|-----------|----------|----------|
| `texture-card` or `minimal-card` | @cult-ui | Base card shell with correct dark styling |
| `bg-animate-button` | @cult-ui | "I'm in 🎉" primary CTA |
| `cosmic-button` | @cult-ui | Secondary "View details" link (optional) |
| `text-animate` | @cult-ui | Approved state headline reveal animation |
| shadcn `Input` | @shadcn | Name + email form fields |
| shadcn `Badge` | @shadcn | Status pills (Pending / Approved / Rejected) |

Install before building:
```bash
npx shadcn@latest add @cult-ui/texture-card @cult-ui/bg-animate-button @cult-ui/text-animate
```

---

## Access Model

| Guest state | Sees |
|-------------|------|
| No localStorage | Preview card: title, cover, date, count, est. cost. Locked: itinerary, costs, attendees |
| Pending | Same preview + pending state card |
| Approved | Full plan: itinerary, costs, full attendee list |
| Rejected | Rejection card only |

---

## UX Principles

- **Card flip animation:** CSS `transform: rotateY(180deg)` with `perspective: 1000px`. Duration ~400ms, ease-in-out. The card container has fixed height to prevent layout shift.
- **No navigation:** All states live on `/join/[join_token]`. No redirects for guests.
- **Mobile-first:** Card max-width 420px, centered. Full-bleed cover photo.
- **Fast:** Page is a server component — public plan data is SSR'd. No loading flash for the initial preview. Status polling is client-side on mount only.

---

## Verification Checklist

1. Visit `/join/[token]` without being logged in → plan preview card renders (no login redirect)
2. Tap "I'm in" → card flips to form
3. Submit name only → guest_attendees row created, guest_token stored in localStorage
4. Revisit same URL on same browser → pending state shown (not preview card)
5. Organiser approves from manage page → guest_attendees.status = 'approved'
6. Revisit URL → approved state, full plan content visible
7. Organiser rejects → rejected state on revisit
8. Authenticated user visits own plan join link → still redirected to /plans/[id]
9. Authenticated user who's already an attendee → redirected to /plans/[id]
10. Draft plan visited → "not public yet" state (unchanged)
11. Closed plan visited → "closed" state (unchanged)
