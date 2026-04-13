'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, type ProfileFormValues } from '@/lib/validations/profile'
import { createClient } from '@/lib/supabase/client'
import { AvatarUpload } from '@/components/profile/PhotoUpload'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ArrowRight } from 'lucide-react'

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  )
}

function OnboardingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const guestToken = searchParams.get('guest_token')
  const planId = searchParams.get('plan_id')
  const [userId, setUserId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      bio: null,
      date_of_birth: null,
      gender: null,
      instagram: null,
      linkedin: null,
      twitter_x: null,
    },
  })

  const bio = watch('bio') ?? ''

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  async function onSubmit(values: ProfileFormValues) {
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, avatar_url: avatarUrl }),
      })
      const json = await res.json()
      if (json.error) {
        setError(json.error)
        return
      }

      // If coming from a guest join, link the guest record
      if (guestToken && planId) {
        const linkRes = await fetch('/api/auth/link-guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guest_token: guestToken, plan_id: planId }),
        })
        const linkJson = await linkRes.json()
        if (linkJson.data?.plan_id) {
          router.push(`/plans/${linkJson.data.plan_id}`)
          router.refresh()
          return
        }
        // If linking fails, fall through to /home — don't block onboarding
      }

      router.push('/home')
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col">
      {/* No navbar - transactional post-signup page */}

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-8 py-12">
        <div className="w-full max-w-2xl">
          {/* Logo */}
          <div className="mb-24">
            <Link href="/" className="text-sm font-bold text-on-surface hover:opacity-70 transition-opacity">
              Plans
            </Link>
          </div>

          {/* Headline */}
          <div className="mb-24 space-y-3">
            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-on-surface">
              Curate your profile
            </h1>
            <p className="text-sm text-on-surface-variant">
              Tell us about yourself so others know who&apos;s joining their plans.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-24">
            {/* Section 1: Full name and date of birth */}
            <div className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-on-surface-variant text-xs uppercase tracking-widest font-medium">
                  Full name *
                </Label>
                <input
                  id="name"
                  {...register('name')}
                  type="text"
                  className="w-full bg-transparent border-0 border-b border-on-surface text-4xl md:text-5xl lg:text-6xl font-bold font-headline placeholder:text-on-surface-variant/50 focus:border-on-surface focus:outline-none py-2 transition-colors"
                  placeholder="Your name"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth" className="text-on-surface-variant text-xs uppercase tracking-widest font-medium">
                  Date of birth *
                </Label>
                <input
                  id="date_of_birth"
                  {...register('date_of_birth')}
                  type="date"
                  className="w-full bg-transparent border-0 border-b border-on-surface text-on-surface placeholder:text-on-surface-variant/50 focus:border-on-surface focus:outline-none py-2 transition-colors"
                />
                {errors.date_of_birth && (
                  <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>
                )}
              </div>
            </div>

            {/* Section 2: Avatar upload */}
            {userId && (
              <div className="space-y-3">
                <Label className="text-on-surface-variant text-xs uppercase tracking-widest font-medium">
                  Profile photo
                </Label>
                <div className="flex justify-center">
                  <AvatarUpload
                    userId={userId}
                    currentUrl={avatarUrl}
                    name="You"
                    onUpload={setAvatarUrl}
                  />
                </div>
              </div>
            )}

            {/* Section 3: Bio */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="bio" className="text-on-surface-variant text-xs uppercase tracking-widest font-medium">
                  Bio
                </Label>
                <p className="text-xs text-on-surface-variant">{bio.length}/500</p>
              </div>
              <Textarea
                id="bio"
                {...register('bio')}
                rows={4}
                maxLength={500}
                placeholder="Tell people about yourself... (optional)"
                className="bg-transparent border-0 border-b border-on-surface px-0 py-2 text-on-surface placeholder:text-on-surface-variant/50 focus:border-on-surface focus:outline-none resize-none transition-colors"
              />
            </div>

            {/* Section 4: Social links */}
            <div className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-on-surface-variant text-xs uppercase tracking-widest font-medium">
                  Instagram (optional)
                </Label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">@</span>
                  <input
                    id="instagram"
                    {...register('instagram')}
                    type="text"
                    placeholder="username"
                    className="w-full bg-transparent border-0 border-b border-on-surface text-on-surface placeholder:text-on-surface-variant/50 focus:border-on-surface focus:outline-none py-2 pl-5 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_x" className="text-on-surface-variant text-xs uppercase tracking-widest font-medium">
                  X / Twitter (optional)
                </Label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">@</span>
                  <input
                    id="twitter_x"
                    {...register('twitter_x')}
                    type="text"
                    placeholder="username"
                    className="w-full bg-transparent border-0 border-b border-on-surface text-on-surface placeholder:text-on-surface-variant/50 focus:border-on-surface focus:outline-none py-2 pl-5 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin" className="text-on-surface-variant text-xs uppercase tracking-widest font-medium">
                  LinkedIn (optional)
                </Label>
                <input
                  id="linkedin"
                  {...register('linkedin')}
                  type="url"
                  placeholder="https://linkedin.com/in/…"
                  className="w-full bg-transparent border-0 border-b border-on-surface text-on-surface placeholder:text-on-surface-variant/50 focus:border-on-surface focus:outline-none py-2 transition-colors"
                />
                {errors.linkedin && (
                  <p className="text-xs text-destructive">{errors.linkedin.message}</p>
                )}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-[2px] px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Bottom buttons */}
            <div className="flex flex-col-reverse md:flex-row gap-4 md:gap-6 pt-8 border-t border-on-surface/10">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setIsSubmitting(true)
                  // Save as draft - just redirect without validation
                  router.push('/home')
                  router.refresh()
                }}
                disabled={isSubmitting}
                className="text-on-surface-variant hover:text-on-surface transition-colors text-sm font-medium py-3 px-6 underline underline-offset-2 disabled:opacity-50"
              >
                Save as draft
              </button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 md:flex-initial uppercase tracking-[0.2em] py-4 px-8 rounded-[2px] bg-on-surface text-surface hover:bg-on-surface/90 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    Complete Profile
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low py-8 px-6 md:px-8 border-t border-outline-variant/10">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 text-xs">
          <div className="font-bold font-headline text-on-surface">Plans</div>
          <div className="flex gap-6 md:gap-8">
            <a
              href="#"
              className="uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors opacity-70"
            >
              Privacy
            </a>
            <a
              href="#"
              className="uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors opacity-70 underline underline-offset-2"
            >
              Terms
            </a>
            <a
              href="#"
              className="uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors opacity-70"
            >
              Support
            </a>
          </div>
          <div className="uppercase tracking-widest text-on-surface-variant opacity-70">
            © Plans Boutique Travel
          </div>
        </div>
      </footer>
    </div>
  )
}
