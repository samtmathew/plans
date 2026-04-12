import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPlanSchema } from '@/lib/validations/plan'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createPlanSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { items, attendee_ids, ...planFields } = parsed.data

  // Create plan
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .insert({
      ...planFields,
      organiser_id: user.id,
    })
    .select()
    .single()

  if (planError || !plan) {
    return NextResponse.json({ data: null, error: planError?.message ?? 'Failed to create plan' }, { status: 500 })
  }

  // Add organiser as attendee
  await supabase.from('plan_attendees').insert({
    plan_id: plan.id,
    user_id: user.id,
    role: 'organiser',
    status: 'approved',
    joined_via: 'organiser_added',
    invited_by: user.id,
  })

  // Insert cost items
  if (items.length > 0) {
    await supabase.from('plan_items').insert(
      items.map((item, i) => ({
        ...item,
        plan_id: plan.id,
        sort_order: i,
      }))
    )
  }

  // Add attendees as pending
  if (attendee_ids.length > 0) {
    await supabase.from('plan_attendees').insert(
      attendee_ids.map((uid: string) => ({
        plan_id: plan.id,
        user_id: uid,
        role: 'attendee',
        status: 'pending',
        joined_via: 'organiser_added',
        invited_by: user.id,
      }))
    )
  }

  return NextResponse.json({ data: plan, error: null })
}
