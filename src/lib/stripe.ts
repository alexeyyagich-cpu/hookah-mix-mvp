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
// Create products in Stripe, add price IDs to Vercel env vars
export const STRIPE_PRICES = {
  core_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_CORE_MONTHLY || '',
  core_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_CORE_YEARLY || '',
  multi_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MULTI_MONTHLY || '',
  multi_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MULTI_YEARLY || '',
}

// Subscription tier mapping (price ID → tier name)
export const PRICE_TO_TIER: Record<string, 'core' | 'multi'> = {
  [STRIPE_PRICES.core_monthly]: 'core',
  [STRIPE_PRICES.core_yearly]: 'core',
  [STRIPE_PRICES.multi_monthly]: 'multi',
  [STRIPE_PRICES.multi_yearly]: 'multi',
}

// Plan details (prices in EUR cents)
// Enterprise is contact-sales only — no Stripe checkout
export const PLANS = {
  trial: {
    name: 'Trial',
    price: 0,
    priceYearly: 0,
  },
  core: {
    name: 'Core',
    price: 7900, // €79/mo
    priceYearly: 79000, // €790/yr
    stripePriceMonthly: STRIPE_PRICES.core_monthly,
    stripePriceYearly: STRIPE_PRICES.core_yearly,
  },
  multi: {
    name: 'Multi',
    price: 14900, // €149/mo
    priceYearly: 149000, // €1,490/yr
    stripePriceMonthly: STRIPE_PRICES.multi_monthly,
    stripePriceYearly: STRIPE_PRICES.multi_yearly,
  },
  enterprise: {
    name: 'Enterprise',
    price: 29900, // from €299/mo — contact sales
    priceYearly: 0, // custom pricing
  },
} as const

export type PlanType = keyof typeof PLANS
