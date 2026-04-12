'use client'

import { useState } from 'react'
import type { Profile, Plan } from '@/types'
import { UserAvatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AvatarUpload, BannerUpload } from '@/components/profile/PhotoUpload'
import { Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PlanCard } from '@/components/plan/PlanCard'

interface OwnProfileContentProps {
  profile: Profile
  userId: string
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

export function OwnProfileContent({ profile, userId, plans = [] }: OwnProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio || '')
  const [instagram, setInstagram] = useState(profile.instagram || '')
  const [linkedin, setLinkedin] = useState(profile.linkedin || '')
  const [twitterX, setTwitterX] = useState(profile.twitter_x || '')
  const [banner, setBanner] = useState<string | null>(profile.photos?.[0] || null)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [isSaving, setIsSaving] = useState(false)

  const age = calculateAge(profile.date_of_birth)
  const genderText = formatGender(profile.gender)
  const ageAndGender = age && genderText ? `${age}, ${genderText}` : age ? `${age}` : genderText
  const isColorBanner = banner?.startsWith('#')

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
          photos: banner ? [banner] : [],
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
    setBanner(profile.photos?.[0] || null)
    setAvatarUrl(profile.avatar_url || '')
    setIsEditing(false)
  }

  return (
    <div className="w-full max-w-screen-2xl mx-auto space-y-16">
      {/* Profile Header Section */}
      <section className="bg-surface rounded-3xl overflow-hidden shadow-sm border border-outline-variant/20">
        <div className="relative">
          {/* Banner Area */}
          <div className="w-full h-48 md:h-64 bg-surface-container-low relative">
            {isEditing ? (
              <div className="absolute inset-0 bg-surface/90 flex items-center justify-center p-4 z-10 transition-all">
                <div className="w-full max-w-xl bg-surface p-6 rounded-xl shadow-lg border border-outline-variant">
                  <BannerUpload userId={userId} currentUrl={banner} onUpload={setBanner} />
                </div>
              </div>
            ) : banner ? (
              isColorBanner ? (
                <div className="w-full h-full" style={{ backgroundColor: banner }} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={banner} alt={`${name}'s banner`} className="w-full h-full object-cover" />
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-surface to-surface-container-low" />
            )}
            
            {/* Edit Button Toggle */}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute top-4 right-4 bg-surface/80 backdrop-blur-sm hover:bg-surface text-on-surface p-2 rounded-full shadow-sm transition-all z-10"
                aria-label="Edit Profile"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Avatar Area */}
          <div className="absolute -bottom-16 left-6 md:left-12">
            <div className="rounded-full bg-surface p-1 shadow-md">
              {isEditing ? (
                <AvatarUpload
                  userId={userId}
                  currentUrl={avatarUrl}
                  name={name}
                  onUpload={setAvatarUrl}
                />
              ) : (
                <UserAvatar url={avatarUrl} name={name} size="xl" className="h-32 w-32 md:h-40 md:w-40 border-4 border-surface" />
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="pt-24 px-6 md:px-12 pb-8">
          <div className="flex flex-col md:flex-row gap-8 justify-between items-start">
            <div className="flex-1 space-y-4 max-w-2xl">
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-b bg-transparent font-headline text-3xl md:text-5xl font-bold text-on-surface px-0 py-6 h-auto"
                    placeholder="Your name"
                  />
                  <p className="text-sm text-neutral-500 font-medium tracking-tight">
                    {ageAndGender || 'Age & Gender not set'}
                  </p>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="border bg-surface text-lg leading-relaxed text-on-surface/80 font-body px-4 py-3 rounded-lg resize-none min-h-[120px]"
                    placeholder="Designing memories through curated itineraries..."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                      <Input
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="Instagram"
                        className="pl-8"
                      />
                    </div>
                    <Input
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="LinkedIn URL"
                      type="url"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                      <Input
                        value={twitterX}
                        onChange={(e) => setTwitterX(e.target.value)}
                        placeholder="X / Twitter"
                        className="pl-8"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-end pt-4">
                    <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter mb-2">{name}</h1>
                    {ageAndGender && (
                      <p className="text-neutral-500 font-medium tracking-tight">{ageAndGender}</p>
                    )}
                  </div>
                  
                  {bio && (
                    <p className="max-w-xl text-lg leading-relaxed text-on-surface/80 font-body">
                      {bio}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-6 items-center pt-2">
                    {linkedin && (
                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-black transition-colors">
                        <span className="material-symbols-outlined text-[18px]">link</span>
                        <a href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:underline">LinkedIn</a>
                      </div>
                    )}
                    {instagram && (
                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-black transition-colors">
                        <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                        <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className="hover:underline">@{instagram}</a>
                      </div>
                    )}
                    {twitterX && (
                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-black transition-colors">
                        <span className="material-symbols-outlined text-[18px]">share</span>
                        <a href={`https://twitter.com/${twitterX}`} target="_blank" rel="noopener noreferrer" className="hover:underline">@{twitterX}</a>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-baseline border-b border-outline-variant/30 pb-4">
          <h2 className="text-2xl md:text-3xl font-headline font-bold tracking-tight">My Plans</h2>
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
            <h3 className="text-xl font-headline font-semibold text-on-surface mb-2">No plans created yet</h3>
            <p className="text-sm text-neutral-500 max-w-sm">Create your first itinerary and start organizing your trips.</p>
            <Button className="mt-8" asChild>
              <a href="/plans/new">Create Plan</a>
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
