import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'
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
  const user = await getAuthenticatedUser()
  const supabase = await createClient()

  const [organiserResult, attendeeResult] = await Promise.all([
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
  ])

  if (organiserResult.error) console.error('organiserPlans error:', organiserResult.error.message)
  if (attendeeResult.error) console.error('attendeePlans error:', attendeeResult.error.message)

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
