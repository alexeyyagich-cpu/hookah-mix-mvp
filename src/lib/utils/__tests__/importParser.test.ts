import { describe, it, expect } from 'vitest'
import { autoMapColumns, validateImportRow, type ColumnMapping } from '../importParser'

describe('autoMapColumns', () => {
  it('maps English headers', () => {
    const headers = ['brand', 'flavor', 'quantity', 'price', 'package']
    const result = autoMapColumns(headers)
    expect(result.brand).toBe('brand')
    expect(result.flavor).toBe('flavor')
    expect(result.quantity_grams).toBe('quantity')
    expect(result.purchase_price).toBe('price')
    expect(result.package_grams).toBe('package')
  })

  it('maps Russian headers', () => {
    const headers = ['марка', 'вкус', 'количество', 'цена', 'упаковка']
    const result = autoMapColumns(headers)
    expect(result.brand).toBe('марка')
    expect(result.flavor).toBe('вкус')
    expect(result.quantity_grams).toBe('количество')
    expect(result.purchase_price).toBe('цена')
    expect(result.package_grams).toBe('упаковка')
  })

  it('maps German headers', () => {
    const headers = ['hersteller', 'geschmack', 'menge', 'einkaufspreis', 'packung']
    const result = autoMapColumns(headers)
    expect(result.brand).toBe('hersteller')
    expect(result.flavor).toBe('geschmack')
    expect(result.quantity_grams).toBe('menge')
    expect(result.purchase_price).toBe('einkaufspreis')
    expect(result.package_grams).toBe('packung')
  })

  it('handles mixed-case headers', () => {
    const headers = ['Brand', 'FLAVOR', 'Qty', 'Price', 'Package']
    const result = autoMapColumns(headers)
    expect(result.brand).toBe('Brand')
    expect(result.flavor).toBe('FLAVOR')
    expect(result.quantity_grams).toBe('Qty')
    expect(result.purchase_price).toBe('Price')
    expect(result.package_grams).toBe('Package')
  })

  it('does not match partial strings — only exact alias match', () => {
    const headers = ['brand_name', 'flavor_type', 'total_quantity_grams']
    const result = autoMapColumns(headers)
    expect(result.brand).toBe('')
    expect(result.flavor).toBe('')
    expect(result.quantity_grams).toBe('')
  })

  it('returns empty strings for empty headers array', () => {
    const result = autoMapColumns([])
    expect(result.brand).toBe('')
    expect(result.flavor).toBe('')
    expect(result.quantity_grams).toBe('')
    expect(result.purchase_price).toBe('')
    expect(result.package_grams).toBe('')
  })

  it('maps underscore-style headers like quantity_grams', () => {
    const headers = ['manufacturer', 'name', 'quantity_grams', 'purchase_price', 'package_grams']
    const result = autoMapColumns(headers)
    expect(result.flavor).toBe('name')
    expect(result.quantity_grams).toBe('quantity_grams')
    expect(result.purchase_price).toBe('purchase_price')
    expect(result.package_grams).toBe('package_grams')
  })

  it('trims whitespace in headers', () => {
    const headers = ['  brand  ', ' flavor ']
    const result = autoMapColumns(headers)
    expect(result.brand).toBe('  brand  ')
    expect(result.flavor).toBe(' flavor ')
  })
})

describe('validateImportRow', () => {
  const mapping: ColumnMapping = {
    brand: 'Brand',
    flavor: 'Flavor',
    quantity_grams: 'Qty',
    purchase_price: 'Price',
    package_grams: 'Package',
  }

  it('validates a complete row', () => {
    const row = { Brand: 'Darkside', Flavor: 'Grape Core', Qty: '250', Price: '15.50', Package: '250' }
    const result = validateImportRow(row, mapping)
    expect(result).toEqual({
      brand: 'Darkside',
      flavor: 'Grape Core',
      quantity_grams: 250,
      purchase_price: 15.5,
      package_grams: 250,
    })
  })

  it('returns null when brand is missing', () => {
    const row = { Brand: '', Flavor: 'Mint', Qty: '100', Price: '10', Package: '100' }
    expect(validateImportRow(row, mapping)).toBeNull()
  })

  it('returns null when flavor is missing', () => {
    const row = { Brand: 'Darkside', Flavor: '', Qty: '100', Price: '10', Package: '100' }
    expect(validateImportRow(row, mapping)).toBeNull()
  })

  it('returns null when quantity is NaN', () => {
    const row = { Brand: 'Darkside', Flavor: 'Mint', Qty: 'abc', Price: '10', Package: '100' }
    expect(validateImportRow(row, mapping)).toBeNull()
  })

  it('returns null when quantity is negative', () => {
    const row = { Brand: 'Darkside', Flavor: 'Mint', Qty: '-5', Price: '10', Package: '100' }
    expect(validateImportRow(row, mapping)).toBeNull()
  })

  it('allows zero quantity', () => {
    const row = { Brand: 'Darkside', Flavor: 'Mint', Qty: '0', Price: '10', Package: '100' }
    const result = validateImportRow(row, mapping)
    expect(result).not.toBeNull()
    expect(result!.quantity_grams).toBe(0)
  })

  it('defaults purchase_price to 0 when NaN', () => {
    const row = { Brand: 'Darkside', Flavor: 'Mint', Qty: '100', Price: 'free', Package: '100' }
    const result = validateImportRow(row, mapping)
    expect(result!.purchase_price).toBe(0)
  })

  it('defaults package_grams to quantity when 0', () => {
    const row = { Brand: 'Darkside', Flavor: 'Mint', Qty: '200', Price: '10', Package: '0' }
    const result = validateImportRow(row, mapping)
    expect(result!.package_grams).toBe(200)
  })

  it('defaults package_grams to quantity when NaN', () => {
    const row = { Brand: 'Darkside', Flavor: 'Mint', Qty: '200', Price: '10', Package: 'n/a' }
    const result = validateImportRow(row, mapping)
    expect(result!.package_grams).toBe(200)
  })

  it('handles missing optional fields gracefully', () => {
    const row = { Brand: 'Darkside', Flavor: 'Mint', Qty: '100' }
    const result = validateImportRow(row, mapping)
    expect(result!.purchase_price).toBe(0)
    expect(result!.package_grams).toBe(100) // falls back to qty
  })

  it('trims whitespace from brand and flavor', () => {
    const row = { Brand: '  Darkside  ', Flavor: '  Mint  ', Qty: '100', Price: '10', Package: '100' }
    const result = validateImportRow(row, mapping)
    expect(result!.brand).toBe('Darkside')
    expect(result!.flavor).toBe('Mint')
  })
})
