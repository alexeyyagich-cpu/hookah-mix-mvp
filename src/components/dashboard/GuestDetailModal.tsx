'use client'

import { useState, useEffect, useRef } from 'react'
import type { Guest, BonusTransaction, LoyaltyTier } from '@/types/database'
import { useTranslation, useLocale, formatCurrency, formatDate } from '@/lib/i18n'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'
import { IconClose, IconEdit, IconTrash, IconCoin } from '@/components/Icons'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

// Loyalty tier identity colors — intentionally not theme-variable
const TIER_COLORS: Record<LoyaltyTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
}

interface GuestDetailModalProps {
  guest: Guest
  bonusHistory: BonusTransaction[]
  onClose: () => void
  onUpdate: (updates: Partial<Guest>) => Promise<void>
  onDelete: () => Promise<void>
}

export function GuestDetailModal({ guest, bonusHistory, onClose, onUpdate, onDelete }: GuestDetailModalProps) {
  const tm = useTranslation('manage')
  const tc = useTranslation('common')
  const { locale } = useLocale()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(guest.name)
  const [phone, setPhone] = useState(guest.phone || '')
  const [notes, setNotes] = useState(guest.notes || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, true, onClose)
  useBodyScrollLock(true)

  // Sync state when guest changes (e.g. switching between guests while modal is open)
  useEffect(() => {
    setName(guest.name)
    setPhone(guest.phone || '')
    setNotes(guest.notes || '')
    setEditing(false)
    setShowDeleteConfirm(false)
  }, [guest.id])

  const handleSave = async () => {
    await onUpdate({
      name: name.trim(),
      phone: phone.trim() || null,
      notes: notes.trim() || null,
    })
    setEditing(false)
  }

  const tierLabel = tm[`tier${guest.loyalty_tier.charAt(0).toUpperCase()}${guest.loyalty_tier.slice(1)}` as keyof typeof tm] as string

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div ref={dialogRef} className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="guest-detail-title">
        <div
          className="bg-[var(--color-bgCard)] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl"
          onClick={e => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: `${TIER_COLORS[guest.loyalty_tier]}20`, color: TIER_COLORS[guest.loyalty_tier] }}
            >
              {guest.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 id="guest-detail-title" className="text-lg font-bold">{guest.name}</h2>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${TIER_COLORS[guest.loyalty_tier]}20`, color: TIER_COLORS[guest.loyalty_tier] }}
              >
                {tierLabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setEditing(!editing)} className="btn btn-ghost p-2" aria-label="Edit">
              <IconEdit size={18} />
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost p-2" aria-label={tc.close}>
              <IconClose size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-xl bg-[var(--color-bgHover)]">
              <div className="text-lg font-bold">{guest.visit_count}</div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.visits}</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-[var(--color-bgHover)]">
              <div className="text-lg font-bold">{formatCurrency(guest.total_spent, locale)}</div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.spent}</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-[var(--color-bgHover)]">
              <div className="text-lg font-bold text-[var(--color-success)]">{formatCurrency(guest.bonus_balance, locale)}</div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.bonus}</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-[var(--color-bgHover)]">
              <div className="text-lg font-bold">{guest.discount_percent > 0 ? `${guest.discount_percent}%` : '—'}</div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.discount}</div>
            </div>
          </div>

          {/* Edit Form or Info */}
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">{tm.guestNameLabel}</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input w-full mt-1"
                  aria-label={tm.guestNameLabel}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{tm.phone}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="input w-full mt-1"
                  aria-label={tm.phone}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{tm.notes}</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="input w-full mt-1 min-h-[80px]"
                  rows={3}
                  aria-label={tm.notes}
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleSave} className="btn btn-primary flex-1">{tm.save}</button>
                <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost flex-1">{tm.cancel}</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {guest.phone && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-textMuted)]">{tm.phone}</span>
                  <span>{guest.phone}</span>
                </div>
              )}
              {guest.last_visit_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-textMuted)]">{tm.lastVisit}</span>
                  <span>{formatDate(guest.last_visit_at, locale)}</span>
                </div>
              )}
              {guest.notes && (
                <div className="text-sm">
                  <span className="text-[var(--color-textMuted)]">{tm.notes}: </span>
                  <span>{guest.notes}</span>
                </div>
              )}
            </div>
          )}

          {/* Bonus History */}
          {bonusHistory.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <IconCoin size={16} />
                {tm.bonusHistory}
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {bonusHistory.map(tx => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bgHover)] text-sm"
                  >
                    <div>
                      <span className={tx.type === 'accrual' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
                        {tx.type === 'accrual' ? '+' : ''}{formatCurrency(tx.amount, locale)}
                      </span>
                      <span className="text-[var(--color-textMuted)] ml-2">{tx.description}</span>
                    </div>
                    <span className="text-xs text-[var(--color-textMuted)]">
                      {formatDate(tx.created_at, locale)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Mix */}
          {guest.last_mix_snapshot && (
            <div>
              <h3 className="font-semibold mb-2">{tm.lastMix}</h3>
              <div className="p-3 rounded-xl bg-[var(--color-bgHover)]">
                <div className="flex flex-wrap gap-1.5">
                  {guest.last_mix_snapshot.tobaccos.map((t, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-full text-[var(--color-bg)] font-medium"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.flavor} {t.percent}%
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-[var(--color-textMuted)]">
                  {guest.last_mix_snapshot.total_grams}g · {guest.last_mix_snapshot.bowl_type} · {guest.last_mix_snapshot.strength}
                </div>
              </div>
            </div>
          )}

          {/* Delete */}
          <div className="pt-2 border-t border-[var(--color-border)]">
            <button type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-ghost text-[var(--color-danger)] text-sm flex items-center gap-1"
            >
              <IconTrash size={14} />
              {tm.deleteGuest}
            </button>
          </div>

          <ConfirmDialog
            open={showDeleteConfirm}
            title={tm.deleteGuest}
            message={tm.confirmDeleteGuest}
            danger
            onConfirm={async () => {
              await onDelete()
              toast.success(tc.deleted)
              setShowDeleteConfirm(false)
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        </div>
      </div>
    </div>
    </>
  )
}
