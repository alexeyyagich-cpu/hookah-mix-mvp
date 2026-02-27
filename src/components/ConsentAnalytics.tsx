'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { useConsentState } from '@/components/CookieConsent'

export function ConsentAnalytics() {
  const consent = useConsentState()

  if (consent !== 'accepted') return null

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
