'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSuppliers } from '@/lib/hooks/useSuppliers'
import { useCart } from '@/lib/hooks/useCart'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { SupplierCard } from '@/components/marketplace/SupplierCard'
import { CartDrawer } from '@/components/marketplace/CartDrawer'
import { IconShop, IconCart, IconPackage, IconLock } from '@/components/Icons'
import { useTranslation } from '@/lib/i18n'

export default function MarketplacePage() {
  const tmk = useTranslation('market')
  const { suppliers, loading, error } = useSuppliers()
  const { cart, cartItemCount, updateQuantity, removeFromCart, clearCart } = useCart()
  const { tier, canUseMarketplace } = useSubscription()
  const [cartOpen, setCartOpen] = useState(false)

  // Redirect free users
  if (!canUseMarketplace) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <IconShop size={28} className="text-[var(--color-primary)]" />
          <h1 className="text-2xl font-bold">{tmk.title}</h1>
        </div>

        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4">
            <IconLock size={32} className="text-[var(--color-primary)]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{tmk.availableOnPro}</h2>
          <p className="text-[var(--color-textMuted)] mb-6 max-w-md mx-auto">
            {tmk.marketplaceProDesc}
          </p>
          <Link href="/pricing" className="btn btn-primary">
            {tmk.upgradeToPro}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <IconShop size={28} className="text-[var(--color-primary)]" />
          <div>
            <h1 className="text-2xl font-bold">{tmk.title}</h1>
            <p className="text-[var(--color-textMuted)]">
              {tmk.orderFromSuppliers}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Orders link */}
          <Link
            href="/marketplace/orders"
            className="btn btn-ghost flex items-center gap-2"
          >
            <IconPackage size={18} />
            {tmk.ordersTitle}
          </Link>

          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            className="btn btn-ghost relative"
          >
            <IconCart size={20} />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-xs flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <p className="text-[var(--color-danger)]">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-[var(--color-bgHover)]" />
                <div className="flex-1">
                  <div className="h-5 bg-[var(--color-bgHover)] rounded w-1/3 mb-2" />
                  <div className="h-4 bg-[var(--color-bgHover)] rounded w-2/3 mb-4" />
                  <div className="h-3 bg-[var(--color-bgHover)] rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="card p-8 text-center text-[var(--color-textMuted)]">
          {tmk.noSuppliersAvailable}
        </div>
      ) : (
        <div className="flex flex-col gap-4 isolate">
          {suppliers.map(supplier => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        clearCart={clearCart}
      />
    </div>
  )
}
