import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CopyLink } from '@/components/common/CopyLink'
import { StatusBadge } from '@/components/common/StatusBadge'
import { UserAvatar } from '@/components/common/Avatar'
import { CoverArt } from '@/components/common/CoverArt'
import { AttendeeActions } from './AttendeeActions'
import { ArrowLeft, Share2, Settings, Check } from 'lucide-react'
import type { Plan, PlanAttendee, PlanItem } from '@/types'
import { calcEstimatedPerPerson } from '@/lib/utils/cost'
import { formatCurrency } from '@/lib/utils/format'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlanDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select(`*, organiser:profiles!organiser_id(*), attendees:plan_attendees(*, profile:profiles!user_id(*)), items:plan_items(*)`)
    .eq('id', id)
    .single()

  if (planError) throw new Error(planError.message)
  if (!plan || plan.deleted_at) notFound()

  const isOrganiser = plan.organiser_id === user!.id
  const myAttendee = (plan.attendees as PlanAttendee[]).find((a) => a.user_id === user!.id)
  const isPending = !isOrganiser && myAttendee?.status === 'pending'

  if (!isOrganiser && !myAttendee) redirect(`/join/${plan.join_token}`)
  if (isPending) redirect(`/plans/${id}/pending`)

  const approvedAttendees = (plan.attendees as PlanAttendee[]).filter((a) => a.status === 'approved')
  const approvedCount = approvedAttendees.length
  const galleryPhotos: string[] = plan.gallery_photos ?? []
  const planItems = (plan.items ?? []) as PlanItem[]
  const costPerPerson = calcEstimatedPerPerson(planItems, approvedCount)

  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  const origin = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`
  const joinUrl = `${origin}/join/${plan.join_token}`

  const itineraryLines: string[] = plan.itinerary
    ? plan.itinerary.split('\n').map((l: string) => l.trim()).filter(Boolean)
    : []

  return (
    <div className="pb-24 -mx-6">
      {/* Cover hero */}
      <div className="relative w-full overflow-hidden" style={{ height: 360 }}>
        {plan.cover_photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plan.cover_photo} alt={plan.title} className="w-full h-full object-cover" />
        ) : (
          <CoverArt seed={plan.id} className="w-full h-full" />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)' }}
        />

        {/* Top bar */}
        <div className="absolute top-5 left-6 right-6 flex items-center justify-between">
          <Link
            href="/home"
            className="inline-flex items-center gap-1.5 text-white text-[13px] font-medium rounded-full px-3.5 py-1.5 transition-all hover:bg-white/25"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            All plans
          </Link>
          <div className="flex gap-2">
            {plan.join_token && (
              <Link
                href={joinUrl}
                className="inline-flex items-center gap-1.5 text-white text-[13px] font-medium rounded-full px-3.5 py-1.5 transition-all hover:bg-white/25"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
              >
                <Share2 className="h-3.5 w-3.5" strokeWidth={2} />
                Share
              </Link>
            )}
            {isOrganiser && (
              <Link
                href={`/plans/${id}/manage`}
                className="inline-flex items-center gap-1.5 text-white text-[13px] font-medium rounded-full px-3.5 py-1.5 transition-all hover:bg-white/30"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
              >
                <Settings className="h-3.5 w-3.5" strokeWidth={2} />
                Manage
              </Link>
            )}
          </div>
        </div>

        {/* Bottom — title + meta */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 max-w-[1200px] mx-auto">
          {plan.kind && (
            <p className="text-[10px] font-semibold uppercase text-white/80 mb-2" style={{ letterSpacing: '0.18em' }}>
              {plan.kind}
            </p>
          )}
          <h1 className="font-headline italic text-white leading-[1.02] font-normal" style={{ fontSize: 'clamp(32px, 5.5vw, 56px)', letterSpacing: '-0.01em' }}>
            {plan.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-5 text-white/90 text-sm">
            {plan.start_date && (
              <span>{new Date(plan.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            )}
            <span>{approvedCount} going</span>
            {plan.organiser && (
              <span>
                Organised by <b className="font-semibold">{plan.organiser.name}</b>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs section */}
      <div className="max-w-[1100px] mx-auto px-6 pt-5">
        <Tabs defaultValue="details" className="flex flex-col gap-0">
          <TabsList
            variant="line"
            className="flex w-full justify-start rounded-none h-auto bg-transparent p-0 gap-6 border-b border-[var(--plans-divider)]"
          >
            {(['details', 'costs', 'people', 'gallery'] as const).map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="capitalize flex-none rounded-none border-b-2 border-transparent data-[active]:border-[var(--plans-text)] data-[active]:text-[var(--plans-text)] text-[var(--plans-text-2)] px-0 pb-2.5 pt-2.5 text-[14px] font-medium"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Details tab */}
          <TabsContent value="details" className="mt-10">
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-12">
                <div>
                  {plan.description && (
                    <p className="text-[17px] leading-[1.6] text-[var(--plans-text)] mb-8 max-w-[640px]">
                      {plan.description}
                    </p>
                  )}

                  {itineraryLines.length > 0 && (
                    <>
                      <h3 className="text-[10px] font-semibold uppercase text-[var(--plans-text-2)] mb-3.5" style={{ letterSpacing: '0.18em' }}>
                        Day by day
                      </h3>
                      <div className="relative pl-5 flex flex-col gap-[18px]" style={{ borderLeft: '2px solid var(--plans-divider)' }}>
                        {itineraryLines.map((line, idx) => {
                          const match = line.match(/^(\d{1,2}(?::\d{2})?\s?(?:am|pm|AM|PM)?)\s+(.+)/)
                          const time = match?.[1]
                          const text = match?.[2] ?? line
                          return (
                            <div key={idx} className="relative">
                              <span
                                className="absolute rounded-full bg-[var(--plans-text)]"
                                style={{ left: -26, top: 6, width: 8, height: 8 }}
                              />
                              {time && (
                                <div className="text-[10px] font-semibold uppercase text-[var(--plans-text-2)] mb-0.5" style={{ letterSpacing: '0.18em' }}>
                                  {time}
                                </div>
                              )}
                              <div className="text-[15px] text-[var(--plans-text)]">{text}</div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* At a glance sidebar */}
                <aside className="md:sticky md:top-6 self-start">
                  <div
                    className="rounded-[14px] p-[22px]"
                    style={{ border: '1px solid var(--plans-divider)', background: 'var(--plans-surface-lo)' }}
                  >
                    <div className="text-[10px] font-semibold uppercase text-[var(--plans-text-2)] mb-3" style={{ letterSpacing: '0.18em' }}>
                      At a glance
                    </div>
                    <div className="flex flex-col gap-3.5">
                      {plan.start_date && (
                        <Row
                          label="Date"
                          value={new Date(plan.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        />
                      )}
                      {costPerPerson > 0 && (
                        <Row label="Cost" value={`${formatCurrency(costPerPerson)} / person`} />
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] text-[var(--plans-text-2)]">Status</span>
                        <StatusBadge status={plan.status} />
                      </div>
                      {approvedAttendees.length > 0 && (
                        <div>
                          <div className="text-[10px] font-semibold uppercase text-[var(--plans-text-2)] mb-2" style={{ letterSpacing: '0.18em' }}>
                            Going
                          </div>
                          <div className="flex">
                            {approvedAttendees.slice(0, 7).map((a, i) => (
                              <div key={a.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                                <UserAvatar url={a.profile?.avatar_url} name={a.profile?.name ?? '?'} size="sm" />
                              </div>
                            ))}
                            {approvedAttendees.length > 7 && (
                              <div
                                className="inline-flex items-center justify-center rounded-full text-[11px] font-medium text-[var(--plans-text-2)]"
                                style={{ marginLeft: -8, width: 28, height: 28, background: 'var(--plans-surface)', border: '2px solid var(--bg-w)' }}
                              >
                                +{approvedAttendees.length - 7}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <hr className="my-5" style={{ border: 'none', borderTop: '1px solid var(--plans-divider)' }} />
                    {isOrganiser && plan.join_token ? (
                      <CopyLink url={joinUrl} />
                    ) : (
                      <Button className="w-full rounded-full bg-[var(--plans-text)] text-white hover:bg-black/90 gap-2">
                        I&apos;m in
                        <Check className="h-4 w-4" strokeWidth={2.4} />
                      </Button>
                    )}
                  </div>
                </aside>
              </div>
            </TabsContent>

            {/* Costs tab */}
            <TabsContent value="costs" className="mt-10">
              <div className="max-w-[780px]">
                <h3 className="font-headline italic text-[28px] font-normal mb-6 text-[var(--plans-text)]">
                  Cost breakdown
                </h3>
                {planItems.length > 0 ? (
                  <>
                    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid var(--plans-divider)' }}>
                      {planItems.map((item, i, arr) => (
                        <div
                          key={item.id}
                          className="grid gap-4 px-[18px] py-3.5 items-center"
                          style={{
                            gridTemplateColumns: '1fr 120px 120px',
                            borderBottom: i < arr.length - 1 ? '1px solid var(--plans-divider)' : 'none',
                          }}
                        >
                          <div className="text-[14px] text-[var(--plans-text)]">{item.title}</div>
                          <div className="text-[14px] font-semibold tabular-nums text-[var(--plans-text)]">
                            {formatCurrency(item.price)}
                          </div>
                          <div className="text-[12px] text-[var(--plans-text-2)] text-right">
                            {item.pricing_type === 'per_head' ? 'Per head' : 'Whole group'}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-baseline px-[18px] py-5">
                      <div className="text-[10px] font-semibold uppercase text-[var(--plans-text-2)]" style={{ letterSpacing: '0.18em' }}>
                        Per person estimate
                      </div>
                      <div className="font-headline italic text-[32px] font-normal text-[var(--plans-text)]">
                        {formatCurrency(costPerPerson)}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full mt-2">
                      Mark costs as settled
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-[var(--plans-text-2)]">No cost items added.</p>
                )}
              </div>
            </TabsContent>

            {/* People tab */}
            <TabsContent value="people" className="mt-10">
              <div className="max-w-[780px]">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-headline italic text-[28px] font-normal text-[var(--plans-text)]">
                    {approvedCount} going
                  </h3>
                </div>
                <AttendeeActions plan={plan as unknown as Plan} isOrganiser={isOrganiser} currentUserId={user!.id} />
              </div>
            </TabsContent>

            {/* Gallery tab */}
            <TabsContent value="gallery" className="mt-10">
              {galleryPhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {galleryPhotos.map((url, i) => (
                    <div
                      key={i}
                      className="aspect-square overflow-hidden bg-[var(--plans-surface)]"
                      style={{ borderRadius: 10 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--plans-text-2)]">No gallery photos yet.</p>
              )}
            </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[12px] text-[var(--plans-text-2)]">{label}</span>
      <span className="text-[14px] font-medium text-[var(--plans-text)]">{value}</span>
    </div>
  )
}
