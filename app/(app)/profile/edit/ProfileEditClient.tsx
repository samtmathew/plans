'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { AvatarUpload, BannerUpload } from '@/components/profile/PhotoUpload'
import type { Profile } from '@/types'
import type { ProfileFormValues } from '@/lib/validations/profile'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  profile: Profile
  userId: string
}

export default function ProfileEditClient({ profile, userId }: Props) {
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url ?? null)
  const [banner, setBanner] = useState<string | null>(profile.photos?.[0] ?? null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: ProfileFormValues) {
    setError(null)
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, avatar_url: avatarUrl, photos: banner ? [banner] : [] }),
    })
    const json = await res.json()
    if (json.error) {
      setError(json.error)
      return
    }
    router.push('/profile')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/profile">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Edit profile</h1>
      </div>

      <div className="space-y-6 p-6 rounded-2xl border bg-card">
        <div className="space-y-3">
          <p className="text-sm font-semibold">Profile photo</p>
          <AvatarUpload
            userId={userId}
            currentUrl={avatarUrl}
            name={profile.name}
            onUpload={setAvatarUrl}
          />
        </div>
        <div className="h-px bg-border" />
        <div className="space-y-2">
          <p className="text-sm font-semibold">
            Cover image or color{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </p>
          <BannerUpload userId={userId} currentUrl={banner} onUpload={setBanner} />
        </div>
      </div>

      <ProfileForm
        defaultValues={profile}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </p>
      )}
    </div>
  )
}
