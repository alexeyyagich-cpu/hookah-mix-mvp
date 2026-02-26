'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { useTranslation } from '@/lib/i18n'

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()
  const t = useTranslation('auth')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t.passwordMismatch)
      return
    }

    if (password.length < 6) {
      setError(t.passwordTooShort)
      return
    }

    setLoading(true)

    const { error: signUpError } = await signUp(email, password, {
      business_name: businessName,
      owner_name: ownerName,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="card p-6 text-center space-y-6" role="status" aria-live="polite">
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">{t.checkEmail}</h2>
          <p className="text-[var(--color-textMuted)]">
            {t.emailSentTo(email)}{' '}
            {t.confirmEmailText}
          </p>
          <Link href="/login" className="btn btn-primary w-full py-4">
            {t.backToLogin}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        {/* Animated Logo */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg shadow-[var(--color-primary)]/20">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster="/images/torus-logo.png"
            className="w-full h-full object-cover"
          >
            <source src="/images/logo-animated.mp4" type="video/mp4" />
          </video>
        </div>
        <h1 className="text-3xl font-bold mb-2">{t.registerTitle}</h1>
        <p className="text-[var(--color-textMuted)]">
          {t.registerSubtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {error && (
          <div role="alert" aria-live="polite" className="p-4 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="businessName" className="block text-sm font-medium">
            {t.businessName}
          </label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="input transition-colors"
            placeholder={t.placeholderBusinessName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ownerName" className="block text-sm font-medium">
            {t.ownerName}
          </label>
          <input
            id="ownerName"
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="input transition-colors"
            placeholder={t.placeholderOwnerName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            {t.email} <span className="text-[var(--color-danger)]">*</span>
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

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">
            {t.password} <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input transition-colors"
            placeholder={t.passwordPlaceholder}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium">
            {t.confirmPassword} <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input transition-colors"
            placeholder={t.repeatPasswordPlaceholder}
            autoComplete="new-password"
            minLength={6}
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
              {t.creatingAccount}
            </span>
          ) : (
            t.createAccount
          )}
        </button>

        <p className="text-center text-[var(--color-textMuted)]">
          {t.hasAccount}{' '}
          <Link href="/login" className="text-[var(--color-primary)] hover:underline">
            {t.login}
          </Link>
        </p>
      </form>
    </div>
  )
}
