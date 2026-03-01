'use client'

import { useState, useMemo } from 'react'
import { useSessions } from '@/lib/hooks/useSessions'
import { useInventory } from '@/lib/hooks/useInventory'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { calculateABCByUsage, calculateABCByRevenue, calculateABCByMargin } from '@/lib/utils/abcAnalysis'
import type { ABCResult, ABCCategory } from '@/lib/utils/abcAnalysis'
import { useTranslation, useLocale, formatCurrency } from '@/lib/i18n'
import { IconLock } from '@/components/Icons'
import Link from 'next/link'

type ABCMode = 'usage' | 'revenue' | 'margin'

const CATEGORY_COLORS: Record<ABCCategory, string> = {
  A: 'var(--color-success)',
  B: 'var(--color-warning)',
  C: 'var(--color-danger)',
}

export function ABCAnalysisPanel() {
  const tm = useTranslation('manage')
  const { locale } = useLocale()
  const { sessions } = useSessions()
  const { inventory } = useInventory()
  const { needsUpgrade } = useSubscription()
  const [mode, setMode] = useState<ABCMode>('usage')

  const result: ABCResult = useMemo(() => {
    switch (mode) {
      case 'usage':
        return calculateABCByUsage(sessions)
      case 'revenue':
        return calculateABCByRevenue(sessions)
      case 'margin':
        return calculateABCByMargin(sessions, inventory)
    }
  }, [sessions, inventory, mode])

  const modes: { key: ABCMode; label: string }[] = useMemo(() => [
    { key: 'usage', label: tm.abcByUsage },
    { key: 'revenue', label: tm.abcByRevenue },
    { key: 'margin', label: tm.abcByMargin },
  ], [tm])

  if (needsUpgrade) {
    return (
      <div className="card p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-3">
          <IconLock size={24} className="text-[var(--color-primary)]" />
        </div>
        <h3 className="font-semibold mb-1">{tm.abcProOnly}</h3>
        <p className="text-sm text-[var(--color-textMuted)] mb-3">{tm.abcProOnlyDesc}</p>
        <Link href="/pricing" className="btn btn-primary text-sm">
          {tm.upgradePlan}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex rounded-xl bg-[var(--color-bgHover)] p-1 w-fit">
        {modes.map(m => (
          <button type="button"
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === m.key
                ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {result.items.length === 0 ? (
        <div className="text-center py-8 text-[var(--color-textMuted)]">
          <p>{tm.abcNoData}</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            {(['A', 'B', 'C'] as ABCCategory[]).map(cat => (
              <div key={cat} className="p-3 rounded-xl bg-[var(--color-bgHover)] text-center">
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ color: CATEGORY_COLORS[cat] }}
                >
                  {cat}
                </div>
                <div className="text-sm font-medium">{result.summary[cat].count} {tm.abcItems}</div>
                <div className="text-xs text-[var(--color-textMuted)]">
                  {result.summary[cat].valuePercent.toFixed(0)}% {tm.abcOfValue}
                </div>
              </div>
            ))}
          </div>

          {/* Pareto bar */}
          <div className="h-6 rounded-full overflow-hidden flex bg-[var(--color-bgHover)]">
            {(['A', 'B', 'C'] as ABCCategory[]).map(cat => {
              const pct = result.summary[cat].valuePercent
              if (pct === 0) return null
              return (
                <div
                  key={cat}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: CATEGORY_COLORS[cat],
                  }}
                  className="flex items-center justify-center text-xs font-bold text-white"
                >
                  {pct >= 10 && `${pct.toFixed(0)}%`}
                </div>
              )
            })}
          </div>

          {/* Item list */}
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {result.items.map((item, i) => (
              <div
                key={item.tobaccoId}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-bgHover)]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                  >
                    {item.category}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{item.flavor}</div>
                    <div className="text-xs text-[var(--color-textMuted)]">{item.brand}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium">
                    {mode === 'usage' ? `${item.value.toFixed(0)}g` : formatCurrency(item.value, locale)}
                  </div>
                  <div className="text-xs text-[var(--color-textMuted)]">
                    {item.cumulativePercent.toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
