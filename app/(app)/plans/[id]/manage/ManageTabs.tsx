'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ManagePending } from './ManagePending'
import { PlanEditForm } from '../edit/PlanEditForm'
import type { Plan, PlanAttendee, GuestAttendee } from '@/types'

interface ManageTabsProps {
  plan: Plan
  planId: string
  pendingAttendees: PlanAttendee[]
  approvedAttendees?: PlanAttendee[]
  guestAttendees: GuestAttendee[]
  joinUrl?: string
}

export function ManageTabs({
  plan,
  planId,
  pendingAttendees,
  guestAttendees,
}: ManageTabsProps) {
  const router = useRouter()
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const pendingGuestCount = guestAttendees.filter((g) => g.status === 'pending').length
  const pendingCount = pendingAttendees.length + pendingGuestCount

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/plans/${plan.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Failed to cancel plan')
        return
      }

      toast.success('Plan cancelled')
      router.push('/home')
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tabs defaultValue="requests" className="w-full">
      <TabsList className="w-full justify-start rounded-none h-auto bg-transparent pb-0 mb-6 gap-0 border-b border-[var(--plans-divider)]">
        {(['requests', 'edit', 'danger'] as const).map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className="capitalize rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--plans-text)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--plans-text)] text-[var(--plans-text-2)] px-4 pb-3 text-sm font-medium"
          >
            {tab === 'requests' ? (
              <>
                Requests{' '}
                {pendingCount > 0 && (
                  <span className="ml-1 bg-[var(--plans-text)] text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">
                    {pendingCount}
                  </span>
                )}
              </>
            ) : tab === 'edit' ? (
              'Edit details'
            ) : (
              'Danger zone'
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Requests tab */}
      <TabsContent value="requests">
        {pendingCount === 0 ? (
          <div className="py-12">
            <p className="font-headline italic text-[var(--plans-text-2)]">
              No pending requests.
            </p>
          </div>
        ) : (
          <ManagePending
            planId={planId}
            attendees={pendingAttendees}
            guestAttendees={guestAttendees}
          />
        )}
      </TabsContent>

      {/* Edit details tab */}
      <TabsContent value="edit">
        <PlanEditForm plan={plan} />
      </TabsContent>

      {/* Danger zone tab */}
      <TabsContent value="danger">
        <div className="max-w-sm">
          <div className="border border-red-200 rounded-xl p-6 space-y-3 bg-red-50/50">
            <h3 className="font-semibold text-red-800 text-sm">Cancel this plan</h3>
            <p className="text-sm text-red-700/70">
              This will close the plan and remove it from all attendees&apos; dashboards.
            </p>

            {deleteConfirm && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm text-red-900">
                  Are you sure? This cannot be undone.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Cancelling…' : deleteConfirm ? 'Confirm cancel' : 'Cancel plan'}
              </button>

              {deleteConfirm && (
                <button
                  onClick={() => setDeleteConfirm(false)}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  Keep plan
                </button>
              )}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
