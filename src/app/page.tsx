'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/AuthContext'
import { useTranslation } from '@/lib/i18n'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import {
  IconSmoke,
  IconStar,
  IconTarget,
  IconCalendar,
  IconTrendUp,
  IconInventory,
  IconBar,
  IconCocktail,
  IconWaiter,
} from '@/components/Icons'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function LandingPage() {
  const { user } = useAuth()
  const t = useTranslation('auth')

  const features = [
    {
      icon: IconInventory,
      title: t.feature1Title,
      description: t.feature1Desc,
    },
    {
      icon: IconSmoke,
      title: t.feature2Title,
      description: t.feature2Desc,
    },
    {
      icon: IconTrendUp,
      title: t.feature3Title,
      description: t.feature3Desc,
    },
    {
      icon: IconCalendar,
      title: t.feature4Title,
      description: t.feature4Desc,
    },
    {
      icon: IconStar,
      title: t.feature5Title,
      description: t.feature5Desc,
    },
    {
      icon: IconTarget,
      title: t.feature6Title,
      description: t.feature6Desc,
    },
    {
      icon: IconBar,
      title: t.feature7Title,
      description: t.feature7Desc,
    },
    {
      icon: IconCocktail,
      title: t.feature8Title,
      description: t.feature8Desc,
    },
    {
      icon: IconWaiter,
      title: t.feature9Title,
      description: t.feature9Desc,
    },
  ]

  const benefits = [
    {
      stat: t.benefit1Stat,
      label: t.benefit1Label,
      description: t.benefit1Desc,
    },
    {
      stat: t.benefit2Stat,
      label: t.benefit2Label,
      description: t.benefit2Desc,
    },
    {
      stat: t.benefit3Stat,
      label: t.benefit3Label,
      description: t.benefit3Desc,
    },
  ]

  const howItWorks = [
    {
      step: '1',
      title: t.step1Title,
      description: t.step1Desc,
    },
    {
      step: '2',
      title: t.step2Title,
      description: t.step2Desc,
    },
    {
      step: '3',
      title: t.step3Title,
      description: t.step3Desc,
    },
  ]

  return (
    <ErrorBoundary sectionName="Landing">
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--color-bg)]/80 border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden">
              <video autoPlay loop muted playsInline preload="none" poster="/images/torus-logo.png" className="w-full h-full object-cover">
                <source src="/images/logo-animated.mp4" type="video/mp4" />
              </video>
            </div>
            <span className="text-xl font-bold">Hookah Torus</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
              {t.navFeatures}
            </Link>
            <Link href="#benefits" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
              {t.navBenefits}
            </Link>
            <Link href="/pricing" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
              {t.navPricing}
            </Link>
            <Link href="/mix" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
              {t.navCalculator}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            {user ? (
              <Link href="/dashboard" className="btn btn-primary text-sm px-3 py-2 whitespace-nowrap">
                {t.dashboard}
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary text-sm px-3 py-2 whitespace-nowrap">
                  {t.signIn}
                </Link>
                <Link href="/register" className="btn btn-primary text-sm px-3 py-2 whitespace-nowrap">
                  {t.startFree}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 via-transparent to-[var(--color-warning)]/10" />
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
              {t.heroBadge}
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t.heroTitle1}
              <span className="text-[var(--color-primary)]">{t.heroTitle2}</span>
            </h1>

            <p className="text-xl text-[var(--color-textMuted)] mb-8 max-w-2xl mx-auto">
              {t.heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link href="/dashboard" className="btn btn-primary btn-lg text-lg px-8">
                  {t.dashboard}
                </Link>
              ) : (
                <Link href="/register" className="btn btn-primary btn-lg text-lg px-8">
                  {t.heroCta}
                </Link>
              )}
              <Link href="/mix" className="btn btn-secondary btn-lg text-lg px-8">
                {t.heroCtaCalculator}
              </Link>
            </div>

            {!user && (
              <>
                <p className="mt-6 text-sm text-[var(--color-textMuted)]">
                  {t.heroNote}
                </p>
                <Link href="/login?demo=true" className="mt-2 inline-block text-sm text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
                  {t.tryDemo}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid gap-8">
          <div className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-8 bg-[var(--color-surface)] flex items-center gap-2 px-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="pt-8 bg-[var(--color-bg)]" style={{ aspectRatio: '1920/1080' }}>
              <Image
                src="/images/dashboard-preview.jpg"
                alt="Hookah Torus Dashboard"
                width={1920}
                height={1080}
                priority
                className="w-full h-auto"
              />
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-8 bg-[var(--color-surface)] flex items-center gap-2 px-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="pt-8 bg-[var(--color-bg)]" style={{ aspectRatio: '1920/1080' }}>
              <Image
                src="/images/bar-preview.jpg"
                alt="Hookah Torus Bar Management"
                width={1920}
                height={1080}
                loading="lazy"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t.featuresTitle1}<span className="text-[var(--color-primary)]">{t.featuresTitle2}</span>
            </h2>
            <p className="text-xl text-[var(--color-textMuted)] max-w-2xl mx-auto">
              {t.featuresSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card p-6 hover:border-[var(--color-primary)]/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--color-primary)]/20 transition-colors">
                  <feature.icon size={24} className="text-[var(--color-primary)]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-[var(--color-textMuted)]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 px-4 bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t.benefitsTitle}
            </h2>
            <p className="text-xl text-[var(--color-textMuted)]">
              {t.benefitsSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl md:text-6xl font-bold text-[var(--color-primary)] mb-2">
                  {benefit.stat}
                </div>
                <div className="text-xl font-semibold mb-2">{benefit.label}</div>
                <p className="text-[var(--color-textMuted)]">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t.howTitle1}<span className="text-[var(--color-warning)]">{t.howTitle2}</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-2xl font-bold text-black">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-[var(--color-textMuted)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-warning)]/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.ctaTitle}
          </h2>
          <p className="text-xl text-[var(--color-textMuted)] mb-8">
            {t.ctaSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link href="/dashboard" className="btn btn-primary btn-lg text-lg px-8">
                {t.dashboard}
              </Link>
            ) : (
              <Link href="/register" className="btn btn-primary btn-lg text-lg px-8">
                {t.ctaButton}
              </Link>
            )}
            <Link href="/pricing" className="btn btn-secondary btn-lg text-lg px-8">
              {t.ctaComparePlans}
            </Link>
          </div>

          {!user && (
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-[var(--color-textMuted)]">
              <span className="flex items-center gap-2">
                <span className="text-[var(--color-success)]">✓</span> {t.ctaFreeStart}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[var(--color-success)]">✓</span> {t.ctaNoCard}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[var(--color-success)]">✓</span> {t.ctaCancelAnytime}
              </span>
            </div>
          )}
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <video autoPlay loop muted playsInline preload="none" poster="/images/torus-logo.png" className="w-full h-full object-cover">
                    <source src="/images/logo-animated.mp4" type="video/mp4" />
                  </video>
                </div>
                <span className="font-bold">Hookah Torus</span>
              </div>
              <p className="text-sm text-[var(--color-textMuted)]">
                {t.footerDescription}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-base">{t.footerProduct}</h3>
              <ul className="space-y-2 text-sm text-[var(--color-textMuted)]">
                <li><Link href="/mix" className="hover:text-[var(--color-text)]">{t.footerMixCalculator}</Link></li>
                <li><Link href="/mix" className="hover:text-[var(--color-text)]">{t.footerAiRecommendations}</Link></li>
                <li><Link href="/pricing" className="hover:text-[var(--color-text)]">{t.footerPricing}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-base">{t.footerLegal}</h3>
              <ul className="space-y-2 text-sm text-[var(--color-textMuted)]">
                <li><Link href="/legal/terms" className="hover:text-[var(--color-text)]">{t.footerTerms}</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-[var(--color-text)]">{t.footerPrivacy}</Link></li>
                <li><Link href="/legal/impressum" className="hover:text-[var(--color-text)]">{t.footerImpressum}</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--color-border)] text-center">
            <p className="text-sm text-[var(--color-textMuted)]">
              {t.footerCopyright(new Date().getFullYear())}
            </p>
          </div>
        </div>
      </footer>
    </div>
    </ErrorBoundary>
  )
}
