'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Loader2 } from 'lucide-react'

interface Props {
  guestToken: string
  planId: string
}

export function GuestConversionBanner({ guestToken, planId }: Props) {
  const router = useRouter()
  const [isLinking, setIsLinking] = useState(false)

  useEffect(() => {
    const linkGuest = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      setIsLinking(true)
      try {
        const res = await fetch('/api/auth/link-guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guest_token: guestToken, plan_id: planId }),
        })
        const json = await res.json()
        if (json.data?.plan_id) {
          router.push(`/plans/${json.data.plan_id}`)
          router.refresh()
        }
      } catch (error) {
        console.error('[GuestConversionBanner] link-guest failed:', error)
      } finally {
        setIsLinking(false)
      }
    }

    linkGuest()
  }, [guestToken, planId, router])

  if (isLinking) {
    return (
      <div className="border border-border rounded-xl px-5 py-5 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Linking your account…
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Connecting your plan membership.
          </p>
        </div>
      </div>
    )
  }

  const signupUrl = `/signup?guest_token=${encodeURIComponent(guestToken)}&plan_id=${encodeURIComponent(planId)}`
  const loginUrl = `/login?guest_token=${encodeURIComponent(guestToken)}&plan_id=${encodeURIComponent(planId)}`

  return (
    <div className="border border-border rounded-xl px-5 py-5 space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Keep this plan with you</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          See your joined plans anytime, stay synced with updates, and get notified when things change.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button
          asChild
          className="flex-1 uppercase tracking-[0.15em] py-3 px-4 rounded-[2px] bg-on-surface text-surface hover:bg-on-surface/90 transition-colors font-medium text-xs flex items-center justify-center gap-2"
        >
          <Link href={signupUrl}>
            Create account
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Link
          href={loginUrl}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 whitespace-nowrap"
        >
          Log in →
        </Link>
      </div>
    </div>
  )
}
