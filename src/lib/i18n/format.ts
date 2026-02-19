import type { Locale } from './types'

export function formatDate(date: Date | string, locale: Locale, style: 'short' | 'medium' | 'long' = 'medium'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const map: Record<string, Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: '2-digit' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  }
  return new Intl.DateTimeFormat(locale, map[style]).format(d)
}

export function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(n)
}

export function formatCurrency(n: number, locale: Locale, currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
}
