'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import type { PlanAttendee } from '@/types'

interface ManagePendingProps {
  planId: string
  attendees: PlanAttendee[]
}

export function ManagePending({ planId, attendees }: ManagePendingProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleApprove(attendeeId: string) {
    setLoading(true)
    try {
      const response = await fetch(`/api/plans/${planId}/attendees/${attendeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Failed to approve attendee')
        return
      }

      toast.success('Attendee approved')
      router.refresh()
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleReject(attendeeId: string) {
    setLoading(true)
    try {
      const response = await fetch(`/api/plans/${planId}/attendees/${attendeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Failed to reject attendee')
        return
      }

      toast.success('Attendee rejected')
      router.refresh()
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (attendees.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-on-surface-variant">No pending attendee requests</p>
      </div>
    )
  }

  return (
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
              onClick={() => handleApprove(attendee.id)}
              disabled={loading}
            >
              <Check className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 rounded-[2px] h-8"
              onClick={() => handleReject(attendee.id)}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
