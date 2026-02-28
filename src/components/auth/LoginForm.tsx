'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { useTranslation } from '@/lib/i18n'
import { translateError } from '@/lib/utils/translateError'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signInDemo } = useAuth()
  const t = useTranslation('auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect') || '/dashboard'
  // Prevent open redirect: only allow relative paths starting with /
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await signIn(email, password)

      if (signInError) {
        const translated = translateError(signInError)
        setError(translated === 'invalid_credentials' ? t.invalidCredentials : translated)
        return
      }

      router.push(redirect)
    } catch {
      setError(t.loginFailed)
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    signInDemo()
    router.push('/dashboard')
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
            preload="none"
            poster="/images/torus-logo.png"
            className="w-full h-full object-cover"
          >
            <source src="/images/logo-animated.mp4" type="video/mp4" />
          </video>
        </div>
        <h1 className="text-3xl font-bold mb-2">{t.loginTitle}</h1>
        <p className="text-[var(--color-textMuted)]">
          {t.loginSubtitle}
        </p>
      </div>

      {/* Demo Mode Banner */}
      <div className="mb-6 p-4 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🎮</span>
          <div>
            <h3 className="font-semibold">{t.demoMode}</h3>
            <p className="text-sm text-[var(--color-textMuted)]">
              {t.demoDescription}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDemoLogin}
          className="w-full btn btn-primary py-3"
        >
          {t.demoLogin}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {error && (
          <div role="alert" aria-live="polite" className="p-4 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)]">
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
            data-testid="auth-email-input"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">
            {t.password}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input transition-colors"
            placeholder={t.placeholderPassword}
            autoComplete="current-password"
            data-testid="auth-password-input"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          data-testid="auth-submit"
          className="btn btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t.loggingIn}
            </span>
          ) : (
            t.login
          )}
        </button>

        <div className="text-center space-y-2">
          <p className="text-[var(--color-textMuted)]">
            <Link href="/forgot-password" className="text-[var(--color-primary)] hover:underline">
              {t.forgotPassword}
            </Link>
          </p>
          <p className="text-[var(--color-textMuted)]">
            {t.noAccount}{' '}
            <Link href="/register" className="text-[var(--color-primary)] hover:underline">
              {t.register}
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
