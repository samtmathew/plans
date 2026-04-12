'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPlanSchema, type CreatePlanFormValues, type PlanItemFormValues } from '@/lib/validations/plan'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { CostBreakdown } from '@/components/plan/CostBreakdown'
import type { Plan, PlanItem } from '@/types'

interface PlanEditFormProps {
  plan: Plan
}

export function PlanEditForm({ plan }: PlanEditFormProps) {
  const router = useRouter()
  const [items, setItems] = useState<PlanItemFormValues[]>(
    (plan.items ?? []).map((i: PlanItem) => ({
      id: i.id,
      title: i.title,
      price: i.price,
      pricing_type: i.pricing_type,
      description: i.description,
      sort_order: i.sort_order,
    }))
  )
  const [error, setError] = useState<string | null>(null)

  const approvedCount =
    plan.attendees?.filter((a) => a.status === 'approved').length ?? 0

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      title: plan.title,
      description: plan.description,
      itinerary: plan.itinerary,
      status: plan.status as 'draft' | 'active',
      join_approval: plan.join_approval,
    },
  })

  async function onSubmit(values: CreatePlanFormValues) {
    setError(null)
    const res = await fetch(`/api/plans/${plan.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, items }),
    })
    const json = await res.json()
    if (json.error) {
      setError(json.error)
      return
    }
    router.push(`/plans/${plan.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-medium">Basics</h2>
        <div className="space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" maxLength={80} {...register('title')} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description *</Label>
          <Textarea id="description" rows={2} maxLength={300} {...register('description')} />
          {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="itinerary">Itinerary *</Label>
          <Textarea id="itinerary" rows={8} {...register('itinerary')} />
          {errors.itinerary && <p className="text-xs text-destructive">{errors.itinerary.message}</p>}
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="font-medium">Cost breakdown</h2>
        <CostBreakdown
          items={items}
          approvedAttendeeCount={approvedCount}
          onChange={setItems}
        />
      </section>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
