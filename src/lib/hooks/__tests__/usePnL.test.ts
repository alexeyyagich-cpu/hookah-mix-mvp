import { describe, it, expect } from 'vitest'
import {
  getPresetDays, percentChange, dateKey, computePnL,
  type ComputePnLParams,
} from '../usePnL'

// ---------------------------------------------------------------------------
// getPresetDays
// ---------------------------------------------------------------------------
describe('getPresetDays', () => {
  it('returns 7 for "7d"', () => expect(getPresetDays('7d')).toBe(7))
  it('returns 30 for "30d"', () => expect(getPresetDays('30d')).toBe(30))
  it('returns 90 for "90d"', () => expect(getPresetDays('90d')).toBe(90))
})

// ---------------------------------------------------------------------------
// percentChange
// ---------------------------------------------------------------------------
describe('percentChange', () => {
  it('returns null when both prev and curr are 0', () => {
    expect(percentChange(0, 0)).toBeNull()
  })
  it('returns 100 when prev is 0 and curr > 0', () => {
    expect(percentChange(0, 50)).toBe(100)
  })
  it('calculates positive change', () => {
    expect(percentChange(100, 150)).toBe(50)
  })
  it('calculates negative change', () => {
    expect(percentChange(100, 50)).toBe(-50)
  })
  it('returns 0 for no change', () => {
    expect(percentChange(100, 100)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// dateKey
// ---------------------------------------------------------------------------
describe('dateKey', () => {
  it('formats a Date object to YYYY-MM-DD', () => {
    expect(dateKey(new Date(2026, 2, 3))).toBe('2026-03-03') // month is 0-indexed
  })
  it('formats an ISO string to YYYY-MM-DD using local timezone', () => {
    // Create a date string at midnight local time
    const d = new Date(2026, 0, 5) // Jan 5
    expect(dateKey(d.toISOString())).toBe('2026-01-05')
  })
  it('pads single-digit months and days', () => {
    expect(dateKey(new Date(2026, 0, 1))).toBe('2026-01-01')
  })
})

// ---------------------------------------------------------------------------
// computePnL
// ---------------------------------------------------------------------------
describe('computePnL', () => {
  const now = new Date(2026, 2, 3) // Mar 3 2026
  const days = 7
  const periodStart = new Date(2026, 1, 24, 0, 0, 0, 0) // Feb 24
  const periodEnd = new Date(2026, 2, 3, 23, 59, 59, 999) // Mar 3
  const prevStart = new Date(2026, 1, 17, 0, 0, 0, 0) // Feb 17
  const prevEnd = new Date(periodStart.getTime() - 1) // Feb 23 23:59:59.999

  function makeParams(overrides: Partial<ComputePnLParams> = {}): ComputePnLParams {
    return {
      sales: [],
      sessions: [],
      pricePerGram: {},
      barInventory: [],
      isBarActive: true,
      isHookahActive: true,
      periodStart,
      periodEnd,
      prevStart,
      prevEnd,
      days,
      ...overrides,
    }
  }

  it('returns zero totals for empty data', () => {
    const result = computePnL(makeParams())
    expect(result.totalRevenue).toBe(0)
    expect(result.totalCost).toBe(0)
    expect(result.grossProfit).toBe(0)
    expect(result.marginPercent).toBeNull()
    expect(result.revenueChange).toBeNull()
    expect(result.costChange).toBeNull()
    expect(result.profitChange).toBeNull()
  })

  it('computes bar-only data when hookah is inactive', () => {
    const result = computePnL(makeParams({
      isHookahActive: false,
      sales: [
        { sold_at: '2026-02-25T12:00:00Z', total_revenue: 100, total_cost: 40, quantity: 2, margin_percent: 60, recipe_name: 'Mojito' },
      ],
    }))
    expect(result.totalRevenue).toBe(100)
    expect(result.totalCost).toBe(40)
    expect(result.grossProfit).toBe(60)
    expect(result.hookah).toBeNull()
    expect(result.bar).not.toBeNull()
    expect(result.bar!.revenue).toBe(100)
  })

  it('computes hookah-only data when bar is inactive', () => {
    const result = computePnL(makeParams({
      isBarActive: false,
      pricePerGram: { 'tob-1': 0.1 }, // €0.10/g
      sessions: [
        {
          session_date: '2026-02-26T15:00:00Z',
          selling_price: 25,
          session_items: [{ tobacco_id: 'tob-1', brand: 'Tangiers', grams_used: 20 }],
        },
      ],
    }))
    expect(result.bar).toBeNull()
    expect(result.hookah).not.toBeNull()
    expect(result.hookah!.revenue).toBe(25)
    expect(result.hookah!.cost).toBeCloseTo(2) // 20g * 0.1
    expect(result.hookah!.gramsUsed).toBe(20)
    expect(result.hookah!.sessionsCount).toBe(1)
  })

  it('computes combined totals and margin', () => {
    const result = computePnL(makeParams({
      pricePerGram: { 'tob-1': 0.1 },
      sales: [
        { sold_at: '2026-02-25T12:00:00Z', total_revenue: 100, total_cost: 30, quantity: 1, margin_percent: 70, recipe_name: 'Negroni' },
      ],
      sessions: [
        {
          session_date: '2026-02-25T14:00:00Z',
          selling_price: 50,
          session_items: [{ tobacco_id: 'tob-1', brand: 'Tangiers', grams_used: 100 }],
        },
      ],
    }))
    // Bar: rev=100, cost=30. Hookah: rev=50, cost=10
    expect(result.totalRevenue).toBe(150)
    expect(result.totalCost).toBe(40)
    expect(result.grossProfit).toBe(110)
    expect(result.marginPercent).toBeCloseTo((110 / 150) * 100)
  })

  it('handles null selling_price (Floor One-Tap Serve)', () => {
    const result = computePnL(makeParams({
      pricePerGram: { 'tob-1': 0.1 },
      sessions: [
        {
          session_date: '2026-02-26T10:00:00Z',
          selling_price: null,
          session_items: [{ tobacco_id: 'tob-1', brand: 'Tangiers', grams_used: 20 }],
        },
      ],
    }))
    expect(result.hookah!.revenue).toBe(0)
    expect(result.hookah!.cost).toBeCloseTo(2)
    expect(result.hookah!.margin).toBeNull() // revenue=0
  })

  it('calculates period comparison (revenue change)', () => {
    const result = computePnL(makeParams({
      sales: [
        // Previous period sale
        { sold_at: '2026-02-20T12:00:00Z', total_revenue: 80, total_cost: 30, quantity: 1, margin_percent: 62.5, recipe_name: 'Mojito' },
        // Current period sale
        { sold_at: '2026-02-25T12:00:00Z', total_revenue: 120, total_cost: 40, quantity: 1, margin_percent: 66.7, recipe_name: 'Mojito' },
      ],
    }))
    expect(result.prevRevenue).toBe(80)
    expect(result.totalRevenue).toBe(120)
    expect(result.revenueChange).toBe(50) // (120-80)/80 * 100
  })

  it('fills all days in dailyPnL range', () => {
    const result = computePnL(makeParams({ days: 3, periodStart: new Date(2026, 2, 1) }))
    expect(result.dailyPnL).toHaveLength(3)
    expect(result.dailyPnL[0].date).toBe('2026-03-01')
    expect(result.dailyPnL[1].date).toBe('2026-03-02')
    expect(result.dailyPnL[2].date).toBe('2026-03-03')
  })

  it('accumulates multiple sales per day in dailyPnL', () => {
    const result = computePnL(makeParams({
      days: 1,
      periodStart: new Date(2026, 2, 1),
      periodEnd: new Date(2026, 2, 1, 23, 59, 59, 999),
      sales: [
        { sold_at: '2026-03-01T10:00:00', total_revenue: 50, total_cost: 20, quantity: 1, margin_percent: 60, recipe_name: 'A' },
        { sold_at: '2026-03-01T14:00:00', total_revenue: 30, total_cost: 10, quantity: 1, margin_percent: 66, recipe_name: 'B' },
      ],
    }))
    const day = result.dailyPnL[0]
    expect(day.barRevenue).toBe(80)
    expect(day.barCost).toBe(30)
  })

  it('distributes bar cost by category proportionally', () => {
    const result = computePnL(makeParams({
      barInventory: [
        { id: 'i1', category: 'spirits', purchase_price: 100 },
        { id: 'i2', category: 'mixers', purchase_price: 50 },
      ],
      sales: [
        { sold_at: '2026-02-25T12:00:00', total_revenue: 50, total_cost: 15, quantity: 1, margin_percent: 70, recipe_name: 'X' },
      ],
    }))
    const spirits = result.costByCategory.find(c => c.category === 'spirits')
    const mixers = result.costByCategory.find(c => c.category === 'mixers')
    expect(spirits).toBeDefined()
    expect(mixers).toBeDefined()
    // Spirits: 100/(100+50) * 15 = 10, Mixers: 50/150 * 15 = 5
    expect(spirits!.cost).toBeCloseTo(10)
    expect(mixers!.cost).toBeCloseTo(5)
  })

  it('lists hookah costs by brand in costByCategory', () => {
    const result = computePnL(makeParams({
      pricePerGram: { 'tob-1': 0.1, 'tob-2': 0.2 },
      sessions: [
        {
          session_date: '2026-02-26T10:00:00',
          selling_price: 25,
          session_items: [
            { tobacco_id: 'tob-1', brand: 'Tangiers', grams_used: 10 },
            { tobacco_id: 'tob-2', brand: 'Darkside', grams_used: 10 },
          ],
        },
      ],
    }))
    const tangiers = result.costByCategory.find(c => c.category === 'Tangiers')
    const darkside = result.costByCategory.find(c => c.category === 'Darkside')
    expect(tangiers).toBeDefined()
    expect(tangiers!.cost).toBeCloseTo(1) // 10 * 0.1
    expect(darkside!.cost).toBeCloseTo(2) // 10 * 0.2
  })

  it('sorts topItems by profit descending', () => {
    const result = computePnL(makeParams({
      sales: [
        { sold_at: '2026-02-25T12:00:00', total_revenue: 100, total_cost: 80, quantity: 1, margin_percent: 20, recipe_name: 'Low Profit' },
        { sold_at: '2026-02-25T14:00:00', total_revenue: 100, total_cost: 20, quantity: 1, margin_percent: 80, recipe_name: 'High Profit' },
      ],
    }))
    expect(result.topItems[0].name).toBe('High Profit')
    expect(result.topItems[0].profit).toBe(80)
    expect(result.topItems[1].name).toBe('Low Profit')
    expect(result.topItems[1].profit).toBe(20)
  })

  it('excludes sales outside the period', () => {
    const result = computePnL(makeParams({
      sales: [
        // Way before the period
        { sold_at: '2025-01-01T12:00:00Z', total_revenue: 999, total_cost: 100, quantity: 1, margin_percent: 50, recipe_name: 'Old' },
      ],
    }))
    expect(result.totalRevenue).toBe(0)
    expect(result.bar!.salesCount).toBe(0)
  })

  it('calculates hookah costPerSession correctly', () => {
    const result = computePnL(makeParams({
      pricePerGram: { 'tob-1': 0.1 },
      sessions: [
        { session_date: '2026-02-25T10:00:00', selling_price: 25, session_items: [{ tobacco_id: 'tob-1', brand: 'T', grams_used: 20 }] },
        { session_date: '2026-02-26T10:00:00', selling_price: 25, session_items: [{ tobacco_id: 'tob-1', brand: 'T', grams_used: 40 }] },
      ],
    }))
    // Total hookah cost = (20 + 40) * 0.1 = 6, sessions = 2
    expect(result.hookah!.costPerSession).toBeCloseTo(3)
  })
})
