'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useTranslation } from '@/lib/i18n'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const tc = useTranslation('common')

  useEffect(() => {
    if (!loading && !user) {
      // Grace period: allow token refresh to complete before redirecting
      const timer = setTimeout(() => {
        const redirectParam = pathname && pathname !== '/dashboard' ? `?redirect=${encodeURIComponent(pathname)}` : ''
        router.push(`/login${redirectParam}`)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [user, loading, router, pathname])

  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-[var(--color-textMuted)]">{tc.loading}</p>
          </div>
        </div>
      )
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
