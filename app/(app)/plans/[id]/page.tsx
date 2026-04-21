import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CostBreakdown } from '@/components/plan/CostBreakdown'
import { CopyLink } from '@/components/common/CopyLink'
import { StatusBadge } from '@/components/common/StatusBadge'
import { UserAvatar } from '@/components/common/Avatar'
import { CoverArt } from '@/components/common/CoverArt'
import { AttendeeActions } from './AttendeeActions'
import { DeletePlanButton } from './DeletePlanButton'
import { ArrowLeft, Share2, Settings } from 'lucide-react'
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

  const planItemsForBreakdown = planItems.map((i) => ({
    id: i.id,
    title: i.title,
    price: i.price,
    pricing_type: i.pricing_type,
    description: i.description,
    sort_order: i.sort_order,
  }))

  return (
    <div className="pb-16 -mx-6">
      {/* Cover hero — 360px, full-bleed */}
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

        {/* Top bar — frosted glass buttons */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Link
            href="/home"
            className="flex items-center gap-1.5 text-white text-sm font-medium rounded-full px-3 py-1.5"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            All plans
          </Link>
          <div className="flex gap-2">
            {plan.join_token && (
              <Link
                href={joinUrl}
                className="flex items-center gap-1.5 text-white text-sm font-medium rounded-full px-3 py-1.5"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Link>
            )}
            {isOrganiser && (
              <Link
                href={`/plans/${id}/manage`}
                className="flex items-center gap-1.5 text-white text-sm font-medium rounded-full px-3 py-1.5"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
              >
                <Settings className="h-4 w-4" />
                Manage
              </Link>
            )}
          </div>
        </div>

        {/* Bottom — kind eyebrow + serif title + meta */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          {plan.kind && (
            <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/70 mb-1">
              {plan.kind}
            </p>
          )}
          <h1 className="font-headline italic text-[clamp(28px,5vw,56px)] text-white leading-tight mb-2">
            {plan.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
            {plan.start_date && (
              <span>{new Date(plan.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            )}
            <span>·</span>
            <span>{approvedCount} {approvedCount === 1 ? 'person' : 'people'} going</span>
            {plan.organiser && (
              <>
                <span>·</span>
                <span>by {plan.organiser.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs section */}
      <div className="px-6 pt-6">
        <Tabs defaultValue="details">
          <TabsList className="w-full justify-start rounded-none h-auto bg-transparent pb-0 mb-6 gap-0 border-b border-[var(--plans-divider)]">
            {(['details', 'costs', 'people', 'gallery'] as const).map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="capitalize rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--plans-text)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--plans-text)] text-[var(--plans-text-2)] px-4 pb-3 text-sm font-medium"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Details tab */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8">
              <div className="space-y-6">
                {plan.description && (
                  <p className="text-[var(--plans-text-2)] leading-relaxed">{plan.description}</p>
                )}
                {plan.itinerary && (
                  <div className="space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--plans-text-2)]">Itinerary</h2>
                    <div className="relative pl-5">
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-[var(--plans-divider)]" />
                      <div className="space-y-5">
                        {plan.itinerary.split('\n').filter((l: string) => l.trim()).map((line: string, idx: number) => (
                          <div key={idx} className="relative">
                            <div className="absolute -left-[22px] top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--plans-text)] ring-2 ring-white" />
                            <p className="text-sm text-[var(--plans-text)] leading-relaxed">{line}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky sidebar "At a glance" */}
              <div className="md:sticky md:top-20 h-fit">
                <div className="border border-[var(--plans-divider)] rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--plans-text-2)]">At a glance</h3>
                  {plan.start_date && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[var(--plans-text-2)] mb-0.5">When</p>
                      <p className="text-sm font-medium text-[var(--plans-text)]">
                        {new Date(plan.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                  {costPerPerson > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[var(--plans-text-2)] mb-0.5">Cost per person</p>
                      <p className="text-xl font-bold text-[var(--plans-accent)]">{formatCurrency(costPerPerson)}</p>
                    </div>
                  )}
                  <StatusBadge status={plan.status} />
                  {approvedAttendees.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {approvedAttendees.slice(0, 7).map((a) => (
                        <UserAvatar key={a.id} url={a.profile?.avatar_url} name={a.profile?.name ?? '?'} size="sm" />
                      ))}
                    </div>
                  )}
                  {plan.join_token && <CopyLink url={joinUrl} />}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Costs tab */}
          <TabsContent value="costs">
            <div className="max-w-xl space-y-6">
              {planItems.length > 0 ? (
                <>
                  <div className="border border-[var(--plans-divider)] rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--plans-surface)]">
                        <tr>
                          <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--plans-text-2)] font-semibold">Item</th>
                          <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--plans-text-2)] font-semibold">Amount</th>
                          <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--plans-text-2)] font-semibold">Split</th>
                        </tr>
                      </thead>
                      <tbody>
                        {planItems.map((item, i) => (
                          <tr key={item.id} className={i % 2 === 0 ? '' : 'bg-[var(--plans-surface)]/30'}>
                            <td className="px-4 py-3 text-[var(--plans-text)]">{item.title}</td>
                            <td className="px-4 py-3 text-right font-medium text-[var(--plans-text)]">{formatCurrency(item.price)}</td>
                            <td className="px-4 py-3 text-right text-[var(--plans-text-2)] text-xs">{item.pricing_type === 'per_head' ? 'Per head' : 'Whole group'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {costPerPerson > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-[var(--plans-text-2)] mb-1">Total per person</p>
                      <p className="font-headline italic text-4xl text-[var(--plans-accent)]">{formatCurrency(costPerPerson)}</p>
                    </div>
                  )}
                  <CostBreakdown items={planItemsForBreakdown} approvedAttendeeCount={approvedCount} readOnly />
                </>
              ) : (
                <p className="text-sm text-[var(--plans-text-2)]">No cost items added.</p>
              )}
            </div>
          </TabsContent>

          {/* People tab */}
          <TabsContent value="people">
            <AttendeeActions plan={plan as unknown as Plan} isOrganiser={isOrganiser} currentUserId={user!.id} />
          </TabsContent>

          {/* Gallery tab */}
          <TabsContent value="gallery">
            {galleryPhotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {galleryPhotos.map((url, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-[var(--plans-surface)]">
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

        {isOrganiser && (
          <div className="mt-8 flex gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href={`/plans/${id}/edit`}>Edit plan</Link>
            </Button>
            <DeletePlanButton planId={id} />
          </div>
        )}
      </div>
    </div>
  )
}
