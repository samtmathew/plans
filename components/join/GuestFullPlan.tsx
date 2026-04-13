'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Loader2, CalendarDays } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { calcEstimatedPerPerson } from '@/lib/utils/cost'
import { formatDate } from '@/lib/utils/format'
import type { PlanItem, PlanAttendee } from '@/types'

interface FullPlanData {
  title: string
  description: string
  start_date: string | null
  itinerary: string
  items: PlanItem[]
  attendees: PlanAttendee[]
}

interface Props {
  joinToken: string
  guestToken: string
}

export function GuestFullPlan({ joinToken, guestToken }: Props) {
  const [data, setData] = useState<FullPlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/join/${joinToken}/full-plan?token=${guestToken}`)
      .then((r) => r.json())
      .then(({ data: d, error: e }) => {
        if (e) { setError(e); return }
        setData(d)
      })
      .catch(() => setError('Failed to load plan details'))
      .finally(() => setLoading(false))
  }, [joinToken, guestToken])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        Could not load plan details. Refresh the page to try again.
      </p>
    )
  }

  const costPerPerson = calcEstimatedPerPerson(data.items, data.attendees.length)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Plan header */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">{data.title}</h2>
        {data.start_date && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span>{formatDate(data.start_date)}</span>
          </div>
        )}
        {data.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{data.description}</p>
        )}
      </div>

      {/* Itinerary */}
      {data.itinerary && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Itinerary
            </p>
          </div>
          <div className="px-4 py-4">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {data.itinerary}
            </p>
          </div>
        </div>
      )}

      {/* Cost breakdown */}
      {data.items.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Cost Breakdown
            </p>
          </div>
          <div className="divide-y divide-border">
            {data.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                    {item.pricing_type === 'per_head' ? 'Per person' : 'Group cost'}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground shrink-0 ml-4">
                  ${item.price.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-muted/50 px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs font-bold text-foreground">Est. per person</p>
            <p className="text-sm font-bold text-primary">${Math.round(costPerPerson)}</p>
          </div>
        </div>
      )}

      {/* Who's coming */}
      {data.attendees.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Who&apos;s Coming ({data.attendees.length})
            </p>
          </div>
          <div className="divide-y divide-border">
            {data.attendees.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={a.profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {(a.profile?.name ?? '?').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-foreground">
                  {a.profile?.name ?? 'Member'}
                </p>
                {a.role === 'organiser' && (
                  <span className="ml-auto text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-medium">
                    Organiser
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
