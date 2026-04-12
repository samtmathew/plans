import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/common/Avatar'
import { JoinButton } from './JoinButton'

interface Props {
  params: Promise<{ join_token: string }>
}

export default async function JoinPage({ params }: Props) {
  const { join_token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/join/${join_token}`)
  }

  // Resolve join token → plan
  const { data: plan } = await supabase
    .from('plans')
    .select('*, organiser:profiles!organiser_id(*), attendees:plan_attendees(*)')
    .eq('join_token', join_token)
    .single()

  if (!plan) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold">Plan not found</h1>
          <p className="text-muted-foreground text-sm">This join link is invalid or has expired.</p>
          <Button asChild variant="outline">
            <Link href="/home">Go home</Link>
          </Button>
        </div>
      </main>
    )
  }

  // Organiser visiting their own join link
  if (plan.organiser_id === user.id) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold">You&apos;re the organiser</h1>
          <p className="text-muted-foreground text-sm">This is your own plan.</p>
          <Button asChild>
            <Link href={`/plans/${plan.id}`}>View plan</Link>
          </Button>
        </div>
      </main>
    )
  }

  // Already an attendee
  const existing = plan.attendees?.find((a: { user_id: string }) => a.user_id === user.id)
  if (existing) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold">You&apos;re already in this plan</h1>
          <p className="text-muted-foreground text-sm capitalize">
            Status: {existing.status}
          </p>
          <Button asChild>
            <Link href={`/plans/${plan.id}`}>View plan</Link>
          </Button>
        </div>
      </main>
    )
  }

  // Plan closed
  if (plan.status === 'closed') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold">This plan is closed</h1>
          <p className="text-muted-foreground text-sm">It&apos;s no longer accepting new members.</p>
          <Button asChild variant="outline">
            <Link href="/home">Go home</Link>
          </Button>
        </div>
      </main>
    )
  }

  // Plan is draft
  if (plan.status === 'draft') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold">This plan isn&apos;t public yet</h1>
          <p className="text-muted-foreground text-sm">The organiser hasn&apos;t published it.</p>
          <Button asChild variant="outline">
            <Link href="/home">Go home</Link>
          </Button>
        </div>
      </main>
    )
  }

  // Show join preview
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{plan.title}</h1>
          <p className="text-muted-foreground">{plan.description}</p>
        </div>

        {plan.organiser && (
          <div className="flex items-center gap-3 border rounded-lg p-3">
            <UserAvatar
              url={plan.organiser.avatar_url}
              name={plan.organiser.name}
              size="md"
            />
            <div>
              <p className="text-xs text-muted-foreground">Organised by</p>
              <p className="text-sm font-medium">{plan.organiser.name}</p>
            </div>
          </div>
        )}

        {plan.join_approval && (
          <p className="text-xs text-muted-foreground">
            The organiser reviews all join requests before approving.
          </p>
        )}

        <JoinButton planId={plan.id} joinToken={join_token} />
      </div>
    </main>
  )
}
