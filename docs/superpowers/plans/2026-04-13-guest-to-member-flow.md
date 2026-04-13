# Guest-to-Member Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the guest → approved guest → account holder → retained member journey so an approved WhatsApp guest can see the full plan and convert to a real account without friction.

**Architecture:** The join link stays the guest's permanent home. After approval `/join/[token]` becomes a full plan view (title, description, itinerary, cost, attendees) with a quiet conversion nudge at the bottom. The `guest_token` is threaded through `emailRedirectTo` so it survives email verification and lands in `/onboarding` for automatic linking via a new `POST /api/auth/link-guest` endpoint.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + Auth), TypeScript, Tailwind CSS, Framer Motion (`motion` package), React Hook Form + Zod, shadcn/ui

**No test framework is installed.** Verification uses `npm run build`, `npm run lint`, and manual browser checks at `http://localhost:3000`.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `SQL_CHANGELOG.md` | Document schema change |
| Modify | `app/api/join/[join_token]/full-plan/route.ts` | Add plan metadata to response |
| Create | `app/api/auth/link-guest/route.ts` | New guest-to-member linking endpoint |
| Modify | `components/join/GuestFullPlan.tsx` | Render full plan + entrance animation |
| Create | `components/join/GuestConversionBanner.tsx` | Account creation nudge |
| Modify | `components/join/JoinCard.tsx` | Update approved branch |
| Create | `app/(app)/onboarding/page.tsx` | Onboarding page (doesn't exist yet) |
| Modify | `app/(auth)/signup/page.tsx` | Thread guest params through emailRedirectTo |
| Modify | `app/(auth)/login/page.tsx` | Call link-guest after login |

---

## Task 1: Schema — add `user_id` to `guest_attendees`

**Files:**
- Modify: `SQL_CHANGELOG.md`

> Run this SQL in the Supabase Dashboard → SQL Editor.

- [ ] **Step 1: Run migration in Supabase Dashboard**

```sql
-- Add user_id to guest_attendees so converted guests are linked to their account
ALTER TABLE guest_attendees
  ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX idx_guest_attendees_user_id ON guest_attendees(user_id);
```

Expected: No errors. The `guest_attendees` table now has a nullable `user_id` column.

- [ ] **Step 2: Add entry to SQL_CHANGELOG.md**

Append to the bottom of `SQL_CHANGELOG.md`:

```markdown
## 2026-04-13 — Guest-to-member conversion: user_id column

### Purpose
Allow converted guest records to be linked to the authenticated user account created during conversion. Used for audit trail and idempotency checks in the link-guest API.

### SQL

```sql
ALTER TABLE guest_attendees
  ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX idx_guest_attendees_user_id ON guest_attendees(user_id);
```

### Notes
- Column is nullable — most guests never convert to a full account.
- When a guest converts, `guest_attendees.user_id` is set to `auth.uid()` AND a new `plan_attendees` row is created. The guest row is kept as audit trail.
- Index added for quick lookup of "has this user already converted a guest record?"
```

- [ ] **Step 3: Update TypeScript type in `types/index.ts`**

In `types/index.ts`, find the `GuestAttendee` type and add the `user_id` field:

```typescript
export type GuestAttendee = {
  id: string
  plan_id: string
  guest_token: string
  name: string
  email: string | null
  status: 'pending' | 'approved' | 'rejected'
  joined_via: string
  created_at: string
  user_id: string | null   // ← add this line
}
```

- [ ] **Step 4: Lint check**

```bash
cd /Users/abhayp/Downloads/Projects/plans && npm run lint
```

Expected: No new errors.

- [ ] **Step 5: Commit**

```bash
git add SQL_CHANGELOG.md types/index.ts
git commit -m "feat(schema): add user_id column to guest_attendees for conversion tracking"
```

---

## Task 2: Extend `/api/join/[join_token]/full-plan` to return plan metadata

**Files:**
- Modify: `app/api/join/[join_token]/full-plan/route.ts`

The current endpoint returns `{ items, attendees }`. We need it to also return `title`, `description`, `start_date`, and `itinerary` from the `plans` row (already fetched).

- [ ] **Step 1: Update the route**

Replace the full contents of `app/api/join/[join_token]/full-plan/route.ts`:

```typescript
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
    .select('id, title, description, start_date, itinerary')
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
    data: {
      title: plan.title,
      description: plan.description,
      start_date: plan.start_date,
      itinerary: plan.itinerary,
      items: items ?? [],
      attendees: attendees ?? [],
    },
    error: null,
  })
}
```

- [ ] **Step 2: Build check**

```bash
cd /Users/abhayp/Downloads/Projects/plans && npm run build 2>&1 | tail -20
```

Expected: Build succeeds (or only pre-existing errors, none in this file).

- [ ] **Step 3: Commit**

```bash
git add app/api/join/\[join_token\]/full-plan/route.ts
git commit -m "feat(api): include plan metadata in full-plan endpoint response"
```

---

## Task 3: Create `POST /api/auth/link-guest` endpoint

**Files:**
- Create: `app/api/auth/link-guest/route.ts`

This endpoint links an approved guest record to a newly authenticated user by creating a `plan_attendees` row and stamping `guest_attendees.user_id`.

- [ ] **Step 1: Create the route file**

Create `app/api/auth/link-guest/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  guest_token: z.string().uuid(),
  plan_id: z.string().uuid(),
})

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: 'Invalid request' }, { status: 400 })
  }

  const { guest_token, plan_id } = parsed.data

  // Verify the guest record exists, matches the plan, and is approved
  const { data: guest } = await supabase
    .from('guest_attendees')
    .select('id, status')
    .eq('guest_token', guest_token)
    .eq('plan_id', plan_id)
    .single()

  if (!guest) {
    return NextResponse.json({ data: null, error: 'Guest record not found' }, { status: 404 })
  }

  if (guest.status !== 'approved') {
    return NextResponse.json({ data: null, error: 'Guest is not approved' }, { status: 403 })
  }

  // Idempotency: if plan_attendees row already exists for this user, return success
  const { data: existing } = await supabase
    .from('plan_attendees')
    .select('id')
    .eq('plan_id', plan_id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    // Create the plan_attendees row — pre-approved since they were approved as a guest
    const { error: insertError } = await supabase.from('plan_attendees').insert({
      plan_id,
      user_id: user.id,
      role: 'attendee',
      status: 'approved',
      joined_via: 'invite_link',
    })

    if (insertError) {
      return NextResponse.json({ data: null, error: 'Failed to create attendee record' }, { status: 500 })
    }
  }

  // Stamp the guest record with the user_id for audit trail (best-effort, non-fatal)
  await supabase
    .from('guest_attendees')
    .update({ user_id: user.id })
    .eq('id', guest.id)

  return NextResponse.json({ data: { plan_id }, error: null })
}
```

- [ ] **Step 2: Build check**

```bash
cd /Users/abhayp/Downloads/Projects/plans && npm run build 2>&1 | tail -20
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/link-guest/route.ts
git commit -m "feat(api): add link-guest endpoint to convert approved guests to members"
```

---

## Task 4: Update `GuestFullPlan.tsx` to render full plan view

**Files:**
- Modify: `components/join/GuestFullPlan.tsx`

The component receives new fields from the API (title, description, start_date, itinerary). Render them above cost/attendees. Add a `motion` fade-in entrance.

- [ ] **Step 1: Replace the full component**

Replace the full contents of `components/join/GuestFullPlan.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Loader2, CalendarDays } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { calcEstimatedPerPerson } from '@/lib/utils/cost'
import { formatDate } from '@/lib/utils/format'
import type { PlanItem, PlanAttendee } from '@/types'

interface FullPlanData {
  title: string
  description: string
  start_date: string | null
  itinerary: string
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Plan header */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">{data.title}</h2>
        {data.start_date && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span>{formatDate(data.start_date)}</span>
          </div>
        )}
        {data.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{data.description}</p>
        )}
      </div>

      {/* Itinerary */}
      {data.itinerary && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Itinerary
            </p>
          </div>
          <div className="px-4 py-4">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {data.itinerary}
            </p>
          </div>
        </div>
      )}

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

      {/* Who's coming */}
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
    </motion.div>
  )
}
```

> **Note on `formatDate`:** This utility already exists in `lib/utils/format.ts`. If it accepts a date string and returns a human-readable string, use it as-is. If it doesn't exist with that signature, replace `formatDate(data.start_date)` with `new Date(data.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })`.

- [ ] **Step 2: Build check**

```bash
cd /Users/abhayp/Downloads/Projects/plans && npm run build 2>&1 | tail -20
```

If `formatDate` import fails, check `lib/utils/format.ts` for the correct function name and update the import/usage accordingly.

- [ ] **Step 3: Commit**

```bash
git add components/join/GuestFullPlan.tsx
git commit -m "feat(join): show full plan details (title, date, itinerary, costs, attendees) in approved guest view"
```

---

## Task 5: Create `GuestConversionBanner.tsx`

**Files:**
- Create: `components/join/GuestConversionBanner.tsx`

A quiet, restrained card that nudges the approved guest to create an account. Tone: calm and confident, not urgent.

- [ ] **Step 1: Create the component**

Create `components/join/GuestConversionBanner.tsx`:

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface Props {
  guestToken: string
  planId: string
}

export function GuestConversionBanner({ guestToken, planId }: Props) {
  const signupUrl = `/signup?guest_token=${guestToken}&plan_id=${planId}`
  const loginUrl = `/login?guest_token=${guestToken}&plan_id=${planId}`

  return (
    <div className="border border-border rounded-xl px-5 py-5 space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Keep this plan with you</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          See your joined plans anytime, stay synced with updates, and get notified when things change.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button
          asChild
          className="flex-1 uppercase tracking-[0.15em] py-3 px-4 rounded-[2px] bg-on-surface text-surface hover:bg-on-surface/90 transition-colors font-medium text-xs flex items-center justify-center gap-2"
        >
          <Link href={signupUrl}>
            Create account
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Link
          href={loginUrl}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 whitespace-nowrap"
        >
          Log in →
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
cd /Users/abhayp/Downloads/Projects/plans && npm run build 2>&1 | tail -20
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/join/GuestConversionBanner.tsx
git commit -m "feat(join): add GuestConversionBanner component for account creation nudge"
```

---

## Task 6: Update `JoinCard.tsx` approved branch

**Files:**
- Modify: `components/join/JoinCard.tsx`

Wire up the new components in the approved state: pass `plan` into `GuestFullPlan`, pass `planId` into `GuestConversionBanner`. The `plan` prop already contains `id` via `PlanPreviewData`.

- [ ] **Step 1: Check `PlanPreviewData` has `id`**

Open `types/index.ts` and confirm `PlanPreviewData` includes `id: string`. It should — it's the plan UUID used to build the full-plan API URL. If it's missing, add it.

- [ ] **Step 2: Update imports in `JoinCard.tsx`**

At the top of `components/join/JoinCard.tsx`, add the `GuestConversionBanner` import:

```typescript
import { GuestConversionBanner } from './GuestConversionBanner'
```

The existing imports of `JoinStatusCard` and `GuestFullPlan` stay as-is.

- [ ] **Step 3: Update the approved branch (lines 97–104)**

Replace the approved state return block:

```typescript
  if (state === 'approved' && guestToken) {
    return (
      <div className="w-full max-w-[420px] mx-auto space-y-6">
        <JoinStatusCard state="approved" guestName={guestName} />
        <GuestFullPlan joinToken={joinToken} guestToken={guestToken} />
        <GuestConversionBanner guestToken={guestToken} planId={plan.id} />
      </div>
    )
  }
```

- [ ] **Step 4: Build check**

```bash
cd /Users/abhayp/Downloads/Projects/plans && npm run build 2>&1 | tail -20
```

Expected: Build succeeds.

- [ ] **Step 5: Lint**

```bash
cd /Users/abhayp/Downloads/Projects/plans && npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add components/join/JoinCard.tsx
git commit -m "feat(join): wire full plan view and conversion banner into approved guest state"
```

---

## Task 7: Create `app/(app)/onboarding/page.tsx`

**Files:**
- Create: `app/(app)/onboarding/page.tsx`

The middleware already handles the onboarding gate (no profile → redirect to `/onboarding`, has profile → redirect away). This page needs to:
1. Show a profile setup form (name required, everything else optional)
2. On submit: POST to `/api/profile`, then if guest params present, call `POST /api/auth/link-guest`
3. Redirect to `/plans/[id]` (guest flow) or `/home` (normal flow)

> **Reference:** The profile form component lives at `components/profile/ProfileForm.tsx`. The `/api/profile` endpoint accepts the same shape as `ProfileFormValues` from `lib/validations/profile.ts`. Study `app/(app)/profile/edit/ProfileEditClient.tsx` for the submission pattern.

- [ ] **Step 1: Create the page**

Create `app/(app)/onboarding/page.tsx`:

```typescript
'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'
import type { ProfileFormValues } from '@/lib/validations/profile'

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  )
}

function OnboardingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const guestToken = searchParams.get('guest_token')
  const planId = searchParams.get('plan_id')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: ProfileFormValues) {
    setError(null)

    // 1. Create the profile
    const profileRes = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const profileJson = await profileRes.json()
    if (profileJson.error) {
      setError(profileJson.error)
      return
    }

    // 2. If coming from a guest join, link the guest record
    if (guestToken && planId) {
      const linkRes = await fetch('/api/auth/link-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_token: guestToken, plan_id: planId }),
      })
      const linkJson = await linkRes.json()
      if (linkJson.data?.plan_id) {
        router.push(`/plans/${linkJson.data.plan_id}`)
        router.refresh()
        return
      }
      // If linking fails, fall through to /home — don't block onboarding
    }

    router.push('/home')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-[420px] space-y-8">
        <div className="space-y-2">
          <h1 className="font-headline text-3xl font-bold tracking-tighter text-on-surface">
            Set up your profile
          </h1>
          <p className="text-sm text-on-surface-variant">
            Tell people a little about yourself.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-[2px] px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <ProfileForm
          onSubmit={handleSubmit}
          submitLabel="Continue"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Check `ProfileForm` accepts `onSubmit` without `defaultValues`**

Open `components/profile/ProfileForm.tsx` and confirm `defaultValues` is optional (it should be — the form component should work without pre-existing data for new users).

If `defaultValues` is required in the `Props` type, update it to `defaultValues?: Partial<ProfileFormValues>`.

- [ ] **Step 3: Check `/api/profile` route exists and accepts POST**

Run:
```bash
ls /Users/abhayp/Downloads/Projects/plans/app/api/profile/
```

Expected: A `route.ts` file. Confirm it handles `POST` and accepts `ProfileFormValues`. No changes needed if it already works.

- [ ] **Step 4: Build check**

```bash
cd /Users/abhayp/Downloads/Projects/plans && npm run build 2>&1 | tail -20
```

If `ProfileForm` `defaultValues` is required and can't be made optional without breaking the edit page, use this pattern instead:

```typescript
const emptyProfile = { name: '', bio: null, date_of_birth: null, gender: null, instagram: null, linkedin: null, twitter_x: null, avatar_url: null, photos: [] }
// Then: <ProfileForm defaultValues={emptyProfile} onSubmit={handleSubmit} submitLabel="Continue" />
```

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/onboarding/page.tsx
git commit -m "feat(onboarding): add onboarding page with guest-linking support"
```

---

## Task 8: Update signup page to thread guest params

**Files:**
- Modify: `app/(auth)/signup/page.tsx`

When the signup page receives `?guest_token=X&plan_id=Y`, it must pass them through `emailRedirectTo` so they survive email verification and land in `/onboarding`.

- [ ] **Step 1: Add `useSearchParams` to `SignupForm`**

The `SignupForm` component already uses `Suspense` and can access `useSearchParams`. The function is already a client component. Add params reading and update the `onSubmit` handler.

In `app/(auth)/signup/page.tsx`, inside `SignupForm`, add after the existing state declarations:

```typescript
  const searchParams = useSearchParams()
  const guestToken = searchParams.get('guest_token')
  const planId = searchParams.get('plan_id')
```

- [ ] **Step 2: Update `emailRedirectTo` in the submit handler**

Find the `supabase.auth.signUp()` call. Replace the `emailRedirectTo` option:

```typescript
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: guestToken && planId
          ? `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?guest_token=${guestToken}&plan_id=${planId}`
          : `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
      },
    })
```

- [ ] **Step 3: Build check**

```bash
cd /Users/abhayp/Downloads/Projects/plans && npm run build 2>&1 | tail -20
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/\(auth\)/signup/page.tsx
git commit -m "feat(signup): thread guest_token and plan_id through email verification flow"
```

---

## Task 9: Update login page to call link-guest after login

**Files:**
- Modify: `app/(auth)/login/page.tsx`

When login page has `?guest_token=X&plan_id=Y`, call `POST /api/auth/link-guest` after successful login and redirect to `/plans/[id]`.

The login page already reads `?redirect` from search params and uses `router.push(redirect)`. We need to intercept this when guest params are present.

- [ ] **Step 1: Read guest params in `LoginForm`**

In `app/(auth)/login/page.tsx`, inside `LoginForm`, add after the existing `redirect` line:

```typescript
  const guestToken = searchParams.get('guest_token')
  const planId = searchParams.get('plan_id')
```

- [ ] **Step 2: Update the `onSubmit` handler**

Replace the existing `onSubmit` function body with:

```typescript
  async function onSubmit(values: FormValues) {
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) {
      setError(error.message)
      return
    }

    // If coming from an approved guest join, link the record and go to the plan
    if (guestToken && planId) {
      try {
        const res = await fetch('/api/auth/link-guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guest_token: guestToken, plan_id: planId }),
        })
        const json = await res.json()
        if (json.data?.plan_id) {
          router.push(`/plans/${json.data.plan_id}`)
          router.refresh()
          return
        }
      } catch {
        // Non-fatal — fall through to normal redirect
      }
      // Fallback: go to plan page directly even if link-guest failed
      router.push(`/plans/${planId}`)
      router.refresh()
      return
    }

    router.push(redirect)
    router.refresh()
  }
```

- [ ] **Step 3: Build check**

```bash
cd /Users/abhayp/Downloads/Projects/plans && npm run build 2>&1 | tail -20
```

Expected: Build succeeds.

- [ ] **Step 4: Lint**

```bash
cd /Users/abhayp/Downloads/Projects/plans && npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add app/\(auth\)/login/page.tsx
git commit -m "feat(login): link guest record and redirect to plan after login with guest params"
```

---

## Task 10: End-to-end verification

Run the dev server and verify each scenario manually.

- [ ] **Step 1: Start dev server**

```bash
cd /Users/abhayp/Downloads/Projects/plans && npm run dev
```

- [ ] **Step 2: Verify approved guest sees full plan**

1. Open an existing plan's join link: `http://localhost:3000/join/<join_token>`
2. Submit a name (new guest or use an already-approved guest token from localStorage dev tools)
3. In the Supabase Dashboard, update the guest's status to `approved`
4. Refresh the join page
5. Expected: See title, date, description, itinerary, cost breakdown, attendees — then the conversion banner at the bottom

- [ ] **Step 3: Verify new account conversion flow**

1. From the approved state, click "Create account"
2. Expected URL: `/signup?guest_token=X&plan_id=Y`
3. Sign up with a new email
4. Check email and click verification link
5. Expected: Land on `/onboarding?guest_token=X&plan_id=Y`
6. Fill in name, submit
7. Expected: Land on `/plans/<plan_id>` as a member
8. In Supabase Dashboard: confirm `plan_attendees` row exists with `status=approved`, confirm `guest_attendees.user_id` is set

- [ ] **Step 4: Verify existing account login flow**

1. From the approved state (in a different browser/incognito), click "Log in →"
2. Expected URL: `/login?guest_token=X&plan_id=Y`
3. Log in with an existing account that is NOT already an attendee
4. Expected: Land on `/plans/<plan_id>`
5. In Supabase: confirm `plan_attendees` row created

- [ ] **Step 5: Verify idempotency**

1. Run the login flow again with the same guest_token + plan_id (already linked)
2. Expected: Still lands on `/plans/<plan_id>` — no error, no duplicate row

- [ ] **Step 6: Verify onboarding gate still works for normal signup**

1. Sign up without guest params: `http://localhost:3000/signup`
2. Verify email
3. Expected: Land on `/onboarding` (no params), complete profile, redirect to `/home`

- [ ] **Step 7: Final build**

```bash
cd /Users/abhayp/Downloads/Projects/plans && npm run build
```

Expected: Clean build, no TypeScript errors.
