import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Clock } from 'lucide-react'
import { UserAvatar } from '@/components/common/Avatar'
import type { PlanAttendee } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlanPendingPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select(`
      *,
      organiser:profiles!organiser_id(*),
      attendees:plan_attendees(*, profile:profiles!user_id(*))
    `)
    .eq('id', id)
    .single()

  if (planError) throw new Error(planError.message)
  if (!plan || plan.deleted_at) notFound()

  const isOrganiser = plan.organiser_id === user!.id
  const myAttendee = (plan.attendees as PlanAttendee[]).find(
    (a) => a.user_id === user!.id
  )
  const isPending = myAttendee?.status === 'pending'

  // If organiser, redirect to main plan page
  if (isOrganiser) {
    redirect(`/plans/${id}`)
  }

  // If not pending, redirect to main plan page
  if (!isPending) {
    redirect(`/plans/${id}`)
  }

  if (!myAttendee) {
    redirect(`/join/${plan.join_token}`)
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md px-4 space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        {/* Title and description */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-headline">Waiting for approval</h1>
          <p className="text-muted-foreground">
            {plan.organiser?.name || 'The organiser'} is reviewing your request to join this plan.
          </p>
        </div>

        {/* Plan preview */}
        <div className="bg-surface-container-lowest rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Plan</p>
            <p className="text-lg font-semibold mt-1">{plan.title}</p>
          </div>
          {plan.description && (
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          )}
        </div>

        {/* Organiser info */}
        {plan.organiser && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <UserAvatar
              url={plan.organiser.avatar_url}
              name={plan.organiser.name}
              size="sm"
            />
            <div className="text-left">
              <p className="text-xs text-muted-foreground">Organised by</p>
              <p className="font-medium">{plan.organiser.name}</p>
            </div>
          </div>
        )}

        {/* Status message */}
        <div className="text-sm text-muted-foreground pt-4 border-t">
          <p>You&apos;ll be notified when your request is approved or rejected.</p>
        </div>
      </div>
    </div>
  )
}
