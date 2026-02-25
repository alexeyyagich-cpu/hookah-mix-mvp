'use client'

import { useState, useMemo } from 'react'
import type { SupplierProduct, Supplier } from '@/types/database'
import { ProductCard } from './ProductCard'
import { IconSearch } from '@/components/Icons'
import { useTranslation } from '@/lib/i18n'

interface ProductGridProps {
  products: SupplierProduct[]
  supplier: Supplier
  brands: string[]
  onAddToCart: (product: SupplierProduct, supplier: Supplier, quantity: number) => void
  getItemQuantity: (productId: string) => number
  canAddToCart: (supplierId: string) => boolean
  loading?: boolean
}

export function ProductGrid({
  products,
  supplier,
  brands,
  onAddToCart,
  getItemQuantity,
  canAddToCart,
  loading,
}: ProductGridProps) {
  const t = useTranslation('market')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [showInStockOnly, setShowInStockOnly] = useState(true)

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = products

    if (selectedBrand !== 'all') {
      result = result.filter(p => p.brand === selectedBrand)
    }

    if (showInStockOnly) {
      result = result.filter(p => p.in_stock)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.brand.toLowerCase().includes(query) ||
        p.flavor.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query))
      )
    }

    return result
  }, [products, selectedBrand, showInStockOnly, searchQuery])

  const canAdd = canAddToCart(supplier.id)

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-4 bg-[var(--color-bgHover)] rounded w-1/2 mb-2" />
            <div className="h-5 bg-[var(--color-bgHover)] rounded w-3/4 mb-4" />
            <div className="h-8 bg-[var(--color-bgHover)] rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-textMuted)]" />
          <input
            type="text"
            placeholder={t.searchByBrandOrFlavor}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>

        {/* Brand filter */}
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="all">{t.allBrands}</option>
          {brands.map(brand => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>

        {/* In stock filter */}
        <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={showInStockOnly}
            onChange={(e) => setShowInStockOnly(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--color-border)]"
          />
          <span className="text-sm">{t.inStockOnly}</span>
        </label>
      </div>

      {/* Different supplier warning */}
      {!canAdd && (
        <div className="card p-4 border-[var(--color-warning)]/50 bg-[var(--color-warning)]/5">
          <p className="text-sm">
            {t.otherSupplierWarning}
            <button type="button"
              onClick={() => {/* Clear cart handled in parent */}}
              className="ml-2 text-[var(--color-primary)] underline"
            >
              {t.clearCartToAdd}
            </button>
            {t.toAddFromThisSupplier}
          </p>
        </div>
      )}

      {/* Products grid */}
      {filteredProducts.length === 0 ? (
        <div className="card p-8 text-center text-[var(--color-textMuted)]">
          {products.length === 0
            ? t.noProductsYet
            : t.nothingFoundForQuery
          }
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              supplier={supplier}
              onAddToCart={onAddToCart}
              cartQuantity={getItemQuantity(product.id)}
              canAdd={canAdd}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-[var(--color-textMuted)]">
        {t.showingOf(filteredProducts.length, products.length)}
      </div>
    </div>
  )
}
