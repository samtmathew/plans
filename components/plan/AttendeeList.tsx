'use client'

import { UserAvatar } from '@/components/common/Avatar'
import { StatusBadge } from '@/components/common/StatusBadge'
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
    <div className="space-y-4">
      {isOrganiser && pending.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Pending requests ({pending.length})
          </h4>
          {pending.map((attendee) => (
            <AttendeeRow
              key={attendee.id}
              attendee={attendee}
              isOrganiser={isOrganiser}
              onApprove={onApprove}
              onReject={onReject}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="space-y-2">
          {isOrganiser && pending.length > 0 && (
            <h4 className="text-sm font-medium text-muted-foreground">Members</h4>
          )}
          {rest.map((attendee) => (
            <AttendeeRow
              key={attendee.id}
              attendee={attendee}
              isOrganiser={isOrganiser}
              onApprove={onApprove}
              onReject={onReject}
              onRemove={onRemove}
            />
          ))}
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

  return (
    <div className="flex items-center gap-3 py-1">
      <Link href={`/profile/${profile.id}`} className="shrink-0">
        <UserAvatar url={profile.avatar_url} name={profile.name} size="sm" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${profile.id}`}
          className="text-sm font-medium hover:underline truncate block"
        >
          {profile.name}
        </Link>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={attendee.role} />
        <StatusBadge status={attendee.status} />
        {isOrganiser && attendee.status === 'pending' && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onApprove?.(attendee.id)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-destructive"
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
            className="h-7 text-xs"
            onClick={() => onApprove?.(attendee.id)}
          >
            Re-approve
          </Button>
        )}
        {isOrganiser && attendee.role === 'attendee' && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
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
