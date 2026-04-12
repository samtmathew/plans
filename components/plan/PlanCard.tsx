import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { UserAvatar } from '@/components/common/Avatar'
import { calcEstimatedPerPerson } from '@/lib/utils/cost'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Plan } from '@/types'

interface PlanCardProps {
  plan: Plan
}

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  draft: { bg: 'bg-slate-100', text: 'text-slate-700' },
  closed: { bg: 'bg-slate-200', text: 'text-slate-800' },
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function AvatarStack({ plan }: { plan: Plan }) {
  const approvedAttendees = plan.attendees?.filter((a) => a.status === 'approved') ?? []
  const maxVisible = 5
  const visibleAttendees = approvedAttendees.slice(0, maxVisible)
  const hiddenCount = Math.max(0, approvedAttendees.length - maxVisible)

  return (
    <div className="flex items-center gap-0.5">
      {visibleAttendees.map((attendee, idx) => (
        <div
          key={attendee.id}
          className="relative"
          style={{
            marginLeft: idx === 0 ? 0 : -8,
            zIndex: visibleAttendees.length - idx,
          }}
        >
          <UserAvatar
            url={attendee.profile?.avatar_url}
            name={attendee.profile?.name ?? 'Unknown'}
            size="sm"
            className="ring-1 ring-card border border-background"
          />
        </div>
      ))}
      {hiddenCount > 0 && (
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center ml-1 text-xs font-headline font-semibold text-muted-foreground ring-1 ring-card">
          +{hiddenCount}
        </div>
      )}
    </div>
  )
}

export function PlanCard({ plan }: PlanCardProps) {
  const approvedCount = plan.attendees?.filter((a) => a.status === 'approved').length ?? 0
  const costPerPerson = calcEstimatedPerPerson(plan.items ?? [], approvedCount)
  const statusColor = statusColors[plan.status] ?? statusColors.draft

  return (
    <Link href={`/plans/${plan.id}`} className="block">
      <div className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
        {/* Cover Image */}
        {plan.cover_photo && (
          <div className="relative h-36 w-full overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={plan.cover_photo}
              alt={plan.title}
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
            />
            {/* Status Badge - positioned on image */}
            <div className="absolute top-3 right-3">
              <div
                className={cn(
                  'px-2 py-1 rounded-md text-xs font-semibold',
                  statusColor.bg,
                  statusColor.text
                )}
              >
                {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
              </div>
            </div>
          </div>
        )}

        <div className="p-3 space-y-3">
          {/* Title */}
          <h3 className="font-headline text-lg font-bold leading-snug line-clamp-2 text-foreground">
            {plan.title}
          </h3>

          {/* Date + cost */}
          <div className="space-y-1.5">
            {plan.start_date && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span className="font-medium">{formatShortDate(plan.start_date)}</span>
              </div>
            )}
            {costPerPerson > 0 && (
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(costPerPerson)}
                <span className="font-normal text-muted-foreground text-xs"> per person</span>
              </p>
            )}
          </div>

          {/* Description */}
          {plan.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {plan.description}
            </p>
          )}

          {/* Footer - Attendees */}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <div className="pt-2">
              <AvatarStack plan={plan} />
            </div>
            {!plan.cover_photo && (
              <div className="pt-2">
                <div className={cn('px-2 py-1 rounded-md text-xs font-semibold', statusColor.bg, statusColor.text)}>
                  {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
