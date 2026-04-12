'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserAvatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { PlanAttendee } from '@/types'

interface ManageAttendeesProps {
  attendees: PlanAttendee[]
}

export function ManageAttendees({ attendees }: ManageAttendeesProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRemove(attendeeId: string, planId: string) {
    setLoading(true)
    const response = await fetch(`/api/plans/${planId}/attendees/${attendeeId}`, {
      method: 'DELETE',
    })
    setLoading(false)
    if (response.ok) {
      router.refresh()
    }
  }

  if (attendees.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-on-surface-variant">No approved attendees yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {attendees.map((attendee) => (
        <div
          key={attendee.id}
          className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest flex items-center justify-between"
        >
          <Link href={`/profile/${attendee.user_id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
            <UserAvatar
              url={attendee.profile?.avatar_url}
              name={attendee.profile?.name || '?'}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-headline font-medium text-on-surface">
                {attendee.profile?.name}
              </p>
              <p className="text-xs text-on-surface-variant">
                Joined {new Date(attendee.created_at).toLocaleDateString()}
              </p>
            </div>
          </Link>

          {attendee.role === 'attendee' && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={() => handleRemove(attendee.id, attendee.plan_id)}
              disabled={loading}
              aria-label="Remove attendee"
            >
              <X className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
