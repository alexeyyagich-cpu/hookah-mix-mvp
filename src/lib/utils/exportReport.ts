'use client'

import type { TobaccoInventory, SessionWithItems } from '@/types/database'
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
  const headers = ['Бренд', 'Вкус', 'Остаток (г)', 'Цена', 'Статус']
  const rows = inventory.map(item => {
    const status = item.quantity_grams <= 0 ? 'Закончился' : item.quantity_grams < lowStockThreshold ? 'Мало' : 'В наличии'
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
  const headers = ['Дата', 'Микс', 'Всего (г)', 'Совместимость', 'Оценка', 'Заметки']
  const rows = sessions.map(session => {
    const mix = session.session_items?.map(i => `${i.flavor} (${i.percentage}%)`).join(' + ') || '-'
    return [
      new Date(session.session_date).toLocaleDateString('ru-RU'),
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
  lines.push('=== ОБЗОР ===')
  lines.push(`Всего сессий,${statistics.totalSessions}`)
  lines.push(`Израсходовано табака (г),${statistics.totalGramsUsed}`)
  lines.push(`Средний расход на сессию (г),${statistics.averageSessionGrams}`)
  lines.push(`Средняя совместимость,${statistics.averageCompatibilityScore}%`)
  lines.push(`Средняя оценка,${statistics.averageRating}/5`)
  lines.push('')

  // Daily consumption
  lines.push('=== РАСХОД ПО ДНЯМ ===')
  lines.push('Дата,Сессий,Расход (г)')
  statistics.dailyConsumption.forEach(d => {
    lines.push(`${d.date},${d.sessions},${d.grams}`)
  })
  lines.push('')

  // By brand
  lines.push('=== РАСХОД ПО БРЕНДАМ ===')
  lines.push('Бренд,Сессий,Расход (г)')
  statistics.consumptionByBrand.forEach(b => {
    lines.push(`${b.brand},${b.sessions},${b.grams}`)
  })
  lines.push('')

  // By flavor
  lines.push('=== ПОПУЛЯРНЫЕ ВКУСЫ ===')
  lines.push('Бренд,Вкус,Сессий,Расход (г)')
  statistics.consumptionByFlavor.forEach(f => {
    lines.push(`${f.brand},${f.flavor},${f.sessions},${f.grams}`)
  })
  lines.push('')

  // Top mixes
  lines.push('=== ПОПУЛЯРНЫЕ МИКСЫ ===')
  lines.push('Микс,Использований')
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
  doc.text('Hookah Torus - Отчет', 105, 20, { align: 'center' })

  // Date range
  doc.setFontSize(10)
  doc.setTextColor(100)
  const startStr = dateRange.start.toLocaleDateString('ru-RU')
  const endStr = dateRange.end.toLocaleDateString('ru-RU')
  doc.text(`Период: ${startStr} - ${endStr}`, 105, 28, { align: 'center' })

  // Overview
  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text('Обзор', 14, 42)

  autoTable(doc, {
    startY: 46,
    head: [['Показатель', 'Значение']],
    body: [
      ['Всего сессий', statistics.totalSessions.toString()],
      ['Израсходовано табака', `${statistics.totalGramsUsed} г`],
      ['Средний расход на сессию', `${statistics.averageSessionGrams} г`],
      ['Средняя совместимость', `${statistics.averageCompatibilityScore}%`],
      ['Средняя оценка', `${statistics.averageRating}/5`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
  })

  // Get current Y position after table
  let currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // Consumption by brand
  if (statistics.consumptionByBrand.length > 0) {
    doc.setFontSize(14)
    doc.text('Расход по брендам', 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Бренд', 'Сессий', 'Расход (г)']],
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
    doc.text('Популярные миксы', 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Микс', 'Использований']],
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
    doc.text('Заканчивающиеся позиции', 14, currentY)

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Бренд', 'Вкус', 'Остаток (г)']],
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
      `Hookah Torus | Сгенерировано: ${new Date().toLocaleString('ru-RU')} | Страница ${i} из ${pageCount}`,
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
  doc.text('Hookah Torus - Инвентарь', 105, 20, { align: 'center' })

  // Date
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 105, 28, { align: 'center' })

  // Summary
  const totalGrams = inventory.reduce((sum, item) => sum + item.quantity_grams, 0)
  const lowStock = inventory.filter(i => i.quantity_grams < lowStockThreshold && i.quantity_grams > 0).length
  const outOfStock = inventory.filter(i => i.quantity_grams <= 0).length

  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text(`Всего: ${inventory.length} позиций | ${totalGrams.toFixed(0)}г на складе`, 14, 42)
  doc.text(`Заканчиваются: ${lowStock} | Закончились: ${outOfStock}`, 14, 50)

  // Table
  autoTable(doc, {
    startY: 58,
    head: [['Бренд', 'Вкус', 'Остаток (г)', 'Цена', 'Статус']],
    body: inventory.map(item => {
      const status = item.quantity_grams <= 0 ? 'Закончился' : item.quantity_grams < lowStockThreshold ? 'Мало' : 'В наличии'
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
        if (status === 'Закончился') {
          data.cell.styles.textColor = [239, 68, 68]
          data.cell.styles.fontStyle = 'bold'
        } else if (status === 'Мало') {
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
      `Hookah Torus | Сгенерировано: ${new Date().toLocaleString('ru-RU')} | Страница ${i} из ${pageCount}`,
      105,
      290,
      { align: 'center' }
    )
  }

  doc.save(`hookah-inventory-${getDateString()}.pdf`)
}
