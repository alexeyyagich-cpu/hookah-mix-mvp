/**
 * Guest Preference → Smart Recommendations Engine
 *
 * B2B tool for hookah masters to quickly recommend mixes
 * based on guest preferences (strength, flavor profiles)
 * with inventory awareness for Pro users.
 */

import { TOBACCOS, type Tobacco, type Category } from '@/data/tobaccos'
import { MIX_RECIPES, type MixRecipe } from '@/data/mixes'
import type { TobaccoInventory } from '@/types/database'

// ============================================================================
// Types
// ============================================================================

export type StrengthPreference = 'light' | 'medium' | 'strong'

export type FlavorProfile =
  | 'fresh'     // mint, menthol
  | 'fruity'    // fruit, berry, tropical
  | 'sweet'     // dessert, candy
  | 'citrus'    // citrus
  | 'spicy'     // spice, herbal
  | 'soda'      // soda, fizzy

export interface GuestPreferences {
  strength: StrengthPreference
  flavorProfiles: FlavorProfile[]
}

export interface RecommendedTobacco {
  tobacco: Tobacco
  matchScore: number         // 0-100, how well it matches preferences
  matchReasons: string[]     // why this was recommended
  inStock: boolean | null    // null = inventory not checked
  stockQuantity: number | null
}

export interface RecommendedMix {
  mix: MixRecipe
  matchScore: number
  matchReasons: string[]
  availability: 'full' | 'partial' | 'none' | null  // null = not checked
  missingTobaccos: string[]
  replacements: TobaccoReplacement[]
}

export interface TobaccoReplacement {
  originalBrand: string
  originalFlavor: string
  replacement: Tobacco
  reason: string
}

export interface RecommendationResult {
  tobaccos: RecommendedTobacco[]
  mixes: RecommendedMix[]
  hasInventory: boolean
}

// ============================================================================
// Constants & Mappings
// ============================================================================

// Strength category mapping based on tobacco data analysis
// Medium range expanded to 5-7 for better coverage
const STRENGTH_RANGES: Record<StrengthPreference, [number, number]> = {
  light: [1, 4],    // Al Fakher, Fumari, Starbuzz
  medium: [5, 7],   // Black Burn Ice Baby, Tropic Jack, some mid-tier
  strong: [8, 10],  // Musthave, Darkside, Tangiers, most Black Burn
}

// Map flavor profiles to tobacco categories
const PROFILE_TO_CATEGORIES: Record<FlavorProfile, Category[]> = {
  fresh: ['mint'],
  fruity: ['fruit', 'berry', 'tropical'],
  sweet: ['dessert', 'candy'],
  citrus: ['citrus'],
  spicy: ['spice', 'herbal'],
  soda: ['soda'],
}

// UI display labels for flavor profiles
export const FLAVOR_PROFILE_LABELS: Record<FlavorProfile, { emoji: string; label: string }> = {
  fresh: { emoji: '🌿', label: 'Fresh/Cool' },
  fruity: { emoji: '🍑', label: 'Fruity' },
  sweet: { emoji: '🍪', label: 'Sweet' },
  citrus: { emoji: '🍋', label: 'Citrus' },
  spicy: { emoji: '🌶️', label: 'Spicy/Herbal' },
  soda: { emoji: '🥤', label: 'Soda' },
}

export const STRENGTH_LABELS: Record<StrengthPreference, { emoji: string; label: string }> = {
  light: { emoji: '🌤️', label: 'Light' },
  medium: { emoji: '⛅', label: 'Medium' },
  strong: { emoji: '🔥', label: 'Strong' },
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a tobacco's strength matches the preference
 */
function matchesStrength(tobacco: Tobacco, preference: StrengthPreference): boolean {
  const [min, max] = STRENGTH_RANGES[preference]
  return tobacco.strength >= min && tobacco.strength <= max
}

/**
 * Get all categories that match the selected flavor profiles
 */
function getMatchingCategories(profiles: FlavorProfile[]): Category[] {
  const categories = new Set<Category>()
  for (const profile of profiles) {
    for (const category of PROFILE_TO_CATEGORIES[profile]) {
      categories.add(category)
    }
  }
  return Array.from(categories)
}

/**
 * Calculate how well a tobacco matches the preferences
 */
function calculateTobaccoMatchScore(
  tobacco: Tobacco,
  preferences: GuestPreferences
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []
  const matchingCategories = getMatchingCategories(preferences.flavorProfiles)

  // Strength match (40 points)
  if (matchesStrength(tobacco, preferences.strength)) {
    score += 40
    reasons.push(`Strength: ${STRENGTH_LABELS[preferences.strength].label}`)
  }

  // Category match (40 points)
  if (matchingCategories.includes(tobacco.category)) {
    score += 40
    // Find which profile this category belongs to
    for (const profile of preferences.flavorProfiles) {
      if (PROFILE_TO_CATEGORIES[profile].includes(tobacco.category)) {
        reasons.push(`${FLAVOR_PROFILE_LABELS[profile].emoji} ${FLAVOR_PROFILE_LABELS[profile].label}`)
        break
      }
    }
  }

  // Pairing potential bonus (20 points max)
  // Tobaccos that pair well with multiple selected categories get bonus points
  const pairingMatches = tobacco.pairsWith.filter(cat => matchingCategories.includes(cat))
  if (pairingMatches.length > 0) {
    score += Math.min(pairingMatches.length * 5, 20)
    if (pairingMatches.length >= 2) {
      reasons.push('Pairs well')
    }
  }

  return { score, reasons }
}

/**
 * Find a replacement tobacco for a missing one
 */
function findReplacement(
  missingBrand: string,
  missingFlavor: string,
  preferences: GuestPreferences,
  inventory: TobaccoInventory[] | null
): TobaccoReplacement | null {
  // Find the original tobacco to understand what we're replacing
  const original = TOBACCOS.find(
    t => t.brand.toLowerCase() === missingBrand.toLowerCase() &&
         t.flavor.toLowerCase() === missingFlavor.toLowerCase()
  )

  if (!original) return null

  // Find tobaccos in the same category with matching strength
  const candidates = TOBACCOS.filter(t => {
    if (t.id === original.id) return false
    if (t.category !== original.category) return false
    if (!matchesStrength(t, preferences.strength)) return false

    // If we have inventory, only consider in-stock items
    if (inventory) {
      const inStock = inventory.find(
        inv => inv.brand.toLowerCase() === t.brand.toLowerCase() &&
               inv.flavor.toLowerCase() === t.flavor.toLowerCase() &&
               inv.quantity_grams > 0
      )
      if (!inStock) return false
    }

    return true
  })

  if (candidates.length === 0) return null

  // Sort by how well they match preferences
  const scored = candidates.map(t => ({
    tobacco: t,
    ...calculateTobaccoMatchScore(t, preferences)
  })).sort((a, b) => b.score - a.score)

  const best = scored[0]
  return {
    originalBrand: missingBrand,
    originalFlavor: missingFlavor,
    replacement: best.tobacco,
    reason: `Replacement: ${best.tobacco.brand} ${best.tobacco.flavor} (${original.category})`
  }
}

// ============================================================================
// Main Recommendation Functions
// ============================================================================

/**
 * Get recommended single tobaccos based on preferences
 */
export function recommendTobaccos(
  preferences: GuestPreferences,
  inventory: TobaccoInventory[] | null = null,
  limit: number = 10
): RecommendedTobacco[] {
  const matchingCategories = getMatchingCategories(preferences.flavorProfiles)

  const results: RecommendedTobacco[] = []

  for (const tobacco of TOBACCOS) {
    // Must match strength preference
    if (!matchesStrength(tobacco, preferences.strength)) continue

    // Must match at least one flavor category
    if (!matchingCategories.includes(tobacco.category)) continue

    const { score, reasons } = calculateTobaccoMatchScore(tobacco, preferences)

    // Check inventory if available
    let inStock: boolean | null = null
    let stockQuantity: number | null = null

    if (inventory) {
      const invItem = inventory.find(
        inv => inv.brand.toLowerCase() === tobacco.brand.toLowerCase() &&
               inv.flavor.toLowerCase() === tobacco.flavor.toLowerCase()
      )
      inStock = invItem ? invItem.quantity_grams > 0 : false
      stockQuantity = invItem?.quantity_grams ?? 0
    }

    results.push({
      tobacco,
      matchScore: score,
      matchReasons: reasons,
      inStock,
      stockQuantity
    })
  }

  // Sort by match score, then by in-stock status if inventory is available
  results.sort((a, b) => {
    // If inventory is available, prioritize in-stock items
    if (inventory) {
      if (a.inStock && !b.inStock) return -1
      if (!a.inStock && b.inStock) return 1
    }
    return b.matchScore - a.matchScore
  })

  return results.slice(0, limit)
}

/**
 * Get recommended mixes based on preferences
 */
export function recommendMixes(
  preferences: GuestPreferences,
  inventory: TobaccoInventory[] | null = null,
  limit: number = 5
): RecommendedMix[] {
  const matchingCategories = getMatchingCategories(preferences.flavorProfiles)

  const results: RecommendedMix[] = []

  for (const mix of MIX_RECIPES) {
    // Check if mix categories match preferences
    const mixTags = mix.tags || []

    // Also check ingredient categories
    const ingredientCategories = mix.ingredients.map(i => i.category)
    const categoryOverlap = ingredientCategories.filter(cat => matchingCategories.includes(cat))
    const tagOverlap = mixTags.filter(tag =>
      matchingCategories.some(cat => tag.toLowerCase().includes(cat))
    )

    // Calculate match score based on mix properties
    let score = 0
    const reasons: string[] = []

    // Category match from ingredients (up to 40 points)
    if (categoryOverlap.length > 0) {
      score += Math.min(categoryOverlap.length * 15, 40)
      for (const profile of preferences.flavorProfiles) {
        const profileCategories = PROFILE_TO_CATEGORIES[profile]
        if (profileCategories.some(cat => ingredientCategories.includes(cat))) {
          reasons.push(`${FLAVOR_PROFILE_LABELS[profile].emoji} ${FLAVOR_PROFILE_LABELS[profile].label}`)
        }
      }
    }

    // Tag match bonus (up to 10 points)
    if (tagOverlap.length > 0) {
      score += Math.min(tagOverlap.length * 5, 10)
    }

    // Popularity bonus (up to 30 points)
    if (mix.popularity) {
      score += Math.round((mix.popularity / 5) * 30)
    }

    // Difficulty consideration (up to 20 points - easier mixes score higher)
    if (mix.difficulty) {
      const difficultyScore = mix.difficulty === 'easy' ? 20 : mix.difficulty === 'medium' ? 10 : 5
      score += difficultyScore
    }

    // Skip mixes with very low scores
    if (score < 30) continue

    // Check inventory availability
    let availability: 'full' | 'partial' | 'none' | null = null
    const missingTobaccos: string[] = []
    const replacements: TobaccoReplacement[] = []

    if (inventory) {
      let foundCount = 0
      let totalCount = mix.ingredients.length

      for (const ingredient of mix.ingredients) {
        const inStock = inventory.find(
          inv => inv.brand.toLowerCase() === (ingredient.brand || '').toLowerCase() &&
                 inv.flavor.toLowerCase() === ingredient.flavor.toLowerCase() &&
                 inv.quantity_grams > 0
        )

        if (inStock) {
          foundCount++
        } else {
          missingTobaccos.push(`${ingredient.brand || ''} ${ingredient.flavor}`.trim())

          // Try to find a replacement
          if (ingredient.brand) {
            const replacement = findReplacement(
              ingredient.brand,
              ingredient.flavor,
              preferences,
              inventory
            )
            if (replacement) {
              replacements.push(replacement)
            }
          }
        }
      }

      if (foundCount === totalCount) {
        availability = 'full'
      } else if (foundCount > 0 || replacements.length > 0) {
        availability = 'partial'
      } else {
        availability = 'none'
      }
    }

    results.push({
      mix,
      matchScore: score,
      matchReasons: reasons.length > 0 ? reasons : ['Popular mix'],
      availability,
      missingTobaccos,
      replacements
    })
  }

  // Sort by availability (if inventory checked), then by match score
  results.sort((a, b) => {
    if (inventory) {
      const availOrder = { full: 0, partial: 1, none: 2 }
      const aOrder = a.availability ? availOrder[a.availability] : 3
      const bOrder = b.availability ? availOrder[b.availability] : 3
      if (aOrder !== bOrder) return aOrder - bOrder
    }
    return b.matchScore - a.matchScore
  })

  return results.slice(0, limit)
}

/**
 * Main recommendation function - combines tobaccos and mixes
 */
export function getRecommendations(
  preferences: GuestPreferences,
  inventory: TobaccoInventory[] | null = null
): RecommendationResult {
  return {
    tobaccos: recommendTobaccos(preferences, inventory),
    mixes: recommendMixes(preferences, inventory),
    hasInventory: inventory !== null && inventory.length > 0
  }
}

/**
 * Get all available flavor profiles
 */
export function getAllFlavorProfiles(): FlavorProfile[] {
  return ['fresh', 'fruity', 'sweet', 'citrus', 'spicy', 'soda']
}

/**
 * Get all strength options
 */
export function getAllStrengthOptions(): StrengthPreference[] {
  return ['light', 'medium', 'strong']
}
