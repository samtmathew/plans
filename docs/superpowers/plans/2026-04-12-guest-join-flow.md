# Guest Join Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the login-walled join page with a frictionless guest join flow — flip-card UX, name-only signup, localStorage identity, and full plan unlock on approval.

**Architecture:** New `guest_attendees` table stores unauthenticated join requests keyed by a UUID `guest_token` stored in localStorage. The join page is a public server component that renders preview data; a `JoinCard` client component handles all state transitions (preview → form flip → pending → approved/rejected) without page navigation. The organiser's manage UI gets a guest section alongside the existing auth attendee section.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + RLS), Tailwind CSS, shadcn/ui, @cult-ui (bg-animate-button, text-animate), React Hook Form + Zod, TypeScript strict

---

## File Map

**Created:**
- `components/join/JoinCard.tsx` — core flip-card orchestrator (all guest states)
- `components/join/JoinCardPreviewFace.tsx` — front face of card (plan preview + CTA)
- `components/join/JoinCardFormFace.tsx` — back face of card (join form)
- `components/join/JoinStatusCard.tsx` — post-submit states: pending / approved / rejected
- `components/join/GuestFullPlan.tsx` — full plan view shown to approved guests
- `app/api/join/[join_token]/guest/route.ts` — POST: create guest attendee
- `app/api/join/[join_token]/guest-status/route.ts` — GET: poll status by token
- `app/api/join/[join_token]/full-plan/route.ts` — GET: full plan data for approved guest
- `app/api/plans/[id]/guest-attendees/[guestId]/route.ts` — PATCH/DELETE: organiser actions

**Modified:**
- `types/index.ts` — add `GuestAttendee` type + `PlanPreviewData` type
- `app/join/[join_token]/page.tsx` — remove auth redirect, pass preview props to JoinCard
- `app/(app)/plans/[id]/manage/page.tsx` — fetch guest_attendees + pass to ManageTabs
- `app/(app)/plans/[id]/manage/ManageTabs.tsx` — add guestCount badge, pass guests to pending tab
- `app/(app)/plans/[id]/manage/ManagePending.tsx` — add guest section below regular pending
- `SQL_CHANGELOG.md` — document guest_attendees migration

---

## Task 1: SQL migration — guest_attendees table

**Files:**
- Modify: `SQL_CHANGELOG.md`

- [ ] **Step 1: Run this SQL in your Supabase dashboard SQL editor**

```sql
-- guest_attendees: unauthenticated join requests identified by guest_token
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

ALTER TABLE guest_attendees ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_guest_attendees_plan_id ON guest_attendees(plan_id);
CREATE INDEX idx_guest_attendees_guest_token ON guest_attendees(guest_token);

-- Anyone can submit a guest join request
CREATE POLICY "guest_attendees: public insert"
  ON guest_attendees FOR INSERT
  WITH CHECK (true);

-- Any row can be read (API code filters by guest_token — UUIDs are unguessable)
CREATE POLICY "guest_attendees: public read"
  ON guest_attendees FOR SELECT
  USING (true);

-- Organiser can update and delete guest rows on their plans
CREATE POLICY "guest_attendees: organiser write"
  ON guest_attendees FOR ALL
  USING (
    plan_id IN (
      SELECT id FROM plans WHERE organiser_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Verify the table was created**

Run in Supabase SQL editor:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'guest_attendees'
ORDER BY ordinal_position;
```
Expected: 8 rows — id, plan_id, guest_token, name, email, status, joined_via, created_at

- [ ] **Step 3: Document in SQL_CHANGELOG.md**

Append to the bottom of `SQL_CHANGELOG.md`:

```markdown
## 2026-04-12 — guest_attendees table

Added `guest_attendees` table to support unauthenticated join requests from WhatsApp-shared links.
Guests are identified by a UUID `guest_token` stored client-side in localStorage.

\`\`\`sql
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
ALTER TABLE guest_attendees ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_guest_attendees_plan_id ON guest_attendees(plan_id);
CREATE INDEX idx_guest_attendees_guest_token ON guest_attendees(guest_token);
-- RLS: public insert, public read (filtered in API), organiser write
\`\`\`

Why: Avoids requiring Supabase auth for the invite link experience.
Separate from plan_attendees (which requires non-null user_id FK to profiles).
```

- [ ] **Step 4: Commit**

```bash
git add SQL_CHANGELOG.md
git commit -m "docs: add guest_attendees migration to SQL_CHANGELOG"
```

---

## Task 2: TypeScript types

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Add GuestAttendee and PlanPreviewData types**

At the bottom of `types/index.ts`, after the existing `ProfileInput` type, add:

```typescript
// -------------------------------------------------------
// Guest join flow (unauthenticated attendees)
// -------------------------------------------------------

export type GuestAttendee = {
  id: string
  plan_id: string
  guest_token: string
  name: string
  email: string | null
  status: 'pending' | 'approved' | 'rejected'
  joined_via: string
  created_at: string
}

// Minimal plan data safe to render on the public join page (no auth)
export type PlanPreviewData = {
  id: string
  title: string
  description: string | null
  cover_photo: string | null
  start_date: string | null
  join_approval: boolean
  organiser: {
    name: string
    avatar_url: string | null
  }
  approved_count: number
  cost_per_person: number
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat(types): add GuestAttendee and PlanPreviewData types"
```

---

## Task 3: Install cult-ui components

**Files:**
- New components added to `components/ui/` by shadcn CLI

- [ ] **Step 1: Add bg-animate-button from @cult-ui**

```bash
npx shadcn@latest add @cult-ui/bg-animate-button
```
Expected: component file created in `components/ui/`

- [ ] **Step 2: Add text-animate from @cult-ui**

```bash
npx shadcn@latest add @cult-ui/text-animate
```

- [ ] **Step 3: Verify both components exist**

```bash
ls components/ui/ | grep -E "bg-animate|text-animate"
```
Expected: see the two new component files listed

- [ ] **Step 4: Commit**

```bash
git add components/ui/
git commit -m "feat: install bg-animate-button and text-animate from @cult-ui"
```

---

## Task 4: API route — POST /api/join/[join_token]/guest

**Files:**
- Create: `app/api/join/[join_token]/guest/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
// app/api/join/[join_token]/guest/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
})

interface Params {
  params: Promise<{ join_token: string }>
}

export async function POST(request: Request, { params }: Params) {
  const { join_token } = await params
  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('plans')
    .select('id, status')
    .eq('join_token', join_token)
    .single()

  if (!plan) {
    return NextResponse.json({ data: null, error: 'Plan not found' }, { status: 404 })
  }

  if (plan.status !== 'active') {
    return NextResponse.json(
      { data: null, error: 'This plan is not accepting new members' },
      { status: 400 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { name, email } = parsed.data

  const { data, error } = await supabase
    .from('guest_attendees')
    .insert({
      plan_id: plan.id,
      name,
      email: email || null,
    })
    .select('id, guest_token, status')
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/api/join/
git commit -m "feat(api): POST /api/join/[token]/guest — create guest attendee"
```

---

## Task 5: API route — GET guest-status + GET full-plan

**Files:**
- Create: `app/api/join/[join_token]/guest-status/route.ts`
- Create: `app/api/join/[join_token]/full-plan/route.ts`

- [ ] **Step 1: Create guest-status route**

```typescript
// app/api/join/[join_token]/guest-status/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ join_token: string }>
}

export async function GET(request: Request, { params }: Params) {
  const { join_token } = await params
  const { searchParams } = new URL(request.url)
  const guestToken = searchParams.get('token')

  if (!guestToken) {
    return NextResponse.json({ data: null, error: 'Missing token' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('plans')
    .select('id')
    .eq('join_token', join_token)
    .single()

  if (!plan) {
    return NextResponse.json({ data: null, error: 'Plan not found' }, { status: 404 })
  }

  const { data } = await supabase
    .from('guest_attendees')
    .select('status, name')
    .eq('plan_id', plan.id)
    .eq('guest_token', guestToken)
    .single()

  return NextResponse.json({ data: data ?? null, error: null })
}
```

- [ ] **Step 2: Create full-plan route**

```typescript
// app/api/join/[join_token]/full-plan/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ join_token: string }>
}

export async function GET(request: Request, { params }: Params) {
  const { join_token } = await params
  const { searchParams } = new URL(request.url)
  const guestToken = searchParams.get('token')

  if (!guestToken) {
    return NextResponse.json({ data: null, error: 'Missing token' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('plans')
    .select('id')
    .eq('join_token', join_token)
    .single()

  if (!plan) {
    return NextResponse.json({ data: null, error: 'Plan not found' }, { status: 404 })
  }

  const { data: guest } = await supabase
    .from('guest_attendees')
    .select('status')
    .eq('plan_id', plan.id)
    .eq('guest_token', guestToken)
    .single()

  if (!guest || guest.status !== 'approved') {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  const [{ data: items }, { data: attendees }] = await Promise.all([
    supabase
      .from('plan_items')
      .select('*')
      .eq('plan_id', plan.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('plan_attendees')
      .select('*, profile:profiles!user_id(*)')
      .eq('plan_id', plan.id)
      .eq('status', 'approved'),
  ])

  return NextResponse.json({
    data: { items: items ?? [], attendees: attendees ?? [] },
    error: null,
  })
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/api/join/
git commit -m "feat(api): GET guest-status and GET full-plan for approved guests"
```

---

## Task 6: API route — PATCH/DELETE guest-attendees (organiser)

**Files:**
- Create: `app/api/plans/[id]/guest-attendees/[guestId]/route.ts`

- [ ] **Step 1: Create the organiser guest management route**

```typescript
// app/api/plans/[id]/guest-attendees/[guestId]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['approved', 'rejected']),
})

interface Params {
  params: Promise<{ id: string; guestId: string }>
}

async function getOrganiserPlan(planId: string, userId: string) {
  const supabase = await createClient()
  const { data: plan } = await supabase
    .from('plans')
    .select('organiser_id')
    .eq('id', planId)
    .single()
  return plan?.organiser_id === userId ? plan : null
}

export async function PATCH(request: Request, { params }: Params) {
  const { id: planId, guestId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const plan = await getOrganiserPlan(planId, user.id)
  if (!plan) return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ data: null, error: 'Invalid body' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('guest_attendees')
    .update({ status: parsed.data.status })
    .eq('id', guestId)
    .eq('plan_id', planId)
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id: planId, guestId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const plan = await getOrganiserPlan(planId, user.id)
  if (!plan) return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('guest_attendees')
    .delete()
    .eq('id', guestId)
    .eq('plan_id', planId)

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data: { id: guestId }, error: null })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/api/plans/
git commit -m "feat(api): PATCH/DELETE /api/plans/[id]/guest-attendees/[guestId]"
```

---

## Task 7: JoinCard — flip card shell + preview face

**Files:**
- Create: `components/join/JoinCard.tsx`
- Create: `components/join/JoinCardPreviewFace.tsx`

The flip card uses inline styles for the 3D transform (Tailwind has no built-in `rotateY` or `preserve-3d` utilities in v3).

- [ ] **Step 1: Create JoinCardPreviewFace**

```typescript
// components/join/JoinCardPreviewFace.tsx
'use client'

import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Users, DollarSign, Lock } from 'lucide-react'
import type { PlanPreviewData } from '@/types'

interface Props {
  plan: PlanPreviewData
  onImIn: () => void
}

export function JoinCardPreviewFace({ plan, onImIn }: Props) {
  const formattedDate = plan.start_date
    ? new Date(plan.start_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden">
      {/* Cover photo */}
      <div className="relative h-48 w-full shrink-0 bg-muted">
        {plan.cover_photo ? (
          <Image
            src={plan.cover_photo}
            alt={plan.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-4xl">✈️</span>
          </div>
        )}
        {/* Attendee count pill */}
        {plan.approved_count > 0 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 text-white text-xs font-medium">
            {plan.approved_count} going
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Organiser */}
        <div className="flex items-center gap-2.5">
          <Avatar className="w-7 h-7">
            <AvatarImage src={plan.organiser.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">
              {plan.organiser.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">
              Hosted by
            </p>
            <p className="text-xs font-medium text-foreground leading-none">
              {plan.organiser.name}
            </p>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold font-headline text-foreground leading-tight tracking-tight">
            {plan.title}
          </h1>
          {plan.description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
              {plan.description}
            </p>
          )}
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-1.5">
          {formattedDate && (
            <span className="inline-flex items-center gap-1.5 bg-muted rounded-full px-2.5 py-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
          )}
          {plan.approved_count > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-muted rounded-full px-2.5 py-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              {plan.approved_count} going
            </span>
          )}
          {plan.cost_per_person > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-muted rounded-full px-2.5 py-1 text-xs text-muted-foreground">
              <DollarSign className="w-3 h-3" />
              ~${Math.round(plan.cost_per_person)}/pp
            </span>
          )}
        </div>

        {/* Locked teaser */}
        <div className="flex-1 flex items-center justify-center bg-muted/40 border border-dashed border-border rounded-lg p-4 min-h-[64px]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span className="text-xs">Itinerary, costs &amp; full attendee list</span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onImIn}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          I&apos;m in 🎉
        </button>

        {plan.join_approval && (
          <p className="text-center text-[10px] text-muted-foreground -mt-2">
            The organiser reviews all requests before approving
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create JoinCard orchestrator**

```typescript
// components/join/JoinCard.tsx
'use client'

import { useState, useEffect } from 'react'
import { JoinCardPreviewFace } from './JoinCardPreviewFace'
import { JoinCardFormFace } from './JoinCardFormFace'
import { JoinStatusCard } from './JoinStatusCard'
import { GuestFullPlan } from './GuestFullPlan'
import type { PlanPreviewData } from '@/types'
// Note: GuestFullPlan does not need the plan prop — it fetches its own full data

type GuestState = 'preview' | 'form' | 'pending' | 'approved' | 'rejected'

interface StoredSession {
  guest_token: string
  name: string
  status: GuestState
}

interface Props {
  plan: PlanPreviewData
  joinToken: string
}

function storageKey(joinToken: string) {
  return `plans_join_${joinToken}`
}

export function JoinCard({ plan, joinToken }: Props) {
  const [state, setState] = useState<GuestState>('preview')
  const [isFlipped, setIsFlipped] = useState(false)
  const [guestToken, setGuestToken] = useState<string | null>(null)
  const [guestName, setGuestName] = useState('')

  // On mount: check localStorage for returning guest
  useEffect(() => {
    const raw = localStorage.getItem(storageKey(joinToken))
    if (!raw) return

    let session: StoredSession
    try {
      session = JSON.parse(raw)
    } catch {
      localStorage.removeItem(storageKey(joinToken))
      return
    }

    setGuestToken(session.guest_token)
    setGuestName(session.name)

    // Fetch fresh status from server
    fetch(`/api/join/${joinToken}/guest-status?token=${session.guest_token}`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data) {
          localStorage.removeItem(storageKey(joinToken))
          return
        }
        const freshStatus = data.status as GuestState
        setState(freshStatus)
        localStorage.setItem(
          storageKey(joinToken),
          JSON.stringify({ ...session, status: freshStatus })
        )
      })
      .catch(() => {
        // Network error — use cached status
        setState(session.status)
      })
  }, [joinToken])

  function handleImIn() {
    setIsFlipped(true)
    setState('form')
  }

  function handleFormBack() {
    setIsFlipped(false)
    setState('preview')
  }

  async function handleFormSubmit(name: string, email: string) {
    const res = await fetch(`/api/join/${joinToken}/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: email || undefined }),
    })
    const { data, error } = await res.json()
    if (error || !data) throw new Error(error ?? 'Failed to join')

    localStorage.setItem(
      storageKey(joinToken),
      JSON.stringify({ guest_token: data.guest_token, name, status: 'pending' })
    )
    setGuestToken(data.guest_token)
    setGuestName(name)
    setIsFlipped(false)
    setState('pending')
  }

  // Approved: show status badge + full plan below
  if (state === 'approved' && guestToken) {
    return (
      <div className="w-full max-w-[420px] mx-auto space-y-6">
        <JoinStatusCard state="approved" guestName={guestName} />
        <GuestFullPlan joinToken={joinToken} guestToken={guestToken} />
      </div>
    )
  }

  // Rejected
  if (state === 'rejected') {
    return (
      <div className="w-full max-w-[420px] mx-auto">
        <JoinStatusCard state="rejected" guestName={guestName} />
      </div>
    )
  }

  // Pending
  if (state === 'pending') {
    return (
      <div className="w-full max-w-[420px] mx-auto">
        <JoinStatusCard
          state="pending"
          guestName={guestName}
          planTitle={plan.title}
          organiserName={plan.organiser.name}
        />
      </div>
    )
  }

  // Preview + Form (flip card)
  const cardHeight = 580

  return (
    <div
      className="w-full max-w-[420px] mx-auto"
      style={{ perspective: '1200px', height: cardHeight }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front face */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <JoinCardPreviewFace plan={plan} onImIn={handleImIn} />
        </div>

        {/* Back face */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <JoinCardFormFace
            plan={plan}
            onBack={handleFormBack}
            onSubmit={handleFormSubmit}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: errors only for missing `JoinCardFormFace`, `JoinStatusCard`, `GuestFullPlan` (next tasks)

- [ ] **Step 4: Commit**

```bash
git add components/join/
git commit -m "feat(join): JoinCard flip shell + preview face"
```

---

## Task 8: JoinCardFormFace — back of card

**Files:**
- Create: `components/join/JoinCardFormFace.tsx`

- [ ] **Step 1: Create JoinCardFormFace**

```typescript
// components/join/JoinCardFormFace.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import type { PlanPreviewData } from '@/types'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
})
type FormValues = z.infer<typeof formSchema>

interface Props {
  plan: PlanPreviewData
  onBack: () => void
  onSubmit: (name: string, email: string) => Promise<void>
}

export function JoinCardFormFace({ plan, onBack, onSubmit }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  async function onFormSubmit(values: FormValues) {
    setServerError(null)
    try {
      await onSubmit(values.name, values.email ?? '')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden p-5 gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-sm font-bold text-foreground leading-none">Almost there</p>
          <p className="text-xs text-muted-foreground mt-0.5">Just your name to request a spot</p>
        </div>
      </div>

      {/* Plan chip */}
      <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-2.5 border border-border">
        {plan.cover_photo ? (
          <div className="relative w-9 h-9 rounded shrink-0 overflow-hidden bg-muted">
            <Image src={plan.cover_photo} alt={plan.title} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded shrink-0 bg-primary/10 flex items-center justify-center text-sm">
            ✈️
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{plan.title}</p>
          <p className="text-[10px] text-muted-foreground">by {plan.organiser.name}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col flex-1 gap-4">
        {/* Name field */}
        <div className="space-y-1.5">
          <Label htmlFor="guest-name" className="text-xs font-semibold uppercase tracking-wide">
            Your name <span className="text-primary">*</span>
          </Label>
          <Input
            id="guest-name"
            placeholder="Alex Smith"
            autoFocus
            {...register('name')}
            className="h-11"
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Email field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="guest-email" className="text-xs font-semibold uppercase tracking-wide">
              Email
            </Label>
            <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
              optional
            </span>
          </div>
          <Input
            id="guest-email"
            type="email"
            placeholder="Get notified when approved"
            {...register('email')}
            className="h-11"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          No account needed. Return to this link to check your status.
        </p>

        {serverError && (
          <p className="text-xs text-destructive text-center">{serverError}</p>
        )}

        <div className="mt-auto">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
            ) : (
              'Request to join →'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: errors only for missing `JoinStatusCard`, `GuestFullPlan`

- [ ] **Step 3: Commit**

```bash
git add components/join/JoinCardFormFace.tsx
git commit -m "feat(join): JoinCardFormFace — back face of flip card"
```

---

## Task 9: JoinStatusCard — pending / approved / rejected states

**Files:**
- Create: `components/join/JoinStatusCard.tsx`

- [ ] **Step 1: Create JoinStatusCard**

```typescript
// components/join/JoinStatusCard.tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Clock, XCircle, Mail } from 'lucide-react'

type GuestState = 'pending' | 'approved' | 'rejected'

interface Props {
  state: GuestState
  guestName: string
  planTitle?: string
  organiserName?: string
}

const config = {
  pending: {
    icon: Clock,
    iconClass: 'text-yellow-500',
    bgClass: 'bg-yellow-500/10 border-yellow-500/20',
    title: (name: string) => `You're in the queue, ${name}`,
    subtitle: (organiser?: string) =>
      organiser
        ? `${organiser} will review your request. Come back to this link to check.`
        : 'Come back to this link to check your status.',
  },
  approved: {
    icon: CheckCircle2,
    iconClass: 'text-green-500',
    bgClass: 'bg-green-500/10 border-green-500/20',
    title: (name: string) => `You're in, ${name}! 🎉`,
    subtitle: () => 'Full plan is now unlocked below.',
  },
  rejected: {
    icon: XCircle,
    iconClass: 'text-muted-foreground',
    bgClass: 'bg-muted/50 border-border',
    title: (name: string) => `Not this time, ${name}`,
    subtitle: () => 'This plan isn\'t open to new members right now.',
  },
}

export function JoinStatusCard({ state, guestName, planTitle: _planTitle, organiserName }: Props) {
  const c = config[state]
  const Icon = c.icon
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailValue, setEmailValue] = useState('')
  const [saving, setSaving] = useState(false)

  return (
    <div className={`rounded-xl border p-5 space-y-4 ${c.bgClass}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-6 h-6 mt-0.5 shrink-0 ${c.iconClass}`} />
        <div>
          <p className="font-bold text-foreground text-sm leading-snug">
            {c.title(guestName || 'there')}
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {c.subtitle(organiserName)}
          </p>
        </div>
      </div>

      {/* Email nudge — only show for pending state */}
      {state === 'pending' && !emailSaved && (
        <div className="space-y-2 pt-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Mail className="w-3 h-3" />
            Want to get notified when approved?
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              className="h-8 text-xs flex-1"
            />
            <button
              disabled={saving || !emailValue}
              onClick={async () => {
                if (!emailValue) return
                setSaving(true)
                // Email is captured client-side for now — notification infra added later
                await new Promise((r) => setTimeout(r, 400))
                setEmailSaved(true)
                setSaving(false)
              }}
              className="h-8 px-3 rounded bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 shrink-0"
            >
              {saving ? '…' : 'Notify me'}
            </button>
          </div>
        </div>
      )}

      {state === 'pending' && emailSaved && (
        <p className="text-xs text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3" />
          Got it — we&apos;ll let you know.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: errors only for missing `GuestFullPlan`

- [ ] **Step 3: Commit**

```bash
git add components/join/JoinStatusCard.tsx
git commit -m "feat(join): JoinStatusCard — pending/approved/rejected states"
```

---

## Task 10: GuestFullPlan — approved plan view

**Files:**
- Create: `components/join/GuestFullPlan.tsx`

- [ ] **Step 1: Create GuestFullPlan**

```typescript
// components/join/GuestFullPlan.tsx
'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { calcEstimatedPerPerson } from '@/lib/utils/cost'
import type { PlanItem, PlanAttendee } from '@/types'

interface FullPlanData {
  items: PlanItem[]
  attendees: PlanAttendee[]
}

interface Props {
  joinToken: string
  guestToken: string
}

export function GuestFullPlan({ joinToken, guestToken }: Props) {
  const [data, setData] = useState<FullPlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/join/${joinToken}/full-plan?token=${guestToken}`)
      .then((r) => r.json())
      .then(({ data: d, error: e }) => {
        if (e) { setError(e); return }
        setData(d)
      })
      .catch(() => setError('Failed to load plan details'))
      .finally(() => setLoading(false))
  }, [joinToken, guestToken])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        Could not load plan details. Refresh the page to try again.
      </p>
    )
  }

  const costPerPerson = calcEstimatedPerPerson(data.items, data.attendees.length)

  return (
    <div className="space-y-6">
      {/* Cost breakdown */}
      {data.items.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Cost Breakdown
            </p>
          </div>
          <div className="divide-y divide-border">
            {data.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                    {item.pricing_type === 'per_head' ? 'Per person' : 'Group cost'}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground shrink-0 ml-4">
                  ${item.price.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-muted/50 px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs font-bold text-foreground">Est. per person</p>
            <p className="text-sm font-bold text-primary">${Math.round(costPerPerson)}</p>
          </div>
        </div>
      )}

      {/* Attendees */}
      {data.attendees.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Who&apos;s Coming ({data.attendees.length})
            </p>
          </div>
          <div className="divide-y divide-border">
            {data.attendees.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={a.profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {(a.profile?.name ?? '?').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-foreground">
                  {a.profile?.name ?? 'Member'}
                </p>
                {a.role === 'organiser' && (
                  <span className="ml-auto text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-medium">
                    Organiser
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/join/GuestFullPlan.tsx
git commit -m "feat(join): GuestFullPlan — full plan view for approved guests"
```

---

## Task 11: Update /app/join/[join_token]/page.tsx

Remove the login redirect, fetch public preview data, render JoinCard.

**Files:**
- Modify: `app/join/[join_token]/page.tsx`
- Delete: `app/join/[join_token]/JoinButton.tsx` (replaced by JoinCard)

- [ ] **Step 1: Rewrite page.tsx**

Replace the entire contents of `app/join/[join_token]/page.tsx` with:

```typescript
// app/join/[join_token]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { calcEstimatedPerPerson } from '@/lib/utils/cost'
import { JoinCard } from '@/components/join/JoinCard'
import type { PlanAttendee, PlanItem, PlanPreviewData } from '@/types'

interface Props {
  params: Promise<{ join_token: string }>
}

export default async function JoinPage({ params }: Props) {
  const { join_token } = await params
  const supabase = await createClient()

  // Check if a user is logged in (optional — redirect if they're already part of this plan)
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch plan — existing RLS policy "plans: join token read" permits this for anon users
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*, organiser:profiles!organiser_id(*), attendees:plan_attendees(*), items:plan_items(*)')
    .eq('join_token', join_token)
    .single()

  if (planError || !plan || plan.deleted_at) {
    notFound()
  }

  // Authenticated organiser → send to their plan manage page
  if (user && plan.organiser_id === user.id) {
    redirect(`/plans/${plan.id}`)
  }

  // Authenticated existing attendee → send to plan view
  if (user) {
    const existing = (plan.attendees as PlanAttendee[])?.find((a) => a.user_id === user.id)
    if (existing) {
      redirect(`/plans/${plan.id}`)
    }
  }

  // Plan not active
  if (plan.status === 'closed') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold">This plan is closed</h1>
          <p className="text-muted-foreground text-sm">It&apos;s no longer accepting new members.</p>
          <Button asChild variant="outline">
            <Link href="/home">Go home</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (plan.status === 'draft') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold">This plan isn&apos;t public yet</h1>
          <p className="text-muted-foreground text-sm">The organiser hasn&apos;t published it.</p>
          <Button asChild variant="outline">
            <Link href="/home">Go home</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Build safe preview data (no full itinerary / attendee details)
  const approvedAttendees = (plan.attendees as PlanAttendee[])?.filter(
    (a) => a.status === 'approved'
  ) ?? []
  const planItems = (plan.items as PlanItem[]) ?? []
  const costPerPerson = calcEstimatedPerPerson(planItems, approvedAttendees.length)

  const previewData: PlanPreviewData = {
    id: plan.id,
    title: plan.title,
    description: plan.description ?? null,
    cover_photo: plan.cover_photo ?? null,
    start_date: plan.start_date ?? null,
    join_approval: plan.join_approval,
    organiser: {
      name: plan.organiser?.name ?? 'Organiser',
      avatar_url: plan.organiser?.avatar_url ?? null,
    },
    approved_count: approvedAttendees.length,
    cost_per_person: costPerPerson,
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-8 pb-16 px-4">
      <JoinCard plan={previewData} joinToken={join_token} />
    </div>
  )
}
```

- [ ] **Step 2: Delete the old JoinButton (no longer used)**

```bash
rm app/join/\[join_token\]/JoinButton.tsx
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Start dev server and manually test**

```bash
npm run dev
```

Open http://localhost:3000/join/[any-active-plan-token] without being logged out or in incognito.

Verify:
- Page loads without login redirect
- Plan title, cover, meta pills visible
- 🔒 locked teaser visible
- "I'm in 🎉" button present

- [ ] **Step 5: Test card flip**

Click "I'm in 🎉" — card should flip to show the form face with back arrow, name field, optional email.
Click back arrow — card flips back to preview.

- [ ] **Step 6: Commit**

```bash
git add app/join/
git commit -m "feat(join): public join page — remove auth wall, render JoinCard"
```

---

## Task 12: Test full guest join flow end-to-end

No new files — this is a verification task before touching the organiser UI.

- [ ] **Step 1: Submit a guest join in a fresh incognito window**

1. Open http://localhost:3000/join/[active-plan-token] in incognito
2. Click "I'm in 🎉"
3. Enter a test name, leave email blank
4. Click "Request to join →"
5. Card should flip back and show pending state ("You're in the queue")

- [ ] **Step 2: Verify guest_attendees row was created**

In Supabase dashboard, run:
```sql
SELECT id, name, status, guest_token FROM guest_attendees ORDER BY created_at DESC LIMIT 5;
```
Expected: a row with your test name and `status = 'pending'`

- [ ] **Step 3: Verify localStorage persistence**

In Chrome DevTools → Application → Local Storage → localhost:
Expected: key `plans_join_[token]` with `{ guest_token, name, status: "pending" }`

- [ ] **Step 4: Close and reopen the same URL**

Close the incognito tab. Reopen the same `/join/[token]` URL.
Expected: pending state appears immediately (no preview card, no form)

---

## Task 13: ManagePending — add guest attendees section

**Files:**
- Modify: `app/(app)/plans/[id]/manage/page.tsx`
- Modify: `app/(app)/plans/[id]/manage/ManageTabs.tsx`
- Modify: `app/(app)/plans/[id]/manage/ManagePending.tsx`

- [ ] **Step 1: Fetch guest_attendees in manage/page.tsx**

In `app/(app)/plans/[id]/manage/page.tsx`, add this query after the existing plan fetch (after line 26 where `plan` is confirmed):

Replace:
```typescript
  const pendingAttendees = (plan.attendees as PlanAttendee[]).filter((a) => a.status === 'pending') || []
  const approvedAttendees = (plan.attendees as PlanAttendee[]).filter((a) => a.status === 'approved') || []
```

With:
```typescript
  const pendingAttendees = (plan.attendees as PlanAttendee[]).filter((a) => a.status === 'pending') || []
  const approvedAttendees = (plan.attendees as PlanAttendee[]).filter((a) => a.status === 'approved') || []

  // Fetch guest attendees for this plan
  const { data: guestAttendees } = await supabase
    .from('guest_attendees')
    .select('*')
    .eq('plan_id', id)
    .order('created_at', { ascending: false })
```

Also add `GuestAttendee` to the import at the top:
```typescript
import type { Plan, PlanAttendee, GuestAttendee } from '@/types'
```

- [ ] **Step 2: Pass guestAttendees to ManageTabs in manage/page.tsx**

Replace the `<ManageTabs .../>` call:
```typescript
      <ManageTabs
        plan={plan as Plan}
        planId={id}
        pendingAttendees={pendingAttendees}
        approvedAttendees={approvedAttendees}
        guestAttendees={(guestAttendees ?? []) as GuestAttendee[]}
      />
```

- [ ] **Step 3: Update ManageTabs to accept and forward guestAttendees**

In `app/(app)/plans/[id]/manage/ManageTabs.tsx`, update the interface and pending tab:

Replace:
```typescript
interface ManageTabsProps {
  plan: Plan
  planId: string
  pendingAttendees: PlanAttendee[]
  approvedAttendees: PlanAttendee[]
}
```
With:
```typescript
import type { Plan, PlanAttendee, GuestAttendee } from '@/types'

interface ManageTabsProps {
  plan: Plan
  planId: string
  pendingAttendees: PlanAttendee[]
  approvedAttendees: PlanAttendee[]
  guestAttendees: GuestAttendee[]
}
```

Update the `tabs` array to include guest count in the pending badge:
```typescript
  const pendingGuestCount = guestAttendees.filter((g) => g.status === 'pending').length
  const tabs: Array<{ value: TabValue; label: string; count?: number }> = [
    { value: 'overview', label: 'Overview' },
    { value: 'pending', label: 'Pending', count: pendingAttendees.length + pendingGuestCount },
    { value: 'attendees', label: 'Attendees', count: approvedAttendees.length },
    { value: 'settings', label: 'Settings' },
  ]
```

Update the pending tab render:
```typescript
        {activeTab === 'pending' && (
          <ManagePending
            planId={planId}
            attendees={pendingAttendees}
            guestAttendees={guestAttendees}
          />
        )}
```

- [ ] **Step 4: Update ManagePending to show guest section**

Replace the entire contents of `app/(app)/plans/[id]/manage/ManagePending.tsx` with:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { Check, X, User } from 'lucide-react'
import type { PlanAttendee, GuestAttendee } from '@/types'

interface ManagePendingProps {
  planId: string
  attendees: PlanAttendee[]
  guestAttendees: GuestAttendee[]
}

export function ManagePending({ planId, attendees, guestAttendees }: ManagePendingProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleAttendee(attendeeId: string, status: 'approved' | 'rejected') {
    setLoading(true)
    try {
      const res = await fetch(`/api/plans/${planId}/attendees/${attendeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || 'Failed to update attendee')
        return
      }
      toast.success(status === 'approved' ? 'Attendee approved' : 'Attendee rejected')
      router.refresh()
    } catch {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleGuest(guestId: string, status: 'approved' | 'rejected') {
    setLoading(true)
    try {
      const res = await fetch(`/api/plans/${planId}/guest-attendees/${guestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || 'Failed to update guest')
        return
      }
      toast.success(status === 'approved' ? 'Guest approved' : 'Guest rejected')
      router.refresh()
    } catch {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const pendingGuests = guestAttendees.filter((g) => g.status === 'pending')
  const hasAnything = attendees.length > 0 || pendingGuests.length > 0

  if (!hasAnything) {
    return (
      <div className="text-center py-12">
        <p className="text-on-surface-variant">No pending requests</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Regular (authenticated) pending attendees */}
      {attendees.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Member requests ({attendees.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attendees.map((attendee) => (
              <div
                key={attendee.id}
                className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest"
              >
                <div className="flex items-center gap-3 mb-4">
                  <UserAvatar
                    url={attendee.profile?.avatar_url}
                    name={attendee.profile?.name || '?'}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-headline font-medium text-on-surface">
                      {attendee.profile?.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Requested {new Date(attendee.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 rounded-[2px] h-8"
                    onClick={() => handleAttendee(attendee.id, 'approved')}
                    disabled={loading}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-[2px] h-8"
                    onClick={() => handleAttendee(attendee.id, 'rejected')}
                    disabled={loading}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest (unauthenticated) pending requests */}
      {pendingGuests.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Guest requests ({pendingGuests.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingGuests.map((guest) => (
              <div
                key={guest.id}
                className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-headline font-medium text-on-surface">
                        {guest.name}
                      </p>
                      <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground font-medium">
                        Guest
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {guest.email
                        ? guest.email
                        : 'No email provided'} · {new Date(guest.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 rounded-[2px] h-8"
                    onClick={() => handleGuest(guest.id, 'approved')}
                    disabled={loading}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-[2px] h-8"
                    onClick={() => handleGuest(guest.id, 'rejected')}
                    disabled={loading}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/plans/
git commit -m "feat(manage): show guest attendee requests in organiser pending tab"
```

---

## Task 14: End-to-end approval test

- [ ] **Step 1: As organiser, open the manage page**

Log in as the plan organiser.  
Navigate to http://localhost:3000/plans/[id]/manage → Pending tab.

Verify: the guest test name from Task 12 appears in "Guest requests" with a "Guest" badge, email shown (or "No email provided"), and Approve/Reject buttons.

- [ ] **Step 2: Approve the guest**

Click "Approve" on the guest row.
Verify: toast "Guest approved" appears, guest row disappears from Pending tab.

- [ ] **Step 3: Return to join link as guest**

In incognito (same as Task 12), revisit http://localhost:3000/join/[token].
Verify:
- Approved state shows ("You're in! 🎉")
- Full plan: cost breakdown and attendee list load below the badge
- No login prompt at any point

- [ ] **Step 4: Test rejection flow**

Repeat Task 12 with a new incognito window and new guest name.  
Approve then reject (or just reject directly).  
Revisit the link — verify "Not this time" state shows.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: guest join flow complete — card flip, localStorage identity, organiser approve/reject"
```
