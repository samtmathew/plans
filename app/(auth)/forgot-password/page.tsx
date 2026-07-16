"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GrainOverlay } from "@/components/common/GrainOverlay"

const schema = z.object({
  email: z.string().email("Enter a valid email"),
})
type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
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
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
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
          <Link href="/" className="wordmark-hover font-headline italic text-[22px] text-[#1C1B1B] mb-8">
            Plans
          </Link>
          <h2 className="font-headline italic text-[40px] leading-tight tracking-[-1.5px] text-[#1C1B1B] mb-3">
            Check your inbox.
          </h2>
          <p className="text-[15px] text-[#5E5E5E] leading-[1.6]">
            If an account exists for that email, we sent a link to reset the password.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <GrainOverlay />
      <div className="w-full max-w-sm px-6">
        <Link href="/" className="wordmark-hover font-headline italic text-[22px] text-[#1C1B1B] mb-16 block">
          Plans
        </Link>

        <h1 className="font-headline italic text-[40px] leading-none tracking-[-1.5px] text-[#1C1B1B] mb-2">
          Forgot password?
        </h1>
        <p className="text-[14px] text-[#5E5E5E] mb-12 leading-[1.5]">
          Enter your email and we&apos;ll send you a link to reset it.
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

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[#1C1B1B] text-white py-6 text-[15px] font-medium flex items-center justify-between px-6 shadow-[0_4px_16px_rgba(28,27,27,0.1)] hover:bg-[#2d2d2d] disabled:opacity-50"
          >
            <span>{isSubmitting ? "Sending…" : "Send reset link"}</span>
            <span>→</span>
          </Button>
        </form>

        <p className="text-[13px] text-[#5E5E5E] text-center mt-6">
          Remembered it?{" "}
          <Link
            href="/login"
            className="text-[#1C1B1B] font-medium hover:text-[#3D3D8F] transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
