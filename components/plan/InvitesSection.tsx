'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { InviteCard } from '@/components/plan/InviteCard'
import type { InviteWithPlan } from '@/types'

interface Props {
  initialInvites: InviteWithPlan[]
}

export function InvitesSection({ initialInvites }: Props) {
  const [invites, setInvites] = useState(initialInvites)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()

  if (invites.length === 0) return null

  async function handleRespond(action: 'accept' | 'decline', attendeeId: string) {
    setLoadingId(attendeeId)
    try {
      const res = await fetch(`/api/invites/${attendeeId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        toast.error(json.error ?? 'Something went wrong')
        return
      }

      setInvites((prev) => prev.filter((i) => i.attendee_id !== attendeeId))
      toast.success(action === 'accept' ? 'Invite accepted!' : 'Invite declined')

      if (action === 'accept') {
        router.refresh()
      }
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <section id="invites" className="mb-8">
      <h2 className="font-headline text-2xl font-bold text-foreground tracking-tight mb-4">
        Invites
      </h2>
      <div className="space-y-3">
        {invites.map((invite) => (
          <InviteCard
            key={invite.attendee_id}
            invite={invite}
            onRespond={handleRespond}
            loading={loadingId === invite.attendee_id}
          />
        ))}
      </div>
    </section>
  )
}
