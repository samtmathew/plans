'use client'

import { useState, useRef } from 'react'
import type { Profile } from '@/types'
import { UserAvatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AvatarUpload } from '@/components/profile/PhotoUpload'
import { Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface OwnProfileContentProps {
  profile: Profile
  userId: string
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

export function OwnProfileContent({ profile, userId }: OwnProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio || '')
  const [instagram, setInstagram] = useState(profile.instagram || '')
  const [linkedin, setLinkedin] = useState(profile.linkedin || '')
  const [twitterX, setTwitterX] = useState(profile.twitter_x || '')
  const [photos, setPhotos] = useState<string[]>(profile.photos || [])
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [isSaving, setIsSaving] = useState(false)
  const photoInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null])

  const age = calculateAge(profile.date_of_birth)
  const genderText = formatGender(profile.gender)
  const ageAndGender = age && genderText ? `${age}, ${genderText}` : age ? `${age}` : genderText

  async function handleSave() {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          bio: bio || null,
          instagram: instagram || null,
          linkedin: linkedin || null,
          twitter_x: twitterX || null,
          avatar_url: avatarUrl || null,
          photos,
        })
        .eq('id', userId)

      if (error) throw error
      setIsEditing(false)
      toast.success('Profile updated')
    } catch (err) {
      console.error('Profile update error:', err)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setName(profile.name)
    setBio(profile.bio || '')
    setInstagram(profile.instagram || '')
    setLinkedin(profile.linkedin || '')
    setTwitterX(profile.twitter_x || '')
    setPhotos(profile.photos || [])
    setAvatarUrl(profile.avatar_url || '')
    setIsEditing(false)
  }

  const handlePhotoSelect = (idx: number) => {
    const input = photoInputRefs.current[idx]
    input?.click()
  }

  const handlePhotoChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result
        if (typeof result === 'string') {
          const updated = [...photos]
          updated[idx] = result
          setPhotos(updated)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="w-full">
      {/* Photo Strip */}
      <div className="grid grid-cols-3 gap-2 mb-0">
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="aspect-[3/4] bg-surface-container rounded-lg overflow-hidden">
            {isEditing ? (
              <>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(ref) => {
                    photoInputRefs.current[idx] = ref
                  }}
                  onChange={(e) => handlePhotoChange(idx, e)}
                />
                <button
                  type="button"
                  onClick={() => handlePhotoSelect(idx)}
                  className="w-full h-full flex items-center justify-center border-2 border-dashed border-surface-container hover:border-primary transition-colors"
                >
                  {photos[idx] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photos[idx]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-xs text-muted-foreground">
                      <div className="text-2xl mb-1">+</div>
                      <div>Add</div>
                    </div>
                  )}
                </button>
              </>
            ) : photos[idx] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photos[idx]} alt="" className="w-full h-full object-cover" />
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
          {isEditing ? (
            <AvatarUpload
              userId={userId}
              currentUrl={avatarUrl}
              name={name}
              onUpload={(url) => setAvatarUrl(url)}
            />
          ) : (
            <UserAvatar url={avatarUrl} name={name} size="64" className="border-4 border-white" />
          )}
        </div>

        {/* Content */}
        <div className="pt-12 space-y-2">
          {isEditing ? (
            <>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-0 border-b bg-transparent font-headline text-[22px] font-bold text-on-surface px-0"
                placeholder="Your name"
              />
            </>
          ) : (
            <h1 className="font-headline text-[22px] font-bold text-on-surface">{name}</h1>
          )}

          {/* Age + Gender */}
          {isEditing ? (
            <p className="text-sm text-muted-foreground">{ageAndGender || 'Not set'}</p>
          ) : (
            ageAndGender && <p className="text-sm text-muted-foreground">{ageAndGender}</p>
          )}

          {/* Bio */}
          {isEditing ? (
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="border-0 border-b bg-transparent text-sm text-on-surface px-0 resize-none mt-2"
              placeholder="Tell people about yourself..."
              rows={2}
            />
          ) : (
            bio && <p className="text-sm text-on-surface mt-2">{bio}</p>
          )}

          {/* Social Links */}
          {isEditing ? (
            <div className="space-y-2 pt-2">
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">@</span>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Instagram"
                  className="border-0 border-b bg-transparent text-xs px-0 pl-4"
                />
              </div>
              <Input
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="LinkedIn URL"
                className="border-0 border-b bg-transparent text-xs px-0"
                type="url"
              />
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">@</span>
                <Input
                  value={twitterX}
                  onChange={(e) => setTwitterX(e.target.value)}
                  placeholder="X / Twitter"
                  className="border-0 border-b bg-transparent text-xs px-0 pl-4"
                />
              </div>
            </div>
          ) : (
            <div className="flex gap-3 pt-2">
              {instagram && (
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-on-surface transition-colors text-xs"
                  aria-label="Instagram"
                >
                  instagram
                </a>
              )}
              {linkedin && (
                <a
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-on-surface transition-colors text-xs"
                  aria-label="LinkedIn"
                >
                  linkedin
                </a>
              )}
              {twitterX && (
                <a
                  href={`https://twitter.com/${twitterX}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-on-surface transition-colors text-xs"
                  aria-label="Twitter/X"
                >
                  x
                </a>
              )}
            </div>
          )}
        </div>

        {/* Edit/Save/Cancel Buttons */}
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-6 inline-flex items-center gap-2 text-muted-foreground hover:text-on-surface transition-colors"
          >
            <Pencil className="h-4 w-4" />
            <span className="text-xs font-medium">Edit profile</span>
          </button>
        ) : (
          <div className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
