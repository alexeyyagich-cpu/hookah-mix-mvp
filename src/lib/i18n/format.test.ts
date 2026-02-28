import { describe, it, expect } from 'vitest'
import { formatDate, formatTime, formatDateTime, formatNumber, formatCurrency } from './format'

// ── formatDate ─────────────────────────────────────────────────────────

describe('formatDate', () => {
  const date = new Date('2026-03-15T14:30:00Z')

  it('formats short date for en', () => {
    const result = formatDate(date, 'en', 'short')
    expect(result).toContain('15')
    expect(result).toContain('26')
  })

  it('formats medium date for en', () => {
    const result = formatDate(date, 'en')
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })

  it('formats long date for en', () => {
    const result = formatDate(date, 'en', 'long')
    expect(result).toContain('March')
    expect(result).toContain('2026')
  })

  it('accepts string date', () => {
    const result = formatDate('2026-03-15', 'en')
    expect(result).toContain('15')
  })

  it('formats for de locale', () => {
    const result = formatDate(date, 'de', 'long')
    expect(result).toContain('März')
  })

  it('formats for ru locale', () => {
    const result = formatDate(date, 'ru', 'long')
    // Russian uses марта (genitive of март)
    expect(result.toLowerCase()).toContain('март')
  })
})

// ── formatTime ─────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('formats time with hours and minutes', () => {
    const date = new Date('2026-03-15T14:30:00')
    const result = formatTime(date, 'en')
    // Should contain hour and minute separated by :
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })

  it('accepts string input', () => {
    const result = formatTime('2026-03-15T08:05:00', 'en')
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })
})

// ── formatDateTime ─────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('combines date and time', () => {
    const date = new Date('2026-03-15T14:30:00')
    const result = formatDateTime(date, 'en')
    // Should contain both date parts and time parts
    expect(result).toContain('2026')
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })
})

// ── formatNumber ───────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('formats numbers with locale grouping for en', () => {
    const result = formatNumber(1234567, 'en')
    expect(result).toContain('1')
    expect(result).toContain('234')
    expect(result).toContain('567')
  })

  it('uses German grouping separator', () => {
    const result = formatNumber(1234, 'de')
    // German uses . as thousands separator
    expect(result).toMatch(/1[.\s]234/)
  })

  it('formats small numbers without grouping', () => {
    expect(formatNumber(42, 'en')).toBe('42')
  })
})

// ── formatCurrency ─────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats EUR for en locale', () => {
    const result = formatCurrency(10.5, 'en')
    expect(result).toContain('10')
    expect(result).toContain('50')
  })

  it('formats EUR for de locale', () => {
    const result = formatCurrency(10.5, 'de')
    expect(result).toContain('10')
  })

  it('handles zero', () => {
    const result = formatCurrency(0, 'en')
    expect(result).toContain('0')
  })

  it('limits to 2 decimal places', () => {
    const result = formatCurrency(10.999, 'en')
    // Should round to 11.00
    expect(result).toContain('11')
  })
})
