'use client'

import { useAuth } from '@/lib/AuthContext'
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/types/database'

type SubscriptionLimits = (typeof SUBSCRIPTION_LIMITS)[SubscriptionTier]

interface UseSubscriptionReturn {
  tier: SubscriptionTier
  isFreeTier: boolean
  isProTier: boolean
  isEnterpriseTier: boolean
  limits: SubscriptionLimits
  isExpired: boolean
  daysUntilExpiry: number | null
  canExport: boolean
  canAccessApi: boolean
  canUseMarketplace: boolean
  canUseAutoReorder: boolean
}

export function useSubscription(): UseSubscriptionReturn {
  const { profile } = useAuth()

  const tier: SubscriptionTier = profile?.subscription_tier || 'free'
  const limits = SUBSCRIPTION_LIMITS[tier]

  const expiresAt = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at)
    : null

  const isExpired = expiresAt ? expiresAt < new Date() : false

  const daysUntilExpiry = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  // If subscription is expired, treat as free tier
  const effectiveTier = isExpired ? 'free' : tier
  const effectiveLimits = SUBSCRIPTION_LIMITS[effectiveTier]

  return {
    tier: effectiveTier,
    isFreeTier: effectiveTier === 'free',
    isProTier: effectiveTier === 'pro',
    isEnterpriseTier: effectiveTier === 'enterprise',
    limits: effectiveLimits,
    isExpired,
    daysUntilExpiry: isExpired ? null : daysUntilExpiry,
    canExport: effectiveLimits.export,
    canAccessApi: effectiveLimits.api_access,
    canUseMarketplace: effectiveLimits.marketplace,
    canUseAutoReorder: effectiveLimits.auto_reorder,
  }
}
