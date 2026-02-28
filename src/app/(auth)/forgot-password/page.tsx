'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { useTranslation } from '@/lib/i18n'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { resetPasswordForEmail } = useAuth()
  const t = useTranslation('auth')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await resetPasswordForEmail(email)

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <ErrorBoundary sectionName="Forgot Password">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg shadow-[var(--color-primary)]/20">
          <video autoPlay loop muted playsInline preload="metadata" poster="/images/torus-logo.png" className="w-full h-full object-cover">
            <source src="/images/logo-animated.mp4" type="video/mp4" />
          </video>
        </div>
        <h1 className="text-3xl font-bold mb-2">{t.forgotTitle}</h1>
        <p className="text-[var(--color-textMuted)]">
          {t.forgotSubtitle}
        </p>
      </div>

      {sent ? (
        <div className="card p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
            <span className="text-3xl text-[var(--color-success)]">✓</span>
          </div>
          <h2 className="text-xl font-semibold">{t.emailSent}</h2>
          <p className="text-[var(--color-textMuted)]">
            {t.checkEmailReset(email)}
          </p>
          <Link href="/login" className="btn btn-secondary inline-block mt-4">
            {t.backToLogin}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)]">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              {t.email}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input transition-colors"
              placeholder={t.placeholderEmail}
              autoComplete="email"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {t.sending}
              </span>
            ) : (
              t.sendLink
            )}
          </button>

          <p className="text-center text-[var(--color-textMuted)]">
            {t.rememberPassword}{' '}
            <Link href="/login" className="text-[var(--color-primary)] hover:underline">
              {t.login}
            </Link>
          </p>
        </form>
      )}
    </div>
    </ErrorBoundary>
  )
}
