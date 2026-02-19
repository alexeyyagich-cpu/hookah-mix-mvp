'use client'

import { useState, Suspense } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { PricingCard } from '@/components/pricing/PricingCard'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'

// Stripe price IDs (from environment)
const STRIPE_PRICES = {
  pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
  pro_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
  enterprise_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY,
  enterprise_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY,
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Для пробного использования',
    features: [
      { name: 'Позиций в инвентаре', value: '20', included: true },
      { name: 'История сессий', value: '30 дней', included: true },
      { name: 'Типов чаш', value: '3', included: true },
      { name: 'Базовая статистика', included: true },
      { name: 'Маркетплейс', included: false },
      { name: 'Управление командой', included: false },
      { name: 'API доступ', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 900,
    priceYearly: 9900,
    stripePriceMonthly: STRIPE_PRICES.pro_monthly,
    stripePriceYearly: STRIPE_PRICES.pro_yearly,
    description: 'Для активных заведений',
    features: [
      { name: 'Позиций в инвентаре', value: '∞', included: true },
      { name: 'История сессий', value: '∞', included: true },
      { name: 'Типов чаш', value: '∞', included: true },
      { name: 'Полная статистика', included: true },
      { name: 'Маркетплейс', included: true },
      { name: 'Экспорт CSV/PDF', included: true },
      { name: 'Email уведомления', included: true },
    ],
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 2900,
    priceYearly: 29900,
    stripePriceMonthly: STRIPE_PRICES.enterprise_monthly,
    stripePriceYearly: STRIPE_PRICES.enterprise_yearly,
    description: 'Для сетей заведений',
    features: [
      { name: 'Всё из Pro', value: '+', included: true },
      { name: 'Неограниченные локации', included: true },
      { name: 'Управление командой', included: true },
      { name: 'Авто-заказ табака', included: true },
      { name: 'API доступ', included: true },
      { name: 'Кастомные интеграции', included: true },
      { name: 'White-label брендинг', included: true },
      { name: 'Приоритетная поддержка 24/7', included: true },
      { name: 'Персональный менеджер', included: true },
    ],
  },
]

function PricingPageContent() {
  const tm = useTranslation('manage')
  const { user } = useAuth()
  const { tier } = useSubscription()
  const searchParams = useSearchParams()
  const [isYearly, setIsYearly] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const canceled = searchParams.get('canceled')

  const formatPrice = (price: number) => {
    if (price === 0) return tm.free
    return `$${(price / 100).toFixed(0)}`
  }

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    // Free plan - just redirect to register or dashboard
    if (plan.id === 'free') {
      if (user) {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/register'
      }
      return
    }

    // Paid plans - need to be logged in
    if (!user) {
      window.location.href = `/register?plan=${plan.id}`
      return
    }

    // Check if Stripe is configured
    const priceId = isYearly ? plan.stripePriceYearly : plan.stripePriceMonthly
    if (!priceId) {
      alert('Stripe не настроен. Добавьте STRIPE_PRICE_* в переменные окружения.')
      return
    }

    setLoadingPlan(plan.id)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          email: user.email,
          isYearly,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      void error
      alert('Ошибка при создании сессии оплаты. Попробуйте позже.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const yearlyDiscount = Math.round((1 - 9900 / (900 * 12)) * 100)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="p-4 border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                <source src="/images/logo-animated.mp4" type="video/mp4" />
              </video>
            </div>
            Hookah Torus
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/mix" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
              Калькулятор
            </Link>
            {user ? (
              <Link href="/dashboard" className="btn btn-primary">
                Личный кабинет
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary">
                Войти
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Canceled message */}
        {canceled && (
          <div className="mb-8 p-4 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-center">
            Оплата была отменена. Выберите тариф, чтобы попробовать снова.
          </div>
        )}

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {tm.pricingSubtitle}
          </h1>
          <p className="text-xl text-[var(--color-textMuted)] max-w-2xl mx-auto">
            Инструменты для учета табака, анализа сессий и оптимизации работы вашего заведения
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              !isYearly
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
            }`}
          >
            Ежемесячно
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
              isYearly
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
            }`}
          >
            Ежегодно
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isYearly ? 'bg-white/20' : 'bg-[var(--color-success)] text-white'
            }`}>
              -{yearlyDiscount}%
            </span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => {
            const price = isYearly ? plan.priceYearly : plan.priceMonthly
            const priceDisplay = price === 0
              ? 'Бесплатно'
              : isYearly
                ? `$${(price / 100).toLocaleString('en-US')}/год`
                : `$${(price / 100).toLocaleString('en-US')}/мес`

            const monthlyEquivalent = isYearly && price > 0
              ? `≈ $${Math.round(price / 12 / 100)}/мес`
              : null

            return (
              <PricingCard
                key={plan.id}
                name={plan.name}
                price={priceDisplay}
                monthlyPrice={monthlyEquivalent}
                description={plan.description}
                features={plan.features}
                isPopular={plan.isPopular}
                isCurrent={tier === plan.id}
                isLoading={loadingPlan === plan.id}
                onSelect={() => handleSelectPlan(plan)}
                buttonText={
                  tier === plan.id
                    ? tm.currentPlan
                    : price === 0
                      ? 'Начать бесплатно'
                      : 'Подключить'
                }
              />
            )
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Часто задаваемые вопросы</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                q: 'Могу ли я отменить подписку?',
                a: 'Да, вы можете отменить подписку в любой момент из личного кабинета. Доступ сохранится до конца оплаченного периода.',
              },
              {
                q: 'Какие способы оплаты доступны?',
                a: 'Мы принимаем банковские карты (Visa, Mastercard, American Express) через безопасную платежную систему Stripe.',
              },
              {
                q: 'Есть ли пробный период для Pro?',
                a: 'Да, для новых пользователей доступен 14-дневный пробный период Pro без ограничений и без карты.',
              },
              {
                q: 'Могу ли я перейти на другой тариф?',
                a: 'Да, вы можете повысить или понизить тариф в любой момент через личный кабинет.',
              },
              {
                q: 'Что будет с моими данными при понижении тарифа?',
                a: 'Ваши данные сохранятся, но доступ к некоторым функциям будет ограничен согласно выбранному тарифу.',
              },
              {
                q: 'Возможен ли возврат средств?',
                a: 'Да, в течение 14 дней после оплаты вы можете запросить полный возврат средств.',
              },
            ].map((faq, index) => (
              <div key={index} className="card p-5">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-[var(--color-textMuted)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-[var(--color-textMuted)] mb-4">
            Есть вопросы? Напишите нам
          </p>
          <a
            href="mailto:support@hookah-torus.com"
            className="text-[var(--color-primary)] hover:underline"
          >
            support@hookah-torus.com
          </a>
        </div>
      </main>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  )
}
