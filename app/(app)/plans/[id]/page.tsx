import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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
  const isPending = !isOrganiser && myAttendee?.status === 'pending'

  if (!isOrganiser && !myAttendee) {
    redirect(`/join/${plan.join_token}`)
  }

  // If pending, redirect to pending page
  if (isPending) {
    redirect(`/plans/${id}/pending`)
  }

  const approvedAttendees = (plan.attendees as PlanAttendee[]).filter(
    (a) => a.status === 'approved'
  )
  const approvedCount = approvedAttendees.length

  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${plan.join_token}`
  const avatarStackAttendees = approvedAttendees.slice(0, 7)
  const extraCount = Math.max(0, approvedCount - 7)
  const galleryPhotos: string[] = plan.gallery_photos ?? []
  const planItems = (plan.items ?? []).map((i: import('@/types').PlanItem) => ({
    id: i.id,
    title: i.title,
    price: i.price,
    pricing_type: i.pricing_type,
    description: i.description,
    sort_order: i.sort_order,
  }))

  // Organiser view
  if (isOrganiser) {
    return (
      <div className="space-y-8 pb-16">
        {/* Cover photo */}
        {plan.cover_photo && (
          <div className="w-full aspect-video rounded-lg overflow-hidden -mx-4 md:mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={plan.cover_photo} alt={plan.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Header with title and actions */}
        <div className="space-y-4">
          {/* Title and action buttons */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight leading-tight mb-2">
                {plan.title}
              </h1>
              {plan.description && (
                <p className="text-base text-muted-foreground max-w-2xl">{plan.description}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button asChild size="sm" variant="outline">
                <Link href={`/plans/${id}/manage`}>Manage</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/plans/${id}/edit`}>Edit</Link>
              </Button>
              <DeletePlanButton planId={id} />
            </div>
          </div>

          {/* Breadcrumb metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground border-y py-2">
            <StatusBadge status={plan.status} />
            {plan.start_date && (
              <span>{new Date(plan.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            )}
          </div>

          {/* Attendee strip */}
          {approvedCount > 0 && (
            <div className="flex items-center gap-4 border-y py-3">
              <div className="flex -space-x-2">
                {avatarStackAttendees.map((a) => (
                  <Link
                    key={a.id}
                    href={`/profile/${a.user_id}`}
                    className="block rounded-full ring-2 ring-background hover:ring-primary transition-colors"
                  >
                    <UserAvatar
                      url={a.profile?.avatar_url}
                      name={a.profile?.name ?? '?'}
                      size="sm"
                    />
                  </Link>
                ))}
              </div>
              <div className="text-sm">
                <span className="font-medium">
                  {approvedCount} {approvedCount === 1 ? 'person going' : 'people going'}
                </span>
                {extraCount > 0 && (
                  <span className="text-muted-foreground"> +{extraCount} more</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Organiser content: full itinerary, costs, gallery, attendees */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Itinerary</h2>
          {plan.itinerary ? (
            <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap leading-relaxed text-foreground">
              {plan.itinerary}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No itinerary added yet.</p>
          )}
        </section>

        {/* Cost breakdown */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Cost breakdown</h2>
          <div className="bg-surface-container-lowest rounded-lg p-4">
            <CostBreakdown
              items={planItems}
              approvedAttendeeCount={approvedCount}
              readOnly
            />
          </div>
        </section>

        {/* Gallery */}
        {galleryPhotos.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {galleryPhotos.map((url, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Attendees section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Attendees</h2>
          <AttendeeActions
            plan={plan as unknown as Plan}
            isOrganiser={isOrganiser}
            currentUserId={user!.id}
          />
          {plan.join_token && (
            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium">Share this plan</p>
              <CopyLink url={joinUrl} />
            </div>
          )}
        </section>
      </div>
    )
  }

  // Attendee view
  return (
    <div className="space-y-8 pb-16">
      {/* Cover photo */}
      {plan.cover_photo && (
        <div className="w-full aspect-video rounded-lg overflow-hidden -mx-4 md:mx-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={plan.cover_photo} alt={plan.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="space-y-4">
        {/* Title and organiser */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight leading-tight mb-2">
            {plan.title}
          </h1>
          {plan.description && (
            <p className="text-base text-muted-foreground max-w-2xl">{plan.description}</p>
          )}
          {plan.organiser && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
              <UserAvatar url={plan.organiser.avatar_url} name={plan.organiser.name} size="sm" />
              <span>Organised by {plan.organiser.name}</span>
            </div>
          )}
        </div>

        {/* Breadcrumb metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground border-y py-2">
          {plan.start_date && (
            <span>{new Date(plan.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          )}
        </div>

        {/* Attendee strip */}
        {approvedCount > 0 && (
          <div className="flex items-center gap-4 border-y py-3">
            <div className="flex -space-x-2">
              {avatarStackAttendees.map((a) => (
                <Link
                  key={a.id}
                  href={`/profile/${a.user_id}`}
                  className="block rounded-full ring-2 ring-background hover:ring-primary transition-colors"
                >
                  <UserAvatar
                    url={a.profile?.avatar_url}
                    name={a.profile?.name ?? '?'}
                    size="sm"
                  />
                </Link>
              ))}
            </div>
            <div className="text-sm">
              <span className="font-medium">
                {approvedCount} {approvedCount === 1 ? 'person going' : 'people going'}
              </span>
              {extraCount > 0 && (
                <span className="text-muted-foreground"> +{extraCount} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 12-column layout: itinerary (8) + sticky costs sidebar (4) on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Itinerary - 8 columns on desktop */}
        <div className="md:col-span-8 space-y-4">
          <h2 className="text-lg font-semibold">Itinerary</h2>
          {plan.itinerary ? (
            <div className="space-y-4">
              {/* Timeline itinerary with left border and circles */}
              <div className="relative pl-6">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border"></div>
                <div className="space-y-6">
                  {plan.itinerary.split('\n').filter((line: string) => line.trim()).map((line: string, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-primary"></div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                        {line}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No itinerary available.</p>
          )}
        </div>

        {/* Sticky costs sidebar - 4 columns on desktop */}
        <div className="md:col-span-4">
          <div className="md:sticky md:top-20 space-y-4">
            <h2 className="text-lg font-semibold">Costs</h2>
            <div className="bg-surface-container-lowest rounded-lg p-4">
              {planItems.length > 0 ? (
                <CostBreakdown
                  items={planItems}
                  approvedAttendeeCount={approvedCount}
                  readOnly
                />
              ) : (
                <p className="text-sm text-muted-foreground">No cost items added.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      {galleryPhotos.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {galleryPhotos.map((url, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Share link for approved members */}
      {plan.join_token && (
        <section className="space-y-2 pt-4 border-t">
          <p className="text-sm font-medium">Share this plan</p>
          <CopyLink url={joinUrl} />
        </section>
      )}
    </div>
  )
}
