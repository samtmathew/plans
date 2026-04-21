'use client'

import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { UserAvatar } from '@/components/common/Avatar'
import { CoverArt } from '@/components/common/CoverArt'
import { calcEstimatedPerPerson } from '@/lib/utils/cost'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Plan } from '@/types'

interface PlanCardProps {
  plan: Plan
}

/** Deterministic rotation ±0.5°–±1.3°, cycles through 8 positions */
function getCardRotation(id: string): number {
  const positions = [-1.3, -0.8, -0.5, 0.5, 0.7, 1.0, 1.3, -1.0]
  const hash = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return positions[hash % positions.length]
}

function formatDateShort(start: string | null): string {
  if (!start) return ''
  return new Date(start + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

function AvatarStack({ plan }: { plan: Plan }) {
  const approved = plan.attendees?.filter((a) => a.status === 'approved') ?? []
  const maxVisible = 5
  const visible = approved.slice(0, maxVisible)
  const hiddenCount = Math.max(0, approved.length - maxVisible)
  if (approved.length === 0) return null
  return (
    <div className="flex">
      {visible.map((attendee, idx) => (
        <div key={attendee.id} className="relative" style={{ marginLeft: idx === 0 ? 0 : -6, zIndex: visible.length - idx }}>
          <UserAvatar
            url={attendee.profile?.avatar_url}
            name={attendee.profile?.name ?? 'Unknown'}
            size="sm"
            className="ring-1 ring-white"
          />
        </div>
      ))}
      {hiddenCount > 0 && (
        <div
          className="h-7 w-7 rounded-full bg-[var(--plans-surface)] flex items-center justify-center text-[8px] font-semibold text-[var(--plans-text-2)] ring-1 ring-white"
          style={{ marginLeft: -6 }}
        >
          +{hiddenCount}
        </div>
      )}
    </div>
  )
}

export function PlanCard({ plan }: PlanCardProps) {
  const approvedCount = plan.attendees?.filter((a) => a.status === 'approved').length ?? 0
  const costPerPerson = calcEstimatedPerPerson(plan.items ?? [], approvedCount)
  const date = formatDateShort(plan.start_date)
  const rotation = getCardRotation(plan.id)

  return (
    <Link href={`/plans/${plan.id}`} className="block">
      <div
        className="group plan-card-rot bg-white border border-[var(--plans-divider)] rounded-[4px] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] cursor-pointer"
        style={{ '--card-rot': `${rotation}deg` } as React.CSSProperties}
      >
        {/* Polaroid photo area — 8px inset on left/right/top */}
        <div className="relative mx-2 mt-2 overflow-hidden rounded-[2px]" style={{ aspectRatio: '3/4' }}>
          {plan.cover_photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={plan.cover_photo}
              alt={plan.title}
              className="w-full h-full object-cover transition-[filter] duration-300 [filter:grayscale(15%)] group-hover:[filter:grayscale(0%)]"
            />
          ) : (
            <CoverArt
              seed={plan.id}
              className="w-full h-full"
              grayscale
            />
          )}

          {/* Status badge — top-left, always visible */}
          <div className="absolute top-2 left-2">
            <span
              className={cn(
                'backdrop-blur-sm border text-white text-[9px] font-semibold uppercase tracking-[0.8px] rounded-full px-2 py-0.5',
                plan.status === 'active'
                  ? 'bg-green-500/30 border-green-400/40'
                  : 'bg-white/15 border-white/20'
              )}
            >
              {plan.status}
            </span>
          </div>

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        {/* Polaroid caption footer */}
        <div className="px-2.5 pt-2.5 pb-3 space-y-1.5">
          {/* Kind eyebrow */}
          {plan.kind && (
            <p className="text-[9px] font-semibold uppercase tracking-[1.2px] text-[var(--plans-text-2)]">
              {plan.kind}
            </p>
          )}
          <h3 className="font-headline text-[14px] font-semibold leading-snug line-clamp-2 text-[var(--plans-text)]">
            {plan.title}
          </h3>
          {date && (
            <div className="flex items-center gap-1 text-[11px] text-[var(--plans-text-2)]">
              <CalendarDays className="h-3 w-3 shrink-0" />
              <span>{date}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-0.5">
            <AvatarStack plan={plan} />
            {costPerPerson > 0 && (
              <span className="text-[11px] font-bold text-[var(--plans-text)]">
                {formatCurrency(costPerPerson)}/pp
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
