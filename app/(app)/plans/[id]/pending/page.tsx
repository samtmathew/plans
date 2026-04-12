import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/common/StatusBadge'
import { calcEstimatedPerPerson, calcPerHeadTotal, calcGroupShareTotal } from '@/lib/utils/cost'
import { formatCurrency } from '@/lib/utils/format'
import type { Plan, PlanAttendee, PlanItem } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlanPendingPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select(`
      *,
      organiser:profiles!organiser_id(*),
      attendees:plan_attendees(*, profile:profiles!user_id(*)),
      items:plan_items(*)
    `)
    .eq('id', id)
    .single()

  if (planError) throw new Error(planError.message)
  if (!plan || plan.deleted_at) notFound()

  const isOrganiser = plan.organiser_id === user.id
  const myAttendee = (plan.attendees as PlanAttendee[]).find(
    (a) => a.user_id === user.id
  )

  // If organiser, redirect to main plan page
  if (isOrganiser) {
    redirect(`/plans/${id}`)
  }

  // If not an attendee, redirect to join page
  if (!myAttendee) {
    redirect(`/join/${plan.join_token}`)
  }

  const approvedAttendees = (plan.attendees as PlanAttendee[]).filter(
    (a) => a.status === 'approved'
  )
  const approvedCount = approvedAttendees.length

  // If rejected, show rejection message
  if (myAttendee.status === 'rejected') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md space-y-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl md:text-6xl font-bold font-headline text-on-surface -tracking-[0.04em]">
              Application Declined
            </h1>
            <p className="text-base text-on-surface-variant">
              Unfortunately, your application to join this plan was not approved. You can try requesting again or contact the organiser.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/home" className="inline-flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // If already approved, redirect to plan detail
  if (myAttendee.status === 'approved') {
    redirect(`/plans/${id}`)
  }

  // User has pending approval
  const startDate = plan.start_date ? new Date(plan.start_date) : null
  const endDate = plan.end_date ? new Date(plan.end_date) : null

  let dateRange = 'Dates TBA'
  if (startDate) {
    dateRange = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (endDate && endDate.getTime() !== startDate.getTime()) {
      dateRange += ` – ${endDate!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    }
  }

  // Calculate cost per person
  const planItems = (plan.items as PlanItem[]) || []
  const costPerPerson = calcEstimatedPerPerson(planItems, Math.max(approvedCount, 1))

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4 py-12">
      <div className="text-center max-w-2xl space-y-8">
        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-headline text-on-surface -tracking-[0.04em] leading-tight">
            Waiting for approval
          </h1>
          <p className="text-base md:text-lg text-on-surface-variant max-w-xl mx-auto">
            The organiser is reviewing attendees. We&apos;ll notify you once you&apos;re approved!
          </p>
        </div>

        {/* Plan Preview Card */}
        <div className="space-y-6 p-6 md:p-8 bg-surface-container rounded-xl max-w-md mx-auto w-full border border-outline-variant/30">
          {/* Cover Image */}
          {plan.cover_photo && (
            <div className="rounded-lg overflow-hidden -mx-6 md:-mx-8 w-[calc(100%+3rem)] md:w-[calc(100%+4rem)]">
              <Image
                src={plan.cover_photo}
                alt={plan.title}
                width={400}
                height={300}
                className="w-full aspect-video object-cover grayscale opacity-80"
              />
            </div>
          )}

          {/* Status Badge & Title */}
          <div className="space-y-3 text-left">
            <div>
              <span className="inline-block bg-surface rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                Pending Approval
              </span>
              <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-surface -tracking-[0.04em] leading-tight">
                {plan.title}
              </h2>
            </div>

            {/* Plan Details */}
            <div className="space-y-2 text-sm text-on-surface-variant pt-2 border-t border-outline-variant/30">
              {dateRange !== 'Dates TBA' && (
                <p className="flex items-center gap-2">
                  <span>📅</span>
                  <span>{dateRange}</span>
                </p>
              )}
              <p className="flex items-center gap-2">
                <span>👥</span>
                <span>{approvedCount} {approvedCount === 1 ? 'attendee' : 'attendees'} approved</span>
              </p>
              <p className="flex items-center gap-2 pt-1 font-medium text-on-surface">
                <span>💰</span>
                <span>{formatCurrency(costPerPerson)}/person</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 max-w-xs mx-auto">
          <Button disabled className="w-full" title="Available once approved">
            View Full Plan
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/home" className="inline-flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Refresh Info */}
        <p className="text-xs text-on-surface-variant">
          Page auto-refreshes — check back soon
        </p>
      </div>
    </div>
  )
}
