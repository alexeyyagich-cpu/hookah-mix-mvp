'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

export default function NotFound() {
  const tc = useTranslation('common')

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-8xl font-bold text-[var(--color-primary)]">404</div>

        <div>
          <h1 className="text-2xl font-bold mb-2">{tc.notFound.title}</h1>
          <p className="text-[var(--color-textMuted)]">
            {tc.notFound.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn btn-primary px-6 py-3">
            {tc.notFound.goHome}
          </Link>
          <Link href="/dashboard" className="btn btn-secondary px-6 py-3">
            {tc.notFound.goDashboard}
          </Link>
        </div>
      </div>
    </div>
  )
}
