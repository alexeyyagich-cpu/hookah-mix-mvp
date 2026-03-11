'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/AuthContext'
import { logConsent } from '@/lib/consent'

interface ReconsentModalProps {
  open: boolean
  onAccept: () => void
}

export function ReconsentModal({ open, onAccept }: ReconsentModalProps) {
  const tc = useTranslation('common')
  const { signOut } = useAuth()
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleAccept = async () => {
    setLoading(true)
    await Promise.all([
      logConsent('terms'),
      logConsent('privacy'),
    ])
    setLoading(false)
    onAccept()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold">{tc.reconsentTitle}</h2>
        <p className="text-[var(--color-textMuted)]">{tc.reconsentMessage}</p>
        <div className="flex flex-col gap-2 text-sm">
          <Link href="/legal/terms" target="_blank" className="text-[var(--color-primary)] hover:underline">
            {tc.legalTerms} →
          </Link>
          <Link href="/legal/privacy" target="_blank" className="text-[var(--color-primary)] hover:underline">
            {tc.legalPrivacy} →
          </Link>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => signOut()}
            className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)] transition-colors"
          >
            {tc.reconsentRefuse}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-[var(--color-primary)] text-[var(--color-bg)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? tc.loading : tc.reconsentAccept}
          </button>
        </div>
      </div>
    </div>
  )
}
