// Plans — Shared TypeScript Types
// Dev A creates this file. Dev B extends it if needed.
// Import from here: import type { Plan, Profile, PlanItem, PlanAttendee } from '@/types'

export type Profile = {
  id: string
  name: string
  bio: string | null
  date_of_birth: string | null
  gender: string | null
  instagram: string | null
  linkedin: string | null
  twitter_x: string | null
  avatar_url: string | null
  photos: string[]
  created_at: string
}

export type Plan = {
  id: string
  organiser_id: string
  title: string
  description: string
  itinerary: string
  start_date: string | null
  status: 'draft' | 'active' | 'closed'
  join_token: string
  join_approval: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
  cover_photo: string | null
  gallery_photos: string[]
  // Joined relations (populated when fetched with select)
  organiser?: Profile
  attendees?: PlanAttendee[]
  items?: PlanItem[]
  end_date?: string | null
}

export type PlanItem = {
  id: string
  plan_id: string
  title: string
  price: number
  pricing_type: 'per_head' | 'group'
  description: string | null
  sort_order: number
  created_at: string
}

export type PlanAttendee = {
  id: string
  plan_id: string
  user_id: string
  role: 'organiser' | 'attendee'
  status: 'pending' | 'approved' | 'rejected'
  invited_by: string | null
  joined_via: 'invite_link' | 'organiser_added'
  created_at: string
  // Joined relation (populated when fetched with select)
  profile?: Profile
}

// -------------------------------------------------------
// API response wrapper
// All API routes return this shape.
// -------------------------------------------------------

export type ApiResponse<T> = {
  data: T | null
  error: string | null
}

// -------------------------------------------------------
// Form / input types
// -------------------------------------------------------

export type PlanItemInput = Omit<PlanItem, 'id' | 'plan_id' | 'created_at'>

export type CreatePlanInput = {
  title: string
  description: string
  itinerary: string
  status: 'draft' | 'active'
  join_approval: boolean
  items: PlanItemInput[]
  attendee_ids: string[]
}

export type UpdatePlanInput = Partial<CreatePlanInput>

export type ProfileInput = {
  name: string
  bio?: string | null
  date_of_birth?: string | null
  gender?: string | null
  instagram?: string | null
  linkedin?: string | null
  twitter_x?: string | null
  avatar_url?: string | null
  photos?: string[]
}

// Invite (organiser_added plan_attendees row) with joined plan + organiser data
export type InviteWithPlan = {
  attendee_id: string
  plan: {
    id: string
    title: string
    cover_photo: string | null
    start_date: string | null
  }
  organiser: {
    name: string
    avatar_url: string | null
  }
}

// -------------------------------------------------------
// Guest join flow (unauthenticated attendees)
// -------------------------------------------------------

export type GuestAttendee = {
  id: string
  plan_id: string
  guest_token: string
  name: string
  email: string | null
  status: 'pending' | 'approved' | 'rejected'
  joined_via: string
  created_at: string
  user_id: string | null
}

// Minimal plan data safe to render on the public join page (no auth)
export type PlanPreviewData = {
  id: string
  title: string
  description: string | null
  cover_photo: string | null
  start_date: string | null
  join_approval: boolean
  organiser: {
    name: string
    avatar_url: string | null
  }
  approved_count: number
  cost_per_person: number
}
