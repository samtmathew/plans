'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2 } from 'lucide-react'
import {
  calcPerHeadTotal,
  calcGroupShareTotal,
  calcEstimatedPerPerson,
  calcGroupItemPerPerson,
} from '@/lib/utils/cost'
import { formatCurrency } from '@/lib/utils/format'
import type { PlanItemFormValues } from '@/lib/validations/plan'

interface CostBreakdownProps {
  items: PlanItemFormValues[]
  approvedAttendeeCount: number
  onChange?: (items: PlanItemFormValues[]) => void
  readOnly?: boolean
}

export function CostBreakdown({
  items,
  approvedAttendeeCount,
  onChange,
  readOnly = false,
}: CostBreakdownProps) {
  function addItem() {
    onChange?.([
      ...items,
      {
        title: '',
        price: 0,
        pricing_type: 'per_head',
        description: null,
        sort_order: items.length,
      },
    ])
  }

  function removeItem(index: number) {
    onChange?.(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof PlanItemFormValues, value: unknown) {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onChange?.(updated)
  }

  const perHeadTotal = calcPerHeadTotal(items as never)
  const groupShareTotal = calcGroupShareTotal(items as never, approvedAttendeeCount)
  const estimatedTotal = calcEstimatedPerPerson(items as never, approvedAttendeeCount)
  const hasGroupItems = items.some((i) => i.pricing_type === 'group')

  return (
    <div className="space-y-4">
      {items.length === 0 && readOnly && (
        <p className="text-sm text-muted-foreground">No cost items added.</p>
      )}

      {items.map((item, index) => (
        <div key={index} className="space-y-2 p-3 border rounded-lg bg-muted/20">
          {readOnly ? (
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-medium text-sm">{formatCurrency(item.price)}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {item.pricing_type === 'per_head' ? 'Per head' : 'Group total'}
                </p>
                {item.pricing_type === 'group' && (
                  <p className="text-xs text-muted-foreground">
                    {approvedAttendeeCount > 0
                      ? `${formatCurrency(calcGroupItemPerPerson(item.price, approvedAttendeeCount))} / person`
                      : '— / person'}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2 items-center">
                <Input
                  value={item.title}
                  onChange={(e) => updateItem(index, 'title', e.target.value)}
                  placeholder="Item name (e.g. Stay)"
                  className="flex-1"
                />
                <div className="relative w-28">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.price || ''}
                    onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                    className="pl-6"
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeItem(index)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2 items-center">
                <div className="flex rounded-md border overflow-hidden text-sm">
                  <button
                    type="button"
                    onClick={() => updateItem(index, 'pricing_type', 'per_head')}
                    className={`px-3 py-1.5 transition-colors ${
                      item.pricing_type === 'per_head'
                        ? 'bg-foreground text-background'
                        : 'hover:bg-muted'
                    }`}
                  >
                    Per head
                  </button>
                  <button
                    type="button"
                    onClick={() => updateItem(index, 'pricing_type', 'group')}
                    className={`px-3 py-1.5 border-l transition-colors ${
                      item.pricing_type === 'group'
                        ? 'bg-foreground text-background'
                        : 'hover:bg-muted'
                    }`}
                  >
                    Group total
                  </button>
                </div>
                {item.pricing_type === 'group' && item.price > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {approvedAttendeeCount > 0
                      ? `→ ${formatCurrency(calcGroupItemPerPerson(item.price, approvedAttendeeCount))} / person`
                      : '→ add attendees to estimate'}
                  </span>
                )}
              </div>

              <Input
                value={item.description ?? ''}
                onChange={(e) => updateItem(index, 'description', e.target.value || null)}
                placeholder="Notes (optional, max 150 chars)"
                maxLength={150}
                className="text-sm"
              />
            </>
          )}
        </div>
      ))}

      {!readOnly && (
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add item
        </Button>
      )}

      {items.length > 0 && (
        <>
          <Separator />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Per-head subtotal</span>
              <span className="font-medium">{formatCurrency(perHeadTotal)}</span>
            </div>
            {hasGroupItems && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Group share (your split)</span>
                <span className="font-medium">
                  {approvedAttendeeCount > 0 ? formatCurrency(groupShareTotal) : '—'}
                </span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Estimated per person</span>
              <span>
                {approvedAttendeeCount > 0 || !hasGroupItems
                  ? formatCurrency(estimatedTotal)
                  : '—'}
              </span>
            </div>
            {approvedAttendeeCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Based on {approvedAttendeeCount}{' '}
                {approvedAttendeeCount === 1 ? 'person' : 'people'}
                {approvedAttendeeCount === 1 && ' — you&apos;re the only one so far'}
              </p>
            )}
            {approvedAttendeeCount === 0 && hasGroupItems && (
              <p className="text-xs text-muted-foreground">
                Add attendees to see per-person cost for group items
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
