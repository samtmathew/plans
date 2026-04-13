import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  guest_token: z.string().uuid(),
  plan_id: z.string().uuid(),
})

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    console.error('[link-guest] validation error', parsed.error.flatten())
    return NextResponse.json({ data: null, error: 'Invalid request' }, { status: 400 })
  }

  const { guest_token, plan_id } = parsed.data

  // Verify the guest record exists, matches the plan, and is approved
  const { data: guest } = await supabase
    .from('guest_attendees')
    .select('id, status')
    .eq('guest_token', guest_token)
    .eq('plan_id', plan_id)
    .single()

  if (!guest) {
    return NextResponse.json({ data: null, error: 'Guest record not found' }, { status: 404 })
  }

  if (guest.status !== 'approved') {
    return NextResponse.json({ data: null, error: 'Guest is not approved' }, { status: 403 })
  }

  // Idempotency: if plan_attendees row already exists for this user, return success
  const { data: existing } = await supabase
    .from('plan_attendees')
    .select('id')
    .eq('plan_id', plan_id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    // Create the plan_attendees row — pre-approved since they were approved as a guest
    const { error: insertError } = await supabase.from('plan_attendees').insert({
      plan_id,
      user_id: user.id,
      role: 'attendee',
      status: 'approved',
      joined_via: 'invite_link',
    })

    if (insertError) {
      return NextResponse.json({ data: null, error: 'Failed to create attendee record' }, { status: 500 })
    }
  }

  // Stamp the guest record with the user_id for audit trail (best-effort, non-fatal)
  await supabase
    .from('guest_attendees')
    .update({ user_id: user.id })
    .eq('id', guest.id)

  return NextResponse.json({ data: { plan_id }, error: null })
}
