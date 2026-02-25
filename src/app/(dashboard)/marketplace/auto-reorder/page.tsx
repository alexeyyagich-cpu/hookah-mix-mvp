'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAutoReorder, AutoReorderRuleWithDetails } from '@/lib/hooks/useAutoReorder'
import { useInventory } from '@/lib/hooks/useInventory'
import { useSuppliers } from '@/lib/hooks/useSuppliers'
import { useSupplierProducts, DEMO_PRODUCTS } from '@/lib/hooks/useSupplierProducts'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { AutoReorderModal } from '@/components/marketplace/AutoReorderModal'
import {
  IconChevronLeft,
  IconRefresh,
  IconPlus,
  IconTrash,
  IconLock,
  IconCheck,
  IconClose,
} from '@/components/Icons'
import { useTranslation, useLocale, LOCALE_MAP } from '@/lib/i18n'
import type { TobaccoInventory } from '@/types/database'

export default function AutoReorderPage() {
  const t = useTranslation('market')
  const { locale } = useLocale()
  const { rules, loading, error, createRule, deleteRule, toggleRule } = useAutoReorder()
  const { inventory } = useInventory()
  const { suppliers } = useSuppliers()
  const { products } = useSupplierProducts()
  const { canUseAutoReorder } = useSubscription()

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTobacco, setSelectedTobacco] = useState<TobaccoInventory | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Get inventory items that don't have rules yet
  const inventoryWithoutRules = inventory.filter(inv =>
    !rules.find(r => r.tobacco_inventory_id === inv.id)
  )

  const handleOpenModal = (tobacco: TobaccoInventory) => {
    setSelectedTobacco(tobacco)
    setModalOpen(true)
  }

  const handleSaveRule = async (data: {
    supplier_product_id: string
    threshold_grams: number
    reorder_quantity: number
  }): Promise<boolean> => {
    if (!selectedTobacco) return false

    const result = await createRule({
      tobacco_inventory_id: selectedTobacco.id,
      ...data,
    })
    return !!result
  }

  const handleDeleteRule = async (id: string) => {
    if (deleteConfirm === id) {
      await deleteRule(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const getRuleDetails = (rule: AutoReorderRuleWithDetails) => {
    const tobacco = inventory.find(inv => inv.id === rule.tobacco_inventory_id)
    const product = products.find(p => p.id === rule.supplier_product_id) ||
      DEMO_PRODUCTS.find(p => p.id === rule.supplier_product_id)
    const supplier = product ? suppliers.find(s => s.id === product.supplier_id) : null

    return { tobacco, product, supplier }
  }

  // Paywall for non-enterprise users
  if (!canUseAutoReorder) {
    return (
      <div className="space-y-6">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
        >
          <IconChevronLeft size={20} />
          {t.backToMarketplace}
        </Link>

        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4">
            <IconLock size={32} className="text-[var(--color-primary)]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t.availableOnEnterprise}</h2>
          <p className="text-[var(--color-textMuted)] mb-6 max-w-md mx-auto">
            {t.autoReorderPaywallDesc}
          </p>
          <Link href="/pricing" className="btn btn-primary">
            {t.upgradeToEnterprise}
          </Link>
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
        {t.backToMarketplace}
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <IconRefresh size={28} className="text-[var(--color-primary)]" />
          <div>
            <h1 className="text-2xl font-bold">{t.autoReorderTitle}</h1>
            <p className="text-[var(--color-textMuted)]">
              {t.autoReorderSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <p className="text-[var(--color-danger)]">{error}</p>
        </div>
      )}

      {/* Active rules */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">{t.activeRules(rules.length)}</h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-bgHover)]" />
                  <div className="flex-1">
                    <div className="h-4 bg-[var(--color-bgHover)] rounded w-1/3 mb-2" />
                    <div className="h-3 bg-[var(--color-bgHover)] rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div className="card p-8 text-center text-[var(--color-textMuted)]">
            {t.noActiveRules}
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map(rule => {
              const { tobacco, product, supplier } = getRuleDetails(rule)
              if (!tobacco) return null

              return (
                <div key={rule.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Status indicator */}
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                          rule.is_enabled
                            ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                            : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)]'
                        }`}
                      >
                        {rule.is_enabled ? <IconCheck size={24} /> : <IconClose size={24} />}
                      </button>

                      <div>
                        <div className="font-medium">
                          {tobacco.brand} {tobacco.flavor}
                        </div>
                        <div className="text-sm text-[var(--color-textMuted)]">
                          {t.thresholdLabel(rule.threshold_grams)} • {t.orderQtyLabel(rule.reorder_quantity)}
                        </div>
                        {supplier && product && (
                          <div className="text-xs text-[var(--color-textMuted)] mt-1">
                            {supplier.name} • {t.packagePriceInfo(product.package_grams, product.price)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Current stock */}
                      <div className="text-right">
                        <div className="text-sm text-[var(--color-textMuted)]">{t.stockLabel}</div>
                        <div className={`font-semibold ${
                          tobacco.quantity_grams <= rule.threshold_grams
                            ? 'text-[var(--color-danger)]'
                            : ''
                        }`}>
                          {t.totalGrams(parseInt(tobacco.quantity_grams.toFixed(0)))}
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          deleteConfirm === rule.id
                            ? 'bg-[var(--color-danger)] text-white'
                            : 'text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10'
                        }`}
                      >
                        <IconTrash size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Triggered indicator */}
                  {tobacco.quantity_grams <= rule.threshold_grams && rule.is_enabled && (
                    <div className="mt-3 pt-3 border-t border-[var(--color-border)] text-sm text-[var(--color-warning)]">
                      {t.belowThresholdWarning}
                    </div>
                  )}

                  {rule.last_triggered_at && (
                    <div className="mt-2 text-xs text-[var(--color-textMuted)]">
                      {t.lastOrder} {new Date(rule.last_triggered_at).toLocaleDateString(LOCALE_MAP[locale] || 'ru-RU')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add new rule */}
      {inventoryWithoutRules.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">{t.addRule}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventoryWithoutRules.map(tobacco => (
              <button
                key={tobacco.id}
                onClick={() => handleOpenModal(tobacco)}
                className="card p-4 text-left hover:border-[var(--color-primary)]/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[var(--color-textMuted)]">{tobacco.brand}</div>
                    <div className="font-medium">{tobacco.flavor}</div>
                    <div className="text-sm text-[var(--color-textMuted)]">
                      {t.totalGrams(parseInt(tobacco.quantity_grams.toFixed(0)))}
                    </div>
                  </div>
                  <IconPlus
                    size={20}
                    className="text-[var(--color-textMuted)] group-hover:text-[var(--color-primary)] transition-colors"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation toast */}
      {deleteConfirm && (
        <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-[var(--color-danger)] text-white shadow-lg animate-fadeInUp">
          {t.clickAgainToConfirmDelete}
        </div>
      )}

      {/* Auto Reorder Modal */}
      {selectedTobacco && (
        <AutoReorderModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedTobacco(null)
          }}
          tobacco={selectedTobacco}
          suppliers={suppliers}
          products={products.length > 0 ? products : DEMO_PRODUCTS}
          onSave={handleSaveRule}
        />
      )}
    </div>
  )
}
