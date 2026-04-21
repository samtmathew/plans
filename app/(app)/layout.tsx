import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

async function NavBar({ profile }: { profile: Profile }) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('plan_attendees')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('status', 'pending')
    .eq('joined_via', 'organiser_added')
  const inviteCount = count ?? 0

  return (
    <header className="nav-frosted sticky top-0 z-50 border-b border-[var(--plans-divider)]">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/home" className="font-headline font-semibold text-lg tracking-tight text-[var(--plans-text)]">
          Plans
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/plans/new"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-[var(--plans-text)] border border-[var(--plans-divider)] rounded-full')}
          >
            New plan
          </Link>

          <Link href="/home#invites" className="relative p-1.5 rounded-full hover:bg-[var(--plans-surface)] transition-colors">
            <Bell className="w-5 h-5 text-[var(--plans-text-2)]" />
            {inviteCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {inviteCount > 9 ? '9+' : inviteCount}
              </span>
            )}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs bg-[var(--plans-surface)] font-headline">
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

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-plans-bg">
      <NavBar profile={profile} />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
