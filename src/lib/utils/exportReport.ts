'use client'

import type { TobaccoInventory, SessionWithItems, BarSale, BarAnalytics } from '@/types/database'
import type { Locale } from '@/lib/i18n/types'
import type { Dictionary } from '@/lib/i18n'
import { formatCurrency } from '@/lib/i18n/format'

type ExportLabels = Dictionary['manage']

const DEFAULT_LABELS = {
  exportBrand: 'Brand', exportFlavor: 'Flavor', exportRemainingG: 'Remaining (g)',
  exportPrice: 'Price', exportStatus: 'Status', exportDate: 'Date', exportDateTime: 'Date/Time',
  exportMix: 'Mix', exportTotalG: 'Total (g)', exportCompat: 'Compatibility',
  exportRating: 'Rating', exportNotes: 'Notes', exportQty: 'Qty',
  exportRevenue: 'Revenue', exportCost: 'Cost', exportProfit: 'Profit',
  exportExpenses: 'Expenses', exportMargin: 'Margin', exportSales: 'Sales',
  exportMetric: 'Metric', exportValue: 'Value',
  exportOverview: 'Overview', exportSessions: 'Sessions',
  exportUsageByBrand: 'Usage by Brand', exportPopularFlavors: 'Popular Flavors',
  exportPopularMixes: 'Popular Mixes', exportTimesUsed: 'Times used',
  exportDailyConsumption: 'Daily Consumption', exportUsageG: 'Usage (g)',
  exportLowStockItems: 'Low Stock Items', exportSalesLog: 'Sales Log',
  exportPopularCocktails: 'Popular Cocktails', exportCocktail: 'Cocktail',
  exportSummary: 'Summary',
  exportTotalSessions: 'Total sessions', exportTobaccoUsed: 'Tobacco used',
  exportAvgPerSession: 'Average per session', exportAvgCompat: 'Average compatibility',
  exportAvgRating: 'Average rating', exportAvgMargin: 'Average margin',
  exportOutOfStock: 'Out of stock', exportLow: 'Low', exportInStock: 'In stock',
  exportPeriod: 'Period',
  exportReportTitle: 'Hookah Torus — Report',
  exportInventoryTitle: 'Hookah Torus — Inventory',
  exportBarSalesTitle: 'Hookah Torus — Bar Sales',
  exportSessionsTitle: 'Hookah Torus — Session History',
  exportGenerated: 'Generated',
  exportPage: (i: number, total: number) => `Page ${i} of ${total}`,
  exportTotal: (count: number, grams: string) => `Total: ${count} items | ${grams}g in stock`,
  exportLowStockCount: (low: number, out: number) => `Low stock: ${low} | Out of stock: ${out}`,
}

interface Statistics {
  totalSessions: number
  totalGramsUsed: number
  averageSessionGrams: number
  averageCompatibilityScore: number
  averageRating: number
  consumptionByBrand: { brand: string; grams: number; sessions: number }[]
  consumptionByFlavor: { brand: string; flavor: string; grams: number; sessions: number }[]
  dailyConsumption: { date: string; grams: number; sessions: number }[]
  topMixes: { items: { brand: string; flavor: string }[]; count: number }[]
  lowStockItems: TobaccoInventory[]
}

// Helper to trigger download
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Format date for filename
function getDateString() {
  return new Date().toISOString().split('T')[0]
}

// ========================================
// CSV EXPORTS
// ========================================

export function exportInventoryCSV(inventory: TobaccoInventory[], lowStockThreshold: number = 50, labels?: ExportLabels) {
  const l = labels || DEFAULT_LABELS as ExportLabels
  const headers = [l.exportBrand, l.exportFlavor, l.exportRemainingG, l.exportPrice, l.exportStatus]
  const rows = inventory.map(item => {
    const status = item.quantity_grams <= 0 ? l.exportOutOfStock : item.quantity_grams < lowStockThreshold ? l.exportLow : l.exportInStock
    return [
      item.brand,
      item.flavor,
      item.quantity_grams.toFixed(0),
      item.purchase_price?.toString() || '-',
      status,
    ]
  })

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }) // BOM for Excel
  downloadFile(blob, `hookah-inventory-${getDateString()}.csv`)
}

export function exportSessionsCSV(sessions: SessionWithItems[], labels?: ExportLabels) {
  const l = labels || DEFAULT_LABELS as ExportLabels
  const headers = [l.exportDate, l.exportMix, l.exportTotalG, l.exportCompat, l.exportRating, l.exportNotes]
  const rows = sessions.map(session => {
    const mix = session.session_items?.map(i => `${i.flavor} (${i.percentage}%)`).join(' + ') || '-'
    return [
      new Date(session.session_date).toLocaleDateString('en-US'),
      `"${mix}"`,
      session.total_grams.toString(),
      session.compatibility_score?.toString() || '-',
      session.rating?.toString() || '-',
      session.notes ? `"${session.notes}"` : '-',
    ]
  })

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, `hookah-sessions-${getDateString()}.csv`)
}

export function exportStatisticsCSV(statistics: Statistics, labels?: ExportLabels) {
  const l = labels || DEFAULT_LABELS as ExportLabels
  const lines: string[] = []

  // Overview section
  lines.push(`=== ${l.exportOverview.toUpperCase()} ===`)
  lines.push(`${l.exportTotalSessions},${statistics.totalSessions}`)
  lines.push(`${l.exportTobaccoUsed} (g),${statistics.totalGramsUsed}`)
  lines.push(`${l.exportAvgPerSession} (g),${statistics.averageSessionGrams}`)
  lines.push(`${l.exportAvgCompat},${statistics.averageCompatibilityScore}%`)
  lines.push(`${l.exportAvgRating},${statistics.averageRating}/5`)
  lines.push('')

  // Daily consumption
  lines.push(`=== ${l.exportDailyConsumption.toUpperCase()} ===`)
  lines.push(`${l.exportDate},${l.exportSessions},${l.exportUsageG}`)
  statistics.dailyConsumption.forEach(d => {
    lines.push(`${d.date},${d.sessions},${d.grams}`)
  })
  lines.push('')

  // By brand
  lines.push(`=== ${l.exportUsageByBrand.toUpperCase()} ===`)
  lines.push(`${l.exportBrand},${l.exportSessions},${l.exportUsageG}`)
  statistics.consumptionByBrand.forEach(b => {
    lines.push(`${b.brand},${b.sessions},${b.grams}`)
  })
  lines.push('')

  // By flavor
  lines.push(`=== ${l.exportPopularFlavors.toUpperCase()} ===`)
  lines.push(`${l.exportBrand},${l.exportFlavor},${l.exportSessions},${l.exportUsageG}`)
  statistics.consumptionByFlavor.forEach(f => {
    lines.push(`${f.brand},${f.flavor},${f.sessions},${f.grams}`)
  })
  lines.push('')

  // Top mixes
  lines.push(`=== ${l.exportPopularMixes.toUpperCase()} ===`)
  lines.push(`${l.exportMix},${l.exportTimesUsed}`)
  statistics.topMixes.forEach(m => {
    const mix = m.items.map(i => i.flavor).join(' + ')
    lines.push(`"${mix}",${m.count}`)
  })

  const csv = lines.join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, `hookah-statistics-${getDateString()}.csv`)
}

// ========================================
// PDF EXPORTS
// ========================================

export async function exportStatisticsPDF(
  statistics: Statistics,
  dateRange: { start: Date; end: Date },
  labels?: ExportLabels
) {
  const l = labels || DEFAULT_LABELS as ExportLabels
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF()

  // Title
  doc.setFontSize(20)
  doc.text(l.exportReportTitle, 105, 20, { align: 'center' })

  // Date range
  doc.setFontSize(10)
  doc.setTextColor(100)
  const startStr = dateRange.start.toLocaleDateString('en-US')
  const endStr = dateRange.end.toLocaleDateString('en-US')
  doc.text(`${l.exportPeriod}: ${startStr} - ${endStr}`, 105, 28, { align: 'center' })

  // Overview
  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text(l.exportOverview, 14, 42)

  autoTable(doc, {
    startY: 46,
    head: [[l.exportMetric, l.exportValue]],
    body: [
      [l.exportTotalSessions, statistics.totalSessions.toString()],
      [l.exportTobaccoUsed, `${statistics.totalGramsUsed} g`],
      [l.exportAvgPerSession, `${statistics.averageSessionGrams} g`],
      [l.exportAvgCompat, `${statistics.averageCompatibilityScore}%`],
      [l.exportAvgRating, `${statistics.averageRating}/5`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
  })

  // Get current Y position after table
  let currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // Consumption by brand
  if (statistics.consumptionByBrand.length > 0) {
    doc.setFontSize(14)
    doc.text(l.exportUsageByBrand, 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [[l.exportBrand, l.exportSessions, l.exportUsageG]],
      body: statistics.consumptionByBrand.map(b => [b.brand, b.sessions.toString(), b.grams.toString()]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
    })

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
  }

  // Check if we need a new page
  if (currentY > 250) {
    doc.addPage()
    currentY = 20
  }

  // Top mixes
  if (statistics.topMixes.length > 0) {
    doc.setFontSize(14)
    doc.text(l.exportPopularMixes, 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [[l.exportMix, l.exportTimesUsed]],
      body: statistics.topMixes.map(m => [
        m.items.map(i => i.flavor).join(' + '),
        m.count.toString(),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
    })

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
  }

  // Low stock warning
  if (statistics.lowStockItems.length > 0) {
    if (currentY > 250) {
      doc.addPage()
      currentY = 20
    }

    doc.setFontSize(14)
    doc.text(l.exportLowStockItems, 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [[l.exportBrand, l.exportFlavor, l.exportRemainingG]],
      body: statistics.lowStockItems.map(item => [
        item.brand,
        item.flavor,
        item.quantity_grams.toFixed(0),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
    })
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Hookah Torus | ${l.exportGenerated}: ${new Date().toLocaleString('en-US')} | ${l.exportPage(i, pageCount)}`,
      105,
      290,
      { align: 'center' }
    )
  }

  doc.save(`hookah-report-${getDateString()}.pdf`)
}

export async function exportInventoryPDF(inventory: TobaccoInventory[], lowStockThreshold: number = 50, labels?: ExportLabels) {
  const l = labels || DEFAULT_LABELS as ExportLabels
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF()

  // Title
  doc.setFontSize(20)
  doc.text(l.exportInventoryTitle, 105, 20, { align: 'center' })

  // Date
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`${l.exportDate}: ${new Date().toLocaleDateString('en-US')}`, 105, 28, { align: 'center' })

  // Summary
  const totalGrams = inventory.reduce((sum, item) => sum + item.quantity_grams, 0)
  const lowStock = inventory.filter(i => i.quantity_grams < lowStockThreshold && i.quantity_grams > 0).length
  const outOfStock = inventory.filter(i => i.quantity_grams <= 0).length

  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text(l.exportTotal(inventory.length, totalGrams.toFixed(0)), 14, 42)
  doc.text(l.exportLowStockCount(lowStock, outOfStock), 14, 50)

  // Table
  autoTable(doc, {
    startY: 58,
    head: [[l.exportBrand, l.exportFlavor, l.exportRemainingG, l.exportPrice, l.exportStatus]],
    body: inventory.map(item => {
      const status = item.quantity_grams <= 0 ? l.exportOutOfStock : item.quantity_grams < lowStockThreshold ? l.exportLow : l.exportInStock
      return [
        item.brand,
        item.flavor,
        item.quantity_grams.toFixed(0),
        item.purchase_price?.toString() || '-',
        status,
      ]
    }),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    didParseCell: (data) => {
      // Color code status column
      if (data.column.index === 4 && data.section === 'body') {
        const status = data.cell.raw as string
        if (status === l.exportOutOfStock) {
          data.cell.styles.textColor = [239, 68, 68]
          data.cell.styles.fontStyle = 'bold'
        } else if (status === l.exportLow) {
          data.cell.styles.textColor = [245, 158, 11]
        }
      }
    },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Hookah Torus | ${l.exportGenerated}: ${new Date().toLocaleString('en-US')} | ${l.exportPage(i, pageCount)}`,
      105,
      290,
      { align: 'center' }
    )
  }

  doc.save(`hookah-inventory-${getDateString()}.pdf`)
}

// ========================================
// BAR SALES EXPORTS
// ========================================

export function exportBarSalesCSV(sales: BarSale[], locale: Locale = 'en', labels?: ExportLabels) {
  const l = labels || DEFAULT_LABELS as ExportLabels
  const headers = [l.exportDateTime, l.exportCocktail, l.exportQty, l.exportRevenue, l.exportCost, l.exportMargin]
  const rows = sales.map(sale => [
    new Date(sale.sold_at).toLocaleString('en-US'),
    `"${sale.recipe_name}"`,
    sale.quantity.toString(),
    sale.total_revenue.toFixed(2),
    sale.total_cost.toFixed(2),
    sale.margin_percent !== null ? sale.margin_percent.toFixed(1) : '-',
  ])

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, `bar-sales-${getDateString()}.csv`)
}

export async function exportBarSalesPDF(sales: BarSale[], analytics: BarAnalytics, period: number, locale: Locale = 'en', labels?: ExportLabels) {
  const l = labels || DEFAULT_LABELS as ExportLabels
  const fc = (v: number) => formatCurrency(v, locale)
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF()

  // Title
  doc.setFontSize(20)
  doc.text(l.exportBarSalesTitle, 105, 20, { align: 'center' })

  // Subtitle
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`${l.exportPeriod}: last ${period} days | ${l.exportDate}: ${new Date().toLocaleDateString('en-US')}`, 105, 28, { align: 'center' })

  // Summary
  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text(l.exportSummary, 14, 42)

  autoTable(doc, {
    startY: 46,
    head: [[l.exportMetric, l.exportValue]],
    body: [
      [l.exportRevenue, fc(analytics.totalRevenue)],
      [l.exportCost, fc(analytics.totalCost)],
      [l.exportProfit, fc(analytics.totalProfit)],
      [l.exportSales, `${analytics.totalSales}`],
      [l.exportAvgMargin, analytics.avgMargin !== null ? `${analytics.avgMargin.toFixed(1)}%` : '—'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
  })

  let currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // Top cocktails
  if (analytics.topCocktails.length > 0) {
    doc.setFontSize(14)
    doc.text(l.exportPopularCocktails, 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [[l.exportCocktail, l.exportSales, l.exportRevenue]],
      body: analytics.topCocktails.map(c => [c.name, c.count.toString(), fc(c.revenue)]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
    })

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
  }

  // Sales log
  if (sales.length > 0) {
    if (currentY > 250) {
      doc.addPage()
      currentY = 20
    }

    doc.setFontSize(14)
    doc.text(l.exportSalesLog, 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [[l.exportDateTime, l.exportCocktail, l.exportQty, l.exportRevenue, l.exportCost, l.exportMargin]],
      body: sales.map(sale => [
        new Date(sale.sold_at).toLocaleString('en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        sale.recipe_name,
        sale.quantity.toString(),
        fc(sale.total_revenue),
        fc(sale.total_cost),
        sale.margin_percent !== null ? `${sale.margin_percent.toFixed(0)}%` : '—',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
    })
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Hookah Torus | ${l.exportGenerated}: ${new Date().toLocaleString('en-US')} | ${l.exportPage(i, pageCount)}`,
      105,
      290,
      { align: 'center' }
    )
  }

  doc.save(`bar-sales-${getDateString()}.pdf`)
}

// ========================================
// SESSIONS PDF EXPORT
// ========================================

export async function exportSessionsPDF(sessions: SessionWithItems[], labels?: ExportLabels) {
  const l = labels || DEFAULT_LABELS as ExportLabels
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF()

  // Title
  doc.setFontSize(20)
  doc.text(l.exportSessionsTitle, 105, 20, { align: 'center' })

  // Subtitle
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`${l.exportDate}: ${new Date().toLocaleDateString('en-US')} | ${l.exportTotalSessions}: ${sessions.length}`, 105, 28, { align: 'center' })

  // Sessions table
  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text(l.exportSessions, 14, 42)

  autoTable(doc, {
    startY: 46,
    head: [[l.exportDate, l.exportMix, l.exportTotalG, l.exportCompat, l.exportRating]],
    body: sessions.map(session => {
      const mix = session.session_items?.map(i => `${i.flavor} (${i.percentage}%)`).join(' + ') || '-'
      return [
        new Date(session.session_date).toLocaleDateString('en-US'),
        mix,
        session.total_grams.toString(),
        session.compatibility_score ? `${session.compatibility_score}%` : '-',
        session.rating ? `${session.rating}/5` : '-',
      ]
    }),
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    columnStyles: {
      1: { cellWidth: 70 }, // Mix column wider
    },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Hookah Torus | ${l.exportGenerated}: ${new Date().toLocaleString('en-US')} | ${l.exportPage(i, pageCount)}`,
      105,
      290,
      { align: 'center' }
    )
  }

  doc.save(`hookah-sessions-${getDateString()}.pdf`)
}
