import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Profile } from '@/types'
import { PublicProfileContent } from '@/components/profile/PublicProfileContent'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  return (
    <PublicProfileContent
      profile={profile as Profile}
      currentUserId={currentUser?.id}
    />
  )
}
