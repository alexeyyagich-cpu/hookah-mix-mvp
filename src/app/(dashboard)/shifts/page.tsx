'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useShifts } from '@/lib/hooks/useShifts'
import { useModules } from '@/lib/hooks/useModules'
import { useTranslation, useLocale, formatCurrency, formatDate, formatTime } from '@/lib/i18n'
import { IconTimer, IconPlus, IconClose, IconCoin, IconBowl, IconCocktail, IconMenuList } from '@/components/Icons'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Shift, ShiftReconciliation } from '@/types/database'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function safeParseFloat(value: string): number | undefined {
  const parsed = parseFloat(value)
  return isNaN(parsed) ? undefined : parsed
}

function formatDuration(ms: number, t: { hoursShort: string; minutesShort: string }): string {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  if (hours === 0) return `${minutes}${t.minutesShort}`
  return `${hours}${t.hoursShort} ${minutes}${t.minutesShort}`
}

export default function ShiftsPage() {
  const tm = useTranslation('manage')
  const tc = useTranslation('common')
  const { locale } = useLocale()
  const { shifts, activeShift, loading, error, openShift, closeShift, getReconciliation } = useShifts()
  const { isHookahActive, isBarActive } = useModules()

  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [startingCash, setStartingCash] = useState('')
  const [closingCash, setClosingCash] = useState('')
  const [openNotes, setOpenNotes] = useState('')
  const [closeNotes, setCloseNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Live duration timer for active shift
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!activeShift) return
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [activeShift])

  const closedShifts = useMemo(
    () => shifts.filter(s => s.status === 'closed'),
    [shifts]
  )

  const [activeReconciliation, setActiveReconciliation] = useState<ShiftReconciliation | null>(null)
  const [selectedReconciliation, setSelectedReconciliation] = useState<ShiftReconciliation | null>(null)
  const [closeReconciliation, setCloseReconciliation] = useState<ShiftReconciliation | null>(null)

  useEffect(() => {
    if (!activeShift) { setActiveReconciliation(null); return }
    let cancelled = false
    getReconciliation(activeShift).then(r => { if (!cancelled) setActiveReconciliation(r) })
    return () => { cancelled = true }
  }, [activeShift, getReconciliation])

  useEffect(() => {
    if (!selectedShift) { setSelectedReconciliation(null); return }
    let cancelled = false
    getReconciliation(selectedShift).then(r => { if (!cancelled) setSelectedReconciliation(r) })
    return () => { cancelled = true }
  }, [selectedShift, getReconciliation])

  useEffect(() => {
    if (!activeShift || !showCloseModal) { setCloseReconciliation(null); return }
    let cancelled = false
    getReconciliation(activeShift).then(r => { if (!cancelled) setCloseReconciliation(r) })
    return () => { cancelled = true }
  }, [activeShift, getReconciliation, showCloseModal])

  const handleOpenShift = async () => {
    setSubmitting(true)
    try {
      const result = await openShift({
        starting_cash: startingCash ? safeParseFloat(startingCash) : undefined,
        open_notes: openNotes.trim() || undefined,
      })
      if (result) {
        setShowOpenModal(false)
        setStartingCash('')
        setOpenNotes('')
        toast.success(tc.saved)
      }
    } catch {
      toast.error(tc.errorSaving)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseShift = async () => {
    if (!activeShift) return
    setSubmitting(true)
    try {
      const result = await closeShift(activeShift.id, {
        closing_cash: closingCash ? safeParseFloat(closingCash) : undefined,
        close_notes: closeNotes.trim() || undefined,
      })
      if (result) {
        setShowCloseModal(false)
        setClosingCash('')
        setCloseNotes('')
        toast.success(tc.saved)
      }
    } catch {
      toast.error(tc.errorSaving)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tm.shiftsTitle}</h1>
          <p className="text-[var(--color-textMuted)]">{tm.shiftsDescription}</p>
        </div>
        {!activeShift && (
          <button type="button"
            onClick={() => setShowOpenModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <IconPlus size={18} />
            {tm.openShift}
          </button>
        )}
      </div>

      {/* Error */}
      {error && error !== 'shiftAlreadyOpen' && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <p className="text-[var(--color-danger)]">{error}</p>
        </div>
      )}
      {error === 'shiftAlreadyOpen' && (
        <div className="card p-4 border-[var(--color-warning)]/50 bg-[var(--color-warning)]/5">
          <p className="text-[var(--color-warning)]">{tm.shiftAlreadyOpen}</p>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <>
          {/* Active Shift Card */}
          {activeShift ? (
            <div className="card border-2 border-[var(--color-success)] p-6">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                    <span className="text-sm font-semibold text-[var(--color-success)] uppercase">{tm.activeShiftLabel}</span>
                  </div>
                  <p className="text-lg font-bold">
                    {tm.shiftOpenSince(formatTime(activeShift.opened_at, locale))}
                  </p>
                  <p className="text-sm text-[var(--color-textMuted)]">
                    {tm.shiftDuration}: {formatDuration(now - new Date(activeShift.opened_at).getTime(), tm)}
                    {activeShift.opened_by_name && ` · ${tm.openedByLabel}: ${activeShift.opened_by_name}`}
                  </p>
                </div>
                <button type="button"
                  onClick={() => setShowCloseModal(true)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'var(--color-danger)', color: 'white' }}
                >
                  {tm.closeShift}
                </button>
              </div>

              {activeShift.starting_cash !== null && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[var(--color-textMuted)]">{tm.startingCash}:</span>
                  <span className="font-semibold">{formatCurrency(activeShift.starting_cash, locale)}</span>
                </div>
              )}
              {activeShift.open_notes && (
                <p className="text-sm text-[var(--color-textMuted)] italic mt-2">{activeShift.open_notes}</p>
              )}
            </div>
          ) : shifts.length === 0 ? (
            <EmptyState
              icon={<IconTimer size={32} />}
              title={tm.noShifts}
              description={tm.noShiftsHint}
              action={{ label: tm.openShift, onClick: () => setShowOpenModal(true) }}
            />
          ) : (
            <div className="card p-6 border-dashed border-2 border-[var(--color-border)] text-center">
              <p className="text-[var(--color-textMuted)] mb-3">{tm.noActiveShift}</p>
              <button type="button"
                onClick={() => setShowOpenModal(true)}
                className="btn btn-primary"
              >
                {tm.openShift}
              </button>
            </div>
          )}

          {/* Active Shift Reconciliation (live) */}
          {activeShift && activeReconciliation && (
            <ReconciliationPanel
              reconciliation={activeReconciliation}
              isHookahActive={isHookahActive}
              isBarActive={isBarActive}
              tm={tm}
            />
          )}

          {/* Past Shifts */}
          {closedShifts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">{tm.pastShifts}</h2>
              <div className="space-y-3">
                {closedShifts.map(shift => {
                  const duration = shift.closed_at
                    ? new Date(shift.closed_at).getTime() - new Date(shift.opened_at).getTime()
                    : 0
                  return (
                    <div
                      key={shift.id}
                      className="card p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {formatDate(shift.opened_at, locale)} {formatTime(shift.opened_at, locale)} – {formatTime(shift.closed_at!, locale)}
                          </span>
                          <span className="text-xs text-[var(--color-textMuted)]">
                            ({formatDuration(duration, tm)})
                          </span>
                        </div>
                        <div className="text-xs text-[var(--color-textMuted)]">
                          {shift.opened_by_name && <>{shift.opened_by_name} · </>}
                          {shift.closing_cash !== null && formatCurrency(shift.closing_cash, locale)}
                        </div>
                      </div>
                      <button type="button"
                        onClick={() => setSelectedShift(shift)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-bgHover)] transition-colors flex-shrink-0"
                      >
                        {tm.viewReconciliation}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={() => setShowOpenModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{tm.openShift}</h2>
              <button type="button" onClick={() => setShowOpenModal(false)} className="p-2 rounded-lg hover:bg-[var(--color-bgHover)]">
                <IconClose size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">{tm.startingCash} (€)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={startingCash}
                  onChange={e => setStartingCash(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">{tm.openNotesLabel}</label>
                <textarea
                  value={openNotes}
                  onChange={e => setOpenNotes(e.target.value)}
                  rows={2}
                  className="input text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="button"
                onClick={() => setShowOpenModal(false)}
                className="btn btn-ghost btn-sm flex-1"
              >
                {tm.cancelBtn}
              </button>
              <button type="button"
                onClick={handleOpenShift}
                disabled={submitting}
                className="btn btn-success btn-sm flex-1"
              >
                {submitting ? tm.openingShift : tm.openShift}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && activeShift && closeReconciliation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={() => setShowCloseModal(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{tm.closeShift}</h2>
              <button type="button" onClick={() => setShowCloseModal(false)} className="p-2 rounded-lg hover:bg-[var(--color-bgHover)]">
                <IconClose size={20} />
              </button>
            </div>

            <p className="text-sm text-[var(--color-textMuted)] mb-4">{tm.confirmCloseShift}</p>

            {/* Reconciliation preview */}
            <ReconciliationPanel
              reconciliation={closeReconciliation}
              isHookahActive={isHookahActive}
              isBarActive={isBarActive}
              tm={tm}
              compact
            />

            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">{tm.closingCash} (€)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={closingCash}
                  onChange={e => setClosingCash(e.target.value)}
                  placeholder={String(Math.round(closeReconciliation.cash.expectedCash))}
                  min="0"
                  step="0.01"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">{tm.closeNotesLabel}</label>
                <textarea
                  value={closeNotes}
                  onChange={e => setCloseNotes(e.target.value)}
                  rows={2}
                  className="input text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="button"
                onClick={() => setShowCloseModal(false)}
                className="btn btn-ghost btn-sm flex-1"
              >
                {tm.cancelBtn}
              </button>
              <button type="button"
                onClick={handleCloseShift}
                disabled={submitting}
                className="btn btn-danger btn-sm flex-1"
              >
                {submitting ? tm.closingShift : tm.closeShift}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Past Shift Reconciliation Modal */}
      {selectedShift && selectedReconciliation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={() => setSelectedShift(null)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">{tm.shiftReconciliation}</h2>
                <p className="text-sm text-[var(--color-textMuted)]">
                  {formatDate(selectedShift.opened_at, locale)} {formatTime(selectedShift.opened_at, locale)} – {selectedShift.closed_at ? formatTime(selectedShift.closed_at, locale) : '...'}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedShift(null)} className="p-2 rounded-lg hover:bg-[var(--color-bgHover)]">
                <IconClose size={20} />
              </button>
            </div>

            <ReconciliationPanel
              reconciliation={selectedReconciliation}
              isHookahActive={isHookahActive}
              isBarActive={isBarActive}
              tm={tm}
            />
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  )
}

// Reconciliation Panel component
function ReconciliationPanel({
  reconciliation,
  isHookahActive,
  isBarActive,
  tm,
  compact,
}: {
  reconciliation: ShiftReconciliation
  isHookahActive: boolean
  isBarActive: boolean
  tm: ReturnType<typeof useTranslation<'manage'>>
  compact?: boolean
}) {
  const r = reconciliation
  const { locale } = useLocale()

  return (
    <div className={`space-y-4 ${compact ? '' : 'card p-5'}`}>
      {!compact && (
        <h3 className="font-semibold flex items-center gap-2">
          <IconTimer size={18} className="text-[var(--color-primary)]" />
          {tm.shiftReconciliation}
        </h3>
      )}

      {/* Cash section */}
      <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
        <h4 className="text-xs font-semibold text-[var(--color-textMuted)] uppercase mb-3 flex items-center gap-1.5">
          <IconCoin size={14} />
          {tm.reconciliationCash}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-[var(--color-textMuted)]">{tm.cashStartingLabel}</div>
            <div className="font-semibold">{formatCurrency(r.cash.startingCash, locale)}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-textMuted)]">{tm.cashBarRevenueLabel}</div>
            <div className="font-semibold text-[var(--color-success)]">+{formatCurrency(r.cash.barRevenue, locale)}</div>
          </div>
          {r.cash.hookahRevenue > 0 && (
            <div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.hookahRevenueLabel}</div>
              <div className="font-semibold text-[var(--color-success)]">+{formatCurrency(r.cash.hookahRevenue, locale)}</div>
            </div>
          )}
          <div>
            <div className="text-xs text-[var(--color-textMuted)]">{tm.cashExpectedLabel}</div>
            <div className="font-semibold">{formatCurrency(r.cash.expectedCash, locale)}</div>
          </div>
          {r.cash.actualCash !== null && (
            <>
              <div>
                <div className="text-xs text-[var(--color-textMuted)]">{tm.cashActualLabel}</div>
                <div className="font-semibold">{formatCurrency(r.cash.actualCash, locale)}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--color-textMuted)]">{tm.cashDifferenceLabel}</div>
                <div className={`font-semibold ${
                  r.cash.difference! >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                }`}>
                  {r.cash.difference! >= 0 ? `+${formatCurrency(r.cash.difference!, locale)} (${tm.cashSurplus})` : `${formatCurrency(r.cash.difference!, locale)} (${tm.cashShortage})`}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hookah section */}
      {isHookahActive && (
        <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
          <h4 className="text-xs font-semibold text-[var(--color-textMuted)] uppercase mb-3 flex items-center gap-1.5">
            <IconBowl size={14} />
            {tm.reconciliationHookah}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.shiftHookahSessions}</div>
              <div className="font-semibold">{r.hookah.sessionsCount}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.shiftHookahGrams}</div>
              <div className="font-semibold">{r.hookah.totalGrams}g</div>
            </div>
            {r.hookah.avgCompatibility !== null && (
              <div>
                <div className="text-xs text-[var(--color-textMuted)]">{tm.shiftHookahAvgCompat}</div>
                <div className="font-semibold">{r.hookah.avgCompatibility}%</div>
              </div>
            )}
            <div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.shiftHookahCost}</div>
              <div className="font-semibold">{formatCurrency(r.hookah.tobaccoCost, locale)}</div>
            </div>
            {r.hookah.revenue > 0 && (
              <div>
                <div className="text-xs text-[var(--color-textMuted)]">{tm.hookahRevenueLabel}</div>
                <div className="font-semibold text-[var(--color-success)]">{formatCurrency(r.hookah.revenue, locale)}</div>
              </div>
            )}
            {r.hookah.revenue > 0 && (
              <div>
                <div className="text-xs text-[var(--color-textMuted)]">{tm.hookahProfitLabel}</div>
                <div className={`font-semibold ${r.hookah.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                  {formatCurrency(r.hookah.profit, locale)}
                </div>
              </div>
            )}
          </div>
          {r.hookah.topTobaccos.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-textMuted)] mb-1.5">{tm.shiftHookahTopTobaccos}</div>
              <div className="flex flex-wrap gap-1.5">
                {r.hookah.topTobaccos.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-bgCard)] border border-[var(--color-border)]">
                    {t.brand} {t.flavor} ({t.grams}g)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bar section */}
      {isBarActive && (
        <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
          <h4 className="text-xs font-semibold text-[var(--color-textMuted)] uppercase mb-3 flex items-center gap-1.5">
            <IconCocktail size={14} />
            {tm.reconciliationBar}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.barSalesCountLabel}</div>
              <div className="font-semibold">{r.bar.salesCount}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.barTotalRevenueLabel}</div>
              <div className="font-semibold text-[var(--color-success)]">{formatCurrency(r.bar.totalRevenue, locale)}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.barTotalCostLabel}</div>
              <div className="font-semibold">{formatCurrency(r.bar.totalCost, locale)}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.barProfitLabel2}</div>
              <div className="font-semibold text-[var(--color-success)]">{formatCurrency(r.bar.profit, locale)}</div>
            </div>
            {r.bar.marginPercent !== null && (
              <div>
                <div className="text-xs text-[var(--color-textMuted)]">{tm.barMarginLabel2}</div>
                <div className="font-semibold">{r.bar.marginPercent}%</div>
              </div>
            )}
          </div>
          {r.bar.topCocktails.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-textMuted)] mb-1.5">{tm.barTopCocktailsLabel}</div>
              <div className="flex flex-wrap gap-1.5">
                {r.bar.topCocktails.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-bgCard)] border border-[var(--color-border)]">
                    {c.name} x{c.count} ({formatCurrency(c.revenue, locale)})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payroll section */}
      {r.payroll && (
        <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
          <h4 className="text-xs font-semibold text-[var(--color-textMuted)] uppercase mb-3 flex items-center gap-1.5">
            <IconCoin size={14} />
            {tm.payrollSection}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {r.payroll.staffName && (
              <div>
                <div className="text-xs text-[var(--color-textMuted)]">{tm.openedByLabel}</div>
                <div className="font-semibold">{r.payroll.staffName}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.hoursWorked}</div>
              <div className="font-semibold">{r.payroll.hoursWorked}{tm.hoursShort}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.basePay}</div>
              <div className="font-semibold">{formatCurrency(r.payroll.basePay, locale)}</div>
            </div>
            {r.payroll.commissionPay > 0 && (
              <div>
                <div className="text-xs text-[var(--color-textMuted)]">{tm.commissionPay} ({r.payroll.commissionPercent}%)</div>
                <div className="font-semibold">{formatCurrency(r.payroll.commissionPay, locale)}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.totalPay}</div>
              <div className="font-semibold text-[var(--color-primary)]">{formatCurrency(r.payroll.totalPay, locale)}</div>
            </div>
          </div>
        </div>
      )}

      {/* KDS section */}
      {r.kds.totalOrders > 0 && (
        <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
          <h4 className="text-xs font-semibold text-[var(--color-textMuted)] uppercase mb-3 flex items-center gap-1.5">
            <IconMenuList size={14} />
            {tm.reconciliationKds}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.kdsTotalLabel}</div>
              <div className="font-semibold">{r.kds.totalOrders}</div>
            </div>
            {r.kds.byStatus.served && (
              <div>
                <div className="text-xs text-[var(--color-textMuted)]">{tm.kdsServedLabel}</div>
                <div className="font-semibold">{r.kds.byStatus.served}</div>
              </div>
            )}
            {r.kds.byStatus.cancelled && (
              <div>
                <div className="text-xs text-[var(--color-textMuted)]">{tm.kdsCancelledLabel}</div>
                <div className="font-semibold text-[var(--color-danger)]">{r.kds.byStatus.cancelled}</div>
              </div>
            )}
            {r.kds.avgCompletionMinutes !== null && (
              <div>
                <div className="text-xs text-[var(--color-textMuted)]">{tm.kdsAvgTimeLabel}</div>
                <div className="font-semibold">{r.kds.avgCompletionMinutes} {tm.minutesShort}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips section */}
      {r.tips.count > 0 && (
        <div className="p-4 rounded-xl bg-[var(--color-bgHover)]">
          <h4 className="text-xs font-semibold text-[var(--color-textMuted)] uppercase mb-3 flex items-center gap-1.5">
            <IconCoin size={14} />
            {tm.reconciliationTips}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.tipsReceivedCount}</div>
              <div className="font-semibold">{r.tips.count}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-textMuted)]">{tm.tipsReceivedTotal}</div>
              <div className="font-semibold text-[var(--color-success)]">{formatCurrency(r.tips.total, locale)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
