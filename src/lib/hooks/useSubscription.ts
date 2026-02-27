'use client'

import { useAuth } from '@/lib/AuthContext'
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/types/database'

type SubscriptionLimits = (typeof SUBSCRIPTION_LIMITS)[SubscriptionTier]

interface UseSubscriptionReturn {
  tier: SubscriptionTier
  // Tier booleans
  isTrialTier: boolean
  isCoreTier: boolean
  isMultiTier: boolean
  isEnterpriseTier: boolean
  // Trial state
  isTrialExpired: boolean
  trialDaysLeft: number | null
  // Subscription state
  isExpired: boolean
  daysUntilExpiry: number | null
  // Convenience
  needsUpgrade: boolean
  // Limits
  limits: SubscriptionLimits
  // Capability flags
  canExport: boolean
  canAccessApi: boolean
  canUseMarketplace: boolean
  canUseAutoReorder: boolean
  canUsePOS: boolean
  canUseBar: boolean
  canUseCRM: boolean
  canUseWaiterTablet: boolean
  canUseFinancialReports: boolean
  // Legacy aliases (for gradual migration of existing consumers)
  isFreeTier: boolean
  isProTier: boolean
}

export function useSubscription(): UseSubscriptionReturn {
  const { profile } = useAuth()

  const tier: SubscriptionTier = profile?.subscription_tier || 'trial'
  const limits = SUBSCRIPTION_LIMITS[tier]

  // Subscription expiry (Stripe-managed, for paid tiers)
  const expiresAt = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at)
    : null
  const isExpired = expiresAt ? expiresAt < new Date() : false
  const daysUntilExpiry = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  // Trial expiry (DB-managed, for trial tier)
  const trialExpiresAt = profile?.trial_expires_at
    ? new Date(profile.trial_expires_at)
    : null
  const isTrialExpired = tier === 'trial' && trialExpiresAt
    ? trialExpiresAt < new Date()
    : false
  const trialDaysLeft = tier === 'trial' && trialExpiresAt && !isTrialExpired
    ? Math.max(0, Math.ceil((trialExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  // If subscription is expired, treat as trial
  const effectiveTier: SubscriptionTier = isExpired ? 'trial' : tier
  const effectiveLimits = SUBSCRIPTION_LIMITS[effectiveTier]

  // Needs upgrade if trial expired or subscription expired
  const needsUpgrade = isTrialExpired || (isExpired && tier !== 'trial')

  return {
    tier: effectiveTier,
    // Tier booleans
    isTrialTier: effectiveTier === 'trial',
    isCoreTier: effectiveTier === 'core',
    isMultiTier: effectiveTier === 'multi',
    isEnterpriseTier: effectiveTier === 'enterprise',
    // Trial state
    isTrialExpired,
    trialDaysLeft,
    // Subscription state
    isExpired,
    daysUntilExpiry: isExpired ? null : daysUntilExpiry,
    // Convenience
    needsUpgrade,
    // Limits
    limits: effectiveLimits,
    // Capability flags
    canExport: effectiveLimits.export,
    canAccessApi: effectiveLimits.api_access,
    canUseMarketplace: effectiveLimits.marketplace,
    canUseAutoReorder: effectiveLimits.auto_reorder,
    canUsePOS: effectiveLimits.pos_integration,
    canUseBar: effectiveLimits.bar_module,
    canUseCRM: effectiveLimits.crm,
    canUseWaiterTablet: effectiveLimits.waiter_tablet,
    canUseFinancialReports: effectiveLimits.financial_reports,
    // Legacy aliases (for gradual migration)
    isFreeTier: effectiveTier === 'trial',
    isProTier: effectiveTier === 'core',
  }
}
