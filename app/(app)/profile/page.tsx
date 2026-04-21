import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile, Plan } from '@/types'
import { OwnProfileContent } from '@/components/profile/OwnProfileContent'

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

  const [{ data: plans }, { data: attendingRows }] = await Promise.all([
    supabase.from('plans').select(`
      *,
      attendees:plan_attendees(
        id,
        status,
        profile:profiles!user_id(id, name, avatar_url)
      )
    `).eq('organiser_id', user.id).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('plan_attendees').select(`
      plan:plans(*, attendees:plan_attendees(id, status, profile:profiles!user_id(id, name, avatar_url)))
    `).eq('user_id', user.id).eq('status', 'approved').neq('role', 'organiser'),
  ])
  const attendingPlans = (attendingRows ?? []).map((r) => r.plan).filter(Boolean) as unknown as Plan[]

  return <OwnProfileContent profile={profile as Profile} userId={user.id} plans={plans || []} attendingPlans={attendingPlans} />
}
