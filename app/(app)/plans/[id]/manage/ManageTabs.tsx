'use client'

import { useState } from 'react'
import { ManageOverview } from './ManageOverview'
import { ManagePending } from './ManagePending'
import { ManageAttendees } from './ManageAttendees'
import { ManageSettings } from './ManageSettings'
import type { Plan, PlanAttendee, GuestAttendee } from '@/types'

interface ManageTabsProps {
  plan: Plan
  planId: string
  pendingAttendees: PlanAttendee[]
  approvedAttendees: PlanAttendee[]
  guestAttendees: GuestAttendee[]
}

type TabValue = 'overview' | 'pending' | 'attendees' | 'settings'

export function ManageTabs({
  plan,
  planId,
  pendingAttendees,
  approvedAttendees,
  guestAttendees,
}: ManageTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('overview')

  const pendingGuestCount = guestAttendees.filter((g) => g.status === 'pending').length

  const tabs: Array<{ value: TabValue; label: string; count?: number }> = [
    { value: 'overview', label: 'Overview' },
    { value: 'pending', label: 'Pending', count: pendingAttendees.length + pendingGuestCount },
    { value: 'attendees', label: 'Attendees', count: approvedAttendees.length },
    { value: 'settings', label: 'Settings' },
  ]

  return (
    <div className="w-full">
      {/* Tab list */}
      <div className="border-b border-outline-variant">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`text-xs font-bold uppercase tracking-widest px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.value
                  ? 'border-primary text-on-surface'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'overview' && <ManageOverview plan={plan} />}
        {activeTab === 'pending' && (
          <ManagePending
            planId={planId}
            attendees={pendingAttendees}
            guestAttendees={guestAttendees}
          />
        )}
        {activeTab === 'attendees' && <ManageAttendees attendees={approvedAttendees} />}
        {activeTab === 'settings' && <ManageSettings plan={plan} />}
      </div>
    </div>
  )
}
