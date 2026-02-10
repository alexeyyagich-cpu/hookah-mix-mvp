'use client'

import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

function LoginFormWrapper() {
  return <LoginForm />
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-[var(--color-textMuted)]">Загрузка...</div>}>
      <LoginFormWrapper />
    </Suspense>
  )
}
