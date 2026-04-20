"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GrainOverlay } from "@/components/common/GrainOverlay"
import { MasonryCollage } from "@/components/landing/MasonryCollage"

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})
type FormValues = z.infer<typeof schema>

const LOGIN_COLLAGE = [
  {
    title: "Summer Solstice Supper",
    meta: "June 21",
    imageUrl: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-[4/5]",
  },
  {
    title: "Gallery Opening",
    meta: "West End Arts",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-square",
  },
  {
    title: "Morning Coffee",
    meta: "Every Sunday",
    imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-square",
  },
  {
    title: "Cabin Retreat",
    meta: "The Berkshires",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-[4/5]",
  },
]

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
  const redirect = searchParams.get("redirect") || "/home"
  const guestToken = searchParams.get("guest_token")
  const planId = searchParams.get("plan_id")
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) {
      setServerError(error.message)
      return
    }
    if (guestToken && planId) {
      try {
        await fetch("/api/auth/link-guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    <div className="h-screen flex overflow-hidden" style={{ background: "var(--bg)" }}>
      <GrainOverlay />

      {/* LEFT PANEL — 40% */}
      <div className="w-full lg:w-2/5 flex flex-col justify-between bg-white px-16 py-14 overflow-y-auto z-10 shadow-[4px_0_40px_rgba(28,27,27,0.06)]">
        <div>
          <Link href="/" className="font-headline italic text-[22px] text-[#1C1B1B] block mb-16">
            Plans
          </Link>

          <h1 className="font-headline italic text-[52px] leading-none tracking-[-1.5px] text-[#1C1B1B] mb-2">
            Welcome back.
          </h1>
          <p className="text-[14px] text-[#5E5E5E] mb-12 leading-[1.5]">
            Log in to continue planning with the people you care about.
          </p>

          {serverError && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E]">
                Email address
              </Label>
              <Input
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                className="border-0 border-b border-[#C7C5D3] rounded-none bg-transparent px-0 py-2 text-[15px] focus-visible:ring-0 focus-visible:border-[#3D3D8F] transition-colors placeholder:text-[#C7C5D3] shadow-none"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-[12px] text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E]">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="border-0 border-b border-[#C7C5D3] rounded-none bg-transparent px-0 py-2 text-[15px] focus-visible:ring-0 focus-visible:border-[#3D3D8F] transition-colors pr-8 placeholder:text-[#C7C5D3] shadow-none"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#C7C5D3] hover:text-[#5E5E5E] transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[12px] text-red-600">{errors.password.message}</p>
              )}
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-[12px] text-[#5E5E5E] hover:text-[#1C1B1B] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#1C1B1B] text-white py-6 text-[15px] font-medium flex items-center justify-between px-6 shadow-[0_4px_16px_rgba(28,27,27,0.1)] hover:bg-[#2d2d2d] disabled:opacity-50"
            >
              <span>{isSubmitting ? "Logging in…" : "Log in"}</span>
              <span>→</span>
            </Button>
          </form>

          <p className="text-[13px] text-[#5E5E5E] text-center mt-6">
            No account?{" "}
            <Link
              href="/signup"
              className="text-[#1C1B1B] font-medium hover:text-[#3D3D8F] transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-[11px] text-[#5E5E5E] mt-8">© 2025 Plans · Made for making plans</p>
      </div>

      {/* RIGHT PANEL — 60% */}
      <div className="hidden lg:block lg:w-3/5 bg-[#F6F3F2] relative overflow-hidden">
        <MasonryCollage cards={LOGIN_COLLAGE} />
      </div>
    </div>
  )
}
