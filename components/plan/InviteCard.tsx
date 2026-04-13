'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CalendarDays } from 'lucide-react'
import type { InviteWithPlan } from '@/types'

interface Props {
  invite: InviteWithPlan
  onRespond: (action: 'accept' | 'decline', attendeeId: string) => void
  loading?: boolean
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function InviteCard({ invite, onRespond, loading }: Props) {
  const { plan, organiser } = invite
  const date = formatDate(plan.start_date)

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
      {/* Cover thumbnail */}
      <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-surface-container">
        {plan.cover_photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={plan.cover_photo}
            alt={plan.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <h4 className="font-headline text-sm font-semibold leading-snug -tracking-[0.02em] text-on-surface truncate">
          {plan.title}
        </h4>
        {date && (
          <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
            <CalendarDays className="h-3 w-3 shrink-0" />
            <span>{date}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Avatar className="h-4 w-4">
            <AvatarImage src={organiser.avatar_url ?? undefined} />
            <AvatarFallback className="text-[8px]">
              {organiser.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] text-on-surface-variant truncate">
            Invited by {organiser.name}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="text-destructive border-destructive/30 hover:bg-destructive/10 h-8 text-xs"
          disabled={loading}
          onClick={() => onRespond('decline', invite.attendee_id)}
        >
          Decline
        </Button>
        <Button
          size="sm"
          className="h-8 text-xs"
          disabled={loading}
          onClick={() => onRespond('accept', invite.attendee_id)}
        >
          Accept
        </Button>
      </div>
    </div>
  )
}
