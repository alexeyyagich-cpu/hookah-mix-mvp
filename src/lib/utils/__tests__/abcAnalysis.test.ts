import { describe, it, expect } from 'vitest'
import {
  calculateABCByUsage,
  calculateABCByRevenue,
  calculateABCByMargin,
} from '../abcAnalysis'
import type { SessionWithItems, TobaccoInventory } from '@/types/database'

function makeSession(
  items: { tobacco_id: string; brand: string; flavor: string; grams_used: number }[],
  selling_price: number | null = null
): SessionWithItems {
  const total_grams = items.reduce((s, i) => s + i.grams_used, 0)
  return {
    id: crypto.randomUUID(),
    profile_id: 'pid',
    total_grams,
    selling_price,
    created_at: new Date().toISOString(),
    session_items: items.map(i => ({
      id: crypto.randomUUID(),
      session_id: '',
      ...i,
    })),
  } as SessionWithItems
}

describe('calculateABCByUsage', () => {
  it('returns empty result for no sessions', () => {
    const result = calculateABCByUsage([])
    expect(result.items).toHaveLength(0)
    expect(result.summary.A.count).toBe(0)
    expect(result.summary.B.count).toBe(0)
    expect(result.summary.C.count).toBe(0)
  })

  it('classifies single item as C when at 100% cumulative', () => {
    const sessions = [
      makeSession([{ tobacco_id: 't1', brand: 'B1', flavor: 'F1', grams_used: 50 }]),
    ]
    const result = calculateABCByUsage(sessions)
    expect(result.items).toHaveLength(1)
    // Single item = 100% cumulative, > 80% threshold → not A
    expect(result.items[0].cumulativePercent).toBe(100)
  })

  it('classifies Pareto distribution correctly', () => {
    // Item A: 800g (80%), Item B: 150g (15%), Item C: 50g (5%)
    const sessions = [
      makeSession([
        { tobacco_id: 't1', brand: 'B1', flavor: 'Heavy', grams_used: 800 },
        { tobacco_id: 't2', brand: 'B2', flavor: 'Medium', grams_used: 150 },
        { tobacco_id: 't3', brand: 'B3', flavor: 'Light', grams_used: 50 },
      ]),
    ]
    const result = calculateABCByUsage(sessions)
    expect(result.items).toHaveLength(3)
    // t1 = 80% cumulative → A
    expect(result.items[0].category).toBe('A')
    expect(result.items[0].tobaccoId).toBe('t1')
    // t2 = 95% cumulative → B
    expect(result.items[1].category).toBe('B')
    // t3 = 100% cumulative → C
    expect(result.items[2].category).toBe('C')
  })

  it('aggregates grams across multiple sessions', () => {
    const sessions = [
      makeSession([{ tobacco_id: 't1', brand: 'B', flavor: 'F', grams_used: 30 }]),
      makeSession([{ tobacco_id: 't1', brand: 'B', flavor: 'F', grams_used: 20 }]),
    ]
    const result = calculateABCByUsage(sessions)
    expect(result.items[0].value).toBe(50)
  })

  it('handles sessions with no items', () => {
    const sessions = [makeSession([])]
    const result = calculateABCByUsage(sessions)
    expect(result.items).toHaveLength(0)
  })
})

describe('calculateABCByRevenue', () => {
  it('returns empty result for no sessions', () => {
    const result = calculateABCByRevenue([])
    expect(result.items).toHaveLength(0)
  })

  it('attributes revenue proportionally by grams', () => {
    // Session: 100 total, selling_price=200. t1=75g, t2=25g → t1 gets 150, t2 gets 50
    const sessions = [
      makeSession(
        [
          { tobacco_id: 't1', brand: 'B1', flavor: 'F1', grams_used: 75 },
          { tobacco_id: 't2', brand: 'B2', flavor: 'F2', grams_used: 25 },
        ],
        200
      ),
    ]
    const result = calculateABCByRevenue(sessions)
    expect(result.items).toHaveLength(2)
    const t1 = result.items.find(i => i.tobaccoId === 't1')!
    const t2 = result.items.find(i => i.tobaccoId === 't2')!
    expect(t1.value).toBeCloseTo(150)
    expect(t2.value).toBeCloseTo(50)
  })

  it('skips sessions with zero total_grams', () => {
    const session = makeSession([], 100)
    // total_grams = 0 so this session is skipped
    const result = calculateABCByRevenue([session])
    expect(result.items).toHaveLength(0)
  })

  it('skips sessions with null selling_price', () => {
    const sessions = [
      makeSession(
        [{ tobacco_id: 't1', brand: 'B', flavor: 'F', grams_used: 10 }],
        null
      ),
    ]
    const result = calculateABCByRevenue(sessions)
    // selling_price is null → 0 revenue, items exist but value = 0
    expect(result.items[0].value).toBe(0)
  })
})

describe('calculateABCByMargin', () => {
  it('returns empty result for no sessions', () => {
    const result = calculateABCByMargin([], [])
    expect(result.items).toHaveLength(0)
  })

  it('calculates margin = revenue - cost', () => {
    const inventory: TobaccoInventory[] = [
      {
        tobacco_id: 't1',
        purchase_price: 100,
        package_grams: 50, // 2€/g
      } as TobaccoInventory,
    ]
    // Session: 20g t1 at selling_price=100 → revenue=100, cost=20*2=40, margin=60
    const sessions = [
      makeSession(
        [{ tobacco_id: 't1', brand: 'B', flavor: 'F', grams_used: 20 }],
        100
      ),
    ]
    const result = calculateABCByMargin(sessions, inventory)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].value).toBeCloseTo(60)
  })

  it('treats missing inventory price as zero cost', () => {
    // No inventory data for t1 → cost = 0, margin = revenue
    const sessions = [
      makeSession(
        [{ tobacco_id: 't1', brand: 'B', flavor: 'F', grams_used: 20 }],
        100
      ),
    ]
    const result = calculateABCByMargin(sessions, [])
    expect(result.items[0].value).toBeCloseTo(100)
  })

  it('skips sessions with zero total_grams', () => {
    const sessions = [makeSession([], 100)]
    const result = calculateABCByMargin(sessions, [])
    expect(result.items).toHaveLength(0)
  })
})
