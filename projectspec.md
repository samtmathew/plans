# Plans — Product & Feature Specification (V1 MVP)

## Core Concept

**Plans** gives a group trip organiser one place to answer everyone's questions — where are we staying, what does it cost, who's coming, what's the plan? Attendees get one place to see it all.

---

## User Flows

### 1. Onboarding (First-time signup)

```
Land on homepage (marketing/splash)
    ↓
Sign Up → Email + Password (Supabase Auth)
    ↓
Email verification (Supabase handles)
    ↓
Profile Setup at /onboarding (required before any other page)
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
Redirect → /home (Dashboard)
```

> If a logged-in user has no profile record, middleware must redirect them to `/onboarding` before any protected page loads.

---

### 2. Login

```
/login → Email + Password
    ↓
Profile exists? → /home
No profile?    → /onboarding
```

---

### 3. Home Dashboard (`/home`)

- **Header/Nav**: user avatar, name, link to profile, log out
- **"Your Plans" section**: cards for all plans the user is part of (organiser OR attendee), ordered by most recently updated
  - Card shows: title, description snippet, organiser name + avatar, attendee count, user's role badge (organiser/attendee), status badge (draft/active/closed)
  - Empty state: friendly message + "Create your first plan" CTA
- **"Create a Plan" button**: prominent (top right or FAB)

---

### 4. Plan Creation (`/plans/new`)

Multi-section form (single page, scroll or stepped).

**Section 1 — Basics**
- Title (required, max 80 chars)
- Description / vibe (required, max 300 chars)
- Itinerary (required, large textarea, no limit)

**Section 2 — Cost Breakdown**
- List of cost items; each item has:
  - Title (e.g. "Stay")
  - Price (numeric, $ prefix)
  - Pricing type toggle: "Per Head" / "Group Total"
  - Description (optional, max 150 chars)
- "Add Item" appends a new empty row
- Items can be reordered (drag handle) or deleted
- Live running totals:
  - Per-head total = sum of all per_head items
  - Group total = sum of all group items
  - Estimated per-person = per-head total + (group total ÷ approved attendee count)
  - Updates live as attendees are added in Section 3

**Section 3 — Attendees**
- Search by name: live dropdown (debounced 300ms) searches existing users
- Selecting adds them as a pending attendee (shown in list immediately — optimistic)
- Already-added users shown greyed out in dropdown
- Organiser cannot add themselves (filtered from results)
- Public join link toggle: enable a shareable `/join/[join_token]` URL
  - Sub-toggle: "Require organiser approval" (default: on)
- Current attendees list: avatar + name + status chip

**Section 4 — Review & Publish**
- Summary of all entered details
- "Publish Plan" → status = active, saved to DB
- "Save as Draft" → status = draft, not visible to attendees

---

### 5. Public Join Flow (`/join/[join_token]`)

```
Non-member visits /join/[join_token]
    ↓
Not logged in? → Redirect to /login?redirect=/join/[join_token]
                  (after login, redirect back)
    ↓
Already an attendee? → "You're already in this plan" + link to plan
Plan closed?         → "This plan is no longer accepting new members"
Organiser visiting?  → "You're the organiser of this plan" + link to plan
Plan is draft?       → "This plan isn't public yet"
    ↓
Show plan preview: title, description, organiser name + avatar
    ↓
Click "Request to Join"
    ↓
join_approval = false → status = approved immediately
join_approval = true  → status = pending; organiser sees request on plan page
```

---

### 6. Plan Detail — Organiser View (`/plans/[id]`)

- Plan title + description
- Itinerary (full text, formatted)
- Cost breakdown table:

| Item | Total Price | Type | Per Person |
|------|-------------|------|------------|
| Stay | $200 | Group | $20.00 ÷ 10 |
| Food | $80 | Per head | $80.00 |

- Totals box:
  - Per-head subtotal
  - Group share subtotal (your share = group total ÷ approved count)
  - **Estimated total**: per-head + group share
  - "Based on N people" label (live)
- Attendees section:
  - **Avatar stack**: circular overlapping avatars of approved attendees, "+N more" pill if >7
  - Full attendee list: name, avatar, status chip, role badge
  - Pending requests: "Approve" / "Reject" buttons (approving updates count + recalculates splits live)
  - "Add Attendee" button (search modal)
  - Shareable join link with copy button
- Edit plan button

---

### 7. Plan Detail — Attendee View (`/plans/[id]`)

Same page, role-restricted:

- No edit button
- No pending requests panel
- No "Add Attendee" button
- If status = `pending`: "Waiting for organiser approval" — cost breakdown and attendee list hidden
- If status = `approved`:
  - Full cost breakdown visible
  - **Avatar stack**: approved attendees only (pending hidden from view)
  - Can see + share join link (if enabled)
  - Cannot see other pending requests

---

### 8. Profile Pages

**`/profile`** (own profile):
- Cover strip: up to 3 photos
- Large avatar, name, bio
- Social links: Instagram, LinkedIn, X — icon links
- Age derived from date of birth (e.g. "24 years old")
- Gender (if provided)
- Edit mode: inline or separate `/profile/edit`

**`/profile/[id]`** (another user):
- Same layout, read-only

---

## Pages Summary

| Page | Route | Access |
|------|-------|--------|
| Landing | `/` | Public |
| Login | `/login` | Public |
| Sign Up | `/signup` | Public |
| Onboarding | `/onboarding` | Logged in, no profile |
| Dashboard | `/home` | Protected |
| Own Profile | `/profile` | Protected |
| User Profile | `/profile/[id]` | Protected |
| Create Plan | `/plans/new` | Protected |
| Plan Detail | `/plans/[id]` | Protected (attendees + organiser) |
| Edit Plan | `/plans/[id]/edit` | Protected (organiser only) |
| Join Page | `/join/[join_token]` | Public (redirects to login) |

---

## Components

### Plan Components (`/components/plan/`)

| Component | Description |
|-----------|-------------|
| `PlanCard` | Summary card used on home dashboard |
| `PlanForm` | Multi-section create/edit form |
| `CostBreakdown` | Cost items list with live running totals |
| `AttendeeSearch` | Debounced search dropdown for adding attendees |
| `AttendeeList` | Attendee list with status chips + approve/reject buttons |
| `PlanDetail` | Full plan view (organiser/attendee variants) |

### Profile Components (`/components/profile/`)

| Component | Description |
|-----------|-------------|
| `ProfileForm` | Profile setup and edit form |
| `ProfileCard` | User avatar + name (used in attendee lists) |
| `PhotoUpload` | Multi-photo upload (up to 3 extra photos) |

### Common Components (`/components/common/`)

| Component | Description |
|-----------|-------------|
| `Avatar` | Circular avatar with initials fallback |
| `StatusBadge` | Coloured chip for plan status and attendee status |
| `CopyLink` | One-tap copy-to-clipboard for join links |
| `EmptyState` | Friendly empty state with CTA |

---

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Signed up but never finished onboarding | Middleware redirects to `/onboarding` on every protected page |
| Organiser visits their own plan's join link | "You're the organiser" message + link to plan |
| Attendee tries to access edit page | 403 response; edit button not rendered |
| Plan has 0 attendees — group cost display | Show "—" with tooltip "Add attendees to estimate per-person cost" |
| Avatar stack has 10+ attendees | Show first 7 + "+N more" pill; clicking opens full list |
| User has no avatar | Initials fallback in neutral circle |
| 1 approved attendee (organiser only) | Show full group price as their share + "You're the only one so far" |
| Attendee removed — group splits change | Recalculate live; no stored value to update in DB |
| User searches for themselves as attendee | Filtered from results |
| Adding someone already in the plan | "Already added" shown in dropdown |
| Organiser re-approves rejected attendee | Re-approve button stays visible on rejected row |
| Image upload fails | Inline error shown; does not block form submission |
| Join token plan is a draft | "This plan isn't public yet" on join page |

---

## Design Principles

- **Mobile-first**: style for small screens, enhance for larger
- **One scroll per task**: plan creation is one focused form, not a 10-step wizard
- **Status at a glance**: badges everywhere — plan status, attendee status, role
- **Copy-paste friendly**: join links have one-tap copy, no friction
- **Empty states that explain**: tell the user what to do and why
- **Optimistic UI**: adding an attendee shows them in the list before API confirms

---

## Out of Scope for MVP (V2)

- Attendee-to-organiser suggestions/messaging
- Multiple co-organisers per plan (schema supports it; UI deferred)
- Real-time updates (polling or refresh is acceptable for MVP)
- Plans visible on public profile pages
