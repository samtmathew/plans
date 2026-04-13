'use client'

import { useEffect, useState } from 'react'
import type { Profile, Plan } from '@/types'
import { UserAvatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PlanCard } from '@/components/plan/PlanCard'

interface PublicProfileContentProps {
  profile: Profile
  currentUserId?: string
  plans?: Plan[]
}

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

function formatGender(gender: string | null): string {
  if (!gender) return ''
  return gender
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function PublicProfileContent({
  profile,
  currentUserId,
  plans = []
}: PublicProfileContentProps) {
  const [isCollaborator, setIsCollaborator] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  const age = calculateAge(profile.date_of_birth)
  const genderText = formatGender(profile.gender)
  const ageAndGender = age && genderText ? `${age}, ${genderText}` : age ? `${age}` : genderText
  
  const banner = profile.photos?.[0] || null
  const isColorBanner = banner?.startsWith('#')

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

  async function handleJoin() {
    if (!currentUserId) {
      router.push('/login')
      return
    }
    toast.info('Join functionality coming soon')
  }

  return (
    <div className="w-full max-w-screen-2xl mx-auto space-y-16">
      {/* Profile Header Section */}
      <section className="bg-surface rounded-3xl overflow-hidden shadow-sm border border-outline-variant/20">
        <div className="relative">
          {/* Banner Area */}
          <div className="w-full h-48 md:h-64 bg-surface-container-low relative">
            {banner ? (
              isColorBanner ? (
                <div className="w-full h-full" style={{ backgroundColor: banner }} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={banner} alt={`${profile.name}'s banner`} className="w-full h-full object-cover" />
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-surface to-surface-container-low" />
            )}
          </div>

          {/* Avatar Area */}
          <div className="absolute -bottom-16 left-6 md:left-12">
            <div className="rounded-full bg-surface p-1 shadow-md">
              <UserAvatar url={profile.avatar_url} name={profile.name} size="xl" className="h-32 w-32 md:h-40 md:w-40 border-4 border-surface" />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="pt-24 px-6 md:px-12 pb-8">
          <div className="flex flex-col md:flex-row gap-8 justify-between items-start">
            <div className="flex-1 space-y-4 max-w-2xl">
              <div>
                <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter mb-2">{profile.name}</h1>
                {ageAndGender && (
                  <p className="text-neutral-500 font-medium tracking-tight">{ageAndGender}</p>
                )}
              </div>
              
              {profile.bio && (
                <p className="max-w-xl text-lg leading-relaxed text-on-surface/80 font-body">
                  {profile.bio}
                </p>
              )}
              
              <div className="flex flex-wrap gap-6 items-center pt-2">
                {profile.linkedin && (
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-black transition-colors">
                    <span className="material-symbols-outlined text-[18px]">link</span>
                    <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:underline">LinkedIn</a>
                  </div>
                )}
                {profile.instagram && (
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-black transition-colors">
                    <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                    <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:underline">@{profile.instagram}</a>
                  </div>
                )}
                {profile.twitter_x && (
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-black transition-colors">
                    <span className="material-symbols-outlined text-[18px]">share</span>
                    <a href={`https://twitter.com/${profile.twitter_x}`} target="_blank" rel="noopener noreferrer" className="hover:underline">@{profile.twitter_x}</a>
                  </div>
                )}
              </div>

              {/* Member/Join Button */}
              {!isChecking && currentUserId && currentUserId !== profile.id && (
                <div className="pt-6">
                  {isCollaborator ? (
                    <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-surface-container-high text-on-surface text-sm font-medium rounded-full shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                      Shared Plans
                    </div>
                  ) : (
                    <Button onClick={handleJoin} className="rounded-full px-8 py-6 shadow-sm hover:shadow transition-all">
                      Join Plan
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-baseline border-b border-outline-variant/30 pb-4">
          <h2 className="text-2xl md:text-3xl font-headline font-bold tracking-tight">Shared Plans</h2>
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-400">{plans.length} Collections</span>
        </div>
        
        {plans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant">
            <h3 className="text-xl font-headline font-semibold text-on-surface mb-2">No plans available</h3>
            <p className="text-sm text-neutral-500 max-w-sm">This user hasn&apos;t created any plans yet.</p>
          </div>
        )}
      </section>
    </div>
  )
}
