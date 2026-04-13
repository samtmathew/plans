'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/home'
  const guestToken = searchParams.get('guest_token')
  const planId = searchParams.get('plan_id')
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: FormValues) {
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) {
      setError(error.message)
      return
    }
    if (guestToken && planId) {
      try {
        await fetch('/api/auth/link-guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guest_token: guestToken, plan_id: planId }),
        })
      } catch {
        // link-guest failure is non-fatal — user is logged in, still redirect to plan
      }
      router.push(`/plans/${planId}`)
      router.refresh()
      return
    }
    router.push(redirect)
    router.refresh()
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
        <div className="w-full max-w-[380px] space-y-12">
          {/* Logo */}
          <div>
            <Link href="/" className="text-sm font-bold text-on-surface hover:opacity-70 transition-opacity">
              Plans
            </Link>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tighter leading-[0.9] text-on-surface">
              Welcome
            </h1>
            <p className="text-sm text-on-surface-variant">
              Log in to access your trips and plans.
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-on-surface-variant">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-on-surface-variant hover:text-on-surface transition-colors underline underline-offset-2"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
                  Logging in…
                </>
              ) : (
                <>
                  Log In
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

          {/* Sign up link */}
          <p className="text-center text-sm text-on-surface-variant">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-on-surface font-medium hover:opacity-70 transition-opacity underline underline-offset-2"
            >
              Sign up
            </Link>
          </p>
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
