import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { ManageTabs } from './ManageTabs'
import { ManageActions } from './ManageActions'
import { Calendar } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { Plan, PlanAttendee, GuestAttendee } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ManagePlanPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  // Check if current user is organiser
  if (plan.organiser_id !== user!.id) {
    redirect(`/plans/${id}`)
  }

  const startDate = plan.start_date ? new Date(plan.start_date) : null
  const dateRange = startDate
    ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No date set'

  const pendingAttendees = (plan.attendees as PlanAttendee[]).filter((a) => a.status === 'pending') || []
  const approvedAttendees = (plan.attendees as PlanAttendee[]).filter((a) => a.status === 'approved') || []

  // Fetch guest attendees for this plan
  const { data: guestAttendees } = await supabase
    .from('guest_attendees')
    .select('*')
    .eq('plan_id', id)
    .order('created_at', { ascending: false })

  // Calculate total cost
  const totalCost = (plan.items as Array<{ price: number }>|| []).reduce((sum: number, item) => sum + item.price, 0)
  const perPersonCost = approvedAttendees.length > 0 ? totalCost / approvedAttendees.length : 0

  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  const origin = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`
  const joinUrl = `${origin}/join/${plan.join_token}`

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Cover Image */}
        <div className="rounded-lg overflow-hidden bg-muted h-64 md:h-auto">
          {plan.cover_photo && (
            <Image
              src={plan.cover_photo}
              alt={plan.title}
              width={600}
              height={400}
              className="w-full h-full object-cover"
              priority
            />
          )}
        </div>

        {/* Plan Summary */}
        <div className="space-y-6 flex flex-col justify-between">
          <div>
            <div className="mb-3">
              <StatusBadge status={plan.status} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-on-surface -tracking-[0.04em] leading-tight">
              {plan.title}
            </h1>
          </div>

          <div className="space-y-3 text-sm text-on-surface-variant">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{dateRange}</span>
            </div>

            <div className="space-y-1">
              <p>{approvedAttendees.length} approved attendees</p>
              <p className="text-base font-headline text-on-surface">
                ${totalCost.toFixed(2)} total cost
              </p>
              {approvedAttendees.length > 0 && (
                <p className="text-xs text-on-surface-variant">
                  ${perPersonCost.toFixed(2)} per person
                </p>
              )}
            </div>
          </div>

          <ManageActions plan={plan as Plan} />
        </div>
      </div>

      {/* Tabs */}
      <ManageTabs
        plan={plan as Plan}
        planId={id}
        pendingAttendees={pendingAttendees}
        approvedAttendees={approvedAttendees}
        guestAttendees={(guestAttendees ?? []) as GuestAttendee[]}
        joinUrl={joinUrl}
      />
    </div>
  )
}
