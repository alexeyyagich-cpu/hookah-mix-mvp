'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import type { Cart } from '@/types/database'
import { IconClose, IconCheck, IconTruck } from '@/components/Icons'
import { useTranslation, useLocale, formatCurrency, formatDate } from '@/lib/i18n'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  cart: Cart
  onConfirm: (notes?: string) => Promise<boolean>
}

export function CheckoutModal({ isOpen, onClose, cart, onConfirm }: CheckoutModalProps) {
  const t = useTranslation('market')
  const tc = useTranslation('common')
  const { locale } = useLocale()
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [visible, setVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const dialogRef = useRef<HTMLDivElement>(null)
  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      setIsClosing(false)
      setNotes('')
      setLoading(false)
      setSuccess(false)
    }
  }, [isOpen])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleClose = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setIsClosing(false)
      onClose()
    }, 200)
  }, [onClose, isClosing])

  useFocusTrap(dialogRef, visible, handleClose)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const result = await onConfirm(notes || undefined)
      if (result) {
        setSuccess(true)
        timerRef.current = setTimeout(() => {
          handleClose()
        }, 4000)
      }
    } catch {
      toast.error(tc.errorGeneric)
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  const estimatedDelivery = new Date()
  estimatedDelivery.setDate(estimatedDelivery.getDate() + cart.supplier.delivery_days_max)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 ${isClosing ? 'animate-backdropFadeOut' : ''}`}
        aria-hidden="true"
        onClick={() => !loading && handleClose()}
      />

      {/* Modal */}
      <div ref={dialogRef} className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title">
        <div className={`w-full max-w-md bg-[var(--color-bgCard)] rounded-2xl shadow-xl ${isClosing ? 'animate-fadeOutDown' : 'animate-fadeInUp'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <h2 id="checkout-modal-title" className="font-semibold text-lg">{t.orderConfirmation}</h2>
            {!loading && !success && (
              <button type="button"
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors"
                aria-label={tc.close}
              >
                <IconClose size={20} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {success ? (
              <div className="py-8 text-center" role="status" aria-live="polite">
                <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mx-auto mb-4">
                  <IconCheck size={32} className="text-[var(--color-success)]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.orderPlaced}</h3>
                <p className="text-[var(--color-textMuted)]">
                  {t.trackInOrders}
                </p>
                <button type="button" onClick={() => { clearTimeout(timerRef.current); handleClose() }} className="btn btn-primary mt-4 w-full">
                  {tc.close || 'Close'}
                </button>
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
                  {t.estimatedDeliveryLabel} {formatDate(estimatedDelivery, locale, 'long')}
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
              <button type="button"
                onClick={handleClose}
                disabled={loading}
                className="btn btn-ghost flex-1"
              >
                {t.cancelBtn}
              </button>
              <button type="button"
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
