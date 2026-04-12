import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/home')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Plans</h1>
        <p className="text-lg text-muted-foreground">
          Organise group trips and outings. One place for itineraries, costs, and who&apos;s coming.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/signup">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
