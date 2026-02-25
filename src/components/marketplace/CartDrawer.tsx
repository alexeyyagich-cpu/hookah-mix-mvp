'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import type { Cart } from '@/types/database'
import { IconClose, IconPlus, IconMinus, IconTrash, IconCart } from '@/components/Icons'
import { useTranslation, useLocale, formatCurrency } from '@/lib/i18n'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cart: Cart | null
  updateQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
}

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  removeFromCart,
  clearCart,
}: CartDrawerProps) {
  const t = useTranslation('market')
  const { locale } = useLocale()

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-label={t.cartDrawerLabel}
        aria-modal="true"
        className="fixed inset-y-0 right-0 w-full max-w-md bg-[var(--color-bgCard)] border-l border-[var(--color-border)] shadow-xl z-50 flex flex-col animate-slideInRight"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <IconCart size={20} aria-hidden="true" />
            {t.cartDrawerLabel}
          </h2>
          <button
            onClick={onClose}
            aria-label={t.closeCart}
            className="icon-btn icon-btn-ghost"
          >
            <IconClose size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        {!cart || cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <IconCart size={48} className="text-[var(--color-textMuted)] mb-4" />
            <p className="text-[var(--color-textMuted)]">{t.cartEmptyDrawer}</p>
            <button onClick={onClose} className="btn btn-ghost mt-4">
              {t.continueShopping}
            </button>
          </div>
        ) : (
          <>
            {/* Supplier info */}
            <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bgHover)]">
              <div className="text-sm text-[var(--color-textMuted)]">{t.supplier}</div>
              <div className="font-medium">{cart.supplier.name}</div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.items.map(item => (
                <div key={item.product.id} className="card p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-[var(--color-textMuted)]">{item.product.brand}</div>
                      <div className="font-medium">{item.product.flavor}</div>
                      <div className="text-sm text-[var(--color-textMuted)]">
                        {item.product.package_grams}g × {formatCurrency(item.product.price, locale)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      aria-label={t.removeItemFrom(item.product.flavor)}
                      className="icon-btn icon-btn-sm icon-btn-ghost icon-btn-danger"
                    >
                      <IconTrash size={18} aria-hidden="true" />
                    </button>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2" role="group" aria-label={t.changeQuantity}>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        aria-label={t.decreaseQuantity}
                        className="icon-btn icon-btn-sm"
                      >
                        <IconMinus size={18} aria-hidden="true" />
                      </button>
                      <span className="w-10 text-center font-medium" aria-live="polite">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        aria-label={t.increaseQuantity}
                        className="icon-btn icon-btn-sm"
                      >
                        <IconPlus size={18} aria-hidden="true" />
                      </button>
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(item.product.price * item.quantity, locale)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--color-border)] space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-textMuted)]">{t.drawerTotal}</span>
                <span className="text-2xl font-bold">{formatCurrency(cart.subtotal, locale)}</span>
              </div>

              {/* Min order warning */}
              {cart.subtotal < cart.supplier.min_order_amount && (
                <div className="text-sm text-[var(--color-warning)]">
                  {t.minOrderWarning(cart.supplier.min_order_amount, (cart.supplier.min_order_amount - cart.subtotal).toFixed(2))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  className="btn btn-ghost flex-1"
                >
                  {t.clearLabel}
                </button>
                <Link
                  href="/marketplace/cart"
                  onClick={onClose}
                  className={`btn btn-primary flex-1 text-center ${
                    cart.subtotal < cart.supplier.min_order_amount
                      ? 'opacity-50 pointer-events-none'
                      : ''
                  }`}
                >
                  {t.checkoutLabel}
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
