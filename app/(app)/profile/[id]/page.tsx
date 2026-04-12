import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { UserAvatar } from '@/components/common/Avatar'
import { calcAge } from '@/lib/utils/format'
import { ExternalLink } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  return (
    <div className="space-y-6">
      {/* Cover photos */}
      {profile.photos?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {profile.photos.map((url: string, i: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              className="h-36 w-36 rounded-xl object-cover shrink-0"
            />
          ))}
        </div>
      )}

      {/* Profile header */}
      <div className="flex items-start gap-4">
        <UserAvatar url={profile.avatar_url} name={profile.name} size="xl" />
        <div className="flex-1 min-w-0 space-y-1">
          <h1 className="text-xl font-bold truncate">{profile.name}</h1>
          {profile.date_of_birth && (
            <p className="text-sm text-muted-foreground">
              {calcAge(profile.date_of_birth)} years old
              {profile.gender ? ` · ${profile.gender.replace(/_/g, ' ')}` : ''}
            </p>
          )}
          {profile.bio && <p className="text-sm leading-relaxed">{profile.bio}</p>}

          {/* Social links */}
          {(profile.instagram || profile.linkedin || profile.twitter_x) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Instagram
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  LinkedIn
                </a>
              )}
              {profile.twitter_x && (
                <a
                  href={`https://x.com/${profile.twitter_x}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  X / Twitter
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
