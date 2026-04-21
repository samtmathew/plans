import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ManageTabs } from './ManageTabs'
import { ArrowLeft, Settings2 } from 'lucide-react'
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

  const pendingAttendees = (plan.attendees as PlanAttendee[]).filter(
    (a) => a.status === 'pending' && a.joined_via !== 'organiser_added'
  ) || []
  const approvedAttendees = (plan.attendees as PlanAttendee[]).filter((a) => a.status === 'approved') || []

  // Fetch guest attendees for this plan
  const { data: guestAttendees } = await supabase
    .from('guest_attendees')
    .select('*')
    .eq('plan_id', id)
    .order('created_at', { ascending: false })

  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  const origin = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`
  const joinUrl = `${origin}/join/${plan.join_token}`

  return (
    <div className="pb-16 space-y-6">
      {/* Back link + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href={`/plans/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--plans-text-2)] hover:text-[var(--plans-text)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to plan
          </Link>
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-[var(--plans-text-2)]" />
            <h1 className="font-headline italic text-2xl text-[var(--plans-text)] leading-tight">
              {plan.title}
            </h1>
            <StatusBadge status={plan.status} />
          </div>
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
