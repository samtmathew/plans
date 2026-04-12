import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

interface Params {
  params: Promise<{ id: string }>
}

const addAttendeeSchema = z.object({
  user_id: z.string().uuid(),
})

export async function POST(request: Request, { params }: Params) {
  const { id: planId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data: plan } = await supabase
    .from('plans')
    .select('organiser_id')
    .eq('id', planId)
    .single()

  if (!plan || plan.organiser_id !== user.id) {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = addAttendeeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('plan_attendees')
    .insert({
      plan_id: planId,
      user_id: parsed.data.user_id,
      role: 'attendee',
      status: 'pending',
      joined_via: 'organiser_added',
      invited_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null })
}
