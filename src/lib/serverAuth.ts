import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { SubscriptionTier } from '@/types/database'

export async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function checkSubscription(userId: string, requiredTier: SubscriptionTier = 'pro') {
  const supabase = getSupabaseAdmin()
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_expires_at')
    .eq('id', userId)
    .single()

  if (!profile) return false

  const tierOrder: Record<string, number> = { free: 0, pro: 1, enterprise: 2 }
  const userLevel = tierOrder[profile.subscription_tier] || 0
  const requiredLevel = tierOrder[requiredTier] || 1

  if (userLevel < requiredLevel) return false

  // Check expiration
  if (profile.subscription_expires_at) {
    const expires = new Date(profile.subscription_expires_at)
    if (expires < new Date()) return false
  }

  return true
}
