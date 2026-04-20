import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendJoinRequest } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})

interface Params {
  params: Promise<{ join_token: string }>
}

export async function POST(request: Request, { params }: Params) {
  const { join_token } = await params
  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('plans')
    .select('id, title, status, organiser_id, organiser:profiles!organiser_id(name)')
    .eq('join_token', join_token)
    .single()

  if (!plan) {
    return NextResponse.json({ data: null, error: 'Plan not found' }, { status: 404 })
  }

  if (plan.status !== 'active') {
    return NextResponse.json(
      { data: null, error: 'This plan is not accepting new members' },
      { status: 400 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { name } = parsed.data

  const { data, error } = await supabase
    .from('guest_attendees')
    .insert({ plan_id: plan.id, name })
    .select('id, guest_token, status')
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  // Fire-and-forget: notify organiser
  const organiserProfile = plan.organiser as unknown as { name: string } | null
  if (organiserProfile && plan.organiser_id) {
    const admin = createAdminClient()
    const { data: { user: organiserUser } } = await admin.auth.admin.getUserById(plan.organiser_id)
    if (organiserUser?.email) {
      sendJoinRequest({
        organiserEmail: organiserUser.email,
        organiserName: organiserProfile.name,
        joinerName: name,
        planTitle: plan.title as string,
        planId: plan.id,
      })
    }
  }

  return NextResponse.json({ data, error: null })
}
