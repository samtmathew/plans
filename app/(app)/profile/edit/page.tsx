import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditClient from './ProfileEditClient'

export default async function ProfileEditPage() {
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

  return <ProfileEditClient profile={profile} userId={user.id} />
}
