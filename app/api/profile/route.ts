import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { profileSchema } from '@/lib/validations/profile'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = profileSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const profileData = {
    id: user.id,
    ...parsed.data,
    avatar_url: body.avatar_url ?? null,
    photos: body.photos ?? [],
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileData)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
