'use client'

import Link from 'next/link'
import type { Shift, ShiftReconciliation } from '@/types/database'
import { useLocale, formatCurrency } from '@/lib/i18n'
import type { Dictionary } from '@/lib/i18n'

interface ShiftOverviewCardProps {
  activeShift: Shift | null
  reconciliation: ShiftReconciliation | null
  shiftDurationMs: number
  onQuickOpen: () => void
  opening: boolean
  tm: Dictionary['manage']
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

export function ShiftOverviewCard({ activeShift, reconciliation, shiftDurationMs, onQuickOpen, opening, tm }: ShiftOverviewCardProps) {
  const { locale } = useLocale()

  if (!activeShift) {
    return (
      <div className="card p-5">
        <div className="text-xs text-[var(--color-textMuted)] uppercase font-semibold mb-3">
          {tm.bossCurrentShift}
        </div>
        <div className="text-center py-4">
          <p className="font-medium mb-1">{tm.bossNoActiveShift}</p>
          <p className="text-sm text-[var(--color-textMuted)] mb-4">{tm.bossNoActiveShiftHint}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={onQuickOpen}
              disabled={opening}
              className="btn btn-primary text-sm disabled:opacity-50"
            >
              {tm.bossQuickOpen}
            </button>
            <Link href="/shifts" className="btn btn-ghost text-sm">
              {tm.bossGoToShifts}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const r = reconciliation

  return (
    <div className="card p-5 border border-[var(--color-success)]/30">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-[var(--color-textMuted)] uppercase font-semibold">
          {tm.bossCurrentShift}
        </div>
        <Link href="/shifts" className="text-xs text-[var(--color-primary)] hover:underline">
          {tm.bossGoToShifts}
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {activeShift.opened_by_name && (
          <div>
            <div className="text-[10px] text-[var(--color-textMuted)] uppercase">{tm.bossOpenedBy}</div>
            <div className="text-sm font-semibold truncate">{activeShift.opened_by_name}</div>
          </div>
        )}
        <div>
          <div className="text-[10px] text-[var(--color-textMuted)] uppercase">Duration</div>
          <div className="text-sm font-semibold">{formatDuration(shiftDurationMs)}</div>
        </div>
        {activeShift.starting_cash !== null && (
          <div>
            <div className="text-[10px] text-[var(--color-textMuted)] uppercase">Cash</div>
            <div className="text-sm font-semibold">{formatCurrency(activeShift.starting_cash, locale)}</div>
          </div>
        )}
        {r && (
          <>
            <div>
              <div className="text-[10px] text-[var(--color-textMuted)] uppercase">Sessions</div>
              <div className="text-sm font-semibold">{r.hookah.sessionsCount}</div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--color-textMuted)] uppercase">Bar Sales</div>
              <div className="text-sm font-semibold">{r.bar.salesCount}</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
