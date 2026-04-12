import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ join_token: string }>
}

export async function GET(request: Request, { params }: Params) {
  const { join_token } = await params
  const { searchParams } = new URL(request.url)
  const guestToken = searchParams.get('token')

  if (!guestToken) {
    return NextResponse.json({ data: null, error: 'Missing token' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('plans')
    .select('id')
    .eq('join_token', join_token)
    .single()

  if (!plan) {
    return NextResponse.json({ data: null, error: 'Plan not found' }, { status: 404 })
  }

  const { data: guest } = await supabase
    .from('guest_attendees')
    .select('status')
    .eq('plan_id', plan.id)
    .eq('guest_token', guestToken)
    .single()

  if (!guest || guest.status !== 'approved') {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  const [{ data: items }, { data: attendees }] = await Promise.all([
    supabase
      .from('plan_items')
      .select('*')
      .eq('plan_id', plan.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('plan_attendees')
      .select('*, profile:profiles!user_id(*)')
      .eq('plan_id', plan.id)
      .eq('status', 'approved'),
  ])

  return NextResponse.json({
    data: { items: items ?? [], attendees: attendees ?? [] },
    error: null,
  })
}
