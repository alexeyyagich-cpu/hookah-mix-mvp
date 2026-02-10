'use client'

import type { Cart } from '@/types/database'
import { IconTruck } from '@/components/Icons'

interface CartSummaryProps {
  cart: Cart
  onCheckout: () => void
  isCheckoutDisabled?: boolean
}

export function CartSummary({ cart, onCheckout, isCheckoutDisabled }: CartSummaryProps) {
  const itemsCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  const totalGrams = cart.items.reduce(
    (sum, item) => sum + (item.product.package_grams * item.quantity),
    0
  )

  const meetsMinOrder = cart.subtotal >= cart.supplier.min_order_amount
  const canCheckout = meetsMinOrder && !isCheckoutDisabled

  return (
    <div className="card p-6 space-y-4">
      <h3 className="font-semibold text-lg">Сумма заказа</h3>

      {/* Order summary */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--color-textMuted)]">Товаров</span>
          <span>{itemsCount} шт. ({totalGrams}г)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-textMuted)]">Подытог</span>
          <span>{cart.subtotal.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-textMuted)]">Доставка</span>
          <span className="text-[var(--color-success)]">Бесплатно</span>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] pt-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Итого</span>
          <span className="text-2xl font-bold">{cart.subtotal.toFixed(2)}€</span>
        </div>
      </div>

      {/* Min order warning */}
      {!meetsMinOrder && (
        <div className="p-3 rounded-lg bg-[var(--color-warning)]/10 text-sm">
          <div className="text-[var(--color-warning)] font-medium">
            Минимальная сумма заказа: {cart.supplier.min_order_amount}€
          </div>
          <div className="text-[var(--color-textMuted)] mt-1">
            Добавьте товаров на {(cart.supplier.min_order_amount - cart.subtotal).toFixed(2)}€
          </div>
        </div>
      )}

      {/* Delivery info */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bgHover)]">
        <IconTruck size={20} className="text-[var(--color-primary)]" />
        <div className="text-sm">
          <div className="font-medium">Доставка {cart.supplier.delivery_days_min}-{cart.supplier.delivery_days_max} дней</div>
          <div className="text-[var(--color-textMuted)]">{cart.supplier.name}</div>
        </div>
      </div>

      {/* Checkout button */}
      <button
        onClick={onCheckout}
        disabled={!canCheckout}
        className={`w-full btn btn-primary py-3 ${!canCheckout ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Оформить заказ
      </button>
    </div>
  )
}
