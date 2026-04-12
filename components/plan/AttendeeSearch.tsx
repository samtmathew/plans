'use client'

import { useState, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/common/Avatar'
import { Search } from 'lucide-react'
import type { Profile } from '@/types'

interface AttendeeSearchProps {
  currentUserId: string
  alreadyAddedIds: string[]
  onSelect: (profile: Profile) => void
}

export function AttendeeSearch({
  currentUserId,
  alreadyAddedIds,
  onSelect,
}: AttendeeSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (!q.trim()) {
        setResults([])
        setOpen(false)
        return
      }
      debounceRef.current = setTimeout(async () => {
        setLoading(true)
        try {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
          const json = await res.json()
          if (json.data) {
            // Filter out self
            setResults(json.data.filter((p: Profile) => p.id !== currentUserId))
          }
        } finally {
          setLoading(false)
          setOpen(true)
        }
      }, 300)
    },
    [currentUserId]
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    search(e.target.value)
  }

  function handleSelect(profile: Profile) {
    onSelect(profile)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={handleChange}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search by name…"
          className="pl-9"
        />
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-md overflow-hidden">
          {loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">No users found</div>
          )}
          {!loading &&
            results.map((profile) => {
              const alreadyAdded = alreadyAddedIds.includes(profile.id)
              return (
                <button
                  key={profile.id}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => !alreadyAdded && handleSelect(profile)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <UserAvatar url={profile.avatar_url} name={profile.name} size="sm" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{profile.name}</p>
                    {profile.bio && (
                      <p className="text-xs text-muted-foreground truncate">{profile.bio}</p>
                    )}
                  </div>
                  {alreadyAdded && (
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                      Already added
                    </span>
                  )}
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}
