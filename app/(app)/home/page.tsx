import { createClient } from '@/lib/supabase/server'
import { PlanCard } from '@/components/plan/PlanCard'
import { EmptyState } from '@/components/common/EmptyState'
import Link from 'next/link'
import { Plus } from 'lucide-react'
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
    .is('deleted_at', null)
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
      .is('deleted_at', null)
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
    <div className="pt-4">
      {/* Large headline */}
      <h1 className="font-headline text-6xl md:text-7xl lg:text-8xl font-bold text-foreground tracking-tight pt-8 pb-8">
        Your Plans
      </h1>

      {uniquePlans.length === 0 ? (
        <EmptyState
          title="No plans yet"
          description="Create your first plan to organise a trip or group activity."
          ctaLabel="Create a plan"
          ctaHref="/plans/new"
        />
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 mb-32">
          {uniquePlans.map((plan) => (
            <div key={plan.id} className="break-inside-avoid mb-8">
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
