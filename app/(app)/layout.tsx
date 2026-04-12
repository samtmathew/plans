import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

async function NavBar({ profile }: { profile: Profile }) {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/home" className="font-semibold text-lg">
          Plans
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/plans/new" className={cn(buttonVariants({ size: 'sm' }))}>
            Create plan
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {profile.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href="/profile" className="w-full">Your profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/api/auth/logout" className="w-full">Log out</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-background">
      <NavBar profile={profile} />
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
