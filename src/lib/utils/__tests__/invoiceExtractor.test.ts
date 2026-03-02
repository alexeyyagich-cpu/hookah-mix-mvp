import { describe, it, expect, vi } from 'vitest'

vi.mock('@/data/tobaccos', () => ({
  TOBACCOS: [
    { id: 'ds-grape', brand: 'Darkside', flavor: 'Grape Core' },
    { id: 'ds-banan', brand: 'Darkside', flavor: 'Bananapapa' },
    { id: 'tf-mint', brand: 'Tangiers', flavor: 'Cane Mint' },
    { id: 'af-double-apple', brand: 'Al Fakher', flavor: 'Double Apple' },
  ],
}))

import { matchTobaccoCatalog, validateExtractedInvoice, type ExtractedItem, type ExtractedInvoice } from '../invoiceExtractor'

function makeItem(overrides: Partial<ExtractedItem> = {}): ExtractedItem {
  return {
    brand: 'Darkside',
    flavor: 'Grape Core',
    quantity: 250,
    price: 15,
    packageGrams: 250,
    matched: false,
    ...overrides,
  }
}

describe('matchTobaccoCatalog', () => {
  it('exact match sets matched true and matchedTobaccoId', () => {
    const items = [makeItem({ brand: 'Darkside', flavor: 'Grape Core' })]
    const result = matchTobaccoCatalog(items)
    expect(result[0].matched).toBe(true)
    expect(result[0].matchedTobaccoId).toBe('ds-grape')
  })

  it('exact match is case-insensitive', () => {
    const items = [makeItem({ brand: 'darkside', flavor: 'grape core' })]
    const result = matchTobaccoCatalog(items)
    expect(result[0].matched).toBe(true)
    expect(result[0].matchedTobaccoId).toBe('ds-grape')
  })

  it('partial match on brand contains + flavor contains', () => {
    // 'Darkside' catalog brand includes 'dark', and 'Bananapapa' includes 'banana'
    const items = [makeItem({ brand: 'Dark', flavor: 'Banana' })]
    const result = matchTobaccoCatalog(items)
    expect(result[0].matched).toBe(true)
    expect(result[0].matchedTobaccoId).toBe('ds-banan')
  })

  it('partial match: item flavor contains catalog flavor', () => {
    // 'Cane Mint Special Edition' includes 'Cane Mint'
    const items = [makeItem({ brand: 'Tangiers', flavor: 'Cane Mint Special Edition' })]
    const result = matchTobaccoCatalog(items)
    expect(result[0].matched).toBe(true)
    expect(result[0].matchedTobaccoId).toBe('tf-mint')
  })

  it('returns matched false when no match found', () => {
    const items = [makeItem({ brand: 'UnknownBrand', flavor: 'Mystery' })]
    const result = matchTobaccoCatalog(items)
    expect(result[0].matched).toBe(false)
    expect(result[0].matchedTobaccoId).toBeUndefined()
  })

  it('handles empty items array', () => {
    expect(matchTobaccoCatalog([])).toEqual([])
  })

  it('does not mutate original items', () => {
    const items = [makeItem({ brand: 'Darkside', flavor: 'Grape Core' })]
    const original = { ...items[0] }
    matchTobaccoCatalog(items)
    expect(items[0]).toEqual(original)
  })

  it('matches multiple items independently', () => {
    const items = [
      makeItem({ brand: 'Darkside', flavor: 'Grape Core' }),
      makeItem({ brand: 'Unknown', flavor: 'Nothing' }),
      makeItem({ brand: 'Al Fakher', flavor: 'Double Apple' }),
    ]
    const result = matchTobaccoCatalog(items)
    expect(result[0].matched).toBe(true)
    expect(result[1].matched).toBe(false)
    expect(result[2].matched).toBe(true)
    expect(result[2].matchedTobaccoId).toBe('af-double-apple')
  })
})

describe('validateExtractedInvoice', () => {
  function makeInvoice(overrides: Partial<ExtractedInvoice> = {}): ExtractedInvoice {
    return {
      items: [makeItem()],
      total: 15,
      supplier: 'Test Supplier',
      date: '2024-01-01',
      ...overrides,
    }
  }

  it('returns empty array for a valid invoice', () => {
    expect(validateExtractedInvoice(makeInvoice())).toEqual([])
  })

  it('returns error when items array is empty', () => {
    const errors = validateExtractedInvoice(makeInvoice({ items: [] }))
    expect(errors).toContain('No items found in invoice')
  })

  it('returns error for missing brand', () => {
    const errors = validateExtractedInvoice(makeInvoice({ items: [makeItem({ brand: '' })] }))
    expect(errors).toContain('Row 1: missing brand')
  })

  it('returns error for missing flavor', () => {
    const errors = validateExtractedInvoice(makeInvoice({ items: [makeItem({ flavor: '' })] }))
    expect(errors).toContain('Row 1: missing flavor')
  })

  it('returns error for zero quantity', () => {
    const errors = validateExtractedInvoice(makeInvoice({ items: [makeItem({ quantity: 0 })] }))
    expect(errors).toContain('Row 1: invalid quantity')
  })

  it('returns error for negative quantity', () => {
    const errors = validateExtractedInvoice(makeInvoice({ items: [makeItem({ quantity: -5 })] }))
    expect(errors).toContain('Row 1: invalid quantity')
  })

  it('accumulates multiple errors across rows', () => {
    const items = [
      makeItem({ brand: '', flavor: '', quantity: -1 }),
      makeItem({ brand: 'OK', flavor: '', quantity: 0 }),
    ]
    const errors = validateExtractedInvoice(makeInvoice({ items }))
    expect(errors.length).toBe(5) // row1: brand + flavor + qty; row2: flavor + qty
  })

  it('does not validate price or packageGrams', () => {
    const items = [makeItem({ price: 0, packageGrams: 0 })]
    const errors = validateExtractedInvoice(makeInvoice({ items }))
    expect(errors).toEqual([])
  })
})
