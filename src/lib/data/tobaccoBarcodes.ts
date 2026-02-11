// Database of known tobacco barcodes
// Format: EAN-13 or UPC-A codes mapped to tobacco info

export interface TobaccoBarcode {
  barcode: string
  brand: string
  flavor: string
  packageGrams: number
}

// Common tobacco barcodes (sample data)
// In production, this would be a larger database or API
export const TOBACCO_BARCODES: TobaccoBarcode[] = [
  // Darkside
  { barcode: '4680016820013', brand: 'Darkside', flavor: 'Supernova', packageGrams: 100 },
  { barcode: '4680016820020', brand: 'Darkside', flavor: 'Grape Core', packageGrams: 100 },
  { barcode: '4680016820037', brand: 'Darkside', flavor: 'Kalee Grap', packageGrams: 100 },
  { barcode: '4680016820044', brand: 'Darkside', flavor: 'Pear', packageGrams: 100 },
  { barcode: '4680016820051', brand: 'Darkside', flavor: 'Falling Star', packageGrams: 100 },

  // Musthave
  { barcode: '4607176999013', brand: 'Musthave', flavor: 'Pinkman', packageGrams: 125 },
  { barcode: '4607176999020', brand: 'Musthave', flavor: 'Banana Mama', packageGrams: 125 },
  { barcode: '4607176999037', brand: 'Musthave', flavor: 'Strawberry Lychee', packageGrams: 125 },
  { barcode: '4607176999044', brand: 'Musthave', flavor: 'Mango Sling', packageGrams: 125 },
  { barcode: '4607176999051', brand: 'Musthave', flavor: 'Space Flavour', packageGrams: 125 },

  // Tangiers
  { barcode: '0854836001013', brand: 'Tangiers', flavor: 'Cane Mint', packageGrams: 250 },
  { barcode: '0854836001020', brand: 'Tangiers', flavor: 'Kashmir Peach', packageGrams: 250 },
  { barcode: '0854836001037', brand: 'Tangiers', flavor: 'Horchata', packageGrams: 250 },
  { barcode: '0854836001044', brand: 'Tangiers', flavor: 'Orange Soda', packageGrams: 250 },

  // Adalya
  { barcode: '8699261410013', brand: 'Adalya', flavor: 'Love 66', packageGrams: 50 },
  { barcode: '8699261410020', brand: 'Adalya', flavor: 'Blue Ice', packageGrams: 50 },
  { barcode: '8699261410037', brand: 'Adalya', flavor: 'Lady Killer', packageGrams: 50 },
  { barcode: '8699261410044', brand: 'Adalya', flavor: 'Watermelon', packageGrams: 50 },

  // Al Fakher
  { barcode: '6291100120013', brand: 'Al Fakher', flavor: 'Two Apples', packageGrams: 50 },
  { barcode: '6291100120020', brand: 'Al Fakher', flavor: 'Grape Mint', packageGrams: 50 },
  { barcode: '6291100120037', brand: 'Al Fakher', flavor: 'Blueberry Mint', packageGrams: 50 },
  { barcode: '6291100120044', brand: 'Al Fakher', flavor: 'Watermelon Mint', packageGrams: 50 },

  // Fumari
  { barcode: '0850015340013', brand: 'Fumari', flavor: 'White Gummi Bear', packageGrams: 100 },
  { barcode: '0850015340020', brand: 'Fumari', flavor: 'Lemon Mint', packageGrams: 100 },
  { barcode: '0850015340037', brand: 'Fumari', flavor: 'Blueberry Muffin', packageGrams: 100 },

  // Element
  { barcode: '4630003360013', brand: 'Element', flavor: 'Mint', packageGrams: 100 },
  { barcode: '4630003360020', brand: 'Element', flavor: 'Kalamansi', packageGrams: 100 },
  { barcode: '4630003360037', brand: 'Element', flavor: 'Mango', packageGrams: 100 },
]

// Lookup function
export function findTobaccoByBarcode(barcode: string): TobaccoBarcode | null {
  // Clean the barcode (remove spaces, dashes)
  const cleanBarcode = barcode.replace(/[\s-]/g, '')

  return TOBACCO_BARCODES.find(t => t.barcode === cleanBarcode) || null
}

// Get unique brands from barcodes
export function getBarcodebrands(): string[] {
  return [...new Set(TOBACCO_BARCODES.map(t => t.brand))]
}
