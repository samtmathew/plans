'use client'

import { CheckCircle2, Clock, XCircle } from 'lucide-react'

type GuestState = 'pending' | 'approved' | 'rejected'

interface Props {
  state: GuestState
  guestName: string
  planTitle?: string
  organiserName?: string
}

const config = {
  pending: {
    icon: Clock,
    iconClass: 'text-yellow-500',
    bgClass: 'bg-yellow-500/10 border-yellow-500/20',
    title: (name: string) => `You're in the queue, ${name}`,
    subtitle: (organiser?: string) =>
      organiser
        ? `${organiser} will review your request. Come back to this link to check.`
        : 'Come back to this link to check your status.',
  },
  approved: {
    icon: CheckCircle2,
    iconClass: 'text-green-500',
    bgClass: 'bg-green-500/10 border-green-500/20',
    title: (name: string) => `You're in, ${name}! 🎉`,
    subtitle: () => 'Full plan is now unlocked below.',
  },
  rejected: {
    icon: XCircle,
    iconClass: 'text-muted-foreground',
    bgClass: 'bg-muted/50 border-border',
    title: (name: string) => `Not this time, ${name}`,
    subtitle: () => "This plan isn't open to new members right now.",
  },
}

export function JoinStatusCard({ state, guestName, organiserName }: Props) {
  const c = config[state]
  const Icon = c.icon

  return (
    <div className={`rounded-xl border p-5 space-y-4 shadow-[var(--shadow-card)] ${c.bgClass}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-6 h-6 mt-0.5 shrink-0 ${c.iconClass}`} />
        <div>
          <p className="font-bold text-foreground text-sm leading-snug">
            {c.title(guestName || 'there')}
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {c.subtitle(organiserName)}
          </p>
        </div>
      </div>
    </div>
  )
}
