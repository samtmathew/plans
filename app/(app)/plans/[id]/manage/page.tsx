import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ManageTabs } from './ManageTabs'
import { ArrowLeft } from 'lucide-react'
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

  if (plan.organiser_id !== user!.id) {
    redirect(`/plans/${id}`)
  }

  const pendingAttendees = (plan.attendees as PlanAttendee[]).filter(
    (a) => a.status === 'pending' && a.joined_via !== 'organiser_added'
  ) || []
  const approvedAttendees = (plan.attendees as PlanAttendee[]).filter((a) => a.status === 'approved') || []

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
    <div className="max-w-[1100px] mx-auto px-6 pb-32 pt-6">
      <div className="mb-3">
        <Link
          href={`/plans/${id}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--plans-text-2)] hover:text-[var(--plans-text)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Back to plan
        </Link>
      </div>

      <div className="mb-8 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="text-[10px] font-semibold uppercase text-[var(--plans-text-2)] mb-2" style={{ letterSpacing: '0.18em' }}>
            Managing
          </div>
          <h1 className="font-headline italic font-normal text-[var(--plans-text)] leading-[1.05]" style={{ fontSize: 'clamp(32px, 4.5vw, 44px)', letterSpacing: '-0.01em' }}>
            {plan.title}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/plans/${id}`}
            className="inline-flex items-center rounded-full border border-[var(--plans-divider)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--plans-text)] hover:border-[var(--plans-text)] transition-colors"
          >
            Preview as guest
          </Link>
        </div>
      </div>

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
