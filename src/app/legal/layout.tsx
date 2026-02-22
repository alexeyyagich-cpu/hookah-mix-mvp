'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tc = useTranslation('common')

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--color-bg)]/80 border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <video autoPlay loop muted playsInline preload="metadata" poster="/images/torus-logo.png" className="w-full h-full object-cover">
                <source src="/images/logo-animated.mp4" type="video/mp4" />
              </video>
            </div>
            <span className="text-lg font-bold">Hookah Torus</span>
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link href="/legal/terms" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
              {tc.legalTerms}
            </Link>
            <Link href="/legal/privacy" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
              {tc.legalPrivacy}
            </Link>
            <Link href="/legal/impressum" className="text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
              {tc.legalImpressum}
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {children}
      </main>

      <footer className="border-t border-[var(--color-border)] py-8 px-4 text-center text-sm text-[var(--color-textMuted)]">
        <p>&copy; {new Date().getFullYear()} Hookah Torus. {tc.legalAllRights}</p>
      </footer>
    </div>
  )
}
