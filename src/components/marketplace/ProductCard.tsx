'use client'

import { useState } from 'react'
import type { SupplierProduct, Supplier } from '@/types/database'
import { IconPlus, IconMinus, IconCart } from '@/components/Icons'

interface ProductCardProps {
  product: SupplierProduct
  supplier: Supplier
  onAddToCart: (product: SupplierProduct, supplier: Supplier, quantity: number) => void
  cartQuantity: number
  canAdd: boolean
}

export function ProductCard({ product, supplier, onAddToCart, cartQuantity, canAdd }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)

  const handleAdd = () => {
    if (!canAdd) return
    onAddToCart(product, supplier, quantity)
    setQuantity(1)
  }

  const incrementQuantity = () => setQuantity(q => q + 1)
  const decrementQuantity = () => setQuantity(q => Math.max(1, q - 1))

  const pricePerGram = (product.price / product.package_grams).toFixed(2)

  return (
    <div className={`card p-4 ${!product.in_stock ? 'opacity-60' : ''}`}>
      {/* Brand & Flavor */}
      <div>
        <div className="text-xs text-[var(--color-textMuted)] uppercase tracking-wider">
          {product.brand}
        </div>
        <h3 className="font-semibold mt-0.5">{product.flavor}</h3>
      </div>

      {/* Price */}
      <div className="mt-3">
        <div className="text-2xl font-bold">{product.price}€</div>
        <div className="text-xs text-[var(--color-textMuted)]">
          {product.package_grams}г • {pricePerGram}€/г
        </div>
      </div>

      {/* SKU */}
      {product.sku && (
        <div className="text-xs text-[var(--color-textMuted)] mt-2">
          SKU: {product.sku}
        </div>
      )}

      {/* Stock status */}
      {!product.in_stock && (
        <div className="mt-3 text-sm text-[var(--color-danger)]">
          Нет в наличии
        </div>
      )}

      {/* Add to cart */}
      {product.in_stock && (
        <div className="mt-4 space-y-2">
          {/* Quantity selector */}
          <div className="flex items-center gap-2" role="group" aria-label="Выбор количества">
            <button
              onClick={decrementQuantity}
              aria-label="Уменьшить количество"
              className="icon-btn icon-btn-sm"
            >
              <IconMinus size={18} aria-hidden="true" />
            </button>
            <span className="w-10 text-center font-medium" aria-live="polite">{quantity}</span>
            <button
              onClick={incrementQuantity}
              aria-label="Увеличить количество"
              className="icon-btn icon-btn-sm"
            >
              <IconPlus size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            aria-label={canAdd ? `Добавить ${product.flavor} в корзину` : 'Товар от другого поставщика'}
            className={`w-full btn ${canAdd ? 'btn-primary' : 'btn-ghost opacity-50 cursor-not-allowed'} flex items-center justify-center gap-2`}
          >
            <IconCart size={18} aria-hidden="true" />
            {canAdd ? 'В корзину' : 'Другой поставщик'}
          </button>

          {/* Cart quantity indicator */}
          {cartQuantity > 0 && (
            <div className="text-center text-sm text-[var(--color-success)]">
              В корзине: {cartQuantity} шт.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
