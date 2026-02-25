import type { Locale } from './types'
import { LOCALE_MAP } from './types'

function toIntlLocale(locale: Locale): string {
  return LOCALE_MAP[locale] || locale
}

export function formatDate(date: Date | string, locale: Locale, style: 'short' | 'medium' | 'long' = 'medium'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const loc = toIntlLocale(locale)

  switch (style) {
    case 'short': // 01.02.26
      return new Intl.DateTimeFormat(loc, { day: '2-digit', month: '2-digit', year: '2-digit' }).format(d)
    case 'long': // 1 February 2026
      return new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
    default: // 1 Feb 2026
      return new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
  }
}

export function formatTime(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(toIntlLocale(locale), { hour: '2-digit', minute: '2-digit' }).format(d)
}

export function formatDateTime(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${formatDate(d, locale)} ${formatTime(d, locale)}`
}

export function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(toIntlLocale(locale)).format(n)
}

export function formatCurrency(n: number, locale: Locale, currency = 'EUR'): string {
  return new Intl.NumberFormat(toIntlLocale(locale), { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
}
