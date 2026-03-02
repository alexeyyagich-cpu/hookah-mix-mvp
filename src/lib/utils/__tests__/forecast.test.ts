import { describe, it, expect } from 'vitest'
import {
  calculateForecast,
  formatForecastDays,
  getForecastColor,
} from '../forecast'
import type { ForecastTranslations } from '../forecast'
import type { InventoryTransaction } from '@/types/database'

// English translations for testing
const t: ForecastTranslations = {
  forecastOutOfStock: 'Out of stock',
  forecastDay: '~{n} day',
  forecastDays: '~{n} days',
  forecastWeek: '~{n} week',
  forecastWeeks: '~{n} weeks',
  forecastMonth: '~{n} month',
  forecastMonths: '~{n} months',
}

function makeTx(daysAgo: number, grams: number, type: 'session' | 'waste' | 'purchase' = 'session'): InventoryTransaction {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return {
    id: crypto.randomUUID(),
    tobacco_id: 'tid',
    tobacco_inventory_id: 'inv1',
    profile_id: 'pid',
    session_id: null,
    type,
    quantity_grams: type === 'purchase' ? grams : -grams,
    notes: null,
    idempotency_key: null,
    created_at: d.toISOString(),
  } as InventoryTransaction
}

describe('calculateForecast', () => {
  it('returns null forecast for empty transactions', () => {
    const result = calculateForecast(100, [])
    expect(result.daysUntilEmpty).toBeNull()
    expect(result.estimatedEmptyDate).toBeNull()
    expect(result.avgDailyConsumption).toBe(0)
    expect(result.confidence).toBe('low')
  })

  it('ignores purchase transactions', () => {
    const result = calculateForecast(100, [makeTx(5, 50, 'purchase')])
    expect(result.daysUntilEmpty).toBeNull()
    expect(result.avgDailyConsumption).toBe(0)
  })

  it('calculates correct days until empty', () => {
    // 10g/day for 10 days = 100g consumed, 200g remaining → 20 days
    const txs = Array.from({ length: 10 }, (_, i) => makeTx(i + 1, 10))
    const result = calculateForecast(200, txs)
    expect(result.daysUntilEmpty).toBe(20)
    expect(result.avgDailyConsumption).toBeCloseTo(10, 0)
    expect(result.estimatedEmptyDate).not.toBeNull()
  })

  it('returns low confidence for few transactions', () => {
    const result = calculateForecast(100, [makeTx(1, 10)])
    expect(result.confidence).toBe('low')
  })

  it('returns medium confidence for 3+ transactions over 7+ days', () => {
    const txs = [makeTx(1, 10), makeTx(4, 10), makeTx(8, 10)]
    const result = calculateForecast(100, txs)
    expect(result.confidence).toBe('medium')
  })

  it('returns high confidence for 10+ transactions over 14+ days', () => {
    // Spread 12 transactions over 16 days to exceed 14-day threshold
    const txs = Array.from({ length: 12 }, (_, i) => makeTx(i + 5, 5))
    const result = calculateForecast(100, txs)
    expect(result.confidence).toBe('high')
  })

  it('returns null for negligible consumption', () => {
    // 0.01g over 10 days = ~0.001 g/day → below 0.1 threshold
    const result = calculateForecast(100, [makeTx(10, 0.01)])
    expect(result.daysUntilEmpty).toBeNull()
    expect(result.confidence).toBe('low')
  })

  it('includes waste transactions', () => {
    const txs = [makeTx(1, 10, 'waste'), makeTx(2, 10, 'session')]
    const result = calculateForecast(100, txs)
    expect(result.avgDailyConsumption).toBeGreaterThan(0)
    expect(result.daysUntilEmpty).not.toBeNull()
  })
})

describe('formatForecastDays', () => {
  it('returns ∞ for null', () => {
    expect(formatForecastDays(null, t)).toBe('∞')
  })

  it('returns out of stock for 0', () => {
    expect(formatForecastDays(0, t)).toBe('Out of stock')
  })

  it('returns out of stock for negative', () => {
    expect(formatForecastDays(-5, t)).toBe('Out of stock')
  })

  it('returns ~1 day for 1', () => {
    expect(formatForecastDays(1, t)).toBe('~1 day')
  })

  it('returns ~N days for 2-6', () => {
    expect(formatForecastDays(5, t)).toBe('~5 days')
  })

  it('returns ~1 week for 7-13', () => {
    expect(formatForecastDays(10, t)).toBe('~1 week')
  })

  it('returns ~N weeks for 14-29', () => {
    expect(formatForecastDays(21, t)).toBe('~3 weeks')
  })

  it('returns ~1 month for 30-59', () => {
    expect(formatForecastDays(45, t)).toBe('~1 month')
  })

  it('returns ~N months for 60+', () => {
    expect(formatForecastDays(90, t)).toBe('~3 months')
  })
})

describe('getForecastColor', () => {
  it('returns muted for null', () => {
    expect(getForecastColor(null)).toBe('muted')
  })

  it('returns danger for 0', () => {
    expect(getForecastColor(0)).toBe('danger')
  })

  it('returns danger for <7 days', () => {
    expect(getForecastColor(5)).toBe('danger')
  })

  it('returns warning for 7-13 days', () => {
    expect(getForecastColor(10)).toBe('warning')
  })

  it('returns success for 14+ days', () => {
    expect(getForecastColor(30)).toBe('success')
  })
})
