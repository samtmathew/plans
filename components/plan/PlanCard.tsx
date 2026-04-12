import Link from 'next/link'
import { CalendarDays, Users } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { calcEstimatedPerPerson } from '@/lib/utils/cost'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Plan } from '@/types'

interface PlanCardProps {
  plan: Plan
  currentUserId: string
}

const statusStrip: Record<string, string> = {
  active: 'bg-green-400',
  draft:  'bg-zinc-300',
  closed: 'bg-zinc-400',
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function PlanCard({ plan, currentUserId }: PlanCardProps) {
  const isOrganiser = plan.organiser_id === currentUserId
  const approvedCount = plan.attendees?.filter((a) => a.status === 'approved').length ?? 0
  const costPerPerson = calcEstimatedPerPerson(plan.items ?? [], approvedCount)

  return (
    <Link href={`/plans/${plan.id}`} className="block">
      <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
        {/* Status colour strip */}
        <div className={cn('h-1', statusStrip[plan.status] ?? 'bg-zinc-300')} />

        <div className="p-3 space-y-2">
          {/* Title */}
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">{plan.title}</h3>

          {/* Date + cost */}
          <div className="space-y-1">
            {plan.start_date && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3 shrink-0" />
                <span>{formatShortDate(plan.start_date)}</span>
              </div>
            )}
            {costPerPerson > 0 && (
              <p className="text-xs font-medium">
                {formatCurrency(costPerPerson)}
                <span className="font-normal text-muted-foreground"> /person</span>
              </p>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {plan.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-0.5">
            <StatusBadge
              status={isOrganiser ? 'organiser' : 'attendee'}
              className="text-[10px] h-4 px-1.5"
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{approvedCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
