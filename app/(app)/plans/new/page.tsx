'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPlanSchema, type CreatePlanFormValues, type PlanItemFormValues } from '@/lib/validations/plan'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CostBreakdown } from '@/components/plan/CostBreakdown'
import { CoverPhotoUpload } from '@/components/plan/CoverPhotoUpload'
import { GalleryUpload } from '@/components/plan/GalleryUpload'
import { AttendeeSearch } from '@/components/plan/AttendeeSearch'
import { UserAvatar } from '@/components/common/Avatar'
import { X, MapPin, Calendar } from 'lucide-react'
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

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

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
    <div className="min-h-screen bg-background pb-32">
      {/* Headline */}
      <div className="mb-24">
        <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight">
          Create your plan.
        </h1>
      </div>

      <form onSubmit={handleSubmit((v) => onSubmit(v, 'active'))} className="space-y-24">
        {/* Section 01 — Basics */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Left: Label (sticky) */}
          <div className="md:col-span-4 md:sticky md:top-20 h-fit">
            <div className="space-y-3">
              <p className="text-xs tracking-widest uppercase text-on-surface-variant opacity-70">
                Section 01
              </p>
              <h2 className="font-headline text-2xl font-bold text-foreground">Basics</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Set the title, date, and description for your trip. Upload a cover photo that captures the vibe.
              </p>
            </div>
          </div>

          {/* Right: Form Content */}
          <div className="md:col-span-8 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-on-surface text-sm font-medium">
                Plan title *
              </Label>
              <Input
                id="title"
                maxLength={80}
                placeholder="e.g. Weekend in Lisbon"
                {...register('title')}
                className="border-0 border-b bg-transparent px-0 py-2 text-foreground placeholder:text-on-surface-variant/50 focus:border-on-surface rounded-none"
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-on-surface text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-on-surface-variant" />
                Start date
              </Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date')}
                className="border-0 border-b bg-transparent px-0 py-2 text-foreground placeholder:text-on-surface-variant/50 focus:border-on-surface rounded-none"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-on-surface text-sm font-medium">
                Vibe / description *
              </Label>
              <Textarea
                id="description"
                rows={2}
                maxLength={300}
                placeholder="One sentence on what this plan is about"
                {...register('description')}
                className="border-0 border-b bg-transparent px-0 py-2 text-foreground placeholder:text-on-surface-variant/50 focus:border-on-surface rounded-none resize-none"
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            {/* Itinerary */}
            <div className="space-y-2">
              <Label htmlFor="itinerary" className="text-on-surface text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-on-surface-variant" />
                Itinerary / Details *
              </Label>
              <Textarea
                id="itinerary"
                rows={6}
                placeholder="Day-by-day breakdown, what to bring, where to meet…"
                {...register('itinerary')}
                className="border-0 border-b bg-transparent px-0 py-2 text-foreground placeholder:text-on-surface-variant/50 focus:border-on-surface rounded-none resize-none"
              />
              {errors.itinerary && <p className="text-xs text-destructive">{errors.itinerary.message}</p>}
            </div>

            {/* Cover Photo */}
            <div className="space-y-2 pt-2">
              <Label className="text-on-surface text-sm font-medium">Cover photo</Label>
              <p className="text-xs text-on-surface-variant">
                Choose an image that captures the essence of your trip
              </p>
              {userId && (
                <div className="pt-2">
                  <CoverPhotoUpload
                    userId={userId}
                    currentUrl={coverPhoto}
                    onChange={setCoverPhoto}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 02 — Costs */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Left: Label (sticky) */}
          <div className="md:col-span-4 md:sticky md:top-20 h-fit">
            <div className="space-y-3">
              <p className="text-xs tracking-widest uppercase text-on-surface-variant opacity-70">
                Section 02
              </p>
              <h2 className="font-headline text-2xl font-bold text-foreground">Costs</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Add itemised costs for the trip. Choose between per-head or group total pricing.
              </p>
            </div>
          </div>

          {/* Right: Form Content */}
          <div className="md:col-span-8">
            <CostBreakdown
              items={items}
              approvedAttendeeCount={attendees.length + 1}
              onChange={setItems}
            />
          </div>
        </section>

        {/* Section 03 — Attendees */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Left: Label (sticky) */}
          <div className="md:col-span-4 md:sticky md:top-20 h-fit">
            <div className="space-y-3">
              <p className="text-xs tracking-widest uppercase text-on-surface-variant opacity-70">
                Section 03
              </p>
              <h2 className="font-headline text-2xl font-bold text-foreground">Attendees</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Invite people to your plan and manage join requests.
              </p>
            </div>
          </div>

          {/* Right: Form Content */}
          <div className="md:col-span-8 space-y-6">
            {/* Attendee Search */}
            {userId && (
              <div className="space-y-2">
                <Label className="text-on-surface text-sm font-medium">Invite attendees</Label>
                <AttendeeSearch
                  currentUserId={userId}
                  alreadyAddedIds={attendees.map((a) => a.id)}
                  onSelect={addAttendee}
                />
              </div>
            )}

            {/* Attendee List */}
            {attendees.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest opacity-70">
                  {attendees.length} invited
                </p>
                <div className="flex flex-wrap gap-2">
                  {attendees.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5 border border-on-surface-variant/20"
                    >
                      <UserAvatar url={a.avatar_url} name={a.name} size="sm" />
                      <span className="text-sm font-medium text-foreground">{a.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttendee(a.id)}
                        className="text-on-surface-variant hover:text-destructive transition-colors ml-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery Upload */}
            <div className="space-y-2 pt-4">
              <Label className="text-on-surface text-sm font-medium">Gallery</Label>
              <p className="text-xs text-on-surface-variant">
                Add photos of the destination, venue, or vibe
              </p>
              {userId && (
                <div className="pt-2">
                  <GalleryUpload
                    userId={userId}
                    currentUrls={galleryPhotos}
                    onChange={setGalleryPhotos}
                  />
                </div>
              )}
            </div>

            {/* Join Approval Toggle */}
            <div className="space-y-3 border-t border-on-surface-variant/10 pt-6">
              <Label className="text-on-surface text-sm font-medium">Join link</Label>
              <p className="text-xs text-on-surface-variant">
                A shareable link will be generated when you publish.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="join_approval"
                  checked={joinApproval}
                  onChange={(e) => setJoinApproval(e.target.checked)}
                  className="rounded border border-on-surface-variant/30"
                />
                <label htmlFor="join_approval" className="text-sm text-foreground cursor-pointer">
                  Require organiser approval for join requests
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Section 04 — Review */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Left: Label (sticky) */}
          <div className="md:col-span-4 md:sticky md:top-20 h-fit">
            <div className="space-y-3">
              <p className="text-xs tracking-widest uppercase text-on-surface-variant opacity-70">
                Section 04
              </p>
              <h2 className="font-headline text-2xl font-bold text-foreground">Review</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Preview your plan and publish it when ready.
              </p>
            </div>
          </div>

          {/* Right: Form Content */}
          <div className="md:col-span-8 space-y-6">
            {/* Cover Photo Preview */}
            {coverPhoto && (
              <div className="space-y-2">
                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest opacity-70">
                  Cover preview
                </p>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-on-surface-variant/20 bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPhoto} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="space-y-2">
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest opacity-70">
                Plan summary
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/30 rounded-lg px-4 py-3 border border-on-surface-variant/10">
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1">Budget</p>
                  <p className="text-lg font-bold text-foreground">
                    {items.length > 0 ? `${items.length} items` : '—'}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg px-4 py-3 border border-on-surface-variant/10">
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1">Attendees</p>
                  <p className="text-lg font-bold text-foreground">
                    {attendees.length + 1}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg px-4 py-3 border border-on-surface-variant/10">
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1">Photos</p>
                  <p className="text-lg font-bold text-foreground">
                    {galleryPhotos.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Publish Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="flex-1"
              >
                {isSubmitting ? 'Publishing…' : 'Publish plan'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={isSubmitting}
                onClick={handleSubmit((v) => onSubmit(v, 'draft'))}
              >
                Save as draft
              </Button>
            </div>
          </div>
        </section>
      </form>
    </div>
  )
}
