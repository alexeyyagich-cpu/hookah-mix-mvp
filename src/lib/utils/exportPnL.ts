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
  return `${period.start.toLocaleDateString('en-US')} - ${period.end.toLocaleDateString('en-US')}`
}

// ========================================
// CSV EXPORT
// ========================================

export function exportPnLCSV(data: PnLData, period: { start: Date; end: Date }) {
  const lines: string[] = []

  lines.push('P&L REPORT')
  lines.push(`Period,${formatPeriod(period)}`)
  lines.push('')

  lines.push('TOTAL')
  lines.push(`Revenue,${data.totalRevenue.toFixed(2)}€`)
  lines.push(`Expenses,${data.totalCost.toFixed(2)}€`)
  lines.push(`Gross Profit,${data.grossProfit.toFixed(2)}€`)
  lines.push(`Margin,${data.marginPercent !== null ? data.marginPercent.toFixed(1) + '%' : '—'}`)
  lines.push('')

  if (data.bar) {
    lines.push('BAR')
    lines.push(`Revenue,${data.bar.revenue.toFixed(2)}€`)
    lines.push(`Cost,${data.bar.cost.toFixed(2)}€`)
    lines.push(`Profit,${data.bar.profit.toFixed(2)}€`)
    lines.push(`Sales,${data.bar.salesCount}`)
    lines.push('')
  }

  if (data.hookah) {
    lines.push('HOOKAH')
    lines.push(`Tobacco cost,${data.hookah.cost.toFixed(2)}€`)
    lines.push(`Used,${data.hookah.gramsUsed.toFixed(0)}g`)
    lines.push(`Sessions,${data.hookah.sessionsCount}`)
    lines.push(`Cost/session,${data.hookah.costPerSession.toFixed(2)}€`)
    lines.push('')
  }

  lines.push('BY DAY')
  lines.push('Date,Revenue,Bar cost,Tobacco cost,Total expenses,Profit')
  for (const d of data.dailyPnL) {
    lines.push(`${d.date},${d.barRevenue.toFixed(2)},${d.barCost.toFixed(2)},${d.hookahCost.toFixed(2)},${d.totalCost.toFixed(2)},${d.profit.toFixed(2)}`)
  }
  lines.push('')

  lines.push('EXPENSES BY CATEGORY')
  lines.push('Category,Module,Amount,Share')
  for (const c of data.costByCategory) {
    lines.push(`${c.category},${c.module},${c.cost.toFixed(2)}€,${c.percentage.toFixed(1)}%`)
  }
  lines.push('')

  lines.push('TOP ITEMS')
  lines.push('Name,Module,Revenue,Cost,Profit,Margin')
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
  doc.text('P&L Report', 14, 20)
  doc.setFontSize(10)
  doc.text(`Period: ${formatPeriod(period)}`, 14, 28)
  doc.text(`Hookah Torus — hookahtorus.com`, 14, 34)

  // Summary table
  autoTable(doc, {
    startY: 42,
    head: [['Metric', 'Value']],
    body: [
      ['Revenue', `${data.totalRevenue.toFixed(2)}€`],
      ['Expenses', `${data.totalCost.toFixed(2)}€`],
      ['Gross Profit', `${data.grossProfit.toFixed(2)}€`],
      ['Margin', data.marginPercent !== null ? `${data.marginPercent.toFixed(1)}%` : '—'],
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
    head: [['Date', 'Revenue', 'Expenses', 'Profit']],
    body: dailyBody,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
  })

  // Top items
  if (data.topItems.length > 0) {
    const topBody = data.topItems.slice(0, 8).map(i => [
      i.name,
      i.module === 'bar' ? 'Bar' : 'Hookah',
      `${i.revenue.toFixed(0)}€`,
      `${i.cost.toFixed(0)}€`,
      `${i.margin.toFixed(0)}%`,
    ])

    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
      head: [['Item', 'Module', 'Revenue', 'Cost', 'Margin']],
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

  lines.push(`P&L REPORT — ${formatPeriod(period)}`)
  lines.push('')
  lines.push(`Revenue: ${data.totalRevenue.toFixed(0)}€`)
  lines.push(`Expenses: ${data.totalCost.toFixed(0)}€`)
  lines.push(`Profit: ${data.grossProfit.toFixed(0)}€`)
  if (data.marginPercent !== null) lines.push(`Margin: ${data.marginPercent.toFixed(1)}%`)
  lines.push('')

  if (data.revenueChange !== null) lines.push(`Revenue: ${data.revenueChange >= 0 ? '+' : ''}${data.revenueChange.toFixed(0)}% vs prev. period`)
  if (data.costChange !== null) lines.push(`Expenses: ${data.costChange >= 0 ? '+' : ''}${data.costChange.toFixed(0)}% vs prev. period`)
  if (data.profitChange !== null) lines.push(`Profit: ${data.profitChange >= 0 ? '+' : ''}${data.profitChange.toFixed(0)}% vs prev. period`)
  lines.push('')

  if (data.topItems.length > 0) {
    lines.push('Top items:')
    for (const item of data.topItems.slice(0, 5)) {
      lines.push(`  ${item.name} — ${item.revenue.toFixed(0)}€ revenue, margin ${item.margin.toFixed(0)}%`)
    }
  }

  return navigator.clipboard.writeText(lines.join('\n'))
}
