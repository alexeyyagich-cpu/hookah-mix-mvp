// Bowl catalog — popular hookah bowls 2025-2026

export type BowlCategory = 'phunnel' | 'turkish' | 'killer' | 'upg' | 'classic'

export interface BowlPreset {
  id: string
  name: string
  brand: string
  category: BowlCategory
  capacity: number // typical capacity in grams
}

export const BOWL_CATEGORIES: Record<BowlCategory, string> = {
  phunnel: 'Phunnel (Фанел)',
  turkish: 'Turkish (Турка)',
  killer: 'Killer (Убивашка)',
  upg: 'UPG',
  classic: 'Classic',
}

export const BOWL_PRESETS: BowlPreset[] = [
  // Upgrade Form (UPG)
  { id: 'upg-std',    name: 'UPG Standard',         brand: 'Upgrade Form', category: 'upg',     capacity: 18 },
  { id: 'upg-big',    name: 'UPG Big',              brand: 'Upgrade Form', category: 'upg',     capacity: 22 },
  { id: 'upg-ph',     name: 'UPG Phunnel',          brand: 'Upgrade Form', category: 'phunnel', capacity: 18 },

  // Oblako
  { id: 'ob-mono-s',  name: 'Oblako Mono S',        brand: 'Oblako', category: 'phunnel', capacity: 12 },
  { id: 'ob-mono-m',  name: 'Oblako Mono M',        brand: 'Oblako', category: 'phunnel', capacity: 18 },
  { id: 'ob-mono-l',  name: 'Oblako Mono L',        brand: 'Oblako', category: 'phunnel', capacity: 22 },
  { id: 'ob-killer',  name: 'Oblako Killer',         brand: 'Oblako', category: 'killer',  capacity: 20 },

  // Cosmo
  { id: 'cos-turk',   name: 'Cosmo Turkish Classic', brand: 'Cosmo',  category: 'turkish', capacity: 20 },
  { id: 'cos-pred',   name: 'Cosmo Predator',        brand: 'Cosmo',  category: 'turkish', capacity: 18 },
  { id: 'cos-dragon', name: 'Cosmo Dragon',          brand: 'Cosmo',  category: 'turkish', capacity: 20 },

  // Alpha Bowl
  { id: 'ab-turk',    name: 'Alpha Bowl Turk',       brand: 'Alpha Bowl', category: 'turkish', capacity: 25 },
  { id: 'ab-wave',    name: 'Alpha Bowl Wave',        brand: 'Alpha Bowl', category: 'phunnel', capacity: 20 },

  // Japona
  { id: 'jp-mummy',   name: 'Japona Mummy',          brand: 'Japona', category: 'phunnel', capacity: 15 },
  { id: 'jp-killer',  name: 'Japona Killer',          brand: 'Japona', category: 'killer',  capacity: 18 },

  // Alpaca
  { id: 'alp-rook',   name: 'Alpaca Rook',           brand: 'Alpaca', category: 'phunnel', capacity: 25 },
  { id: 'alp-mini',   name: 'Alpaca Mini Rook',      brand: 'Alpaca', category: 'phunnel', capacity: 12 },
  { id: 'alp-lerook', name: 'Alpaca LeRook',         brand: 'Alpaca', category: 'phunnel', capacity: 20 },

  // Solaris
  { id: 'sol-merc',   name: 'Solaris Mercury',        brand: 'Solaris', category: 'killer',  capacity: 18 },
  { id: 'sol-phob',   name: 'Solaris Phobos',         brand: 'Solaris', category: 'turkish', capacity: 20 },

  // Воскуримся
  { id: 'vk-turka',   name: 'Воскуримся Турка',       brand: 'Воскуримся', category: 'turkish', capacity: 18 },
  { id: 'vk-killer',  name: 'Воскуримся Убивашка',    brand: 'Воскуримся', category: 'killer',  capacity: 20 },

  // Kong
  { id: 'kong-boy',   name: 'Kong Turkish Boy',       brand: 'Kong',  category: 'turkish', capacity: 18 },
  { id: 'kong-cos',   name: 'Kong Turkish Cosmic',    brand: 'Kong',  category: 'turkish', capacity: 22 },

  // Harvik
  { id: 'hv-turk',    name: 'Harvik Turk Milk',       brand: 'Harvik', category: 'turkish', capacity: 16 },
  { id: 'hv-bolt',    name: 'Harvik Bolt',             brand: 'Harvik', category: 'killer',  capacity: 18 },

  // FOX
  { id: 'fox-boch',   name: 'FOX Bochka',             brand: 'FOX',   category: 'turkish', capacity: 18 },
  { id: 'fox-boch2',  name: 'FOX Bochka 2.0',         brand: 'FOX',   category: 'turkish', capacity: 20 },

  // Forma
  { id: 'frm-turka',  name: 'Forma Turka',            brand: 'Forma', category: 'turkish', capacity: 18 },

  // Tangiers
  { id: 'tg-ph-s',    name: 'Tangiers Phunnel S',     brand: 'Tangiers', category: 'phunnel', capacity: 18 },
  { id: 'tg-ph-m',    name: 'Tangiers Phunnel M',     brand: 'Tangiers', category: 'phunnel', capacity: 35 },

  // Kaloud / Samsaris
  { id: 'kl-vitria',  name: 'Samsaris Vitria',         brand: 'Kaloud', category: 'phunnel', capacity: 18 },

  // Hookain
  { id: 'hi-litlip',  name: 'Hookain Lit Lip',         brand: 'Hookain', category: 'phunnel', capacity: 20 },
]

// --- Helpers ---

export const getBowlBrands = (): string[] =>
  [...new Set(BOWL_PRESETS.map(b => b.brand))].sort((a, b) => a.localeCompare(b))

export const getBowlsByBrand = (brand: string): BowlPreset[] =>
  BOWL_PRESETS.filter(b => b.brand === brand).sort((a, b) => a.name.localeCompare(b.name))

export const getBowlsByCategory = (category: BowlCategory): BowlPreset[] =>
  BOWL_PRESETS.filter(b => b.category === category).sort((a, b) => a.name.localeCompare(b.name))

export const getCategoryNames = (): { id: BowlCategory; label: string }[] =>
  (Object.entries(BOWL_CATEGORIES) as [BowlCategory, string][]).map(([id, label]) => ({ id, label }))
