'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signInDemo, isDemoMode } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError(signInError.message === 'Invalid login credentials'
        ? 'Неверный email или пароль'
        : signInError.message)
      setLoading(false)
      return
    }

    router.push(redirect)
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
            className="w-full h-full object-cover"
          >
            <source src="/images/logo-animated.mp4" type="video/mp4" />
          </video>
        </div>
        <h1 className="text-3xl font-bold mb-2">Вход</h1>
        <p className="text-[var(--color-textMuted)]">
          Войдите в свой бизнес-кабинет
        </p>
      </div>

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎮</span>
            <div>
              <h3 className="font-semibold">Демо-режим</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                Supabase не настроен. Попробуйте демо-версию!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full btn btn-primary py-3"
          >
            🚀 Войти в демо-режим
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
            placeholder="your@email.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
            placeholder="••••••••"
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
              Вход...
            </span>
          ) : (
            'Войти'
          )}
        </button>

        <p className="text-center text-[var(--color-textMuted)]">
          Нет аккаунта?{' '}
          <Link href="/register" className="text-[var(--color-primary)] hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </form>
    </div>
  )
}
