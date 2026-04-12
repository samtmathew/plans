import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserAvatar } from '@/components/common/Avatar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlanCard } from '@/components/plan/PlanCard'
import { Plus } from 'lucide-react'
import type { Plan, PlanAttendee, Profile } from '@/types'

interface PlanWithAttendees extends Plan {
  attendees?: Array<PlanAttendee & { profile?: Profile }>
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  // Fetch user's active plans
  const { data: plans } = await supabase
    .from('plans')
    .select('*, attendees:plan_attendees(id, status, profile:profiles(id, name, avatar_url))')
    .eq('organiser_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Avatar */}
        <div className="relative">
          <UserAvatar url={profile.avatar_url} name={profile.name} size="xl" className="w-32 h-32" />
          <Button asChild size="sm" variant="ghost" className="absolute bottom-0 right-0 h-auto w-auto p-2">
            <Link href="/profile/edit">
              <span className="sr-only">Edit profile</span>
            </Link>
          </Button>
        </div>

        {/* Name & Bio */}
        <div className="space-y-3 max-w-2xl">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-on-surface -tracking-[0.04em]">
            {profile.name}
          </h1>
          {profile.bio && (
            <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>

        {/* CTA Button */}
        <Button asChild>
          <Link href="/profile/edit">Edit Profile</Link>
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-surface-container">
        <div className="flex gap-8">
          <button className="pb-4 text-xs font-bold uppercase tracking-widest text-on-surface border-b-2 border-primary transition-colors">
            My Plans
          </button>
        </div>
      </div>

      {/* My Plans Section */}
      <div className="space-y-8">
        {plans && plans.length > 0 ? (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
            {(plans as PlanWithAttendees[]).map((plan) => (
              <div key={plan.id} className="break-inside-avoid mb-6">
                <PlanCard plan={plan} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="text-lg font-headline text-on-surface mb-2">No plans yet</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Start planning your next adventure
            </p>
            <Button asChild>
              <Link href="/plans/new" className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Plan
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
