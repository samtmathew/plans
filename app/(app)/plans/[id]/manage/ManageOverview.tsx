import Image from 'next/image'
import { CostBreakdown } from '@/components/plan/CostBreakdown'
import type { Plan, PlanItem } from '@/types'

interface ManageOverviewProps {
  plan: Plan
}

export function ManageOverview({ plan }: ManageOverviewProps) {
  const planItems = (plan.items || []).map((i: PlanItem) => ({
    id: i.id,
    title: i.title,
    price: i.price,
    pricing_type: i.pricing_type,
    description: i.description,
    sort_order: i.sort_order,
  }))

  const galleryPhotos = plan.gallery_photos || []
  const approvedCount = (plan.attendees || []).length

  return (
    <div className="space-y-8">
      {/* Description */}
      {plan.description && (
        <div>
          <h2 className="text-lg font-semibold font-headline text-on-surface mb-4">Description</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">{plan.description}</p>
        </div>
      )}

      {/* Itinerary Preview */}
      {plan.itinerary && (
        <div>
          <h2 className="text-lg font-semibold font-headline text-on-surface mb-4">Itinerary</h2>
          <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap leading-relaxed text-foreground">
            {plan.itinerary}
          </div>
        </div>
      )}

      {/* Cost breakdown */}
      <div>
        <h2 className="text-lg font-semibold font-headline text-on-surface mb-4">Cost breakdown</h2>
        <div className="bg-surface-container-lowest rounded-lg p-4">
          {planItems.length > 0 ? (
            <CostBreakdown
              items={planItems}
              approvedAttendeeCount={approvedCount}
              readOnly
            />
          ) : (
            <p className="text-sm text-on-surface-variant">No cost items added yet.</p>
          )}
        </div>
      </div>

      {/* Gallery Preview */}
      {galleryPhotos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold font-headline text-on-surface mb-4">Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {galleryPhotos.slice(0, 3).map((photo, idx) => (
              <div key={idx} className="rounded-lg overflow-hidden bg-muted h-48">
                <Image
                  src={photo}
                  alt="Plan gallery photo"
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          {galleryPhotos.length > 3 && (
            <p className="text-sm text-on-surface-variant mt-2">
              +{galleryPhotos.length - 3} more photos
            </p>
          )}
        </div>
      )}
    </div>
  )
}
