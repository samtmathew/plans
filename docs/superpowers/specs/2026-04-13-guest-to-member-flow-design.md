# Guest-to-Member Flow — Design Spec
**Date:** 2026-04-13  
**Status:** Approved

---

## Context

The app shares join links via WhatsApp. Guests open the link, enter their name, and request to join. The organizer approves or rejects from the manage page.

**The broken state:** After approval, guests see a green "You're in!" card and a cost/attendee preview — but hit a complete dead end. There is no path forward into the product, no link to the plan, and no account conversion flow. Guests who sign up manually land on `/home` with their `guest_attendees` row orphaned forever — no `plan_attendees` row is ever created.

**Goal:** Complete the guest → approved guest → account holder → retained member journey without adding friction or forcing a signup wall.

---

## Chosen Approach: Enhanced `/join/[token]` + Threaded Conversion

The join link stays the guest's permanent home. After approval it becomes a full plan view. A quiet conversion banner at the bottom nudges account creation. The `guest_token` is threaded through `emailRedirectTo` so it survives the email verification step and lands in `/onboarding` for automatic linking.

Rejected alternatives:
- **New `/plans/[id]/guest` route with token-based middleware exception** — adds non-standard auth surface, heavy for MVP
- **Supabase anonymous auth** — cleanest long-term model but requires rewriting the entire guest system; save for a future refactor

---

## End-to-End Flow

```
Guest opens WhatsApp join link
  → /join/[token] → plan preview
  → taps "I'm in" → enters name + optional email → status: pending

Organizer approves via manage page
  → PATCH /api/plans/[id]/guest-attendees/[id] { status: 'approved' }

Guest opens link again (or page is still open — status auto-polls)
  → JoinCard detects approved state
  → Shows: full plan view (title, date, description, itinerary, cost, attendees)
  → Bottom: GuestConversionBanner
      [Create account]   Log in →

Guest taps "Create account"
  → /signup?guest_token=X&plan_id=Y
  → emailRedirectTo = /onboarding?guest_token=X&plan_id=Y
  → Guest verifies email → lands on /onboarding with params intact

Guest completes onboarding
  → POST /api/auth/link-guest { guest_token, plan_id }
  → Creates plan_attendees row (status: approved, role: attendee, joined_via: invite_link)
  → Sets guest_attendees.user_id = auth.uid()
  → Redirect to /plans/[id]  ← in the product

Guest taps "Log in" instead (already has an account)
  → /login?guest_token=X&plan_id=Y
  → After successful login: POST /api/auth/link-guest, redirect to /plans/[id]
  → If already linked: redirect to /plans/[id] anyway
```

---

## Schema Changes

```sql
-- Link converted guest records to their new account (nullable — most guests never convert)
ALTER TABLE guest_attendees
  ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX idx_guest_attendees_user_id ON guest_attendees(user_id);
```

The `guest_attendees` row is never deleted on conversion — it serves as an audit trail of the original join (name given, timestamp, guest_token). Access is granted via a new `plan_attendees` row.

---

## New API: `POST /api/auth/link-guest`

**Auth:** Requires authenticated Supabase session.  
**Body:** `{ guest_token: string, plan_id: string }`

**Logic:**
1. Verify `guest_attendees` row exists: matching `guest_token` + `plan_id`, `status = 'approved'`
2. Check for existing `plan_attendees` row for `(plan_id, auth.uid())` — if exists, return success (idempotent)
3. Insert `plan_attendees`: `{ plan_id, user_id: auth.uid(), role: 'attendee', status: 'approved', joined_via: 'invite_link' }`
4. Update `guest_attendees.user_id = auth.uid()`
5. Return `{ data: { plan_id }, error: null }`

**Error cases (return error string, don't crash):**
- Guest token not found or doesn't match plan
- Guest status is not `approved`
- Plan not found

---

## Existing API Change: `GET /api/join/[join_token]/full-plan`

Add to response payload (already available from the `plans` row):
```ts
{
  title: string
  description: string
  start_date: string | null
  itinerary: string
  items: PlanItem[]
  attendees: PlanAttendee[]
}
```

---

## Component Changes

### `GuestFullPlan.tsx`
- Consume new fields from `/full-plan` API: title, description, start_date, itinerary
- Render plan header (title + date) at top
- Render description as a short excerpt below header
- Render itinerary in a `whitespace-pre-wrap` block
- Then cost breakdown, then attendees (existing logic unchanged)
- Entrance: single `opacity-0 → opacity-100` fade, `0.6s ease-out`, on mount — calm arrival, no stagger

### `GuestConversionBanner.tsx` (new)
- Quiet card below the plan content — no shadow, no gradient, subtle border only
- Heading: "Keep this plan with you" (small, not bold)
- Subtext: "See your joined plans, stay synced with updates." (muted)
- Primary CTA: "Create account" — styled consistent with existing CTAs (uppercase, tracking-wide, rounded-[2px], full-width on mobile)
- Secondary: "Log in →" as a text link only (not a button)
- Links: `/signup?guest_token=X&plan_id=Y` and `/login?guest_token=X&plan_id=Y`
- No urgency language. Calm, confident tone.

### `JoinCard.tsx`
- Approved branch (line 97): pass `plan` prop into `GuestFullPlan`, append `<GuestConversionBanner>` below
- No other structural changes

### `app/(auth)/signup/page.tsx`
- Read `guest_token`, `plan_id`, `email` from `useSearchParams()`
- When `guest_token` present: set `emailRedirectTo` to `/onboarding?guest_token=X&plan_id=Y`

### `app/(auth)/login/page.tsx`
- Read `guest_token` and `plan_id` from URL
- After successful `signInWithPassword()`: if params present, call `POST /api/auth/link-guest`
- On success or already-linked: redirect to `/plans/[plan_id]`
- On any other error: redirect to `/home` (don't block login)

### `app/(app)/onboarding/page.tsx`
- Read `guest_token` and `plan_id` from URL
- After profile upsert completes: if params present, call `POST /api/auth/link-guest`
- On success: redirect to `/plans/[plan_id]`
- On failure: redirect to `/home` (graceful fallback)

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/api/auth/link-guest/route.ts` | New linking endpoint |
| `components/join/GuestConversionBanner.tsx` | Conversion nudge component |

## Files to Modify

| File | Change |
|------|--------|
| `app/api/join/[join_token]/full-plan/route.ts` | Add title, description, start_date, itinerary to response |
| `components/join/GuestFullPlan.tsx` | Render full plan metadata + entrance animation |
| `components/join/JoinCard.tsx` | Pass plan to GuestFullPlan, add GuestConversionBanner |
| `app/(auth)/signup/page.tsx` | Read guest params, pre-fill email, thread through emailRedirectTo |
| `app/(auth)/login/page.tsx` | Read guest params, call link-guest after login |
| `app/(app)/onboarding/page.tsx` | Read guest params, call link-guest after onboarding |
| `SQL_CHANGELOG.md` | Document new column + index |

---

## Verification

1. **Guest join → pending → approved → full view**
   - Open join link fresh → see preview → submit name → see pending state
   - Organizer approves → guest refreshes link → sees full plan: title, description, itinerary, cost, attendees
   - Conversion banner visible at bottom

2. **New account conversion**
   - Tap "Create account" → land on `/signup` with email pre-filled
   - Sign up → verify email → land on `/onboarding` with guest params in URL
   - Complete onboarding → land on `/plans/[id]` as a real member
   - Verify `plan_attendees` row exists with `status = 'approved'`
   - Verify `guest_attendees.user_id` is set

3. **Existing account login**
   - Tap "Log in →" → land on `/login` with guest params
   - Log in → land on `/plans/[id]`
   - Verify `plan_attendees` row created

4. **Idempotency**
   - Run link-guest twice with same token → no duplicate row, no error

5. **Edge cases**
   - Invalid/expired guest_token: link-guest returns error, user redirected to `/home`
   - Guest token from a different plan: link-guest rejects the mismatch

---

## Future TODOs (out of scope for MVP)

- Migrate to Supabase anonymous auth (`signInAnonymously()`) so guest identity is server-side from day one
- Email notification to guest on approval (currently manual WhatsApp)
- "You were already added" detection when a logged-in user opens a join link for a plan they're on (currently redirects to `/plans/[id]` which is correct, but the message could be friendlier)
- Guest attendees shown in the "Who's coming" list on the approved view (currently only `plan_attendees` / authenticated users are shown)
