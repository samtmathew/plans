import {
  Avatar as ShadcnAvatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  url?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '64'
  className?: string
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
  '2xl': 'h-24 w-24 text-2xl', // 96px for profile
  '64': 'h-16 w-16 text-lg', // 64px for profile avatar band
}

export function UserAvatar({ url, name, size = 'md', className }: UserAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <ShadcnAvatar className={cn(sizeClasses[size], 'bg-surface-container font-headline', className)}>
      <AvatarImage src={url ?? undefined} alt={name} />
      <AvatarFallback className="bg-surface-container text-on-surface font-headline font-semibold">
        {initials}
      </AvatarFallback>
    </ShadcnAvatar>
  )
}
