import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Users, ExternalLink } from 'lucide-react'
import { JoinButton } from './JoinButton'
import type { PlanAttendee } from '@/types'

interface Props {
  params: Promise<{ join_token: string }>
}

export default async function JoinPage({ params }: Props) {
  const { join_token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/join/${join_token}`)
  }

  // Resolve join token → plan
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*, organiser:profiles!organiser_id(*), attendees:plan_attendees(*)')
    .eq('join_token', join_token)
    .single()

  if (planError || !plan || plan.deleted_at) {
    notFound()
  }

  // Organiser visiting their own join link
  if (plan.organiser_id === user.id) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold">You&apos;re the organiser</h1>
          <p className="text-muted-foreground text-sm">This is your own plan.</p>
          <Button asChild>
            <Link href={`/plans/${plan.id}`}>View plan</Link>
          </Button>
        </div>
      </main>
    )
  }

  // Already an attendee
  const existing = (plan.attendees as PlanAttendee[])?.find((a) => a.user_id === user.id)
  if (existing) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold">You&apos;re already in this plan</h1>
          <p className="text-muted-foreground text-sm capitalize">
            Status: {existing.status}
          </p>
          <Button asChild>
            <Link href={`/plans/${plan.id}`}>View plan</Link>
          </Button>
        </div>
      </main>
    )
  }

  // Plan closed
  if (plan.status === 'closed') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold">This plan is closed</h1>
          <p className="text-muted-foreground text-sm">It&apos;s no longer accepting new members.</p>
          <Button asChild variant="outline">
            <Link href="/home">Go home</Link>
          </Button>
        </div>
      </main>
    )
  }

  // Plan is draft
  if (plan.status === 'draft') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold">This plan isn&apos;t public yet</h1>
          <p className="text-muted-foreground text-sm">The organiser hasn&apos;t published it.</p>
          <Button asChild variant="outline">
            <Link href="/home">Go home</Link>
          </Button>
        </div>
      </main>
    )
  }

  // Format start date
  const startDate = plan.start_date ? new Date(plan.start_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : null

  const approvedAttendees = (plan.attendees as PlanAttendee[])?.filter((a) => a.status === 'approved') ?? []
  const approvedCount = approvedAttendees.length

  // Gallery photos
  const galleryPhotos: string[] = plan.gallery_photos ?? []

  // Show join preview with asymmetric hero layout
  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left: Cover Image */}
        <div className="rounded-lg overflow-hidden">
          {plan.cover_photo ? (
            <Image
              src={plan.cover_photo}
              alt={plan.title}
              width={600}
              height={400}
              className="w-full aspect-video object-cover"
              priority
            />
          ) : (
            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm">No cover image</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Details Section */}
        <div className="flex flex-col justify-between space-y-6">
          {/* Organiser Info */}
          {plan.organiser && (
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={plan.organiser.avatar_url} />
                <AvatarFallback>{plan.organiser.name?.charAt(0) ?? '?'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="micro-label">By</p>
                <p className="text-sm font-headline text-on-surface">{plan.organiser.name}</p>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <h1 className="font-headline text-5xl md:text-6xl font-bold text-on-surface -tracking-[0.04em] leading-tight">
              {plan.title}
            </h1>
          </div>

          {/* Description */}
          {plan.description && (
            <p className="text-sm md:text-base text-on-surface-variant max-w-sm">
              {plan.description}
            </p>
          )}

          {/* Metadata Pills */}
          <div className="flex flex-wrap gap-2">
            {startDate && (
              <div className="inline-flex items-center gap-2 bg-surface-container-low rounded-full px-3 py-1">
                <Calendar className="w-3 h-3 text-on-surface" />
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface">{startDate}</span>
              </div>
            )}
            {approvedCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-surface-container-low rounded-full px-3 py-1">
                <Users className="w-3 h-3 text-on-surface" />
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
                  {approvedCount} {approvedCount === 1 ? 'attendee' : 'attendees'}
                </span>
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="space-y-3 pt-2">
            <JoinButton planId={plan.id} joinToken={join_token} />
            <Button variant="outline" className="w-full rounded-[2px]" asChild>
              <Link href={`/plans/${plan.id}`}>
                View All Details <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Join approval note */}
          {plan.join_approval && (
            <p className="text-xs text-on-surface-variant">
              The organiser reviews all join requests before approving.
            </p>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      {galleryPhotos && galleryPhotos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-headline font-bold text-on-surface">Gallery</h2>
          <div className="columns-1 md:columns-3 gap-4">
            {galleryPhotos.map((photoUrl, idx) => (
              <div
                key={idx}
                className="break-inside-avoid mb-4 rounded-lg overflow-hidden"
                style={{
                  transform: `translateY(${(idx % 3) * 16}px)`
                }}
              >
                <Image
                  src={photoUrl}
                  alt={`${plan.title} gallery photo ${idx + 1}`}
                  width={300}
                  height={300}
                  className="w-full aspect-square object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
