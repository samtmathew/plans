'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

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
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Profile setup</p>
          <h1 className="text-2xl font-bold">Tell us about yourself</h1>
          <p className="text-sm text-muted-foreground">
            This helps others know who&apos;s joining their plans.
          </p>
        </div>

        {userId ? (
          <div className="space-y-6 p-6 rounded-2xl border bg-card">
            <div className="space-y-3">
              <p className="text-sm font-semibold">Profile photo</p>
              <AvatarUpload
                userId={userId}
                currentUrl={avatarUrl}
                name="You"
                onUpload={setAvatarUrl}
              />
            </div>
            <div className="h-px bg-border" />
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                Cover photos{' '}
                <span className="text-muted-foreground font-normal">(optional, up to 3)</span>
              </p>
              <PhotosUpload userId={userId} currentUrls={photos} onUpload={setPhotos} />
            </div>
          </div>
        ) : (
          <div className="h-40 rounded-2xl border bg-muted/50 animate-pulse" />
        )}

        <ProfileForm onSubmit={handleSubmit} submitLabel="Finish setup" />

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            {error}
          </p>
        )}
      </div>
    </main>
  )
}
