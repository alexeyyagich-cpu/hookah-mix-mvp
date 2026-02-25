'use client'

import { useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const tc = useTranslation('common')

  useEffect(() => {
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center">
          <span className="text-4xl">!</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">{tc.errorGeneric}</h1>
          <p className="text-[var(--color-textMuted)]">
            {tc.errorPage.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="btn btn-primary px-6 py-3"
          >
            {tc.retry}
          </button>
          <a href="/" className="btn btn-secondary px-6 py-3">
            {tc.notFound.goHome}
          </a>
        </div>

        {error.digest && (
          <p className="text-xs text-[var(--color-textMuted)]">
            {tc.errorPage.errorCode} {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
