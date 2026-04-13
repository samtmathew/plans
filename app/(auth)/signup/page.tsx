'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, Mail, ArrowRight } from 'lucide-react'

const schema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
type FormValues = z.infer<typeof schema>

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const searchParams = useSearchParams()
  const guestToken = searchParams.get('guest_token')
  const planId = searchParams.get('plan_id')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(values: FormValues) {
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: guestToken && planId
          ? `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?guest_token=${encodeURIComponent(guestToken)}&plan_id=${encodeURIComponent(planId)}`
          : `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
      },
    })
    if (error) {
      setError(error.message)
      return
    }
    setSubmittedEmail(values.email)
    setVerificationSent(true)
  }

  if (verificationSent) {
    return (
      <div className="min-h-screen flex flex-col bg-surface text-on-surface overflow-hidden">
        {/* Ambient gradient background */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          {/* Top-right radial gradient */}
          <div
            className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-30"
            style={{
              background: 'radial-gradient(circle, var(--surface-container-high), transparent)',
              filter: 'blur(80px)',
            }}
          />
          {/* Bottom-left radial gradient */}
          <div
            className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-30"
            style={{
              background: 'radial-gradient(circle, var(--surface-container-low), transparent)',
              filter: 'blur(80px)',
            }}
          />
        </div>

        <main className="flex-1 flex items-center justify-center px-6 md:px-8 py-12">
          <div className="w-full max-w-sm text-center space-y-5">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-surface-container-high flex items-center justify-center">
                <Mail className="h-6 w-6 text-on-surface-variant" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-on-surface">Check your email</h1>
              <p className="text-on-surface-variant text-sm">
                We sent a verification link to{' '}
                <span className="font-medium text-on-surface">{submittedEmail}</span>.
                Click it to complete signup.
              </p>
            </div>
            <Link
              href="/login"
              className="text-sm underline underline-offset-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Back to log in
            </Link>
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

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface overflow-hidden">
      {/* Ambient gradient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Top-right radial gradient */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, var(--surface-container-high), transparent)',
            filter: 'blur(80px)',
          }}
        />
        {/* Bottom-left radial gradient */}
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, var(--surface-container-low), transparent)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-8 py-12">
        <div className="w-full max-w-6xl">
          {/* Two-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 lg:gap-24 items-center">
            {/* Left Column - Branding & Hero Image (hidden on mobile) */}
            <div className="hidden md:flex flex-col justify-center space-y-12">
              {/* Logo */}
              <div>
                <Link href="/" className="text-sm font-bold text-on-surface hover:opacity-70 transition-opacity">
                  Plans
                </Link>
              </div>

              {/* Headline and description */}
              <div className="space-y-6">
                <h1 className="font-headline text-5xl md:text-5xl font-bold tracking-tighter leading-[0.9] text-on-surface">
                  Create your own journey
                </h1>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Structure your trips with intention. Collaborate with friends. Keep track of costs. All in one place.
                </p>
              </div>

              {/* Hero image */}
              <div className="rounded-xl overflow-hidden">
                <div className="aspect-[4/5] w-full relative">
                  <Image
                    src="/images/hero_image.png"
                    alt="Plans — create your journey"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="w-full max-w-[380px] space-y-12">
              {/* Mobile logo and headline */}
              <div className="md:hidden space-y-4">
                <Link href="/" className="text-sm font-bold text-on-surface hover:opacity-70 transition-opacity">
                  Plans
                </Link>
                <h1 className="font-headline text-4xl font-bold tracking-tighter leading-[0.9] text-on-surface">
                  Create your own journey
                </h1>
                <p className="text-sm text-on-surface-variant">
                  Structure your trips with intention.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-on-surface-variant">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="border-0 border-b bg-transparent px-0 py-2 text-on-surface placeholder:text-on-surface-variant/50 focus:border-on-surface"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-on-surface-variant">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      className="border-0 border-b bg-transparent px-0 py-2 text-on-surface placeholder:text-on-surface-variant/50 focus:border-on-surface pr-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-on-surface-variant">
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="border-0 border-b bg-transparent px-0 py-2 text-on-surface placeholder:text-on-surface-variant/50 focus:border-on-surface pr-10"
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Error message */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-[2px] px-4 py-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full uppercase tracking-[0.2em] py-4 px-6 rounded-[2px] bg-on-surface text-surface hover:bg-on-surface/90 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/20" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-surface px-2 text-on-surface-variant">or</span>
                </div>
              </div>

              {/* Social auth button (placeholder) */}
              <Button
                type="button"
                variant="outline"
                className="w-full uppercase tracking-[0.2em] py-4 px-6 rounded-[2px] border border-outline-variant/20 text-on-surface hover:bg-surface-container-low transition-colors font-medium text-sm"
                disabled
              >
                Continue with Google
              </Button>

              {/* Sign in link */}
              <p className="text-center text-sm text-on-surface-variant">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-on-surface font-medium hover:opacity-70 transition-opacity underline underline-offset-2"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
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
