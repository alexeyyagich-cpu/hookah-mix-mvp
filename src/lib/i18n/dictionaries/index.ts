import type { Locale } from '../types'

// Type derived from ru (source of truth) — import type only, zero runtime cost
import type { dictionary as ruDict } from './ru'

export type Dictionary = typeof ruDict
export type Namespace = keyof Dictionary

/** Async dictionary loader — webpack creates one chunk per locale */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  switch (locale) {
    case 'en': return (await import('./en')).dictionary
    case 'de': return (await import('./de')).dictionary
    default:   return (await import('./ru')).dictionary
  }
}

/** Module-level cache for non-hook consumers (ErrorBoundary, translateError) */
let _cache: Dictionary | null = null
export function setCachedDictionary(dict: Dictionary) { _cache = dict }
export function getCachedDictionary(): Dictionary | null { return _cache }
