import { describe, it, expect } from 'vitest'
import { validateMix, calculateCompatibility, calculateMix, type MixItem } from './mixCalculator'
import type { Tobacco } from '@/data/tobaccos'

// ── Test Fixtures ──────────────────────────────────────────────────────

const mintTobacco: Tobacco = {
  id: 'test-mint',
  brand: 'TestBrand',
  flavor: 'Mint',
  strength: 5,
  heatResistance: 6,
  color: '#00FF00',
  category: 'mint',
  pairsWith: ['berry', 'citrus', 'fruit'],
}

const berryTobacco: Tobacco = {
  id: 'test-berry',
  brand: 'TestBrand',
  flavor: 'Blueberry',
  strength: 6,
  heatResistance: 5,
  color: '#0000FF',
  category: 'berry',
  pairsWith: ['mint', 'citrus', 'tropical'],
}

const citrusTobacco: Tobacco = {
  id: 'test-citrus',
  brand: 'TestBrand',
  flavor: 'Lemon',
  strength: 4,
  heatResistance: 7,
  color: '#FFFF00',
  category: 'citrus',
  pairsWith: ['berry', 'mint', 'tropical'],
}

const strongTobacco: Tobacco = {
  id: 'test-strong',
  brand: 'StrongBrand',
  flavor: 'Dark Leaf',
  strength: 10,
  heatResistance: 3,
  color: '#333333',
  category: 'spice',
  pairsWith: ['mint'],
}

// ── validateMix ────────────────────────────────────────────────────────

describe('validateMix', () => {
  it('rejects fewer than 2 tobaccos', () => {
    const result = validateMix([{ tobacco: mintTobacco, percent: 100 }])
    expect(result.ok).toBe(false)
    expect(result.error).toContain('2–3')
  })

  it('rejects more than 3 tobaccos', () => {
    const items: MixItem[] = [
      { tobacco: mintTobacco, percent: 25 },
      { tobacco: berryTobacco, percent: 25 },
      { tobacco: citrusTobacco, percent: 25 },
      { tobacco: strongTobacco, percent: 25 },
    ]
    expect(validateMix(items).ok).toBe(false)
  })

  it('rejects when percents do not sum to 100', () => {
    const items: MixItem[] = [
      { tobacco: mintTobacco, percent: 40 },
      { tobacco: berryTobacco, percent: 40 },
    ]
    expect(validateMix(items).ok).toBe(false)
    expect(validateMix(items).error).toContain('100')
  })

  it('rejects zero percent', () => {
    const items: MixItem[] = [
      { tobacco: mintTobacco, percent: 0 },
      { tobacco: berryTobacco, percent: 100 },
    ]
    expect(validateMix(items).ok).toBe(false)
    expect(validateMix(items).error).toContain('> 0')
  })

  it('accepts valid 2-tobacco mix', () => {
    const items: MixItem[] = [
      { tobacco: mintTobacco, percent: 60 },
      { tobacco: berryTobacco, percent: 40 },
    ]
    expect(validateMix(items)).toEqual({ ok: true })
  })

  it('accepts valid 3-tobacco mix', () => {
    const items: MixItem[] = [
      { tobacco: mintTobacco, percent: 40 },
      { tobacco: berryTobacco, percent: 30 },
      { tobacco: citrusTobacco, percent: 30 },
    ]
    expect(validateMix(items)).toEqual({ ok: true })
  })

  it('rejects empty array', () => {
    expect(validateMix([]).ok).toBe(false)
  })
})

// ── calculateCompatibility ─────────────────────────────────────────────

describe('calculateCompatibility', () => {
  it('returns poor score for single tobacco', () => {
    const result = calculateCompatibility([{ tobacco: mintTobacco, percent: 100 }])
    expect(result.level).toBe('poor')
    expect(result.score).toBe(0)
  })

  it('gives high score for good pairing (mint + berry)', () => {
    const items: MixItem[] = [
      { tobacco: mintTobacco, percent: 50 },
      { tobacco: berryTobacco, percent: 50 },
    ]
    const result = calculateCompatibility(items)
    // Both pair with each other's category
    expect(result.score).toBeGreaterThanOrEqual(60)
    expect(['perfect', 'good']).toContain(result.level)
  })

  it('gives mint freshness bonus', () => {
    const items: MixItem[] = [
      { tobacco: mintTobacco, percent: 50 },
      { tobacco: berryTobacco, percent: 50 },
    ]
    const result = calculateCompatibility(items)
    expect(result.details.some(d => d.includes('freshness'))).toBe(true)
  })

  it('penalizes extreme strength difference', () => {
    const items: MixItem[] = [
      { tobacco: citrusTobacco, percent: 50 },  // strength 4
      { tobacco: strongTobacco, percent: 50 },   // strength 10
    ]
    const result = calculateCompatibility(items)
    // Strength diff = 6 > 5, should have penalty
    expect(result.details.some(d => d.includes('strength gap'))).toBe(true)
  })

  it('penalizes same-category monotony', () => {
    const sameBerry: Tobacco = { ...berryTobacco, id: 'berry2', flavor: 'Raspberry' }
    const items: MixItem[] = [
      { tobacco: berryTobacco, percent: 50 },
      { tobacco: sameBerry, percent: 50 },
    ]
    const result = calculateCompatibility(items)
    expect(result.details.some(d => d.includes('variety'))).toBe(true)
  })

  it('limits details to 4 entries', () => {
    const items: MixItem[] = [
      { tobacco: mintTobacco, percent: 34 },
      { tobacco: berryTobacco, percent: 33 },
      { tobacco: citrusTobacco, percent: 33 },
    ]
    const result = calculateCompatibility(items)
    expect(result.details.length).toBeLessThanOrEqual(4)
  })

  it('score is always between 30 and 100', () => {
    const items: MixItem[] = [
      { tobacco: citrusTobacco, percent: 50 },
      { tobacco: strongTobacco, percent: 50 },
    ]
    const result = calculateCompatibility(items)
    expect(result.score).toBeGreaterThanOrEqual(30)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})

// ── calculateMix ───────────────────────────────────────────────────────

describe('calculateMix', () => {
  it('calculates weighted average strength', () => {
    const items: MixItem[] = [
      { tobacco: mintTobacco, percent: 50 },  // strength 5
      { tobacco: berryTobacco, percent: 50 }, // strength 6
    ]
    const result = calculateMix(items)
    expect(result.finalStrength).toBe(5.5)
  })

  it('strength is clamped to 1-10', () => {
    const items: MixItem[] = [
      { tobacco: { ...mintTobacco, strength: 10 }, percent: 50 },
      { tobacco: { ...berryTobacco, strength: 10 }, percent: 50 },
    ]
    const result = calculateMix(items)
    expect(result.finalStrength).toBeLessThanOrEqual(10)
    expect(result.finalStrength).toBeGreaterThanOrEqual(1)
  })

  it('recommends phunnel bowl for high strength', () => {
    const items: MixItem[] = [
      { tobacco: { ...mintTobacco, strength: 8 }, percent: 50 },
      { tobacco: { ...berryTobacco, strength: 9 }, percent: 50 },
    ]
    const result = calculateMix(items)
    expect(result.setup.bowlType).toBe('phunnel')
  })

  it('recommends turka bowl for low strength', () => {
    const items: MixItem[] = [
      { tobacco: { ...mintTobacco, strength: 3 }, percent: 50 },
      { tobacco: { ...berryTobacco, strength: 4 }, percent: 50 },
    ]
    const result = calculateMix(items)
    expect(result.setup.bowlType).toBe('turka')
  })

  it('overheating risk is low for gentle mixes', () => {
    const items: MixItem[] = [
      { tobacco: { ...mintTobacco, strength: 3, heatResistance: 8 }, percent: 50 },
      { tobacco: { ...berryTobacco, strength: 3, heatResistance: 8 }, percent: 50 },
    ]
    const result = calculateMix(items)
    expect(result.overheatingRisk).toBe('low')
  })

  it('overheating risk is high for strong + low heat resistance', () => {
    const items: MixItem[] = [
      { tobacco: { ...strongTobacco, strength: 10, heatResistance: 2 }, percent: 50 },
      { tobacco: { ...berryTobacco, strength: 9, heatResistance: 2 }, percent: 50 },
    ]
    const result = calculateMix(items)
    expect(result.overheatingRisk).toBe('high')
  })

  it('includes compatibility in result', () => {
    const items: MixItem[] = [
      { tobacco: mintTobacco, percent: 50 },
      { tobacco: berryTobacco, percent: 50 },
    ]
    const result = calculateMix(items)
    expect(result.compatibility).toBeDefined()
    expect(result.compatibility.score).toBeGreaterThanOrEqual(30)
    expect(result.compatibility.level).toBeDefined()
  })
})
