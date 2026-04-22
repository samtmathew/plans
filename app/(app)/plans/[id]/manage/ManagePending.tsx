'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
import type { PlanAttendee, GuestAttendee } from '@/types'

interface ManagePendingProps {
  planId: string
  attendees: PlanAttendee[]
  guestAttendees: GuestAttendee[]
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} d ago`
  return new Date(iso).toLocaleDateString()
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

  return (
    <div className="max-w-[780px]">
      {attendees.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3.5 py-[18px]"
          style={{ borderBottom: '1px solid var(--plans-divider)' }}
        >
          <UserAvatar
            url={a.profile?.avatar_url}
            name={a.profile?.name || '?'}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[14px] font-semibold text-[var(--plans-text)]">
                {a.profile?.name}
              </span>
              <span className="text-[12px] text-[var(--plans-text-2)]">
                {relativeTime(a.created_at)}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-full text-[13px]"
              onClick={() => handleAttendee(a.id, 'rejected')}
              disabled={loading}
            >
              Decline
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-full text-[13px] bg-[var(--plans-text)] text-white hover:bg-black/90"
              onClick={() => handleAttendee(a.id, 'approved')}
              disabled={loading}
            >
              Approve
            </Button>
          </div>
        </div>
      ))}

      {pendingGuests.map((g) => (
        <div
          key={g.id}
          className="flex items-start gap-3.5 py-[18px]"
          style={{ borderBottom: '1px solid var(--plans-divider)' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--plans-surface)' }}
          >
            <User className="w-4 h-4 text-[var(--plans-text-2)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[14px] font-semibold text-[var(--plans-text)]">{g.name}</span>
              <span className="inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-medium" style={{ background: 'var(--plans-surface)', color: 'var(--plans-text-2)' }}>
                Guest
              </span>
              <span className="text-[12px] text-[var(--plans-text-2)]">
                {relativeTime(g.created_at)}
              </span>
            </div>
            {g.email && (
              <div className="text-[12px] text-[var(--plans-text-2)] mt-0.5 truncate">{g.email}</div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-full text-[13px]"
              onClick={() => handleGuest(g.id, 'rejected')}
              disabled={loading}
            >
              Decline
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-full text-[13px] bg-[var(--plans-text)] text-white hover:bg-black/90"
              onClick={() => handleGuest(g.id, 'approved')}
              disabled={loading}
            >
              Approve
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
