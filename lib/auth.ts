import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Cached getUser() — deduplicates the Supabase auth network call
 * across multiple RSCs in the same request (middleware already validates auth).
 */
export const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
