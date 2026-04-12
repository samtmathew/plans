import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { UserAvatar } from '@/components/common/Avatar'
import { PlanCard } from '@/components/plan/PlanCard'
import { Users, Zap } from 'lucide-react'
import type { Plan, PlanAttendee, Profile } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

interface PlanWithAttendees extends Plan {
  attendees?: Array<PlanAttendee & { profile?: Profile }>
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  // Fetch profile's active plans
  const { data: plans } = await supabase
    .from('plans')
    .select('*, attendees:plan_attendees(id, status, profile:profiles(id, name, avatar_url))')
    .eq('organiser_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Count unique collaborators across all plans
  const collaboratorIds = new Set<string>()
  if (plans) {
    (plans as PlanWithAttendees[]).forEach((plan) => {
      plan.attendees?.forEach((attendee) => {
        if (attendee.status === 'approved' && attendee.profile?.id) {
          collaboratorIds.add(attendee.profile.id)
        }
      })
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
      {/* Sidebar */}
      <div className="md:col-span-4">
        <div className="sticky top-6 space-y-6">
          {/* Avatar */}
          <UserAvatar
            url={profile.avatar_url}
            name={profile.name}
            size="lg"
            className="w-20 h-20"
          />

          {/* Name & Bio */}
          <div className="space-y-3">
            <h1 className="font-headline text-2xl font-bold text-on-surface -tracking-[0.02em]">
              {profile.name}
            </h1>
            {profile.bio && (
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Stats Pills */}
          <div className="space-y-2 pt-4 border-t border-surface-container">
            <div className="inline-flex items-center gap-2 bg-surface-container rounded-full px-3 py-2">
              <Zap className="w-3 h-3 text-on-surface" />
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
                {plans?.length || 0} Plans
              </span>
            </div>
            <br />
            <div className="inline-flex items-center gap-2 bg-surface-container rounded-full px-3 py-2">
              <Users className="w-3 h-3 text-on-surface" />
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
                {collaboratorIds.size} Collaborators
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:col-span-8">
        {plans && plans.length > 0 ? (
          <div className="space-y-6">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface -tracking-[0.04em]">
              Their Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <div key={plan.id}>
                  <PlanCard plan={plan} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-headline text-on-surface mb-2">No plans shared</h3>
            <p className="text-sm text-on-surface-variant">
              {profile.name} hasn&apos;t shared any plans yet
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
