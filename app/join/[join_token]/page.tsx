import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { calcEstimatedPerPerson } from '@/lib/utils/cost'
import { JoinCard } from '@/components/join/JoinCard'
import type { PlanAttendee, PlanItem, PlanPreviewData } from '@/types'

interface Props {
  params: Promise<{ join_token: string }>
}

export default async function JoinPage({ params }: Props) {
  const { join_token } = await params
  const supabase = await createClient()

  // Check if a user is logged in (optional — redirect authenticated users who already belong)
  const { data: { user } } = await supabase.auth.getUser()

  // Existing RLS policy "plans: join token read" permits anon SELECT by join_token
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*, organiser:profiles!organiser_id(*), attendees:plan_attendees(*), items:plan_items(*)')
    .eq('join_token', join_token)
    .single()

  if (planError || !plan || plan.deleted_at) {
    notFound()
  }

  // Authenticated organiser → send to their plan page
  if (user && plan.organiser_id === user.id) {
    redirect(`/plans/${plan.id}`)
  }

  // Authenticated existing attendee → send to plan view
  if (user) {
    const existing = (plan.attendees as PlanAttendee[])?.find((a) => a.user_id === user.id)
    if (existing) {
      redirect(`/plans/${plan.id}`)
    }
  }

  if (plan.status === 'closed') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold">This plan is closed</h1>
          <p className="text-muted-foreground text-sm">It&apos;s no longer accepting new members.</p>
          <Button asChild variant="outline">
            <Link href="/home">Go home</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (plan.status === 'draft') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold">This plan isn&apos;t public yet</h1>
          <p className="text-muted-foreground text-sm">The organiser hasn&apos;t published it.</p>
          <Button asChild variant="outline">
            <Link href="/home">Go home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const approvedAttendees = (plan.attendees as PlanAttendee[])?.filter(
    (a) => a.status === 'approved'
  ) ?? []
  const planItems = (plan.items as PlanItem[]) ?? []
  const costPerPerson = calcEstimatedPerPerson(planItems, approvedAttendees.length)

  const previewData: PlanPreviewData = {
    id: plan.id,
    title: plan.title,
    description: plan.description ?? null,
    cover_photo: plan.cover_photo ?? null,
    start_date: plan.start_date ?? null,
    join_approval: plan.join_approval,
    organiser: {
      name: plan.organiser?.name ?? 'Organiser',
      avatar_url: plan.organiser?.avatar_url ?? null,
    },
    approved_count: approvedAttendees.length,
    cost_per_person: costPerPerson,
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-8 pb-16 px-4">
      <JoinCard plan={previewData} joinToken={join_token} />
    </div>
  )
}
