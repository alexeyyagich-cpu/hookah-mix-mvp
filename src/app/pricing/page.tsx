'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { PricingCard } from '@/components/pricing/PricingCard'
import { CheckoutConfirmModal } from '@/components/pricing/CheckoutConfirmModal'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Stripe price IDs (from environment)
const STRIPE_PRICES = {
  core_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_CORE_MONTHLY,
  core_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_CORE_YEARLY,
  pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
  pro_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
  multi_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MULTI_MONTHLY,
  multi_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MULTI_YEARLY,
}

function PricingPageContent() {
  const tm = useTranslation('manage')
  const ta = useTranslation('auth')
  const { user } = useAuth()

  const plans = [
    {
      id: 'core' as const,
      name: 'Core',
      priceMonthly: 9900,
      priceYearly: 99000,
      stripePriceMonthly: STRIPE_PRICES.core_monthly,
      stripePriceYearly: STRIPE_PRICES.core_yearly,
      description: ta.planDescCore,
      features: [
        { name: ta.benefitAutoWriteOff, included: true },
        { name: ta.benefitSaveBudget, included: true },
        { name: ta.benefitTelegramPL, included: true },
        { name: ta.benefitQrOrder, included: true },
        { name: ta.featureTeamManagement, included: true },
        { name: ta.featureExportCsvPdf, included: true },
        { name: ta.benefitOffline, included: true },
      ],
      savingsBadge: ta.roiCoreHint,
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      priceMonthly: 12900,
      priceYearly: 129000,
      stripePriceMonthly: STRIPE_PRICES.pro_monthly,
      stripePriceYearly: STRIPE_PRICES.pro_yearly,
      description: ta.planDescPro,
      features: [
        { name: ta.featureAllFromCore, value: '+', included: true },
        { name: ta.benefitCrmLoyalty, included: true },
        { name: ta.benefitBarModule, included: true },
        { name: ta.benefitPromo, included: true },
        { name: ta.featureWaiterTablet, included: true },
        { name: ta.featureFinancialReports, included: true },
        { name: ta.benefitGuestSegments, included: true },
        { name: ta.benefitAdvancedStats, included: true },
      ],
      isPopular: true,
      savingsBadge: ta.roiProBadge,
      highlight: true,
      accentMint: true,
    },
    {
      id: 'multi' as const,
      name: 'Multi',
      priceMonthly: 18900,
      priceYearly: 179000,
      stripePriceMonthly: STRIPE_PRICES.multi_monthly,
      stripePriceYearly: STRIPE_PRICES.multi_yearly,
      description: ta.planDescMulti,
      features: [
        { name: ta.featureAllFromPro, value: '+', included: true },
        { name: ta.benefitMultiLoc, included: true },
        { name: ta.benefitShifts, included: true },
        { name: ta.benefitApi, included: true },
        { name: ta.featureAutoOrder, included: true },
      ],
      savingsBadge: ta.roiMultiBadge,
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise',
      priceMonthly: 34900,
      priceYearly: 0,
      description: ta.planDescEnterprise,
      features: [
        { name: ta.featureAllFromMulti, value: '+', included: true },
        { name: ta.featureCustomIntegrations, included: true },
        { name: ta.featurePrioritySupport, included: true },
        { name: ta.featureSla, included: true },
        { name: ta.featureOnboarding, included: true },
      ],
      isEnterprise: true,
    },
  ]
  const { tier } = useSubscription()
  const searchParams = useSearchParams()
  const [isYearly, setIsYearly] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkoutPlan, setCheckoutPlan] = useState<typeof plans[0] | null>(null)

  const showError = useCallback((message: string) => {
    setError(message)
  }, [])

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(timer)
  }, [error])

  const canceled = searchParams.get('canceled')

  const handleSelectPlan = (plan: typeof plans[0]) => {
    // Enterprise - contact sales
    if (plan.id === 'enterprise') {
      window.location.href = 'mailto:htorus@hookahtorus.com?subject=Enterprise%20Plan'
      return
    }

    // Paid plans - need to be logged in
    if (!user) {
      window.location.href = `/register?plan=${plan.id}`
      return
    }

    // Check if Stripe is configured
    const priceId = isYearly
      ? ('stripePriceYearly' in plan ? plan.stripePriceYearly : undefined)
      : ('stripePriceMonthly' in plan ? plan.stripePriceMonthly : undefined)
    if (!priceId) {
      showError(ta.stripeNotConfigured)
      return
    }

    // Show confirmation modal before Stripe checkout
    setCheckoutPlan(plan)
  }

  const handleConfirmCheckout = async () => {
    if (!checkoutPlan || !user) return

    const priceId = isYearly
      ? ('stripePriceYearly' in checkoutPlan ? checkoutPlan.stripePriceYearly : undefined)
      : ('stripePriceMonthly' in checkoutPlan ? checkoutPlan.stripePriceMonthly : undefined)
    if (!priceId) return

    setLoadingPlan(checkoutPlan.id)

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

      if (data.url && typeof data.url === 'string' && data.url.startsWith('https://')) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ta.paymentError
      showError(msg)
    } finally {
      setLoadingPlan(null)
      setCheckoutPlan(null)
    }
  }

  const yearlyDiscount = 17

  const getButtonText = (plan: typeof plans[0]) => {
    if (tier === plan.id) return tm.currentPlan
    switch (plan.id) {
      case 'core': return ta.tryFree14
      case 'pro': return ta.bookDemo
      case 'multi': return ta.requestConnect
      case 'enterprise': return ta.contactSales
      default: return ta.subscribe
    }
  }

  return (
    <ErrorBoundary sectionName="Pricing">
    <div className="min-h-screen">
      {/* Header */}
      <header className="p-4 border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <video autoPlay loop muted playsInline preload="none" poster="/images/torus-logo.png" className="w-full h-full object-cover">
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
      <main className="max-w-7xl mx-auto px-4 py-16">
        {/* Canceled message */}
        {canceled && (
          <div className="mb-8 p-4 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-center">
            {ta.paymentCanceled}
          </div>
        )}

        {/* Trial trust badge */}
        <div className="text-center mb-4">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] text-sm font-medium">
            {ta.pricingTrialBadge}
          </span>
        </div>

        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {tm.pricingSubtitle}
          </h1>
          <p className="text-xl text-[var(--color-textMuted)] max-w-2xl mx-auto whitespace-pre-line">
            {ta.pricingHeroSubtitle}
          </p>
        </div>

        {/* ROI quote */}
        <div className="mb-10 text-center">
          <p className="text-sm italic text-[var(--color-textMuted)] max-w-lg mx-auto">
            {ta.roiBanner}
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            type="button"
            onClick={() => setIsYearly(false)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              !isYearly
                ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
            }`}
          >
            {ta.billingMonthly}
          </button>
          <button
            type="button"
            onClick={() => setIsYearly(true)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
              isYearly
                ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
            }`}
          >
            {ta.billingYearly}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isYearly ? 'bg-white/20' : 'bg-[var(--color-success)] text-white'
            }`}>
              -{yearlyDiscount}% ({ta.yearlySavingsHint})
            </span>
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-center text-sm">
            {error}
          </div>
        )}

        {/* Pricing Cards — 4 plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16 items-start">
          {plans.map((plan) => {
            const isEnterprise = 'isEnterprise' in plan && plan.isEnterprise
            const price = plan.priceYearly === 0 && plan.priceMonthly > 0
              ? plan.priceMonthly
              : isYearly ? plan.priceYearly : plan.priceMonthly
            const priceDisplay = isEnterprise
              ? ta.priceFrom(`${(price / 100).toFixed(0)}\u20AC`)
              : isYearly
                ? ta.pricePerYear(`${(price / 100).toFixed(0)}\u20AC`)
                : ta.pricePerMonth(`${(price / 100).toFixed(0)}\u20AC`)

            const monthlyEquivalent = isYearly && price > 0 && !isEnterprise
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
                isPopular={'isPopular' in plan && plan.isPopular}
                highlight={'highlight' in plan && plan.highlight}
                accentMint={'accentMint' in plan && plan.accentMint}
                isCurrent={tier === plan.id}
                isLoading={loadingPlan === plan.id}
                onSelect={() => handleSelectPlan(plan)}
                savingsBadge={'savingsBadge' in plan ? plan.savingsBadge : null}
                buttonText={getButtonText(plan)}
              />
            )
          })}
        </div>

        {/* Trial gradient banner */}
        <div className="mb-16">
          <div className="relative overflow-hidden rounded-2xl p-8 text-center bg-gradient-to-r from-[#00E6B4]/15 via-[var(--color-primary)]/10 to-purple-500/10 border border-[#00E6B4]/20">
            <h3 className="text-xl font-bold mb-2">{ta.trialBannerTitle}</h3>
            <p className="text-[var(--color-textMuted)] mb-5 max-w-xl mx-auto">{ta.trialBannerSubtitle}</p>
            <Link
              href={user ? '/dashboard' : '/register'}
              className="btn btn-primary inline-flex items-center gap-2 px-8"
            >
              {ta.trialBannerButton}
            </Link>
          </div>
        </div>

        {/* Support note */}
        <div className="mb-16 text-center">
          <p className="text-sm text-[var(--color-textMuted)]">{ta.supportNote}</p>
        </div>

        {/* FAQ */}
        <div className="max-w-5xl mx-auto mb-16">
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

        {/* "Not sure which plan?" CTA */}
        <div className="mb-16">
          <div className="card p-8 text-center">
            <h3 className="text-xl font-bold mb-2">{ta.helpChooseTitle}</h3>
            <p className="text-[var(--color-textMuted)] mb-5">{ta.helpChooseSubtitle}</p>
            <a
              href="mailto:htorus@hookahtorus.com?subject=Help%20Choose%20Plan"
              className="btn btn-primary inline-flex items-center gap-2 px-8"
            >
              {ta.helpChooseButton}
            </a>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center">
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

      {/* Checkout confirmation modal (German law: BGB §312j) */}
      {checkoutPlan && (
        <CheckoutConfirmModal
          open={!!checkoutPlan}
          planName={checkoutPlan.name}
          price={
            isYearly
              ? ta.pricePerYear(`${((checkoutPlan.priceYearly || 0) / 100).toFixed(0)}\u20AC`)
              : ta.pricePerMonth(`${((checkoutPlan.priceMonthly || 0) / 100).toFixed(0)}\u20AC`)
          }
          billingPeriod={isYearly ? ta.billingYearly : ta.billingMonthly}
          isLoading={loadingPlan === checkoutPlan.id}
          onConfirm={handleConfirmCheckout}
          onCancel={() => setCheckoutPlan(null)}
        />
      )}
    </div>
    </ErrorBoundary>
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
