'use client'

import { useAuth } from '@/lib/AuthContext'
import { LocaleProvider } from './context'

export function LocaleProviderBridge({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  return (
    <LocaleProvider profileLocale={profile?.locale}>
      {children}
    </LocaleProvider>
  )
}
