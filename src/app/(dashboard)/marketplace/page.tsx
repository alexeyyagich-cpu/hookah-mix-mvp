'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconShop, IconCart, IconTruck } from '@/components/Icons'
import { SupplierCard } from '@/components/marketplace/SupplierCard'
import { CartDrawer } from '@/components/marketplace/CartDrawer'
import { useSuppliers } from '@/lib/hooks/useSuppliers'
import { useCart } from '@/lib/hooks/useCart'
import { useTranslation } from '@/lib/i18n'

export default function MarketplacePage() {
  const t = useTranslation('market')
  const { suppliers, loading } = useSuppliers()
  const { cart, cartItemCount, updateQuantity, removeFromCart, clearCart } = useCart()
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconShop size={28} className="text-[var(--color-primary)]" />
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-sm text-[var(--color-textMuted)]">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/marketplace/orders"
            className="btn btn-ghost text-sm"
          >
            {t.myOrders}
          </Link>
          <button type="button"
            onClick={() => setCartOpen(true)}
            className="btn btn-ghost text-sm relative"
          >
            <IconCart size={20} />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-primary)] text-white text-xs rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-[var(--color-bgHover)] rounded w-2/3 mb-3" />
              <div className="h-4 bg-[var(--color-bgHover)] rounded w-full mb-2" />
              <div className="h-4 bg-[var(--color-bgHover)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : suppliers.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <SupplierCard key={s.id} supplier={s} />
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4">
            <IconTruck size={32} className="text-[var(--color-primary)]" />
          </div>
          <h2 className="text-lg font-semibold mb-2">{t.noSuppliersAvailable}</h2>
          <p className="text-[var(--color-textMuted)] max-w-md mx-auto">
            {t.orderFromSuppliers}
          </p>
        </div>
      )}

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
