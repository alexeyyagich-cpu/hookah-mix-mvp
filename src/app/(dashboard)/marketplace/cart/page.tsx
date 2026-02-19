'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/hooks/useCart'
import { useMarketplaceOrders } from '@/lib/hooks/useMarketplaceOrders'
import { CartSummary } from '@/components/marketplace/CartSummary'
import { CheckoutModal } from '@/components/marketplace/CheckoutModal'
import { IconChevronLeft, IconCart, IconPlus, IconMinus, IconTrash } from '@/components/Icons'
import { useTranslation } from '@/lib/i18n'

export default function CartPage() {
  const tmk = useTranslation('market')
  const tc = useTranslation('common')
  const router = useRouter()
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart()
  const { createOrder } = useMarketplaceOrders()
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)

  const handleCheckout = async (notes?: string): Promise<boolean> => {
    if (!cart) return false

    const order = await createOrder({ cart, notes })
    if (order) {
      clearCart()
      router.push('/marketplace/orders')
      return true
    }
    return false
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="space-y-6">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
        >
          <IconChevronLeft size={20} />
          {tmk.backToMarketplace}
        </Link>

        <div className="card p-8 text-center">
          <IconCart size={48} className="text-[var(--color-textMuted)] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{tmk.cartEmptyTitle}</h2>
          <p className="text-[var(--color-textMuted)] mb-6">
            {tmk.addItemsForOrder}
          </p>
          <Link href="/marketplace" className="btn btn-primary">
            {tmk.goToSuppliers}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/marketplace/supplier/${cart.supplier.id}`}
        className="inline-flex items-center gap-2 text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
      >
        <IconChevronLeft size={20} />
        {tmk.backTo(cart.supplier.name)}
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <IconCart size={28} className="text-[var(--color-primary)]" />
        <h1 className="text-2xl font-bold">{tmk.cartPageTitle}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Supplier info */}
          <div className="card p-4 bg-[var(--color-bgHover)]">
            <div className="text-sm text-[var(--color-textMuted)]">{tmk.supplierFieldLabel}</div>
            <div className="font-medium">{cart.supplier.name}</div>
          </div>

          {/* Items */}
          {cart.items.map(item => (
            <div key={item.product.id} className="card p-4">
              <div className="flex gap-4">
                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[var(--color-textMuted)] uppercase tracking-wider">
                    {item.product.brand}
                  </div>
                  <div className="font-semibold text-lg">{item.product.flavor}</div>
                  <div className="text-sm text-[var(--color-textMuted)]">
                    {item.product.package_grams}{tc.grams} • {item.product.price}€/{tc.pieces}
                  </div>
                  {item.product.sku && (
                    <div className="text-xs text-[var(--color-textMuted)] mt-1">
                      SKU: {item.product.sku}
                    </div>
                  )}
                </div>

                {/* Quantity controls */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2" role="group" aria-label={tmk.changeQuantity}>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      aria-label={tmk.decreaseQuantity}
                      className="icon-btn icon-btn-sm"
                    >
                      <IconMinus size={18} aria-hidden="true" />
                    </button>
                    <span className="w-10 text-center font-medium" aria-live="polite">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      aria-label={tmk.increaseQuantity}
                      className="icon-btn icon-btn-sm"
                    >
                      <IconPlus size={18} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="font-semibold text-lg">
                    {(item.product.price * item.quantity).toFixed(2)}€
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    aria-label={tmk.removeItemFrom(item.product.flavor)}
                    className="text-sm text-[var(--color-danger)] hover:underline flex items-center gap-1"
                  >
                    <IconTrash size={14} aria-hidden="true" />
                    {tmk.removeItem}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Clear cart */}
          <button
            onClick={clearCart}
            className="btn btn-ghost text-[var(--color-danger)]"
          >
            {tmk.clearCartLabel}
          </button>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <CartSummary
              cart={cart}
              onCheckout={() => setCheckoutModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        cart={cart}
        onConfirm={handleCheckout}
      />
    </div>
  )
}
