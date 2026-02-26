'use client'

import { useTranslation } from '@/lib/i18n'
import { IconWarning } from '@/components/Icons'
import Link from 'next/link'
import type { LowStockItem } from '@/types/dashboard-control'

interface Props {
  items: LowStockItem[]
}

export function LowStockAlertPanel({ items }: Props) {
  const t = useTranslation('manage')

  return (
    <div className="card p-5 border-[var(--color-warning)]/30" role="region" aria-live="polite" aria-label={t.controlLowStockTitle}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-warning)]/20 flex items-center justify-center text-[var(--color-warning)]">
            <IconWarning size={20} />
          </div>
          <h2 className="text-lg font-semibold">{t.controlLowStockTitle}</h2>
        </div>
        <Link href="/inventory" className="text-sm text-[var(--color-primary)] hover:underline">
          {t.checkInventory}
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => {
          const daysColor = item.estimated_days_left === null
            ? 'var(--color-textMuted)'
            : item.estimated_days_left <= 3
              ? 'var(--color-danger)'
              : item.estimated_days_left <= 7
                ? 'var(--color-warning)'
                : 'var(--color-success)'

          return (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-[var(--color-bgHover)]"
              style={{ borderLeft: `3px solid ${daysColor}` }}
            >
              <div className="font-medium truncate">{item.flavor}</div>
              <div className="text-xs text-[var(--color-textMuted)]">{item.brand}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-[var(--color-textMuted)]">
                  {item.remaining_grams}g
                </span>
                <span className="text-sm font-medium" style={{ color: daysColor }}>
                  {item.estimated_days_left !== null
                    ? t.controlDaysLeft(item.estimated_days_left)
                    : t.controlNoUsageData
                  }
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
