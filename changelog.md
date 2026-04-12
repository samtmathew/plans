# Changelog

## Unreleased

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
