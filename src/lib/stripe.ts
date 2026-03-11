import Stripe from 'stripe'

// Initialize Stripe (only if key is available)
// During build time, this may be undefined
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    })
  : (null as unknown as Stripe) // Type assertion for build time

// Price IDs from Stripe Dashboard
// Create products in Stripe, add price IDs to Vercel env vars
export const STRIPE_PRICES = {
  core_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_CORE_MONTHLY || '',
  core_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_CORE_YEARLY || '',
  pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
  pro_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || '',
  multi_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MULTI_MONTHLY || '',
  multi_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MULTI_YEARLY || '',
}

// Subscription tier mapping (price ID → tier name)
export const PRICE_TO_TIER: Record<string, 'core' | 'pro' | 'multi'> = {
  [STRIPE_PRICES.core_monthly]: 'core',
  [STRIPE_PRICES.core_yearly]: 'core',
  [STRIPE_PRICES.pro_monthly]: 'pro',
  [STRIPE_PRICES.pro_yearly]: 'pro',
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
    price: 9900, // €99/mo
    priceYearly: 99000, // €990/yr (~2 months free)
    stripePriceMonthly: STRIPE_PRICES.core_monthly,
    stripePriceYearly: STRIPE_PRICES.core_yearly,
  },
  pro: {
    name: 'Pro',
    price: 12900, // €129/mo
    priceYearly: 129000, // €1,290/yr (~2 months free)
    stripePriceMonthly: STRIPE_PRICES.pro_monthly,
    stripePriceYearly: STRIPE_PRICES.pro_yearly,
  },
  multi: {
    name: 'Multi',
    price: 18900, // €189/mo
    priceYearly: 179000, // €1,790/yr (~2 months free)
    stripePriceMonthly: STRIPE_PRICES.multi_monthly,
    stripePriceYearly: STRIPE_PRICES.multi_yearly,
  },
  enterprise: {
    name: 'Enterprise',
    price: 34900, // from €349/mo — contact sales
    priceYearly: 0, // custom pricing
  },
} as const

export type PlanType = keyof typeof PLANS
