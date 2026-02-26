import type { SessionWithItems, TobaccoInventory } from '@/types/database'

export type ABCCategory = 'A' | 'B' | 'C'

export interface ABCItem {
  tobaccoId: string
  brand: string
  flavor: string
  value: number
  cumulativePercent: number
  category: ABCCategory
}

export interface ABCResult {
  items: ABCItem[]
  summary: {
    A: { count: number; percent: number; valuePercent: number }
    B: { count: number; percent: number; valuePercent: number }
    C: { count: number; percent: number; valuePercent: number }
  }
}

function classify(items: { tobaccoId: string; brand: string; flavor: string; value: number }[]): ABCResult {
  if (items.length === 0) {
    return {
      items: [],
      summary: {
        A: { count: 0, percent: 0, valuePercent: 0 },
        B: { count: 0, percent: 0, valuePercent: 0 },
        C: { count: 0, percent: 0, valuePercent: 0 },
      },
    }
  }

  const sorted = [...items].sort((a, b) => b.value - a.value)
  const total = sorted.reduce((s, x) => s + x.value, 0)
  if (total === 0) {
    return {
      items: sorted.map(i => ({ ...i, cumulativePercent: 0, category: 'C' as ABCCategory })),
      summary: {
        A: { count: 0, percent: 0, valuePercent: 0 },
        B: { count: 0, percent: 0, valuePercent: 0 },
        C: { count: sorted.length, percent: 100, valuePercent: 0 },
      },
    }
  }

  let cumulative = 0
  const classified: ABCItem[] = sorted.map(item => {
    cumulative += item.value
    const cumulativePercent = (cumulative / total) * 100
    let category: ABCCategory = 'C'
    if (cumulativePercent <= 80) category = 'A'
    else if (cumulativePercent <= 95) category = 'B'
    return { ...item, cumulativePercent, category }
  })

  const aItems = classified.filter(i => i.category === 'A')
  const bItems = classified.filter(i => i.category === 'B')
  const cItems = classified.filter(i => i.category === 'C')

  return {
    items: classified,
    summary: {
      A: {
        count: aItems.length,
        percent: (aItems.length / classified.length) * 100,
        valuePercent: total > 0 ? (aItems.reduce((s, x) => s + x.value, 0) / total) * 100 : 0,
      },
      B: {
        count: bItems.length,
        percent: (bItems.length / classified.length) * 100,
        valuePercent: total > 0 ? (bItems.reduce((s, x) => s + x.value, 0) / total) * 100 : 0,
      },
      C: {
        count: cItems.length,
        percent: (cItems.length / classified.length) * 100,
        valuePercent: total > 0 ? (cItems.reduce((s, x) => s + x.value, 0) / total) * 100 : 0,
      },
    },
  }
}

export function calculateABCByUsage(sessions: SessionWithItems[]): ABCResult {
  const usage: Record<string, { tobaccoId: string; brand: string; flavor: string; value: number }> = {}

  for (const session of sessions) {
    for (const item of session.session_items || []) {
      const key = item.tobacco_id
      if (!usage[key]) {
        usage[key] = { tobaccoId: item.tobacco_id, brand: item.brand, flavor: item.flavor, value: 0 }
      }
      usage[key].value += item.grams_used
    }
  }

  return classify(Object.values(usage))
}

export function calculateABCByRevenue(sessions: SessionWithItems[]): ABCResult {
  // Revenue is tracked at session level via selling_price
  // Attribute revenue proportionally to tobaccos by grams used
  const revenue: Record<string, { tobaccoId: string; brand: string; flavor: string; value: number }> = {}

  for (const session of sessions) {
    const sessionRevenue = session.selling_price || 0
    const totalGrams = session.total_grams
    if (!totalGrams || totalGrams <= 0) continue
    for (const item of session.session_items || []) {
      const key = item.tobacco_id
      if (!revenue[key]) {
        revenue[key] = { tobaccoId: item.tobacco_id, brand: item.brand, flavor: item.flavor, value: 0 }
      }
      revenue[key].value += (item.grams_used / totalGrams) * sessionRevenue
    }
  }

  return classify(Object.values(revenue))
}

export function calculateABCByMargin(
  sessions: SessionWithItems[],
  inventory: TobaccoInventory[]
): ABCResult {
  const pricePerGram: Record<string, number> = {}
  for (const inv of inventory) {
    if (inv.purchase_price && inv.package_grams && inv.package_grams > 0) {
      pricePerGram[inv.tobacco_id] = inv.purchase_price / inv.package_grams
    }
  }

  const margin: Record<string, { tobaccoId: string; brand: string; flavor: string; value: number }> = {}

  for (const session of sessions) {
    const sessionRevenue = session.selling_price || 0
    const totalGrams = session.total_grams
    if (!totalGrams || totalGrams <= 0) continue
    for (const item of session.session_items || []) {
      const key = item.tobacco_id
      if (!margin[key]) {
        margin[key] = { tobaccoId: item.tobacco_id, brand: item.brand, flavor: item.flavor, value: 0 }
      }
      const itemRevenue = (item.grams_used / totalGrams) * sessionRevenue
      const itemCost = item.grams_used * (pricePerGram[item.tobacco_id] || 0)
      margin[key].value += itemRevenue - itemCost
    }
  }

  return classify(Object.values(margin))
}
