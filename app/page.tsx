import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Calculator } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/home')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">Plans</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Group trips made simple. One place for itineraries,
            cost splits, and everyone who&apos;s coming.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Itineraries</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50">
            <Calculator className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Cost splits</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Attendees</span>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button asChild size="lg" className="px-8">
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
