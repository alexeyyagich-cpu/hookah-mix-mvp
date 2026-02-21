import { TOBACCOS } from '@/data/tobaccos'

export interface ExtractedItem {
  brand: string
  flavor: string
  quantity: number
  price: number
  packageGrams: number
  matched: boolean
  matchedTobaccoId?: string
}

export interface ExtractedInvoice {
  items: ExtractedItem[]
  total: number
  supplier: string | null
  date: string | null
}

// Fuzzy match extracted items against the tobacco catalog
export function matchTobaccoCatalog(items: ExtractedItem[]): ExtractedItem[] {
  return items.map(item => {
    const brandLower = item.brand.toLowerCase()
    const flavorLower = item.flavor.toLowerCase()

    // Try exact match first
    const exactMatch = TOBACCOS.find(t =>
      t.brand.toLowerCase() === brandLower &&
      t.flavor.toLowerCase() === flavorLower
    )

    if (exactMatch) {
      return { ...item, matched: true, matchedTobaccoId: exactMatch.id }
    }

    // Try partial match on brand + contains flavor
    const partialMatch = TOBACCOS.find(t =>
      t.brand.toLowerCase().includes(brandLower) &&
      (t.flavor.toLowerCase().includes(flavorLower) || flavorLower.includes(t.flavor.toLowerCase()))
    )

    if (partialMatch) {
      return { ...item, matched: true, matchedTobaccoId: partialMatch.id }
    }

    return { ...item, matched: false }
  })
}

export function validateExtractedInvoice(invoice: ExtractedInvoice): string[] {
  const errors: string[] = []

  if (invoice.items.length === 0) {
    errors.push('No items found in invoice')
  }

  for (let i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i]
    if (!item.brand) errors.push(`Row ${i + 1}: missing brand`)
    if (!item.flavor) errors.push(`Row ${i + 1}: missing flavor`)
    if (item.quantity <= 0) errors.push(`Row ${i + 1}: invalid quantity`)
  }

  return errors
}
