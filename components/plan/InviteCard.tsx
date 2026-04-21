'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CalendarDays } from 'lucide-react'
import { CoverArt } from '@/components/common/CoverArt'
import type { InviteWithPlan } from '@/types'

interface Props {
  invite: InviteWithPlan
  onRespond: (action: 'accept' | 'decline', attendeeId: string) => void
  loading?: boolean
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function InviteCard({ invite, onRespond, loading }: Props) {
  const { plan, organiser } = invite
  const date = formatDate(plan.start_date)

  return (
    <div
      className="flex-shrink-0 flex items-center gap-3 rounded-xl border border-[var(--plans-divider)] bg-white p-3 shadow-[var(--shadow-card)]"
      style={{ minWidth: 300, borderRadius: 12 }}
    >
      {/* 44×44 cover thumb */}
      <div className="h-11 w-11 shrink-0 rounded-lg overflow-hidden bg-[var(--plans-surface)]">
        {plan.cover_photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plan.cover_photo} alt={plan.title} className="h-full w-full object-cover" />
        ) : (
          <CoverArt seed={plan.id} className="h-full w-full" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <h4 className="font-headline text-sm font-semibold leading-snug text-[var(--plans-text)] truncate">
          {plan.title}
        </h4>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--plans-text-2)]">
          <Avatar className="h-4 w-4">
            <AvatarImage src={organiser.avatar_url ?? undefined} />
            <AvatarFallback className="text-[8px]">{organiser.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="truncate">from {organiser.name}</span>
          {date && (
            <>
              <span>·</span>
              <CalendarDays className="h-3 w-3 shrink-0" />
              <span>{date}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="text-destructive border-destructive/30 hover:bg-destructive/10 h-7 text-xs px-2"
          disabled={loading}
          onClick={() => onRespond('decline', invite.attendee_id)}
        >
          Decline
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs px-2"
          disabled={loading}
          onClick={() => onRespond('accept', invite.attendee_id)}
        >
          Accept
        </Button>
      </div>
    </div>
  )
}
