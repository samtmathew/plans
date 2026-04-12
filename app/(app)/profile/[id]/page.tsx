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
    <div className="space-y-8">
      {/* Photos strip */}
      {profile.photos?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {profile.photos.map((url: string, i: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              className="h-32 w-32 rounded-xl object-cover shrink-0"
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <UserAvatar url={profile.avatar_url} name={profile.name} size="xl" />
        <div className="flex-1 space-y-1">
          <h1 className="text-xl font-bold">{profile.name}</h1>
          {profile.date_of_birth && (
            <p className="text-sm text-muted-foreground">
              {calcAge(profile.date_of_birth)} years old
              {profile.gender ? ` · ${profile.gender.replace('_', ' ')}` : ''}
            </p>
          )}
          {profile.bio && <p className="text-sm">{profile.bio}</p>}

          <div className="flex gap-3 pt-1">
            {profile.instagram && (
              <a
                href={`https://instagram.com/${profile.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Instagram"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label="LinkedIn"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            {profile.twitter_x && (
              <a
                href={`https://x.com/${profile.twitter_x}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label="X / Twitter"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
