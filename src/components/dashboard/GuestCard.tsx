'use client'

import type { Guest, LoyaltyTier } from '@/types/database'
import { useTranslation, useLocale, formatCurrency } from '@/lib/i18n'
import { IconStar, IconCoin } from '@/components/Icons'

const TIER_COLORS: Record<LoyaltyTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
}

const TIER_BG: Record<LoyaltyTier, string> = {
  bronze: 'rgba(205,127,50,0.15)',
  silver: 'rgba(192,192,192,0.15)',
  gold: 'rgba(255,215,0,0.15)',
}

interface GuestCardProps {
  guest: Guest
  onClick: () => void
}

export function GuestCard({ guest, onClick }: GuestCardProps) {
  const tm = useTranslation('manage')
  const { locale } = useLocale()

  const tierLabel = tm[`tier${guest.loyalty_tier.charAt(0).toUpperCase()}${guest.loyalty_tier.slice(1)}` as keyof typeof tm] as string

  return (
    <button type="button"
      onClick={onClick}
      className="card p-4 text-left hover:border-[var(--color-primary)]/50 transition-colors w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ backgroundColor: TIER_BG[guest.loyalty_tier], color: TIER_COLORS[guest.loyalty_tier] }}
          >
            {guest.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">{guest.name}</div>
            {guest.phone && (
              <div className="text-xs text-[var(--color-textMuted)]">{guest.phone}</div>
            )}
          </div>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: TIER_BG[guest.loyalty_tier], color: TIER_COLORS[guest.loyalty_tier] }}
        >
          {tierLabel}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <div className="text-[var(--color-textMuted)] text-xs">{tm.visits}</div>
          <div className="font-medium">{guest.visit_count}</div>
        </div>
        <div>
          <div className="text-[var(--color-textMuted)] text-xs">{tm.spent}</div>
          <div className="font-medium">{guest.total_spent > 0 ? formatCurrency(guest.total_spent, locale) : '—'}</div>
        </div>
        <div>
          <div className="text-[var(--color-textMuted)] text-xs">{tm.bonus}</div>
          <div className="font-medium text-[var(--color-success)]">
            {guest.bonus_balance > 0 ? formatCurrency(guest.bonus_balance, locale) : '—'}
          </div>
        </div>
      </div>

      {guest.notes && (
        <p className="mt-2 text-xs text-[var(--color-textMuted)] truncate">{guest.notes}</p>
      )}
    </button>
  )
}
