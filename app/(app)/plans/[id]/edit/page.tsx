import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PlanEditForm } from './PlanEditForm'
import type { Plan } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPlanPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: plan } = await supabase
    .from('plans')
    .select('*, items:plan_items(*), attendees:plan_attendees(*, profile:profiles(*))')
    .eq('id', id)
    .single()

  if (!plan) notFound()
  if (plan.organiser_id !== user!.id) redirect(`/plans/${id}`)

  return (
    <div className="space-y-6 pb-16">
      <h1 className="text-xl font-semibold">Edit plan</h1>
      <PlanEditForm plan={plan as unknown as Plan} />
    </div>
  )
}
