import { NextResponse } from 'next/server'
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/types/database'

export type SubscriptionFeature = keyof typeof SUBSCRIPTION_LIMITS.core

/**
 * Check if a subscription tier has access to a feature.
 * Returns true if the feature is enabled (boolean) or has remaining capacity (number).
 */
export function hasFeatureAccess(
  tier: SubscriptionTier,
  feature: SubscriptionFeature
): boolean {
  const limits = SUBSCRIPTION_LIMITS[tier]
  const value = limits[feature]
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  return false
}

/**
 * Return a 403 response when a feature is not available for the user's tier.
 */
export function featureNotAvailable(feature: string) {
  return NextResponse.json(
    { error: `Feature "${feature}" requires a higher subscription tier.` },
    { status: 403 }
  )
}

/**
 * Fetch user's effective subscription tier from Supabase admin client.
 * Returns 'trial' if profile not found.
 */
export async function getUserTier(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<SubscriptionTier> {
  const { data } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_expires_at')
    .eq('id', userId)
    .single()

  if (!data) return 'trial'

  const tier = (data.subscription_tier || 'trial') as SubscriptionTier

  // If subscription expired, treat as trial
  if (
    tier !== 'trial' &&
    data.subscription_expires_at &&
    new Date(data.subscription_expires_at) < new Date()
  ) {
    return 'trial'
  }

  return tier
}
