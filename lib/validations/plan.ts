import { z } from 'zod'

export const planItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Item name is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  pricing_type: z.enum(['per_head', 'group']),
  description: z.string().max(150, 'Description must be 150 characters or less').nullable().optional(),
  sort_order: z.number().int().default(0),
})

export const createPlanSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(80, 'Title must be 80 characters or less'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(300, 'Description must be 300 characters or less'),
  itinerary: z.string().min(1, 'Itinerary is required'),
  start_date: z.string().optional().nullable().transform((v) => (!v ? null : v)),
  status: z.enum(['draft', 'active']),
  join_approval: z.boolean().default(true),
  items: z.array(planItemSchema).default([]),
  attendee_ids: z.array(z.string()).default([]),
  cover_photo: z.string().nullable().optional(),
  gallery_photos: z.array(z.string()).default([]),
})

export type CreatePlanFormValues = z.infer<typeof createPlanSchema>
export type PlanItemFormValues = z.infer<typeof planItemSchema>
