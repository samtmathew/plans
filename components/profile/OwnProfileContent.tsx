'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlanCard } from '@/components/plan/PlanCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AvatarUpload, BannerUpload } from '@/components/profile/PhotoUpload'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile, Plan } from '@/types'

interface Props {
  profile: Profile
  userId: string
  plans: Plan[]
  attendingPlans: Plan[]
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

export function OwnProfileContent({ profile, userId, plans, attendingPlans }: Props) {
  const bannerColor = profile.avatar_color || AVATAR_BGS[hashName(profile.name) % AVATAR_BGS.length]
  const initials = getInitials(profile.name)
  const hostingCount = plans.length
  const attendingCount = attendingPlans.length

  // Edit form state
  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio || '')
  const [instagram, setInstagram] = useState(profile.instagram || '')
  const [linkedin, setLinkedin] = useState(profile.linkedin || '')
  const [twitterX, setTwitterX] = useState(profile.twitter_x || '')
  const [banner, setBanner] = useState<string | null>(profile.photos?.[0] || null)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [isSaving, setIsSaving] = useState(false)

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
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 border-t border-b border-[var(--plans-divider)] py-4 mb-6">
          {[
            { label: 'Hosting', value: hostingCount },
            { label: 'Attending', value: attendingCount },
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
            {(['plans', 'settings'] as const).map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="capitalize rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--plans-text)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--plans-text)] text-[var(--plans-text-2)] px-4 pb-3 text-sm font-medium"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="plans">
            {/* Hosting */}
            {plans.length > 0 && (
              <div className="mb-8">
                <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-[var(--plans-text-2)] mb-4">Hosting</p>
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
                  {plans.map((plan) => (
                    <div key={plan.id} className="break-inside-avoid mb-5">
                      <PlanCard plan={plan as Plan} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Attending */}
            {attendingPlans.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-[var(--plans-text-2)] mb-4">Attending</p>
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
                  {(attendingPlans as Plan[]).map((plan) => (
                    <div key={plan.id} className="break-inside-avoid mb-5">
                      <PlanCard plan={plan} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {plans.length === 0 && attendingPlans.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center text-center border border-dashed border-[var(--plans-divider)] rounded-2xl">
                <p className="text-sm text-[var(--plans-text-2)] mb-4">No plans yet.</p>
                <Button asChild>
                  <a href="/plans/new">Create a plan</a>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <div className="max-w-md space-y-6">
              {/* Avatar upload */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--plans-text-2)] mb-2">Avatar</p>
                <AvatarUpload
                  userId={userId}
                  currentUrl={avatarUrl}
                  name={name}
                  onUpload={setAvatarUrl}
                />
              </div>

              {/* Banner upload */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--plans-text-2)] mb-2">Banner</p>
                <BannerUpload userId={userId} currentUrl={banner} onUpload={setBanner} />
              </div>

              {/* Display name */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--plans-text-2)] mb-1">Display name</p>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-0 border-b border-[var(--plans-divider)] rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-[var(--plans-text)]"
                  placeholder="Your name"
                />
              </div>

              {/* Bio */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--plans-text-2)] mb-1">Bio</p>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="border border-[var(--plans-divider)] bg-transparent resize-none min-h-[80px] text-sm"
                  placeholder="Tell people about yourself…"
                />
              </div>

              {/* Social links */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-[var(--plans-text-2)]">Social links</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--plans-text-2)]">@</span>
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="Instagram"
                    className="pl-7 border-0 border-b border-[var(--plans-divider)] rounded-none bg-transparent px-0 pl-6 focus-visible:ring-0"
                  />
                </div>
                <Input
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="LinkedIn URL"
                  type="url"
                  className="border-0 border-b border-[var(--plans-divider)] rounded-none bg-transparent px-0 focus-visible:ring-0"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--plans-text-2)]">@</span>
                  <Input
                    value={twitterX}
                    onChange={(e) => setTwitterX(e.target.value)}
                    placeholder="X / Twitter"
                    className="pl-7 border-0 border-b border-[var(--plans-divider)] rounded-none bg-transparent px-0 pl-6 focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleCancel} disabled={isSaving} className="rounded-full">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="rounded-full">
                  {isSaving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
