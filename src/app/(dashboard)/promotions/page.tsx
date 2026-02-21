'use client'

import { useState } from 'react'
import { usePromotions } from '@/lib/hooks/usePromotions'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useTranslation } from '@/lib/i18n'
import { IconPlus, IconLock, IconPercent, IconEdit, IconTrash, IconClose } from '@/components/Icons'
import Link from 'next/link'
import type { Promotion, PromoType, PromoRules } from '@/types/database'

const PROMO_TYPES: PromoType[] = ['happy_hour', 'nth_free', 'birthday', 'custom_discount']

const PROMO_ICONS: Record<PromoType, string> = {
  happy_hour: '🕐',
  nth_free: '🎁',
  birthday: '🎂',
  custom_discount: '🏷️',
}

export default function PromotionsPage() {
  const tm = useTranslation('manage')
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

  if (isFreeTier) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{tm.promosTitle}</h1>
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4">
            <IconLock size={32} className="text-[var(--color-primary)]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{tm.promosProOnly}</h3>
          <p className="text-[var(--color-textMuted)] mb-4">{tm.promosProOnlyDesc}</p>
          <Link href="/pricing" className="btn btn-primary">
            {tm.upgradePlan}
          </Link>
        </div>
      </div>
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
    if (!name.trim()) return

    const rules: PromoRules = { discount_percent: parseFloat(discountPercent) || 10 }
    if (type === 'happy_hour') {
      rules.start_hour = parseInt(startHour) || 14
      rules.end_hour = parseInt(endHour) || 17
    }
    if (type === 'nth_free') {
      rules.nth_visit = parseInt(nthVisit) || 5
      rules.discount_percent = 100
    }

    if (editingPromo) {
      await updatePromo(editingPromo.id, { name: name.trim(), type, rules, max_uses: maxUses ? parseInt(maxUses) : null })
    } else {
      await createPromo({ name: name.trim(), type, rules, max_uses: maxUses ? parseInt(maxUses) : null })
    }
    resetForm()
  }

  const promoTypeLabel = (t: PromoType) => tm[`promoType_${t}` as keyof typeof tm] as string

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tm.promosTitle}</h1>
          <p className="text-[var(--color-textMuted)]">{tm.promosSubtitle}</p>
        </div>
        <button
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
            <h3 className="font-semibold">{editingPromo ? tm.editPromo : tm.createPromo}</h3>
            <button onClick={resetForm} className="btn btn-ghost p-2"><IconClose size={18} /></button>
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
                    value={discountPercent}
                    onChange={e => setDiscountPercent(e.target.value)}
                    className="input w-24"
                    min="1"
                    max="100"
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
                    value={startHour}
                    onChange={e => setStartHour(e.target.value)}
                    className="input w-24 mt-1"
                    min="0"
                    max="23"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{tm.endHour}</label>
                  <input
                    type="number"
                    value={endHour}
                    onChange={e => setEndHour(e.target.value)}
                    className="input w-24 mt-1"
                    min="0"
                    max="23"
                  />
                </div>
              </>
            )}

            {type === 'nth_free' && (
              <div>
                <label className="text-sm font-medium">{tm.everyNthVisit}</label>
                <input
                  type="number"
                  value={nthVisit}
                  onChange={e => setNthVisit(e.target.value)}
                  className="input w-24 mt-1"
                  min="2"
                  max="50"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">{tm.maxUses}</label>
              <input
                type="number"
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                className="input w-24 mt-1"
                placeholder="∞"
                min="1"
              />
            </div>
          </div>

          <button onClick={handleSubmit} className="btn btn-primary">
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
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-bgHover)] flex items-center justify-center">
            <IconPercent size={32} className="text-[var(--color-textMuted)]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{tm.noPromos}</h3>
          <p className="text-[var(--color-textMuted)]">{tm.noPromosDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promotions.map(promo => (
            <div
              key={promo.id}
              className={`card p-4 flex items-center justify-between ${
                !promo.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{PROMO_ICONS[promo.type]}</span>
                <div>
                  <div className="font-semibold">{promo.name}</div>
                  <div className="text-sm text-[var(--color-textMuted)]">
                    {promoTypeLabel(promo.type)}
                    {promo.rules.discount_percent && ` · ${promo.rules.discount_percent}%`}
                    {promo.type === 'happy_hour' && ` · ${promo.rules.start_hour}:00–${promo.rules.end_hour}:00`}
                    {promo.type === 'nth_free' && ` · ${tm.everyNthVisit}: ${promo.rules.nth_visit}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-textMuted)]">
                  {promo.usage_count}×
                </span>
                <button
                  onClick={() => toggleActive(promo.id)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    promo.is_active ? 'bg-[var(--color-success)]' : 'bg-[var(--color-bgHover)]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    promo.is_active ? 'left-[18px]' : 'left-0.5'
                  }`} />
                </button>
                <button onClick={() => openEdit(promo)} className="btn btn-ghost p-2">
                  <IconEdit size={16} />
                </button>
                {confirmDeleteId === promo.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={async () => { await deletePromo(promo.id); setConfirmDeleteId(null) }}
                      className="btn btn-ghost text-[var(--color-danger)] text-xs"
                    >
                      {tm.delete}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="btn btn-ghost text-xs"
                    >
                      {tm.cancel}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(promo.id)} className="btn btn-ghost p-2 text-[var(--color-danger)]">
                    <IconTrash size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
