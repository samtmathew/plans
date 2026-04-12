import type { PlanItem } from '@/types'

export function calcPerHeadTotal(items: PlanItem[]): number {
  return items
    .filter((i) => i.pricing_type === 'per_head')
    .reduce((sum, i) => sum + i.price, 0)
}

export function calcGroupShareTotal(
  items: PlanItem[],
  attendeeCount: number
): number {
  const count = Math.max(attendeeCount, 1)
  return items
    .filter((i) => i.pricing_type === 'group')
    .reduce((sum, i) => sum + i.price / count, 0)
}

export function calcEstimatedPerPerson(
  items: PlanItem[],
  attendeeCount: number
): number {
  return calcPerHeadTotal(items) + calcGroupShareTotal(items, attendeeCount)
}

export function calcGroupItemPerPerson(
  price: number,
  attendeeCount: number
): number {
  return price / Math.max(attendeeCount, 1)
}
