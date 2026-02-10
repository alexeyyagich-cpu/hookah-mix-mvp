'use client'

import { useState, useRef, useEffect } from 'react'
import { useStatistics } from '@/lib/hooks/useStatistics'
import { useStatisticsComparison } from '@/lib/hooks/useStatisticsComparison'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ComparisonCard } from '@/components/dashboard/ComparisonCard'
import { ConsumptionChart } from '@/components/dashboard/Charts/ConsumptionChart'
import { PopularFlavorsChart } from '@/components/dashboard/Charts/PopularFlavorsChart'
import { BrandPieChart } from '@/components/dashboard/Charts/BrandPieChart'
import { exportStatisticsCSV, exportStatisticsPDF } from '@/lib/utils/exportReport'

type ViewMode = 'overview' | 'comparison'

export default function StatisticsPage() {
  const { statistics, loading, error, dateRange, setDateRange } = useStatistics()
  const {
    periodA,
    periodB,
    comparison,
    loading: comparisonLoading,
    presets,
    applyPreset,
    periodsConfig,
  } = useStatisticsComparison()
  const { isFreeTier, canExport } = useSubscription()

  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // Close export menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      exportStatisticsPDF(statistics, dateRange)
    }
    setExportMenuOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Статистика</h1>
          <p className="text-[var(--color-textMuted)]">
            Аналитика потребления и популярных миксов
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-xl bg-[var(--color-bgCard)] border border-[var(--color-border)] p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'overview'
                  ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                  : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
              }`}
            >
              Обзор
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'comparison'
                  ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                  : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
              }`}
            >
              Сравнение
            </button>
          </div>

          {/* Period Selector (only in overview mode) */}
          {viewMode === 'overview' && (
            <div className="flex rounded-xl bg-[var(--color-bgCard)] border border-[var(--color-border)] p-1">
              {[
                { value: '7d', label: '7 дней' },
                { value: '30d', label: '30 дней' },
                { value: '90d', label: '90 дней' },
                { value: 'all', label: 'Все' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePeriodChange(option.value as typeof selectedPeriod)}
                  disabled={isFreeTier && (option.value === '90d' || option.value === 'all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === option.value
                      ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                      : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                  } ${isFreeTier && (option.value === '90d' || option.value === 'all') ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {option.label}
                  {isFreeTier && (option.value === '90d' || option.value === 'all') && ' 🔒'}
                </button>
              ))}
            </div>
          )}

          {/* Export Button with Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => canExport && setExportMenuOpen(!exportMenuOpen)}
              disabled={!canExport}
              className="btn btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
              title={canExport ? 'Экспорт данных' : 'Доступно на Pro'}
            >
              📊 Экспорт {!canExport && '🔒'}
            </button>

            {exportMenuOpen && canExport && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-bgHover)] flex items-center gap-2 transition-colors"
                >
                  📄 Экспорт CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-bgHover)] flex items-center gap-2 transition-colors border-t border-[var(--color-border)]"
                >
                  📑 Экспорт PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pro Banner for Free Users */}
      {isFreeTier && (
        <div className="card p-4 border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📈</span>
            <div className="flex-1">
              <h3 className="font-semibold">Расширенная аналитика</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                На Pro тарифе: статистика за все время, экспорт в CSV/PDF, детальные отчеты
              </p>
            </div>
            <a href="/pricing" className="btn btn-primary">
              Обновить
            </a>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❌</span>
            <p className="text-[var(--color-danger)]">{error}</p>
          </div>
        </div>
      )}

      {/* Comparison Mode */}
      {viewMode === 'comparison' && (
        <>
          {/* Preset Selector */}
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-[var(--color-textMuted)]">Сравнить:</span>
              {presets.map((preset, index) => (
                <button
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
              Период A: {periodsConfig.periodA.start.toLocaleDateString('ru-RU')} — {periodsConfig.periodA.end.toLocaleDateString('ru-RU')}
              {' | '}
              Период B: {periodsConfig.periodB.start.toLocaleDateString('ru-RU')} — {periodsConfig.periodB.end.toLocaleDateString('ru-RU')}
            </div>
          </div>

          {comparisonLoading ? (
            <div className="card p-12 text-center">
              <div className="w-8 h-8 mx-auto border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-[var(--color-textMuted)]">Загрузка сравнения...</p>
            </div>
          ) : !periodA || !periodB || !comparison ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">Недостаточно данных</h3>
              <p className="text-[var(--color-textMuted)]">
                Нужны данные за оба периода для сравнения
              </p>
            </div>
          ) : (
            <>
              {/* Comparison Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <ComparisonCard
                  icon="💨"
                  label="Сессий"
                  periodAValue={periodA.totalSessions}
                  periodBValue={periodB.totalSessions}
                  change={comparison.sessionsChange}
                />
                <ComparisonCard
                  icon="📊"
                  label="Расход (г)"
                  periodAValue={periodA.totalGramsUsed}
                  periodBValue={periodB.totalGramsUsed}
                  change={comparison.gramsChange}
                />
                <ComparisonCard
                  icon="⚖️"
                  label="Средний расход (г)"
                  periodAValue={periodA.averageSessionGrams}
                  periodBValue={periodB.averageSessionGrams}
                  change={comparison.avgGramsChange}
                />
                <ComparisonCard
                  icon="🎯"
                  label="Совместимость"
                  periodAValue={`${periodA.averageCompatibilityScore}%`}
                  periodBValue={`${periodB.averageCompatibilityScore}%`}
                  change={comparison.compatibilityChange}
                  isPercentChange={false}
                />
                <ComparisonCard
                  icon="⭐"
                  label="Рейтинг"
                  periodAValue={periodA.averageRating}
                  periodBValue={periodB.averageRating}
                  change={comparison.ratingChange}
                  isPercentChange={false}
                />
              </div>

              {/* Summary */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Итог</h3>
                <div className="space-y-2 text-sm">
                  {comparison.sessionsChange !== 0 && (
                    <p>
                      <span className={comparison.sessionsChange > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
                        {comparison.sessionsChange > 0 ? '↑' : '↓'} {Math.abs(comparison.sessionsChange)}%
                      </span>
                      {' '}количество сессий
                    </p>
                  )}
                  {comparison.gramsChange !== 0 && (
                    <p>
                      <span className={comparison.gramsChange > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
                        {comparison.gramsChange > 0 ? '↑' : '↓'} {Math.abs(comparison.gramsChange)}%
                      </span>
                      {' '}общий расход табака
                    </p>
                  )}
                  {comparison.compatibilityChange !== 0 && (
                    <p>
                      <span className={comparison.compatibilityChange > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}>
                        {comparison.compatibilityChange > 0 ? '+' : ''}{comparison.compatibilityChange}%
                      </span>
                      {' '}средняя совместимость миксов
                    </p>
                  )}
                  {comparison.ratingChange !== 0 && (
                    <p>
                      <span className={comparison.ratingChange > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}>
                        {comparison.ratingChange > 0 ? '+' : ''}{comparison.ratingChange}
                      </span>
                      {' '}средняя оценка сессий
                    </p>
                  )}
                  {comparison.sessionsChange === 0 && comparison.gramsChange === 0 && comparison.compatibilityChange === 0 && comparison.ratingChange === 0 && (
                    <p className="text-[var(--color-textMuted)]">Показатели за оба периода одинаковы</p>
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
          <p className="mt-4 text-[var(--color-textMuted)]">Загрузка статистики...</p>
        </div>
      ) : viewMode === 'overview' && !statistics ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">Нет данных</h3>
          <p className="text-[var(--color-textMuted)]">
            Создайте несколько сессий для появления статистики
          </p>
        </div>
      ) : viewMode === 'overview' && statistics ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatsCard
              icon="💨"
              label="Сессий"
              value={statistics.totalSessions}
              color="primary"
            />
            <StatsCard
              icon="📊"
              label="Расход"
              value={`${statistics.totalGramsUsed}г`}
              color="success"
            />
            <StatsCard
              icon="⚖️"
              label="Средний расход"
              value={`${statistics.averageSessionGrams}г`}
              subtext="на сессию"
            />
            <StatsCard
              icon="🎯"
              label="Совместимость"
              value={`${statistics.averageCompatibilityScore}%`}
              subtext="в среднем"
              color="primary"
            />
            <StatsCard
              icon="⭐"
              label="Рейтинг"
              value={`${statistics.averageRating}/5`}
              subtext="средняя оценка"
              color="warning"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Consumption Over Time */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">Расход по дням</h2>
              <ConsumptionChart data={statistics.dailyConsumption} />
            </div>

            {/* Brand Distribution */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">Распределение по брендам</h2>
              <BrandPieChart data={statistics.consumptionByBrand} />
            </div>

            {/* Popular Flavors */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">Популярные вкусы</h2>
              <PopularFlavorsChart data={statistics.consumptionByFlavor} />
            </div>

            {/* Top Mixes */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">Популярные миксы</h2>
              {statistics.topMixes.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-[var(--color-textMuted)]">
                  Нет данных
                </div>
              ) : (
                <div className="space-y-3">
                  {statistics.topMixes.map((mix, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-[var(--color-bgHover)] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-[var(--color-textMuted)]">
                          #{index + 1}
                        </span>
                        <div>
                          {mix.items.map((item, i) => (
                            <span key={i}>
                              <span className="font-medium">{item.flavor}</span>
                              <span className="text-[var(--color-textMuted)]"> ({item.percentage}%)</span>
                              {i < mix.items.length - 1 && ' + '}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="badge badge-primary">{mix.count}×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          {statistics.lowStockItems.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">⚠️ Заканчивающиеся табаки</h2>
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
                      {item.quantity_grams <= 0 ? 'Закончился' : `${item.quantity_grams}г`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
