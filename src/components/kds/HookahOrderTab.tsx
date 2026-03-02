'use client'

import { useMemo } from 'react'
import { useTranslation } from '@/lib/i18n'
import { IconClose, IconSearch } from '@/components/Icons'
import { TOBACCOS, type Tobacco } from '@/data/tobaccos'
import type { BowlType, TobaccoInventory, Guest, FloorTable, StrengthPreference } from '@/types/database'
import type { SelectedTobacco } from '@/types/shared'

export interface HookahOrderTabProps {
  hookahMode: 'structured' | 'freetext'
  setHookahMode: (mode: 'structured' | 'freetext') => void
  hookahDescription: string
  setHookahDescription: (value: string) => void
  selectedTobaccos: SelectedTobacco[]
  setSelectedTobaccos: React.Dispatch<React.SetStateAction<SelectedTobacco[]>>
  selectedBowlId: string | null
  setSelectedBowlId: (id: string | null) => void
  totalGrams: number
  setTotalGrams: (grams: number) => void
  tobaccoSearch: string
  setTobaccoSearch: (value: string) => void
  bowls: BowlType[]
  inventory: TobaccoInventory[]
  guests: Guest[]
  selectedTableId: string | null
  tables: FloorTable[]
  // Computed values from parent (also needed by handleSubmit)
  selectedBowl: BowlType | null
  heatSetup: { coals: number; packing: string } | null
  mixStrength: StrengthPreference | null
  compatibilityScore: number | null
}

export default function HookahOrderTab({
  hookahMode,
  setHookahMode,
  hookahDescription,
  setHookahDescription,
  selectedTobaccos,
  setSelectedTobaccos,
  selectedBowlId,
  setSelectedBowlId,
  totalGrams,
  setTotalGrams,
  tobaccoSearch,
  setTobaccoSearch,
  bowls,
  inventory,
  guests,
  selectedTableId,
  tables,
  selectedBowl,
  heatSetup,
  compatibilityScore,
}: HookahOrderTabProps) {
  const t = useTranslation('manage')

  // Find guest for selected table (for "use last mix" feature)
  const tableGuest = useMemo(() => {
    const table = tables.find(tbl => tbl.id === selectedTableId)
    const guestName = table?.current_guest_name || null
    if (!guestName) return null
    return guests.find(g => g.name === guestName) || null
  }, [selectedTableId, tables, guests])

  // Tobacco search results
  const tobaccoResults = useMemo(() => {
    if (!tobaccoSearch.trim()) return TOBACCOS.slice(0, 20)
    const q = tobaccoSearch.toLowerCase()
    return TOBACCOS.filter(
      t => t.flavor.toLowerCase().includes(q) || t.brand.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [tobaccoSearch])

  // Inventory lookup for stock display
  const getStock = (tobacco: Tobacco): number | null => {
    const inv = inventory.find(
      i => i.tobacco_id === tobacco.id ||
        (i.brand.toLowerCase() === tobacco.brand.toLowerCase() && i.flavor.toLowerCase() === tobacco.flavor.toLowerCase())
    )
    return inv ? inv.quantity_grams : null
  }

  const addTobacco = (tobacco: Tobacco) => {
    if (selectedTobaccos.find(st => st.tobacco.id === tobacco.id)) return
    if (selectedTobaccos.length >= 5) return

    setSelectedTobaccos(prev => {
      const newCount = prev.length + 1
      const equalPercent = Math.floor(100 / newCount)
      const remainder = 100 - equalPercent * newCount

      return [
        ...prev.map((st, i) => ({ ...st, percent: equalPercent + (i === 0 ? remainder : 0) })),
        { tobacco, percent: equalPercent },
      ]
    })
    setTobaccoSearch('')
  }

  const removeTobacco = (tobaccoId: string) => {
    setSelectedTobaccos(prev => {
      const filtered = prev.filter(st => st.tobacco.id !== tobaccoId)
      if (filtered.length === 0) return []
      const equalPercent = Math.floor(100 / filtered.length)
      const remainder = 100 - equalPercent * filtered.length
      return filtered.map((st, i) => ({ ...st, percent: equalPercent + (i === 0 ? remainder : 0) }))
    })
  }

  const updatePercent = (tobaccoId: string, newPercent: number) => {
    setSelectedTobaccos(prev => {
      const idx = prev.findIndex(st => st.tobacco.id === tobaccoId)
      if (idx === -1) return prev

      newPercent = Math.max(5, Math.min(95, newPercent))
      const oldPercent = prev[idx].percent
      const delta = newPercent - oldPercent
      const othersTotal = 100 - oldPercent
      if (othersTotal === 0) return prev

      return prev.map((st, i) => {
        if (i === idx) return { ...st, percent: newPercent }
        const share = st.percent / othersTotal
        const adjusted = Math.max(5, Math.round(st.percent - delta * share))
        return { ...st, percent: adjusted }
      })
    })
  }

  const useLastMix = () => {
    if (!tableGuest?.last_mix_snapshot) return
    const snap = tableGuest.last_mix_snapshot

    const tobaccos: SelectedTobacco[] = snap.tobaccos
      .map(st => {
        const tobacco = TOBACCOS.find(t => t.id === st.tobacco_id)
        if (!tobacco) return null
        return { tobacco, percent: st.percent }
      })
      .filter((st): st is SelectedTobacco => st !== null)

    if (tobaccos.length > 0) {
      setSelectedTobaccos(tobaccos)
      setTotalGrams(snap.total_grams)
      if (snap.bowl_type) {
        const bowl = bowls.find(b => b.name === snap.bowl_type)
        if (bowl) setSelectedBowlId(bowl.id)
      }
      setHookahMode('structured')
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex bg-[var(--color-bgHover)] rounded-xl p-1 w-fit">
        <button type="button"
          onClick={() => setHookahMode('structured')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            hookahMode === 'structured'
              ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
              : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
          }`}
        >
          {t.hookahModeStructured}
        </button>
        <button type="button"
          onClick={() => setHookahMode('freetext')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            hookahMode === 'freetext'
              ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
              : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
          }`}
        >
          {t.hookahModeFreetext}
        </button>
      </div>

      {hookahMode === 'freetext' ? (
        <textarea
          value={hookahDescription}
          onChange={e => setHookahDescription(e.target.value)}
          placeholder={t.placeholderHookahMix}
          rows={3}
          className="input text-sm resize-none"
        />
      ) : (
        <div className="space-y-4">
          {/* Use last mix button */}
          {tableGuest?.last_mix_snapshot && (
            <button type="button"
              onClick={useLastMix}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border border-dashed border-[var(--color-success)] text-[var(--color-success)] hover:bg-[var(--color-success)]/10 transition-colors"
            >
              {t.useLastMix(tableGuest.name)}
            </button>
          )}

          {/* Tobacco search */}
          <div className="relative">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-textMuted)]" />
            <input
              type="text"
              value={tobaccoSearch}
              onChange={e => setTobaccoSearch(e.target.value)}
              placeholder={t.tobaccoSearch}
              aria-label={t.tobaccoSearch}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm"
            />
          </div>

          {/* Tobacco results */}
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
            {tobaccoResults.length === 0 ? (
              <p className="text-sm text-[var(--color-textMuted)] py-2">{t.noTobaccoResults}</p>
            ) : (
              tobaccoResults.map(tobacco => {
                const isSelected = selectedTobaccos.some(st => st.tobacco.id === tobacco.id)
                const stock = getStock(tobacco)
                return (
                  <button type="button"
                    key={tobacco.id}
                    onClick={() => addTobacco(tobacco)}
                    disabled={isSelected || selectedTobaccos.length >= 5}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:scale-105 active:scale-95 cursor-pointer'
                    }`}
                    style={{
                      background: tobacco.color + '15',
                      color: tobacco.color,
                      border: `1px solid ${tobacco.color}${isSelected ? '20' : '40'}`,
                    }}
                  >
                    <span className="truncate max-w-[120px]">{tobacco.brand} {tobacco.flavor}</span>
                    {stock !== null && (
                      <span className="opacity-60 text-[10px]">{stock}g</span>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Selected tobaccos with sliders */}
          {selectedTobaccos.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-[var(--color-border)]">
              <h4 className="text-xs font-semibold text-[var(--color-textMuted)] uppercase">
                {t.selectedTobaccosLabel}
              </h4>
              {selectedTobaccos.map(st => (
                <div
                  key={st.tobacco.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--color-bgHover)]"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: st.tobacco.color }}
                  />
                  <span className="text-sm font-medium truncate flex-1 min-w-0">
                    {st.tobacco.flavor}
                  </span>
                  <input
                    type="range"
                    aria-label={st.tobacco.flavor}
                    min={5}
                    max={95}
                    value={st.percent}
                    onChange={e => updatePercent(st.tobacco.id, Number(e.target.value))}
                    className="w-20 sm:w-28 accent-[var(--color-primary)]"
                  />
                  <span className="text-sm font-mono font-semibold w-10 text-right">
                    {st.percent}%
                  </span>
                  <button type="button"
                    onClick={() => removeTobacco(st.tobacco.id)}
                    className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-[var(--color-textMuted)] hover:text-[var(--color-danger)] transition-colors flex items-center justify-center"
                    aria-label={t.removeTobacco}
                  >
                    <IconClose size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bowl + Grams row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--color-textMuted)] uppercase block mb-1.5">
                {t.bowlLabel}
              </label>
              <select
                value={selectedBowlId || ''}
                onChange={e => {
                  const id = e.target.value || null
                  setSelectedBowlId(id)
                  const bowl = bowls.find(b => b.id === id)
                  if (bowl) setTotalGrams(bowl.capacity_grams)
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm"
              >
                <option value="">{t.noBowlSelected}</option>
                {bowls.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.capacity_grams}g)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-textMuted)] uppercase block mb-1.5">
                {t.totalGramsLabel}
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={totalGrams}
                onChange={e => setTotalGrams(Math.max(5, Math.min(40, Number(e.target.value) || 0)))}
                min={5}
                max={40}
                step="1"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Heat recommendation */}
          {heatSetup && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-bgHover)] text-xs text-[var(--color-textMuted)]">
              <span className="font-medium">{t.autoHeatSetup}:</span>
              <span>
                {t.coalsLabel(heatSetup.coals)},{' '}
                {heatSetup.packing === 'fluffy' ? t.packingFluffy :
                 heatSetup.packing === 'semi-dense' ? t.packingSemiDense :
                 t.packingDense}
              </span>
              {compatibilityScore !== null && (
                <span className="ml-auto font-mono font-medium" style={{
                  color: compatibilityScore >= 80 ? 'var(--color-success)' :
                         compatibilityScore >= 60 ? 'var(--color-warning)' :
                         'var(--color-danger)',
                }}>
                  {compatibilityScore}%
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
