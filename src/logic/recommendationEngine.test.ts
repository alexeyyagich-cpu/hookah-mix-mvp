import { describe, it, expect } from 'vitest'
import {
  recommendTobaccos,
  recommendMixes,
  getRecommendations,
  getAllFlavorProfiles,
  getAllStrengthOptions,
  FLAVOR_PROFILE_LABELS,
  STRENGTH_LABELS,
  type GuestPreferences,
} from './recommendationEngine'

// ── getAllFlavorProfiles / getAllStrengthOptions ─────────────────────────

describe('getAllFlavorProfiles', () => {
  it('returns all 6 flavor profiles', () => {
    const profiles = getAllFlavorProfiles()
    expect(profiles).toHaveLength(6)
    expect(profiles).toContain('fresh')
    expect(profiles).toContain('fruity')
    expect(profiles).toContain('sweet')
    expect(profiles).toContain('citrus')
    expect(profiles).toContain('spicy')
    expect(profiles).toContain('soda')
  })
})

describe('getAllStrengthOptions', () => {
  it('returns all 3 strength options', () => {
    const options = getAllStrengthOptions()
    expect(options).toEqual(['light', 'medium', 'strong'])
  })
})

// ── Label constants ────────────────────────────────────────────────────

describe('FLAVOR_PROFILE_LABELS', () => {
  it('has label and emoji for every profile', () => {
    for (const profile of getAllFlavorProfiles()) {
      expect(FLAVOR_PROFILE_LABELS[profile]).toBeDefined()
      expect(FLAVOR_PROFILE_LABELS[profile].label).toBeTruthy()
      expect(FLAVOR_PROFILE_LABELS[profile].emoji).toBeTruthy()
    }
  })
})

describe('STRENGTH_LABELS', () => {
  it('has label and emoji for every strength', () => {
    for (const strength of getAllStrengthOptions()) {
      expect(STRENGTH_LABELS[strength]).toBeDefined()
      expect(STRENGTH_LABELS[strength].label).toBeTruthy()
      expect(STRENGTH_LABELS[strength].emoji).toBeTruthy()
    }
  })
})

// ── recommendTobaccos ──────────────────────────────────────────────────

describe('recommendTobaccos', () => {
  it('returns tobaccos matching light + fruity', () => {
    const prefs: GuestPreferences = {
      strength: 'light',
      flavorProfiles: ['fruity'],
    }
    const results = recommendTobaccos(prefs)

    expect(results.length).toBeGreaterThan(0)
    for (const r of results) {
      // All should be in light strength range (1-4)
      expect(r.tobacco.strength).toBeGreaterThanOrEqual(1)
      expect(r.tobacco.strength).toBeLessThanOrEqual(4)
      // All should be in fruity categories
      expect(['fruit', 'berry', 'tropical']).toContain(r.tobacco.category)
    }
  })

  it('returns tobaccos matching strong + fresh', () => {
    const prefs: GuestPreferences = {
      strength: 'strong',
      flavorProfiles: ['fresh'],
    }
    const results = recommendTobaccos(prefs)

    expect(results.length).toBeGreaterThan(0)
    for (const r of results) {
      expect(r.tobacco.strength).toBeGreaterThanOrEqual(8)
      expect(r.tobacco.category).toBe('mint')
    }
  })

  it('respects limit parameter', () => {
    const prefs: GuestPreferences = {
      strength: 'medium',
      flavorProfiles: ['fruity', 'sweet', 'citrus'],
    }
    const results = recommendTobaccos(prefs, null, 3)
    expect(results.length).toBeLessThanOrEqual(3)
  })

  it('each result has matchScore and matchReasons', () => {
    const prefs: GuestPreferences = {
      strength: 'light',
      flavorProfiles: ['fresh'],
    }
    const results = recommendTobaccos(prefs)

    for (const r of results) {
      expect(r.matchScore).toBeGreaterThan(0)
      expect(r.matchReasons.length).toBeGreaterThan(0)
    }
  })

  it('results are sorted by matchScore descending', () => {
    const prefs: GuestPreferences = {
      strength: 'medium',
      flavorProfiles: ['fruity'],
    }
    const results = recommendTobaccos(prefs)

    for (let i = 1; i < results.length; i++) {
      expect(results[i].matchScore).toBeLessThanOrEqual(results[i - 1].matchScore)
    }
  })

  it('inStock is null when no inventory provided', () => {
    const prefs: GuestPreferences = {
      strength: 'light',
      flavorProfiles: ['fresh'],
    }
    const results = recommendTobaccos(prefs, null)
    for (const r of results) {
      expect(r.inStock).toBeNull()
    }
  })
})

// ── recommendMixes ─────────────────────────────────────────────────────

describe('recommendMixes', () => {
  it('returns mixes for fruity preference', () => {
    const prefs: GuestPreferences = {
      strength: 'medium',
      flavorProfiles: ['fruity'],
    }
    const results = recommendMixes(prefs)
    // Should return some mixes (if recipe data has fruity mixes)
    expect(results).toBeDefined()
    expect(Array.isArray(results)).toBe(true)
  })

  it('respects limit parameter', () => {
    const prefs: GuestPreferences = {
      strength: 'medium',
      flavorProfiles: ['fruity', 'sweet', 'citrus'],
    }
    const results = recommendMixes(prefs, null, 2)
    expect(results.length).toBeLessThanOrEqual(2)
  })

  it('each result has matchScore and matchReasons', () => {
    const prefs: GuestPreferences = {
      strength: 'medium',
      flavorProfiles: ['fruity', 'fresh'],
    }
    const results = recommendMixes(prefs)
    for (const r of results) {
      expect(r.matchScore).toBeGreaterThan(0)
      expect(r.matchReasons.length).toBeGreaterThan(0)
    }
  })

  it('availability is null when no inventory provided', () => {
    const prefs: GuestPreferences = {
      strength: 'medium',
      flavorProfiles: ['fruity'],
    }
    const results = recommendMixes(prefs, null)
    for (const r of results) {
      expect(r.availability).toBeNull()
    }
  })
})

// ── getRecommendations ─────────────────────────────────────────────────

describe('getRecommendations', () => {
  it('returns both tobaccos and mixes', () => {
    const prefs: GuestPreferences = {
      strength: 'medium',
      flavorProfiles: ['fruity'],
    }
    const result = getRecommendations(prefs)
    expect(result.tobaccos).toBeDefined()
    expect(result.mixes).toBeDefined()
    expect(result.hasInventory).toBe(false)
  })

  it('reports hasInventory when inventory provided', () => {
    const prefs: GuestPreferences = {
      strength: 'medium',
      flavorProfiles: ['fruity'],
    }
    const result = getRecommendations(prefs, [
      {
        id: 'inv-1', profile_id: 'p1', tobacco_id: 't1',
        brand: 'Test', flavor: 'Berry', quantity_grams: 100,
        purchase_price: 10, package_grams: 200,
        purchase_date: null, expiry_date: null, notes: null,
        created_at: '', updated_at: '',
      },
    ])
    expect(result.hasInventory).toBe(true)
  })
})
