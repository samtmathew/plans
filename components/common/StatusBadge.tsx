import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Status = 'draft' | 'active' | 'closed' | 'pending' | 'approved' | 'rejected' | 'organiser' | 'attendee'

const variants: Record<Status, { label: string; className: string }> = {
  draft:     { label: 'Draft',     className: 'bg-surface-container text-on-surface-variant' },
  active:    { label: 'Active',    className: 'bg-green-100 text-green-800' },
  closed:    { label: 'Closed',    className: 'bg-zinc-200 text-zinc-600' },
  pending:   { label: 'Pending',   className: 'bg-yellow-100 text-yellow-800' },
  approved:  { label: 'Approved',  className: 'bg-green-100 text-green-800' },
  rejected:  { label: 'Rejected',  className: 'bg-red-100 text-red-700' },
  organiser: { label: 'Organiser', className: 'bg-blue-100 text-blue-800' },
  attendee:  { label: 'Attendee',  className: 'bg-surface-container text-on-surface-variant' },
}

interface StatusBadgeProps {
  status: Status
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, className: variantClass } = variants[status]
  return (
    <Badge variant="secondary" className={cn('font-headline text-xs uppercase tracking-widest', variantClass, className)}>
      {label}
    </Badge>
  )
}
