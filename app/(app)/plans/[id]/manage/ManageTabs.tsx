'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
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
    <Tabs defaultValue="requests" className="w-full flex flex-col gap-0">
      <TabsList variant="line" className="flex w-full justify-start rounded-none h-auto bg-transparent p-0 gap-6 border-b border-[var(--plans-divider)]">
        <TabsTrigger
          value="requests"
          className="flex-none rounded-none border-b-2 border-transparent data-[active]:border-[var(--plans-text)] data-[active]:text-[var(--plans-text)] text-[var(--plans-text-2)] px-0 pb-2.5 pt-2.5 text-[14px] font-medium"
        >
          Requests{pendingCount > 0 && ` · ${pendingCount}`}
        </TabsTrigger>
        <TabsTrigger
          value="edit"
          className="flex-none rounded-none border-b-2 border-transparent data-[active]:border-[var(--plans-text)] data-[active]:text-[var(--plans-text)] text-[var(--plans-text-2)] px-0 pb-2.5 pt-2.5 text-[14px] font-medium"
        >
          Edit details
        </TabsTrigger>
        <TabsTrigger
          value="danger"
          className="flex-none rounded-none border-b-2 border-transparent data-[active]:border-[var(--plans-text)] data-[active]:text-[var(--plans-text)] text-[var(--plans-text-2)] px-0 pb-2.5 pt-2.5 text-[14px] font-medium"
        >
          Danger zone
        </TabsTrigger>
      </TabsList>

      <TabsContent value="requests" className="mt-8">
          {pendingCount === 0 ? (
            <div className="py-14">
              <p className="font-headline italic text-[24px] text-[var(--plans-text)] mb-1.5">
                No pending requests.
              </p>
              <p className="text-[13px] text-[var(--plans-text-2)]">
                You&apos;ll see them here when people request to join.
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

        {/* Edit */}
        <TabsContent value="edit" className="mt-8">
          <PlanEditForm plan={plan} />
        </TabsContent>

        {/* Danger zone */}
        <TabsContent value="danger" className="mt-8">
          <div className="max-w-[640px]">
            <div
              className="rounded-xl p-5"
              style={{ border: '1px solid #F2D3D3', background: 'var(--red-soft)' }}
            >
              <div className="text-[15px] font-semibold mb-1.5" style={{ color: '#8a1f1f' }}>
                Cancel plan
              </div>
              <p className="text-[13px] mb-4" style={{ color: '#8a1f1f', opacity: 0.85 }}>
                Everyone will be notified. This can&apos;t be undone.
              </p>

              {deleteConfirm && (
                <div className="p-3 mb-4 rounded-lg" style={{ background: '#F8DADA', border: '1px solid #F2C3C3' }}>
                  <p className="text-[13px]" style={{ color: '#7a1818' }}>
                    Are you sure? This cannot be undone.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-50"
                  style={{ border: '1px solid #e0a0a0', color: '#8a1f1f', background: 'transparent' }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {loading ? 'Cancelling…' : deleteConfirm ? 'Confirm cancel' : 'Cancel this plan'}
                </button>

                {deleteConfirm && (
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    disabled={loading}
                    className="inline-flex items-center rounded-full px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-50"
                    style={{ color: '#8a1f1f' }}
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
