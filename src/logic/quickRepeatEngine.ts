/**
 * Quick Repeat Engine
 *
 * Enables one-tap recreation of a guest's last mix.
 * Core adoption driver - must be FAST and work OFFLINE.
 */

import { TOBACCOS, type Tobacco } from '@/data/tobaccos'
import type {
  Guest,
  MixSnapshot,
  TobaccoInventory,
  StrengthPreference,
  PackingStyle
} from '@/types/database'

// ============================================================================
// Types
// ============================================================================

export interface QuickRepeatResult {
  success: true
  snapshot: MixSnapshot
  tobaccos: ResolvedTobacco[]
  warnings: RepeatWarning[]
}

export interface QuickRepeatError {
  success: false
  error: 'NO_GUEST' | 'NO_LAST_MIX' | 'ALL_UNAVAILABLE'
  message: string
}

export interface ResolvedTobacco {
  tobacco: Tobacco
  percent: number
  available: boolean
  stock_grams: number | null
  replacement: Tobacco | null
}

export interface RepeatWarning {
  type: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'REPLACED'
  tobacco_id: string
  message: string
  replacement?: {
    tobacco: Tobacco
    reason: string
  }
}

export interface HeatSetup {
  coals: number
  packing: PackingStyle
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Heat setup recommendations based on strength and bowl size
 */
const HEAT_RECOMMENDATIONS: Record<StrengthPreference, { coals: number; packing: PackingStyle }> = {
  light: { coals: 3, packing: 'fluffy' },
  medium: { coals: 3, packing: 'semi-dense' },
  strong: { coals: 4, packing: 'dense' },
}

const PACKING_LABELS: Record<PackingStyle, string> = {
  fluffy: 'Воздушная',
  'semi-dense': 'Средняя',
  dense: 'Плотная',
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Main function: Get a guest's last mix ready for instant use
 *
 * @param guest - Guest object with potential last_mix_snapshot
 * @param inventory - Optional inventory for Pro users (null = skip check)
 * @returns QuickRepeatResult or QuickRepeatError
 */
export function quickRepeatGuest(
  guest: Guest | null,
  inventory: TobaccoInventory[] | null = null
): QuickRepeatResult | QuickRepeatError {
  // Validate guest
  if (!guest) {
    return {
      success: false,
      error: 'NO_GUEST',
      message: 'Гость не найден',
    }
  }

  // Check for last mix
  if (!guest.last_mix_snapshot) {
    return {
      success: false,
      error: 'NO_LAST_MIX',
      message: `У ${guest.name} нет сохранённого микса`,
    }
  }

  const snapshot = guest.last_mix_snapshot
  const warnings: RepeatWarning[] = []
  const resolvedTobaccos: ResolvedTobacco[] = []

  // Resolve each tobacco in the snapshot
  for (const item of snapshot.tobaccos) {
    const tobacco = TOBACCOS.find(t => t.id === item.tobacco_id)

    if (!tobacco) {
      // Tobacco no longer exists in database - find replacement
      const replacement = findReplacement(item, snapshot.strength, inventory)
      if (replacement) {
        warnings.push({
          type: 'REPLACED',
          tobacco_id: item.tobacco_id,
          message: `${item.flavor} заменён на ${replacement.flavor}`,
          replacement: {
            tobacco: replacement,
            reason: 'Табак больше не доступен',
          },
        })
        resolvedTobaccos.push({
          tobacco: replacement,
          percent: item.percent,
          available: true,
          stock_grams: getStock(replacement, inventory),
          replacement: null,
        })
      }
      continue
    }

    // Check inventory if available
    const stockGrams = getStock(tobacco, inventory)
    const gramsNeeded = (snapshot.total_grams * item.percent) / 100

    if (inventory !== null && stockGrams !== null) {
      if (stockGrams === 0) {
        // Out of stock - try replacement
        const replacement = findReplacement(item, snapshot.strength, inventory)
        if (replacement) {
          warnings.push({
            type: 'OUT_OF_STOCK',
            tobacco_id: item.tobacco_id,
            message: `${tobacco.flavor} нет в наличии`,
            replacement: {
              tobacco: replacement,
              reason: `Замена: ${replacement.brand} ${replacement.flavor}`,
            },
          })
          resolvedTobaccos.push({
            tobacco,
            percent: item.percent,
            available: false,
            stock_grams: 0,
            replacement,
          })
        } else {
          warnings.push({
            type: 'OUT_OF_STOCK',
            tobacco_id: item.tobacco_id,
            message: `${tobacco.flavor} нет в наличии (замена не найдена)`,
          })
          resolvedTobaccos.push({
            tobacco,
            percent: item.percent,
            available: false,
            stock_grams: 0,
            replacement: null,
          })
        }
      } else if (stockGrams < gramsNeeded) {
        // Low stock warning
        warnings.push({
          type: 'LOW_STOCK',
          tobacco_id: item.tobacco_id,
          message: `${tobacco.flavor}: осталось ${stockGrams}г (нужно ${Math.round(gramsNeeded)}г)`,
        })
        resolvedTobaccos.push({
          tobacco,
          percent: item.percent,
          available: true,
          stock_grams: stockGrams,
          replacement: null,
        })
      } else {
        // Available
        resolvedTobaccos.push({
          tobacco,
          percent: item.percent,
          available: true,
          stock_grams: stockGrams,
          replacement: null,
        })
      }
    } else {
      // No inventory check
      resolvedTobaccos.push({
        tobacco,
        percent: item.percent,
        available: true,
        stock_grams: null,
        replacement: null,
      })
    }
  }

  // Check if ALL tobaccos are unavailable
  const allUnavailable = resolvedTobaccos.every(t => !t.available && !t.replacement)
  if (allUnavailable && resolvedTobaccos.length > 0) {
    return {
      success: false,
      error: 'ALL_UNAVAILABLE',
      message: 'Все табаки из микса недоступны',
    }
  }

  return {
    success: true,
    snapshot,
    tobaccos: resolvedTobaccos,
    warnings,
  }
}

/**
 * Create a mix snapshot from current session data
 */
export function createMixSnapshot(
  tobaccos: { tobacco: Tobacco; percent: number }[],
  totalGrams: number,
  strength: StrengthPreference,
  compatibilityScore: number | null,
  bowlType: string | null
): MixSnapshot {
  const heatSetup = getHeatRecommendation(strength, totalGrams)

  return {
    id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tobaccos: tobaccos.map(t => ({
      tobacco_id: t.tobacco.id,
      brand: t.tobacco.brand,
      flavor: t.tobacco.flavor,
      percent: t.percent,
      color: t.tobacco.color,
    })),
    total_grams: totalGrams,
    strength,
    compatibility_score: compatibilityScore,
    bowl_type: bowlType,
    heat_setup: heatSetup,
    created_at: new Date().toISOString(),
  }
}

/**
 * Get heat/coal recommendation based on strength and bowl size
 */
export function getHeatRecommendation(
  strength: StrengthPreference,
  totalGrams: number
): HeatSetup {
  const base = HEAT_RECOMMENDATIONS[strength]

  // Adjust coals for bowl size
  let coals = base.coals
  if (totalGrams > 25) coals += 1
  if (totalGrams < 15) coals -= 1
  coals = Math.max(2, Math.min(5, coals))

  return {
    coals,
    packing: base.packing,
  }
}

/**
 * Format heat setup for display
 */
export function formatHeatSetup(setup: HeatSetup): string {
  return `${setup.coals} угля, ${PACKING_LABELS[setup.packing]} забивка`
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get stock quantity for a tobacco
 */
function getStock(
  tobacco: Tobacco,
  inventory: TobaccoInventory[] | null
): number | null {
  if (!inventory) return null

  const item = inventory.find(
    inv => inv.brand.toLowerCase() === tobacco.brand.toLowerCase() &&
           inv.flavor.toLowerCase() === tobacco.flavor.toLowerCase()
  )

  return item?.quantity_grams ?? 0
}

/**
 * Find a replacement tobacco with similar characteristics
 */
function findReplacement(
  original: { tobacco_id: string; brand: string; flavor: string; percent: number },
  strength: StrengthPreference,
  inventory: TobaccoInventory[] | null
): Tobacco | null {
  // Find original tobacco to get category
  const originalTobacco = TOBACCOS.find(t => t.id === original.tobacco_id)
  if (!originalTobacco) {
    // Try to find by flavor name
    const byFlavor = TOBACCOS.find(t =>
      t.flavor.toLowerCase() === original.flavor.toLowerCase()
    )
    if (byFlavor) return byFlavor
  }

  const category = originalTobacco?.category

  // Find candidates in same category
  const candidates = TOBACCOS.filter(t => {
    if (t.id === original.tobacco_id) return false
    if (category && t.category !== category) return false

    // Check strength range
    const strengthRanges = {
      light: [1, 4],
      medium: [5, 7],
      strong: [8, 10],
    }
    const [min, max] = strengthRanges[strength]
    if (t.strength < min || t.strength > max) return false

    // If we have inventory, must be in stock
    if (inventory) {
      const stock = getStock(t, inventory)
      if (stock === null || stock <= 0) return false
    }

    return true
  })

  if (candidates.length === 0) return null

  // Sort by similarity (same brand preferred)
  candidates.sort((a, b) => {
    if (a.brand === original.brand && b.brand !== original.brand) return -1
    if (b.brand === original.brand && a.brand !== original.brand) return 1
    return 0
  })

  return candidates[0]
}

// ============================================================================
// Local Storage (Offline Support)
// ============================================================================

const STORAGE_KEY = 'hookah-mix-guests-cache'
const SYNC_QUEUE_KEY = 'hookah-mix-sync-queue'

/**
 * Cache guests locally for offline access
 */
export function cacheGuestsLocally(guests: Guest[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      guests,
      cached_at: new Date().toISOString(),
    }))
  } catch (e) {
    console.warn('Failed to cache guests locally:', e)
  }
}

/**
 * Get cached guests (for offline mode)
 */
export function getCachedGuests(): Guest[] | null {
  if (typeof window === 'undefined') return null

  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null

    const parsed = JSON.parse(data)
    return parsed.guests || null
  } catch (e) {
    return null
  }
}

/**
 * Queue a guest update for sync when back online
 */
export function queueGuestUpdate(guestId: string, update: Partial<Guest>): void {
  if (typeof window === 'undefined') return

  try {
    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]')
    queue.push({
      type: 'UPDATE_GUEST',
      guestId,
      update,
      queued_at: new Date().toISOString(),
    })
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
  } catch (e) {
    console.warn('Failed to queue guest update:', e)
  }
}

/**
 * Get pending sync operations
 */
export function getPendingSyncOps(): Array<{ type: string; guestId: string; update: Partial<Guest> }> {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

/**
 * Clear sync queue after successful sync
 */
export function clearSyncQueue(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SYNC_QUEUE_KEY)
}

// ============================================================================
// Recent Guests
// ============================================================================

/**
 * Get recent guests (sorted by last visit)
 */
export function getRecentGuests(guests: Guest[], limit: number = 10): Guest[] {
  return [...guests]
    .filter(g => g.last_visit_at) // Only guests who have visited
    .sort((a, b) => {
      const dateA = a.last_visit_at ? new Date(a.last_visit_at).getTime() : 0
      const dateB = b.last_visit_at ? new Date(b.last_visit_at).getTime() : 0
      return dateB - dateA
    })
    .slice(0, limit)
}

/**
 * Search guests by name (fast, local)
 */
export function searchGuests(guests: Guest[], query: string): Guest[] {
  if (!query.trim()) return []

  const normalizedQuery = query.toLowerCase().trim()

  return guests.filter(g =>
    g.name.toLowerCase().includes(normalizedQuery)
  ).slice(0, 10)
}
