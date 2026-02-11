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
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
  enterprise_yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY!,
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
    nameRu: 'Бесплатный',
    price: 0,
    priceYearly: 0,
    features: [
      '10 позиций в инвентаре',
      '1 тип чаши',
      'История за 30 дней',
      'Базовая статистика',
    ],
    featuresRu: [
      '10 позиций в инвентаре',
      '1 тип чаши',
      'История за 30 дней',
      'Базовая статистика',
    ],
  },
  pro: {
    name: 'Pro',
    nameRu: 'Pro',
    price: 990, // рублей в месяц
    priceYearly: 9900, // рублей в год (скидка ~17%)
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
      'Безлимитный инвентарь',
      'Любое количество чаш',
      'Полная история',
      'Расширенная статистика',
      'Доступ к маркетплейсу',
      'Управление командой',
      'Экспорт данных',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    nameRu: 'Enterprise',
    price: 2990, // рублей в месяц
    priceYearly: 29900, // рублей в год
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
      'Всё из Pro',
      'Авто-заказ табака',
      'API доступ',
      'Приоритетная поддержка',
      'Кастомные интеграции',
      'White-label опции',
    ],
  },
} as const

export type PlanType = keyof typeof PLANS
