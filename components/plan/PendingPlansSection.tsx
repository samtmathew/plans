'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CalendarDays, Clock } from 'lucide-react'

export type PendingPlan = {
  attendee_id: string
  plan: {
    id: string
    title: string
    cover_photo: string | null
    start_date: string | null
  }
  organiser: {
    name: string
    avatar_url: string | null
  }
}

interface Props {
  plans: PendingPlan[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function PendingPlansSection({ plans }: Props) {
  if (plans.length === 0) return null

  return (
    <section id="pending-approvals" className="mb-8">
      <h2 className="font-headline text-2xl font-bold text-foreground tracking-tight mb-4">
        Waiting for Approval
      </h2>
      <div className="space-y-3">
        {plans.map((item) => {
          const date = formatDate(item.plan.start_date)
          return (
            <div
              key={item.attendee_id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm opacity-80"
            >
              {/* Cover thumbnail */}
              <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-surface-container">
                {item.plan.cover_photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.plan.cover_photo}
                    alt={item.plan.title}
                    className="h-full w-full object-cover grayscale"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <h4 className="font-headline text-sm font-semibold leading-snug -tracking-[0.02em] text-on-surface truncate">
                  {item.plan.title}
                </h4>
                {date && (
                  <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    <span>{date}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={item.organiser.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[8px]">
                      {item.organiser.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] text-on-surface-variant truncate">
                    by {item.organiser.name}
                  </span>
                </div>
              </div>

              {/* Status badge */}
              <div className="flex shrink-0 items-center gap-1.5 text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-full px-2.5 py-1">
                <Clock className="h-3 w-3" />
                <span className="text-[11px] font-medium">Pending</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
