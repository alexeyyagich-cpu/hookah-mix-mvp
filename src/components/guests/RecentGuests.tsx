'use client'

import { useState, useCallback } from 'react'
import { useGuests } from '@/lib/hooks/useGuests'
import { useInventory } from '@/lib/hooks/useInventory'
import {
  quickRepeatGuest,
  formatHeatSetup,
  type QuickRepeatResult,
  type QuickRepeatError,
} from '@/logic/quickRepeatEngine'
import { IconFire } from '@/components/Icons'
import type { Guest, MixSnapshot } from '@/types/database'
import { TOBACCOS } from '@/data/tobaccos'

interface RecentGuestsProps {
  onRepeatMix: (snapshot: MixSnapshot, tobaccos: { tobacco: typeof TOBACCOS[0]; percent: number }[]) => void
  isPro?: boolean
}

export function RecentGuests({ onRepeatMix, isPro = false }: RecentGuestsProps) {
  const { recentGuests, loading, isOffline, searchGuests } = useGuests()
  const { inventory, loading: inventoryLoading } = useInventory()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [repeatResult, setRepeatResult] = useState<QuickRepeatResult | QuickRepeatError | null>(null)

  // Get guests to display (search results or recent)
  const displayGuests = searchQuery.trim()
    ? searchGuests(searchQuery)
    : recentGuests

  // Handle guest selection
  const handleSelectGuest = useCallback((guest: Guest) => {
    setSelectedGuest(guest)

    // Immediately try quick repeat
    // Only pass inventory if Pro and inventory is loaded with items
    const inventoryToCheck = isPro && !inventoryLoading && inventory.length > 0 ? inventory : null
    const result = quickRepeatGuest(guest, inventoryToCheck)
    setRepeatResult(result)
  }, [inventory, inventoryLoading, isPro])

  // Handle quick repeat action
  const handleQuickRepeat = useCallback(() => {
    if (!repeatResult || !repeatResult.success) return

    const tobaccos = repeatResult.tobaccos
      .filter(t => t.available || t.replacement)
      .map(t => ({
        tobacco: t.replacement || t.tobacco,
        percent: t.percent,
      }))

    if (tobaccos.length >= 2) {
      onRepeatMix(repeatResult.snapshot, tobaccos)
      // Reset state
      setSelectedGuest(null)
      setRepeatResult(null)
      setSearchQuery('')
    }
  }, [repeatResult, onRepeatMix])

  // Close guest detail
  const handleClose = useCallback(() => {
    setSelectedGuest(null)
    setRepeatResult(null)
  }, [])

  if (loading) {
    return (
      <div className="p-4 text-center" style={{ color: 'var(--color-textMuted)' }}>
        Загрузка гостей...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Offline indicator */}
      {isOffline && (
        <div
          className="px-3 py-2 rounded-lg text-xs flex items-center gap-2"
          style={{
            background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
            color: 'var(--color-warning)',
          }}
        >
          <span>📴</span>
          <span>Офлайн режим — данные из кэша</span>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск гостя по имени..."
          className="w-full px-4 py-3 pl-10 rounded-xl text-sm"
          style={{
            background: 'var(--color-bgHover)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-lg"
          style={{ color: 'var(--color-textMuted)' }}
        >
          🔍
        </span>
      </div>

      {/* Selected Guest Detail (Quick Repeat View) */}
      {selectedGuest && repeatResult && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--color-bgCard)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Guest header */}
          <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
              >
                {selectedGuest.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  {selectedGuest.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                  {selectedGuest.visit_count} визитов
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-bgHover)', color: 'var(--color-textMuted)' }}
            >
              ×
            </button>
          </div>

          {/* Mix content */}
          {repeatResult.success ? (
            <div className="p-4 space-y-4">
              {/* Mix preview */}
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: 'var(--color-textMuted)' }}>
                  Последний микс
                </p>
                {repeatResult.tobaccos.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg"
                    style={{ background: 'var(--color-bgHover)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: item.tobacco.color }}
                      />
                      <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                        {item.tobacco.flavor}
                      </span>
                      {!item.available && item.replacement && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--color-warning)', color: 'white' }}>
                          → {item.replacement.flavor}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {item.percent}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Mix info */}
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-textMuted)' }}>
                {repeatResult.snapshot.compatibility_score && (
                  <span>Совместимость: <strong style={{ color: 'var(--color-success)' }}>{repeatResult.snapshot.compatibility_score}%</strong></span>
                )}
                {repeatResult.snapshot.bowl_type && (
                  <span>Чаша: {repeatResult.snapshot.bowl_type}</span>
                )}
                <span>{repeatResult.snapshot.total_grams}г</span>
              </div>

              {/* Heat recommendation */}
              <div
                className="p-3 rounded-lg flex items-center gap-2"
                style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
              >
                <IconFire size={18} className="text-[var(--color-warning)]" />
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {formatHeatSetup(repeatResult.snapshot.heat_setup)}
                </span>
              </div>

              {/* Warnings */}
              {repeatResult.warnings.length > 0 && (
                <div className="space-y-1">
                  {repeatResult.warnings.map((warning, idx) => (
                    <div
                      key={idx}
                      className="text-xs p-2 rounded-lg"
                      style={{
                        background: warning.type === 'OUT_OF_STOCK'
                          ? 'color-mix(in srgb, var(--color-danger) 15%, transparent)'
                          : 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
                        color: warning.type === 'OUT_OF_STOCK' ? 'var(--color-danger)' : 'var(--color-warning)',
                      }}
                    >
                      {warning.message}
                    </div>
                  ))}
                </div>
              )}

              {/* QUICK REPEAT BUTTON */}
              <button
                onClick={handleQuickRepeat}
                className="w-full py-4 rounded-xl font-semibold text-lg transition-transform active:scale-[0.98]"
                style={{
                  background: 'var(--color-success)',
                  color: 'white',
                }}
              >
                🔄 Повторить последний микс
              </button>
            </div>
          ) : (
            <div className="p-4">
              <div
                className="p-4 rounded-xl text-center"
                style={{
                  background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
                  color: 'var(--color-warning)',
                }}
              >
                <p className="text-2xl mb-2">😔</p>
                <p className="font-medium">{repeatResult.message}</p>
                {repeatResult.error === 'NO_LAST_MIX' && (
                  <p className="text-xs mt-2 opacity-80">
                    Создайте микс для этого гостя
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guest list */}
      {!selectedGuest && (
        <div className="space-y-2">
          {displayGuests.length === 0 ? (
            <div className="p-6 text-center" style={{ color: 'var(--color-textMuted)' }}>
              {searchQuery ? 'Гости не найдены' : 'Нет недавних гостей'}
            </div>
          ) : (
            displayGuests.map(guest => (
              <button
                key={guest.id}
                onClick={() => handleSelectGuest(guest)}
                className="w-full p-3 rounded-xl flex items-center gap-3 transition-colors hover:bg-[var(--color-bgHover)] text-left"
                style={{ background: 'var(--color-bgAccent)' }}
              >
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
                >
                  {guest.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text)' }}>
                    {guest.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {guest.last_mix_snapshot ? (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--color-success)', color: 'white' }}>
                        Есть микс
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                        Нет микса
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                      {guest.visit_count} визитов
                    </span>
                  </div>
                </div>

                {/* Quick repeat indicator */}
                {guest.last_mix_snapshot && (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: 'var(--color-success)', color: 'white' }}
                  >
                    🔄
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
