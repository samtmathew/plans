import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { InviteWithPlan } from '@/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('plan_attendees')
    .select(`
      id,
      plan:plans!plan_id(id, title, cover_photo, start_date, organiser:profiles!organiser_id(name, avatar_url))
    `)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .eq('joined_via', 'organiser_added')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  // Supabase FK joins return nested objects (not arrays) for many-to-one relations.
  // `plan` is a single object and `plan.organiser` is a single object.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invites: InviteWithPlan[] = (data ?? []).map((row: any) => ({
    attendee_id: row.id,
    plan: {
      id: row.plan.id,
      title: row.plan.title,
      cover_photo: row.plan.cover_photo ?? null,
      start_date: row.plan.start_date ?? null,
    },
    organiser: {
      name: row.plan.organiser?.name ?? 'Organiser',
      avatar_url: row.plan.organiser?.avatar_url ?? null,
    },
  }))

  return NextResponse.json({ data: invites, error: null })
}
