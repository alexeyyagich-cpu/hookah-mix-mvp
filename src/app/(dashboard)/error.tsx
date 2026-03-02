'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { useTranslation } from '@/lib/i18n'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const tc = useTranslation('common')

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card p-8 text-center max-w-md">
        <h1 className="text-xl font-bold mb-2">{tc.errorGeneric}</h1>
        <p className="text-sm text-[var(--color-textMuted)] mb-4">
          {tc.errorPage.description}
        </p>
        <button type="button" onClick={reset} className="btn btn-primary">
          {tc.retry}
        </button>
      </div>
    </div>
  )
}
