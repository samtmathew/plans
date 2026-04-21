'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlanCard } from '@/components/plan/PlanCard'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Profile, Plan } from '@/types'

interface PublicProfileContentProps {
  profile: Profile
  currentUserId?: string
  plans?: Plan[]
}

const AVATAR_BGS = ['#E5D5C3', '#C4CFEA', '#EEB5B5', '#B8D4C6', '#F5D78A', '#D0C5E5', '#F4B8A3', '#BFD4A3']

function hashName(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0
  return h
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

export function PublicProfileContent({
  profile,
  currentUserId,
  plans = [],
}: PublicProfileContentProps) {
  const [isCollaborator, setIsCollaborator] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  const bannerColor = profile.avatar_color || AVATAR_BGS[hashName(profile.name) % AVATAR_BGS.length]
  const initials = getInitials(profile.name)
  const hostingCount = plans.length

  useEffect(() => {
    if (!currentUserId) {
      setIsChecking(false)
      return
    }

    async function checkCollaborator() {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('plan_attendees')
        .select(`
          plan_id,
          plans!inner(id, organiser_id)
        `)
        .eq('user_id', currentUserId)
        .eq('status', 'approved')
        .eq('plans.organiser_id', profile.id)
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error checking collaborator:', error)
      }

      setIsCollaborator(!!data)
      setIsChecking(false)
    }

    checkCollaborator()
  }, [currentUserId, profile.id])

  async function handleMessage() {
    if (!currentUserId) {
      router.push('/login')
      return
    }
    toast.info('Messaging coming soon')
  }

  return (
    <div className="-mx-6 -mt-8">
      {/* Banner */}
      <div className="relative h-[200px]" style={{ background: bannerColor }}>
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <circle cx="350" cy="60" r="80" fill="currentColor" opacity="0.4"/>
            <circle cx="80" cy="160" r="60" fill="currentColor" opacity="0.3"/>
          </svg>
        </div>
      </div>

      {/* Avatar — overlaps banner by 56px */}
      <div className="px-6">
        <div className="relative -mt-14 mb-4">
          <div
            className="h-[120px] w-[120px] rounded-full flex items-center justify-center font-headline italic text-3xl ring-[6px] ring-white shadow-md overflow-hidden"
            style={{ background: bannerColor, color: '#2E2E2E' }}
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.name} className="h-full w-full rounded-full object-cover" />
            ) : initials}
          </div>
        </div>

        {/* Name + bio + actions */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="font-headline text-2xl font-semibold text-[var(--plans-text)]">{profile.name}</h1>
            {profile.bio && (
              <p className="text-sm text-[var(--plans-text-2)] mt-1 max-w-md">{profile.bio}</p>
            )}
          </div>
          {!isChecking && currentUserId && currentUserId !== profile.id && (
            <button
              onClick={handleMessage}
              className="shrink-0 text-sm font-medium border border-[var(--plans-divider)] rounded-full px-4 py-1.5 text-[var(--plans-text)] hover:bg-[var(--plans-surface)] transition-colors"
            >
              {isCollaborator ? 'Message' : 'Message'}
            </button>
          )}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 border-t border-b border-[var(--plans-divider)] py-4 mb-6">
          {[
            { label: 'Hosting', value: hostingCount },
            { label: 'Attending', value: 0 },
            { label: 'Past plans', value: 0 },
            { label: 'Friends', value: 0 },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="font-headline text-2xl font-bold text-[var(--plans-text)]">{value}</p>
              <p className="text-[10px] uppercase tracking-widest text-[var(--plans-text-2)] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="plans">
          <TabsList className="w-full justify-start rounded-none h-auto bg-transparent pb-0 mb-6 gap-0 border-b border-[var(--plans-divider)]">
            <TabsTrigger
              value="plans"
              className="capitalize rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--plans-text)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--plans-text)] text-[var(--plans-text-2)] px-4 pb-3 text-sm font-medium"
            >
              Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            {plans.length > 0 ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
                {plans.map((plan) => (
                  <div key={plan.id} className="break-inside-avoid mb-5">
                    <PlanCard plan={plan} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center border border-dashed border-[var(--plans-divider)] rounded-2xl">
                <p className="text-sm text-[var(--plans-text-2)]">No plans yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
