'use client'

import { useState, useEffect } from 'react'
import type { Cart } from '@/types/database'
import { IconClose, IconCheck, IconTruck } from '@/components/Icons'
import { useTranslation, useLocale, formatCurrency } from '@/lib/i18n'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  cart: Cart
  onConfirm: (notes?: string) => Promise<boolean>
}

export function CheckoutModal({ isOpen, onClose, cart, onConfirm }: CheckoutModalProps) {
  const t = useTranslation('market')
  const { locale } = useLocale()
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setNotes('')
      setLoading(false)
      setSuccess(false)
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, loading])

  const handleConfirm = async () => {
    setLoading(true)
    const result = await onConfirm(notes || undefined)
    setLoading(false)

    if (result) {
      setSuccess(true)
      // Auto close after success
      setTimeout(() => {
        onClose()
      }, 2000)
    }
  }

  if (!isOpen) return null

  const estimatedDelivery = new Date()
  estimatedDelivery.setDate(estimatedDelivery.getDate() + cart.supplier.delivery_days_max)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => !loading && onClose()}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--color-bgCard)] rounded-2xl shadow-xl animate-fadeInUp">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-lg">{t.orderConfirmation}</h2>
            {!loading && !success && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors"
              >
                <IconClose size={20} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {success ? (
              <div className="py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mx-auto mb-4">
                  <IconCheck size={32} className="text-[var(--color-success)]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.orderPlaced}</h3>
                <p className="text-[var(--color-textMuted)]">
                  {t.trackInOrders}
                </p>
              </div>
            ) : (
              <>
                {/* Supplier */}
                <div className="card p-4 bg-[var(--color-bgHover)]">
                  <div className="font-medium">{cart.supplier.name}</div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-[var(--color-textMuted)]">
                    <IconTruck size={16} />
                    <span>{t.deliveryColon(cart.supplier.delivery_days_min, cart.supplier.delivery_days_max)}</span>
                  </div>
                </div>

                {/* Order summary */}
                <div className="space-y-2">
                  <h3 className="font-medium">{t.orderContents}</h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {cart.items.map(item => (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <span>
                          {item.product.brand} {item.product.flavor}
                          <span className="text-[var(--color-textMuted)]"> × {item.quantity}</span>
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.product.price * item.quantity, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border)]">
                  <span className="font-medium">{t.totalToPay}</span>
                  <span className="text-xl font-bold">{formatCurrency(cart.subtotal, locale)}</span>
                </div>

                {/* Estimated delivery */}
                <div className="text-sm text-[var(--color-textMuted)]">
                  {t.estimatedDeliveryLabel} {estimatedDelivery.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t.orderNoteOptional}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t.orderNotePlaceholder}
                    className="input w-full h-20 resize-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="p-4 border-t border-[var(--color-border)] flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="btn btn-ghost flex-1"
              >
                {t.cancelBtn}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="btn btn-primary flex-1"
              >
                {loading ? t.processingOrder : t.confirmOrder}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
