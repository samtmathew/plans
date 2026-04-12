import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
})

interface Params {
  params: Promise<{ join_token: string }>
}

export async function POST(request: Request, { params }: Params) {
  const { join_token } = await params
  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('plans')
    .select('id, status')
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

  const { name, email } = parsed.data

  const { data, error } = await supabase
    .from('guest_attendees')
    .insert({
      plan_id: plan.id,
      name,
      email: email || null,
    })
    .select('id, guest_token, status')
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
