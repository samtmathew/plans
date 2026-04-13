import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  action: z.enum(['accept', 'decline']),
})

interface Params {
  params: Promise<{ attendee_id: string }>
}

export async function POST(request: Request, { params }: Params) {
  const { attendee_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: 'Invalid action' }, { status: 400 })
  }

  const { action } = parsed.data

  // Verify the row belongs to the current user and is a pending organiser_added invite
  const { data: attendee } = await supabase
    .from('plan_attendees')
    .select('id, status, joined_via, user_id')
    .eq('id', attendee_id)
    .eq('user_id', user.id)
    .eq('joined_via', 'organiser_added')
    .eq('status', 'pending')
    .single()

  if (!attendee) {
    return NextResponse.json({ data: null, error: 'Invite not found' }, { status: 404 })
  }

  const newStatus = action === 'accept' ? 'approved' : 'rejected'

  const { data, error } = await supabase
    .from('plan_attendees')
    .update({ status: newStatus })
    .eq('id', attendee_id)
    .select('status')
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { status: data.status }, error: null })
}
