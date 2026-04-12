import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types'
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

  const { data: plans } = await supabase
    .from('plans')
    .select(`
      *,
      attendees:plan_attendees(
        id,
        status,
        profile:profiles!user_id(id, name, avatar_url)
      )
    `)
    .eq('organiser_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return <OwnProfileContent profile={profile as Profile} userId={user.id} plans={plans || []} />
}
