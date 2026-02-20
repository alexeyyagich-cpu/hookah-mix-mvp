import Stripe from 'stripe'

// Initialize Stripe (only if key is available)
// During build time, this may be undefined
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  : (null as unknown as Stripe) // Type assertion for build time

// Price IDs from Stripe Dashboard
// These should be created in Stripe and the IDs added to .env
export const STRIPE_PRICES = {
  pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY!,
  pro_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY!,
  enterprise_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY!,
  enterprise_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY!,
} as const

// Subscription tier mapping
export const PRICE_TO_TIER: Record<string, 'pro' | 'enterprise'> = {
  [STRIPE_PRICES.pro_monthly]: 'pro',
  [STRIPE_PRICES.pro_yearly]: 'pro',
  [STRIPE_PRICES.enterprise_monthly]: 'enterprise',
  [STRIPE_PRICES.enterprise_yearly]: 'enterprise',
}

// Plan details for UI
export const PLANS = {
  free: {
    name: 'Free',
    nameRu: 'Free',
    price: 0,
    priceYearly: 0,
    features: [
      '10 inventory items',
      '1 bowl type',
      '30-day history',
      'Basic statistics',
    ],
    featuresRu: [
      '10 inventory items',
      '1 bowl type',
      '30-day history',
      'Basic statistics',
    ],
  },
  pro: {
    name: 'Pro',
    nameRu: 'Pro',
    price: 990, // EUR cents per month (9.90 EUR)
    priceYearly: 9900, // EUR cents per year (99 EUR, ~17% discount)
    stripePriceMonthly: STRIPE_PRICES.pro_monthly,
    stripePriceYearly: STRIPE_PRICES.pro_yearly,
    features: [
      'Unlimited inventory',
      'Unlimited bowl types',
      'Full history',
      'Advanced statistics',
      'Marketplace access',
      'Team management',
      'Export data',
    ],
    featuresRu: [
      'Unlimited inventory',
      'Unlimited bowl types',
      'Full history',
      'Advanced statistics',
      'Marketplace access',
      'Team management',
      'Export data',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    nameRu: 'Enterprise',
    price: 2990, // EUR cents per month (29.90 EUR)
    priceYearly: 29900, // EUR cents per year (299 EUR)
    stripePriceMonthly: STRIPE_PRICES.enterprise_monthly,
    stripePriceYearly: STRIPE_PRICES.enterprise_yearly,
    features: [
      'Everything in Pro',
      'Auto-reorder rules',
      'API access',
      'Priority support',
      'Custom integrations',
      'White-label options',
    ],
    featuresRu: [
      'Everything in Pro',
      'Auto-reorder rules',
      'API access',
      'Priority support',
      'Custom integrations',
      'White-label options',
    ],
  },
} as const

export type PlanType = keyof typeof PLANS
