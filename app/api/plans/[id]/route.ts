import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPlanSchema } from '@/lib/validations/plan'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('plans')
    .select('*, organiser:profiles!organiser_id(*), attendees:plan_attendees(*, profile:profiles!user_id(*)), items:plan_items(*)')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ data: null, error: 'Plan not found' }, { status: 404 })
  }

  return NextResponse.json({ data, error: null })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  // Check organiser
  const { data: plan } = await supabase
    .from('plans')
    .select('organiser_id')
    .eq('id', id)
    .single()

  if (!plan || plan.organiser_id !== user.id) {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { status } = body

  if (status && !['draft', 'active', 'closed'].includes(status)) {
    return NextResponse.json({ data: null, error: 'Invalid status' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('plans')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: updated, error: null })
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  // Check organiser
  const { data: plan } = await supabase
    .from('plans')
    .select('organiser_id')
    .eq('id', id)
    .single()

  if (!plan || plan.organiser_id !== user.id) {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createPlanSchema.partial().safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { items, attendee_ids: _attendeeIds, ...planFields } = parsed.data

  const { data: updated, error } = await supabase
    .from('plans')
    .update({ ...planFields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  // Replace items if provided
  if (items !== undefined) {
    const { error: deleteError } = await supabase.from('plan_items').delete().eq('plan_id', id)
    if (deleteError) {
      return NextResponse.json({ data: null, error: deleteError.message }, { status: 500 })
    }
    if (items.length > 0) {
      const { error: insertError } = await supabase.from('plan_items').insert(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        items.map(({ id: _itemId, ...item }, i) => ({ ...item, plan_id: id, sort_order: i }))
      )
      if (insertError) {
        return NextResponse.json({ data: null, error: insertError.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ data: updated, error: null })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  // Only the organiser can delete their plan
  const { data: plan } = await supabase
    .from('plans')
    .select('organiser_id, deleted_at')
    .eq('id', id)
    .single()

  if (!plan || plan.organiser_id !== user.id) {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  if (plan.deleted_at) {
    return NextResponse.json({ data: null, error: 'Plan already deleted' }, { status: 409 })
  }

  const { error } = await supabase
    .from('plans')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id }, error: null })
}
