'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
    try {
      const response = await fetch(`/api/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Failed to publish plan')
        return
      }

      toast.success('Plan published')
      router.refresh()
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleClose() {
    setLoading(true)
    try {
      const response = await fetch(`/api/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Failed to close plan')
        return
      }

      toast.success('Plan closed')
      router.refresh()
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    } finally {
      setLoading(false)
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
