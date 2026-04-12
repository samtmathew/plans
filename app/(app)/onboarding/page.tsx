'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { AvatarUpload, PhotosUpload } from '@/components/profile/PhotoUpload'
import { createClient } from '@/lib/supabase/client'
import type { ProfileFormValues } from '@/lib/validations/profile'

export default function OnboardingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Get user id on mount
  if (!userId) {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null))
  }

  async function handleSubmit(values: ProfileFormValues) {
    setError(null)
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, avatar_url: avatarUrl, photos }),
    })
    const json = await res.json()
    if (json.error) {
      setError(json.error)
      return
    }
    router.push('/home')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Set up your profile</h1>
          <p className="text-sm text-muted-foreground">
            Tell others about yourself so they know who&apos;s joining.
          </p>
        </div>

        {userId && (
          <div className="space-y-4">
            <AvatarUpload
              userId={userId}
              currentUrl={avatarUrl}
              name="You"
              onUpload={setAvatarUrl}
            />
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Additional photos</p>
              <PhotosUpload userId={userId} currentUrls={photos} onUpload={setPhotos} />
            </div>
          </div>
        )}

        <ProfileForm
          onSubmit={handleSubmit}
          submitLabel="Finish setup"
        />

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            {error}
          </p>
        )}
      </div>
    </main>
  )
}
