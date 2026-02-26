/**
 * Translates raw Supabase/PostgreSQL error messages into user-friendly text.
 * Logs the raw error for debugging, returns a safe message for UI display.
 *
 * Returns special string keys for auth-specific errors (e.g. 'invalid_credentials')
 * so LoginForm/RegisterForm can map them to their own i18n keys.
 */

import { dictionaries } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/types'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n/types'

function getCurrentLocale(): Locale {
  if (typeof localStorage === 'undefined') return DEFAULT_LOCALE
  const saved = localStorage.getItem('hookah-locale') as Locale | null
  if (saved && LOCALES.includes(saved)) return saved
  return DEFAULT_LOCALE
}

type SupabaseError = { message: string; code?: string; details?: string; hint?: string }

export function translateError(error: SupabaseError | Error | string): string {
  const msg = typeof error === 'string' ? error : error.message
  const code = typeof error === 'object' && 'code' in error ? error.code : undefined

  // Log raw error for debugging (never shown to user)
  if (process.env.NODE_ENV === 'development') {
    console.warn('[translateError]', { msg, code })
  }

  // Supabase Auth — return keys for auth components to handle
  if (msg.includes('Invalid login credentials')) return 'invalid_credentials'
  if (msg.includes('User already registered')) return 'user_already_registered'
  if (msg.includes('Email not confirmed')) return 'email_not_confirmed'

  // All other errors: return localized generic message
  const tc = dictionaries[getCurrentLocale()].common
  return tc.errorGeneric
}
