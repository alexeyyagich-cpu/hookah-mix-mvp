import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEST_USER } from './helpers'

// ── Mocks for getAuthenticatedUser ──────────────────────────────────────
const mockAuthGetUser = vi.fn()

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [] }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockAuthGetUser },
  })),
}))

// ── Mocks for getAdminUser ──────────────────────────────────────────────
const mockAnonGetUser = vi.fn()
const mockAdminSingle = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn((_url: string, key: string) => {
    if (key === 'test-service-key') {
      // Admin client — used to check system_superadmins
      const qb = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: mockAdminSingle,
      }
      return { from: vi.fn().mockReturnValue(qb) }
    }
    // Anon client — used to verify JWT
    return { auth: { getUser: mockAnonGetUser } }
  }),
}))

// Env vars needed by getAdminUser
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key')

import { getAuthenticatedUser, getAdminUser } from '@/lib/supabase/apiAuth'

// ── getAuthenticatedUser ────────────────────────────────────────────────

describe('getAuthenticatedUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user when session is valid', async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: TEST_USER },
      error: null,
    })

    const result = await getAuthenticatedUser()

    expect(result.user).toEqual(TEST_USER)
    expect(result.response).toBeNull()
    expect(result.supabase).toBeDefined()
  })

  it('returns 401 response when no session', async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'No session' },
    })

    const result = await getAuthenticatedUser()

    expect(result.user).toBeNull()
    expect(result.response).not.toBeNull()

    const body = await result.response!.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when getUser returns null user without error', async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const result = await getAuthenticatedUser()

    expect(result.user).toBeNull()
    expect(result.response).not.toBeNull()
  })
})

// ── getAdminUser ────────────────────────────────────────────────────────

describe('getAdminUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user and adminClient for valid superadmin', async () => {
    mockAnonGetUser.mockResolvedValue({
      data: { user: TEST_USER },
      error: null,
    })
    mockAdminSingle.mockResolvedValue({
      data: { id: 'superadmin-row-id' },
      error: null,
    })

    const request = new Request('http://localhost/api/admin/stats', {
      headers: { Authorization: 'Bearer valid-jwt-token' },
    })

    const result = await getAdminUser(request)

    expect(result.user).toBeTruthy()
    expect(result.user!.id).toBe(TEST_USER.id)
    expect(result.adminClient).toBeTruthy()
    expect(result.response).toBeNull()
  })

  it('returns 401 when no Authorization header', async () => {
    const request = new Request('http://localhost/api/admin/stats')

    const result = await getAdminUser(request)

    expect(result.user).toBeNull()
    expect(result.response).not.toBeNull()

    const body = await result.response!.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when Bearer token is invalid', async () => {
    mockAnonGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    })

    const request = new Request('http://localhost/api/admin/stats', {
      headers: { Authorization: 'Bearer bad-token' },
    })

    const result = await getAdminUser(request)

    expect(result.user).toBeNull()

    const body = await result.response!.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 403 when user is not a superadmin', async () => {
    mockAnonGetUser.mockResolvedValue({
      data: { user: TEST_USER },
      error: null,
    })
    mockAdminSingle.mockResolvedValue({
      data: null,
      error: null,
    })

    const request = new Request('http://localhost/api/admin/stats', {
      headers: { Authorization: 'Bearer valid-jwt-token' },
    })

    const result = await getAdminUser(request)

    expect(result.user).toBeNull()

    const body = await result.response!.json()
    expect(body.error).toBe('Forbidden')
  })

  it('returns 503 when env vars are missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')

    const request = new Request('http://localhost/api/admin/stats', {
      headers: { Authorization: 'Bearer token' },
    })

    const result = await getAdminUser(request)

    expect(result.user).toBeNull()

    const body = await result.response!.json()
    expect(body.error).toBe('Not configured')

    // Restore
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key')
  })
})
