import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSendPushToUser } = vi.hoisted(() => {
  process.env.INTERNAL_API_KEY = 'test-api-key-12345'
  return {
    mockSendPushToUser: vi.fn(),
  }
})

vi.mock('@/lib/push/server', () => ({
  sendPushToUser: (...args: unknown[]) => mockSendPushToUser(...args),
}))

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 10, resetIn: 0 }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimits: { webhook: { interval: 60000, maxRequests: 100 } },
  rateLimitExceeded: vi.fn().mockImplementation((resetIn: number) =>
    new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(resetIn / 1000)) },
    })
  ),
}))

import { POST } from '@/app/api/push/send/route'

function makeRequest(body: unknown, apiKey?: string) {
  return new Request('http://localhost/api/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey !== undefined ? { 'x-api-key': apiKey } : {}),
    },
    body: JSON.stringify(body),
  }) as Parameters<typeof POST>[0]
}

describe('POST /api/push/send', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendPushToUser.mockResolvedValue(3)
  })

  it('returns 401 when no API key provided', async () => {
    const res = await POST(makeRequest({ profileId: 'abc', title: 'Test' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 when wrong API key provided', async () => {
    const res = await POST(makeRequest({ profileId: 'abc', title: 'Test' }, 'wrong-key-12345'))
    expect(res.status).toBe(401)
  })

  it('returns 401 when API key length differs', async () => {
    const res = await POST(makeRequest({ profileId: 'abc', title: 'Test' }, 'short'))
    expect(res.status).toBe(401)
  })

  it('returns 400 on invalid body', async () => {
    const res = await POST(makeRequest({}, 'test-api-key-12345'))
    expect(res.status).toBe(400)
  })

  it('sends push and returns ok on success', async () => {
    const body = { profileId: '550e8400-e29b-41d4-a716-446655440000', title: 'Alert', body: 'Test message', tag: 'test', url: '/dashboard' }
    const res = await POST(makeRequest(body, 'test-api-key-12345'))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.sent).toBe(3)
    expect(mockSendPushToUser).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', {
      title: 'Alert',
      body: 'Test message',
      tag: 'test',
      url: '/dashboard',
    })
  })

  it('coerces falsy body field to empty string', async () => {
    const body = { profileId: '550e8400-e29b-41d4-a716-446655440000', title: 'Alert', tag: 'test', url: '/dashboard' }
    await POST(makeRequest(body, 'test-api-key-12345'))
    expect(mockSendPushToUser).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', expect.objectContaining({ body: '' }))
  })

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 5000 })
    const res = await POST(makeRequest({ profileId: 'abc', title: 'Test' }, 'test-api-key-12345'))
    expect(res.status).toBe(429)
  })
})
