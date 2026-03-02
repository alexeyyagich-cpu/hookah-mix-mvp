import { describe, it, expect } from 'vitest'
import {
  distributePercents,
  rebalancePercents,
  SUPERNOVA_ID,
  SUPERNOVA_CAP,
  MINT_CAP,
  type TobaccoItem,
} from './percentDistribution'

// ── Helpers ─────────────────────────────────────────────────────────────

function item(id: string, category = 'fruity'): TobaccoItem {
  return { id, category }
}

function mint(id: string): TobaccoItem {
  return { id, category: 'mint' }
}

function supernova(): TobaccoItem {
  return { id: SUPERNOVA_ID, category: 'mint' }
}

function sumValues(rec: Record<string, number>) {
  return Object.values(rec).reduce((a, b) => a + b, 0)
}

// ── distributePercents ──────────────────────────────────────────────────

describe('distributePercents', () => {
  it('returns empty record for empty array', () => {
    expect(distributePercents([])).toEqual({})
  })

  it('gives 100% to a single item', () => {
    expect(distributePercents([item('a')])).toEqual({ a: 100 })
  })

  it('gives 100% to a single mint item', () => {
    expect(distributePercents([mint('m1')])).toEqual({ m1: 100 })
  })

  it('gives 100% to supernova when it is the only item', () => {
    expect(distributePercents([supernova()])).toEqual({ [SUPERNOVA_ID]: 100 })
  })

  it('splits 50/50 for two non-mint items', () => {
    const result = distributePercents([item('a'), item('b')])
    expect(result).toEqual({ a: 50, b: 50 })
    expect(sumValues(result)).toBe(100)
  })

  it('distributes remainder to first non-mint when 3 non-mints', () => {
    const result = distributePercents([item('a'), item('b'), item('c')])
    // 100/3 = 33 base, remainder 1
    expect(result).toEqual({ a: 34, b: 33, c: 33 })
    expect(sumValues(result)).toBe(100)
  })

  it('caps mint at 25% and gives rest to non-mint', () => {
    const result = distributePercents([mint('m'), item('a')])
    expect(result).toEqual({ m: MINT_CAP, a: 75 })
    expect(sumValues(result)).toBe(100)
  })

  it('caps supernova at 10% and gives rest to non-mint', () => {
    const result = distributePercents([supernova(), item('a')])
    expect(result).toEqual({ [SUPERNOVA_ID]: SUPERNOVA_CAP, a: 90 })
    expect(sumValues(result)).toBe(100)
  })

  it('handles supernova + mint + non-mint', () => {
    const result = distributePercents([supernova(), mint('m'), item('a')])
    // supernova=10, mint=25, non-mint=65
    expect(result).toEqual({ [SUPERNOVA_ID]: 10, m: 25, a: 65 })
    expect(sumValues(result)).toBe(100)
  })

  it('handles supernova + 2 non-mints', () => {
    const result = distributePercents([supernova(), item('a'), item('b')])
    // supernova=10, remaining=90, 90/2=45 each
    expect(result).toEqual({ [SUPERNOVA_ID]: 10, a: 45, b: 45 })
    expect(sumValues(result)).toBe(100)
  })

  it('handles 2 mints + 1 non-mint', () => {
    const result = distributePercents([mint('m1'), mint('m2'), item('a')])
    // mints=25*2=50, non-mint=50
    expect(result).toEqual({ m1: 25, m2: 25, a: 50 })
    expect(sumValues(result)).toBe(100)
  })

  it('does not sum to 100 when only supernova + mint (no non-mint bucket)', () => {
    // Known edge case: with no non-mint items, remaining 65% is unassigned
    const result = distributePercents([supernova(), mint('m')])
    expect(result).toEqual({ [SUPERNOVA_ID]: 10, m: 25 })
    expect(sumValues(result)).toBe(35)
  })

  it('does not sum to 100 when only mints (no non-mint bucket)', () => {
    // Known edge case: 3 mints = 75% with 25% unassigned
    const result = distributePercents([mint('m1'), mint('m2'), mint('m3')])
    expect(result).toEqual({ m1: 25, m2: 25, m3: 25 })
    expect(sumValues(result)).toBe(75)
  })

  it('treats supernova separately from other mints', () => {
    const result = distributePercents([supernova(), mint('m'), item('a'), item('b')])
    // supernova=10, mint=25, remaining=65, 65/2=32 base, remainder=1
    expect(result[SUPERNOVA_ID]).toBe(10)
    expect(result['m']).toBe(25)
    expect(result['a'] + result['b']).toBe(65)
  })
})

// ── rebalancePercents ───────────────────────────────────────────────────

describe('rebalancePercents', () => {
  it('returns 100% for single item regardless of input', () => {
    const result = rebalancePercents({ a: 60 }, 'a', 60, ['a'])
    expect(result).toEqual({ a: 100 })
  })

  it('gives remainder to the other when only 2 items', () => {
    const result = rebalancePercents({ a: 50, b: 50 }, 'a', 70, ['a', 'b'])
    expect(result).toEqual({ a: 70, b: 30 })
  })

  it('distributes proportionally among 3 others', () => {
    const result = rebalancePercents(
      { a: 40, b: 30, c: 20, d: 10 },
      'a',
      60,
      ['a', 'b', 'c', 'd'],
    )
    expect(result['a']).toBe(60)
    // remaining=40, othersSum=60, b=30/60*40=20, c=20/60*40=13, d=10/60*40=7
    expect(result['b']).toBe(20)
    expect(result['c']).toBe(13)
    expect(result['d']).toBe(7)
  })

  it('clamps newPercent to 0-100', () => {
    const result = rebalancePercents({ a: 50, b: 50 }, 'a', 150, ['a', 'b'])
    expect(result['a']).toBe(100)
    expect(result['b']).toBe(0)

    const result2 = rebalancePercents({ a: 50, b: 50 }, 'a', -20, ['a', 'b'])
    expect(result2['a']).toBe(0)
    expect(result2['b']).toBe(100)
  })

  it('rounds newPercent', () => {
    const result = rebalancePercents({ a: 50, b: 50 }, 'a', 33.7, ['a', 'b'])
    expect(result['a']).toBe(34)
    expect(result['b']).toBe(66)
  })

  it('handles zero-sum others by distributing evenly', () => {
    // When all others are 0, othersSum falls back to 1 → 0/1 * remaining = 0 each
    const result = rebalancePercents({ a: 100, b: 0, c: 0 }, 'a', 60, ['a', 'b', 'c'])
    expect(result['a']).toBe(60)
    // 0/1 * 40 = 0 each (fallback divisor avoids NaN)
    expect(result['b']).toBe(0)
    expect(result['c']).toBe(0)
  })

  it('preserves proportions when setting to 0', () => {
    const result = rebalancePercents({ a: 50, b: 30, c: 20 }, 'a', 0, ['a', 'b', 'c'])
    expect(result['a']).toBe(0)
    // remaining=100, b=30/50*100=60, c=20/50*100=40
    expect(result['b']).toBe(60)
    expect(result['c']).toBe(40)
  })
})
