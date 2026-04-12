'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CopyLink } from '@/components/common/CopyLink'
import { AlertCircle } from 'lucide-react'
import type { Plan } from '@/types'

interface ManageSettingsProps {
  plan: Plan
}

export function ManageSettings({ plan }: ManageSettingsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }

    setLoading(true)
    const response = await fetch(`/api/plans/${plan.id}`, {
      method: 'DELETE',
    })
    setLoading(false)

    if (response.ok) {
      router.push('/home')
    }
  }

  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${plan.join_token}`

  return (
    <div className="space-y-6">
      {/* Share Link */}
      <div>
        <h3 className="text-base font-headline font-semibold text-on-surface mb-4">Share Plan</h3>
        <p className="text-sm text-on-surface-variant mb-3">
          Share this link with people to invite them to the plan.
        </p>
        <CopyLink url={joinUrl} />
      </div>

      {/* Delete Section */}
      <div className="p-6 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-lg">
        <div className="flex gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-headline text-base font-semibold text-on-surface">Delete Plan</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              This action cannot be undone. All plan details and attendee data will be permanently deleted.
            </p>
          </div>
        </div>

        {deleteConfirm && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded">
            <p className="text-sm text-red-900 dark:text-red-200">
              Are you sure you want to delete this plan? This cannot be undone.
            </p>
          </div>
        )}

        <Button
          onClick={handleDelete}
          disabled={loading}
          variant="destructive"
          className="rounded-[2px]"
        >
          {deleteConfirm ? 'Confirm Delete' : 'Delete Plan'}
        </Button>

        {deleteConfirm && (
          <Button
            onClick={() => setDeleteConfirm(false)}
            disabled={loading}
            variant="outline"
            className="ml-2 rounded-[2px]"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
