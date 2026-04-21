'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { JoinCardPreviewFace } from './JoinCardPreviewFace'
import { JoinCardFormFace } from './JoinCardFormFace'
import { JoinStatusCard } from './JoinStatusCard'
import { GuestFullPlan } from './GuestFullPlan'
import { GuestConversionBanner } from './GuestConversionBanner'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PlanPreviewData } from '@/types'
// Note: GuestFullPlan does not need the plan prop — it fetches its own full data

type GuestState = 'preview' | 'form' | 'pending' | 'approved' | 'rejected'

function HoldTightFlipCard() {
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setFlipped(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      className="w-full max-w-[420px] mx-auto"
      style={{ perspective: '1000px', height: 580 }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 800ms cubic-bezier(0.4,0,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front face — blank placeholder so the flip has something to rotate from */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: 16,
            background: 'var(--plans-surface)',
          }}
        />

        {/* Back face — "Hold tight." */}
        <div
          className="absolute inset-0 rounded-[16px] bg-[var(--plans-text)] flex flex-col items-center justify-center text-white p-8 text-center"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            transition: 'transform 800ms cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <Clock className="h-7 w-7 text-white" />
          </div>
          <h2 className="font-headline italic text-3xl mb-2">Hold tight.</h2>
          <p className="text-white/70 text-sm">
            Your request has been sent. The organiser will approve it soon.
          </p>
        </div>
      </div>
    </div>
  )
}

interface StoredSession {
  guest_token: string
  name: string
  status: GuestState
}

interface Props {
  plan: PlanPreviewData
  joinToken: string
  authedUser: { id: string; name: string; avatar_url: string | null } | null
}

function storageKey(joinToken: string) {
  return `plans_join_${joinToken}`
}

export function JoinCard({ plan, joinToken, authedUser }: Props) {
  const router = useRouter()
  const [state, setState] = useState<GuestState>('preview')
  const [isFlipped, setIsFlipped] = useState(false)
  const [holdTight, setHoldTight] = useState(false)
  const [guestToken, setGuestToken] = useState<string | null>(null)
  const [guestName, setGuestName] = useState(authedUser?.name ?? '')

  useEffect(() => {
    const raw = localStorage.getItem(storageKey(joinToken))
    if (!raw) return

    let session: StoredSession
    try {
      session = JSON.parse(raw)
    } catch {
      localStorage.removeItem(storageKey(joinToken))
      return
    }

    setGuestToken(session.guest_token)
    if (!authedUser) setGuestName(session.name)

    fetch(`/api/join/${joinToken}/guest-status?token=${session.guest_token}`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data) {
          localStorage.removeItem(storageKey(joinToken))
          return
        }
        const freshStatus = data.status as GuestState
        setState(freshStatus)
        localStorage.setItem(
          storageKey(joinToken),
          JSON.stringify({ ...session, status: freshStatus })
        )
      })
      .catch(() => {
        setState(session.status)
      })
  }, [joinToken, authedUser])

  function handleImIn() {
    setIsFlipped(true)
    setState('form')
  }

  async function handleAuthJoin() {
    try {
      const res = await fetch(`/api/join/${joinToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const { data, error } = await res.json()
      if (error || !data) throw new Error(error ?? 'Failed to join')

      if (data.status === 'approved') {
        router.push(`/plans/${data.plan_id}`)
      } else {
        setHoldTight(true)
        setState('pending')
      }
    } catch (err) {
      console.error('Auth join failed:', err)
    }
  }

  function handleFormBack() {
    setIsFlipped(false)
    setState('preview')
  }

  async function handleFormSubmit(name: string) {
    const res = await fetch(`/api/join/${joinToken}/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const { data, error } = await res.json()
    if (error || !data) throw new Error(error ?? 'Failed to join')

    localStorage.setItem(
      storageKey(joinToken),
      JSON.stringify({ guest_token: data.guest_token, name, status: 'pending' })
    )
    setGuestToken(data.guest_token)
    setGuestName(name)
    setHoldTight(true)
    setState('pending')
  }

  if (state === 'approved' && guestToken) {
    return (
      <div className="w-full max-w-[420px] mx-auto space-y-6">
        <JoinStatusCard state="approved" guestName={guestName} />
        <GuestFullPlan joinToken={joinToken} guestToken={guestToken} />
        <GuestConversionBanner guestToken={guestToken} planId={plan.id} />
      </div>
    )
  }

  if (state === 'rejected') {
    return (
      <div className="w-full max-w-[420px] mx-auto">
        <JoinStatusCard state="rejected" guestName={guestName} />
      </div>
    )
  }

  if (holdTight) {
    return <HoldTightFlipCard />
  }

  if (state === 'pending') {
    if (authedUser) {
      return (
        <div className="w-full max-w-[420px] mx-auto">
          <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4 shadow-[var(--shadow-card)]">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold font-headline">{authedUser.name}, you&apos;re in the queue</h2>
              <p className="text-sm text-muted-foreground">
                {plan.organiser.name} will review your request. We&apos;ll notify you via the bell icon when approved.
              </p>
            </div>
            <Link href="/home" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Go to your home page
            </Link>
          </div>
        </div>
      )
    }
    return (
      <div className="w-full max-w-[420px] mx-auto">
        <JoinStatusCard
          state="pending"
          guestName={guestName}
          planTitle={plan.title}
          organiserName={plan.organiser.name}
        />
      </div>
    )
  }

  const cardHeight = 580

  return (
    <div
      className="w-full max-w-[420px] mx-auto"
      style={{ perspective: '1200px', height: cardHeight }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <JoinCardPreviewFace
            plan={plan}
            onImIn={handleImIn}
            authedUser={authedUser}
            onAuthJoin={handleAuthJoin}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <JoinCardFormFace
            plan={plan}
            onBack={handleFormBack}
            onSubmit={handleFormSubmit}
          />
        </div>
      </div>
    </div>
  )
}
