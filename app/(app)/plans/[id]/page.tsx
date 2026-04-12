import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CostBreakdown } from '@/components/plan/CostBreakdown'
import { CopyLink } from '@/components/common/CopyLink'
import { StatusBadge } from '@/components/common/StatusBadge'
import { UserAvatar } from '@/components/common/Avatar'
import { AttendeeActions } from './AttendeeActions'
import { DeletePlanButton } from './DeletePlanButton'
import type { Plan, PlanAttendee } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlanDetailPage({ params }: Props) {
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

  const isOrganiser = plan.organiser_id === user!.id
  const myAttendee = (plan.attendees as PlanAttendee[]).find(
    (a) => a.user_id === user!.id
  )
  const isApprovedMember = isOrganiser || myAttendee?.status === 'approved'

  if (!isOrganiser && !myAttendee) {
    redirect(`/join/${plan.join_token}`)
  }

  const approvedAttendees = (plan.attendees as PlanAttendee[]).filter(
    (a) => a.status === 'approved'
  )
  const approvedCount = approvedAttendees.length

  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${plan.join_token}`
  const avatarStackAttendees = approvedAttendees.slice(0, 7)
  const extraCount = Math.max(0, approvedCount - 7)
  const galleryPhotos: string[] = plan.gallery_photos ?? []

  return (
    <div className="space-y-8 pb-16">
      {/* Cover photo */}
      {plan.cover_photo && (
        <div className="w-full aspect-square rounded-xl overflow-hidden -mx-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={plan.cover_photo} alt={plan.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold leading-snug">{plan.title}</h1>
          <div className="flex gap-1.5 shrink-0">
            <StatusBadge status={plan.status} />
            {isOrganiser && (
              <>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/plans/${id}/edit`}>Edit</Link>
                </Button>
                <DeletePlanButton planId={id} />
              </>
            )}
          </div>
        </div>
        <p className="text-muted-foreground">{plan.description}</p>
        {plan.organiser && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserAvatar url={plan.organiser.avatar_url} name={plan.organiser.name} size="sm" />
            <span>Organised by {plan.organiser.name}</span>
          </div>
        )}
      </div>

      {/* Pending attendee notice */}
      {!isApprovedMember && myAttendee?.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
          Waiting for organiser approval before you can see the full plan.
        </div>
      )}

      {isApprovedMember && (
        <>
          {/* Itinerary */}
          <section className="space-y-2">
            <h2 className="font-semibold">Itinerary</h2>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {plan.itinerary}
            </p>
          </section>

          <Separator />

          {/* Cost breakdown */}
          <section className="space-y-3">
            <h2 className="font-semibold">Cost breakdown</h2>
            <CostBreakdown
              items={(plan.items ?? []).map((i: import('@/types').PlanItem) => ({
                id: i.id,
                title: i.title,
                price: i.price,
                pricing_type: i.pricing_type,
                description: i.description,
                sort_order: i.sort_order,
              }))}
              approvedAttendeeCount={approvedCount}
              readOnly
            />
          </section>

          {/* Gallery */}
          {galleryPhotos.length > 0 && (
            <>
              <Separator />
              <section className="space-y-3">
                <h2 className="font-semibold">Gallery</h2>
                <div className="grid grid-cols-3 gap-2">
                  {galleryPhotos.map((url, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          <Separator />

          {/* Attendees */}
          <section className="space-y-4">
            <h2 className="font-semibold">Attendees</h2>

            {/* Avatar stack */}
            {approvedCount > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {avatarStackAttendees.map((a) => (
                    <Link
                      key={a.id}
                      href={`/profile/${a.user_id}`}
                      className="block rounded-full ring-2 ring-background"
                    >
                      <UserAvatar
                        url={a.profile?.avatar_url}
                        name={a.profile?.name ?? '?'}
                        size="sm"
                      />
                    </Link>
                  ))}
                </div>
                {extraCount > 0 && (
                  <span className="text-sm text-muted-foreground">+{extraCount} more</span>
                )}
                <span className="text-sm text-muted-foreground">
                  {approvedCount} {approvedCount === 1 ? 'going' : 'going'}
                </span>
              </div>
            )}

            {/* Attendee list + actions */}
            <AttendeeActions
              plan={plan as unknown as Plan}
              isOrganiser={isOrganiser}
              currentUserId={user!.id}
            />

            {/* Join link */}
            {(isOrganiser || (plan.join_token && myAttendee?.status === 'approved')) && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Share this plan</p>
                <CopyLink url={joinUrl} />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
