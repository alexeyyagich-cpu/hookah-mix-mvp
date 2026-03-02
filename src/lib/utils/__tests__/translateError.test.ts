import { describe, it, expect, vi } from 'vitest'

const { mockGetCachedDictionary } = vi.hoisted(() => ({
  mockGetCachedDictionary: vi.fn(),
}))

vi.mock('@/lib/i18n/dictionaries', () => ({
  getCachedDictionary: (...args: unknown[]) => mockGetCachedDictionary(...args),
}))

import { translateError } from '../translateError'

describe('translateError', () => {
  it('returns invalid_credentials for Invalid login credentials', () => {
    expect(translateError('Invalid login credentials')).toBe('invalid_credentials')
  })

  it('returns user_already_registered for User already registered', () => {
    expect(translateError('User already registered')).toBe('user_already_registered')
  })

  it('returns email_not_confirmed for Email not confirmed', () => {
    expect(translateError('Email not confirmed')).toBe('email_not_confirmed')
  })

  it('returns dict.common.errorGeneric when dictionary is available', () => {
    mockGetCachedDictionary.mockReturnValue({ common: { errorGeneric: 'Ошибка произошла' } })
    expect(translateError('Some random error')).toBe('Ошибка произошла')
  })

  it('returns English fallback when dictionary is null', () => {
    mockGetCachedDictionary.mockReturnValue(null)
    expect(translateError('Some random error')).toBe('Something went wrong')
  })

  it('handles Error object', () => {
    expect(translateError(new Error('Invalid login credentials'))).toBe('invalid_credentials')
  })

  it('handles Supabase error object with message and code', () => {
    const supabaseError = { message: 'User already registered', code: '23505' }
    expect(translateError(supabaseError)).toBe('user_already_registered')
  })

  it('handles Supabase error with generic message', () => {
    mockGetCachedDictionary.mockReturnValue({ common: { errorGeneric: 'Error' } })
    const supabaseError = { message: 'Connection timeout', code: 'PGRST301', details: 'timeout' }
    expect(translateError(supabaseError)).toBe('Error')
  })
})
