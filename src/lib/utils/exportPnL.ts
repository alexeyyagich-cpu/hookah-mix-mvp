'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PnLData } from '@/lib/hooks/usePnL'
import type { Locale } from '@/lib/i18n/types'
import { formatCurrency } from '@/lib/i18n/format'

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

export function exportPnLCSV(data: PnLData, period: { start: Date; end: Date }, locale: Locale = 'en') {
  const fc = (v: number) => formatCurrency(v, locale)
  const lines: string[] = []

  lines.push('P&L REPORT')
  lines.push(`Period,${formatPeriod(period)}`)
  lines.push('')

  lines.push('TOTAL')
  lines.push(`Revenue,${fc(data.totalRevenue)}`)
  lines.push(`Expenses,${fc(data.totalCost)}`)
  lines.push(`Gross Profit,${fc(data.grossProfit)}`)
  lines.push(`Margin,${data.marginPercent !== null ? data.marginPercent.toFixed(1) + '%' : '—'}`)
  lines.push('')

  if (data.bar) {
    lines.push('BAR')
    lines.push(`Revenue,${fc(data.bar.revenue)}`)
    lines.push(`Cost,${fc(data.bar.cost)}`)
    lines.push(`Profit,${fc(data.bar.profit)}`)
    lines.push(`Sales,${data.bar.salesCount}`)
    lines.push('')
  }

  if (data.hookah) {
    lines.push('HOOKAH')
    lines.push(`Tobacco cost,${fc(data.hookah.cost)}`)
    lines.push(`Used,${data.hookah.gramsUsed.toFixed(0)}g`)
    lines.push(`Sessions,${data.hookah.sessionsCount}`)
    lines.push(`Cost/session,${fc(data.hookah.costPerSession)}`)
    lines.push('')
  }

  lines.push('BY DAY')
  lines.push('Date,Revenue,Bar cost,Tobacco cost,Total expenses,Profit')
  for (const d of data.dailyPnL) {
    lines.push(`${d.date},${fc(d.barRevenue)},${fc(d.barCost)},${fc(d.hookahCost)},${fc(d.totalCost)},${fc(d.profit)}`)
  }
  lines.push('')

  lines.push('EXPENSES BY CATEGORY')
  lines.push('Category,Module,Amount,Share')
  for (const c of data.costByCategory) {
    lines.push(`${c.category},${c.module},${fc(c.cost)},${c.percentage.toFixed(1)}%`)
  }
  lines.push('')

  lines.push('TOP ITEMS')
  lines.push('Name,Module,Revenue,Cost,Profit,Margin')
  for (const item of data.topItems.slice(0, 10)) {
    lines.push(`${item.name},${item.module},${fc(item.revenue)},${fc(item.cost)},${fc(item.profit)},${item.margin.toFixed(1)}%`)
  }

  const csv = lines.join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, `pnl-report-${getDateString()}.csv`)
}

// ========================================
// PDF EXPORT
// ========================================

export function exportPnLPDF(data: PnLData, period: { start: Date; end: Date }, locale: Locale = 'en') {
  const fc = (v: number) => formatCurrency(v, locale)
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
      ['Revenue', fc(data.totalRevenue)],
      ['Expenses', fc(data.totalCost)],
      ['Gross Profit', fc(data.grossProfit)],
      ['Margin', data.marginPercent !== null ? `${data.marginPercent.toFixed(1)}%` : '—'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
  })

  // Daily breakdown
  const dailyBody = data.dailyPnL.map(d => [
    d.date,
    fc(d.barRevenue),
    fc(d.totalCost),
    fc(d.profit),
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
      fc(i.revenue),
      fc(i.cost),
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

export function copyPnLAsText(data: PnLData, period: { start: Date; end: Date }, locale: Locale = 'en'): Promise<void> {
  const fc = (v: number) => formatCurrency(v, locale)
  const lines: string[] = []

  lines.push(`P&L REPORT — ${formatPeriod(period)}`)
  lines.push('')
  lines.push(`Revenue: ${fc(data.totalRevenue)}`)
  lines.push(`Expenses: ${fc(data.totalCost)}`)
  lines.push(`Profit: ${fc(data.grossProfit)}`)
  if (data.marginPercent !== null) lines.push(`Margin: ${data.marginPercent.toFixed(1)}%`)
  lines.push('')

  if (data.revenueChange !== null) lines.push(`Revenue: ${data.revenueChange >= 0 ? '+' : ''}${data.revenueChange.toFixed(0)}% vs prev. period`)
  if (data.costChange !== null) lines.push(`Expenses: ${data.costChange >= 0 ? '+' : ''}${data.costChange.toFixed(0)}% vs prev. period`)
  if (data.profitChange !== null) lines.push(`Profit: ${data.profitChange >= 0 ? '+' : ''}${data.profitChange.toFixed(0)}% vs prev. period`)
  lines.push('')

  if (data.topItems.length > 0) {
    lines.push('Top items:')
    for (const item of data.topItems.slice(0, 5)) {
      lines.push(`  ${item.name} — ${fc(item.revenue)} revenue, margin ${item.margin.toFixed(0)}%`)
    }
  }

  return navigator.clipboard.writeText(lines.join('\n'))
}
