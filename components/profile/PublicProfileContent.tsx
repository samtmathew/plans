'use client'

import { useEffect, useState } from 'react'
import type { Profile } from '@/types'
import { UserAvatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface PublicProfileContentProps {
  profile: Profile
  currentUserId?: string
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
}: PublicProfileContentProps) {
  const [isCollaborator, setIsCollaborator] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  const age = calculateAge(profile.date_of_birth)
  const genderText = formatGender(profile.gender)
  const ageAndGender = age && genderText ? `${age}, ${genderText}` : age ? `${age}` : genderText

  useEffect(() => {
    if (!currentUserId) {
      setIsChecking(false)
      return
    }

    async function checkCollaborator() {
      const supabase = createClient()
      const { data: collaborations } = await supabase
        .from('plan_attendees')
        .select('plan_id')
        .eq('user_id', currentUserId)
        .eq('status', 'approved')
        .single()

      // Check if they share any plans with the viewed user
      if (collaborations) {
        const { data: sharedPlans } = await supabase
          .from('plans')
          .select('id')
          .eq('organiser_id', profile.id)
          .eq('id', collaborations.plan_id)
          .single()
        setIsCollaborator(!!sharedPlans)
      }
      setIsChecking(false)
    }

    checkCollaborator()
  }, [currentUserId, profile.id])

  async function handleJoin() {
    if (!currentUserId) {
      router.push('/login')
      return
    }
    // TODO: Implement join logic when plans are available
    toast.info('Join functionality coming soon')
  }

  return (
    <div className="w-full">
      {/* Photo Strip */}
      <div className="grid grid-cols-3 gap-2 mb-0">
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="aspect-[3/4] bg-surface-container rounded-lg overflow-hidden">
            {profile.photos && profile.photos[idx] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photos[idx]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-surface via-surface to-surface-raised flex items-center justify-center">
                <div className="text-muted-foreground text-xs">No photo</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Avatar Band */}
      <div className="relative bg-amber-200 dark:bg-amber-900/30 px-6 pb-6 pt-12">
        {/* Avatar overlapping upward */}
        <div className="absolute left-6 -top-8">
          <UserAvatar url={profile.avatar_url} name={profile.name} size="64" className="border-4 border-white" />
        </div>

        {/* Content */}
        <div className="pt-12 space-y-2">
          <h1 className="font-headline text-2xl font-bold text-on-surface">{profile.name}</h1>

          {/* Age + Gender */}
          {ageAndGender && <p className="text-sm text-muted-foreground">{ageAndGender}</p>}

          {/* Bio */}
          {profile.bio && <p className="text-sm text-on-surface mt-2">{profile.bio}</p>}

          {/* Social Links */}
          <div className="flex gap-3 pt-2">
            {profile.instagram && (
              <a
                href={`https://instagram.com/${profile.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-on-surface transition-colors text-xs"
                aria-label="Instagram"
              >
                instagram
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-on-surface transition-colors text-xs"
                aria-label="LinkedIn"
              >
                linkedin
              </a>
            )}
            {profile.twitter_x && (
              <a
                href={`https://twitter.com/${profile.twitter_x}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-on-surface transition-colors text-xs"
                aria-label="Twitter/X"
              >
                x
              </a>
            )}
          </div>
        </div>

        {/* Member/Join Button */}
        {!isChecking && currentUserId && currentUserId !== profile.id && (
          <div className="mt-6">
            {isCollaborator ? (
              <div className="px-4 py-2 bg-muted text-muted-foreground text-xs font-medium text-center rounded">
                Member
              </div>
            ) : (
              <Button onClick={handleJoin} className="w-full">
                Join
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
