'use client'

import { useLocale, useTranslation, formatCurrency } from '@/lib/i18n'
import { IconTimer, IconCoin, IconBowl, IconCocktail, IconMenuList } from '@/components/Icons'
import type { ShiftReconciliation } from '@/types/database'

export default function ReconciliationPanel({
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
