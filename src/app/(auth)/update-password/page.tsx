'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { useTranslation } from '@/lib/i18n'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => { return () => clearTimeout(redirectTimerRef.current) }, [])
  const [success, setSuccess] = useState(false)
  const { updatePassword } = useAuth()
  const router = useRouter()
  const t = useTranslation('auth')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError(t.passwordTooShort)
      return
    }

    if (password !== confirmPassword) {
      setError(t.passwordMismatch)
      return
    }

    setLoading(true)

    const { error: updateError } = await updatePassword(password)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    redirectTimerRef.current = setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg shadow-[var(--color-primary)]/20">
          <video autoPlay loop muted playsInline preload="metadata" poster="/images/torus-logo.png" className="w-full h-full object-cover">
            <source src="/images/logo-animated.mp4" type="video/mp4" />
          </video>
        </div>
        <h1 className="text-3xl font-bold mb-2">{t.newPasswordTitle}</h1>
        <p className="text-[var(--color-textMuted)]">
          {t.newPasswordSubtitle}
        </p>
      </div>

      {success ? (
        <div className="card p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
            <span className="text-3xl text-[var(--color-success)]">✓</span>
          </div>
          <h2 className="text-xl font-semibold">{t.passwordUpdated}</h2>
          <p className="text-[var(--color-textMuted)]">
            {t.redirecting}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)]">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              {t.newPassword}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              placeholder={t.passwordPlaceholder}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              {t.confirmPassword}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              placeholder={t.repeatPasswordPlaceholder}
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
              t.setPassword
            )}
          </button>

          <p className="text-center text-[var(--color-textMuted)]">
            <Link href="/login" className="text-[var(--color-primary)] hover:underline">
              {t.backToLogin}
            </Link>
          </p>
        </form>
      )}
    </div>
  )
}
