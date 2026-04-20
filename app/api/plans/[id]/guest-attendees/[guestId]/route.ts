import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendApprovalNotification } from '@/lib/email'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['approved', 'rejected']),
})

interface Params {
  params: Promise<{ id: string; guestId: string }>
}

async function getOrganiserPlan(planId: string, userId: string) {
  const supabase = await createClient()
  const { data: plan } = await supabase
    .from('plans')
    .select('organiser_id')
    .eq('id', planId)
    .single()
  return plan?.organiser_id === userId ? plan : null
}

export async function PATCH(request: Request, { params }: Params) {
  const { id: planId, guestId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const plan = await getOrganiserPlan(planId, user.id)
  if (!plan) return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ data: null, error: 'Invalid body' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('guest_attendees')
    .update({ status: parsed.data.status })
    .eq('id', guestId)
    .eq('plan_id', planId)
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })

  // Fire-and-forget: notify guest on approval (only if they have an email)
  if (parsed.data.status === 'approved' && data.email && data.name) {
    const supabaseInner = await createClient()
    const { data: planData } = await supabaseInner
      .from('plans')
      .select('id, title')
      .eq('id', planId)
      .single()
    if (planData) {
      sendApprovalNotification({
        userEmail: data.email,
        userName: data.name,
        planTitle: planData.title,
        planId: planData.id,
      })
    }
  }

  return NextResponse.json({ data, error: null })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id: planId, guestId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const plan = await getOrganiserPlan(planId, user.id)
  if (!plan) return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('guest_attendees')
    .delete()
    .eq('id', guestId)
    .eq('plan_id', planId)

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data: { id: guestId }, error: null })
}
