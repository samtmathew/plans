'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { Plan } from '@/types'

interface ManageActionsProps {
  plan: Plan
}

export function ManageActions({ plan }: ManageActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handlePublish() {
    setLoading(true)
    const response = await fetch(`/api/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    setLoading(false)
    if (response.ok) {
      router.refresh()
    }
  }

  async function handleClose() {
    setLoading(true)
    const response = await fetch(`/api/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'closed' }),
    })
    setLoading(false)
    if (response.ok) {
      router.refresh()
    }
  }

  return (
    <div className="space-y-2 pt-4 border-t border-outline-variant">
      {plan.status === 'draft' && (
        <Button
          onClick={handlePublish}
          disabled={loading}
          className="w-full rounded-[2px]"
        >
          Publish Plan
        </Button>
      )}
      {plan.status === 'active' && (
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outline"
          className="w-full rounded-[2px]"
        >
          Close Plan
        </Button>
      )}
      <Button
        asChild
        variant="ghost"
        className="w-full rounded-[2px]"
      >
        <a href={`/plans/${plan.id}/edit`}>Edit Plan</a>
      </Button>
    </div>
  )
}
