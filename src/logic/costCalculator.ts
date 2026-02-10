/**
 * Cost Calculator
 *
 * Calculates mix cost based on actual inventory purchase prices.
 * Works with any currency - prices are entered by the business.
 */

import type { TobaccoInventory } from '@/types/database'
import type { Tobacco } from '@/data/tobaccos'

// ============================================================================
// Types
// ============================================================================

export interface MixCostItem {
  tobacco: Tobacco
  percent: number
  grams: number
  pricePerGram: number | null
  cost: number | null
  inInventory: boolean
}

export interface MixCostResult {
  items: MixCostItem[]
  totalCost: number | null      // null if any item has no price
  hasPricing: boolean           // true if at least one item has pricing
  allPriced: boolean            // true if all items have pricing
  missingPrices: string[]       // list of tobaccos without prices
}

export interface ProfitAnalysis {
  cost: number
  sellingPrice: number
  profit: number
  marginPercent: number
}

// ============================================================================
// Constants
// ============================================================================

// Common package sizes in grams
export const PACKAGE_SIZES = [
  { value: 25, label: '25г' },
  { value: 100, label: '100г' },
  { value: 200, label: '200г' },
  { value: 250, label: '250г' },
] as const

// Default markup multipliers for price suggestions
export const MARKUP_MULTIPLIERS = {
  low: 2.0,      // 100% markup
  medium: 2.5,   // 150% markup
  high: 3.0,     // 200% markup
  premium: 4.0,  // 300% markup
} as const

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Calculate the cost of a mix based on inventory prices
 */
export function calculateMixCost(
  items: { tobacco: Tobacco; percent: number }[],
  totalGrams: number,
  inventory: TobaccoInventory[]
): MixCostResult {
  const missingPrices: string[] = []

  const costItems: MixCostItem[] = items.map(item => {
    const grams = (totalGrams * item.percent) / 100

    // Find matching inventory item
    const invItem = findInventoryMatch(item.tobacco, inventory)

    if (!invItem || invItem.purchase_price === null || invItem.purchase_price === 0) {
      missingPrices.push(`${item.tobacco.brand} ${item.tobacco.flavor}`)
      return {
        tobacco: item.tobacco,
        percent: item.percent,
        grams,
        pricePerGram: null,
        cost: null,
        inInventory: !!invItem,
      }
    }

    // Calculate price per gram
    const packageGrams = invItem.package_grams || 100
    const pricePerGram = invItem.purchase_price / packageGrams
    const cost = grams * pricePerGram

    return {
      tobacco: item.tobacco,
      percent: item.percent,
      grams,
      pricePerGram,
      cost,
      inInventory: true,
    }
  })

  const hasPricing = costItems.some(item => item.cost !== null)
  const allPriced = costItems.every(item => item.cost !== null)

  // Total cost is only valid if all items are priced
  const totalCost = allPriced
    ? costItems.reduce((sum, item) => sum + (item.cost || 0), 0)
    : null

  return {
    items: costItems,
    totalCost,
    hasPricing,
    allPriced,
    missingPrices,
  }
}

/**
 * Calculate profit analysis for a mix
 */
export function calculateProfit(
  cost: number,
  sellingPrice: number
): ProfitAnalysis {
  const profit = sellingPrice - cost
  const marginPercent = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0

  return {
    cost,
    sellingPrice,
    profit,
    marginPercent,
  }
}

/**
 * Get suggested selling prices based on cost
 */
export function getSuggestedPrices(cost: number): { label: string; price: number; margin: number }[] {
  return [
    { label: '×2', price: roundPrice(cost * MARKUP_MULTIPLIERS.low), margin: 50 },
    { label: '×2.5', price: roundPrice(cost * MARKUP_MULTIPLIERS.medium), margin: 60 },
    { label: '×3', price: roundPrice(cost * MARKUP_MULTIPLIERS.high), margin: 67 },
    { label: '×4', price: roundPrice(cost * MARKUP_MULTIPLIERS.premium), margin: 75 },
  ]
}

/**
 * Calculate cost per gram for a tobacco item
 */
export function getCostPerGram(invItem: TobaccoInventory): number | null {
  if (!invItem.purchase_price || invItem.purchase_price === 0) {
    return null
  }
  const packageGrams = invItem.package_grams || 100
  return invItem.purchase_price / packageGrams
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find matching inventory item for a tobacco
 */
function findInventoryMatch(
  tobacco: Tobacco,
  inventory: TobaccoInventory[]
): TobaccoInventory | null {
  // First try exact match by tobacco_id
  let match = inventory.find(inv => inv.tobacco_id === tobacco.id)

  // Fallback to brand + flavor match (case insensitive)
  if (!match) {
    match = inventory.find(inv =>
      inv.brand.toLowerCase() === tobacco.brand.toLowerCase() &&
      inv.flavor.toLowerCase() === tobacco.flavor.toLowerCase()
    )
  }

  return match || null
}

/**
 * Round price to nice number (2 decimal places)
 */
function roundPrice(price: number): number {
  return Math.round(price * 100) / 100
}

/**
 * Format price for display
 */
export function formatPrice(price: number | null, currency = '€'): string {
  if (price === null) return '—'
  return `${currency}${price.toFixed(2)}`
}

/**
 * Format price per gram
 */
export function formatPricePerGram(pricePerGram: number | null, currency = '€'): string {
  if (pricePerGram === null) return '—'
  return `${currency}${pricePerGram.toFixed(3)}/г`
}
