'use client'

import { useState, useMemo } from 'react'
import { useBarSales } from '@/lib/hooks/useBarSales'
import { useBarRecipes } from '@/lib/hooks/useBarRecipes'
import { QuickSellPanel } from '@/components/bar/QuickSellPanel'

type Period = 7 | 14 | 30

export default function BarSalesPage() {
  const { sales, loading, error, recordSale, deleteSale, getAnalytics } = useBarSales()
  const { recipes, calculateCost } = useBarRecipes()

  const [period, setPeriod] = useState<Period>(7)
  const [tab, setTab] = useState<'sell' | 'log' | 'analytics'>('sell')

  const analytics = useMemo(() => getAnalytics(period), [getAnalytics, period])

  const handleSell = async (recipe: Parameters<typeof recordSale>[0]) => {
    await recordSale(recipe)
  }

  // Recent sales for the log
  const periodSales = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - period)
    return sales.filter(s => new Date(s.sold_at) >= cutoff)
  }, [sales, period])

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  // Revenue chart — simple bar chart with CSS
  const maxDayRevenue = Math.max(...analytics.revenueByDay.map(d => d.revenue), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Продажи бара</h1>
          <p className="text-[var(--color-textMuted)]">
            Быстрые продажи, автосписание и аналитика
          </p>
        </div>
        <select
          value={period}
          onChange={e => setPeriod(Number(e.target.value) as Period)}
          className="px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm"
        >
          <option value={7}>7 дней</option>
          <option value={14}>14 дней</option>
          <option value={30}>30 дней</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">Выручка</div>
          <div className="text-2xl font-bold mt-1">{analytics.totalRevenue.toFixed(0)}€</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">Прибыль</div>
          <div className="text-2xl font-bold text-[var(--color-success)] mt-1">
            {analytics.totalProfit.toFixed(0)}€
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">Продано порций</div>
          <div className="text-2xl font-bold mt-1">{analytics.totalSales}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">Средняя маржа</div>
          <div className={`text-2xl font-bold mt-1 ${
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
          { key: 'sell' as const, label: 'Продажа' },
          { key: 'log' as const, label: 'Журнал' },
          { key: 'analytics' as const, label: 'Аналитика' },
        ]).map(t => (
          <button
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
            <div className="card overflow-hidden">
              {periodSales.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="text-[var(--color-textMuted)]">Нет продаж за выбранный период</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">Время</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">Коктейль</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">Кол-во</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">Выручка</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">Себест.</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">Маржа</th>
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
                            {formatTime(sale.sold_at)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium">{sale.recipe_name}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm">{sale.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono text-sm font-semibold">
                            {sale.total_revenue.toFixed(2)}€
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm text-[var(--color-textMuted)]">
                            {sale.total_cost.toFixed(2)}€
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-mono text-sm font-semibold text-[var(--color-${marginColor})]`}>
                              {sale.margin_percent !== null ? `${sale.margin_percent.toFixed(0)}%` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => deleteSale(sale.id)}
                              className="text-xs text-[var(--color-textMuted)] hover:text-[var(--color-danger)] transition-colors"
                              title="Удалить"
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
                <h3 className="font-semibold mb-4">Выручка по дням</h3>
                {analytics.revenueByDay.length === 0 ? (
                  <p className="text-sm text-[var(--color-textMuted)] text-center py-4">Нет данных</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.revenueByDay.map(day => {
                      const pctRevenue = (day.revenue / maxDayRevenue) * 100
                      const pctCost = (day.cost / maxDayRevenue) * 100

                      return (
                        <div key={day.date} className="flex items-center gap-3">
                          <span className="text-xs text-[var(--color-textMuted)] w-12 flex-shrink-0">
                            {new Date(day.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
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
                            <span className="font-semibold">{day.revenue.toFixed(0)}€</span>
                            <span className="text-[var(--color-textMuted)]"> / {day.cost.toFixed(0)}€</span>
                          </div>
                        </div>
                      )
                    })}
                    <div className="flex items-center gap-4 pt-2 text-xs text-[var(--color-textMuted)]">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-[var(--color-primary)]/20" /> Выручка
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-[var(--color-danger)]/30" /> Себестоимость
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Cocktails */}
              <div className="card p-5">
                <h3 className="font-semibold mb-4">Топ коктейлей</h3>
                {analytics.topCocktails.length === 0 ? (
                  <p className="text-sm text-[var(--color-textMuted)] text-center py-4">Нет данных</p>
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
                                {cocktail.count} шт · {cocktail.revenue.toFixed(0)}€
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
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-5">
                  <h3 className="font-semibold mb-3">Сводка за {period} дней</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-textMuted)]">Выручка</span>
                      <span className="font-mono font-semibold">{analytics.totalRevenue.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-textMuted)]">Себестоимость</span>
                      <span className="font-mono text-[var(--color-danger)]">{analytics.totalCost.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[var(--color-border)]">
                      <span className="font-medium">Прибыль</span>
                      <span className="font-mono font-bold text-[var(--color-success)]">{analytics.totalProfit.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
                <div className="card p-5">
                  <h3 className="font-semibold mb-3">Средние показатели</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-textMuted)]">Продаж в день</span>
                      <span className="font-mono font-semibold">
                        {period > 0 ? (analytics.totalSales / period).toFixed(1) : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-textMuted)]">Выручка в день</span>
                      <span className="font-mono font-semibold">
                        {period > 0 ? (analytics.totalRevenue / period).toFixed(0) : '0'}€
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-textMuted)]">Средний чек</span>
                      <span className="font-mono font-semibold">
                        {analytics.totalSales > 0
                          ? (analytics.totalRevenue / analytics.totalSales).toFixed(2)
                          : '0'}€
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
