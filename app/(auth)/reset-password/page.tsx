"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GrainOverlay } from "@/components/common/GrainOverlay"

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
type FormValues = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "done">("checking")
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStatus("ready")
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus((current) => (current === "checking" ? "ready" : current))
    })

    const timeout = setTimeout(() => {
      setStatus((current) => (current === "checking" ? "invalid" : current))
    }, 4000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: values.password })
    if (error) {
      setServerError(error.message)
      return
    }
    setStatus("done")
    setTimeout(() => {
      router.push("/home")
      router.refresh()
    }, 1500)
  }

  if (status === "checking") {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <GrainOverlay />
        <p className="text-[14px] text-[#5E5E5E]">Verifying your link…</p>
      </div>
    )
  }

  if (status === "invalid") {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <GrainOverlay />
        <div className="text-center max-w-sm px-6">
          <Link href="/" className="wordmark-hover font-headline italic text-[22px] text-[#1C1B1B] mb-8">
            Plans
          </Link>
          <h2 className="font-headline italic text-[40px] leading-tight tracking-[-1.5px] text-[#1C1B1B] mb-3">
            Link expired.
          </h2>
          <p className="text-[15px] text-[#5E5E5E] leading-[1.6] mb-6">
            This reset link is invalid or has expired. Request a new one to continue.
          </p>
          <Link
            href="/forgot-password"
            className="text-[13px] text-[#1C1B1B] font-medium hover:text-[#3D3D8F] transition-colors underline"
          >
            Request new link
          </Link>
        </div>
      </div>
    )
  }

  if (status === "done") {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <GrainOverlay />
        <div className="text-center max-w-sm px-6">
          <Link href="/" className="wordmark-hover font-headline italic text-[22px] text-[#1C1B1B] mb-8">
            Plans
          </Link>
          <h2 className="font-headline italic text-[40px] leading-tight tracking-[-1.5px] text-[#1C1B1B] mb-3">
            Password updated.
          </h2>
          <p className="text-[15px] text-[#5E5E5E] leading-[1.6]">Taking you home…</p>
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
          Set a new password.
        </h1>
        <p className="text-[14px] text-[#5E5E5E] mb-12 leading-[1.5]">
          Choose a new password for your account.
        </p>

        {serverError && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E]">
              New password
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
            <span>{isSubmitting ? "Updating…" : "Update password"}</span>
            <span>→</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
