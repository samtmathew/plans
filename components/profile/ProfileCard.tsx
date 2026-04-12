import Link from 'next/link'
import { UserAvatar } from '@/components/common/Avatar'
import type { Profile } from '@/types'

interface ProfileCardProps {
  profile: Profile
  linkable?: boolean
}

export function ProfileCard({ profile, linkable = true }: ProfileCardProps) {
  const inner = (
    <div className="flex items-center gap-3">
      <UserAvatar url={profile.avatar_url} name={profile.name} size="md" />
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{profile.name}</p>
        {profile.bio && (
          <p className="text-xs text-muted-foreground truncate">{profile.bio}</p>
        )}
      </div>
    </div>
  )

  if (!linkable) return <div>{inner}</div>

  return (
    <Link href={`/profile/${profile.id}`} className="block hover:opacity-80 transition-opacity">
      {inner}
    </Link>
  )
}
