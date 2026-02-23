'use client'

import { useState, Suspense } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { PricingCard } from '@/components/pricing/PricingCard'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'

// Stripe price IDs (from environment)
const STRIPE_PRICES = {
  pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
  pro_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
  enterprise_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY,
  enterprise_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY,
}

// Plans are built inside component to use i18n keys
const PLAN_CONFIG = {
  free: { priceMonthly: 0, priceYearly: 0 },
  pro: {
    priceMonthly: 2900,
    priceYearly: 27900,
    stripePriceMonthly: STRIPE_PRICES.pro_monthly,
    stripePriceYearly: STRIPE_PRICES.pro_yearly,
    isPopular: true,
  },
  enterprise: {
    priceMonthly: 8900,
    priceYearly: 85900,
    stripePriceMonthly: STRIPE_PRICES.enterprise_monthly,
    stripePriceYearly: STRIPE_PRICES.enterprise_yearly,
  },
}

function PricingPageContent() {
  const tm = useTranslation('manage')
  const ta = useTranslation('auth')
  const { user } = useAuth()

  const plans = [
    {
      id: 'free',
      name: 'Free',
      priceMonthly: PLAN_CONFIG.free.priceMonthly,
      priceYearly: PLAN_CONFIG.free.priceYearly,
      description: ta.planDescFree,
      features: [
        { name: ta.featureInventoryItems, value: '10', included: true },
        { name: ta.featureSessionHistory, value: ta.featureSessionDays('14'), included: true },
        { name: ta.featureBowlTypes, value: '3', included: true },
        { name: ta.featureBasicStats, included: true },
        { name: ta.featureBarModule, included: true },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      priceMonthly: PLAN_CONFIG.pro.priceMonthly,
      priceYearly: PLAN_CONFIG.pro.priceYearly,
      stripePriceMonthly: PLAN_CONFIG.pro.stripePriceMonthly,
      stripePriceYearly: PLAN_CONFIG.pro.stripePriceYearly,
      description: ta.planDescPro,
      features: [
        { name: ta.featureInventoryItems, value: '\u221E', included: true },
        { name: ta.featureSessionHistory, value: '\u221E', included: true },
        { name: ta.featureBowlTypes, value: '\u221E', included: true },
        { name: ta.featureFullStats, included: true },
        { name: ta.featureBarModule, included: true },
        { name: ta.featureCocktailRecipes, included: true },
        { name: ta.featureKds, included: true },
        { name: ta.featureTeamManagement, included: true },
        { name: ta.featureExportCsvPdf, included: true },
        { name: ta.featureEmailNotifications, included: true },
      ],
      isPopular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      priceMonthly: PLAN_CONFIG.enterprise.priceMonthly,
      priceYearly: PLAN_CONFIG.enterprise.priceYearly,
      stripePriceMonthly: PLAN_CONFIG.enterprise.stripePriceMonthly,
      stripePriceYearly: PLAN_CONFIG.enterprise.stripePriceYearly,
      description: ta.planDescEnterprise,
      features: [
        { name: ta.featureAllFromPro, value: '+', included: true },
        { name: ta.featureWaiterTablet, included: true },
        { name: ta.featureGuestCrm, included: true },
        { name: ta.featureFinancialReports, included: true },
        { name: ta.featureShiftManagement, included: true },
        { name: ta.featureUnlimitedLocations, included: true },
        { name: ta.featureApiAccess, included: true },
        { name: ta.featurePrioritySupport, included: true },
      ],
    },
  ]
  const { tier } = useSubscription()
  const searchParams = useSearchParams()
  const [isYearly, setIsYearly] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const canceled = searchParams.get('canceled')

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
      alert(ta.stripeNotConfigured)
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
      alert(ta.paymentError)
    } finally {
      setLoadingPlan(null)
    }
  }

  const yearlyDiscount = Math.round((1 - 27900 / (2900 * 12)) * 100)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="p-4 border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <video autoPlay loop muted playsInline preload="metadata" poster="/images/torus-logo.png" className="w-full h-full object-cover">
                <source src="/images/logo-animated.mp4" type="video/mp4" />
              </video>
            </div>
            Hookah Torus
          </Link>
          <div className="flex items-center gap-4">
            <LocaleSwitcher />
            <Link href="/mix" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
              {ta.navCalculator}
            </Link>
            {user ? (
              <Link href="/dashboard" className="btn btn-primary">
                {ta.dashboard}
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary">
                {ta.signIn}
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
            {ta.paymentCanceled}
          </div>
        )}

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {tm.pricingSubtitle}
          </h1>
          <p className="text-xl text-[var(--color-textMuted)] max-w-2xl mx-auto">
            {ta.pricingHeroSubtitle}
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
            {ta.billingMonthly}
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
              isYearly
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
            }`}
          >
            {ta.billingYearly}
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
              ? ta.priceFree
              : isYearly
                ? ta.pricePerYear(`${(price / 100).toFixed(0)}\u20AC`)
                : ta.pricePerMonth(`${(price / 100).toFixed(0)}\u20AC`)

            const monthlyEquivalent = isYearly && price > 0
              ? ta.priceMonthlyEquiv(`${Math.round(price / 12 / 100)}\u20AC`)
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
                      ? ta.startFree
                      : ta.subscribe
                }
              />
            )
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">{ta.faqTitle}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { q: ta.faqQ1, a: ta.faqA1 },
              { q: ta.faqQ2, a: ta.faqA2 },
              { q: ta.faqQ3, a: ta.faqA3 },
              { q: ta.faqQ4, a: ta.faqA4 },
              { q: ta.faqQ5, a: ta.faqA5 },
              { q: ta.faqQ6, a: ta.faqA6 },
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
            {ta.contactCta}
          </p>
          <a
            href="mailto:htorus@hookahtorus.com"
            className="text-[var(--color-primary)] hover:underline"
          >
            htorus@hookahtorus.com
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
