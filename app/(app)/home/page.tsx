import { createClient } from '@/lib/supabase/server'
import { PlanCard } from '@/components/plan/PlanCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Plan } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch plans where user is organiser or attendee
  // (initial broad fetch unused — see simpler approach below)
  await supabase
    .from('plans')
    .select(`
      *,
      organiser:profiles!organiser_id(*),
      attendees:plan_attendees(
        *,
        profile:profiles(*)
      ),
      items:plan_items(*)
    `)
    .or(
      `organiser_id.eq.${user!.id},id.in.(${
        // subquery workaround: fetch attendee plan_ids first
        'select:plan_id'
      })`
    )
    .order('updated_at', { ascending: false })

  // Simpler approach: fetch organiser plans + attendee plans separately
  const { data: organiserPlans } = await supabase
    .from('plans')
    .select(`
      *,
      organiser:profiles!organiser_id(*),
      attendees:plan_attendees(*, profile:profiles(*)),
      items:plan_items(*)
    `)
    .eq('organiser_id', user!.id)
    .order('updated_at', { ascending: false })

  const { data: attendeeRows } = await supabase
    .from('plan_attendees')
    .select('plan_id')
    .eq('user_id', user!.id)
    .eq('status', 'approved')
    .neq('role', 'organiser')

  const attendeePlanIds = (attendeeRows ?? []).map((r) => r.plan_id)

  let attendeePlans: Plan[] = []
  if (attendeePlanIds.length > 0) {
    const { data } = await supabase
      .from('plans')
      .select(`
        *,
        organiser:profiles!organiser_id(*),
        attendees:plan_attendees(*, profile:profiles(*)),
        items:plan_items(*)
      `)
      .in('id', attendeePlanIds)
      .order('updated_at', { ascending: false })
    attendeePlans = (data ?? []) as Plan[]
  }

  // Merge + deduplicate + sort
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your Plans</h1>
        <Button asChild size="sm">
          <Link href="/plans/new">Create plan</Link>
        </Button>
      </div>

      {uniquePlans.length === 0 ? (
        <EmptyState
          title="No plans yet"
          description="Create your first plan to organise a trip or group activity."
          ctaLabel="Create a plan"
          ctaHref="/plans/new"
        />
      ) : (
        <div className="space-y-3">
          {uniquePlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} currentUserId={user!.id} />
          ))}
        </div>
      )}
    </div>
  )
}
