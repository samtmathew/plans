# Changelog

## Unreleased

### 2026-04-12
- feat: rewrite `PlanCard` with shift-reveal hover animation and deterministic organic per-card rotation (`components/plan/PlanCard.tsx`)
- feat: add `--shadow-card` CSS token and `.plan-card-rot` rotation utility to `app/globals.css`
- feat: tighten home page masonry grid gap for organic collage layout (`app/(app)/home/page.tsx`)
- feat: apply `shadow-[var(--shadow-card)]` to join page card surfaces (`JoinCardPreviewFace.tsx`, `JoinStatusCard.tsx`)
- fix: align `PlanCard` body spacing and document `plan-card-rot` transition ownership
- fix: resolve 7 ESLint errors blocking Vercel build — unused vars in `manage/page.tsx`, `JoinStatusCard.tsx`, `bg-animate-button.tsx`, `text-animate.tsx`; unescaped entity in `PublicProfileContent.tsx`
- fix: filter `undefined` from `initialAttendees` in `PlanEditForm.tsx` to prevent TypeScript type error
- docs: add card redesign spec and implementation plan (`docs/superpowers/plans/`)

### 2026-04-11 (session 2 — delete, media, edit fixes)
- fix: `CostBreakdown` passed as a Server Component prop (`onChange={() => {}}`) caused "event handlers cannot be passed to Client Component" error on plan detail page — made `onChange` optional and removed the no-op prop
- fix: plan edit `PUT` route was silently swallowing item insert errors and spreading old `id` fields onto re-inserted rows — strip `id` before insert, add error propagation for both delete and insert steps
- fix: edit form redirected to plan detail after save instead of `/home` — now matches publish flow
- feat: soft-delete plans — `DELETE /api/plans/[id]` sets `deleted_at` timestamp; plan is hidden from dashboard, 404 on direct URL, and blocked on join page; row preserved for history and compliance
- feat: `DeletePlanButton` component — trash icon next to Edit with `AlertDialog` confirmation; only visible to organiser (`app/(app)/plans/[id]/DeletePlanButton.tsx`)
- feat: cover photo upload — square 96×96 uploader inline with Title field in Basics section; stored in `plan-covers` bucket; displayed full-width at top of plan detail
- feat: gallery upload — multi-image grid section between Cost breakdown and Attendees in create/edit forms; stored in `plan-gallery` bucket; rendered as 3-column grid on plan detail
- feat: `CoverPhotoUpload` component (`components/plan/CoverPhotoUpload.tsx`)
- feat: `GalleryUpload` component (`components/plan/GalleryUpload.tsx`)
- feat: `SQL_CHANGELOG.md` — dated record of all schema changes, RLS policies, and storage policies
- chore: add `alert-dialog` shadcn component (`components/ui/alert-dialog.tsx`)
- chore: update `claude.md` with SQL documentation rule and reference to `SQL_CHANGELOG.md`
- chore: `schema.sql` updated — added `deleted_at TIMESTAMPTZ`, `cover_photo TEXT`, `gallery_photos TEXT[]` to `plans` table
- chore: `types/index.ts` updated — `Plan` type includes `deleted_at`, `cover_photo`, `gallery_photos`
- chore: `lib/validations/plan.ts` updated — `createPlanSchema` includes `cover_photo` and `gallery_photos`
- chore: home page queries filter `deleted_at IS NULL` for both organiser and attendee plan lists

### 2026-04-11
- fix: add `forwardRef` to `components/ui/textarea.tsx` so React Hook Form can read its value (was returning `undefined`, causing Zod validation errors on description and itinerary fields)
- fix: add complete `defaultValues` to plan creation form (`title`, `description`, `itinerary`, `start_date`) to prevent Zod v4 rejecting `undefined` on uncontrolled fields
- fix: infinite recursion in Supabase RLS — introduced `public.is_plan_organiser()` and `public.is_approved_plan_attendee()` SECURITY DEFINER helper functions; rewrote `plans: attendee read`, `plan_attendees: organiser all`, and `plan_attendees: approved attendees read approved` policies to use them
- fix: ambiguous PostgREST FK embed error ("more than one relationship found for plan_attendees and profiles") — added `!user_id` hint to all `profile:profiles` embeds in `home/page.tsx`, `plans/[id]/page.tsx`, `plans/[id]/edit/page.tsx`, and `api/plans/[id]/route.ts`
- fix: plan detail page was silently swallowing Supabase errors as 404 — now throws on `planError` to surface the real message
- fix: remove dead broad-fetch query and `items:plan_items(*)` embed from `home/page.tsx` — the items embed was triggering an RLS error that nulled the entire response
- feat: add `start_date DATE` column to `plans` table (`schema.sql`, `types/index.ts`, `lib/validations/plan.ts`)
- feat: add date picker field to plan create form (`plans/new/page.tsx`) and edit form (`PlanEditForm.tsx`)
- feat: add status select (draft/active) and join_approval toggle to plan edit form (`PlanEditForm.tsx`)
- feat: redirect to `/home` + `router.refresh()` after publishing a plan instead of going to plan detail
- feat: redesign `PlanCard` to Pinterest-style 2-column grid card — shows status colour strip, date, cost per person, description snippet, organiser/attendee badge, and attendee count
- feat: update home page layout from vertical list to `grid grid-cols-2`
- chore: add Testing Protocol and Dev Environment sections to `claude.md`
