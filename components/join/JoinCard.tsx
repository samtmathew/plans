'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { JoinCardPreviewFace } from './JoinCardPreviewFace'
import { JoinCardFormFace } from './JoinCardFormFace'
import { JoinStatusCard } from './JoinStatusCard'
import { GuestFullPlan } from './GuestFullPlan'
import { GuestConversionBanner } from './GuestConversionBanner'
import type { PlanPreviewData } from '@/types'
// Note: GuestFullPlan does not need the plan prop — it fetches its own full data

type GuestState = 'preview' | 'form' | 'pending' | 'approved' | 'rejected'

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
  }, [joinToken])

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

  async function handleFormSubmit(name: string, email: string) {
    const res = await fetch(`/api/join/${joinToken}/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: email || undefined }),
    })
    const { data, error } = await res.json()
    if (error || !data) throw new Error(error ?? 'Failed to join')

    localStorage.setItem(
      storageKey(joinToken),
      JSON.stringify({ guest_token: data.guest_token, name, status: 'pending' })
    )
    setGuestToken(data.guest_token)
    setGuestName(name)
    setIsFlipped(false)
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

  if (state === 'pending') {
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
