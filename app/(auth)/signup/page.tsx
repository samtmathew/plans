"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
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

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
type FormValues = z.infer<typeof schema>

const SIGNUP_COLLAGE = [
  {
    title: "Sarah's 30th",
    meta: "The Continental",
    imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-[4/5]",
  },
  {
    title: "Glastonbury 2025",
    meta: "340 going",
    imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-square",
  },
  {
    title: "Lake District Weekend",
    meta: "April 5–7",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-square",
  },
  {
    title: "Rooftop Drinks",
    meta: "Friday night",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-[4/5]",
  },
]

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const searchParams = useSearchParams()
  const guestToken = searchParams.get("guest_token")
  const planId = searchParams.get("plan_id")
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: (() => {
          const next = guestToken && planId
            ? `/onboarding?guest_token=${encodeURIComponent(guestToken)}&plan_id=${encodeURIComponent(planId)}`
            : "/onboarding"
          return `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`
        })(),
      },
    })
    if (error) {
      setServerError(error.message)
      return
    }
    setEmailSent(true)
  }

  if (emailSent) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <GrainOverlay />
        <div className="text-center max-w-sm px-6">
          <Link href="/" className="font-headline italic text-[22px] text-[#1C1B1B] block mb-8">
            Plans
          </Link>
          <h2 className="font-headline italic text-[40px] leading-tight tracking-[-1.5px] text-[#1C1B1B] mb-3">
            Check your inbox.
          </h2>
          <p className="text-[15px] text-[#5E5E5E] leading-[1.6]">
            We sent a confirmation link to your email. Click it to finish creating your account.
          </p>
        </div>
      </div>
    )
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
            Start planning.
          </h1>
          <p className="text-[14px] text-[#5E5E5E] mb-12 leading-[1.5]">
            Create an account and make your first plan in minutes.
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
                  placeholder="Create a password"
                  autoComplete="new-password"
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
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E]">
                Confirm password
              </Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className="border-0 border-b border-[#C7C5D3] rounded-none bg-transparent px-0 py-2 text-[15px] focus-visible:ring-0 focus-visible:border-[#3D3D8F] transition-colors pr-8 placeholder:text-[#C7C5D3] shadow-none"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#C7C5D3] hover:text-[#5E5E5E] transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[12px] text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#1C1B1B] text-white py-6 text-[15px] font-medium flex items-center justify-between px-6 shadow-[0_4px_16px_rgba(28,27,27,0.1)] hover:bg-[#2d2d2d] disabled:opacity-50"
            >
              <span>{isSubmitting ? "Creating account…" : "Create account"}</span>
              <span>→</span>
            </Button>
          </form>

          <p className="text-[13px] text-[#5E5E5E] text-center mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#1C1B1B] font-medium hover:text-[#3D3D8F] transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>

        <p className="text-[11px] text-[#5E5E5E] mt-8">© 2025 Plans · Made for making plans</p>
      </div>

      {/* RIGHT PANEL — 60% */}
      <div className="hidden lg:block lg:w-3/5 bg-[#F6F3F2] relative overflow-hidden">
        <MasonryCollage cards={SIGNUP_COLLAGE} />
      </div>
    </div>
  )
}
