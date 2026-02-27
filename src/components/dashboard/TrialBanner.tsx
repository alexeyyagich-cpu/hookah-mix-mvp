'use client'

import Link from 'next/link'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useTranslation } from '@/lib/i18n'

export function TrialBanner() {
  const { isTrialTier, isTrialExpired, trialDaysLeft } = useSubscription()
  const tc = useTranslation('common')

  // Only show for trial users
  if (!isTrialTier) return null

  if (isTrialExpired) {
    return (
      <div className="bg-[var(--color-danger)]/10 border-b border-[var(--color-danger)]/30 px-4 py-2.5 text-center text-sm">
        <span className="text-[var(--color-danger)] font-medium">
          {tc.trialExpired}
        </span>
        {' '}
        <Link
          href="/pricing"
          className="text-[var(--color-primary)] font-semibold hover:underline"
        >
          {tc.upgradeNow}
        </Link>
      </div>
    )
  }

  if (trialDaysLeft !== null) {
    return (
      <div className="bg-[var(--color-warning)]/10 border-b border-[var(--color-warning)]/30 px-4 py-2.5 text-center text-sm">
        <span className="text-[var(--color-warning)] font-medium">
          {tc.trialDaysLeft(trialDaysLeft)}
        </span>
        {' '}
        <Link
          href="/pricing"
          className="text-[var(--color-primary)] font-semibold hover:underline"
        >
          {tc.upgradeNow}
        </Link>
      </div>
    )
  }

  return null
}
