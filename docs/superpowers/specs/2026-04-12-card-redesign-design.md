# Card System Redesign — Design Spec

**Date:** 2026-04-12  
**Status:** Approved  

---

## Context

The current `PlanCard` uses a straight CSS masonry grid with a simple scale hover. The design is functional but feels generic — static, sterile, and unmemorable. The goal is to make the home page feel like a living collage of trips: organic, handcrafted, and expressive without sacrificing legibility or the existing white minimal aesthetic.

**Outcome:** An organic masonry layout where each plan card sits at a subtle angle, straightens and lifts on hover, and reveals cost details via a shift-up animation. Typography and colour palette remain unchanged (Space Grotesk + Inter, white).

---

## Scope

| Component | Change |
|---|---|
| `components/plan/PlanCard.tsx` | Full redesign — shift-reveal interaction, cover overlay, new card anatomy |
| `app/(app)/home/page.tsx` | Organic masonry wrapper — deterministic rotation per card |
| `components/join/JoinCard.tsx` | Light surface refinement to match white minimal aesthetic |
| `components/join/JoinStatusCard.tsx` | Light refinement — match card border/shadow tokens |
| `app/globals.css` | No typography changes. Add `--shadow-card` and `--shadow-card-hover` CSS variables |

---

## Design Decisions

### Typography
**Unchanged.** Space Grotesk for card titles and cost values (font-headline). Inter for dates, labels, attendee count (font-sans). No new fonts introduced.

### Colour palette
**Unchanged.** Pure `#ffffff` card surface on `#ffffff` background. Depth comes exclusively from `box-shadow` + `1px border`. No background tints.

Status badge colours:
- `active` → `bg-green-100 text-green-800` (keep existing)
- `draft` / `closed` → `bg-surface-container text-on-surface-variant` (keep existing)

---

## Organic Masonry Layout

**File:** `app/(app)/home/page.tsx`

Replace the current `columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8` wrapper.

### Rotation system
Each card gets a deterministic rotation derived from its plan ID — so rotation is stable across re-renders and page refreshes, with no layout shift.

```ts
// Deterministic rotation from plan ID string
function getCardRotation(id: string): number {
  const hash = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const normalised = (hash % 100) / 100  // 0–1
  return (normalised - 0.5) * 3          // range: -1.5° to +1.5°
}
```

Apply as an inline `style={{ '--card-rot': `${getCardRotation(plan.id)}deg` }}` on each `.card-wrap` div. The CSS reads `transform: rotate(var(--card-rot))`.

### Grid
```
columns-1 sm:columns-2 lg:columns-3 xl:columns-4
column-gap: 16px
card margin-bottom: 16px
break-inside: avoid on each card-wrap
```

---

## PlanCard Redesign

**File:** `components/plan/PlanCard.tsx`

### Anatomy (top to bottom)
```
┌─────────────────────────────┐
│  Cover image / placeholder  │  ← variable height (h-36 default)
│  [gradient overlay]         │  ← fades in on hover
│  [location · status badge]  │  ← slides up on hover
├─────────────────────────────┤
│  Card title (Space Grotesk) │
│  Date row (Inter, CalendarDays icon) │
│  Avatar stack + count       │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
│  [REVEAL PANEL — on hover]  │
│  Total cost · Per person    │
└─────────────────────────────┘
```

### CSS classes on the root card element
```
rounded-xl border border-border bg-card overflow-hidden
shadow-[var(--shadow-card)]
transition-[transform,box-shadow] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)]
transform rotate-[var(--card-rot)]          ← resting state
hover:rotate-0 hover:-translate-y-2         ← hover state
hover:shadow-[var(--shadow-card-hover)]
```

The `--card-rot` CSS variable is set on the parent `.card-wrap` via inline style and inherited.

### Cover image behaviour
- Resting: `grayscale(15%) saturate(0.9)` via Tailwind `grayscale` filter + custom saturation
- Hover: `grayscale(0%) saturate(1)` — transitions over 400ms
- If no `cover_photo`: show a `bg-surface-container` placeholder div at same height

### Cover overlay (appears on hover)
Two layers positioned absolutely over the cover:
1. **Gradient**: `linear-gradient(to top, rgba(0,0,0,0.5), transparent)` — full width, bottom 60% of cover — `opacity-0 group-hover:opacity-100`
2. **Status badge only**: positioned `bottom-2.5 right-3` — `opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0`

> **Note:** `plan.location` does not exist on the `Plan` type — do not add it. The cover overlay shows only the status badge on hover. No location text.

Status badge: frosted pill — `backdrop-blur-sm bg-white/15 border border-white/20 text-white text-[9px] font-semibold uppercase tracking-[0.8px] rounded-full px-2 py-0.5`  
Active variant: `bg-green-500/30 border-green-400/40`

Add `group` class to the root card div so all child `group-hover:` utilities work.

### Body (always visible)
```tsx
<div className="p-3 pb-0 space-y-2.5">
  <h3 className="font-headline text-sm font-semibold leading-snug -tracking-[0.02em] line-clamp-2">
    {plan.title}
  </h3>
  <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
    <CalendarDays className="h-3 w-3 shrink-0" />
    <span>{formattedDateRange}</span>
  </div>
  <AvatarStack plan={plan} />  {/* existing component, keep as-is */}
</div>
```

### Shift-reveal panel
Hidden by default, slides up on hover using `max-height` transition (CSS-only, no JS required, no motion/react needed for this part).

**Cost derivation:**
```ts
const approvedCount = plan.attendees?.filter((a) => a.status === 'approved').length ?? 0
const costPerPerson = calcEstimatedPerPerson(plan.items ?? [], approvedCount)
const totalCost = costPerPerson * approvedCount  // derive total from per-person × count
```

```tsx
<div className="
  max-h-0 overflow-hidden border-t border-transparent
  transition-[max-height,border-color] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)]
  group-hover:max-h-[80px] group-hover:border-border
">
  <div className="
    px-3 py-2.5 flex flex-col gap-1.5
    opacity-0 translate-y-1.5
    transition-[opacity,transform] duration-300 delay-100
    group-hover:opacity-100 group-hover:translate-y-0
  ">
    <div className="flex justify-between items-center">
      <span className="text-[10.5px] text-on-surface-variant">Total cost</span>
      <span className="font-headline text-xs font-semibold -tracking-[0.02em]">
        {formatCurrency(totalCost)}
      </span>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-[10.5px] text-on-surface-variant">Per person</span>
      <span className="font-headline text-xs font-semibold -tracking-[0.02em]">
        {formatCurrency(costPerPerson)}
      </span>
    </div>
  </div>
</div>
```

Only render the reveal panel if `costPerPerson > 0`.

---

## CSS Variables to Add

In `app/globals.css` `:root`:
```css
--shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03);
--shadow-card-hover: 0 20px 60px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.05);
```

Dark mode variants in `.dark`:
```css
--shadow-card: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
--shadow-card-hover: 0 20px 60px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25);
```

---

## JoinCard & JoinStatusCard — Light Refinement

**File:** `components/join/JoinCard.tsx`, `components/join/JoinStatusCard.tsx`

No structural changes. Update only:
- Border: `border-border` (uses `--border` token, consistent with PlanCard)
- Border radius: `rounded-xl` (up from `rounded-lg`)
- Shadow: `shadow-[var(--shadow-card)]` on the card container

The 3D flip animation in JoinCard is preserved exactly as-is.

---

## Implementation Notes

- **No new dependencies.** The shift-reveal is pure CSS via `max-height` + `group-hover`. `motion/react` is not needed for this feature.
- **No `@cardcn` or `@cult-ui` install required.** The interaction is implemented from scratch, inspired by cult-ui's shift-card pattern.
- **`plan.location`** — check the `Plan` type in `types/index.ts`. If the field doesn't exist yet on the type, read the DB schema before adding it; do not add a column, just check if it's already selected.
- The `AvatarStack` subcomponent inside `PlanCard.tsx` is kept intact — no changes to avatar rendering logic.
- The `calcEstimatedPerPerson` and `formatCurrency` helpers are reused unchanged.

---

## Verification

1. Run `npm run dev`
2. Navigate to `/home` — confirm masonry grid renders with subtle per-card rotations
3. Hover a card — confirm: straightens + lifts, gradient fades in, location/status appear, cost panel slides up
4. Confirm no rotation on the cover image inside the card (only the card wrapper rotates)
5. Confirm cards without `cover_photo` show placeholder and still animate correctly
6. Navigate to `/join/[token]` — confirm JoinCard border/radius is consistent
7. Check dark mode — confirm shadow variables render correctly
