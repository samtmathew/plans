import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { UserAvatar } from '@/components/common/Avatar'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Users } from 'lucide-react'
import type { Plan } from '@/types'

interface PlanCardProps {
  plan: Plan
  currentUserId: string
}

export function PlanCard({ plan, currentUserId }: PlanCardProps) {
  const isOrganiser = plan.organiser_id === currentUserId
  const approvedCount =
    plan.attendees?.filter((a) => a.status === 'approved').length ?? 0

  return (
    <Link href={`/plans/${plan.id}`} className="block">
      <Card className="hover:bg-muted/30 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-snug">{plan.title}</h3>
            <div className="flex gap-1.5 shrink-0">
              <StatusBadge status={plan.status} />
              <StatusBadge status={isOrganiser ? 'organiser' : 'attendee'} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            {plan.organiser && (
              <div className="flex items-center gap-2">
                <UserAvatar
                  url={plan.organiser.avatar_url}
                  name={plan.organiser.name}
                  size="sm"
                />
                <span className="text-xs text-muted-foreground">{plan.organiser.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Users className="h-3.5 w-3.5" />
              <span>{approvedCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
