'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import type { PlanPreviewData } from '@/types'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
})
type FormValues = z.infer<typeof formSchema>

interface Props {
  plan: PlanPreviewData
  onBack: () => void
  onSubmit: (name: string, email: string) => Promise<void>
}

export function JoinCardFormFace({ plan, onBack, onSubmit }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  async function onFormSubmit(values: FormValues) {
    setServerError(null)
    try {
      await onSubmit(values.name, values.email ?? '')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden p-5 gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-sm font-bold text-foreground leading-none">Almost there</p>
          <p className="text-xs text-muted-foreground mt-0.5">Just your name to request a spot</p>
        </div>
      </div>

      {/* Plan chip */}
      <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-2.5 border border-border">
        {plan.cover_photo ? (
          <div className="relative w-9 h-9 rounded shrink-0 overflow-hidden bg-muted">
            <Image src={plan.cover_photo} alt={plan.title} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded shrink-0 bg-primary/10 flex items-center justify-center text-sm">
            ✈️
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{plan.title}</p>
          <p className="text-[10px] text-muted-foreground">by {plan.organiser.name}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col flex-1 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="guest-name" className="text-xs font-semibold uppercase tracking-wide">
            Your name <span className="text-primary">*</span>
          </Label>
          <Input
            id="guest-name"
            placeholder="Alex Smith"
            autoFocus
            {...register('name')}
            className="h-11"
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="guest-email" className="text-xs font-semibold uppercase tracking-wide">
              Email
            </Label>
            <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
              optional
            </span>
          </div>
          <Input
            id="guest-email"
            type="email"
            placeholder="Get notified when approved"
            {...register('email')}
            className="h-11"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          No account needed. Return to this link to check your status.
        </p>

        {serverError && (
          <p className="text-xs text-destructive text-center">{serverError}</p>
        )}

        <div className="mt-auto">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
            ) : (
              'Request to join →'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
