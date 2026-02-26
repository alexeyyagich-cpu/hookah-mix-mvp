'use client'

import type { PnLData } from '@/lib/hooks/usePnL'
import type { Locale } from '@/lib/i18n/types'
import type { Dictionary } from '@/lib/i18n'
import { formatCurrency } from '@/lib/i18n/format'

type ExportLabels = Dictionary['manage']

const DEFAULT_LABELS = {
  pnlTitle: 'P&L REPORT', pnlTotal: 'TOTAL', pnlBar: 'BAR', pnlHookah: 'HOOKAH',
  pnlByDay: 'BY DAY', pnlByCategory: 'EXPENSES BY CATEGORY', pnlTopItems: 'TOP ITEMS',
  pnlGrossProfit: 'Gross Profit', pnlTobaccoCost: 'Tobacco cost',
  pnlUsed: 'Used', pnlCostPerSession: 'Cost/session',
  pnlBarCost: 'Bar cost', pnlTotalExpenses: 'Total expenses',
  pnlCategory: 'Category', pnlModule: 'Module', pnlAmount: 'Amount', pnlShare: 'Share',
  pnlName: 'Name', pnlItem: 'Item',
  pnlRevenueBreakdown: 'Revenue Breakdown', pnlDailyTitle: 'Daily P&L',
  pnlVsPrev: 'vs prev. period', pnlTopItemsLabel: 'Top items:',
  exportRevenue: 'Revenue', exportCost: 'Cost', exportProfit: 'Profit',
  exportExpenses: 'Expenses', exportMargin: 'Margin', exportSales: 'Sales',
  exportPeriod: 'Period', exportDate: 'Date', exportMetric: 'Metric', exportValue: 'Value',
  exportSessions: 'Sessions', exportGenerated: 'Generated',
}

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

export function exportPnLCSV(data: PnLData, period: { start: Date; end: Date }, locale: Locale = 'en', labels?: ExportLabels) {
  const l = labels || DEFAULT_LABELS as ExportLabels
  const fc = (v: number) => formatCurrency(v, locale)
  const lines: string[] = []

  lines.push(l.pnlTitle)
  lines.push(`${l.exportPeriod},${formatPeriod(period)}`)
  lines.push('')

  lines.push(l.pnlTotal)
  lines.push(`${l.exportRevenue},${fc(data.totalRevenue)}`)
  lines.push(`${l.exportExpenses},${fc(data.totalCost)}`)
  lines.push(`${l.pnlGrossProfit},${fc(data.grossProfit)}`)
  lines.push(`${l.exportMargin},${data.marginPercent !== null ? data.marginPercent.toFixed(1) + '%' : '—'}`)
  lines.push('')

  if (data.bar) {
    lines.push(l.pnlBar)
    lines.push(`${l.exportRevenue},${fc(data.bar.revenue)}`)
    lines.push(`${l.exportCost},${fc(data.bar.cost)}`)
    lines.push(`${l.exportProfit},${fc(data.bar.profit)}`)
    lines.push(`${l.exportSales},${data.bar.salesCount}`)
    lines.push('')
  }

  if (data.hookah) {
    lines.push(l.pnlHookah)
    lines.push(`${l.pnlTobaccoCost},${fc(data.hookah.cost)}`)
    lines.push(`${l.pnlUsed},${data.hookah.gramsUsed.toFixed(0)}g`)
    lines.push(`${l.exportSessions},${data.hookah.sessionsCount}`)
    lines.push(`${l.pnlCostPerSession},${fc(data.hookah.costPerSession)}`)
    lines.push('')
  }

  lines.push(l.pnlByDay)
  lines.push(`${l.exportDate},${l.exportRevenue},${l.pnlBarCost},${l.pnlTobaccoCost},${l.pnlTotalExpenses},${l.exportProfit}`)
  for (const d of data.dailyPnL) {
    lines.push(`${d.date},${fc(d.barRevenue)},${fc(d.barCost)},${fc(d.hookahCost)},${fc(d.totalCost)},${fc(d.profit)}`)
  }
  lines.push('')

  lines.push(l.pnlByCategory)
  lines.push(`${l.pnlCategory},${l.pnlModule},${l.pnlAmount},${l.pnlShare}`)
  for (const c of data.costByCategory) {
    lines.push(`${c.category},${c.module},${fc(c.cost)},${c.percentage.toFixed(1)}%`)
  }
  lines.push('')

  lines.push(l.pnlTopItems)
  lines.push(`${l.pnlName},${l.pnlModule},${l.exportRevenue},${l.exportCost},${l.exportProfit},${l.exportMargin}`)
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

export async function exportPnLPDF(data: PnLData, period: { start: Date; end: Date }, locale: Locale = 'en', labels?: ExportLabels) {
  const l = labels || DEFAULT_LABELS as ExportLabels
  const fc = (v: number) => formatCurrency(v, locale)
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text(l.pnlTitle, 14, 20)
  doc.setFontSize(10)
  doc.text(`${l.exportPeriod}: ${formatPeriod(period)}`, 14, 28)
  doc.text(`Hookah Torus — hookahtorus.com`, 14, 34)

  // Summary table
  autoTable(doc, {
    startY: 42,
    head: [[l.exportMetric, l.exportValue]],
    body: [
      [l.exportRevenue, fc(data.totalRevenue)],
      [l.exportExpenses, fc(data.totalCost)],
      [l.pnlGrossProfit, fc(data.grossProfit)],
      [l.exportMargin, data.marginPercent !== null ? `${data.marginPercent.toFixed(1)}%` : '—'],
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
    head: [[l.exportDate, l.exportRevenue, l.exportExpenses, l.exportProfit]],
    body: dailyBody,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
  })

  // Top items
  if (data.topItems.length > 0) {
    const topBody = data.topItems.slice(0, 8).map(i => [
      i.name,
      i.module === 'bar' ? l.pnlBar : l.pnlHookah,
      fc(i.revenue),
      fc(i.cost),
      `${i.margin.toFixed(0)}%`,
    ])

    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
      head: [[l.pnlItem, l.pnlModule, l.exportRevenue, l.exportCost, l.exportMargin]],
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

export function copyPnLAsText(data: PnLData, period: { start: Date; end: Date }, locale: Locale = 'en', labels?: ExportLabels): Promise<void> {
  const l = labels || DEFAULT_LABELS as ExportLabels
  const fc = (v: number) => formatCurrency(v, locale)
  const lines: string[] = []

  lines.push(`${l.pnlTitle} — ${formatPeriod(period)}`)
  lines.push('')
  lines.push(`${l.exportRevenue}: ${fc(data.totalRevenue)}`)
  lines.push(`${l.exportExpenses}: ${fc(data.totalCost)}`)
  lines.push(`${l.exportProfit}: ${fc(data.grossProfit)}`)
  if (data.marginPercent !== null) lines.push(`${l.exportMargin}: ${data.marginPercent.toFixed(1)}%`)
  lines.push('')

  if (data.revenueChange !== null) lines.push(`${l.exportRevenue}: ${data.revenueChange >= 0 ? '+' : ''}${data.revenueChange.toFixed(0)}% ${l.pnlVsPrev}`)
  if (data.costChange !== null) lines.push(`${l.exportExpenses}: ${data.costChange >= 0 ? '+' : ''}${data.costChange.toFixed(0)}% ${l.pnlVsPrev}`)
  if (data.profitChange !== null) lines.push(`${l.exportProfit}: ${data.profitChange >= 0 ? '+' : ''}${data.profitChange.toFixed(0)}% ${l.pnlVsPrev}`)
  lines.push('')

  if (data.topItems.length > 0) {
    lines.push(l.pnlTopItemsLabel)
    for (const item of data.topItems.slice(0, 5)) {
      lines.push(`  ${item.name} — ${fc(item.revenue)} revenue, margin ${item.margin.toFixed(0)}%`)
    }
  }

  return navigator.clipboard.writeText(lines.join('\n'))
}
