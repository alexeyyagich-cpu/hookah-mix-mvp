'use client'

import { useState, useRef } from 'react'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useStatistics } from '@/lib/hooks/useStatistics'
import { useStatisticsComparison } from '@/lib/hooks/useStatisticsComparison'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useNotificationSettings } from '@/lib/hooks/useNotificationSettings'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ComparisonCard } from '@/components/dashboard/ComparisonCard'
import { exportStatisticsCSV, exportStatisticsPDF } from '@/lib/utils/exportReport'

const ConsumptionChart = dynamic(
  () => import('@/components/dashboard/Charts/ConsumptionChart').then(m => m.ConsumptionChart),
  { ssr: false, loading: () => <div className="h-48 flex items-center justify-center"><LoadingSpinner /></div> }
)
const PopularFlavorsChart = dynamic(
  () => import('@/components/dashboard/Charts/PopularFlavorsChart').then(m => m.PopularFlavorsChart),
  { ssr: false, loading: () => <div className="h-48 flex items-center justify-center"><LoadingSpinner /></div> }
)
const BrandPieChart = dynamic(
  () => import('@/components/dashboard/Charts/BrandPieChart').then(m => m.BrandPieChart),
  { ssr: false, loading: () => <div className="h-48 flex items-center justify-center"><LoadingSpinner /></div> }
)
const ABCAnalysisPanel = dynamic(
  () => import('@/components/dashboard/ABCAnalysisPanel').then(m => m.ABCAnalysisPanel),
  { ssr: false, loading: () => <div className="h-48 flex items-center justify-center"><LoadingSpinner /></div> }
)
import {
  IconSmoke,
  IconChart,
  IconScale,
  IconTarget,
  IconStar,
  IconLock,
  IconExport,
  IconWarning,
} from '@/components/Icons'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTranslation, useLocale, formatDate } from '@/lib/i18n'
import { LOW_STOCK_THRESHOLD } from '@/lib/constants'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageBackground } from '@/components/ui/PageBackground'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

type ViewMode = 'overview' | 'comparison' | 'abc'

export default function StatisticsPage() {
  const tm = useTranslation('manage')
  const tc = useTranslation('common')
  const { locale } = useLocale()
  const { settings: notificationSettings } = useNotificationSettings()
  const lowStockThreshold = notificationSettings?.low_stock_threshold || LOW_STOCK_THRESHOLD
  const { statistics, loading, error, dateRange, setDateRange } = useStatistics({ lowStockThreshold })
  const {
    periodA,
    periodB,
    comparison,
    loading: comparisonLoading,
    error: comparisonError,
    presets,
    applyPreset,
    periodsConfig,
  } = useStatisticsComparison()
  const { canExport } = useSubscription()

  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // Close export menu when clicking outside
  useClickOutside(exportMenuRef, () => setExportMenuOpen(false))

  const handlePeriodChange = (period: typeof selectedPeriod) => {
    setSelectedPeriod(period)
    const end = new Date()
    const start = new Date()

    switch (period) {
      case '7d':
        start.setDate(start.getDate() - 7)
        break
      case '30d':
        start.setDate(start.getDate() - 30)
        break
      case '90d':
        start.setDate(start.getDate() - 90)
        break
      case 'all':
        start.setFullYear(start.getFullYear() - 10)
        break
    }

    setDateRange({ start, end })
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!canExport || !statistics) return

    if (format === 'csv') {
      exportStatisticsCSV(statistics)
    } else {
      void exportStatisticsPDF(statistics, dateRange)
    }
    setExportMenuOpen(false)
  }

  return (
    <ErrorBoundary sectionName="Statistics">
    <div className="space-y-6 relative">
      <PageBackground image="/images/statistics-bg.jpg" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tm.statsTitle}</h1>
          <p className="text-[var(--color-textMuted)]">
            {tm.statsSubtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-xl bg-[var(--color-bgCard)] border border-[var(--color-border)] p-1">
            <button
              type="button"
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'overview'
                  ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                  : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
              }`}
            >
              {tm.viewOverview}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'comparison'
                  ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                  : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
              }`}
            >
              {tm.viewComparison}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('abc')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'abc'
                  ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                  : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
              }`}
            >
              {tm.viewABC}
            </button>
          </div>

          {/* Period Selector (only in overview mode) */}
          {viewMode === 'overview' && (
            <div className="flex rounded-xl bg-[var(--color-bgCard)] border border-[var(--color-border)] p-1">
              {[
                { value: '7d', label: tm.period7d },
                { value: '30d', label: tm.period30d },
                { value: '90d', label: tm.period90d },
                { value: 'all', label: tm.periodAll },
              ].map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => handlePeriodChange(option.value as typeof selectedPeriod)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === option.value
                      ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                      : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {/* Export Button with Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => canExport && setExportMenuOpen(!exportMenuOpen)}
              disabled={!canExport}
              className="btn btn-ghost disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={canExport ? tm.exportTooltip : tm.exportProOnly}
            >
              <IconExport size={18} />
              {tm.exportLabel} {!canExport && <IconLock size={14} />}
            </button>

            {exportMenuOpen && canExport && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-lg z-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-bgHover)] flex items-center gap-2 transition-colors"
                >
                  <IconChart size={16} />
                  {tm.exportCsv}
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-bgHover)] flex items-center gap-2 transition-colors border-t border-[var(--color-border)]"
                >
                  <IconExport size={16} />
                  {tm.exportPdf}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {(error || comparisonError) && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-danger)]/20 flex items-center justify-center text-[var(--color-danger)]">
              <IconWarning size={20} />
            </div>
            <p className="text-[var(--color-danger)]">{error || comparisonError}</p>
          </div>
        </div>
      )}

      {/* Comparison Mode */}
      {viewMode === 'comparison' && (
        <>
          {/* Preset Selector */}
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-[var(--color-textMuted)]">{tm.compare}</span>
              {presets.map((preset, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => {
                    setSelectedPreset(index)
                    applyPreset(index)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedPreset === index
                      ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                      : 'bg-[var(--color-bgHover)] text-[var(--color-text)] hover:bg-[var(--color-bgAccent)]'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
            <div className="mt-3 text-xs text-[var(--color-textMuted)]">
              {tm.periodALabel}: {formatDate(periodsConfig.periodA.start, locale)} — {formatDate(periodsConfig.periodA.end, locale)}
              {' | '}
              {tm.periodBLabel}: {formatDate(periodsConfig.periodB.start, locale)} — {formatDate(periodsConfig.periodB.end, locale)}
            </div>
          </div>

          {comparisonLoading ? (
            <div className="card p-12 text-center">
              <div className="w-8 h-8 mx-auto border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-[var(--color-textMuted)]">{tm.loadingComparison}</p>
            </div>
          ) : !periodA || !periodB || !comparison ? (
            <EmptyState
              icon={<IconChart size={32} />}
              title={tm.insufficientData}
              description={tm.insufficientDataDesc}
            />
          ) : (
            <>
              {/* Comparison Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <ComparisonCard
                  icon={<IconSmoke size={18} />}
                  label={tm.compSessions}
                  periodAValue={periodA.totalSessions}
                  periodBValue={periodB.totalSessions}
                  change={comparison.sessionsChange}
                />
                <ComparisonCard
                  icon={<IconChart size={18} />}
                  label={tm.compConsumption}
                  periodAValue={periodA.totalGramsUsed}
                  periodBValue={periodB.totalGramsUsed}
                  change={comparison.gramsChange}
                />
                <ComparisonCard
                  icon={<IconScale size={18} />}
                  label={tm.compAvgConsumption}
                  periodAValue={periodA.averageSessionGrams}
                  periodBValue={periodB.averageSessionGrams}
                  change={comparison.avgGramsChange}
                />
                <ComparisonCard
                  icon={<IconTarget size={18} />}
                  label={tm.compCompatibility}
                  periodAValue={`${periodA.averageCompatibilityScore}%`}
                  periodBValue={`${periodB.averageCompatibilityScore}%`}
                  change={comparison.compatibilityChange}
                  isPercentChange={false}
                />
                <ComparisonCard
                  icon={<IconStar size={18} />}
                  label={tm.compRating}
                  periodAValue={periodA.averageRating}
                  periodBValue={periodB.averageRating}
                  change={comparison.ratingChange}
                  isPercentChange={false}
                />
              </div>

              {/* Summary */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">{tm.summaryTitle}</h3>
                <div className="space-y-2 text-sm">
                  {comparison.sessionsChange !== 0 && (
                    <p>
                      <span className={comparison.sessionsChange > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
                        {comparison.sessionsChange > 0 ? '↑' : '↓'} {Math.abs(comparison.sessionsChange)}%
                      </span>
                      {' '}{tm.summarySessionsCount}
                    </p>
                  )}
                  {comparison.gramsChange !== 0 && (
                    <p>
                      <span className={comparison.gramsChange > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
                        {comparison.gramsChange > 0 ? '↑' : '↓'} {Math.abs(comparison.gramsChange)}%
                      </span>
                      {' '}{tm.summaryTotalConsumption}
                    </p>
                  )}
                  {comparison.compatibilityChange !== 0 && (
                    <p>
                      <span className={comparison.compatibilityChange > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}>
                        {comparison.compatibilityChange > 0 ? '+' : ''}{comparison.compatibilityChange}%
                      </span>
                      {' '}{tm.summaryAvgCompatibility}
                    </p>
                  )}
                  {comparison.ratingChange !== 0 && (
                    <p>
                      <span className={comparison.ratingChange > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}>
                        {comparison.ratingChange > 0 ? '+' : ''}{comparison.ratingChange}
                      </span>
                      {' '}{tm.summaryAvgRating}
                    </p>
                  )}
                  {comparison.sessionsChange === 0 && comparison.gramsChange === 0 && comparison.compatibilityChange === 0 && comparison.ratingChange === 0 && (
                    <p className="text-[var(--color-textMuted)]">{tm.summaryNoChanges}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Overview Mode */}
      {viewMode === 'overview' && loading ? (
        <div className="card p-12 text-center">
          <div className="w-8 h-8 mx-auto border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-[var(--color-textMuted)]">{tm.loadingStats}</p>
        </div>
      ) : viewMode === 'overview' && !statistics ? (
        <EmptyState
          icon={<IconChart size={32} />}
          title={tm.noData}
          description={tm.createSessionsHint}
          action={{ label: tm.goToMixCalculator, href: '/mix' }}
        />
      ) : viewMode === 'overview' && statistics ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
            <StatsCard
              icon={<IconSmoke size={20} />}
              label={tm.labelSessions}
              value={statistics.totalSessions}
              color="primary"
            />
            <StatsCard
              icon={<IconChart size={20} />}
              label={tm.labelConsumption}
              value={`${statistics.totalGramsUsed}${tc.grams}`}
              color="success"
            />
            <StatsCard
              icon={<IconScale size={20} />}
              label={tm.labelAvgConsumption}
              value={`${statistics.averageSessionGrams}${tc.grams}`}
              subtext={tm.subtextPerSession}
            />
            <StatsCard
              icon={<IconTarget size={20} />}
              label={tm.labelCompatibility}
              value={`${statistics.averageCompatibilityScore}%`}
              subtext={tm.subtextAverage}
              color="primary"
            />
            <StatsCard
              icon={<IconStar size={20} />}
              label={tm.labelRating}
              value={`${statistics.averageRating}/5`}
              subtext={tm.subtextAvgRating}
              color="warning"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Consumption Over Time */}
            <div className="card p-5">
              <h2 className="text-lg font-semibold mb-6">{tm.chartConsumptionByDay}</h2>
              <ConsumptionChart data={statistics.dailyConsumption} />
            </div>

            {/* Brand Distribution */}
            <div className="card p-5">
              <h2 className="text-lg font-semibold mb-6">{tm.chartBrandDistribution}</h2>
              <BrandPieChart data={statistics.consumptionByBrand} />
            </div>

            {/* Popular Flavors */}
            <div className="card p-5">
              <h2 className="text-lg font-semibold mb-6">{tm.topFlavors}</h2>
              <PopularFlavorsChart data={statistics.consumptionByFlavor} />
            </div>

            {/* Top Mixes */}
            <div className="card p-5">
              <h2 className="text-lg font-semibold mb-6">{tm.chartPopularMixes}</h2>
              {statistics.topMixes.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-[var(--color-textMuted)]">
                  {tm.noData}
                </div>
              ) : (
                <div className="space-y-3">
                  {statistics.topMixes.map((mix, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-[var(--color-bgHover)] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-2xl font-bold text-[var(--color-textMuted)] shrink-0">
                          #{index + 1}
                        </span>
                        <div className="min-w-0 truncate">
                          {mix.items.map((item, i) => (
                            <span key={i}>
                              <span className="font-medium">{item.flavor}</span>
                              {i < mix.items.length - 1 && ' + '}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="badge badge-primary shrink-0">{mix.count}×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          {statistics.lowStockItems.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <IconWarning size={20} className="text-[var(--color-warning)]" />
                {tm.lowStockTitle}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {statistics.lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl bg-[var(--color-bgHover)] ${
                      item.quantity_grams <= 0 ? 'border border-[var(--color-danger)]' : ''
                    }`}
                  >
                    <div className="font-medium">{item.flavor}</div>
                    <div className="text-sm text-[var(--color-textMuted)]">{item.brand}</div>
                    <div className={`text-lg font-bold mt-2 ${
                      item.quantity_grams <= 0
                        ? 'text-[var(--color-danger)]'
                        : 'text-[var(--color-warning)]'
                    }`}>
                      {item.quantity_grams <= 0 ? tm.outOfStock : `${item.quantity_grams}${tc.grams}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* ABC Analysis Mode */}
      {viewMode === 'abc' && (
        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-4">{tm.viewABC}</h2>
          <ABCAnalysisPanel />
        </div>
      )}
    </div>
    </ErrorBoundary>
  )
}
