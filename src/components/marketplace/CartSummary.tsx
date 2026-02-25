'use client'

import type { Cart } from '@/types/database'
import { IconTruck } from '@/components/Icons'
import { useTranslation, useLocale, formatCurrency } from '@/lib/i18n'

interface CartSummaryProps {
  cart: Cart
  onCheckout: () => void
  isCheckoutDisabled?: boolean
}

export function CartSummary({ cart, onCheckout, isCheckoutDisabled }: CartSummaryProps) {
  const t = useTranslation('market')
  const { locale } = useLocale()
  const itemsCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  const totalGrams = cart.items.reduce(
    (sum, item) => sum + (item.product.package_grams * item.quantity),
    0
  )

  const meetsMinOrder = cart.subtotal >= cart.supplier.min_order_amount
  const canCheckout = meetsMinOrder && !isCheckoutDisabled

  return (
    <div className="card p-6 space-y-4">
      <h3 className="font-semibold text-lg">{t.orderSummary}</h3>

      {/* Order summary */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--color-textMuted)]">{t.productsLabel}</span>
          <span>{t.itemsCountPcs(itemsCount, totalGrams)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-textMuted)]">{t.subtotal}</span>
          <span>{formatCurrency(cart.subtotal, locale)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-textMuted)]">{t.deliveryLabel}</span>
          <span className="text-[var(--color-success)]">{t.freeLabel}</span>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] pt-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">{t.totalLabelSummary}</span>
          <span className="text-2xl font-bold">{formatCurrency(cart.subtotal, locale)}</span>
        </div>
      </div>

      {/* Min order warning */}
      {!meetsMinOrder && (
        <div className="p-3 rounded-lg bg-[var(--color-warning)]/10 text-sm">
          <div className="text-[var(--color-warning)] font-medium">
            {t.minOrderAmount(cart.supplier.min_order_amount)}
          </div>
          <div className="text-[var(--color-textMuted)] mt-1">
            {t.addMoreFor((cart.supplier.min_order_amount - cart.subtotal).toFixed(2))}
          </div>
        </div>
      )}

      {/* Delivery info */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bgHover)]">
        <IconTruck size={20} className="text-[var(--color-primary)]" />
        <div className="text-sm">
          <div className="font-medium">{t.deliveryDays(cart.supplier.delivery_days_min, cart.supplier.delivery_days_max)}</div>
          <div className="text-[var(--color-textMuted)]">{cart.supplier.name}</div>
        </div>
      </div>

      {/* Checkout button */}
      <button
        onClick={onCheckout}
        disabled={!canCheckout}
        className={`w-full btn btn-primary py-3 ${!canCheckout ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {t.checkoutOrder}
      </button>
    </div>
  )
}
