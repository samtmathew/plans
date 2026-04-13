# Card System Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the home page card grid into an organic masonry collage with a shift-reveal hover interaction, using the existing white minimal aesthetic and Space Grotesk + Inter typography.

**Architecture:** PlanCard is rewritten as a pure CSS animated component — no new JS libraries. Rotation is computed deterministically from `plan.id` inside PlanCard itself and applied via a CSS variable + a custom `.plan-card-rot` class. The shift-reveal panel is CSS-only (`max-height` + `group-hover:`). Home page masonry grid spacing is tightened to 16px. JoinCardPreviewFace and JoinStatusCard get a single shadow token added.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS v3 (JIT, arbitrary values), `cn()` from `@/lib/utils`, existing `calcEstimatedPerPerson` + `formatCurrency` helpers.

---

## Files

| Action | File |
|---|---|
| Modify | `app/globals.css` |
| Modify | `components/plan/PlanCard.tsx` |
| Modify | `app/(app)/home/page.tsx` |
| Modify | `components/join/JoinCardPreviewFace.tsx` |
| Modify | `components/join/JoinStatusCard.tsx` |

---

### Task 1: Add shadow CSS variables and card rotation class to globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add shadow variables to `:root` and `.dark`**

In `app/globals.css`, inside the `:root` block (after `--radius: 0.75rem;`), add:

```css
--shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03);
--shadow-card-hover: 0 20px 60px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.05);
```

Inside the `.dark` block (after `--radius: 0.75rem;`), add:

```css
--shadow-card: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
--shadow-card-hover: 0 20px 60px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25);
```

- [ ] **Step 2: Add the `.plan-card-rot` component class**

In `app/globals.css`, inside `@layer components { }` (after the existing `.masonry-item` rule), add:

```css
/* Organic card rotation — reads --card-rot CSS var set by PlanCard */
.plan-card-rot {
  transform: rotate(var(--card-rot, 0deg));
  transition: transform 450ms cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 450ms cubic-bezier(0.22, 1, 0.36, 1);
}
.plan-card-rot:hover {
  transform: rotate(0deg) translateY(-8px);
}
```

- [ ] **Step 3: Verify the build compiles**

```bash
cd /Users/sammathew/Documents/Projects/plans && npm run build 2>&1 | tail -20
```

Expected: build succeeds (exit 0), no CSS errors.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(cards): add shadow tokens and card rotation CSS class"
```

---

### Task 2: Rewrite PlanCard with shift-reveal interaction

**Files:**
- Modify: `components/plan/PlanCard.tsx`

- [ ] **Step 1: Replace the entire file with the new implementation**

```tsx
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { UserAvatar } from '@/components/common/Avatar'
import { calcEstimatedPerPerson } from '@/lib/utils/cost'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Plan } from '@/types'

interface PlanCardProps {
  plan: Plan
}

/** Deterministic rotation from plan ID. Range: -1.5° to +1.5°. */
function getCardRotation(id: string): number {
  const hash = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return ((hash % 100) / 100 - 0.5) * 3
}

function formatDateRange(start: string | null, end?: string | null): string {
  if (!start) return ''
  const s = new Date(start + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  if (!end) return s
  const e = new Date(end + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${s} – ${e}`
}

function AvatarStack({ plan }: { plan: Plan }) {
  const approved = plan.attendees?.filter((a) => a.status === 'approved') ?? []
  const maxVisible = 5
  const visible = approved.slice(0, maxVisible)
  const hiddenCount = Math.max(0, approved.length - maxVisible)

  if (approved.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 pb-3">
      <div className="flex">
        {visible.map((attendee, idx) => (
          <div
            key={attendee.id}
            className="relative"
            style={{ marginLeft: idx === 0 ? 0 : -5, zIndex: visible.length - idx }}
          >
            <UserAvatar
              url={attendee.profile?.avatar_url}
              name={attendee.profile?.name ?? 'Unknown'}
              size="sm"
              className="ring-1 ring-white border border-white"
            />
          </div>
        ))}
        {hiddenCount > 0 && (
          <div
            className="h-5 w-5 rounded-full bg-surface-container flex items-center justify-center text-[8px] font-semibold text-on-surface-variant ring-1 ring-white border border-white"
            style={{ marginLeft: -5 }}
          >
            +{hiddenCount}
          </div>
        )}
      </div>
      <span className="text-[11px] text-on-surface-variant">
        {approved.length} attending
      </span>
    </div>
  )
}

export function PlanCard({ plan }: PlanCardProps) {
  const approvedCount = plan.attendees?.filter((a) => a.status === 'approved').length ?? 0
  const costPerPerson = calcEstimatedPerPerson(plan.items ?? [], approvedCount)
  const totalCost = costPerPerson * approvedCount
  const dateRange = formatDateRange(plan.start_date, plan.end_date)
  const rotation = getCardRotation(plan.id)

  const badgeClass =
    plan.status === 'active'
      ? 'bg-green-500/30 border-green-400/40'
      : 'bg-white/15 border-white/20'

  return (
    <Link href={`/plans/${plan.id}`} className="block">
      <div
        className={cn(
          'group plan-card-rot',
          'rounded-xl border border-border bg-card overflow-hidden',
          'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]',
          'relative'
        )}
        style={{ '--card-rot': `${rotation}deg` } as React.CSSProperties}
      >
        {/* Cover */}
        <div className="relative h-36 w-full overflow-hidden bg-surface-container shrink-0">
          {plan.cover_photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={plan.cover_photo}
              alt={plan.title}
              className="w-full h-full object-cover transition-[filter] duration-300 [filter:grayscale(15%)] group-hover:[filter:grayscale(0%)]"
            />
          ) : (
            <div className="w-full h-full bg-surface-container" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Status badge — slides up on hover */}
          <div className="absolute bottom-2.5 right-3 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-[opacity,transform] duration-300 delay-75">
            <span
              className={cn(
                'backdrop-blur-sm border text-white text-[9px] font-semibold uppercase tracking-[0.8px] rounded-full px-2 py-0.5',
                badgeClass
              )}
            >
              {plan.status}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 pb-0 space-y-2">
          <h3 className="font-headline text-sm font-semibold leading-snug -tracking-[0.02em] line-clamp-2 text-on-surface">
            {plan.title}
          </h3>
          {dateRange && (
            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
              <CalendarDays className="h-3 w-3 shrink-0" />
              <span>{dateRange}</span>
            </div>
          )}
          <AvatarStack plan={plan} />
        </div>

        {/* Shift-reveal cost panel */}
        {costPerPerson > 0 && (
          <div
            className={cn(
              'max-h-0 overflow-hidden border-t border-transparent',
              'transition-[max-height,border-color] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
              'group-hover:max-h-[80px] group-hover:border-border'
            )}
          >
            <div
              className={cn(
                'px-3 py-2.5 flex flex-col gap-1.5',
                'opacity-0 translate-y-1.5',
                'transition-[opacity,transform] duration-300 delay-100',
                'group-hover:opacity-100 group-hover:translate-y-0'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] text-on-surface-variant">Total cost</span>
                <span className="font-headline text-xs font-semibold -tracking-[0.02em] text-on-surface">
                  {formatCurrency(totalCost)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] text-on-surface-variant">Per person</span>
                <span className="font-headline text-xs font-semibold -tracking-[0.02em] text-on-surface">
                  {formatCurrency(costPerPerson)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd /Users/sammathew/Documents/Projects/plans && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/plan/PlanCard.tsx
git commit -m "feat(cards): rewrite PlanCard with shift-reveal hover and organic rotation"
```

---

### Task 3: Update home page masonry grid

**Files:**
- Modify: `app/(app)/home/page.tsx`

The only changes needed: tighten column gap from `gap-8` to `gap-4`, and card spacing from `mb-8` to `mb-4`. PlanCard now handles its own rotation internally, so no wrapper changes are needed.

- [ ] **Step 1: Update the masonry grid classes**

In `app/(app)/home/page.tsx`, find the masonry wrapper div (line 73):

```tsx
<div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 mb-32">
  {uniquePlans.map((plan) => (
    <div key={plan.id} className="break-inside-avoid mb-8">
      <PlanCard plan={plan} />
    </div>
  ))}
</div>
```

Replace with:

```tsx
<div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 mb-32">
  {uniquePlans.map((plan) => (
    <div key={plan.id} className="break-inside-avoid mb-4">
      <PlanCard plan={plan} />
    </div>
  ))}
</div>
```

Changes: `gap-8 → gap-4`, `mb-8 → mb-4`, `md:columns-2 → sm:columns-2` (shows 2 columns slightly earlier on tablet).

- [ ] **Step 2: Verify the build**

```bash
cd /Users/sammathew/Documents/Projects/plans && npm run build 2>&1 | tail -20
```

Expected: build succeeds, no errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/home/page.tsx
git commit -m "feat(home): tighten masonry grid spacing for organic collage layout"
```

---

### Task 4: Add shadow token to JoinCardPreviewFace and JoinStatusCard

**Files:**
- Modify: `components/join/JoinCardPreviewFace.tsx`
- Modify: `components/join/JoinStatusCard.tsx`

- [ ] **Step 1: Add shadow to JoinCardPreviewFace**

In `components/join/JoinCardPreviewFace.tsx`, find the root div (line 23):

```tsx
<div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden">
```

Replace with:

```tsx
<div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden shadow-[var(--shadow-card)]">
```

- [ ] **Step 2: Add shadow to JoinStatusCard**

In `components/join/JoinStatusCard.tsx`, find the root div (line 51):

```tsx
<div className={`rounded-xl border p-5 space-y-4 ${c.bgClass}`}>
```

Replace with:

```tsx
<div className={`rounded-xl border p-5 space-y-4 shadow-[var(--shadow-card)] ${c.bgClass}`}>
```

- [ ] **Step 3: Verify TypeScript and build**

```bash
cd /Users/sammathew/Documents/Projects/plans && npx tsc --noEmit 2>&1 | head -20 && npm run build 2>&1 | tail -10
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add components/join/JoinCardPreviewFace.tsx components/join/JoinStatusCard.tsx
git commit -m "feat(cards): apply shadow token to join card surfaces"
```

---

### Task 5: Visual verification

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/sammathew/Documents/Projects/plans && npm run dev
```

- [ ] **Step 2: Check the home page**

Open http://localhost:3000/home

Verify:
- Cards render in a masonry grid with subtle per-card rotations (each card slightly tilted differently)
- Hovering a card: it straightens and lifts upward
- Gradient fades in over the cover image
- Status badge (Active/Draft/Closed) fades in on the cover
- Cost panel slides up from the bottom of the card
- Cards without a cover photo show a grey placeholder and still rotate/animate correctly
- Cards without cost items have no reveal panel

- [ ] **Step 3: Check the join page**

Open http://localhost:3000/join/[any-valid-token]

Verify:
- JoinCard preview face has a subtle shadow consistent with PlanCards
- The 3D flip animation still works when clicking "I'm in"

- [ ] **Step 4: Check dark mode**

Toggle dark mode (add `dark` class to `<html>` via browser devtools or the app's theme toggle if present).

Verify:
- Cards render correctly with appropriate dark shadows
- Shadow-hover on dark cards shows stronger shadow, not a halo

- [ ] **Step 5: Final commit if everything looks good**

```bash
git add -p  # review any unstaged changes
git commit -m "feat(cards): complete card system redesign — organic masonry + shift-reveal"
```
