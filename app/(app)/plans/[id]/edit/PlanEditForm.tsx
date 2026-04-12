'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPlanSchema, type CreatePlanFormValues, type PlanItemFormValues } from '@/lib/validations/plan'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { CostBreakdown } from '@/components/plan/CostBreakdown'
import { CoverPhotoUpload } from '@/components/plan/CoverPhotoUpload'
import { GalleryUpload } from '@/components/plan/GalleryUpload'
import { cn } from '@/lib/utils'
import type { Plan, PlanItem } from '@/types'

interface PlanEditFormProps {
  plan: Plan
}

export function PlanEditForm({ plan }: PlanEditFormProps) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
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
  const [coverPhoto, setCoverPhoto] = useState<string | null>(plan.cover_photo ?? null)
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(plan.gallery_photos ?? [])
  const [error, setError] = useState<string | null>(null)

  if (!userId) {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }

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
      start_date: plan.start_date ?? '',
      status: plan.status as 'draft' | 'active',
      join_approval: plan.join_approval,
    },
  })

  async function onSubmit(values: CreatePlanFormValues) {
    setError(null)
    const res = await fetch(`/api/plans/${plan.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        items,
        cover_photo: coverPhoto,
        gallery_photos: galleryPhotos,
      }),
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basics */}
      <section className="space-y-4">
        <h2 className="font-medium">Basics</h2>

        {/* Title + Cover photo side by side */}
        <div className="flex gap-4 items-start">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" maxLength={80} {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5 shrink-0">
            <Label>Cover photo</Label>
            {userId && (
              <CoverPhotoUpload
                userId={userId}
                currentUrl={coverPhoto}
                onChange={setCoverPhoto}
              />
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="start_date">Date</Label>
          <Input id="start_date" type="date" {...register('start_date')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Vibe / description *</Label>
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

      {/* Cost breakdown */}
      <section className="space-y-4">
        <h2 className="font-medium">Cost breakdown</h2>
        <CostBreakdown
          items={items}
          approvedAttendeeCount={approvedCount}
          onChange={setItems}
        />
      </section>

      <Separator />

      {/* Gallery */}
      <section className="space-y-4">
        <h2 className="font-medium">Gallery</h2>
        <p className="text-sm text-muted-foreground">Add photos relevant to the plan — destination, venue, vibe.</p>
        {userId && (
          <GalleryUpload
            userId={userId}
            currentUrls={galleryPhotos}
            onChange={setGalleryPhotos}
          />
        )}
      </section>

      <Separator />

      {/* Settings */}
      <section className="space-y-4">
        <h2 className="font-medium">Settings</h2>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            {...register('status')}
            className={cn(
              'flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm',
              'outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
            )}
          >
            <option value="draft">Draft — only visible to you</option>
            <option value="active">Active — visible to attendees</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="join_approval"
            {...register('join_approval')}
            className="rounded"
          />
          <Label htmlFor="join_approval" className="font-normal cursor-pointer">
            Require organiser approval for join requests
          </Label>
        </div>
      </section>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
