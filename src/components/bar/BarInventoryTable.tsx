'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import type { BarInventoryItem } from '@/types/database'
import { BAR_CATEGORY_LABELS, BAR_CATEGORY_EMOJI, BAR_UNIT_LABELS } from '@/data/bar-ingredients'

interface BarInventoryTableProps {
  inventory: BarInventoryItem[]
  onEdit: (item: BarInventoryItem) => void
  onDelete: (id: string) => void
  onAdjust: (id: string, amount: number) => void
  loading?: boolean
}

export function BarInventoryTable({ inventory, onEdit, onDelete, onAdjust, loading }: BarInventoryTableProps) {
  const t = useTranslation('bar')
  const [sortField, setSortField] = useState<keyof BarInventoryItem>('category')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filter, setFilter] = useState('')
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleSort = (field: keyof BarInventoryItem) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedInventory = [...inventory]
    .filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase()) ||
      (item.brand || '').toLowerCase().includes(filter.toLowerCase()) ||
      BAR_CATEGORY_LABELS[item.category].toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  const handleAdjust = (id: string) => {
    const amount = parseFloat(adjustAmount)
    if (!isNaN(amount) && amount !== 0) {
      onAdjust(id, amount)
    }
    setAdjustingId(null)
    setAdjustAmount('')
  }

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const getStockStatus = (item: BarInventoryItem) => {
    if (item.quantity <= 0) return { color: 'danger', label: t.stockNone }
    if (item.quantity < item.min_quantity) return { color: 'warning', label: t.stockLow }
    return { color: 'success', label: t.stockOk }
  }

  const formatQuantity = (item: BarInventoryItem) => {
    const unit = BAR_UNIT_LABELS[item.unit_type]
    if (item.unit_type === 'ml' && item.quantity >= 1000) {
      return `${(item.quantity / 1000).toFixed(1)}l`
    }
    if (item.unit_type === 'g' && item.quantity >= 1000) {
      return `${(item.quantity / 1000).toFixed(1)}kg`
    }
    return `${Math.round(item.quantity)}${unit}`
  }

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="w-8 h-8 mx-auto border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-[var(--color-textMuted)]">{t.loadingBarInventory}</p>
      </div>
    )
  }

  if (inventory.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-4xl mb-4">🍸</div>
        <h3 className="text-lg font-semibold mb-2">{t.barInventoryEmpty}</h3>
        <p className="text-[var(--color-textMuted)]">
          {t.addIngredientsToStart}
        </p>
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
          onChange={e => setFilter(e.target.value)}
          placeholder={t.searchByNameBrandCategory}
          className="w-full px-4 py-3 pl-10 rounded-xl bg-[var(--color-bgCard)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
        />
        <svg className="absolute left-3 top-3.5 w-5 h-5 text-[var(--color-textMuted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th
                  onClick={() => handleSort('category')}
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--color-textMuted)] uppercase cursor-pointer hover:text-[var(--color-text)]"
                >
                  {t.thCategory} {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--color-textMuted)] uppercase cursor-pointer hover:text-[var(--color-text)]"
                >
                  {t.ingredientName} {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('quantity')}
                  className="px-4 py-3 text-right text-xs font-medium text-[var(--color-textMuted)] uppercase cursor-pointer hover:text-[var(--color-text)]"
                >
                  {t.thStock} {sortField === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-textMuted)] uppercase">
                  {t.thStatus}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-textMuted)] uppercase">
                  {t.thActions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {sortedInventory.map(item => {
                const status = getStockStatus(item)
                return (
                  <tr key={item.id} className="hover:bg-[var(--color-bgHover)] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm">
                        {BAR_CATEGORY_EMOJI[item.category]} {BAR_CATEGORY_LABELS[item.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        {item.brand && (
                          <div className="text-xs text-[var(--color-textMuted)]">{item.brand}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {adjustingId === item.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={adjustAmount}
                            onChange={e => setAdjustAmount(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleAdjust(item.id)
                              if (e.key === 'Escape') { setAdjustingId(null); setAdjustAmount('') }
                            }}
                            placeholder="+/-"
                            autoFocus
                            className="w-20 px-2 py-1 text-sm text-right rounded-lg bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                          />
                          <button
                            onClick={() => handleAdjust(item.id)}
                            className="text-xs text-[var(--color-primary)] hover:underline"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAdjustingId(item.id)}
                          className="font-mono text-sm font-medium hover:text-[var(--color-primary)] transition-colors"
                          title={t.adjustStock}
                        >
                          {formatQuantity(item)}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-${status.color})]/10 text-[var(--color-${status.color})]`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(item)}
                          className="text-xs text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
                        >
                          {t.editShort}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className={`text-xs transition-colors ${
                            deleteConfirm === item.id
                              ? 'text-[var(--color-danger)] font-medium'
                              : 'text-[var(--color-textMuted)] hover:text-[var(--color-danger)]'
                          }`}
                        >
                          {deleteConfirm === item.id ? t.deleteConfirmQ : t.deleteShort}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
