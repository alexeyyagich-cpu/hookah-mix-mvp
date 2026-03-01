'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useTranslation } from '@/lib/i18n'
import { TOAST_TIMEOUT } from '@/lib/constants'
import Link from 'next/link'

export default function SubscriptionSection() {
  const { user, profile, refreshProfile, isDemoMode } = useAuth()
  const { tier, isExpired, daysUntilExpiry, trialDaysLeft } = useSubscription()
  const ts = useTranslation('settings')
  const tc = useTranslation('common')
  const searchParams = useSearchParams()

  const [activating, setActivating] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [message, setMessage] = useState('')
  const msgTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Cleanup message timer on unmount
  useEffect(() => () => { clearTimeout(msgTimerRef.current) }, [])

  // Handle Stripe checkout success redirect — poll until webhook updates tier
  useEffect(() => {
    if (searchParams.get('success') !== 'true') return
    window.history.replaceState({}, '', '/settings')
    setActivating(true)
    setMessage(ts.activatingSubscription)
    let attempts = 0
    const poll = setInterval(async () => {
      attempts++
      await refreshProfile()
      const updated = profile?.subscription_tier
      if ((updated && updated !== 'trial') || attempts >= 10) {
        clearInterval(poll)
        setActivating(false)
        setMessage(ts.paymentSuccess)
        msgTimerRef.current = setTimeout(() => setMessage(''), TOAST_TIMEOUT)
      }
    }, 2000)
    return () => clearInterval(poll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Refresh profile when user returns from Stripe Portal (tab focus)
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'visible') refreshProfile() }
    document.addEventListener('visibilitychange', onFocus)
    return () => document.removeEventListener('visibilitychange', onFocus)
  }, [refreshProfile])

  const handleManageSubscription = async () => {
    if (!user || isDemoMode) return
    setPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setMessage(tc.error + ': ' + (data.error || ts.portalError))
        msgTimerRef.current = setTimeout(() => setMessage(''), TOAST_TIMEOUT)
      }
    } catch {
      setMessage(ts.portalOpenError)
      msgTimerRef.current = setTimeout(() => setMessage(''), TOAST_TIMEOUT)
    } finally {
      setPortalLoading(false)
    }
  }

  const hasActiveSubscription = profile?.stripe_subscription_id && tier !== 'trial'

  return (
    <>
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes(tc.error)
            ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
            : 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
        }`}>
          {message}
        </div>
      )}
      <div id="subscription" className="card p-6 scroll-mt-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">{ts.subscription}</h2>
            <div className="flex items-center gap-2">
              <span className={`badge ${activating ? 'badge-warning' : tier === 'trial' ? 'badge-warning' : 'badge-success'}`}>
                {activating ? '…' : tier.toUpperCase()}
              </span>
              {isExpired && !activating && (
                <span className="badge badge-danger">{ts.expired}</span>
              )}
              {daysUntilExpiry !== null && daysUntilExpiry <= 7 && !isExpired && (
                <span className="text-sm text-[var(--color-warning)]">
                  {ts.expiresIn(daysUntilExpiry)}
                </span>
              )}
            </div>
            {!activating && tier === 'trial' && trialDaysLeft !== null && (
              <p className="text-sm text-[var(--color-textMuted)] mt-1">
                {ts.trialEndsOn(new Date(profile?.trial_expires_at || '').toLocaleDateString())}
              </p>
            )}
            {!activating && hasActiveSubscription && profile?.subscription_expires_at && (
              <p className="text-sm text-[var(--color-textMuted)] mt-1">
                {ts.renewsOn(new Date(profile.subscription_expires_at).toLocaleDateString())}
              </p>
            )}
            {tier === 'trial' && !activating && (
              <p className="text-sm text-[var(--color-textMuted)] mt-2">
                {ts.upgradeForFull}
              </p>
            )}
            {hasActiveSubscription && !activating && (
              <p className="text-sm text-[var(--color-textMuted)] mt-2">
                {ts.manageSubscription}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {hasActiveSubscription ? (
              <button
                type="button"
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="btn btn-primary disabled:opacity-50"
              >
                {portalLoading ? tc.loading : ts.manage}
              </button>
            ) : (
              <Link href="/pricing" className="btn btn-primary">
                {tier === 'trial' ? tc.upgrade : ts.changePlan}
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
