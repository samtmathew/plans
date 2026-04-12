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
import { AttendeeSearch } from '@/components/plan/AttendeeSearch'
import { UserAvatar } from '@/components/common/Avatar'
import { X } from 'lucide-react'
import type { Profile } from '@/types'

export default function NewPlanPage() {
  const router = useRouter()
  const [items, setItems] = useState<PlanItemFormValues[]>([])
  const [attendees, setAttendees] = useState<Profile[]>([])
  const [joinApproval, setJoinApproval] = useState(true)
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null)
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  if (!userId) {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createPlanSchema),
    defaultValues: { title: '', description: '', itinerary: '', start_date: '', status: 'active', join_approval: true },
  })

  function addAttendee(profile: Profile) {
    if (attendees.find((a) => a.id === profile.id)) return
    setAttendees((prev) => [...prev, profile])
  }

  function removeAttendee(id: string) {
    setAttendees((prev) => prev.filter((a) => a.id !== id))
  }

  async function onSubmit(values: CreatePlanFormValues, status: 'draft' | 'active') {
    setError(null)
    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        status,
        items,
        attendee_ids: attendees.map((a) => a.id),
        join_approval: joinApproval,
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
    <div className="space-y-8 pb-16">
      <h1 className="text-xl font-semibold">Create a plan</h1>

      <form
        onSubmit={handleSubmit((v) => onSubmit(v, 'active'))}
        className="space-y-8"
      >
        {/* Section 1 — Basics */}
        <section className="space-y-4">
          <h2 className="font-medium">Basics</h2>

          {/* Title + Cover photo side by side */}
          <div className="flex gap-4 items-start">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                maxLength={80}
                placeholder="e.g. Weekend in Lisbon"
                {...register('title')}
              />
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
            <Input
              id="start_date"
              type="date"
              {...register('start_date')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Vibe / description *</Label>
            <Textarea
              id="description"
              rows={2}
              maxLength={300}
              placeholder="One sentence on what this plan is about"
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="itinerary">Itinerary *</Label>
            <Textarea
              id="itinerary"
              rows={6}
              placeholder="Day-by-day breakdown, what to bring, where to meet…"
              {...register('itinerary')}
            />
            {errors.itinerary && <p className="text-xs text-destructive">{errors.itinerary.message}</p>}
          </div>
        </section>

        <Separator />

        {/* Section 2 — Cost Breakdown */}
        <section className="space-y-4">
          <h2 className="font-medium">Cost breakdown</h2>
          <CostBreakdown
            items={items}
            approvedAttendeeCount={attendees.length + 1}
            onChange={setItems}
          />
        </section>

        <Separator />

        {/* Section 3 — Gallery */}
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

        {/* Section 4 — Attendees */}
        <section className="space-y-4">
          <h2 className="font-medium">Attendees</h2>
          {userId && (
            <AttendeeSearch
              currentUserId={userId}
              alreadyAddedIds={attendees.map((a) => a.id)}
              onSelect={addAttendee}
            />
          )}
          {attendees.length > 0 && (
            <div className="space-y-2">
              {attendees.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <UserAvatar url={a.avatar_url} name={a.name} size="sm" />
                  <span className="text-sm flex-1">{a.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttendee(a.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label>Join link</Label>
            <p className="text-sm text-muted-foreground">
              A shareable link will be generated when you publish.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="join_approval"
                checked={joinApproval}
                onChange={(e) => setJoinApproval(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="join_approval" className="text-sm">
                Require organiser approval for join requests
              </label>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 5 — Publish */}
        <section className="space-y-4">
          <h2 className="font-medium">Review &amp; publish</h2>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Publishing…' : 'Publish plan'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={handleSubmit((v) => onSubmit(v, 'draft'))}
            >
              Save as draft
            </Button>
          </div>
        </section>
      </form>
    </div>
  )
}
