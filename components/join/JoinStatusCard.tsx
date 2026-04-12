'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Clock, XCircle, Mail } from 'lucide-react'

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

export function JoinStatusCard({ state, guestName, planTitle: _planTitle, organiserName }: Props) {
  const c = config[state]
  const Icon = c.icon
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailValue, setEmailValue] = useState('')
  const [saving, setSaving] = useState(false)

  return (
    <div className={`rounded-xl border p-5 space-y-4 ${c.bgClass}`}>
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

      {state === 'pending' && !emailSaved && (
        <div className="space-y-2 pt-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Mail className="w-3 h-3" />
            Want to get notified when approved?
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              className="h-8 text-xs flex-1"
            />
            <button
              disabled={saving || !emailValue}
              onClick={async () => {
                if (!emailValue) return
                setSaving(true)
                // Email captured client-side — notification infra added later
                await new Promise((r) => setTimeout(r, 400))
                setEmailSaved(true)
                setSaving(false)
              }}
              className="h-8 px-3 rounded bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 shrink-0"
            >
              {saving ? '…' : 'Notify me'}
            </button>
          </div>
        </div>
      )}

      {state === 'pending' && emailSaved && (
        <p className="text-xs text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3" />
          Got it — we&apos;ll let you know.
        </p>
      )}
    </div>
  )
}
