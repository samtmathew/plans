import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { planItemSchema } from '@/lib/validations/plan'

interface Params {
  params: Promise<{ id: string; itemId: string }>
}

async function assertOrganiser(supabase: Awaited<ReturnType<typeof createClient>>, planId: string, userId: string) {
  const { data } = await supabase.from('plans').select('organiser_id').eq('id', planId).single()
  return data?.organiser_id === userId
}

export async function PUT(request: Request, { params }: Params) {
  const { id: planId, itemId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  if (!(await assertOrganiser(supabase, planId, user.id))) {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = planItemSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('plan_items')
    .update(parsed.data)
    .eq('id', itemId)
    .eq('plan_id', planId)
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id: planId, itemId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  if (!(await assertOrganiser(supabase, planId, user.id))) {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('plan_items')
    .delete()
    .eq('id', itemId)
    .eq('plan_id', planId)

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data: { id: itemId }, error: null })
}
