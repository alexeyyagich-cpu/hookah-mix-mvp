import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEST_USER } from './helpers'

const { mockGetAuthenticatedUser, mockAnthropicCreate } = vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
  return {
    mockGetAuthenticatedUser: vi.fn(),
    mockAnthropicCreate: vi.fn(),
  }
})

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: (...args: unknown[]) => mockAnthropicCreate(...args) }
  },
}))

vi.mock('@/lib/supabase/apiAuth', () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}))

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 10, resetIn: 0 }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimits: { strict: { interval: 60000, maxRequests: 10 } },
  rateLimitExceeded: vi.fn().mockImplementation((resetIn: number) =>
    new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(resetIn / 1000)) },
    })
  ),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { POST } from '@/app/api/ocr/extract/route'

// Create a JPEG-like file (FF D8 magic bytes)
function makeJpegFile(sizeBytes = 100) {
  const bytes = new Uint8Array(sizeBytes)
  bytes[0] = 0xFF
  bytes[1] = 0xD8
  return new File([bytes], 'invoice.jpg', { type: 'image/jpeg' })
}

function makeFormData(file?: File) {
  const form = new FormData()
  if (file) form.append('image', file)
  return form
}

function makeRequest(formData: FormData) {
  return new Request('http://localhost/api/ocr/extract', {
    method: 'POST',
    body: formData,
  }) as Parameters<typeof POST>[0]
}

describe('POST /api/ocr/extract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAuthenticatedUser.mockResolvedValue({ user: TEST_USER })
  })

  it('returns 401 when unauthenticated', async () => {
    const authResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    mockGetAuthenticatedUser.mockResolvedValue({ response: authResponse, user: null })
    const res = await POST(makeRequest(makeFormData(makeJpegFile())))
    expect(res.status).toBe(401)
  })

  it('returns 400 when no image provided', async () => {
    const res = await POST(makeRequest(makeFormData()))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('No image')
  })

  it('returns 400 when file is too large', async () => {
    const bigFile = makeJpegFile(11 * 1024 * 1024)
    const res = await POST(makeRequest(makeFormData(bigFile)))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('too large')
  })

  it('returns 400 for unsupported file format', async () => {
    const unknownFile = new File([new Uint8Array([0x00, 0x00, 0x00, 0x00])], 'file.bin', { type: 'application/octet-stream' })
    const res = await POST(makeRequest(makeFormData(unknownFile)))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Unsupported')
  })

  it('returns extracted items on success', async () => {
    const extractedData = {
      items: [{ brand: 'Darkside', flavor: 'Grape Core', quantity: 2, price: 15.99, packageGrams: 200 }],
      total: 31.98,
      supplier: 'Tobacco Shop',
      date: '2024-01-15',
    }
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(extractedData) }],
    })
    const res = await POST(makeRequest(makeFormData(makeJpegFile())))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.items).toHaveLength(1)
    expect(json.items[0].brand).toBe('Darkside')
    expect(json.total).toBe(31.98)
  })

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 5000 })
    const res = await POST(makeRequest(makeFormData(makeJpegFile())))
    expect(res.status).toBe(429)
  })
})
