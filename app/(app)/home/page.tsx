import { createClient } from '@/lib/supabase/server'
import { PlanCard } from '@/components/plan/PlanCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Plan } from '@/types'

const PLAN_SELECT = `
  *,
  organiser:profiles!organiser_id(*),
  attendees:plan_attendees(*, profile:profiles!user_id(*))
`

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: organiserPlans, error: organiserError } = await supabase
    .from('plans')
    .select(PLAN_SELECT)
    .eq('organiser_id', user!.id)
    .order('updated_at', { ascending: false })

  if (organiserError) console.error('organiserPlans error:', organiserError.message)

  const { data: attendeeRows } = await supabase
    .from('plan_attendees')
    .select('plan_id')
    .eq('user_id', user!.id)
    .eq('status', 'approved')
    .neq('role', 'organiser')

  const attendeePlanIds = (attendeeRows ?? []).map((r) => r.plan_id)

  let attendeePlans: Plan[] = []
  if (attendeePlanIds.length > 0) {
    const { data, error } = await supabase
      .from('plans')
      .select(PLAN_SELECT)
      .in('id', attendeePlanIds)
      .order('updated_at', { ascending: false })
    if (error) console.error('attendeePlans error:', error.message)
    attendeePlans = (data ?? []) as Plan[]
  }

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
        <div className="grid grid-cols-2 gap-3">
          {uniquePlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} currentUserId={user!.id} />
          ))}
        </div>
      )}
    </div>
  )
}
