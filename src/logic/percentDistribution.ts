/**
 * Shared percent-distribution logic for tobacco mixes.
 *
 * Mint tobaccos are capped at 25 % to preserve flavor balance.
 * Darkside Supernova ("ds1") is capped at 10 % (~2 g per 20 g bowl).
 * Remaining percentage is distributed evenly among non-mint tobaccos.
 */

export const SUPERNOVA_ID = 'ds1'
export const SUPERNOVA_CAP = 10
export const MINT_CAP = 25

export interface TobaccoItem {
  id: string
  category: string
}

/**
 * Distribute 100 % among the given tobaccos, respecting mint / supernova caps.
 * Returns a map from tobacco id → percentage.
 */
export function distributePercents(items: TobaccoItem[]): Record<string, number> {
  if (items.length === 0) return {}
  if (items.length === 1) return { [items[0].id]: 100 }

  const hasSupernova = items.some(t => t.id === SUPERNOVA_ID)
  const mintIds = items
    .filter(t => t.category === 'mint' && t.id !== SUPERNOVA_ID)
    .map(t => t.id)
  const nonMintIds = items
    .filter(t => t.id !== SUPERNOVA_ID && !mintIds.includes(t.id))
    .map(t => t.id)

  const supernovaTotal = hasSupernova ? SUPERNOVA_CAP : 0
  const mintTotal = mintIds.length * MINT_CAP
  const nonMintTotal = 100 - supernovaTotal - mintTotal

  const nonMintBase = nonMintIds.length > 0
    ? Math.floor(nonMintTotal / nonMintIds.length)
    : 0
  const remainder = nonMintIds.length > 0
    ? nonMintTotal - nonMintBase * nonMintIds.length
    : 0

  const result: Record<string, number> = {}

  if (hasSupernova) result[SUPERNOVA_ID] = SUPERNOVA_CAP
  for (const id of mintIds) result[id] = MINT_CAP
  for (let i = 0; i < nonMintIds.length; i++) {
    result[nonMintIds[i]] = nonMintBase + (i === 0 ? remainder : 0)
  }

  return result
}

/**
 * After manually changing one tobacco's percent, rebalance the others
 * proportionally so the total remains 100 %.
 */
export function rebalancePercents(
  percents: Record<string, number>,
  changedId: string,
  newPercent: number,
  allIds: string[],
): Record<string, number> {
  const clamped = Math.max(0, Math.min(100, Math.round(newPercent)))
  const others = allIds.filter(id => id !== changedId)
  const remaining = 100 - clamped
  const next: Record<string, number> = { ...percents, [changedId]: clamped }

  if (others.length === 0) {
    next[changedId] = 100
    return next
  }

  if (others.length === 1) {
    next[others[0]] = remaining
    return next
  }

  // Distribute proportionally
  const othersSum = others.reduce((sum, id) => sum + (percents[id] ?? 0), 0) || 1
  for (const id of others) {
    next[id] = Math.round(remaining * ((percents[id] ?? 0) / othersSum))
  }

  return next
}
