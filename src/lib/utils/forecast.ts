import type { InventoryTransaction } from '@/types/database'

export interface ForecastResult {
  daysUntilEmpty: number | null  // null = not enough data
  estimatedEmptyDate: Date | null
  avgDailyConsumption: number
  confidence: 'low' | 'medium' | 'high'
}

/**
 * Calculate forecast for a single inventory item based on consumption history
 *
 * @param currentQuantity Current quantity in grams
 * @param transactions Transaction history for this item
 * @param daysToAnalyze Number of days to look back for calculating average
 * @returns Forecast result with days until empty, estimated date, and confidence
 */
export function calculateForecast(
  currentQuantity: number,
  transactions: InventoryTransaction[],
  daysToAnalyze: number = 30
): ForecastResult {
  // Filter to only consumption transactions (session, waste) within the analysis period
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToAnalyze)

  const consumptionTransactions = transactions.filter(t => {
    if (t.type !== 'session' && t.type !== 'waste') return false
    const txDate = new Date(t.created_at)
    return txDate >= cutoffDate
  })

  // If no consumption data, return null forecast
  if (consumptionTransactions.length === 0) {
    return {
      daysUntilEmpty: null,
      estimatedEmptyDate: null,
      avgDailyConsumption: 0,
      confidence: 'low',
    }
  }

  // Calculate total consumption (transactions are negative for consumption)
  const totalConsumption = consumptionTransactions.reduce((sum, t) => {
    return sum + Math.abs(t.quantity_grams)
  }, 0)

  // Calculate actual days of data we have
  const oldestTransaction = consumptionTransactions.reduce((oldest, t) => {
    const txDate = new Date(t.created_at)
    return txDate < oldest ? txDate : oldest
  }, new Date())

  const now = new Date()
  const actualDays = Math.max(1, Math.ceil((now.getTime() - oldestTransaction.getTime()) / (1000 * 60 * 60 * 24)))

  // Calculate average daily consumption
  const avgDailyConsumption = totalConsumption / actualDays

  // If average is 0 or negligible, item will last indefinitely
  if (avgDailyConsumption < 0.1) {
    return {
      daysUntilEmpty: null, // Effectively infinite
      estimatedEmptyDate: null,
      avgDailyConsumption: 0,
      confidence: 'low',
    }
  }

  // Calculate days until empty
  const daysUntilEmpty = Math.ceil(currentQuantity / avgDailyConsumption)

  // Calculate estimated empty date
  const estimatedEmptyDate = new Date()
  estimatedEmptyDate.setDate(estimatedEmptyDate.getDate() + daysUntilEmpty)

  // Determine confidence based on data quality
  let confidence: 'low' | 'medium' | 'high' = 'low'
  if (consumptionTransactions.length >= 10 && actualDays >= 14) {
    confidence = 'high'
  } else if (consumptionTransactions.length >= 3 && actualDays >= 7) {
    confidence = 'medium'
  }

  return {
    daysUntilEmpty,
    estimatedEmptyDate,
    avgDailyConsumption: Math.round(avgDailyConsumption * 10) / 10,
    confidence,
  }
}

/**
 * Format forecast days for display
 */
export function formatForecastDays(days: number | null): string {
  if (days === null) return '∞'
  if (days <= 0) return 'Out of stock'
  if (days === 1) return '~1 day'
  if (days < 7) return `~${days} days`
  if (days < 14) return '~1 week'
  if (days < 30) return `~${Math.round(days / 7)} weeks`
  if (days < 60) return '~1 month'
  return `~${Math.round(days / 30)} months`
}

/**
 * Get color class for forecast days
 */
export function getForecastColor(days: number | null): 'danger' | 'warning' | 'success' | 'muted' {
  if (days === null) return 'muted'
  if (days <= 0) return 'danger'
  if (days < 7) return 'danger'
  if (days < 14) return 'warning'
  return 'success'
}
