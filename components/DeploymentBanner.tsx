'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, RefreshCw } from 'lucide-react'

export default function DeploymentBanner() {
  const [show, setShow] = useState(false)
  const knownBuildId = useRef<string>(process.env.NEXT_PUBLIC_BUILD_ID ?? 'local')

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/version')
        if (!res.ok) return
        const data: { buildId: string } = await res.json()
        if (data.buildId !== knownBuildId.current && knownBuildId.current !== 'local') {
          setShow(true)
        }
      } catch {
        // silently ignore network errors
      }
    }

    check()
    const id = setInterval(check, 300_000)
    return () => clearInterval(id)
  }, [])

  if (!show) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div className="flex items-center gap-3 rounded-full border border-border bg-background/80 backdrop-blur-md px-4 py-2.5 shadow-lg shadow-black/[0.08] ring-1 ring-black/[0.04]">
        {/* Pulse dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/40 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-foreground/70" />
        </span>

        <p className="text-sm text-muted-foreground whitespace-nowrap">
          A new version is available
        </p>

        <Button
          size="sm"
          className="h-7 rounded-full px-3 text-xs font-medium"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="mr-1.5 h-3 w-3" />
          Refresh
        </Button>

        <button
          onClick={() => setShow(false)}
          className="ml-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
