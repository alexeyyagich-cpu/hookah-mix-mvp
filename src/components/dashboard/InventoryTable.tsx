'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { ScrollableTable } from '@/components/ui/ScrollableTable'
import type { TobaccoInventory } from '@/types/database'
import type { ForecastResult } from '@/lib/utils/forecast'
import { formatForecastDays, getForecastColor } from '@/lib/utils/forecast'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { IconShop } from '@/components/Icons'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LOW_STOCK_THRESHOLD } from '@/lib/constants'

interface InventoryTableProps {
  inventory: TobaccoInventory[]
  forecasts?: Map<string, ForecastResult>
  lowStockThreshold?: number
  onEdit: (item: TobaccoInventory) => void
  onDelete: (id: string) => void
  onAdjust: (id: string, amount: number) => void
  loading?: boolean
}

export function InventoryTable({ inventory, forecasts, lowStockThreshold = LOW_STOCK_THRESHOLD, onEdit, onDelete, onAdjust, loading }: InventoryTableProps) {
  const t = useTranslation('hookah')
  const [sortField, setSortField] = useState<keyof TobaccoInventory>('brand')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filter, setFilter] = useState('')
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const { canUseMarketplace } = useSubscription()

  const handleSort = (field: keyof TobaccoInventory) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedInventory = useMemo(() => [...inventory]
    .filter(item =>
      item.brand.toLowerCase().includes(filter.toLowerCase()) ||
      item.flavor.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    }), [inventory, filter, sortField, sortDirection])

  const handleAdjust = (id: string) => {
    const amount = parseFloat(adjustAmount)
    if (!isNaN(amount) && amount !== 0) {
      onAdjust(id, amount)
    }
    setAdjustingId(null)
    setAdjustAmount('')
  }

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return { color: 'danger', label: t.statusOutOfStock }
    if (quantity < lowStockThreshold) return { color: 'warning', label: t.statusLow }
    return { color: 'success', label: t.statusInStock }
  }

  if (loading) {
    return (
      <div className="card p-8 text-center" role="status" aria-live="polite">
        <LoadingSpinner size="lg" className="mx-auto" />
        <p className="mt-4 text-[var(--color-textMuted)]">{t.loadingInventory}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
          className="w-full px-4 py-3 pl-10 rounded-xl bg-[var(--color-bgCard)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-textMuted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Table */}
      <ScrollableTable className="card p-0">
          <table className="w-full min-w-[640px]">
            <thead className="sticky top-0 z-10 bg-[var(--color-bgCard)]">
              <tr className="border-b border-[var(--color-border)]">
                <th
                  onClick={() => handleSort('brand')}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleSort('brand'))}
                  tabIndex={0}
                  role="columnheader"
                  aria-sort={sortField === 'brand' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)] cursor-pointer hover:text-[var(--color-text)]"
                >
                  {t.brandColumn} {sortField === 'brand' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('flavor')}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleSort('flavor'))}
                  tabIndex={0}
                  role="columnheader"
                  aria-sort={sortField === 'flavor' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)] cursor-pointer hover:text-[var(--color-text)]"
                >
                  {t.flavorColumn} {sortField === 'flavor' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('quantity_grams')}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleSort('quantity_grams'))}
                  tabIndex={0}
                  role="columnheader"
                  aria-sort={sortField === 'quantity_grams' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)] cursor-pointer hover:text-[var(--color-text)]"
                >
                  {t.remainingColumn} {sortField === 'quantity_grams' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                  {t.statusColumn}
                </th>
                {forecasts && (
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                    {t.forecastColumn}
                  </th>
                )}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--color-textMuted)]">
                  {t.actionsColumn}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {sortedInventory.length === 0 ? (
                <tr>
                  <td colSpan={forecasts ? 6 : 5} className="px-4 py-12 text-center text-[var(--color-textMuted)]">
                    {filter ? t.noResults : t.emptyInventory}
                  </td>
                </tr>
              ) : (
                sortedInventory.map((item) => {
                  const status = getStockStatus(item.quantity_grams)
                  const isAdjusting = adjustingId === item.id

                  return (
                    <tr key={item.id} className="hover:bg-[var(--color-bgHover)] transition-colors">
                      <td className="px-4 py-4 font-medium">{item.brand}</td>
                      <td className="px-4 py-4">{item.flavor}</td>
                      <td className="px-4 py-4 text-right">
                        {isAdjusting ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              inputMode="decimal"
                              value={adjustAmount}
                              onChange={(e) => setAdjustAmount(e.target.value)}
                              placeholder="+/-"
                              className="w-20 px-2 py-1 rounded-lg bg-[var(--color-bgHover)] border border-[var(--color-border)] text-right text-sm"
                              autoFocus
                            />
                            <button type="button"
                              onClick={() => handleAdjust(item.id)}
                              className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg hover:bg-[var(--color-success)]/20 text-[var(--color-success)] flex items-center justify-center"
                              aria-label={t.confirmAction}
                            >
                              ✓
                            </button>
                            <button type="button"
                              onClick={() => {
                                setAdjustingId(null)
                                setAdjustAmount('')
                              }}
                              className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg hover:bg-[var(--color-danger)]/20 text-[var(--color-danger)] flex items-center justify-center"
                              aria-label={t.cancelAction}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button type="button"
                            onClick={() => setAdjustingId(item.id)}
                            className="font-mono hover:text-[var(--color-primary)] transition-colors"
                          >
                            {item.quantity_grams.toFixed(0)}g
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`badge badge-${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      {forecasts && (
                        <td className="px-4 py-4 text-center">
                          {(() => {
                            const forecast = forecasts.get(item.id)
                            if (!forecast) return <span className="text-[var(--color-textMuted)]">—</span>
                            const color = getForecastColor(forecast.daysUntilEmpty)
                            const colorVar = color === 'muted' ? 'var(--color-textMuted)' :
                                             color === 'danger' ? 'var(--color-danger)' :
                                             color === 'warning' ? 'var(--color-warning)' :
                                             'var(--color-success)'
                            return (
                              <span
                                className="font-medium text-sm"
                                style={{ color: colorVar }}
                                title={forecast.confidence !== 'low' ? t.confidenceLabel(forecast.confidence) : t.confidenceLow}
                              >
                                {formatForecastDays(forecast.daysUntilEmpty)}
                              </span>
                            )
                          })()}
                        </td>
                      )}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Order button for low stock items */}
                          {canUseMarketplace && status.color !== 'success' && (
                            <Link
                              href="/marketplace"
                              className="min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors flex items-center justify-center"
                              title={t.orderAction}
                              aria-label={t.orderAction}
                            >
                              <IconShop size={16} />
                            </Link>
                          )}
                          <button type="button"
                            onClick={() => onEdit(item)}
                            className="min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors flex items-center justify-center"
                            title={t.editItem}
                            aria-label={t.editItem}
                          >
                            ✏️
                          </button>
                          <button type="button"
                            onClick={() => onDelete(item.id)}
                            className="min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-[var(--color-danger)]/10 text-[var(--color-textMuted)] hover:text-[var(--color-danger)] transition-colors flex items-center justify-center"
                            title={t.deleteItem}
                            aria-label={t.deleteItem}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
      </ScrollableTable>
    </div>
  )
}
