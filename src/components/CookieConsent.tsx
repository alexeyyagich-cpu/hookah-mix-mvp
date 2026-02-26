'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'
import Link from 'next/link'

const COOKIE_CONSENT_KEY = 'cookie-consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const tc = useTranslation('common')

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
      if (!consent) {
        setVisible(true)
      }
    } catch { /* Safari private browsing */ }
  }, [])

  const accept = () => {
    try { localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted') } catch { /* Safari private browsing */ }
    setVisible(false)
  }

  const decline = () => {
    try { localStorage.setItem(COOKIE_CONSENT_KEY, 'declined') } catch { /* Safari private browsing */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6">
      <div className="max-w-lg mx-auto bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
        <p className="text-sm text-[var(--color-text)]">
          {tc.cookieText}{' '}
          <Link href="/legal/privacy" className="text-[var(--color-primary)] underline">
            {tc.privacyPolicy}
          </Link>
        </p>
        <div className="flex gap-3 justify-end">
          <button type="button"
            onClick={decline}
            className="px-4 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)] transition-colors"
          >
            {tc.decline}
          </button>
          <button type="button"
            onClick={accept}
            className="px-4 py-2 text-sm rounded-xl bg-[var(--color-primary)] text-black font-medium hover:opacity-90 transition-opacity"
          >
            {tc.accept}
          </button>
        </div>
      </div>
    </div>
  )
}
