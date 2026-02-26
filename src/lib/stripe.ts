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
  pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
  pro_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || '',
  enterprise_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
  enterprise_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY || '',
}

// Subscription tier mapping
export const PRICE_TO_TIER: Record<string, 'pro' | 'enterprise'> = {
  [STRIPE_PRICES.pro_monthly]: 'pro',
  [STRIPE_PRICES.pro_yearly]: 'pro',
  [STRIPE_PRICES.enterprise_monthly]: 'enterprise',
  [STRIPE_PRICES.enterprise_yearly]: 'enterprise',
}

// Plan details (prices in EUR cents, matching pricing page)
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceYearly: 0,
  },
  pro: {
    name: 'Pro',
    price: 900, // EUR cents per month (9 EUR)
    priceYearly: 9900, // EUR cents per year (99 EUR)
    stripePriceMonthly: STRIPE_PRICES.pro_monthly,
    stripePriceYearly: STRIPE_PRICES.pro_yearly,
  },
  enterprise: {
    name: 'Enterprise',
    price: 2900, // EUR cents per month (29 EUR)
    priceYearly: 29900, // EUR cents per year (299 EUR)
    stripePriceMonthly: STRIPE_PRICES.enterprise_monthly,
    stripePriceYearly: STRIPE_PRICES.enterprise_yearly,
  },
} as const

export type PlanType = keyof typeof PLANS
