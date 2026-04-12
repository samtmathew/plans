'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { Check, X, User } from 'lucide-react'
import type { PlanAttendee, GuestAttendee } from '@/types'

interface ManagePendingProps {
  planId: string
  attendees: PlanAttendee[]
  guestAttendees: GuestAttendee[]
}

export function ManagePending({ planId, attendees, guestAttendees }: ManagePendingProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleAttendee(attendeeId: string, status: 'approved' | 'rejected') {
    setLoading(true)
    try {
      const res = await fetch(`/api/plans/${planId}/attendees/${attendeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || 'Failed to update attendee')
        return
      }
      toast.success(status === 'approved' ? 'Attendee approved' : 'Attendee rejected')
      router.refresh()
    } catch {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleGuest(guestId: string, status: 'approved' | 'rejected') {
    setLoading(true)
    try {
      const res = await fetch(`/api/plans/${planId}/guest-attendees/${guestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || 'Failed to update guest')
        return
      }
      toast.success(status === 'approved' ? 'Guest approved' : 'Guest rejected')
      router.refresh()
    } catch {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const pendingGuests = guestAttendees.filter((g) => g.status === 'pending')
  const hasAnything = attendees.length > 0 || pendingGuests.length > 0

  if (!hasAnything) {
    return (
      <div className="text-center py-12">
        <p className="text-on-surface-variant">No pending requests</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {attendees.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Member requests ({attendees.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attendees.map((attendee) => (
              <div
                key={attendee.id}
                className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest"
              >
                <div className="flex items-center gap-3 mb-4">
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
                      Requested {new Date(attendee.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 rounded-[2px] h-8"
                    onClick={() => handleAttendee(attendee.id, 'approved')}
                    disabled={loading}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-[2px] h-8"
                    onClick={() => handleAttendee(attendee.id, 'rejected')}
                    disabled={loading}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingGuests.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Guest requests ({pendingGuests.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingGuests.map((guest) => (
              <div
                key={guest.id}
                className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-headline font-medium text-on-surface">
                        {guest.name}
                      </p>
                      <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground font-medium">
                        Guest
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {guest.email
                        ? guest.email
                        : 'No email provided'} · {new Date(guest.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 rounded-[2px] h-8"
                    onClick={() => handleGuest(guest.id, 'approved')}
                    disabled={loading}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-[2px] h-8"
                    onClick={() => handleGuest(guest.id, 'rejected')}
                    disabled={loading}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
