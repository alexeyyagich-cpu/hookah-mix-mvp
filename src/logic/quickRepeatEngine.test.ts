import { describe, it, expect } from 'vitest'
import {
  quickRepeatGuest,
  getHeatRecommendation,
  formatHeatSetup,
  createMixSnapshot,
  getRecentGuests,
  searchGuests,
} from './quickRepeatEngine'
import { TOBACCOS } from '@/data/tobaccos'
import type { Guest, TobaccoInventory, MixSnapshot } from '@/types/database'

// ── Test Fixtures ──────────────────────────────────────────────────────

const realTobacco1 = TOBACCOS[0] // first tobacco from data
const realTobacco2 = TOBACCOS[1] // second tobacco from data

function makeSnapshot(overrides: Partial<MixSnapshot> = {}): MixSnapshot {
  return {
    id: 'snap-1',
    tobaccos: [
      { tobacco_id: realTobacco1.id, brand: realTobacco1.brand, flavor: realTobacco1.flavor, percent: 60, color: realTobacco1.color },
      { tobacco_id: realTobacco2.id, brand: realTobacco2.brand, flavor: realTobacco2.flavor, percent: 40, color: realTobacco2.color },
    ],
    total_grams: 20,
    strength: 'medium',
    compatibility_score: 80,
    bowl_type: 'phunnel',
    heat_setup: { coals: 3, packing: 'semi-dense' },
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeGuest(overrides: Partial<Guest> = {}): Guest {
  return {
    id: 'g1',
    profile_id: 'p1',
    name: 'Test Guest',
    phone: null,
    photo_url: null,
    notes: null,
    strength_preference: 'medium',
    flavor_profiles: ['fruity'],
    last_mix_snapshot: makeSnapshot(),
    visit_count: 5,
    last_visit_at: '2026-01-15T12:00:00Z',
    bonus_balance: 0,
    discount_percent: 0,
    total_spent: 0,
    loyalty_tier: 'bronze',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeInventory(brand: string, flavor: string, qty: number): TobaccoInventory {
  return {
    id: `inv-${brand}-${flavor}`,
    profile_id: 'p1',
    tobacco_id: '',
    brand,
    flavor,
    quantity_grams: qty,
    purchase_price: 10,
    package_grams: 200,
    purchase_date: null,
    expiry_date: null,
    notes: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  }
}

// ── getHeatRecommendation ──────────────────────────────────────────────

describe('getHeatRecommendation', () => {
  it('returns fluffy packing for light strength', () => {
    const result = getHeatRecommendation('light', 20)
    expect(result.packing).toBe('fluffy')
    expect(result.coals).toBe(3)
  })

  it('returns semi-dense packing for medium strength', () => {
    const result = getHeatRecommendation('medium', 20)
    expect(result.packing).toBe('semi-dense')
    expect(result.coals).toBe(3)
  })

  it('returns dense packing for strong strength', () => {
    const result = getHeatRecommendation('strong', 20)
    expect(result.packing).toBe('dense')
    expect(result.coals).toBe(4)
  })

  it('adds a coal for large bowls (>25g)', () => {
    const result = getHeatRecommendation('light', 30)
    expect(result.coals).toBe(4) // base 3 + 1
  })

  it('removes a coal for small bowls (<15g)', () => {
    const result = getHeatRecommendation('light', 10)
    expect(result.coals).toBe(2) // base 3 - 1
  })

  it('clamps coals to min 2', () => {
    // light = 3 coals, <15g = -1 → 2
    const result = getHeatRecommendation('light', 10)
    expect(result.coals).toBeGreaterThanOrEqual(2)
  })

  it('clamps coals to max 5', () => {
    // strong = 4, >25g = +1 → 5 (max)
    const result = getHeatRecommendation('strong', 30)
    expect(result.coals).toBeLessThanOrEqual(5)
  })
})

// ── formatHeatSetup ────────────────────────────────────────────────────

describe('formatHeatSetup', () => {
  it('formats light setup', () => {
    expect(formatHeatSetup({ coals: 3, packing: 'fluffy' })).toBe('3 coals, Fluffy pack')
  })

  it('formats strong setup', () => {
    expect(formatHeatSetup({ coals: 4, packing: 'dense' })).toBe('4 coals, Dense pack')
  })
})

// ── quickRepeatGuest ───────────────────────────────────────────────────

describe('quickRepeatGuest', () => {
  it('returns NO_GUEST when guest is null', () => {
    const result = quickRepeatGuest(null)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('NO_GUEST')
    }
  })

  it('returns NO_LAST_MIX when guest has no snapshot', () => {
    const guest = makeGuest({ last_mix_snapshot: null })
    const result = quickRepeatGuest(guest)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('NO_LAST_MIX')
    }
  })

  it('succeeds for guest with valid snapshot (no inventory)', () => {
    const guest = makeGuest()
    const result = quickRepeatGuest(guest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.tobaccos).toHaveLength(2)
      expect(result.warnings).toHaveLength(0)
    }
  })

  it('warns about low stock', () => {
    const guest = makeGuest()
    // Provide inventory with less than needed
    const inventory: TobaccoInventory[] = [
      makeInventory(realTobacco1.brand, realTobacco1.flavor, 5),  // need 12g (60% of 20g)
      makeInventory(realTobacco2.brand, realTobacco2.flavor, 100),
    ]
    const result = quickRepeatGuest(guest, inventory)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.warnings.some(w => w.type === 'LOW_STOCK')).toBe(true)
    }
  })

  it('warns about out-of-stock tobaccos', () => {
    const guest = makeGuest()
    const inventory: TobaccoInventory[] = [
      makeInventory(realTobacco1.brand, realTobacco1.flavor, 0),
      makeInventory(realTobacco2.brand, realTobacco2.flavor, 100),
    ]
    const result = quickRepeatGuest(guest, inventory)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.warnings.some(w => w.type === 'OUT_OF_STOCK')).toBe(true)
    }
  })
})

// ── createMixSnapshot ──────────────────────────────────────────────────

describe('createMixSnapshot', () => {
  it('creates snapshot with correct structure', () => {
    const tobaccos = [
      { tobacco: realTobacco1, percent: 60 },
      { tobacco: realTobacco2, percent: 40 },
    ]
    const result = createMixSnapshot(tobaccos, 20, 'medium', 85, 'phunnel')

    expect(result.tobaccos).toHaveLength(2)
    expect(result.total_grams).toBe(20)
    expect(result.strength).toBe('medium')
    expect(result.compatibility_score).toBe(85)
    expect(result.bowl_type).toBe('phunnel')
    expect(result.heat_setup).toBeDefined()
    expect(result.id).toMatch(/^snap_/)
    expect(result.created_at).toBeDefined()
  })

  it('maps tobacco fields correctly', () => {
    const tobaccos = [{ tobacco: realTobacco1, percent: 100 }]
    const result = createMixSnapshot(tobaccos, 20, 'light', null, null)

    expect(result.tobaccos[0].tobacco_id).toBe(realTobacco1.id)
    expect(result.tobaccos[0].brand).toBe(realTobacco1.brand)
    expect(result.tobaccos[0].flavor).toBe(realTobacco1.flavor)
    expect(result.tobaccos[0].percent).toBe(100)
    expect(result.tobaccos[0].color).toBe(realTobacco1.color)
  })
})

// ── getRecentGuests ────────────────────────────────────────────────────

describe('getRecentGuests', () => {
  it('sorts guests by last visit descending', () => {
    const guests: Guest[] = [
      makeGuest({ id: 'g1', name: 'Old', last_visit_at: '2026-01-01T00:00:00Z' }),
      makeGuest({ id: 'g2', name: 'New', last_visit_at: '2026-02-01T00:00:00Z' }),
    ]
    const result = getRecentGuests(guests)
    expect(result[0].name).toBe('New')
  })

  it('excludes guests without visit dates', () => {
    const guests: Guest[] = [
      makeGuest({ id: 'g1', last_visit_at: '2026-01-01T00:00:00Z' }),
      makeGuest({ id: 'g2', last_visit_at: null }),
    ]
    const result = getRecentGuests(guests)
    expect(result).toHaveLength(1)
  })

  it('respects limit parameter', () => {
    const guests: Guest[] = Array.from({ length: 20 }, (_, i) =>
      makeGuest({ id: `g${i}`, name: `Guest ${i}`, last_visit_at: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z` })
    )
    expect(getRecentGuests(guests, 5)).toHaveLength(5)
  })
})

// ── searchGuests ───────────────────────────────────────────────────────

describe('searchGuests', () => {
  const guests: Guest[] = [
    makeGuest({ id: 'g1', name: 'Alice' }),
    makeGuest({ id: 'g2', name: 'Bob' }),
    makeGuest({ id: 'g3', name: 'alice jones' }),
  ]

  it('finds guests by name (case insensitive)', () => {
    const result = searchGuests(guests, 'alice')
    expect(result).toHaveLength(2)
  })

  it('returns empty for empty query', () => {
    expect(searchGuests(guests, '')).toHaveLength(0)
    expect(searchGuests(guests, '   ')).toHaveLength(0)
  })

  it('limits results to 10', () => {
    const manyGuests = Array.from({ length: 20 }, (_, i) =>
      makeGuest({ id: `g${i}`, name: `Test ${i}` })
    )
    const result = searchGuests(manyGuests, 'Test')
    expect(result.length).toBeLessThanOrEqual(10)
  })
})
