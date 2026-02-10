'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useSuppliers } from '@/lib/hooks/useSuppliers'
import { useSupplierProducts } from '@/lib/hooks/useSupplierProducts'
import { useCart } from '@/lib/hooks/useCart'
import { ProductGrid } from '@/components/marketplace/ProductGrid'
import { CartDrawer } from '@/components/marketplace/CartDrawer'
import { IconChevronLeft, IconCart, IconTruck } from '@/components/Icons'
import type { Supplier, SupplierProduct } from '@/types/database'

export default function SupplierPage() {
  const params = useParams()
  const supplierId = params.id as string

  const { suppliers, loading: suppliersLoading, getSupplier } = useSuppliers()
  const { products, loading: productsLoading, brands } = useSupplierProducts({ supplierId })
  const {
    cart,
    cartItemCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getItemQuantity,
    canAddToCart,
  } = useCart()

  const [cartOpen, setCartOpen] = useState(false)
  const [supplier, setSupplier] = useState<Supplier | null>(null)

  // Get supplier from context
  useEffect(() => {
    if (!suppliersLoading) {
      const s = getSupplier(supplierId)
      setSupplier(s || null)
    }
  }, [suppliersLoading, supplierId, getSupplier])

  const handleAddToCart = (product: SupplierProduct, sup: Supplier, quantity: number) => {
    addToCart(product, sup, quantity)
  }

  const loading = suppliersLoading || productsLoading

  if (!loading && !supplier) {
    return (
      <div className="space-y-6">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
        >
          <IconChevronLeft size={20} />
          Назад к маркетплейсу
        </Link>

        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Поставщик не найден</h2>
          <p className="text-[var(--color-textMuted)]">
            Возможно, он был удален или деактивирован
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
      >
        <IconChevronLeft size={20} />
        Назад к маркетплейсу
      </Link>

      {/* Supplier header */}
      {supplier && (
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="w-16 h-16 rounded-xl bg-[var(--color-bgHover)] flex items-center justify-center flex-shrink-0">
                {supplier.logo_url ? (
                  <img
                    src={supplier.logo_url}
                    alt={supplier.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-2xl font-bold text-[var(--color-primary)]">
                    {supplier.name.charAt(0)}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold">{supplier.name}</h1>
                {supplier.description && (
                  <p className="text-[var(--color-textMuted)] mt-1">
                    {supplier.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-[var(--color-textMuted)]">
                  <div className="flex items-center gap-1.5">
                    <IconTruck size={16} />
                    <span>{supplier.delivery_days_min}-{supplier.delivery_days_max} дней</span>
                  </div>
                  {supplier.min_order_amount > 0 && (
                    <div>
                      Мин. заказ: <span className="font-medium text-[var(--color-text)]">{supplier.min_order_amount}€</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cart button */}
            <button
              onClick={() => setCartOpen(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <IconCart size={18} />
              Корзина
              {cartItemCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-sm">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Products grid */}
      {supplier && (
        <ProductGrid
          products={products}
          supplier={supplier}
          brands={brands}
          onAddToCart={handleAddToCart}
          getItemQuantity={getItemQuantity}
          canAddToCart={canAddToCart}
          loading={productsLoading}
        />
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
