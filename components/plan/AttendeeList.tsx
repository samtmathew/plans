'use client'

import { UserAvatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import Link from 'next/link'
import type { PlanAttendee } from '@/types'

interface AttendeeListProps {
  attendees: PlanAttendee[]
  isOrganiser: boolean
  onApprove?: (attendeeId: string) => void
  onReject?: (attendeeId: string) => void
  onRemove?: (attendeeId: string) => void
}

export function AttendeeList({
  attendees,
  isOrganiser,
  onApprove,
  onReject,
  onRemove,
}: AttendeeListProps) {
  const pending = attendees.filter((a) => a.status === 'pending')
  const rest = attendees.filter((a) => a.status !== 'pending')

  return (
    <div className="flex flex-col gap-6">
      {isOrganiser && pending.length > 0 && (
        <div>
          <h4
            className="text-[10px] font-semibold uppercase text-[var(--plans-text-2)] mb-2"
            style={{ letterSpacing: '0.18em' }}
          >
            Pending requests · {pending.length}
          </h4>
          <div className="flex flex-col">
            {pending.map((a) => (
              <AttendeeRow
                key={a.id}
                attendee={a}
                isOrganiser={isOrganiser}
                onApprove={onApprove}
                onReject={onReject}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          {isOrganiser && pending.length > 0 && (
            <h4
              className="text-[10px] font-semibold uppercase text-[var(--plans-text-2)] mb-2"
              style={{ letterSpacing: '0.18em' }}
            >
              Members
            </h4>
          )}
          <div className="flex flex-col">
            {rest.map((a) => (
              <AttendeeRow
                key={a.id}
                attendee={a}
                isOrganiser={isOrganiser}
                onApprove={onApprove}
                onReject={onReject}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AttendeeRow({
  attendee,
  isOrganiser,
  onApprove,
  onReject,
  onRemove,
}: {
  attendee: PlanAttendee
  isOrganiser: boolean
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onRemove?: (id: string) => void
}) {
  const profile = attendee.profile
  if (!profile) return null

  const isOrganiserRow = attendee.role === 'organiser'
  const badgeLabel =
    attendee.status === 'pending'
      ? 'Pending'
      : attendee.status === 'rejected'
        ? 'Rejected'
        : isOrganiserRow
          ? 'Organiser'
          : 'Confirmed'
  const badgeClass =
    attendee.status === 'pending'
      ? 'bg-[var(--yellow-soft)] text-[#8a6b14]'
      : attendee.status === 'rejected'
        ? 'bg-[var(--red-soft)] text-[#8a1f1f]'
        : isOrganiserRow
          ? 'bg-[var(--plans-surface)] text-[var(--plans-text-2)]'
          : 'bg-[var(--green-soft)] text-[#1f5a3a]'

  return (
    <div
      className="flex items-center gap-3.5 py-3.5"
      style={{ borderBottom: '1px solid var(--plans-divider)' }}
    >
      <Link href={`/profile/${profile.id}`} className="shrink-0">
        <UserAvatar url={profile.avatar_url} name={profile.name} size="md" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <Link
            href={`/profile/${profile.id}`}
            className="text-[14px] font-semibold text-[var(--plans-text)] truncate hover:underline"
          >
            {profile.name}
          </Link>
          {isOrganiserRow && (
            <span className="text-[11px] text-[var(--plans-text-2)] font-normal">organiser</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-medium ${badgeClass}`}
        >
          {badgeLabel}
        </span>
        {isOrganiser && attendee.status === 'pending' && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-full text-xs"
              onClick={() => onApprove?.(attendee.id)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 rounded-full text-xs text-[var(--plans-text-2)]"
              onClick={() => onReject?.(attendee.id)}
            >
              Reject
            </Button>
          </>
        )}
        {isOrganiser && attendee.status === 'rejected' && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-full text-xs"
            onClick={() => onApprove?.(attendee.id)}
          >
            Re-approve
          </Button>
        )}
        {isOrganiser && !isOrganiserRow && attendee.status === 'approved' && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full text-[var(--plans-text-2)] hover:text-[var(--plans-text)]"
            onClick={() => onRemove?.(attendee.id)}
            aria-label="Remove attendee"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
