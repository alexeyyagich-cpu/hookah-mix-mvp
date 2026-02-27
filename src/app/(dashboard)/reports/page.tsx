'use client'

import { useState, useRef, useEffect } from 'react'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { usePnL } from '@/lib/hooks/usePnL'
import type { PnLPreset } from '@/lib/hooks/usePnL'
import { useModules } from '@/lib/hooks/useModules'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { PnLChart } from '@/components/dashboard/Charts/PnLChart'
import { CostBreakdownChart } from '@/components/dashboard/Charts/CostBreakdownChart'
import { exportPnLCSV, exportPnLPDF, copyPnLAsText } from '@/lib/utils/exportPnL'
import {
  IconCoin,
  IconTrendUp,
  IconPercent,
  IconCart,
  IconExport,
  IconLock,
  IconCocktail,
} from '@/components/Icons'
import { useTranslation, useLocale, formatCurrency } from '@/lib/i18n'
import Link from 'next/link'
import { ErrorBoundary } from '@/components/ErrorBoundary'

type ModuleFilter = 'all' | 'bar' | 'hookah'

export default function ReportsPage() {
  const tm = useTranslation('manage')
  const tc = useTranslation('common')
  const { locale } = useLocale()
  const { data, loading, error, selectedPreset, setSelectedPreset, period } = usePnL()
  const { isHookahActive, isBarActive } = useModules()
  const { isFreeTier, canExport } = useSubscription()

  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>('all')
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [copyMessage, setCopyMessage] = useState('')
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => { clearTimeout(copyTimerRef.current) }, [])

  const isCombined = isHookahActive && isBarActive

  useClickOutside(exportMenuRef, () => setExportMenuOpen(false))

  const presets: { key: PnLPreset; label: string }[] = [
    { key: '7d', label: tm.period7d },
    { key: '30d', label: tm.period30d },
    { key: '90d', label: tm.period90d },
  ]

  const showBar = moduleFilter === 'all' || moduleFilter === 'bar'
  const showHookah = moduleFilter === 'all' || moduleFilter === 'hookah'

  const handleExportCSV = () => {
    exportPnLCSV(data, period, locale)
    setExportMenuOpen(false)
  }

  const handleExportPDF = () => {
    void exportPnLPDF(data, period, locale)
    setExportMenuOpen(false)
  }

  const handleCopyText = async () => {
    await copyPnLAsText(data, period, locale)
    setCopyMessage(tm.copied)
    setExportMenuOpen(false)
    copyTimerRef.current = setTimeout(() => setCopyMessage(''), 2000)
  }

  // Filter data for module view
  const filteredCostCategories = data.costByCategory.filter(c => {
    if (moduleFilter === 'bar') return c.module === 'bar'
    if (moduleFilter === 'hookah') return c.module === 'hookah'
    return true
  })

  const filteredTopItems = data.topItems.filter(i => {
    if (moduleFilter === 'bar') return i.module === 'bar'
    if (moduleFilter === 'hookah') return i.module === 'hookah'
    return true
  })

  return (
    <ErrorBoundary sectionName="Reports">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tm.reportsTitle}</h1>
          <p className="text-[var(--color-textMuted)]">
            {tm.reportsDescription}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-[var(--color-bgHover)] rounded-xl p-1">
            {presets.map(({ key, label }) => (
              <button type="button"
                key={key}
                onClick={() => setSelectedPreset(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedPreset === key
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button type="button"
              onClick={() => canExport ? setExportMenuOpen(!exportMenuOpen) : null}
              className={`btn btn-ghost flex items-center gap-2 text-sm ${!canExport ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={!canExport ? tm.exportProOnly : tm.exportLabel}
            >
              {canExport ? <IconExport size={16} /> : <IconLock size={16} />}
              {tm.exportLabel}
            </button>
            {exportMenuOpen && canExport && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--color-bgCard)] border border-[var(--color-border)] rounded-xl shadow-lg z-10 overflow-hidden">
                <button type="button"
                  onClick={handleExportCSV}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-bgHover)] transition-colors"
                >
                  {tm.downloadCsv}
                </button>
                <button type="button"
                  onClick={handleExportPDF}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-bgHover)] transition-colors"
                >
                  {tm.downloadPdf}
                </button>
                <button type="button"
                  onClick={handleCopyText}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-bgHover)] transition-colors"
                >
                  {tm.copyText}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {copyMessage && (
        <div className="text-sm text-[var(--color-success)]">{copyMessage}</div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <p className="text-[var(--color-danger)] text-sm">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatsCard
          icon={<IconCoin size={20} />}
          label={tm.labelRevenue}
          value={formatCurrency(data.totalRevenue, locale)}
          color="success"
          trend={data.revenueChange !== null ? { value: Math.round(data.revenueChange), isPositive: data.revenueChange >= 0 } : undefined}
        />
        <StatsCard
          icon={<IconCart size={20} />}
          label={tm.labelExpenses}
          value={formatCurrency(data.totalCost, locale)}
          color="danger"
          trend={data.costChange !== null ? { value: Math.round(data.costChange), isPositive: data.costChange <= 0 } : undefined}
        />
        <StatsCard
          icon={<IconTrendUp size={20} />}
          label={tm.labelProfit}
          value={formatCurrency(data.grossProfit, locale)}
          color="primary"
          trend={data.profitChange !== null ? { value: Math.round(data.profitChange), isPositive: data.profitChange >= 0 } : undefined}
        />
        <StatsCard
          icon={<IconPercent size={20} />}
          label={tm.labelMargin}
          value={data.marginPercent !== null ? `${data.marginPercent.toFixed(0)}%` : '—'}
          subtext={tm.subtextGrossMargin}
          color="primary"
        />
      </div>

      {/* Module tabs */}
      {isCombined && (
        <div className="flex bg-[var(--color-bgHover)] rounded-xl p-1 w-fit">
          {(['all', 'bar', 'hookah'] as ModuleFilter[]).map(filter => (
            <button type="button"
              key={filter}
              onClick={() => setModuleFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                moduleFilter === filter
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
              }`}
            >
              {filter === 'all' ? tm.moduleAll : filter === 'bar' ? tm.moduleBar : tm.moduleHookah}
            </button>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-6">{tm.pnlDynamics}</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <PnLChart data={data.dailyPnL} showHookah={showHookah && isHookahActive} />
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-6">{tm.costStructure}</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <CostBreakdownChart data={filteredCostCategories} />
          )}
        </div>
      </div>

      {/* Bar details */}
      {isBarActive && showBar && data.bar && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{tm.barTopItems}</h2>
            <Link href="/bar/sales" className="text-sm text-[var(--color-primary)] hover:underline">
              {tm.allSales}
            </Link>
          </div>
          {filteredTopItems.filter(i => i.module === 'bar').length === 0 ? (
            <div className="text-center py-6 text-[var(--color-textMuted)]">
              <IconCocktail size={24} className="mx-auto mb-2" />
              <p className="text-sm">{tm.noSalesForPeriod}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTopItems.filter(i => i.module === 'bar').slice(0, 6).map((item, i) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bgHover)]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-medium truncate block">{item.name}</span>
                      <span className="text-xs text-[var(--color-textMuted)]">{item.count} {tm.pcsShort}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-sm shrink-0">
                    <span className="text-[var(--color-success)]">{formatCurrency(item.revenue, locale)}</span>
                    <span className="text-[var(--color-textMuted)]">{tm.costShort} {formatCurrency(item.cost, locale)}</span>
                    <span className={`font-medium ${item.margin >= 60 ? 'text-[var(--color-success)]' : item.margin >= 40 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'}`}>
                      {item.margin.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hookah details */}
      {isHookahActive && showHookah && data.hookah && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{tm.hookahConsumption}</h2>
            <Link href="/statistics" className="text-sm text-[var(--color-primary)] hover:underline">
              {tm.statisticsLink}
            </Link>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {data.hookah.revenue > 0 && (
              <div className="p-3 rounded-xl bg-[var(--color-bgHover)] overflow-hidden">
                <div className="text-xs text-[var(--color-textMuted)] truncate">{tm.hookahRevenueLabel}</div>
                <div className="text-lg font-bold text-[var(--color-success)]">{formatCurrency(data.hookah.revenue, locale)}</div>
              </div>
            )}
            <div className="p-3 rounded-xl bg-[var(--color-bgHover)] overflow-hidden">
              <div className="text-xs text-[var(--color-textMuted)] truncate">{tm.hookahCostLabel}</div>
              <div className="text-lg font-bold">{formatCurrency(data.hookah.cost, locale)}</div>
            </div>
            {data.hookah.revenue > 0 && (
              <div className="p-3 rounded-xl bg-[var(--color-bgHover)] overflow-hidden">
                <div className="text-xs text-[var(--color-textMuted)] truncate">{tm.hookahProfitLabel}</div>
                <div className={`text-lg font-bold ${data.hookah.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                  {formatCurrency(data.hookah.profit, locale)}
                </div>
              </div>
            )}
            {data.hookah.margin !== null && (
              <div className="p-3 rounded-xl bg-[var(--color-bgHover)] overflow-hidden">
                <div className="text-xs text-[var(--color-textMuted)] truncate">{tm.hookahMarginLabel}</div>
                <div className="text-lg font-bold">{data.hookah.margin.toFixed(0)}%</div>
              </div>
            )}
            <div className="p-3 rounded-xl bg-[var(--color-bgHover)] overflow-hidden">
              <div className="text-xs text-[var(--color-textMuted)] truncate">{tm.hookahUsedLabel}</div>
              <div className="text-lg font-bold">{data.hookah.gramsUsed.toFixed(0)}{tc.grams}</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-bgHover)] overflow-hidden">
              <div className="text-xs text-[var(--color-textMuted)] truncate">{tm.hookahSessionsLabel}</div>
              <div className="text-lg font-bold">{data.hookah.sessionsCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-bgHover)] overflow-hidden">
              <div className="text-xs text-[var(--color-textMuted)] truncate">{tm.hookahCostPerSession}</div>
              <div className="text-lg font-bold">{formatCurrency(data.hookah.costPerSession, locale)}</div>
            </div>
          </div>

          {/* Cost by brand */}
          {filteredTopItems.filter(i => i.module === 'hookah').length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-[var(--color-textMuted)]">{tm.costByBrands}</h3>
              {filteredTopItems.filter(i => i.module === 'hookah').slice(0, 5).map(item => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bgHover)]"
                >
                  <span className="font-medium truncate min-w-0">{item.name}</span>
                  <span className="text-sm text-[var(--color-textMuted)] shrink-0">{formatCurrency(item.cost, locale)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pro banner */}
      {isFreeTier && (
        <div className="card p-6 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 border-[var(--color-primary)]/30">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">{tm.proReportsTitle}</h3>
              <p className="text-[var(--color-textMuted)]">
                {tm.proReportsDesc}
              </p>
            </div>
            <Link href="/pricing" className="btn btn-primary whitespace-nowrap">
              {tm.upgradePlan}
            </Link>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  )
}
