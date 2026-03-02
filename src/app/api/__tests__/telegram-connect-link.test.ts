import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEST_USER } from './helpers'

const { mockGetAuthenticatedUser, mockGenerateConnectLink, mockIsTelegramConfigured } = vi.hoisted(() => ({
  mockGetAuthenticatedUser: vi.fn(),
  mockGenerateConnectLink: vi.fn(),
  mockIsTelegramConfigured: { value: true },
}))

vi.mock('@/lib/telegram/bot', () => ({
  get isTelegramConfigured() { return mockIsTelegramConfigured.value },
  generateConnectLink: (...args: unknown[]) => mockGenerateConnectLink(...args),
}))

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 10, resetIn: 0 }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimits: { standard: { interval: 60000, maxRequests: 30 } },
  rateLimitExceeded: vi.fn().mockImplementation((resetIn: number) =>
    new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(resetIn / 1000)) },
    })
  ),
}))

vi.mock('@/lib/supabase/apiAuth', () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}))

import { GET } from '@/app/api/telegram/connect-link/route'

function makeRequest() {
  return new Request('http://localhost/api/telegram/connect-link') as Parameters<typeof GET>[0]
}

describe('GET /api/telegram/connect-link', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsTelegramConfigured.value = true
    mockGetAuthenticatedUser.mockResolvedValue({ user: TEST_USER })
    mockGenerateConnectLink.mockReturnValue('https://t.me/bot?start=token123')
  })

  it('returns configured:false when telegram is not configured', async () => {
    mockIsTelegramConfigured.value = false
    const res = await GET(makeRequest())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.configured).toBe(false)
    expect(body.link).toBe('')
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ user: null })
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.configured).toBe(true)
    expect(body.link).toBe('')
  })

  it('returns connect link on success', async () => {
    const res = await GET(makeRequest())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.configured).toBe(true)
    expect(body.link).toBe('https://t.me/bot?start=token123')
    expect(mockGenerateConnectLink).toHaveBeenCalledWith(TEST_USER.id)
  })

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 5000 })
    const res = await GET(makeRequest())
    expect(res.status).toBe(429)
  })
})
