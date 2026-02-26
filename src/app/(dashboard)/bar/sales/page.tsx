'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useBarSales } from '@/lib/hooks/useBarSales'
import { useBarRecipes } from '@/lib/hooks/useBarRecipes'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { QuickSellPanel } from '@/components/bar/QuickSellPanel'
import { IconExport, IconLock, IconChart } from '@/components/Icons'
import { exportBarSalesCSV, exportBarSalesPDF } from '@/lib/utils/exportReport'
import { useTranslation, useLocale, formatCurrency, formatDate, formatDateTime } from '@/lib/i18n'

type Period = 7 | 14 | 30

export default function BarSalesPage() {
  const tb = useTranslation('bar')
  const { locale } = useLocale()
  const { sales, loading, error, recordSale, deleteSale, getAnalytics } = useBarSales()
  const { recipes, calculateCost } = useBarRecipes()
  const { canExport } = useSubscription()

  const [period, setPeriod] = useState<Period>(7)
  const [tab, setTab] = useState<'sell' | 'log' | 'analytics'>('sell')
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const analytics = useMemo(() => getAnalytics(period), [getAnalytics, period])

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!canExport || periodSales.length === 0) return
    if (format === 'csv') {
      exportBarSalesCSV(periodSales, locale)
    } else {
      void exportBarSalesPDF(periodSales, analytics, period, locale)
    }
    setExportMenuOpen(false)
  }

  const handleSell = async (recipe: Parameters<typeof recordSale>[0]) => {
    await recordSale(recipe)
  }

  // Recent sales for the log
  const periodSales = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - period)
    return sales.filter(s => new Date(s.sold_at) >= cutoff)
  }, [sales, period])

  const fmtDateTime = (iso: string) => formatDateTime(iso, locale)

  // Revenue chart — simple bar chart with CSS
  const maxDayRevenue = Math.max(...analytics.revenueByDay.map(d => d.revenue), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tb.salesTitle}</h1>
          <p className="text-[var(--color-textMuted)]">
            {tb.salesSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Button with Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button type="button"
              onClick={() => canExport && setExportMenuOpen(!exportMenuOpen)}
              disabled={!canExport || periodSales.length === 0}
              className="btn btn-ghost disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={canExport ? tb.exportSales : tb.exportProOnly}
            >
              <IconExport size={18} />
              {!canExport && <IconLock size={14} />}
            </button>

            {exportMenuOpen && canExport && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-lg z-50 overflow-hidden">
                <button type="button"
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-bgHover)] flex items-center gap-2 transition-colors"
                >
                  <IconChart size={16} />
                  {tb.exportSalesCSV}
                </button>
                <button type="button"
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-bgHover)] flex items-center gap-2 transition-colors border-t border-[var(--color-border)]"
                >
                  <IconExport size={16} />
                  {tb.exportSalesPDF}
                </button>
              </div>
            )}
          </div>

          <select
            value={period}
            onChange={e => setPeriod(Number(e.target.value) as Period)}
            className="px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm"
          >
            <option value={7}>{tb.days7}</option>
            <option value={14}>{tb.days14}</option>
            <option value={30}>{tb.days30}</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4" style={{ borderLeft: '3px solid var(--color-primary)' }}>
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-textMuted)]">{tb.revenue}</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{formatCurrency(analytics.totalRevenue, locale)}</div>
        </div>
        <div className="card p-4" style={{ borderLeft: '3px solid var(--color-success)' }}>
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-textMuted)]">{tb.profit}</div>
          <div className="text-2xl font-bold tabular-nums text-[var(--color-success)] mt-1">
            {formatCurrency(analytics.totalProfit, locale)}
          </div>
        </div>
        <div className="card p-4" style={{ borderLeft: '3px solid var(--color-warning)' }}>
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-textMuted)]">{tb.portionsSold}</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{analytics.totalSales}</div>
        </div>
        <div className="card p-4" style={{ borderLeft: `3px solid var(--color-${analytics.avgMargin !== null ? (analytics.avgMargin >= 60 ? 'success' : analytics.avgMargin >= 40 ? 'warning' : 'danger') : 'primary'})` }}>
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-textMuted)]">{tb.margin}</div>
          <div className={`text-2xl font-bold tabular-nums mt-1 ${
            analytics.avgMargin !== null
              ? analytics.avgMargin >= 60 ? 'text-[var(--color-success)]' : analytics.avgMargin >= 40 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'
              : ''
          }`}>
            {analytics.avgMargin !== null ? `${analytics.avgMargin.toFixed(0)}%` : '—'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-border)]">
        {([
          { key: 'sell' as const, label: tb.tabSell },
          { key: 'log' as const, label: tb.tabLog },
          { key: 'analytics' as const, label: tb.analytics },
        ]).map(t => (
          <button type="button"
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <p className="text-[var(--color-danger)]">{error}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <>
          {/* Quick Sell Tab */}
          {tab === 'sell' && (
            <QuickSellPanel
              recipes={recipes}
              calculateCost={calculateCost}
              onSell={handleSell}
            />
          )}

          {/* Sales Log Tab */}
          {tab === 'log' && (
            <div className="card overflow-x-auto">
              {periodSales.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="text-[var(--color-textMuted)]">{tb.noSalesForPeriod}</p>
                </div>
              ) : (
                <table className="w-full min-w-[600px]">
                  <thead className="sticky top-0 z-10 bg-[var(--color-bgCard)]">
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">{tb.thTime}</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">{tb.thCocktail}</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">{tb.thQty}</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">{tb.thRevenue}</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">{tb.thCost}</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">{tb.thMargin}</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodSales.map(sale => {
                      const marginColor = sale.margin_percent !== null
                        ? sale.margin_percent >= 60 ? 'success' : sale.margin_percent >= 40 ? 'warning' : 'danger'
                        : 'textMuted'

                      return (
                        <tr key={sale.id} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bgHover)] transition-colors">
                          <td className="px-4 py-3 text-sm text-[var(--color-textMuted)]">
                            {fmtDateTime(sale.sold_at)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium">{sale.recipe_name}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm">{sale.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono text-sm font-semibold">
                            {formatCurrency(sale.total_revenue, locale)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm text-[var(--color-textMuted)]">
                            {formatCurrency(sale.total_cost, locale)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-mono text-sm font-semibold text-[var(--color-${marginColor})]`}>
                              {sale.margin_percent !== null ? `${sale.margin_percent.toFixed(0)}%` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button type="button"
                              onClick={() => deleteSale(sale.id)}
                              className="text-xs text-[var(--color-textMuted)] hover:text-[var(--color-danger)] transition-colors"
                              title={tb.deleteTitle}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {tab === 'analytics' && (
            <div className="space-y-6">
              {/* Revenue Chart */}
              <div className="card p-5">
                <h3 className="font-semibold mb-4">{tb.revenueByDay}</h3>
                {analytics.revenueByDay.length === 0 ? (
                  <p className="text-sm text-[var(--color-textMuted)] text-center py-4">{tb.noData}</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.revenueByDay.map(day => {
                      const pctRevenue = (day.revenue / maxDayRevenue) * 100
                      const pctCost = (day.cost / maxDayRevenue) * 100

                      return (
                        <div key={day.date} className="flex items-center gap-3">
                          <span className="text-xs text-[var(--color-textMuted)] w-12 flex-shrink-0">
                            {formatDate(day.date, locale, 'short')}
                          </span>
                          <div className="flex-1 relative h-6 rounded-lg bg-[var(--color-bgHover)] overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-[var(--color-primary)]/20 rounded-lg"
                              style={{ width: `${pctRevenue}%` }}
                            />
                            <div
                              className="absolute inset-y-0 left-0 bg-[var(--color-danger)]/30 rounded-lg"
                              style={{ width: `${pctCost}%` }}
                            />
                          </div>
                          <div className="text-xs text-right w-20 flex-shrink-0">
                            <span className="font-semibold">{formatCurrency(day.revenue, locale)}</span>
                            <span className="text-[var(--color-textMuted)]"> / {formatCurrency(day.cost, locale)}</span>
                          </div>
                        </div>
                      )
                    })}
                    <div className="flex items-center gap-4 pt-2 text-xs text-[var(--color-textMuted)]">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-[var(--color-primary)]/20" /> {tb.revenue}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-[var(--color-danger)]/30" /> {tb.cost}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Cocktails */}
              <div className="card p-5">
                <h3 className="font-semibold mb-4">{tb.topCocktails}</h3>
                {analytics.topCocktails.length === 0 ? (
                  <p className="text-sm text-[var(--color-textMuted)] text-center py-4">{tb.noData}</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.topCocktails.map((cocktail, i) => {
                      const maxCount = analytics.topCocktails[0].count
                      const pct = (cocktail.count / maxCount) * 100

                      return (
                        <div key={cocktail.name} className="flex items-center gap-3">
                          <span className="text-sm font-bold text-[var(--color-textMuted)] w-6">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium truncate">{cocktail.name}</span>
                              <span className="text-xs text-[var(--color-textMuted)] ml-2">
                                {cocktail.count} {tb.pcsUnit} · {formatCurrency(cocktail.revenue, locale)}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-[var(--color-bgHover)] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[var(--color-primary)]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5">
                  <h3 className="font-semibold mb-3">{tb.summaryFor(period)}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-textMuted)]">{tb.revenueLabel}</span>
                      <span className="font-mono font-semibold">{formatCurrency(analytics.totalRevenue, locale)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-textMuted)]">{tb.costPriceLabel}</span>
                      <span className="font-mono text-[var(--color-danger)]">{formatCurrency(analytics.totalCost, locale)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[var(--color-border)]">
                      <span className="font-medium">{tb.profitLabel}</span>
                      <span className="font-mono font-bold text-[var(--color-success)]">{formatCurrency(analytics.totalProfit, locale)}</span>
                    </div>
                  </div>
                </div>
                <div className="card p-5">
                  <h3 className="font-semibold mb-3">{tb.avgIndicators}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-textMuted)]">{tb.salesPerDay}</span>
                      <span className="font-mono font-semibold">
                        {period > 0 ? (analytics.totalSales / period).toFixed(1) : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-textMuted)]">{tb.revenuePerDay}</span>
                      <span className="font-mono font-semibold">
                        {formatCurrency(period > 0 ? analytics.totalRevenue / period : 0, locale)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-textMuted)]">{tb.avgCheck}</span>
                      <span className="font-mono font-semibold">
                        {formatCurrency(analytics.totalSales > 0
                          ? analytics.totalRevenue / analytics.totalSales
                          : 0, locale)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
