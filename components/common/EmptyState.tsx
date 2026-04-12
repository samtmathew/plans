import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
}

export function EmptyState({ title, description, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      {ctaLabel && ctaHref && (
        <Button asChild className="mt-2">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  )
}
