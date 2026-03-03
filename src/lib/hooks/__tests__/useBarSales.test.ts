import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { computeBarAnalytics } from '../useBarSales'
import type { BarSale } from '@/types/database'
import { makeSale } from '@/__tests__/hookHelpers'

// Fix "now" to a known date so cutoff calculations are deterministic
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 2, 3, 12, 0, 0)) // Mar 3 2026
})

afterEach(() => {
  vi.useRealTimers()
})

function sale(overrides: Partial<BarSale> = {}): BarSale {
  return makeSale(overrides)
}

describe('computeBarAnalytics', () => {
  it('returns zeros for empty sales array', () => {
    const result = computeBarAnalytics([], 7)
    expect(result.totalRevenue).toBe(0)
    expect(result.totalCost).toBe(0)
    expect(result.totalProfit).toBe(0)
    expect(result.totalSales).toBe(0)
    expect(result.avgMargin).toBeNull()
    expect(result.topCocktails).toHaveLength(0)
    expect(result.revenueByDay).toHaveLength(0)
    expect(result.costByCategory).toHaveLength(0)
  })

  it('filters sales by cutoff date', () => {
    const result = computeBarAnalytics([
      sale({ sold_at: '2026-03-02T10:00:00', total_revenue: 50 }),
      sale({ sold_at: '2025-01-01T10:00:00', total_revenue: 999 }), // way old
    ], 7)
    expect(result.totalRevenue).toBe(50)
  })

  it('computes totalRevenue, totalCost, totalProfit correctly', () => {
    const result = computeBarAnalytics([
      sale({ sold_at: '2026-03-01T10:00:00', total_revenue: 100, total_cost: 30, quantity: 2 }),
      sale({ sold_at: '2026-03-02T10:00:00', total_revenue: 60, total_cost: 20, quantity: 1 }),
    ], 7)
    expect(result.totalRevenue).toBe(160)
    expect(result.totalCost).toBe(50)
    expect(result.totalProfit).toBe(110)
    expect(result.totalSales).toBe(3)
  })

  it('computes avgMargin from non-null margins', () => {
    const result = computeBarAnalytics([
      sale({ sold_at: '2026-03-01T10:00:00', margin_percent: 60 }),
      sale({ sold_at: '2026-03-02T10:00:00', margin_percent: 80 }),
      sale({ sold_at: '2026-03-02T11:00:00', margin_percent: null }),
    ], 7)
    expect(result.avgMargin).toBeCloseTo(70) // (60+80)/2
  })

  it('returns null avgMargin when all margins are null', () => {
    const result = computeBarAnalytics([
      sale({ sold_at: '2026-03-01T10:00:00', margin_percent: null }),
    ], 7)
    expect(result.avgMargin).toBeNull()
  })

  it('groups topCocktails by recipe_name and sorts by count', () => {
    const result = computeBarAnalytics([
      sale({ sold_at: '2026-03-01T10:00:00', recipe_name: 'Mojito', quantity: 3, total_revenue: 36 }),
      sale({ sold_at: '2026-03-01T11:00:00', recipe_name: 'Negroni', quantity: 8, total_revenue: 96 }),
      sale({ sold_at: '2026-03-02T10:00:00', recipe_name: 'Mojito', quantity: 2, total_revenue: 24 }),
    ], 7)
    expect(result.topCocktails[0].name).toBe('Negroni')
    expect(result.topCocktails[0].count).toBe(8)
    expect(result.topCocktails[1].name).toBe('Mojito')
    expect(result.topCocktails[1].count).toBe(5) // 3+2
    expect(result.topCocktails[1].revenue).toBe(60) // 36+24
  })

  it('groups revenueByDay and sorts chronologically', () => {
    const result = computeBarAnalytics([
      sale({ sold_at: '2026-03-02T10:00:00', total_revenue: 40, total_cost: 15 }),
      sale({ sold_at: '2026-03-01T10:00:00', total_revenue: 60, total_cost: 20 }),
      sale({ sold_at: '2026-03-02T14:00:00', total_revenue: 30, total_cost: 10 }),
    ], 7)
    expect(result.revenueByDay).toHaveLength(2)
    expect(result.revenueByDay[0].date).toBe('2026-03-01')
    expect(result.revenueByDay[0].revenue).toBe(60)
    expect(result.revenueByDay[1].date).toBe('2026-03-02')
    expect(result.revenueByDay[1].revenue).toBe(70) // 40+30
    expect(result.revenueByDay[1].cost).toBe(25) // 15+10
  })

  it('sums all costs under "cocktails" category', () => {
    const result = computeBarAnalytics([
      sale({ sold_at: '2026-03-01T10:00:00', total_cost: 20 }),
      sale({ sold_at: '2026-03-02T10:00:00', total_cost: 15 }),
    ], 7)
    expect(result.costByCategory).toHaveLength(1)
    expect(result.costByCategory[0].category).toBe('cocktails')
    expect(result.costByCategory[0].cost).toBe(35)
  })
})
