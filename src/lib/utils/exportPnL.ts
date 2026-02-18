'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PnLData } from '@/lib/hooks/usePnL'

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function getDateString() {
  return new Date().toISOString().split('T')[0]
}

function formatPeriod(period: { start: Date; end: Date }): string {
  return `${period.start.toLocaleDateString('ru-RU')} - ${period.end.toLocaleDateString('ru-RU')}`
}

// ========================================
// CSV EXPORT
// ========================================

export function exportPnLCSV(data: PnLData, period: { start: Date; end: Date }) {
  const lines: string[] = []

  lines.push('ОТЧЕТ P&L')
  lines.push(`Период,${formatPeriod(period)}`)
  lines.push('')

  lines.push('ИТОГО')
  lines.push(`Выручка,${data.totalRevenue.toFixed(2)}€`)
  lines.push(`Расходы,${data.totalCost.toFixed(2)}€`)
  lines.push(`Валовая прибыль,${data.grossProfit.toFixed(2)}€`)
  lines.push(`Маржа,${data.marginPercent !== null ? data.marginPercent.toFixed(1) + '%' : '—'}`)
  lines.push('')

  if (data.bar) {
    lines.push('БАР')
    lines.push(`Выручка,${data.bar.revenue.toFixed(2)}€`)
    lines.push(`Себестоимость,${data.bar.cost.toFixed(2)}€`)
    lines.push(`Прибыль,${data.bar.profit.toFixed(2)}€`)
    lines.push(`Продажи,${data.bar.salesCount}`)
    lines.push('')
  }

  if (data.hookah) {
    lines.push('КАЛЬЯННАЯ')
    lines.push(`Расход табака,${data.hookah.cost.toFixed(2)}€`)
    lines.push(`Использовано,${data.hookah.gramsUsed.toFixed(0)}г`)
    lines.push(`Сессий,${data.hookah.sessionsCount}`)
    lines.push(`Стоимость/сессия,${data.hookah.costPerSession.toFixed(2)}€`)
    lines.push('')
  }

  lines.push('ПО ДНЯМ')
  lines.push('Дата,Выручка,Себестоимость бар,Расход табака,Итого расходы,Прибыль')
  for (const d of data.dailyPnL) {
    lines.push(`${d.date},${d.barRevenue.toFixed(2)},${d.barCost.toFixed(2)},${d.hookahCost.toFixed(2)},${d.totalCost.toFixed(2)},${d.profit.toFixed(2)}`)
  }
  lines.push('')

  lines.push('РАСХОДЫ ПО КАТЕГОРИЯМ')
  lines.push('Категория,Модуль,Сумма,Доля')
  for (const c of data.costByCategory) {
    lines.push(`${c.category},${c.module},${c.cost.toFixed(2)}€,${c.percentage.toFixed(1)}%`)
  }
  lines.push('')

  lines.push('ТОП ПОЗИЦИИ')
  lines.push('Название,Модуль,Выручка,Себестоимость,Прибыль,Маржа')
  for (const item of data.topItems.slice(0, 10)) {
    lines.push(`${item.name},${item.module},${item.revenue.toFixed(2)}€,${item.cost.toFixed(2)}€,${item.profit.toFixed(2)}€,${item.margin.toFixed(1)}%`)
  }

  const csv = lines.join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, `pnl-report-${getDateString()}.csv`)
}

// ========================================
// PDF EXPORT
// ========================================

export function exportPnLPDF(data: PnLData, period: { start: Date; end: Date }) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Отчет P&L', 14, 20)
  doc.setFontSize(10)
  doc.text(`Период: ${formatPeriod(period)}`, 14, 28)
  doc.text(`Hookah Torus — hookahtorus.com`, 14, 34)

  // Summary table
  autoTable(doc, {
    startY: 42,
    head: [['Показатель', 'Значение']],
    body: [
      ['Выручка', `${data.totalRevenue.toFixed(2)}€`],
      ['Расходы', `${data.totalCost.toFixed(2)}€`],
      ['Валовая прибыль', `${data.grossProfit.toFixed(2)}€`],
      ['Маржа', data.marginPercent !== null ? `${data.marginPercent.toFixed(1)}%` : '—'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
  })

  // Daily breakdown
  const dailyBody = data.dailyPnL.map(d => [
    d.date,
    `${d.barRevenue.toFixed(0)}€`,
    `${d.totalCost.toFixed(0)}€`,
    `${d.profit.toFixed(0)}€`,
  ])

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
    head: [['Дата', 'Выручка', 'Расходы', 'Прибыль']],
    body: dailyBody,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
  })

  // Top items
  if (data.topItems.length > 0) {
    const topBody = data.topItems.slice(0, 8).map(i => [
      i.name,
      i.module === 'bar' ? 'Бар' : 'Кальянная',
      `${i.revenue.toFixed(0)}€`,
      `${i.cost.toFixed(0)}€`,
      `${i.margin.toFixed(0)}%`,
    ])

    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
      head: [['Позиция', 'Модуль', 'Выручка', 'Себестоимость', 'Маржа']],
      body: topBody,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
    })
  }

  doc.save(`pnl-report-${getDateString()}.pdf`)
}

// ========================================
// COPY AS TEXT
// ========================================

export function copyPnLAsText(data: PnLData, period: { start: Date; end: Date }): Promise<void> {
  const lines: string[] = []

  lines.push(`📊 ОТЧЕТ P&L — ${formatPeriod(period)}`)
  lines.push('')
  lines.push(`Выручка: ${data.totalRevenue.toFixed(0)}€`)
  lines.push(`Расходы: ${data.totalCost.toFixed(0)}€`)
  lines.push(`Прибыль: ${data.grossProfit.toFixed(0)}€`)
  if (data.marginPercent !== null) lines.push(`Маржа: ${data.marginPercent.toFixed(1)}%`)
  lines.push('')

  if (data.revenueChange !== null) lines.push(`Выручка: ${data.revenueChange >= 0 ? '+' : ''}${data.revenueChange.toFixed(0)}% vs пред. период`)
  if (data.costChange !== null) lines.push(`Расходы: ${data.costChange >= 0 ? '+' : ''}${data.costChange.toFixed(0)}% vs пред. период`)
  if (data.profitChange !== null) lines.push(`Прибыль: ${data.profitChange >= 0 ? '+' : ''}${data.profitChange.toFixed(0)}% vs пред. период`)
  lines.push('')

  if (data.topItems.length > 0) {
    lines.push('Топ позиции:')
    for (const item of data.topItems.slice(0, 5)) {
      lines.push(`  ${item.name} — ${item.revenue.toFixed(0)}€ выручка, маржа ${item.margin.toFixed(0)}%`)
    }
  }

  return navigator.clipboard.writeText(lines.join('\n'))
}
