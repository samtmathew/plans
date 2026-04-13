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

/** Deterministic rotation from plan ID. Range: -1.5° to +1.5°. */
function getCardRotation(id: string): number {
  const hash = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return ((hash % 100) / 100 - 0.5) * 3
}

function formatDateRange(start: string | null, end?: string | null): string {
  if (!start) return ''
  const s = new Date(start + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  if (!end) return s
  const e = new Date(end + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${s} – ${e}`
}

function AvatarStack({ plan }: { plan: Plan }) {
  const approved = plan.attendees?.filter((a) => a.status === 'approved') ?? []
  const maxVisible = 5
  const visible = approved.slice(0, maxVisible)
  const hiddenCount = Math.max(0, approved.length - maxVisible)

  if (approved.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 pb-3">
      <div className="flex">
        {visible.map((attendee, idx) => (
          <div
            key={attendee.id}
            className="relative"
            style={{ marginLeft: idx === 0 ? 0 : -5, zIndex: visible.length - idx }}
          >
            <UserAvatar
              url={attendee.profile?.avatar_url}
              name={attendee.profile?.name ?? 'Unknown'}
              size="sm"
              className="ring-1 ring-white border border-white"
            />
          </div>
        ))}
        {hiddenCount > 0 && (
          <div
            className="h-5 w-5 rounded-full bg-surface-container flex items-center justify-center text-[8px] font-semibold text-on-surface-variant ring-1 ring-white border border-white"
            style={{ marginLeft: -5 }}
          >
            +{hiddenCount}
          </div>
        )}
      </div>
      <span className="text-[11px] text-on-surface-variant">
        {approved.length} attending
      </span>
    </div>
  )
}

export function PlanCard({ plan }: PlanCardProps) {
  const approvedCount = plan.attendees?.filter((a) => a.status === 'approved').length ?? 0
  const costPerPerson = calcEstimatedPerPerson(plan.items ?? [], approvedCount)
  const totalCost = costPerPerson * approvedCount
  const dateRange = formatDateRange(plan.start_date, plan.end_date)
  const rotation = getCardRotation(plan.id)

  const badgeClass =
    plan.status === 'active'
      ? 'bg-green-500/30 border-green-400/40'
      : 'bg-white/15 border-white/20'

  return (
    <Link href={`/plans/${plan.id}`} className="block">
      <div
        className={cn(
          'group plan-card-rot',
          'rounded-xl border border-border bg-card overflow-hidden',
          'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]',
          'relative'
        )}
        style={{ '--card-rot': `${rotation}deg` } as React.CSSProperties}
      >
        {/* Cover */}
        <div className="relative h-36 w-full overflow-hidden bg-surface-container shrink-0">
          {plan.cover_photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={plan.cover_photo}
              alt={plan.title}
              className="w-full h-full object-cover transition-[filter] duration-300 [filter:grayscale(15%)] group-hover:[filter:grayscale(0%)]"
            />
          ) : (
            <div className="w-full h-full bg-surface-container" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Status badge — slides up on hover */}
          <div className="absolute bottom-2.5 right-3 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-[opacity,transform] duration-300 delay-75">
            <span
              className={cn(
                'backdrop-blur-sm border text-white text-[9px] font-semibold uppercase tracking-[0.8px] rounded-full px-2 py-0.5',
                badgeClass
              )}
            >
              {plan.status}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 pb-0 space-y-2">
          <h3 className="font-headline text-sm font-semibold leading-snug -tracking-[0.02em] line-clamp-2 text-on-surface">
            {plan.title}
          </h3>
          {dateRange && (
            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
              <CalendarDays className="h-3 w-3 shrink-0" />
              <span>{dateRange}</span>
            </div>
          )}
          <AvatarStack plan={plan} />
        </div>

        {/* Shift-reveal cost panel */}
        {costPerPerson > 0 && (
          <div
            className={cn(
              'max-h-0 overflow-hidden border-t border-transparent',
              'transition-[max-height,border-color] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
              'group-hover:max-h-[80px] group-hover:border-border'
            )}
          >
            <div
              className={cn(
                'px-3 py-2.5 flex flex-col gap-1.5',
                'opacity-0 translate-y-1.5',
                'transition-[opacity,transform] duration-300 delay-100',
                'group-hover:opacity-100 group-hover:translate-y-0'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] text-on-surface-variant">Total cost</span>
                <span className="font-headline text-xs font-semibold -tracking-[0.02em] text-on-surface">
                  {formatCurrency(totalCost)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] text-on-surface-variant">Per person</span>
                <span className="font-headline text-xs font-semibold -tracking-[0.02em] text-on-surface">
                  {formatCurrency(costPerPerson)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
