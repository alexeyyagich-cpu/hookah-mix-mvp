'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

interface CheckoutConfirmModalProps {
  open: boolean
  planName: string
  price: string
  billingPeriod: string
  isLoading: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function CheckoutConfirmModal({
  open,
  planName,
  price,
  billingPeriod,
  isLoading,
  onConfirm,
  onCancel,
}: CheckoutConfirmModalProps) {
  const ta = useTranslation('auth')
  const tc = useTranslation('common')
  const [widerrufsChecked, setWiderrufsChecked] = useState(false)
  const [agbChecked, setAgbChecked] = useState(false)

  if (!open) return null

  const canProceed = widerrufsChecked && agbChecked && !isLoading

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-confirm-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 space-y-5 animate-scaleIn">
        <h2 id="checkout-confirm-title" className="text-xl font-bold">
          {ta.checkoutConfirmTitle}
        </h2>

        {/* Order summary */}
        <div className="rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] p-4 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--color-textMuted)] uppercase tracking-wide">
            {ta.orderSummary}
          </h3>
          <div className="flex justify-between">
            <span>{ta.plan}</span>
            <span className="font-semibold">{planName}</span>
          </div>
          <div className="flex justify-between">
            <span>{ta.billingPeriodLabel}</span>
            <span className="font-semibold">{billingPeriod}</span>
          </div>
          <div className="flex justify-between border-t border-[var(--color-border)] pt-2">
            <span className="font-bold">Total</span>
            <span className="font-bold text-[var(--color-primary)]">{price}</span>
          </div>
        </div>

        {/* Widerrufsbelehrung summary */}
        <div className="text-sm text-[var(--color-textMuted)] bg-[var(--color-bg)] rounded-xl p-4 border border-[var(--color-border)]">
          <p>{ta.widerrufsbelehrungSummary}</p>
          <Link
            href="/legal/widerruf"
            target="_blank"
            className="text-[var(--color-primary)] hover:underline mt-2 inline-block"
          >
            {ta.widerrufsDetails} →
          </Link>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={widerrufsChecked}
              onChange={(e) => setWiderrufsChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-[var(--color-primary)] flex-shrink-0"
            />
            <span className="text-sm">{ta.waiveWithdrawalRight}</span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agbChecked}
              onChange={(e) => setAgbChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-[var(--color-primary)] flex-shrink-0"
            />
            <span className="text-sm">
              {ta.acceptTermsCheckout}{' '}
              <Link href="/legal/terms" target="_blank" className="text-[var(--color-primary)] hover:underline">
                →
              </Link>
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)] transition-colors"
          >
            {tc.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canProceed}
            className="px-6 py-2 rounded-xl bg-[var(--color-primary)] text-[var(--color-bg)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ...
              </span>
            ) : (
              ta.proceedToPayment
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
