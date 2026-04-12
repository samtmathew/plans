import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ join_token: string }>
}

export async function GET(_request: Request, { params }: Params) {
  const { join_token } = await params
  const supabase = await createClient()

  const { data: plan, error } = await supabase
    .from('plans')
    .select('id, title, description, status, join_approval, organiser:profiles!organiser_id(id, name, avatar_url)')
    .eq('join_token', join_token)
    .single()

  if (error || !plan) {
    return NextResponse.json({ data: null, error: 'Plan not found' }, { status: 404 })
  }

  return NextResponse.json({ data: plan, error: null })
}

export async function POST(_request: Request, { params }: Params) {
  const { join_token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: plan } = await supabase
    .from('plans')
    .select('id, status, join_approval, organiser_id')
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

  if (plan.organiser_id === user.id) {
    return NextResponse.json({ data: null, error: 'You are the organiser of this plan' }, { status: 400 })
  }

  // Check if already an attendee
  const { data: existing } = await supabase
    .from('plan_attendees')
    .select('id, status')
    .eq('plan_id', plan.id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json(
      { data: null, error: `You already have a ${existing.status} request for this plan` },
      { status: 400 }
    )
  }

  const status = plan.join_approval ? 'pending' : 'approved'

  const { data, error } = await supabase
    .from('plan_attendees')
    .insert({
      plan_id: plan.id,
      user_id: user.id,
      role: 'attendee',
      status,
      joined_via: 'invite_link',
      invited_by: null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
