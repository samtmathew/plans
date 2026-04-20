# Plans — Landing Page & Auth Redesign Spec

**Date:** 2026-04-20  
**Scope:** Landing page (`/`), Login (`/login`), Sign up (`/signup`)  
**Status:** Approved — ready for implementation

---

## Context

Plans is a social group-planning app for any activity — birthdays, weekend trips, concerts, road trips, drinks. The brand identity is moving away from a generic "event platform" feel toward something more personal: Pinterest card density + Notion spatial clarity, with Polaroid-memory warmth.

The landing page and auth pages are the top of the funnel. Sharing plans in WhatsApp is the primary growth mechanic — the landing page must make the product feel desirable before sign-up.

---

## Brand & Design System

### Colors
```
--bg:           #FCF9F8   (warm off-white canvas — not clinical pure white)
--bg-w:         #FFFFFF   (card surfaces)
--text:         #1C1B1B   (near-black primary)
--text-2:       #5E5E5E   (secondary / metadata)
--accent:       #3D3D8F   (deep indigo — used sparingly: badges, links, cost tags)
--accent-deep:  #262477   (quote section glow)
--surface:      #F0EDEC
--surface-lo:   #F6F3F2
--divider:      #C7C5D3
```

### Typography
- **Display / hero moments:** `Instrument Serif`, italic — loaded via Google Fonts
- **All UI text:** `DM Sans` — loaded via Google Fonts
- Zero other fonts. Add both to `app/layout.tsx` via `next/font/google`.

### Shadows
```
--sh1: 0 4px 20px rgba(28,27,27,0.06)   (default card)
--sh2: 0 8px 30px rgba(28,27,27,0.10)   (elevated)
--sh3: 0 14px 44px rgba(28,27,27,0.14)  (front card / modals)
```

### Radius
- Cards: `rounded-xl` (12px)
- Buttons: `rounded-full` (pill)
- Inputs: `rounded-none` (bottom-border only — no box)
- Images inside cards: `rounded-lg`

### Motion
- Default transitions: `duration-200 ease-out`
- Card hover lifts: `duration-300`
- No bounce, no spring

### Grain texture
SVG fractalNoise overlay, `opacity-[0.03]`, `fixed inset-0 pointer-events-none z-[9999]` on all pages.

---

## Tailwind / Global CSS Changes

1. Add to `tailwind.config.ts` font families:
   - `headline: ['Instrument Serif', 'serif']`
   - `body: ['DM Sans', 'sans-serif']`
2. Update CSS variables in `globals.css` to match design system colors above
3. Add `--bg: #FCF9F8` as `background`

---

## shadcn/ui Components to Install

Install before implementation begins:
```bash
npx shadcn@latest add avatar badge button card input label separator skeleton tooltip
```

| Component | Used for |
|-----------|----------|
| `Button` | Nav CTAs, hero CTA, form submit, ghost links |
| `Badge` | Status pills (Active/Draft/Closed), cost tags, "This weekend" chip |
| `Avatar` / `AvatarGroup` | Attendee stacks on PlanCards and hero cards |
| `Card` / `CardContent` | PlanCard wrapper, join card, feature step previews |
| `Input` | Auth form fields (styled bottom-border only via `border-0 border-b`) |
| `Label` | Form field labels (10px uppercase tracking) |
| `Separator` | Dividers between sections |
| `Skeleton` | Loading states for masonry grid |
| `Tooltip` | FAB "New plan" label on hover |

---

## Page 1 — Landing (`app/page.tsx`)

### Section order (top → bottom)

#### NAV
- Fixed, `backdrop-blur-2xl`, `bg-[#FCF9F8]/85`
- Left: `Plans` wordmark — Instrument Serif italic 22px
- Right: `Log in` (text Button) + `Get started →` (filled pill Button)
- No hamburger on mobile — collapse to just wordmark + "Get started"

#### S1 — HERO
- Two-column layout: left 46% content, right 54% card stack
- Left:
  - Eyebrow: `FOR ANY PLAN. ANY CREW.` — 11px uppercase DM Sans
  - H1: `"Make plans."` line 1, `"Actually go."` line 2 — Instrument Serif italic, `clamp(56px, 5.8vw, 80px)`, `letter-spacing: -2.5px`, line 2 in `var(--accent)`
  - Sub: `"The group planner that doesn't get in the way."` — 17px DM Sans, `color: --text-2`
  - CTAs: `Start planning free →` (filled pill) + `See how it works` (ghost/underline link)
- Right — **PolaroidStack** component (see below)
- Mobile: single column, PolaroidStack hidden, hero text centred

#### POLAROID STACK COMPONENT (`components/landing/PolaroidStack.tsx`)
3 absolutely positioned PlanCards with:
- Container: `relative h-[460px] perspective-[1000px]`
- **Back card** (concert): `w-64 rotate-6 translate-x-4 z-10` — 4:3 image
- **Mid card** (cabin): `w-[265px] -rotate-3 -translate-x-5 z-20` — 4:3 image
- **Front card** (birthday): `w-[285px] rotate-[1.5deg] z-30` — 1:1 image, avatar overlay inside photo, "This weekend" Badge
- Hover: each card `hover:shadow-[--sh3]`, grayscale(15%) → grayscale(0%) on hover
- Static demo images from Unsplash (hardcoded URLs, not DB data)

#### S2 — FEATURE STRIP
- `border-y border-[--divider]`, 3-column grid with `border-r` dividers
- Each cell: `p-14 py-14`
- Number: Instrument Serif italic 40px `color: --divider`
- Title: 17px semibold DM Sans
- Body: 14px `--text-2`
- Content: `01 Plans for anything` / `02 Split costs cleanly` / `03 Bring everyone in`

#### S3 — MASONRY SHOWCASE ("Every kind of plan. One place.")
- Section header: serif italic h2 + right-aligned subtext
- Grid: `columns-2 md:columns-3 lg:columns-4 gap-4`
- 8 `MasonryPlanCard` components — each with:
  - Real Unsplash image (various aspect ratios: 3:4, 1:1, 4:3)
  - Subtle random rotation: `rotate-[-1.2deg]` to `rotate-[1.5deg]` via index-based class
  - `hover:rotate-0 hover:-translate-y-1 transition-transform duration-200`
  - `filter grayscale-[15%] hover:grayscale-0`
  - Avatar cluster (shadcn Avatar) + cost Badge below image
  - Plan title: Instrument Serif italic 15px
- Use `break-inside-avoid` on each card
- Cards: birthday, lake trip, concert, rooftop drinks, golf day, hike, dinner party, road trip

#### S4 — HOW IT WORKS
- White background section (`bg-white`)
- H2: Instrument Serif italic "Three steps. That's it."
- 3 columns, each with `border-l border-[--divider]/40 pl-6`:
  - Step label: 11px uppercase DM Sans
  - Title: 18px semibold
  - Description: 14px `--text-2`
  - Mini preview Card (shadcn Card) showing the mechanic inline
    - Step 1: thumbnail + plan title + date/cost
    - Step 2: URL string + WhatsApp/Copy link pills
    - Step 3: avatar cluster + "8 going / 2 pending"

#### S5 — SHARE SECTION ("The plan lives in the chat")
- 2-column: left text, right `JoinCardPreview` component
- Left:
  - Accent-coloured label: `GROWTH · SHARING`
  - Serif h2: "The plan lives in the chat."
  - Body 16px
  - 4 bullet points (dot + text)
- Right: `JoinCardPreview` — static Card mockup:
  - Cover image (16:9)
  - Organiser avatar + "by Alex"
  - Title, date, attendee cluster, cost/person
  - `I'm in →` full-width Button
  - WhatsApp badge overlay (absolute, top-right, `bg-[#25D366]`)

#### S6 — STATS STRIP
- Dark `bg-[--text]` background
- 3-column grid with vertical dividers
- Each stat: serif italic large number + DM Sans label
- `12,400+ plans made` / `94% actually happened` / `2 min to create`

#### S7 — QUOTE
- `bg-[--text]` continues from stats (merge into one dark band)
- Decorative indigo blur orb (absolute, `blur-[80px]`)
- Large open-quote glyph: Instrument Serif 72px `opacity-10`
- Quote text: Instrument Serif italic `clamp(22px, 3vw, 34px)` white
- Avatar + name/role attribution

#### S8 — FINAL CTA
- Centred, generous padding
- Serif italic h2: "What are you waiting for?"
- Sub: "Make your first plan in two minutes. Free, forever."
- Large filled pill Button

#### FOOTER
- `max-w-[1200px]` centred, `border-t`
- Logo left · links centre · tagline italic right

---

## Page 2 — Login (`app/(auth)/login/page.tsx`)

### Layout
- Full viewport height, `overflow-hidden`, two panels side-by-side
- No nav bar

### Left panel — 40% (`lg:w-2/5`)
- `bg-white`, padding `px-16 py-14`, full-height flex column
- Top: `Plans` wordmark (Instrument Serif italic)
- Middle:
  - H1: "Welcome back." — Instrument Serif italic 52px `letter-spacing: -1.5px`
  - Sub: 14px `--text-2`
  - Form (shadcn Form + react-hook-form + zod):
    - Email: shadcn Input, `border-0 border-b border-[--divider]` style override, `bg-transparent`
    - Password: same, with show/hide eye toggle
    - Labels: shadcn Label, 10px uppercase tracking
    - Submit: full-width pill Button `"Log in →"`
    - Forgot password: small right-aligned text link
  - "No account? Sign up" toggle link at bottom
- Mobile: full width, visual panel hidden

### Right panel — 60% (`lg:w-3/5`)
- `bg-[--surface-lo]`, `overflow-hidden`
- **MasonryCollage** component:
  - 2-column CSS grid, `gap-4`
  - Rotated container: `rotate-[-5deg] scale-110 translate-y-10 translate-x-5`
  - Col 1 offset `-translate-y-16`, col 2 offset `translate-y-12`
  - 4 Cards: Summer Solstice Supper / Gallery Opening / Morning Coffee / Cabin Retreat
  - Each Card: real Unsplash image (4:5 or 1:1) + Instrument Serif title + DM Sans meta
  - Fade edges: absolute gradient overlays (left/right/top/bottom)
  - Noise texture overlay: SVG fractalNoise `mix-blend-overlay opacity-20`

---

## Page 3 — Sign up (`app/(auth)/signup/page.tsx`)

Identical layout to Login with:
- H1: "Start planning."
- Sub: "Create an account and make your first plan in minutes."
- Fields: Email + Password + Confirm password
- Submit: "Create account →"
- Toggle: "Already have an account? Log in"
- Different MasonryCollage images (birthday/concert/hike/rooftop)

---

## Reusable Components to Create

| Component | Path | Used on |
|-----------|------|---------|
| `PolaroidStack` | `components/landing/PolaroidStack.tsx` | Landing hero |
| `MasonryPlanCard` | `components/landing/MasonryPlanCard.tsx` | Landing S3 showcase |
| `JoinCardPreview` | `components/landing/JoinCardPreview.tsx` | Landing S5 share |
| `MasonryCollage` | `components/landing/MasonryCollage.tsx` | Login + Signup right panel |
| `GrainOverlay` | `components/common/GrainOverlay.tsx` | All pages (fixed overlay) |

---

## CLAUDE.md Update

Add to `CLAUDE.md` under brand identity:
> Plans aesthetic: Pinterest card density + Notion spatial clarity + Polaroid memory warmth. Instrument Serif italic for hero/display moments. DM Sans for all UI. Background #FCF9F8 warm off-white. Accent #3D3D8F deep indigo used sparingly. Sharing in WhatsApp = primary growth mechanic.

---

## Verification

1. `npm run dev` → open `http://localhost:3000`
2. Landing: scroll all 8 sections, check card rotations, masonry columns, dark stat strip
3. Login: check 40/60 split, masonry panel visible, form bottom-border inputs
4. Signup: same as login with different copy
5. Mobile (375px): hero single column, login full-width form, masonry panel hidden
6. `npm run build` — zero TS errors
7. Check Instrument Serif italic renders in hero h1 and card titles
