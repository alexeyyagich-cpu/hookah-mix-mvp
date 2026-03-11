import type { TableStatus } from '@/types/database'

export const LONG_SESSION_MINUTES = 120

export const STATUS_COLORS: Record<TableStatus, { bg: string; border: string; text: string }> = {
  available: {
    bg: 'var(--color-success)',
    border: 'var(--color-success)',
    text: 'white',
  },
  occupied: {
    bg: 'var(--color-danger)',
    border: 'var(--color-danger)',
    text: 'white',
  },
  reserved: {
    bg: 'var(--color-warning)',
    border: 'var(--color-warning)',
    text: 'white',
  },
  cleaning: {
    bg: 'var(--color-textMuted)',
    border: 'var(--color-border)',
    text: 'white',
  },
}
