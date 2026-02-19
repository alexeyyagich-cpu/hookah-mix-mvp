'use client'

import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { useTranslation } from '@/lib/i18n'

function LoginFormWrapper() {
  return <LoginForm />
}

function LoginFallback() {
  const tc = useTranslation('common')
  return <div className="text-[var(--color-textMuted)]">{tc.loading}</div>
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginFormWrapper />
    </Suspense>
  )
}
