'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
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
          <h1 className="text-2xl font-bold mb-2">Что-то пошло не так</h1>
          <p className="text-[var(--color-textMuted)]">
            Произошла непредвиденная ошибка. Попробуйте обновить страницу.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn btn-primary px-6 py-3"
          >
            Попробовать снова
          </button>
          <a href="/" className="btn btn-secondary px-6 py-3">
            На главную
          </a>
        </div>

        {error.digest && (
          <p className="text-xs text-[var(--color-textMuted)]">
            Код ошибки: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
