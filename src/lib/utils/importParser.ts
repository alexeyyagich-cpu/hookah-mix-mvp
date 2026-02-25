// Dynamic imports — Papa (~47KB) and readXlsxFile (~90KB) are loaded on demand
// to avoid bundling them in the initial chunk since CSV/Excel import is rarely used

export interface ImportRow {
  brand: string
  flavor: string
  quantity_grams: number
  purchase_price: number
  package_grams: number
}

export interface ParseResult {
  headers: string[]
  rows: Record<string, string>[]
  error?: string
}

export interface ColumnMapping {
  brand: string
  flavor: string
  quantity_grams: string
  purchase_price: string
  package_grams: string
}

const EXPECTED_COLUMNS: (keyof ColumnMapping)[] = ['brand', 'flavor', 'quantity_grams', 'purchase_price', 'package_grams']

// Common header aliases for auto-mapping
const COLUMN_ALIASES: Record<keyof ColumnMapping, string[]> = {
  brand: ['brand', 'марка', 'бренд', 'manufacturer', 'hersteller', 'marke'],
  flavor: ['flavor', 'flavour', 'вкус', 'название', 'name', 'geschmack', 'sorte'],
  quantity_grams: ['quantity', 'grams', 'количество', 'грамм', 'граммы', 'qty', 'menge', 'gramm', 'quantity_grams'],
  purchase_price: ['price', 'purchase_price', 'цена', 'стоимость', 'cost', 'preis', 'einkaufspreis'],
  package_grams: ['package', 'package_grams', 'упаковка', 'пакет', 'packung', 'paketgröße'],
}

export async function parseCSV(file: File): Promise<ParseResult> {
  const Papa = (await import('papaparse')).default
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          resolve({ headers: [], rows: [], error: results.errors[0].message })
          return
        }
        const headers = results.meta.fields || []
        resolve({ headers, rows: results.data as Record<string, string>[] })
      },
      error: (err: Error) => {
        resolve({ headers: [], rows: [], error: err.message })
      },
    })
  })
}

export async function parseExcel(file: File): Promise<ParseResult> {
  try {
    const readXlsxFile = (await import('read-excel-file')).default
    const rows = await readXlsxFile(file)
    if (rows.length < 2) {
      return { headers: [], rows: [], error: 'File has no data rows' }
    }

    const headers = rows[0].map(cell => String(cell || '').trim())
    const dataRows = rows.slice(1).map(row => {
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => {
        obj[h] = String(row[i] ?? '')
      })
      return obj
    })

    return { headers, rows: dataRows }
  } catch {
    return { headers: [], rows: [], error: 'Failed to parse Excel file' }
  }
}

export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    brand: '',
    flavor: '',
    quantity_grams: '',
    purchase_price: '',
    package_grams: '',
  }

  for (const col of EXPECTED_COLUMNS) {
    const aliases = COLUMN_ALIASES[col]
    const match = headers.find(h =>
      aliases.some(a => h.toLowerCase().trim() === a.toLowerCase())
    )
    if (match) {
      mapping[col] = match
    }
  }

  return mapping
}

export function validateImportRow(row: Record<string, string>, mapping: ColumnMapping): ImportRow | null {
  const brand = row[mapping.brand]?.trim()
  const flavor = row[mapping.flavor]?.trim()
  const qty = parseFloat(row[mapping.quantity_grams] || '0')
  const price = parseFloat(row[mapping.purchase_price] || '0')
  const pkg = parseFloat(row[mapping.package_grams] || '0')

  if (!brand || !flavor) return null
  if (isNaN(qty) || qty < 0) return null

  return {
    brand,
    flavor,
    quantity_grams: qty,
    purchase_price: isNaN(price) ? 0 : price,
    package_grams: isNaN(pkg) || pkg === 0 ? qty : pkg,
  }
}

export function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file)
  }
  return parseCSV(file)
}
