'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { usePromotions } from '@/lib/hooks/usePromotions'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useTranslation } from '@/lib/i18n'
import { IconPlus, IconLock, IconPercent, IconEdit, IconTrash, IconClose } from '@/components/Icons'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import type { Promotion, PromoType, PromoRules } from '@/types/database'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const PROMO_TYPES: PromoType[] = ['happy_hour', 'nth_free', 'birthday', 'custom_discount']

const PROMO_ICONS: Record<PromoType, string> = {
  happy_hour: '🕐',
  nth_free: '🎁',
  birthday: '🎂',
  custom_discount: '🏷️',
}

export default function PromotionsPage() {
  const tm = useTranslation('manage')
  const tc = useTranslation('common')
  const { promotions, loading, createPromo, updatePromo, deletePromo, toggleActive } = usePromotions()
  const { isFreeTier } = useSubscription()

  const [showForm, setShowForm] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<PromoType>('happy_hour')
  const [discountPercent, setDiscountPercent] = useState('10')
  const [startHour, setStartHour] = useState('14')
  const [endHour, setEndHour] = useState('17')
  const [nthVisit, setNthVisit] = useState('5')
  const [maxUses, setMaxUses] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isFreeTier) {
    return (
      <ErrorBoundary>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{tm.promosTitle}</h1>
        <EmptyState
          icon={<IconLock size={32} />}
          title={tm.promosProOnly}
          description={tm.promosProOnlyDesc}
          action={{ label: tm.upgradePlan, href: '/pricing' }}
        />
      </div>
      </ErrorBoundary>
    )
  }

  const resetForm = () => {
    setName('')
    setType('happy_hour')
    setDiscountPercent('10')
    setStartHour('14')
    setEndHour('17')
    setNthVisit('5')
    setMaxUses('')
    setEditingPromo(null)
    setShowForm(false)
  }

  const openEdit = (promo: Promotion) => {
    setEditingPromo(promo)
    setName(promo.name)
    setType(promo.type)
    setDiscountPercent((promo.rules.discount_percent || 10).toString())
    setStartHour((promo.rules.start_hour || 14).toString())
    setEndHour((promo.rules.end_hour || 17).toString())
    setNthVisit((promo.rules.nth_visit || 5).toString())
    setMaxUses(promo.max_uses?.toString() || '')
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return
    setSubmitting(true)

    const rules: PromoRules = { discount_percent: parseFloat(discountPercent) || 10 }
    if (type === 'happy_hour') {
      rules.start_hour = parseInt(startHour) || 14
      rules.end_hour = parseInt(endHour) || 17
    }
    if (type === 'nth_free') {
      rules.nth_visit = parseInt(nthVisit) || 5
      rules.discount_percent = 100
    }

    try {
      if (editingPromo) {
        await updatePromo(editingPromo.id, { name: name.trim(), type, rules, max_uses: maxUses ? parseInt(maxUses) : null })
      } else {
        await createPromo({ name: name.trim(), type, rules, max_uses: maxUses ? parseInt(maxUses) : null })
      }
      toast.success(tc.saved)
      resetForm()
    } catch {
      toast.error(tc.errorSaving)
    } finally {
      setSubmitting(false)
    }
  }

  const promoTypeLabel = (t: PromoType) => tm[`promoType_${t}` as keyof typeof tm] as string

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tm.promosTitle}</h1>
          <p className="text-[var(--color-textMuted)]">{tm.promosSubtitle}</p>
        </div>
        <button type="button"
          onClick={() => { resetForm(); setShowForm(true) }}
          className="btn btn-primary flex items-center gap-2"
        >
          <IconPlus size={18} />
          {tm.createPromo}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{editingPromo ? tm.editPromo : tm.createPromo}</h3>
            <button type="button" onClick={resetForm} className="btn btn-ghost p-2" aria-label={tc.close}><IconClose size={18} /></button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{tm.promoName}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input w-full mt-1"
                placeholder={tm.promoNamePlaceholder}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{tm.promoTypeLabel}</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as PromoType)}
                className="input w-full mt-1"
              >
                {PROMO_TYPES.map(t => (
                  <option key={t} value={t}>{PROMO_ICONS[t]} {promoTypeLabel(t)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Type-specific fields */}
          <div className="grid sm:grid-cols-3 gap-4">
            {type !== 'nth_free' && (
              <div>
                <label className="text-sm font-medium">{tm.discountPercent}</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={discountPercent}
                    onChange={e => setDiscountPercent(e.target.value)}
                    className="input w-24"
                    min="1"
                    max="100"
                    step="0.5"
                  />
                  <span className="text-sm">%</span>
                </div>
              </div>
            )}

            {type === 'happy_hour' && (
              <>
                <div>
                  <label className="text-sm font-medium">{tm.startHour}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={startHour}
                    onChange={e => setStartHour(e.target.value)}
                    className="input w-24 mt-1"
                    min="0"
                    max="23"
                    step="1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{tm.endHour}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={endHour}
                    onChange={e => setEndHour(e.target.value)}
                    className="input w-24 mt-1"
                    min="0"
                    max="23"
                    step="1"
                  />
                </div>
              </>
            )}

            {type === 'nth_free' && (
              <div>
                <label className="text-sm font-medium">{tm.everyNthVisit}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={nthVisit}
                  onChange={e => setNthVisit(e.target.value)}
                  className="input w-24 mt-1"
                  min="2"
                  max="50"
                  step="1"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">{tm.maxUses}</label>
              <input
                type="number"
                inputMode="numeric"
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                className="input w-24 mt-1"
                placeholder="∞"
                min="1"
                step="1"
              />
            </div>
          </div>

          <button type="button" onClick={handleSubmit} disabled={submitting || !name.trim()} className="btn btn-primary disabled:opacity-50 flex items-center gap-2">
            {submitting && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            {editingPromo ? tm.save : tm.createPromo}
          </button>
        </div>
      )}

      {/* Promo List */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-8 h-8 mx-auto border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : promotions.length === 0 ? (
        <EmptyState
          icon={<IconPercent size={32} />}
          title={tm.noPromos}
          description={tm.noPromosDesc}
        />
      ) : (
        <div className="space-y-3">
          {promotions.map(promo => (
            <div
              key={promo.id}
              className={`card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                !promo.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-2xl shrink-0">{PROMO_ICONS[promo.type]}</span>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{promo.name}</div>
                  <div className="text-sm text-[var(--color-textMuted)]">
                    {promoTypeLabel(promo.type)}
                    {promo.rules.discount_percent && ` · ${promo.rules.discount_percent}%`}
                    {promo.type === 'happy_hour' && ` · ${promo.rules.start_hour}:00–${promo.rules.end_hour}:00`}
                    {promo.type === 'nth_free' && ` · ${tm.everyNthVisit}: ${promo.rules.nth_visit}`}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-[var(--color-textMuted)]">
                  {promo.usage_count}×
                </span>
                <button type="button"
                  onClick={() => toggleActive(promo.id)}
                  className={`shrink-0 w-10 h-6 rounded-full transition-colors relative ${
                    promo.is_active ? 'bg-[var(--color-success)]' : 'bg-[var(--color-bgHover)]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    promo.is_active ? 'translate-x-4' : ''
                  }`} />
                </button>
                <button type="button" onClick={() => openEdit(promo)} className="btn btn-ghost p-2">
                  <IconEdit size={16} />
                </button>
                {confirmDeleteId === promo.id ? (
                  <div className="flex gap-1">
                    <button type="button"
                      onClick={async () => { try { await deletePromo(promo.id); toast.success(tc.deleted) } catch { toast.error(tc.errorDeleting) } finally { setConfirmDeleteId(null) } }}
                      className="btn btn-ghost text-[var(--color-danger)] text-xs"
                    >
                      {tm.delete}
                    </button>
                    <button type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="btn btn-ghost text-xs"
                    >
                      {tm.cancel}
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDeleteId(promo.id)} className="btn btn-ghost p-2 text-[var(--color-danger)]">
                    <IconTrash size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </ErrorBoundary>
  )
}
