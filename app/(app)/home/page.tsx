import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { PlanCard } from '@/components/plan/PlanCard'
import { EmptyState } from '@/components/common/EmptyState'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { InvitesSection } from '@/components/plan/InvitesSection'
import { PendingPlansSection } from '@/components/plan/PendingPlansSection'
import type { Plan, InviteWithPlan } from '@/types'
import type { PendingPlan } from '@/components/plan/PendingPlansSection'

const PLAN_SELECT = `
  *,
  organiser:profiles!organiser_id(*),
  attendees:plan_attendees(*, profile:profiles!user_id(*))
`

export default async function HomePage() {
  const user = await getAuthenticatedUser()
  const supabase = await createClient()

  const [organiserResult, attendeeResult, inviteResult, pendingLinkResult] = await Promise.all([
    supabase
      .from('plans')
      .select(PLAN_SELECT)
      .eq('organiser_id', user!.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false }),

    supabase
      .from('plan_attendees')
      .select(`plan:plans(${PLAN_SELECT})`)
      .eq('user_id', user!.id)
      .eq('status', 'approved')
      .neq('role', 'organiser'),

    supabase
      .from('plan_attendees')
      .select(`
        id,
        plan:plans!plan_id(id, title, cover_photo, start_date, organiser:profiles!organiser_id(name, avatar_url))
      `)
      .eq('user_id', user!.id)
      .eq('status', 'pending')
      .eq('joined_via', 'organiser_added')
      .order('created_at', { ascending: false }),

    supabase
      .from('plan_attendees')
      .select(`
        id,
        plan:plans!plan_id(id, title, cover_photo, start_date, organiser:profiles!organiser_id(name, avatar_url))
      `)
      .eq('user_id', user!.id)
      .eq('status', 'pending')
      .eq('joined_via', 'invite_link')
      .order('created_at', { ascending: false }),
  ])

  if (organiserResult.error) console.error('organiserPlans error:', organiserResult.error.message)
  if (attendeeResult.error) console.error('attendeePlans error:', attendeeResult.error.message)
  if (inviteResult.error) console.error('invites error:', inviteResult.error.message)
  if (pendingLinkResult.error) console.error('pendingLink error:', pendingLinkResult.error.message)

  type RawInviteRow = {
    id: string
    plan: {
      id: string
      title: string
      cover_photo: string | null
      start_date: string | null
      organiser: { name: string; avatar_url: string | null } | null
    } | null
  }

  const rawInvites = (inviteResult.data ?? []) as unknown as RawInviteRow[]
  const invites: InviteWithPlan[] = rawInvites.map((row) => {
    const plan = row.plan
    const organiser = plan?.organiser ?? null
    return {
      attendee_id: row.id,
      plan: {
        id: plan?.id ?? '',
        title: plan?.title ?? '',
        cover_photo: plan?.cover_photo ?? null,
        start_date: plan?.start_date ?? null,
      },
      organiser: {
        name: organiser?.name ?? 'Organiser',
        avatar_url: organiser?.avatar_url ?? null,
      },
    }
  })

  type RawPendingRow = {
    id: string
    plan: {
      id: string
      title: string
      cover_photo: string | null
      start_date: string | null
      organiser: { name: string; avatar_url: string | null } | null
    } | null
  }

  const rawPending = (pendingLinkResult.data ?? []) as unknown as RawPendingRow[]
  const pendingLinkPlans: PendingPlan[] = rawPending
    .filter((r) => r.plan !== null)
    .map((r) => ({
      attendee_id: r.id,
      plan: {
        id: r.plan!.id,
        title: r.plan!.title,
        cover_photo: r.plan!.cover_photo,
        start_date: r.plan!.start_date,
      },
      organiser: {
        name: r.plan!.organiser?.name ?? 'Organiser',
        avatar_url: r.plan!.organiser?.avatar_url ?? null,
      },
    }))

  const organiserPlans = (organiserResult.data ?? []) as Plan[]
  const attendeePlans = (attendeeResult.data ?? [])
    .map((r) => (r.plan as unknown as Plan | null))
    .filter((p): p is Plan => p !== null && p.deleted_at === null)

  const allPlans = [
    ...(organiserPlans ?? []),
    ...attendeePlans,
  ] as Plan[]

  const seen = new Set<string>()
  const uniquePlans = allPlans.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
  uniquePlans.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )

  return (
    <div className="pt-4">
      {/* Large headline */}
      <h1 className="font-headline text-6xl md:text-7xl lg:text-8xl font-bold text-foreground tracking-tight pt-8 pb-8">
        Your Plans
      </h1>

      {invites.length > 0 && (
        <InvitesSection initialInvites={invites} />
      )}

      {pendingLinkPlans.length > 0 && (
        <PendingPlansSection plans={pendingLinkPlans} />
      )}

      {uniquePlans.length === 0 ? (
        <EmptyState
          title="No plans yet"
          description="Create your first plan to organise a trip or group activity."
          ctaLabel="Create a plan"
          ctaHref="/plans/new"
        />
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 mb-32">
          {uniquePlans.map((plan) => (
            <div key={plan.id} className="break-inside-avoid mb-4">
              <PlanCard plan={plan} />
            </div>
          ))}
        </div>
      )}

      {/* FAB button */}
      <Link
        href="/plans/new"
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  )
}
