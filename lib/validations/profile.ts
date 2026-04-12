import { z } from 'zod'

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  bio: z.string().max(500, 'Bio must be 500 characters or less').nullable().optional(),
  date_of_birth: z
    .string()
    .nullable()
    .optional()
    .refine((val) => {
      if (!val) return true
      const date = new Date(val)
      return !isNaN(date.getTime())
    }, 'Invalid date'),
  gender: z.string().nullable().optional(),
  instagram: z.string().max(100).nullable().optional(),
  linkedin: z.string().url('Invalid LinkedIn URL').nullable().optional().or(z.literal('')),
  twitter_x: z.string().max(100).nullable().optional(),
  avatar_url: z.string().url().nullable().optional().or(z.literal('')),
  photos: z.array(z.string().url()).max(3).optional(),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
