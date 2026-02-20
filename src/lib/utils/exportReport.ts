'use client'

import type { TobaccoInventory, SessionWithItems, BarSale, BarAnalytics } from '@/types/database'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

export function exportInventoryCSV(inventory: TobaccoInventory[], lowStockThreshold: number = 50) {
  const headers = ['Brand', 'Flavor', 'Remaining (g)', 'Price', 'Status']
  const rows = inventory.map(item => {
    const status = item.quantity_grams <= 0 ? 'Out of stock' : item.quantity_grams < lowStockThreshold ? 'Low' : 'In stock'
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

export function exportSessionsCSV(sessions: SessionWithItems[]) {
  const headers = ['Date', 'Mix', 'Total (g)', 'Compatibility', 'Rating', 'Notes']
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

export function exportStatisticsCSV(statistics: Statistics) {
  const lines: string[] = []

  // Overview section
  lines.push('=== OVERVIEW ===')
  lines.push(`Total sessions,${statistics.totalSessions}`)
  lines.push(`Tobacco used (g),${statistics.totalGramsUsed}`)
  lines.push(`Average per session (g),${statistics.averageSessionGrams}`)
  lines.push(`Average compatibility,${statistics.averageCompatibilityScore}%`)
  lines.push(`Average rating,${statistics.averageRating}/5`)
  lines.push('')

  // Daily consumption
  lines.push('=== DAILY CONSUMPTION ===')
  lines.push('Date,Sessions,Usage (g)')
  statistics.dailyConsumption.forEach(d => {
    lines.push(`${d.date},${d.sessions},${d.grams}`)
  })
  lines.push('')

  // By brand
  lines.push('=== USAGE BY BRAND ===')
  lines.push('Brand,Sessions,Usage (g)')
  statistics.consumptionByBrand.forEach(b => {
    lines.push(`${b.brand},${b.sessions},${b.grams}`)
  })
  lines.push('')

  // By flavor
  lines.push('=== POPULAR FLAVORS ===')
  lines.push('Brand,Flavor,Sessions,Usage (g)')
  statistics.consumptionByFlavor.forEach(f => {
    lines.push(`${f.brand},${f.flavor},${f.sessions},${f.grams}`)
  })
  lines.push('')

  // Top mixes
  lines.push('=== POPULAR MIXES ===')
  lines.push('Mix,Times used')
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

export function exportStatisticsPDF(
  statistics: Statistics,
  dateRange: { start: Date; end: Date }
) {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(20)
  doc.text('Hookah Torus - Report', 105, 20, { align: 'center' })

  // Date range
  doc.setFontSize(10)
  doc.setTextColor(100)
  const startStr = dateRange.start.toLocaleDateString('en-US')
  const endStr = dateRange.end.toLocaleDateString('en-US')
  doc.text(`Period: ${startStr} - ${endStr}`, 105, 28, { align: 'center' })

  // Overview
  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text('Overview', 14, 42)

  autoTable(doc, {
    startY: 46,
    head: [['Metric', 'Value']],
    body: [
      ['Total sessions', statistics.totalSessions.toString()],
      ['Tobacco used', `${statistics.totalGramsUsed} g`],
      ['Average per session', `${statistics.averageSessionGrams} g`],
      ['Average compatibility', `${statistics.averageCompatibilityScore}%`],
      ['Average rating', `${statistics.averageRating}/5`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
  })

  // Get current Y position after table
  let currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // Consumption by brand
  if (statistics.consumptionByBrand.length > 0) {
    doc.setFontSize(14)
    doc.text('Usage by Brand', 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Brand', 'Sessions', 'Usage (g)']],
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
    doc.text('Popular Mixes', 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Mix', 'Times Used']],
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
    doc.text('Low Stock Items', 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Brand', 'Flavor', 'Remaining (g)']],
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
      `Hookah Torus | Generated: ${new Date().toLocaleString('en-US')} | Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    )
  }

  doc.save(`hookah-report-${getDateString()}.pdf`)
}

export function exportInventoryPDF(inventory: TobaccoInventory[], lowStockThreshold: number = 50) {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(20)
  doc.text('Hookah Torus - Inventory', 105, 20, { align: 'center' })

  // Date
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Date: ${new Date().toLocaleDateString('en-US')}`, 105, 28, { align: 'center' })

  // Summary
  const totalGrams = inventory.reduce((sum, item) => sum + item.quantity_grams, 0)
  const lowStock = inventory.filter(i => i.quantity_grams < lowStockThreshold && i.quantity_grams > 0).length
  const outOfStock = inventory.filter(i => i.quantity_grams <= 0).length

  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text(`Total: ${inventory.length} items | ${totalGrams.toFixed(0)}g in stock`, 14, 42)
  doc.text(`Low stock: ${lowStock} | Out of stock: ${outOfStock}`, 14, 50)

  // Table
  autoTable(doc, {
    startY: 58,
    head: [['Brand', 'Flavor', 'Remaining (g)', 'Price', 'Status']],
    body: inventory.map(item => {
      const status = item.quantity_grams <= 0 ? 'Out of stock' : item.quantity_grams < lowStockThreshold ? 'Low' : 'In stock'
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
        if (status === 'Out of stock') {
          data.cell.styles.textColor = [239, 68, 68]
          data.cell.styles.fontStyle = 'bold'
        } else if (status === 'Low') {
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
      `Hookah Torus | Generated: ${new Date().toLocaleString('en-US')} | Page ${i} of ${pageCount}`,
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

export function exportBarSalesCSV(sales: BarSale[]) {
  const headers = ['Date/Time', 'Cocktail', 'Qty', 'Revenue (€)', 'Cost (€)', 'Margin (%)']
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

export function exportBarSalesPDF(sales: BarSale[], analytics: BarAnalytics, period: number) {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(20)
  doc.text('Hookah Torus — Bar Sales', 105, 20, { align: 'center' })

  // Subtitle
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Period: last ${period} days | Date: ${new Date().toLocaleDateString('en-US')}`, 105, 28, { align: 'center' })

  // Summary
  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text('Summary', 14, 42)

  autoTable(doc, {
    startY: 46,
    head: [['Metric', 'Value']],
    body: [
      ['Revenue', `${analytics.totalRevenue.toFixed(2)}€`],
      ['Cost', `${analytics.totalCost.toFixed(2)}€`],
      ['Profit', `${analytics.totalProfit.toFixed(2)}€`],
      ['Sales', `${analytics.totalSales}`],
      ['Average margin', analytics.avgMargin !== null ? `${analytics.avgMargin.toFixed(1)}%` : '—'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
  })

  let currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // Top cocktails
  if (analytics.topCocktails.length > 0) {
    doc.setFontSize(14)
    doc.text('Popular Cocktails', 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Cocktail', 'Sales', 'Revenue']],
      body: analytics.topCocktails.map(c => [c.name, c.count.toString(), `${c.revenue.toFixed(2)}€`]),
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
    doc.text('Sales Log', 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Date/Time', 'Cocktail', 'Qty', 'Revenue', 'Cost', 'Margin']],
      body: sales.map(sale => [
        new Date(sale.sold_at).toLocaleString('en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        sale.recipe_name,
        sale.quantity.toString(),
        `${sale.total_revenue.toFixed(2)}€`,
        `${sale.total_cost.toFixed(2)}€`,
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
      `Hookah Torus | Generated: ${new Date().toLocaleString('en-US')} | Page ${i} of ${pageCount}`,
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

export function exportSessionsPDF(sessions: SessionWithItems[]) {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(20)
  doc.text('Hookah Torus — Session History', 105, 20, { align: 'center' })

  // Subtitle
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Date: ${new Date().toLocaleDateString('en-US')} | Total sessions: ${sessions.length}`, 105, 28, { align: 'center' })

  // Sessions table
  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text('Sessions', 14, 42)

  autoTable(doc, {
    startY: 46,
    head: [['Date', 'Mix', 'Total (g)', 'Compat.', 'Rating']],
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
      `Hookah Torus | Generated: ${new Date().toLocaleString('en-US')} | Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    )
  }

  doc.save(`hookah-sessions-${getDateString()}.pdf`)
}
