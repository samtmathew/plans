'use client'

import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Users, DollarSign, Lock } from 'lucide-react'
import type { PlanPreviewData } from '@/types'

interface Props {
  plan: PlanPreviewData
  onImIn: () => void
}

export function JoinCardPreviewFace({ plan, onImIn }: Props) {
  const formattedDate = plan.start_date
    ? new Date(plan.start_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden">
      {/* Cover photo */}
      <div className="relative h-48 w-full shrink-0 bg-muted">
        {plan.cover_photo ? (
          <Image
            src={plan.cover_photo}
            alt={plan.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-4xl">✈️</span>
          </div>
        )}
        {plan.approved_count > 0 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 text-white text-xs font-medium">
            {plan.approved_count} going
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Organiser */}
        <div className="flex items-center gap-2.5">
          <Avatar className="w-7 h-7">
            <AvatarImage src={plan.organiser.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">
              {plan.organiser.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">
              Hosted by
            </p>
            <p className="text-xs font-medium text-foreground leading-none">
              {plan.organiser.name}
            </p>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold font-headline text-foreground leading-tight tracking-tight">
            {plan.title}
          </h1>
          {plan.description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
              {plan.description}
            </p>
          )}
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-1.5">
          {formattedDate && (
            <span className="inline-flex items-center gap-1.5 bg-muted rounded-full px-2.5 py-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
          )}
          {plan.approved_count > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-muted rounded-full px-2.5 py-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              {plan.approved_count} going
            </span>
          )}
          {plan.cost_per_person > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-muted rounded-full px-2.5 py-1 text-xs text-muted-foreground">
              <DollarSign className="w-3 h-3" />
              ~${Math.round(plan.cost_per_person)}/pp
            </span>
          )}
        </div>

        {/* Locked teaser */}
        <div className="flex-1 flex items-center justify-center bg-muted/40 border border-dashed border-border rounded-lg p-4 min-h-[64px]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span className="text-xs">Itinerary, costs &amp; full attendee list</span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onImIn}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          I&apos;m in 🎉
        </button>

        {plan.join_approval && (
          <p className="text-center text-[10px] text-muted-foreground -mt-2">
            The organiser reviews all requests before approving
          </p>
        )}
      </div>
    </div>
  )
}
