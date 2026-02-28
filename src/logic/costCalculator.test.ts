import { describe, it, expect } from 'vitest'
import {
  calculateMixCost,
  calculateProfit,
  getSuggestedPrices,
  getCostPerGram,
  formatPrice,
  formatPricePerGram,
  MARKUP_MULTIPLIERS,
} from './costCalculator'
import type { Tobacco } from '@/data/tobaccos'
import type { TobaccoInventory } from '@/types/database'

// ── Test Fixtures ──────────────────────────────────────────────────────

const tobacco1: Tobacco = {
  id: 't1',
  brand: 'Musthave',
  flavor: 'Pinkman',
  strength: 8,
  heatResistance: 8,
  color: '#EC4899',
  category: 'berry',
  pairsWith: ['mint', 'citrus'],
}

const tobacco2: Tobacco = {
  id: 't2',
  brand: 'Darkside',
  flavor: 'Lemon',
  strength: 9,
  heatResistance: 7,
  color: '#FCD34D',
  category: 'citrus',
  pairsWith: ['berry', 'mint'],
}

function makeInventory(overrides: Partial<TobaccoInventory> = {}): TobaccoInventory {
  return {
    id: 'inv-1',
    profile_id: 'p1',
    tobacco_id: 't1',
    brand: 'Musthave',
    flavor: 'Pinkman',
    quantity_grams: 200,
    purchase_price: 20,
    package_grams: 200,
    purchase_date: null,
    expiry_date: null,
    notes: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  }
}

// ── calculateMixCost ───────────────────────────────────────────────────

describe('calculateMixCost', () => {
  it('calculates cost when all tobaccos have prices', () => {
    const inventory: TobaccoInventory[] = [
      makeInventory({ tobacco_id: 't1', brand: 'Musthave', flavor: 'Pinkman', purchase_price: 20, package_grams: 200 }),
      makeInventory({ id: 'inv-2', tobacco_id: 't2', brand: 'Darkside', flavor: 'Lemon', purchase_price: 30, package_grams: 200 }),
    ]
    const items = [
      { tobacco: tobacco1, percent: 60 },
      { tobacco: tobacco2, percent: 40 },
    ]
    const result = calculateMixCost(items, 20, inventory)

    expect(result.allPriced).toBe(true)
    expect(result.hasPricing).toBe(true)
    expect(result.totalCost).not.toBeNull()
    // 12g * (20/200) + 8g * (30/200) = 12*0.1 + 8*0.15 = 1.2 + 1.2 = 2.4
    expect(result.totalCost).toBeCloseTo(2.4, 2)
    expect(result.missingPrices).toHaveLength(0)
  })

  it('returns null total when some prices are missing', () => {
    const inventory: TobaccoInventory[] = [
      makeInventory({ tobacco_id: 't1', brand: 'Musthave', flavor: 'Pinkman', purchase_price: 20, package_grams: 200 }),
      // No inventory for tobacco2
    ]
    const items = [
      { tobacco: tobacco1, percent: 60 },
      { tobacco: tobacco2, percent: 40 },
    ]
    const result = calculateMixCost(items, 20, inventory)

    expect(result.allPriced).toBe(false)
    expect(result.hasPricing).toBe(true)
    expect(result.totalCost).toBeNull()
    expect(result.missingPrices).toContain('Darkside Lemon')
  })

  it('handles empty inventory', () => {
    const items = [
      { tobacco: tobacco1, percent: 50 },
      { tobacco: tobacco2, percent: 50 },
    ]
    const result = calculateMixCost(items, 20, [])

    expect(result.allPriced).toBe(false)
    expect(result.hasPricing).toBe(false)
    expect(result.totalCost).toBeNull()
    expect(result.missingPrices).toHaveLength(2)
  })

  it('handles zero purchase price as missing', () => {
    const inventory: TobaccoInventory[] = [
      makeInventory({ purchase_price: 0 }),
    ]
    const items = [{ tobacco: tobacco1, percent: 50 }, { tobacco: tobacco2, percent: 50 }]
    const result = calculateMixCost(items, 20, inventory)
    expect(result.items[0].cost).toBeNull()
  })

  it('calculates correct grams per tobacco', () => {
    const inventory: TobaccoInventory[] = [
      makeInventory({ tobacco_id: 't1', brand: 'Musthave', flavor: 'Pinkman', purchase_price: 10, package_grams: 100 }),
      makeInventory({ id: 'inv-2', tobacco_id: 't2', brand: 'Darkside', flavor: 'Lemon', purchase_price: 10, package_grams: 100 }),
    ]
    const items = [
      { tobacco: tobacco1, percent: 70 },
      { tobacco: tobacco2, percent: 30 },
    ]
    const result = calculateMixCost(items, 20, inventory)

    expect(result.items[0].grams).toBe(14) // 70% of 20g
    expect(result.items[1].grams).toBe(6)  // 30% of 20g
  })

  it('defaults package_grams to 100 when null', () => {
    const inventory: TobaccoInventory[] = [
      makeInventory({ tobacco_id: 't1', brand: 'Musthave', flavor: 'Pinkman', purchase_price: 10, package_grams: null }),
    ]
    const items = [{ tobacco: tobacco1, percent: 100 }]
    // Needs 2 tobaccos for a valid mix, but calculateMixCost doesn't validate
    const result = calculateMixCost(items, 10, inventory)
    // 10g * (10/100) = 1.0
    expect(result.items[0].pricePerGram).toBeCloseTo(0.1)
  })
})

// ── calculateProfit ────────────────────────────────────────────────────

describe('calculateProfit', () => {
  it('calculates profit and margin', () => {
    const result = calculateProfit(5, 15)
    expect(result.profit).toBe(10)
    expect(result.marginPercent).toBeCloseTo(66.67, 1)
  })

  it('handles zero selling price', () => {
    const result = calculateProfit(5, 0)
    expect(result.marginPercent).toBe(0)
  })

  it('handles negative margin', () => {
    const result = calculateProfit(20, 10)
    expect(result.profit).toBe(-10)
    expect(result.marginPercent).toBeLessThan(0)
  })

  it('handles zero cost', () => {
    const result = calculateProfit(0, 10)
    expect(result.profit).toBe(10)
    expect(result.marginPercent).toBe(100)
  })
})

// ── getSuggestedPrices ─────────────────────────────────────────────────

describe('getSuggestedPrices', () => {
  it('returns 4 price suggestions', () => {
    const result = getSuggestedPrices(10)
    expect(result).toHaveLength(4)
  })

  it('prices increase with markup multiplier', () => {
    const result = getSuggestedPrices(10)
    expect(result[0].price).toBe(10 * MARKUP_MULTIPLIERS.low)
    expect(result[1].price).toBe(10 * MARKUP_MULTIPLIERS.medium)
    expect(result[2].price).toBe(10 * MARKUP_MULTIPLIERS.high)
    expect(result[3].price).toBe(10 * MARKUP_MULTIPLIERS.premium)
  })

  it('rounds prices to 2 decimal places', () => {
    const result = getSuggestedPrices(3.33)
    for (const item of result) {
      const decimals = (item.price.toString().split('.')[1] || '').length
      expect(decimals).toBeLessThanOrEqual(2)
    }
  })
})

// ── getCostPerGram ─────────────────────────────────────────────────────

describe('getCostPerGram', () => {
  it('calculates price per gram', () => {
    const inv = makeInventory({ purchase_price: 20, package_grams: 200 })
    expect(getCostPerGram(inv)).toBeCloseTo(0.1)
  })

  it('returns null for zero price', () => {
    const inv = makeInventory({ purchase_price: 0 })
    expect(getCostPerGram(inv)).toBeNull()
  })

  it('returns null for null price', () => {
    const inv = makeInventory({ purchase_price: null })
    expect(getCostPerGram(inv)).toBeNull()
  })

  it('defaults to 100g package when null', () => {
    const inv = makeInventory({ purchase_price: 10, package_grams: null })
    expect(getCostPerGram(inv)).toBeCloseTo(0.1)
  })
})

// ── formatPrice / formatPricePerGram ───────────────────────────────────

describe('formatPrice', () => {
  it('returns dash for null', () => {
    expect(formatPrice(null)).toBe('—')
  })

  it('formats number as currency', () => {
    const result = formatPrice(10.5, 'en')
    expect(result).toContain('10')
  })
})

describe('formatPricePerGram', () => {
  it('returns dash for null', () => {
    expect(formatPricePerGram(null)).toBe('—')
  })

  it('appends /g suffix', () => {
    const result = formatPricePerGram(0.1, 'en')
    expect(result).toContain('/g')
  })
})
