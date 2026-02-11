'use client'

import Link from 'next/link'
import type { Supplier } from '@/types/database'
import { IconTruck, IconChevronRight } from '@/components/Icons'

interface SupplierCardProps {
  supplier: Supplier
}

export function SupplierCard({ supplier }: SupplierCardProps) {
  return (
    <Link
      href={`/marketplace/supplier/${supplier.id}`}
      className="block p-6 bg-[var(--color-bgCard)] border border-[var(--color-border)] rounded-2xl hover:border-[var(--color-primary)]/50 transition-all group"
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl bg-[var(--color-bgHover)] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {supplier.logo_url ? (
            <img
              src={supplier.logo_url}
              alt={supplier.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-bold text-[var(--color-primary)]">
              {supplier.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg truncate">{supplier.name}</h3>
            <IconChevronRight
              size={20}
              className="text-[var(--color-textMuted)] group-hover:text-[var(--color-primary)] transition-colors"
            />
          </div>

          {supplier.description && (
            <p className="text-sm text-[var(--color-textMuted)] mt-1 line-clamp-2">
              {supplier.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 mt-3 text-sm text-[var(--color-textMuted)]">
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
    </Link>
  )
}
