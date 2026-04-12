# Dev B — Task Checklist (Plans + Attendees)

## Ownership

Dev B builds everything on top of Dev A's foundation. All plan creation, editing, detail views, cost calculations, attendee management, and the join flow live here.

**Wait for Dev A to deliver before starting**:
- `/types/index.ts` — need `Plan`, `PlanItem`, `PlanAttendee`, `Profile` types
- `/lib/supabase/client.ts` and `server.ts` — needed for all API calls
- `/lib/supabase/middleware.ts` — needed to ensure your routes are protected
- `/api/users/search` route — needed for `AttendeeSearch` component

---

## Home Dashboard (`/home`)

- [ ] `/home` page — fetches all plans the logged-in user is part of (organiser or attendee)
- [ ] `PlanCard` component (`/components/plan/PlanCard.tsx`)
  - Shows: title, description snippet, organiser avatar + name, attendee count, role badge (organiser/attendee), status badge (draft/active/closed)
  - Links to `/plans/[id]`
- [ ] Empty state: friendly message + "Create your first plan" CTA (`EmptyState` component)
- [ ] "Create a Plan" button — links to `/plans/new`

---

## Plan Creation (`/plans/new`)

Single-page multi-section form. Form state managed client-side (Zustand or React Context) until submit.

### Section 1 — Basics
- [ ] Title input (required, max 80 chars, char counter)
- [ ] Description/vibe input (required, max 300 chars, char counter)
- [ ] Itinerary textarea (required, no limit, tall)

### Section 2 — Cost Breakdown (`CostBreakdown` component)
- [ ] `CostBreakdown` component (`/components/plan/CostBreakdown.tsx`)
  - Manages local array of plan items
  - Each row: title, price, per_head/group toggle, description, drag handle, delete button
  - "Add Item" appends empty row
  - Drag-to-reorder (updates `sort_order`)
- [ ] Live totals computed reactively:
  - `perHeadTotal` = sum of per_head items
  - `groupShareTotal` = sum of `price / Math.max(approvedAttendeeCount, 1)` for group items
  - `estimatedPerPerson` = perHeadTotal + groupShareTotal
- [ ] Each group item row shows inline label: e.g. `$200 total → $20.00 / person`
- [ ] Totals box with "Based on N people" label (live, updates from Section 3 attendee count)
- [ ] Edge case: 0 attendees → show "—" for group splits + helper prompt
- [ ] Cost calculation helpers in `/lib/utils/cost.ts`

### Section 3 — Attendees
- [ ] `AttendeeSearch` component (`/components/plan/AttendeeSearch.tsx`)
  - Debounced input (300ms) → calls `/api/users/search?q=`
  - Dropdown: avatar + name + bio snippet
  - Selecting adds to local attendees array (optimistic, not saved yet)
  - Already-added users shown greyed out
  - Filters out the organiser (self)
- [ ] `AttendeeList` component (`/components/plan/AttendeeList.tsx`)
  - Shows each attendee: avatar, name, status chip
  - Remove button (during creation)
- [ ] Join link toggle: enable/disable shareable URL
  - Sub-toggle: "Require organiser approval" (default: on)

### Section 4 — Review & Publish
- [ ] Summary display of all entered data
- [ ] "Publish Plan" button → `POST /api/plans` with `status: 'active'`, redirect to `/plans/[id]`
- [ ] "Save as Draft" button → same POST with `status: 'draft'`, redirect to `/plans/[id]`

---

## Plan Edit (`/plans/[id]/edit`)

- [ ] Pre-populates all form sections from existing plan data
- [ ] Same 4-section form as creation
- [ ] `PUT /api/plans/[id]` on save
- [ ] Returns 403 if current user is not the organiser

---

## Plan Detail View (`/plans/[id]`)

Single page with role-based rendering.

### Organiser View
- [ ] Title, description, itinerary
- [ ] Cost breakdown table with live per-person splits
- [ ] Totals box: per-head subtotal, group share subtotal, estimated total, "Based on N people"
- [ ] **Avatar stack**: horizontal strip of approved attendee avatars (circular, overlapping)
  - First 7 shown, "+N more" pill if >7
  - Clicking an avatar → navigates to `/profile/[id]`
- [ ] Full attendee list: name, avatar, status chip, role badge
- [ ] Pending requests section: "Approve" / "Reject" buttons
  - Approving recalculates group splits live (updates `approvedAttendeeCount`)
- [ ] "Add Attendee" button → opens search modal
- [ ] Copy join link button (`CopyLink` component)
- [ ] Edit plan button → `/plans/[id]/edit`

### Attendee View (same page, role-restricted)
- [ ] No edit button
- [ ] No pending requests panel
- [ ] No "Add Attendee" option
- [ ] If `status = pending`: show "Waiting for organiser approval", hide cost breakdown and attendee list
- [ ] If `status = approved`:
  - Show full cost breakdown
  - Avatar stack: approved attendees only (pending hidden)
  - Show join link for sharing (if enabled)

---

## Avatar Stack Component

- [ ] `Avatar` component handles no-image fallback (initials in neutral circle) — coordinate with Dev A
- [ ] Avatar stack logic:
  - Filter to `status = 'approved'` attendees only
  - Render up to 7 circular overlapping avatars
  - If count > 7: show "+N more" pill
  - Each avatar is a link to `/profile/[id]`
  - For non-organisers: pending attendees never appear in stack

---

## Public Join Page (`/join/[join_token]`)

- [ ] `GET /api/join/[join_token]` → returns plan preview
- [ ] If not logged in: redirect to `/login?redirect=/join/[join_token]`
- [ ] Show plan title, description, organiser name + avatar
- [ ] Handle all edge cases:
  - Already an attendee → "You're already in this plan"
  - Plan closed → "This plan is no longer accepting new members"
  - Plan is draft → "This plan isn't public yet"
  - User is organiser → "You're the organiser of this plan"
- [ ] "Request to Join" button → `POST /api/join/[join_token]`
  - `join_approval = false` → immediately approved
  - `join_approval = true` → status = pending

---

## Common Components

- [ ] `StatusBadge` (`/components/common/StatusBadge.tsx`)
  - Props: `status: 'draft' | 'active' | 'closed' | 'pending' | 'approved' | 'rejected'`
  - Coloured chip per status
- [ ] `CopyLink` (`/components/common/CopyLink.tsx`)
  - One-tap copy join URL to clipboard
  - Shows confirmation state after copy
- [ ] `EmptyState` (`/components/common/EmptyState.tsx`)
  - Props: `title`, `description`, `ctaLabel?`, `ctaHref?`

---

## API Routes

- [ ] `POST /api/plans` — create plan (all fields + items + attendees in one transaction if possible)
- [ ] `GET /api/plans/[id]` — get plan with joined organiser, attendees, items (access check: organiser or approved attendee)
- [ ] `PUT /api/plans/[id]` — update plan (organiser only)
- [ ] `POST /api/plans/[id]/items` — add cost item
- [ ] `PUT /api/plans/[id]/items/[itemId]` — update cost item
- [ ] `DELETE /api/plans/[id]/items/[itemId]` — delete cost item
- [ ] `POST /api/plans/[id]/attendees` — add attendee by user ID (organiser only)
- [ ] `PATCH /api/plans/[id]/attendees/[attendeeId]` — approve or reject
- [ ] `DELETE /api/plans/[id]/attendees/[attendeeId]` — remove attendee
- [ ] `GET /api/join/[join_token]` — resolve token → plan preview (public)
- [ ] `POST /api/join/[join_token]` — request to join (auth required)

---

## Utilities

- [ ] `/lib/utils/cost.ts`
  - `calcPerHeadTotal(items: PlanItem[]): number`
  - `calcGroupShareTotal(items: PlanItem[], attendeeCount: number): number`
  - `calcEstimatedPerPerson(items: PlanItem[], attendeeCount: number): number`
- [ ] `/lib/utils/format.ts`
  - `formatCurrency(amount: number): string` (e.g. `$20.00`)
  - `formatDate(date: string): string`
  - `calcAge(dateOfBirth: string): number`
- [ ] `/lib/validations/plan.ts`
  - Zod schema for plan creation form

---

## Acceptance Criteria

- `/home` shows all plans the user is part of, ordered by most recently updated
- Plan cards show correct role and status badges
- Plan creation form saves correctly with all 4 sections
- Draft plans not visible to attendees
- Cost splits update live when attendees are approved/removed
- Group items always store total price; per-person is always derived
- Avatar stack shows only approved attendees; max 7 + "+N more"
- Approve/reject works and updates group cost splits immediately
- Join link flow works end to end (with and without approval required)
- All plan API routes return `{ data, error }` shape
- Edit page returns 403 for non-organisers; edit button not shown to attendees
