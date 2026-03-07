'use client'

import Link from 'next/link'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { useTranslation } from '@/lib/i18n'

const TIERS = [
  { plan: 'Core', price: 79, commission: 15.8, total24: 379 },
  { plan: 'Multi', price: 149, commission: 29.8, total24: 715 },
  { plan: 'Enterprise', price: 299, commission: 59.8, total24: 1435 },
]

export default function PartnerPage() {
  const t = useTranslation('partner')

  const steps = [
    { num: '1', title: t.step1Title, desc: t.step1Desc },
    { num: '2', title: t.step2Title, desc: t.step2Desc },
    { num: '3', title: t.step3Title, desc: t.step3Desc },
  ]

  const benefits = [
    { title: t.benefit1Title, desc: t.benefit1Desc },
    { title: t.benefit2Title, desc: t.benefit2Desc },
    { title: t.benefit3Title, desc: t.benefit3Desc },
    { title: t.benefit4Title, desc: t.benefit4Desc },
  ]

  const faq = [
    { q: t.faq1q, a: t.faq1a },
    { q: t.faq2q, a: t.faq2a },
    { q: t.faq3q, a: t.faq3a },
    { q: t.faq4q, a: t.faq4a },
    { q: t.faq5q, a: t.faq5a },
  ]

  return (
    <ErrorBoundary sectionName="Partner">
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
            <div className="flex items-center gap-3">
              <LocaleSwitcher />
              <a href="#apply" className="btn btn-primary text-sm px-4 py-2">
                {t.cta}
              </a>
            </div>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-success)]/10 via-transparent to-[var(--color-primary)]/10" />
            <div className="max-w-4xl mx-auto px-4 py-20 md:py-32 relative text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                {t.badge}
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                {t.heroTitle1}
                <span className="text-[var(--color-success)]">{t.heroTitle2}</span>
              </h1>

              <p className="text-xl text-[var(--color-textMuted)] mb-8 max-w-2xl mx-auto">
                {t.heroSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="#apply" className="btn btn-primary btn-lg text-lg px-8">
                  {t.applyBtn}
                </a>
                <a href="#how" className="btn btn-secondary btn-lg text-lg px-8">
                  {t.howBtn}
                </a>
              </div>
            </div>
          </section>

          {/* Commission Calculator */}
          <section className="py-16 px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                {t.calcTitle1}<span className="text-[var(--color-success)]">{t.calcTitle2}</span>
              </h2>
              <p className="text-center text-[var(--color-textMuted)] mb-12 max-w-2xl mx-auto">
                {t.calcSubtitle}
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {TIERS.map((tier) => (
                  <div key={tier.plan} className="card p-6 text-center">
                    <p className="text-sm font-medium text-[var(--color-textMuted)] mb-1">
                      {t.planLabel(tier.plan)}
                    </p>
                    <p className="text-lg mb-4" style={{ color: 'var(--color-text)' }}>
                      &euro;{tier.price}{t.perMonth}
                    </p>
                    <div className="py-4 border-t border-b border-[var(--color-border)]">
                      <p className="text-3xl font-bold text-[var(--color-success)]">
                        &euro;{tier.commission.toFixed(1)}
                      </p>
                      <p className="text-sm text-[var(--color-textMuted)]">{t.perVenue}</p>
                    </div>
                    <div className="mt-4">
                      <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                        &euro;{tier.total24}
                      </p>
                      <p className="text-sm text-[var(--color-textMuted)]">{t.over24}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 card p-6 text-center bg-[var(--color-surface)]">
                <p className="text-[var(--color-textMuted)] mb-2">
                  {t.exampleIntro(10)}
                </p>
                <p className="text-4xl font-bold text-[var(--color-success)]">&euro;3&thinsp;790</p>
                <p className="text-[var(--color-textMuted)]">{t.exampleTotal}</p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section id="how" className="py-20 px-4 bg-[var(--color-surface)]">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
                {t.stepsTitle1}<span className="text-[var(--color-primary)]">{t.stepsTitle2}</span>
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                {steps.map((s) => (
                  <div key={s.num} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-2xl font-bold text-[var(--color-bg)]">
                      {s.num}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                    <p className="text-[var(--color-textMuted)]">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Benefits */}
          <section className="py-20 px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
                {t.benefitsTitle1}<span className="text-[var(--color-success)]">{t.benefitsTitle2}</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {benefits.map((b) => (
                  <div key={b.title} className="card p-6">
                    <h3 className="text-lg font-semibold mb-2">{b.title}</h3>
                    <p className="text-[var(--color-textMuted)]">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-20 px-4 bg-[var(--color-surface)]">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                {t.faqTitle}
              </h2>

              <div className="space-y-4">
                {faq.map((f) => (
                  <div key={f.q} className="card p-5">
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{f.q}</h3>
                    <p className="text-[var(--color-textMuted)]">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA / Apply */}
          <section id="apply" className="py-20 px-4 bg-gradient-to-br from-[var(--color-success)]/10 to-[var(--color-primary)]/10">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t.ctaTitle}
              </h2>
              <p className="text-xl text-[var(--color-textMuted)] mb-8">
                {t.ctaSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://t.me/hookahtorus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-lg text-lg px-8"
                >
                  {t.ctaTelegram}
                </a>
                <a
                  href="mailto:partner@hookahtorus.com"
                  className="btn btn-secondary btn-lg text-lg px-8"
                >
                  {t.ctaEmail}
                </a>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-[var(--color-textMuted)]">
                <span className="flex items-center gap-2">
                  <span className="text-[var(--color-success)]">&#10003;</span> {t.ctaFree}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[var(--color-success)]">&#10003;</span> {t.ctaDashboard}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[var(--color-success)]">&#10003;</span> {t.ctaMonthly}
                </span>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-[var(--color-border)]">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-[var(--color-textMuted)]">
              {t.copyright(new Date().getFullYear())}
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
