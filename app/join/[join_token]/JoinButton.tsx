'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

interface JoinButtonProps {
  planId: string
  joinToken: string
}

export function JoinButton({ planId, joinToken }: JoinButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/join/${joinToken}`, { method: 'POST' })
    const json = await res.json()
    if (json.error) {
      setError(json.error)
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
    // Navigate to plan (will show pending state if approval required)
    router.push(`/plans/${planId}`)
    router.refresh()
  }

  if (done) return null

  return (
    <div className="space-y-2">
      <Button
        onClick={handleJoin}
        disabled={loading}
        className="w-full rounded-[2px]"
      >
        {loading ? 'Sending request…' : 'Join Plan'}
        {!loading && <ChevronRight className="w-4 h-4" />}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
