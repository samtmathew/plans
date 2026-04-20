# Plans Rebrand — Landing Page & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild landing page (`/`), login (`/login`), and signup (`/signup`) with the new brand aesthetic: Instrument Serif italic display font + DM Sans UI font, warm `#FCF9F8` canvas, Pinterest-density masonry cards, polaroid-stack hero, and 40/60 auth split panel.

**Architecture:** New `components/landing/` folder for page-specific components. shadcn/ui installed fresh (project currently uses `@base-ui/react` primitives only). Design tokens updated in `globals.css` + `tailwind.config.ts`. Fonts loaded via `next/font/google` in `layout.tsx`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui v4 (Avatar, Badge, Button, Card, Input, Label, Separator, Skeleton, Tooltip), next/font/google (Instrument Serif + DM Sans), Unsplash image URLs (static demo data).

**Spec:** `docs/superpowers/specs/2026-04-20-plans-rebrand-landing-login.md`

---

## File Map

**Create:**
- `components/common/GrainOverlay.tsx` — fixed SVG noise overlay, used on all pages
- `components/landing/PolaroidStack.tsx` — 3-card rotating hero stack
- `components/landing/MasonryPlanCard.tsx` — single masonry card (image + title + avatars + cost)
- `components/landing/MasonryCollage.tsx` — rotated 2-col grid used in auth right panel
- `components/landing/JoinCardPreview.tsx` — static join card mockup for share section

**Modify:**
- `app/layout.tsx` — add Instrument Serif + DM Sans via `next/font/google`
- `app/globals.css` — replace design tokens with new palette, replace Google Fonts import
- `tailwind.config.ts` — update `headline` + `sans` font families, add `plans-*` color tokens
- `app/page.tsx` — full rewrite (8 sections)
- `app/(auth)/login/page.tsx` — full rewrite (split panel)
- `app/(auth)/signup/page.tsx` — full rewrite (split panel)
- `CLAUDE.md` — add brand identity section

---

## Task 1: Initialize shadcn/ui and install components

shadcn is not currently set up in this project (uses `@base-ui/react` only). Must init before adding components.

**Files:**
- Create: `components/ui/` (shadcn generates these)
- Modify: `components.json` (shadcn config)

- [ ] **Step 1: Check if components.json exists**

```bash
ls components.json 2>/dev/null && echo "EXISTS" || echo "MISSING"
```

Expected: `MISSING`

- [ ] **Step 2: Init shadcn**

```bash
npx shadcn@latest init --yes --defaults
```

When prompted:
- Style: New York
- Base color: Neutral
- CSS variables: Yes

- [ ] **Step 3: Add required components**

```bash
npx shadcn@latest add avatar badge button card input label separator skeleton tooltip --yes
```

- [ ] **Step 4: Verify install**

```bash
ls components/ui/ | grep -E "avatar|badge|button|card|input|label|separator|skeleton|tooltip"
```

Expected: all 9 component files listed.

- [ ] **Step 5: Commit**

```bash
git add components/ components.json
git commit -m "chore: init shadcn/ui, add avatar badge button card input label separator skeleton tooltip"
```

---

## Task 2: Update design tokens — globals.css + tailwind.config.ts

**Files:**
- Modify: `app/globals.css` (lines 1–50 approx)
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Replace Google Fonts import and update CSS variables in globals.css**

Replace the first line (`@import url(...)`) and the `:root` block with:

```css
/* Remove the old @import url(...) line entirely — fonts now loaded via next/font/google */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Plans brand palette */
    --bg:           #FCF9F8;
    --bg-w:         #FFFFFF;
    --plans-text:   #1C1B1B;
    --plans-text-2: #5E5E5E;
    --plans-accent: #3D3D8F;
    --plans-accent-deep: #262477;
    --plans-surface:    #F0EDEC;
    --plans-surface-lo: #F6F3F2;
    --plans-divider:    #C7C5D3;

    /* shadcn/ui required tokens */
    --background:   #FCF9F8;
    --foreground:   #1C1B1B;
    --card:         #FFFFFF;
    --card-foreground: #1C1B1B;
    --popover:      #FFFFFF;
    --popover-foreground: #1C1B1B;
    --primary:      #1C1B1B;
    --primary-foreground: #FFFFFF;
    --secondary:    #F0EDEC;
    --secondary-foreground: #1C1B1B;
    --muted:        #F0EDEC;
    --muted-foreground: #5E5E5E;
    --accent:       #F0EDEC;
    --accent-foreground: #1C1B1B;
    --destructive:  #BA1A1A;
    --border:       #C7C5D3;
    --input:        #C7C5D3;
    --ring:         #3D3D8F;
    --radius:       0.75rem;

    /* Legacy tokens kept for existing components */
    --surface: #FFFFFF;
    --surface-container-lowest: #F6F3F2;
    --surface-container-low:    #F0EDEC;
    --surface-container:        #E8E5E4;
    --on-surface:               #1C1B1B;
    --on-surface-variant:       #5E5E5E;
    --outline:                  #C7C5D3;
    --outline-variant:          #C7C5D3;
    --error:                    #BA1A1A;
    --shadow-card: 0 4px 20px rgba(28,27,27,0.06);
    --shadow-card-hover: 0 14px 44px rgba(28,27,27,0.14);
  }
}
```

Keep the `.dark` block and everything below line 60 unchanged.

- [ ] **Step 2: Update tailwind.config.ts font families**

In `tailwind.config.ts`, replace the `fontFamily` block:

```ts
fontFamily: {
  sans:     ["var(--font-dm-sans)", "system-ui", "sans-serif"],
  headline: ["var(--font-instrument-serif)", "Georgia", "serif"],
  serif:    ["var(--font-instrument-serif)", "Georgia", "serif"],
  mono:     ["Fira Code", "monospace"],
},
```

Also add to `theme.extend.colors`:

```ts
"plans-accent":    "#3D3D8F",
"plans-accent-deep": "#262477",
"plans-text":      "#1C1B1B",
"plans-text-2":    "#5E5E5E",
"plans-surface":   "#F0EDEC",
"plans-surface-lo":"#F6F3F2",
"plans-divider":   "#C7C5D3",
"plans-bg":        "#FCF9F8",
```

- [ ] **Step 3: Verify build compiles**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully` (or similar — no TS errors).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css tailwind.config.ts
git commit -m "feat(design): update CSS tokens and tailwind config to Plans brand palette"
```

---

## Task 3: Load fonts via next/font/google in layout.tsx

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace layout.tsx with font-updated version**

```tsx
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Instrument_Serif, DM_Sans } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'

const DeploymentBanner = dynamic(() => import('@/components/DeploymentBanner'), { ssr: false })

const geist = localFont({
  src: [{ path: './fonts/GeistVF.woff', weight: '100 900' }],
  variable: '--font-geist',
})

const instrumentSerif = Instrument_Serif({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

const dmSans = DM_Sans({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://plans-kappa-mocha.vercel.app'),
  title: 'Plans',
  description: 'Organise group trips and outings — itineraries, costs, and attendees in one place.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${instrumentSerif.variable} ${dmSans.variable} font-sans antialiased`}
        style={{ background: 'var(--bg)' }}
      >
        {children}
        <DeploymentBanner />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Verify fonts load**

```bash
npm run dev
```

Open `http://localhost:3000` — check any existing page renders without errors. Fonts may not show yet (pages not updated).

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(fonts): add Instrument Serif + DM Sans via next/font/google"
```

---

## Task 4: GrainOverlay component

**Files:**
- Create: `components/common/GrainOverlay.tsx`

- [ ] **Step 1: Create GrainOverlay**

```tsx
export function GrainOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }}
      aria-hidden="true"
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/common/GrainOverlay.tsx
git commit -m "feat(landing): add GrainOverlay component"
```

---

## Task 5: PolaroidStack component

3 absolutely-positioned rotating plan cards for the landing hero. Static demo data — not connected to DB.

**Files:**
- Create: `components/landing/PolaroidStack.tsx`

- [ ] **Step 1: Create PolaroidStack.tsx**

```tsx
"use client"

import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const DEMO_CARDS = [
  {
    id: "back",
    title: "Summer Fest",
    meta: "Aug 12 · 4 going",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=520&q=80&auto=format&fit=crop",
    aspect: "land" as const,
    posClass: "w-64 top-10 right-[-16px] rotate-6",
    hoverClass: "hover:rotate-[8deg] hover:translate-x-1",
    shadow: "shadow-[0_4px_20px_rgba(28,27,27,0.06)]",
    zIndex: "z-10",
  },
  {
    id: "mid",
    title: "Cabin Weekend",
    meta: "Oct 24 · 8 going",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=530&q=80&auto=format&fit=crop",
    aspect: "land" as const,
    posClass: "w-[265px] top-20 right-9 -rotate-3",
    hoverClass: "hover:-rotate-[5deg] hover:-translate-x-2",
    shadow: "shadow-[0_8px_30px_rgba(28,27,27,0.10)]",
    zIndex: "z-20",
  },
  {
    id: "front",
    title: "Sarah's 30th",
    meta: "The Continental, 8pm",
    badge: "This weekend",
    imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=560&q=80&auto=format&fit=crop",
    aspect: "sq" as const,
    posClass: "w-[285px] top-[120px] right-[84px] rotate-[1.5deg]",
    hoverClass: "hover:rotate-0 hover:-translate-y-1",
    shadow: "shadow-[0_14px_44px_rgba(28,27,27,0.14)]",
    zIndex: "z-30",
    avatars: [
      { src: "https://i.pravatar.cc/56?img=47", fallback: "A" },
      { src: "https://i.pravatar.cc/56?img=12", fallback: "B" },
      { src: "https://i.pravatar.cc/56?img=32", fallback: "C" },
    ],
  },
]

export function PolaroidStack() {
  return (
    <div className="relative h-[460px] [perspective:1000px] w-full">
      {DEMO_CARDS.map((card) => (
        <div
          key={card.id}
          className={`absolute bg-white rounded-xl overflow-hidden transition-all duration-300 cursor-default ${card.posClass} ${card.hoverClass} ${card.shadow} ${card.zIndex} hover:shadow-[0_14px_44px_rgba(28,27,27,0.14)]`}
        >
          <div className="relative">
            <div className={`relative w-full ${card.aspect === "sq" ? "aspect-square" : "aspect-[4/3]"}`}>
              <Image
                src={card.imageUrl}
                alt={card.title}
                fill
                className="object-cover grayscale-[15%] transition-all duration-300 group-hover:grayscale-0"
                sizes="320px"
                unoptimized
              />
            </div>
            {card.avatars && (
              <div className="absolute bottom-2 left-3 flex">
                {card.avatars.map((av, i) => (
                  <Avatar
                    key={i}
                    className="w-7 h-7 border-2 border-white"
                    style={{ marginLeft: i === 0 ? 0 : -8, zIndex: card.avatars!.length - i }}
                  >
                    <AvatarImage src={av.src} alt={av.fallback} />
                    <AvatarFallback className="text-[10px] bg-[#F0EDEC]">{av.fallback}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 pb-3.5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-headline italic text-[18px] text-[#1C1B1B] leading-tight truncate">
                {card.title}
              </p>
              {card.badge && (
                <Badge className="text-[10px] font-medium bg-[#3D3D8F] text-white rounded-full shrink-0 px-2 py-0.5">
                  {card.badge}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-[#5E5E5E]">{card.meta}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/PolaroidStack.tsx
git commit -m "feat(landing): add PolaroidStack hero component"
```

---

## Task 6: MasonryPlanCard component

Used in the landing page "Every kind of plan" showcase grid.

**Files:**
- Create: `components/landing/MasonryPlanCard.tsx`

- [ ] **Step 1: Create MasonryPlanCard.tsx**

```tsx
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export interface MasonryCardData {
  title: string
  imageUrl: string
  aspectClass: string   // e.g. "aspect-[3/4]" "aspect-square" "aspect-[4/3]"
  date?: string
  costPerPerson?: string
  rotateClass: string   // e.g. "rotate-[-1.2deg]"
  avatars?: { src: string; fallback: string }[]
}

export function MasonryPlanCard({ card }: { card: MasonryCardData }) {
  return (
    <div
      className={`break-inside-avoid mb-4 bg-white rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(28,27,27,0.06)] cursor-pointer transition-all duration-200 ${card.rotateClass} hover:rotate-0 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(28,27,27,0.10)]`}
    >
      <div className={`relative w-full ${card.aspectClass}`}>
        <Image
          src={card.imageUrl}
          alt={card.title}
          fill
          className="object-cover grayscale-[15%] transition-all duration-200 hover:grayscale-0"
          sizes="(max-width: 768px) 50vw, 25vw"
          unoptimized
        />
      </div>
      <div className="px-3 py-2.5">
        <p className="font-headline italic text-[15px] text-[#1C1B1B] mb-1.5 leading-tight">
          {card.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {card.avatars && card.avatars.length > 0 && (
            <div className="flex">
              {card.avatars.slice(0, 4).map((av, i) => (
                <Avatar
                  key={i}
                  className="w-[18px] h-[18px] border-[1.5px] border-white"
                  style={{ marginLeft: i === 0 ? 0 : -5, zIndex: card.avatars!.length - i }}
                >
                  <AvatarImage src={av.src} alt={av.fallback} />
                  <AvatarFallback className="text-[8px]">{av.fallback}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
          {card.date && (
            <span className="text-[11px] text-[#5E5E5E]">{card.date}</span>
          )}
          {card.costPerPerson && (
            <Badge
              variant="outline"
              className="text-[10px] font-semibold text-[#3D3D8F] border-[rgba(61,61,143,0.2)] bg-[rgba(61,61,143,0.06)] rounded-full px-2 py-0"
            >
              {card.costPerPerson}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/MasonryPlanCard.tsx
git commit -m "feat(landing): add MasonryPlanCard component"
```

---

## Task 7: JoinCardPreview component

Static join card mockup for the "Share" section on landing page.

**Files:**
- Create: `components/landing/JoinCardPreview.tsx`

- [ ] **Step 1: Create JoinCardPreview.tsx**

```tsx
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function JoinCardPreview() {
  return (
    <div className="relative">
      {/* WhatsApp badge */}
      <div className="absolute -top-3 -right-3 z-10 flex items-center gap-1.5 bg-[#25D366] text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-[0_2px_10px_rgba(37,211,102,0.35)]">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Shared in chat
      </div>

      {/* Card */}
      <div className="w-[300px] bg-white rounded-2xl shadow-[0_14px_44px_rgba(28,27,27,0.14)] overflow-hidden">
        <div className="relative aspect-video w-full">
          <Image
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80&auto=format&fit=crop"
            alt="Lake District Weekend"
            fill
            className="object-cover grayscale-[20%]"
            sizes="300px"
            unoptimized
          />
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src="https://i.pravatar.cc/48?img=47" alt="Alex" />
              <AvatarFallback className="text-[8px]">A</AvatarFallback>
            </Avatar>
            <span className="text-[12px] text-[#5E5E5E]">by Alex</span>
          </div>

          <h3 className="font-headline italic text-[22px] text-[#1C1B1B] leading-tight mb-1">
            Lake District Weekend
          </h3>

          <p className="text-[13px] text-[#5E5E5E] mb-1">📅 Apr 5–7, 2025</p>

          <div className="flex items-center gap-2 mb-1">
            <div className="flex">
              {["12","25","30"].map((id, i) => (
                <Avatar
                  key={id}
                  className="w-5 h-5 border-[1.5px] border-white"
                  style={{ marginLeft: i === 0 ? 0 : -5 }}
                >
                  <AvatarImage src={`https://i.pravatar.cc/40?img=${id}`} alt="" />
                  <AvatarFallback className="text-[8px]">?</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-[13px] text-[#5E5E5E]">8 going</span>
          </div>

          <p className="text-[13px] font-semibold text-[#1C1B1B] mb-4">~£120 per person</p>

          <Button className="w-full rounded-full bg-[#1C1B1B] text-white hover:bg-[#2d2d2d] font-medium">
            I&apos;m in →
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/JoinCardPreview.tsx
git commit -m "feat(landing): add JoinCardPreview component"
```

---

## Task 8: MasonryCollage component

Rotated 2-column card grid used in login/signup right panel.

**Files:**
- Create: `components/landing/MasonryCollage.tsx`

- [ ] **Step 1: Create MasonryCollage.tsx**

```tsx
import Image from "next/image"

interface CollageCard {
  title: string
  meta: string
  imageUrl: string
  aspectClass: string
}

interface MasonryCollageProps {
  cards: CollageCard[]
}

export function MasonryCollage({ cards }: MasonryCollageProps) {
  const col1 = cards.slice(0, 2)
  const col2 = cards.slice(2, 4)

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Rotated grid */}
      <div className="absolute inset-0 flex items-center justify-center p-10">
        <div
          className="grid grid-cols-2 gap-4 w-full max-w-lg"
          style={{ transform: "rotate(-5deg) scale(1.1) translateY(40px) translateX(16px)" }}
        >
          {/* Column 1 — shifted up */}
          <div className="flex flex-col gap-4" style={{ marginTop: -64 }}>
            {col1.map((card, i) => (
              <CollageCard key={i} card={card} />
            ))}
          </div>
          {/* Column 2 — shifted down */}
          <div className="flex flex-col gap-4" style={{ marginTop: 48 }}>
            {col2.map((card, i) => (
              <CollageCard key={i} card={card} />
            ))}
          </div>
        </div>
      </div>

      {/* Edge fades */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to right, var(--plans-surface-lo) 0%, transparent 18%, transparent 82%, var(--plans-surface-lo) 100%)" }}
      />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, var(--plans-surface-lo) 0%, transparent 14%, transparent 86%, var(--plans-surface-lo) 100%)" }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}

function CollageCard({ card }: { card: CollageCard }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(28,27,27,0.08)] transition-transform duration-300 hover:-translate-y-1">
      <div className={`relative w-full ${card.aspectClass}`}>
        <Image
          src={card.imageUrl}
          alt={card.title}
          fill
          className="object-cover"
          sizes="240px"
          unoptimized
        />
      </div>
      <div className="px-3 py-2.5">
        <p className="font-headline italic text-[17px] text-[#1C1B1B] leading-tight mb-0.5">
          {card.title}
        </p>
        <p className="text-[11px] text-[#5E5E5E]">{card.meta}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/MasonryCollage.tsx
git commit -m "feat(landing): add MasonryCollage component for auth right panel"
```

---

## Task 9: Landing page — Nav, Hero, Feature Strip

**Files:**
- Modify: `app/page.tsx` (first 3 sections)

- [ ] **Step 1: Replace app/page.tsx with nav + hero + feature strip**

```tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GrainOverlay } from "@/components/common/GrainOverlay"
import { PolaroidStack } from "@/components/landing/PolaroidStack"

export default function LandingPage() {
  return (
    <main className="bg-[#FCF9F8] text-[#1C1B1B] min-h-screen">
      <GrainOverlay />

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-12 bg-[rgba(252,249,248,0.85)] backdrop-blur-2xl border-b border-[rgba(28,27,27,0.06)]">
        <span className="font-headline italic text-[22px] text-[#1C1B1B]">Plans</span>
        <div className="flex items-center gap-1.5">
          <Link href="/login">
            <Button variant="ghost" className="rounded-full text-[#5E5E5E] font-medium text-sm hover:text-[#1C1B1B]">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="rounded-full bg-[#1C1B1B] text-white font-medium text-sm px-5 shadow-[0_4px_12px_rgba(28,27,27,0.12)] hover:bg-[#2d2d2d]">
              Get started →
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-[1200px] mx-auto px-12 pt-36 pb-20 flex items-center gap-16 min-h-screen">
        <div className="flex-none w-[46%] max-w-[480px]">
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E] mb-5">
            For any plan. Any crew.
          </p>
          <h1 className="font-headline italic leading-[0.95] tracking-[-2.5px] mb-6"
            style={{ fontSize: "clamp(56px, 5.8vw, 80px)" }}>
            Make plans.<br />
            <span className="text-[#3D3D8F]">Actually go.</span>
          </h1>
          <p className="text-[17px] text-[#5E5E5E] leading-[1.65] mb-10 max-w-[360px]">
            The group planner that doesn&apos;t get in the way.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/signup">
              <Button className="rounded-full bg-[#1C1B1B] text-white text-[16px] font-medium px-8 py-6 shadow-[0_4px_20px_rgba(28,27,27,0.12)] hover:bg-[#2d2d2d] hover:-translate-y-0.5 transition-all">
                Start planning free →
              </Button>
            </Link>
            <button className="text-[14px] text-[#5E5E5E] underline underline-offset-[3px] hover:text-[#1C1B1B] transition-colors bg-transparent border-0">
              See how it works
            </button>
          </div>
        </div>

        <div className="flex-1 flex justify-center items-center min-h-[480px]">
          <PolaroidStack />
        </div>
      </section>

      {/* ── FEATURE STRIP ── */}
      <div className="border-y border-[rgba(28,27,27,0.07)]">
        <div className="max-w-[1200px] mx-auto px-12 grid grid-cols-3">
          {[
            { n: "01", t: "Plans for anything.", d: "Birthdays, trips, concerts, or just hanging out. No templates, no categories." },
            { n: "02", t: "Split costs cleanly.", d: "Itemised breakdowns, calculated per-head or group. Always live, never stale." },
            { n: "03", t: "Bring everyone in.", d: "Share a link, manage approvals, see who's coming. One tap from any group chat." },
          ].map((feat, i) => (
            <div key={i} className={`py-14 px-11 ${i < 2 ? "border-r border-[rgba(28,27,27,0.06)]" : ""}`}>
              <p className="font-headline italic text-[40px] leading-none text-[#C7C5D3] mb-4">{feat.n}</p>
              <p className="text-[17px] font-semibold tracking-[-0.3px] mb-2">{feat.t}</p>
              <p className="text-[14px] text-[#5E5E5E] leading-[1.65]">{feat.d}</p>
            </div>
          ))}
        </div>
      </div>
      {/* remaining sections added in next task */}
    </main>
  )
}
```

- [ ] **Step 2: Check renders**

```bash
npm run dev
```

Open `http://localhost:3000` — verify nav, hero with PolaroidStack, feature strip all render.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(landing): add nav, hero with PolaroidStack, feature strip"
```

---

## Task 10: Landing page — Masonry Showcase + How It Works

**Files:**
- Modify: `app/page.tsx` — add sections S3 + S4 before the closing `</main>`

- [ ] **Step 1: Define MASONRY_CARDS data and add showcase section**

Add above the `export default` in `app/page.tsx`:

```tsx
import { MasonryPlanCard, type MasonryCardData } from "@/components/landing/MasonryPlanCard"

const MASONRY_CARDS: MasonryCardData[] = [
  { title: "Emma's 25th 🎂", imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-[3/4]", date: "Mar 15", costPerPerson: "~£45/pp", rotateClass: "rotate-[-1.2deg]", avatars: [{ src: "https://i.pravatar.cc/36?img=5", fallback: "E" }, { src: "https://i.pravatar.cc/36?img=10", fallback: "A" }, { src: "https://i.pravatar.cc/36?img=15", fallback: "T" }] },
  { title: "Lake District Weekend", imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-square", date: "Apr 5–7", costPerPerson: "~£120/pp", rotateClass: "rotate-[0.8deg]" },
  { title: "Glastonbury 2025 🎵", imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-[4/3]", date: "Jun 25", costPerPerson: "~£340/pp", rotateClass: "rotate-[-0.5deg]", avatars: [{ src: "https://i.pravatar.cc/36?img=20", fallback: "M" }, { src: "https://i.pravatar.cc/36?img=25", fallback: "J" }] },
  { title: "Rooftop Drinks", imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-[3/4]", date: "Friday", costPerPerson: "~£22/pp", rotateClass: "rotate-[1deg]" },
  { title: "Boys Golf Day ⛳", imageUrl: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-square", rotateClass: "rotate-[-0.7deg]", avatars: [{ src: "https://i.pravatar.cc/36?img=30", fallback: "P" }, { src: "https://i.pravatar.cc/36?img=35", fallback: "D" }, { src: "https://i.pravatar.cc/36?img=40", fallback: "S" }, { src: "https://i.pravatar.cc/36?img=45", fallback: "R" }] },
  { title: "Snowdonia Hike 🏔", imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-[4/3]", date: "Aug 3", costPerPerson: "~£85/pp", rotateClass: "rotate-[1.5deg]" },
  { title: "Summer Dinner Party", imageUrl: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-[3/4]", rotateClass: "rotate-[-1deg]", avatars: [{ src: "https://i.pravatar.cc/36?img=7", fallback: "L" }, { src: "https://i.pravatar.cc/36?img=14", fallback: "K" }], costPerPerson: "~£38/pp" },
  { title: "Italy Road Trip 🚗", imageUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-square", date: "Sept", costPerPerson: "~£600/pp", rotateClass: "rotate-[0.6deg]" },
]
```

Then inside `<main>`, after the feature strip and before `</main>`, add:

```tsx
{/* ── S3: MASONRY SHOWCASE ── */}
<section className="max-w-[1200px] mx-auto px-12 py-24">
  <div className="flex items-end justify-between mb-14">
    <div>
      <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E] mb-4">
        The mood board
      </p>
      <h2 className="font-headline italic leading-[1.05] tracking-[-1.5px]"
        style={{ fontSize: "clamp(36px, 4vw, 52px)" }}>
        Every kind of plan.<br />One place.
      </h2>
    </div>
    <p className="text-[14px] text-[#5E5E5E] max-w-[260px] text-right leading-[1.6]">
      From spontaneous drinks to month-long road trips. Plans adapts to whatever you&apos;re doing.
    </p>
  </div>
  <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
    {MASONRY_CARDS.map((card, i) => (
      <MasonryPlanCard key={i} card={card} />
    ))}
  </div>
</section>

{/* ── S4: HOW IT WORKS ── */}
<section className="bg-white border-y border-[rgba(28,27,27,0.06)]">
  <div className="max-w-[1200px] mx-auto px-12 py-24">
    <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E] mb-3">How it works</p>
    <h2 className="font-headline italic leading-[1.05] tracking-[-1.5px] mb-16 max-w-[380px]"
      style={{ fontSize: "clamp(36px, 4vw, 52px)" }}>
      Three steps.<br />That&apos;s it.
    </h2>
    <div className="grid grid-cols-3 gap-10">
      {[
        {
          n: "Step 01", t: "Create your plan",
          d: "Name it, add a cover photo, dates, itinerary, and cost breakdown. Takes under 3 minutes.",
          preview: (
            <div className="flex items-center gap-3 bg-[#F6F3F2] rounded-lg p-3.5">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                <img src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=100&q=80&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-headline italic text-[13px] text-[#1C1B1B]">Sarah&apos;s 30th</p>
                <p className="text-[11px] text-[#5E5E5E]">Mar 22 · £45/person</p>
              </div>
            </div>
          ),
        },
        {
          n: "Step 02", t: "Share the link",
          d: "Drop it in the group chat. Friends join directly from the link — no app needed to RSVP.",
          preview: (
            <div className="bg-[#F6F3F2] rounded-lg p-3.5 space-y-2">
              <p className="text-[11px] font-medium text-[#5E5E5E]">plans.app/join/sarah30</p>
              <div className="flex gap-2">
                <span className="bg-[#25D366] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">WhatsApp</span>
                <span className="bg-[#F0EDEC] text-[#5E5E5E] text-[10px] font-semibold px-2.5 py-1 rounded-full">Copy link</span>
              </div>
            </div>
          ),
        },
        {
          n: "Step 03", t: "Everyone&apos;s in",
          d: "Approve requests, see who's coming, and everyone has the full plan in their pocket.",
          preview: (
            <div className="flex items-center gap-3 bg-[#F6F3F2] rounded-lg p-3.5">
              <div className="flex">
                {["47","12","32","25","8"].map((id, i) => (
                  <img key={id} src={`https://i.pravatar.cc/56?img=${id}`} alt="" className="w-7 h-7 rounded-full border-2 border-white object-cover" style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 5 - i }} />
                ))}
              </div>
              <div>
                <p className="font-headline italic text-[13px] text-[#1C1B1B]">8 going</p>
                <p className="text-[11px] text-[#5E5E5E]">2 pending</p>
              </div>
            </div>
          ),
        },
      ].map((step, i) => (
        <div key={i} className="pl-5 border-l border-[rgba(28,27,27,0.1)]">
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E] mb-3">{step.n}</p>
          <p className="text-[18px] font-semibold tracking-[-0.3px] mb-2.5" dangerouslySetInnerHTML={{ __html: step.t }} />
          <p className="text-[14px] text-[#5E5E5E] leading-[1.65] mb-4">{step.d}</p>
          {step.preview}
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Check renders**

```bash
npm run dev
```

Open `http://localhost:3000` — scroll to verify masonry grid shows 8 cards with rotation, how-it-works has step previews.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(landing): add masonry showcase and how-it-works sections"
```

---

## Task 11: Landing page — Share Section, Stats, Quote, Final CTA, Footer

**Files:**
- Modify: `app/page.tsx` — add final sections S5–S8 + footer before `</main>`

- [ ] **Step 1: Add import at top of page.tsx**

```tsx
import { JoinCardPreview } from "@/components/landing/JoinCardPreview"
```

- [ ] **Step 2: Add S5–S8 + footer inside `<main>` after how-it-works**

```tsx
{/* ── S5: SHARE ── */}
<section className="max-w-[1200px] mx-auto px-12 py-24">
  <div className="grid grid-cols-2 gap-20 items-center">
    <div>
      <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#3D3D8F] mb-4">
        Growth · Sharing
      </p>
      <h2 className="font-headline italic leading-[1.05] tracking-[-1.5px] mb-5"
        style={{ fontSize: "clamp(36px, 4vw, 52px)" }}>
        The plan lives<br />in the chat.
      </h2>
      <p className="text-[16px] text-[#5E5E5E] leading-[1.65] mb-8 max-w-[400px]">
        Drop a Plans link in any group chat. Friends see a beautiful preview — no sign-up, no friction. Just tap and join.
      </p>
      <ul className="space-y-3">
        {[
          "No app needed to RSVP — works for everyone",
          "Organiser approves or auto-accepts requests",
          "Joiners see full plan: itinerary, cost, who else is going",
          "Convert to account later to create their own plans",
        ].map((b, i) => (
          <li key={i} className="flex items-start gap-3 text-[14px] text-[#5E5E5E] leading-[1.5]">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#3D3D8F] shrink-0" />
            {b}
          </li>
        ))}
      </ul>
    </div>
    <div className="flex justify-center">
      <JoinCardPreview />
    </div>
  </div>
</section>

{/* ── S6 + S7: STATS + QUOTE (single dark band) ── */}
<div className="bg-[#1C1B1B]">
  {/* Stats */}
  <div className="max-w-[1200px] mx-auto px-12 py-16 grid grid-cols-3 divide-x divide-[rgba(255,255,255,0.08)]">
    {[
      { n: "12,400+", l: "Plans made so far" },
      { n: "94%", l: "Plans that actually happened" },
      { n: "2 min", l: "Average time to create a plan" },
    ].map((s, i) => (
      <div key={i} className={i === 0 ? "pr-12" : i === 1 ? "px-12" : "pl-12"}>
        <p className="font-headline italic text-white leading-none tracking-[-2px] mb-1.5"
          style={{ fontSize: "clamp(40px, 4vw, 52px)" }}>{s.n}</p>
        <p className="text-[14px] text-[rgba(255,255,255,0.5)]">{s.l}</p>
      </div>
    ))}
  </div>

  {/* Quote */}
  <div className="relative overflow-hidden pb-24">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] bg-[#262477] opacity-20 rounded-full blur-[80px] pointer-events-none" />
    <div className="max-w-[1200px] mx-auto px-12 text-center relative z-10">
      <span className="font-headline italic text-[72px] text-[rgba(255,255,255,0.08)] leading-[0.7] block mb-3">&ldquo;</span>
      <blockquote className="font-headline italic text-white leading-[1.35] tracking-[-0.5px] max-w-[620px] mx-auto mb-7"
        style={{ fontSize: "clamp(22px, 3vw, 34px)" }}>
        &ldquo;It finally feels like I&apos;m planning a hangout with friends, not managing a project.&rdquo;
      </blockquote>
      <div className="flex items-center justify-center gap-3">
        <img src="https://i.pravatar.cc/88?img=25" alt="Alex Chen" className="w-11 h-11 rounded-full border border-[rgba(255,255,255,0.2)] object-cover" />
        <div className="text-left">
          <p className="text-[14px] font-medium text-white">Alex Chen</p>
          <p className="text-[12px] text-[rgba(255,255,255,0.4)]">Chronic over-planner</p>
        </div>
      </div>
    </div>
  </div>
</div>

{/* ── S8: FINAL CTA ── */}
<section className="max-w-[1200px] mx-auto px-12 py-32 text-center">
  <h2 className="font-headline italic leading-[0.95] tracking-[-2.5px] mb-6"
    style={{ fontSize: "clamp(48px, 6vw, 80px)" }}>
    What are you<br />waiting for?
  </h2>
  <p className="text-[17px] text-[#5E5E5E] mb-10">Make your first plan in two minutes. Free, forever.</p>
  <Link href="/signup">
    <Button className="rounded-full bg-[#1C1B1B] text-white text-[17px] font-medium px-11 py-7 shadow-[0_4px_20px_rgba(28,27,27,0.14)] hover:bg-[#2d2d2d]">
      Start planning free →
    </Button>
  </Link>
</section>

{/* ── FOOTER ── */}
<footer className="border-t border-[rgba(28,27,27,0.07)]">
  <div className="max-w-[1200px] mx-auto px-12 py-8 flex items-center justify-between">
    <span className="font-headline italic text-[18px] text-[#1C1B1B]">Plans</span>
    <div className="flex gap-7">
      {["Privacy", "Terms", "About"].map((l) => (
        <Link key={l} href="#" className="text-[12px] text-[#5E5E5E] hover:text-[#1C1B1B] transition-colors">{l}</Link>
      ))}
    </div>
    <span className="text-[12px] text-[#5E5E5E] italic">Made for making plans</span>
  </div>
</footer>
```

- [ ] **Step 3: Full visual check**

```bash
npm run dev
```

Scroll full landing page — verify all 8 sections render, dark stats+quote band, final CTA, footer.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat(landing): complete landing page — share, stats, quote, CTA, footer"
```

---

## Task 12: Login page

**Files:**
- Modify: `app/(auth)/login/page.tsx` (full rewrite)

- [ ] **Step 1: Replace login page**

```tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GrainOverlay } from "@/components/common/GrainOverlay"
import { MasonryCollage } from "@/components/landing/MasonryCollage"

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})
type FormValues = z.infer<typeof schema>

const LOGIN_COLLAGE = [
  { title: "Summer Solstice Supper", meta: "June 21", imageUrl: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-[4/5]" },
  { title: "Gallery Opening", meta: "West End Arts", imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-square" },
  { title: "Morning Coffee", meta: "Every Sunday", imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-square" },
  { title: "Cabin Retreat", meta: "The Berkshires", imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-[4/5]" },
]

export default function LoginPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) { setServerError(error.message); return }
    router.push("/home")
    router.refresh()
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#FCF9F8]">
      <GrainOverlay />

      {/* LEFT PANEL — form */}
      <div className="w-full lg:w-2/5 flex flex-col justify-between bg-white px-16 py-14 overflow-y-auto z-10 shadow-[4px_0_40px_rgba(28,27,27,0.06)]">
        <div>
          <Link href="/" className="font-headline italic text-[22px] text-[#1C1B1B] block mb-16">
            Plans
          </Link>

          <h1 className="font-headline italic text-[52px] leading-none tracking-[-1.5px] text-[#1C1B1B] mb-2">
            Welcome back.
          </h1>
          <p className="text-[14px] text-[#5E5E5E] mb-12 leading-[1.5]">
            Log in to continue planning with the people you care about.
          </p>

          {serverError && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E]">
                Email address
              </Label>
              <Input
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                className="border-0 border-b border-[#C7C5D3] rounded-none bg-transparent px-0 py-2 text-[15px] focus-visible:ring-0 focus-visible:border-[#3D3D8F] transition-colors placeholder:text-[#C7C5D3]"
                {...register("email")}
              />
              {errors.email && <p className="text-[12px] text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E]">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="border-0 border-b border-[#C7C5D3] rounded-none bg-transparent px-0 py-2 text-[15px] focus-visible:ring-0 focus-visible:border-[#3D3D8F] transition-colors pr-8 placeholder:text-[#C7C5D3]"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#C7C5D3] hover:text-[#5E5E5E] transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-[12px] text-red-600">{errors.password.message}</p>}
              <div className="text-right">
                <Link href="/forgot-password" className="text-[12px] text-[#5E5E5E] hover:text-[#1C1B1B] transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#1C1B1B] text-white py-6 text-[15px] font-medium flex items-center justify-between px-6 shadow-[0_4px_16px_rgba(28,27,27,0.1)] hover:bg-[#2d2d2d] disabled:opacity-50"
            >
              <span>{isSubmitting ? "Logging in…" : "Log in"}</span>
              <span>→</span>
            </Button>
          </form>

          <p className="text-[13px] text-[#5E5E5E] text-center mt-6">
            No account?{" "}
            <Link href="/signup" className="text-[#1C1B1B] font-medium hover:text-[#3D3D8F] transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-[11px] text-[#5E5E5E] mt-8">© 2025 Plans · Made for making plans</p>
      </div>

      {/* RIGHT PANEL — masonry collage */}
      <div className="hidden lg:block lg:w-3/5 bg-[#F6F3F2] relative overflow-hidden">
        <MasonryCollage cards={LOGIN_COLLAGE} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Check login page**

```bash
npm run dev
```

Open `http://localhost:3000/login` — verify split layout, bottom-border inputs, masonry panel right.

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/login/page.tsx
git commit -m "feat(auth): rebuild login page with split panel + MasonryCollage"
```

---

## Task 13: Signup page

**Files:**
- Modify: `app/(auth)/signup/page.tsx` (full rewrite)

- [ ] **Step 1: Replace signup page**

```tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GrainOverlay } from "@/components/common/GrainOverlay"
import { MasonryCollage } from "@/components/landing/MasonryCollage"

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
type FormValues = z.infer<typeof schema>

const SIGNUP_COLLAGE = [
  { title: "Sarah's 30th", meta: "The Continental", imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-[4/5]" },
  { title: "Glastonbury 2025", meta: "340 going", imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-square" },
  { title: "Lake District Weekend", meta: "April 5–7", imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-square" },
  { title: "Rooftop Drinks", meta: "Friday night", imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80&auto=format&fit=crop", aspectClass: "aspect-[4/5]" },
]

export default function SignupPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    })
    if (error) { setServerError(error.message); return }
    setEmailSent(true)
  }

  if (emailSent) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FCF9F8]">
        <GrainOverlay />
        <div className="text-center max-w-sm">
          <span className="font-headline italic text-[22px] text-[#1C1B1B] block mb-8">Plans</span>
          <h2 className="font-headline italic text-[40px] leading-tight tracking-[-1.5px] text-[#1C1B1B] mb-3">Check your inbox.</h2>
          <p className="text-[15px] text-[#5E5E5E] leading-[1.6]">
            We sent a confirmation link to your email. Click it to finish creating your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#FCF9F8]">
      <GrainOverlay />

      {/* LEFT PANEL */}
      <div className="w-full lg:w-2/5 flex flex-col justify-between bg-white px-16 py-14 overflow-y-auto z-10 shadow-[4px_0_40px_rgba(28,27,27,0.06)]">
        <div>
          <Link href="/" className="font-headline italic text-[22px] text-[#1C1B1B] block mb-16">Plans</Link>

          <h1 className="font-headline italic text-[52px] leading-none tracking-[-1.5px] text-[#1C1B1B] mb-2">
            Start planning.
          </h1>
          <p className="text-[14px] text-[#5E5E5E] mb-12 leading-[1.5]">
            Create an account and make your first plan in minutes.
          </p>

          {serverError && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E]">Email address</Label>
              <Input type="email" placeholder="name@example.com" autoComplete="email"
                className="border-0 border-b border-[#C7C5D3] rounded-none bg-transparent px-0 py-2 text-[15px] focus-visible:ring-0 focus-visible:border-[#3D3D8F] transition-colors placeholder:text-[#C7C5D3]"
                {...register("email")} />
              {errors.email && <p className="text-[12px] text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E]">Password</Label>
              <div className="relative">
                <Input type={showPw ? "text" : "password"} placeholder="Create a password" autoComplete="new-password"
                  className="border-0 border-b border-[#C7C5D3] rounded-none bg-transparent px-0 py-2 text-[15px] focus-visible:ring-0 focus-visible:border-[#3D3D8F] transition-colors pr-8 placeholder:text-[#C7C5D3]"
                  {...register("password")} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#C7C5D3] hover:text-[#5E5E5E] transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-[12px] text-red-600">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E]">Confirm password</Label>
              <div className="relative">
                <Input type={showConfirm ? "text" : "password"} placeholder="Repeat password" autoComplete="new-password"
                  className="border-0 border-b border-[#C7C5D3] rounded-none bg-transparent px-0 py-2 text-[15px] focus-visible:ring-0 focus-visible:border-[#3D3D8F] transition-colors pr-8 placeholder:text-[#C7C5D3]"
                  {...register("confirmPassword")} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#C7C5D3] hover:text-[#5E5E5E] transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-[12px] text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting}
              className="w-full rounded-full bg-[#1C1B1B] text-white py-6 text-[15px] font-medium flex items-center justify-between px-6 shadow-[0_4px_16px_rgba(28,27,27,0.1)] hover:bg-[#2d2d2d] disabled:opacity-50">
              <span>{isSubmitting ? "Creating account…" : "Create account"}</span>
              <span>→</span>
            </Button>
          </form>

          <p className="text-[13px] text-[#5E5E5E] text-center mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1C1B1B] font-medium hover:text-[#3D3D8F] transition-colors">Log in</Link>
          </p>
        </div>
        <p className="text-[11px] text-[#5E5E5E] mt-8">© 2025 Plans · Made for making plans</p>
      </div>

      {/* RIGHT PANEL */}
      <div className="hidden lg:block lg:w-3/5 bg-[#F6F3F2] relative overflow-hidden">
        <MasonryCollage cards={SIGNUP_COLLAGE} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Check signup page**

```bash
npm run dev
```

Open `http://localhost:3000/signup` — verify 3-field form, masonry panel, email-sent state.

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/signup/page.tsx
git commit -m "feat(auth): rebuild signup page with split panel + MasonryCollage"
```

---

## Task 14: CLAUDE.md brand identity update + build check

**Files:**
- Modify: `CLAUDE.md`
- Run: `npm run build`

- [ ] **Step 1: Add brand identity section to CLAUDE.md**

Add after the `## Project Overview` section:

```markdown
## Brand Identity

**Aesthetic:** Pinterest card density + Notion spatial clarity + Polaroid memory warmth.

**Typography:**
- Display / hero: `Instrument Serif` italic — for h1, plan card titles, serif moments
- UI text: `DM Sans` — for all labels, body, buttons, metadata

**Colors:**
- Background: `#FCF9F8` (warm off-white — never pure white for page backgrounds)
- Text primary: `#1C1B1B`
- Text secondary: `#5E5E5E`
- Accent (indigo): `#3D3D8F` — used sparingly: cost badges, focus states, accent text
- Surface: `#F0EDEC` / `#F6F3F2`

**Growth mechanic:** Sharing plan links in WhatsApp is the primary acquisition loop. The join page (`/join/[token]`) is the most important public-facing screen.

**Design rules:**
- Cards have subtle rotation (±1.5°) for organic, Pinterest-like feel
- Images default `grayscale(15%)`, transition to full color on hover
- Buttons: filled pill (primary), ghost (secondary), underline text (tertiary)
- Form inputs: bottom-border only, no box chrome
- Grain texture overlay (`opacity: 0.03`) on all pages
```

- [ ] **Step 2: Final build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` with no TypeScript errors. Fix any type errors before proceeding.

- [ ] **Step 3: Final visual run-through**

```bash
npm run dev
```

Check:
1. `http://localhost:3000` — scroll all 8 sections
2. `http://localhost:3000/login` — 40/60 split, bottom-border inputs, masonry panel
3. `http://localhost:3000/signup` — same layout, 3 fields, email-sent state (submit form)
4. Resize to 375px — landing hero single column, auth full-width form, masonry panel hidden

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add brand identity section to CLAUDE.md (Plans rebrand)"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Nav (Task 9)
- ✅ Hero + PolaroidStack (Tasks 5, 9)
- ✅ Feature strip (Task 9)
- ✅ Masonry showcase (Tasks 6, 10)
- ✅ How it works (Task 10)
- ✅ Share section + JoinCardPreview (Tasks 7, 11)
- ✅ Stats strip (Task 11)
- ✅ Quote (Task 11)
- ✅ Final CTA (Task 11)
- ✅ Footer (Task 11)
- ✅ Login split panel (Tasks 8, 12)
- ✅ Signup split panel (Tasks 8, 13)
- ✅ GrainOverlay (Task 4)
- ✅ MasonryCollage (Tasks 8, 12, 13)
- ✅ shadcn install (Task 1)
- ✅ Design tokens (Tasks 2, 3)
- ✅ Fonts (Task 3)
- ✅ CLAUDE.md brand update (Task 14)

**Type consistency check:**
- `MasonryCardData` defined in Task 6, consumed in Task 10 ✅
- `CollageCard` interface defined and used within `MasonryCollage.tsx` (Task 8) ✅
- `LOGIN_COLLAGE` / `SIGNUP_COLLAGE` match `CollageCard[]` shape ✅
- `PolaroidStack` has no external props — self-contained ✅
- `JoinCardPreview` has no external props — self-contained ✅

**Placeholder scan:** No TBDs, TODOs, or "similar to Task N" references found.
