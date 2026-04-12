'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AttendeeList } from '@/components/plan/AttendeeList'
import type { Plan, PlanAttendee } from '@/types'

interface AttendeeActionsProps {
  plan: Plan
  isOrganiser: boolean
  currentUserId: string
}

export function AttendeeActions({ plan, isOrganiser }: AttendeeActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function patchAttendee(attendeeId: string, status: 'approved' | 'rejected') {
    setLoading(true)
    await fetch(`/api/plans/${plan.id}/attendees/${attendeeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    router.refresh()
  }

  async function removeAttendee(attendeeId: string) {
    setLoading(true)
    await fetch(`/api/plans/${plan.id}/attendees/${attendeeId}`, {
      method: 'DELETE',
    })
    setLoading(false)
    router.refresh()
  }

  const visibleAttendees = isOrganiser
    ? (plan.attendees as PlanAttendee[])
    : (plan.attendees as PlanAttendee[]).filter(
        (a) => a.status === 'approved'
      )

  return (
    <div className={loading ? 'opacity-60 pointer-events-none' : ''}>
      <AttendeeList
        attendees={visibleAttendees}
        isOrganiser={isOrganiser}
        onApprove={(id) => patchAttendee(id, 'approved')}
        onReject={(id) => patchAttendee(id, 'rejected')}
        onRemove={removeAttendee}
      />
    </div>
  )
}
