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

  const { data } = await supabase
    .from('guest_attendees')
    .select('status, name')
    .eq('plan_id', plan.id)
    .eq('guest_token', guestToken)
    .single()

  return NextResponse.json({ data: data ?? null, error: null })
}
