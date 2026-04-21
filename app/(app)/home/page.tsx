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

function formatGreetingDate(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default async function HomePage() {
  const user = await getAuthenticatedUser()
  const supabase = await createClient()

  const [organiserResult, attendeeResult, inviteResult, pendingLinkResult, profileResult] = await Promise.all([
    supabase.from('plans').select(PLAN_SELECT).eq('organiser_id', user!.id).is('deleted_at', null).order('updated_at', { ascending: false }),
    supabase.from('plan_attendees').select(`plan:plans(${PLAN_SELECT})`).eq('user_id', user!.id).eq('status', 'approved').neq('role', 'organiser'),
    supabase.from('plan_attendees').select(`id, plan:plans!plan_id(id, title, cover_photo, start_date, organiser:profiles!organiser_id(name, avatar_url))`).eq('user_id', user!.id).eq('status', 'pending').eq('joined_via', 'organiser_added').order('created_at', { ascending: false }),
    supabase.from('plan_attendees').select(`id, plan:plans!plan_id(id, title, cover_photo, start_date, organiser:profiles!organiser_id(name, avatar_url))`).eq('user_id', user!.id).eq('status', 'pending').eq('joined_via', 'invite_link').order('created_at', { ascending: false }),
    supabase.from('profiles').select('name').eq('id', user!.id).single(),
  ])

  if (organiserResult.error) console.error('organiserPlans error:', organiserResult.error.message)
  if (attendeeResult.error) console.error('attendeePlans error:', attendeeResult.error.message)
  if (inviteResult.error) console.error('invites error:', inviteResult.error.message)
  if (pendingLinkResult.error) console.error('pendingLink error:', pendingLinkResult.error.message)

  const firstName = (profileResult.data?.name ?? '').split(' ')[0] || 'there'

  type RawInviteRow = { id: string; plan: { id: string; title: string; cover_photo: string | null; start_date: string | null; organiser: { name: string; avatar_url: string | null } | null } | null }
  const rawInvites = (inviteResult.data ?? []) as unknown as RawInviteRow[]
  const invites: InviteWithPlan[] = rawInvites.map((row) => ({
    attendee_id: row.id,
    plan: { id: row.plan?.id ?? '', title: row.plan?.title ?? '', cover_photo: row.plan?.cover_photo ?? null, start_date: row.plan?.start_date ?? null },
    organiser: { name: row.plan?.organiser?.name ?? 'Organiser', avatar_url: row.plan?.organiser?.avatar_url ?? null },
  }))

  type RawPendingRow = RawInviteRow
  const rawPending = (pendingLinkResult.data ?? []) as unknown as RawPendingRow[]
  const pendingLinkPlans: PendingPlan[] = rawPending
    .filter((r) => r.plan !== null)
    .map((r) => ({
      attendee_id: r.id,
      plan: { id: r.plan!.id, title: r.plan!.title, cover_photo: r.plan!.cover_photo, start_date: r.plan!.start_date },
      organiser: { name: r.plan!.organiser?.name ?? 'Organiser', avatar_url: r.plan!.organiser?.avatar_url ?? null },
    }))

  const organiserPlans = (organiserResult.data ?? []) as Plan[]
  const attendeePlans = (attendeeResult.data ?? []).map((r) => (r.plan as unknown as Plan | null)).filter((p): p is Plan => p !== null && p.deleted_at === null)

  const seen = new Set<string>()
  const uniquePlans = [...organiserPlans, ...attendeePlans].filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
  uniquePlans.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  return (
    <div className="pb-24">
      {/* Greeting */}
      <div className="pt-6 pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-[var(--plans-text-2)] mb-2">
          {formatGreetingDate()}
        </p>
        <h1 className="font-headline italic text-5xl md:text-6xl text-[var(--plans-text)] leading-[1.1]">
          Hey, {firstName}.
        </h1>
      </div>

      {/* Invite strip */}
      {invites.length > 0 && (
        <InvitesSection initialInvites={invites} />
      )}

      {pendingLinkPlans.length > 0 && (
        <div className="mb-8">
          <PendingPlansSection plans={pendingLinkPlans} />
        </div>
      )}

      {/* Plans eyebrow + count */}
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-[var(--plans-text-2)]">
          Your plans
        </p>
        {uniquePlans.length > 0 && (
          <span className="text-[11px] text-[var(--plans-text-2)]">{uniquePlans.length}</span>
        )}
      </div>

      {uniquePlans.length === 0 ? (
        <EmptyState
          title="No plans yet."
          description="Create your first plan to organise a trip or group activity."
          ctaLabel="Create a plan"
          ctaHref="/plans/new"
        />
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
          {uniquePlans.map((plan) => (
            <div key={plan.id} className="break-inside-avoid mb-5">
              <PlanCard plan={plan} />
            </div>
          ))}
        </div>
      )}

      {/* FAB with tooltip */}
      <div className="fixed bottom-8 right-8 group/fab flex items-center">
        <div className="mr-3 opacity-0 group-hover/fab:opacity-100 transition-opacity duration-150 pointer-events-none">
          <span className="bg-[var(--plans-text)] text-white text-xs font-medium rounded-full px-3 py-1.5 whitespace-nowrap shadow-md">
            New plan
          </span>
        </div>
        <Link
          href="/plans/new"
          className="w-[52px] h-[52px] bg-[var(--plans-text)] hover:bg-[var(--plans-text)]/90 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>
    </div>
  )
}
