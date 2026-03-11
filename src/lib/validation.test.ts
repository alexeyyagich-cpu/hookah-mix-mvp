import { describe, it, expect } from 'vitest'
import {
  slugSchema,
  ocrExtractResponseSchema,
  telegramUpdateSchema,
  publicOrderSchema,
  inviteSendSchema,
  tipCreateSessionSchema,
  pushSubscribeSchema,
  pushUnsubscribeSchema,
  pushSendSchema,
  stripeCheckoutSchema,
  stripePortalSchema,
  emailLowStockSchema,
  emailOrderStatusSchema,
  adminOrgUpdateSchema,
  validateBody,
} from './validation'

// ── slugSchema ─────────────────────────────────────────────────────────

describe('slugSchema', () => {
  it('accepts valid slugs', () => {
    expect(slugSchema.safeParse('my-lounge').success).toBe(true)
    expect(slugSchema.safeParse('lounge123').success).toBe(true)
    expect(slugSchema.safeParse('a').success).toBe(true)
  })

  it('rejects empty string', () => {
    expect(slugSchema.safeParse('').success).toBe(false)
  })

  it('rejects uppercase', () => {
    expect(slugSchema.safeParse('MyLounge').success).toBe(false)
  })

  it('rejects spaces', () => {
    expect(slugSchema.safeParse('my lounge').success).toBe(false)
  })

  it('rejects leading hyphen', () => {
    expect(slugSchema.safeParse('-my-lounge').success).toBe(false)
  })

  it('rejects special characters', () => {
    expect(slugSchema.safeParse('my_lounge').success).toBe(false)
    expect(slugSchema.safeParse('my@lounge').success).toBe(false)
  })
})

// ── publicOrderSchema ──────────────────────────────────────────────────

describe('publicOrderSchema', () => {
  const validOrder = {
    table_id: 'table-1',
    type: 'bar' as const,
    items: [{ name: 'Mojito', quantity: 2 }],
  }

  it('accepts valid order', () => {
    expect(publicOrderSchema.safeParse(validOrder).success).toBe(true)
  })

  it('accepts with optional fields', () => {
    const order = { ...validOrder, guest_name: 'Alice', notes: 'No ice' }
    expect(publicOrderSchema.safeParse(order).success).toBe(true)
  })

  it('rejects missing table_id', () => {
    const { table_id: _, ...rest } = validOrder
    expect(publicOrderSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects empty items array', () => {
    expect(publicOrderSchema.safeParse({ ...validOrder, items: [] }).success).toBe(false)
  })

  it('rejects invalid type', () => {
    expect(publicOrderSchema.safeParse({ ...validOrder, type: 'food' }).success).toBe(false)
  })

  it('rejects quantity <= 0', () => {
    const order = { ...validOrder, items: [{ name: 'Mojito', quantity: 0 }] }
    expect(publicOrderSchema.safeParse(order).success).toBe(false)
  })

  it('rejects quantity > 100', () => {
    const order = { ...validOrder, items: [{ name: 'Mojito', quantity: 101 }] }
    expect(publicOrderSchema.safeParse(order).success).toBe(false)
  })
})

// ── inviteSendSchema ───────────────────────────────────────────────────

describe('inviteSendSchema', () => {
  const valid = {
    email: 'test@example.com',
    role: 'manager' as const,
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
  }

  it('accepts valid invite', () => {
    expect(inviteSendSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(inviteSendSchema.safeParse({ ...valid, email: 'not-email' }).success).toBe(false)
  })

  it('rejects invalid role', () => {
    expect(inviteSendSchema.safeParse({ ...valid, role: 'superadmin' }).success).toBe(false)
  })

  it('accepts all valid roles', () => {
    for (const role of ['owner', 'manager', 'hookah_master', 'bartender', 'cook']) {
      expect(inviteSendSchema.safeParse({ ...valid, role }).success).toBe(true)
    }
  })

  it('rejects non-UUID organizationId', () => {
    expect(inviteSendSchema.safeParse({ ...valid, organizationId: '123' }).success).toBe(false)
  })
})

// ── tipCreateSessionSchema ─────────────────────────────────────────────

describe('tipCreateSessionSchema', () => {
  const valid = {
    staffProfileId: '550e8400-e29b-41d4-a716-446655440000',
    amount: 5,
  }

  it('accepts valid tip session', () => {
    expect(tipCreateSessionSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects zero amount', () => {
    expect(tipCreateSessionSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false)
  })

  it('rejects negative amount', () => {
    expect(tipCreateSessionSchema.safeParse({ ...valid, amount: -5 }).success).toBe(false)
  })

  it('rejects amount > 500', () => {
    expect(tipCreateSessionSchema.safeParse({ ...valid, amount: 501 }).success).toBe(false)
  })

  it('transforms currency to lowercase', () => {
    const result = tipCreateSessionSchema.safeParse({ ...valid, currency: 'EUR' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.currency).toBe('eur')
    }
  })

  it('rejects unsupported currency', () => {
    expect(tipCreateSessionSchema.safeParse({ ...valid, currency: 'jpy' }).success).toBe(false)
  })
})

// ── stripeCheckoutSchema ───────────────────────────────────────────────

describe('stripeCheckoutSchema', () => {
  const valid = {
    priceId: 'price_123',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
  }

  it('accepts valid checkout', () => {
    expect(stripeCheckoutSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects missing priceId', () => {
    const { priceId: _, ...rest } = valid
    expect(stripeCheckoutSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(stripeCheckoutSchema.safeParse({ ...valid, email: 'bad' }).success).toBe(false)
  })
})

// ── emailLowStockSchema ───────────────────────────────────────────────

describe('emailLowStockSchema', () => {
  const valid = {
    profileId: '550e8400-e29b-41d4-a716-446655440000',
    items: [{ brand: 'Musthave', flavor: 'Pinkman', quantity: 5, threshold: 50 }],
  }

  it('accepts valid request', () => {
    expect(emailLowStockSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty items', () => {
    expect(emailLowStockSchema.safeParse({ ...valid, items: [] }).success).toBe(false)
  })
})

// ── emailOrderStatusSchema ─────────────────────────────────────────────

describe('emailOrderStatusSchema', () => {
  const valid = {
    profileId: '550e8400-e29b-41d4-a716-446655440000',
    orderId: 'ord-123',
    status: 'confirmed',
  }

  it('accepts valid request', () => {
    expect(emailOrderStatusSchema.safeParse(valid).success).toBe(true)
  })

  it('applies defaults for optional fields', () => {
    const result = emailOrderStatusSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.supplierName).toBe('')
      expect(result.data.orderNumber).toBe('')
      expect(result.data.total).toBe(0)
    }
  })
})

// ── validateBody ───────────────────────────────────────────────────────

describe('validateBody', () => {
  it('returns data for valid input', () => {
    const result = validateBody(slugSchema, 'my-lounge')
    expect(result.data).toBe('my-lounge')
    expect(result.error).toBeUndefined()
  })

  it('returns error string for invalid input', () => {
    const result = validateBody(slugSchema, '')
    expect(result.data).toBeUndefined()
    expect(result.error).toBeTruthy()
    expect(typeof result.error).toBe('string')
  })

  it('error includes field paths', () => {
    const result = validateBody(publicOrderSchema, { type: 'invalid' })
    expect(result.error).toBeTruthy()
  })

  it('handles null input', () => {
    const result = validateBody(slugSchema, null)
    expect(result.error).toBeTruthy()
  })

  it('handles undefined input', () => {
    const result = validateBody(slugSchema, undefined)
    expect(result.error).toBeTruthy()
  })
})

// ── ocrExtractResponseSchema ─────────────────────────────────────────

describe('ocrExtractResponseSchema', () => {
  it('accepts valid response with items', () => {
    const data = {
      items: [{ brand: 'Darkside', flavor: 'Grape', quantity: 2, price: 15.99, packageGrams: 200 }],
      total: 31.98,
      supplier: 'Shop',
      date: '2024-01-15',
    }
    expect(ocrExtractResponseSchema.safeParse(data).success).toBe(true)
  })

  it('applies defaults for missing item fields', () => {
    const result = ocrExtractResponseSchema.safeParse({ items: [{}] })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.items[0].brand).toBe('Unknown')
      expect(result.data.items[0].quantity).toBe(1)
      expect(result.data.items[0].packageGrams).toBe(200)
    }
  })

  it('accepts empty object (defaults to empty items)', () => {
    const result = ocrExtractResponseSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.items).toEqual([])
    }
  })

  it('rejects items array exceeding 100', () => {
    const items = Array.from({ length: 101 }, () => ({}))
    expect(ocrExtractResponseSchema.safeParse({ items }).success).toBe(false)
  })
})

// ── telegramUpdateSchema ─────────────────────────────────────────────

describe('telegramUpdateSchema', () => {
  it('accepts message update', () => {
    const update = {
      update_id: 123,
      message: {
        message_id: 1,
        chat: { id: 456 },
        text: '/start',
        from: { id: 789, username: 'user' },
      },
    }
    expect(telegramUpdateSchema.safeParse(update).success).toBe(true)
  })

  it('accepts callback_query update', () => {
    const update = {
      update_id: 124,
      callback_query: {
        id: 'cb1',
        data: 'action',
        message: { message_id: 2, chat: { id: 456 } },
      },
    }
    expect(telegramUpdateSchema.safeParse(update).success).toBe(true)
  })

  it('accepts update with neither message nor callback_query', () => {
    expect(telegramUpdateSchema.safeParse({ update_id: 125 }).success).toBe(true)
  })

  it('rejects missing update_id', () => {
    expect(telegramUpdateSchema.safeParse({}).success).toBe(false)
  })

  it('passes through unknown fields', () => {
    const result = telegramUpdateSchema.safeParse({ update_id: 1, extra: true })
    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>).extra).toBe(true)
    }
  })
})

// ── pushSendSchema ───────────────────────────────────────────────────

describe('pushSendSchema', () => {
  const valid = {
    profileId: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Low stock alert',
  }

  it('accepts valid push', () => {
    expect(pushSendSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts with optional body, tag, url', () => {
    expect(pushSendSchema.safeParse({ ...valid, body: 'Details', tag: 'stock', url: '/dash' }).success).toBe(true)
  })

  it('rejects empty title', () => {
    expect(pushSendSchema.safeParse({ ...valid, title: '' }).success).toBe(false)
  })

  it('rejects non-UUID profileId', () => {
    expect(pushSendSchema.safeParse({ ...valid, profileId: 'bad' }).success).toBe(false)
  })

  it('rejects title > 200 chars', () => {
    expect(pushSendSchema.safeParse({ ...valid, title: 'x'.repeat(201) }).success).toBe(false)
  })
})

// ── stripePortalSchema ───────────────────────────────────────────────

describe('stripePortalSchema', () => {
  it('accepts valid UUID', () => {
    expect(stripePortalSchema.safeParse({ userId: '550e8400-e29b-41d4-a716-446655440000' }).success).toBe(true)
  })

  it('rejects missing userId', () => {
    expect(stripePortalSchema.safeParse({}).success).toBe(false)
  })

  it('rejects non-UUID userId', () => {
    expect(stripePortalSchema.safeParse({ userId: 'not-uuid' }).success).toBe(false)
  })
})

// ── adminOrgUpdateSchema ─────────────────────────────────────────────

describe('adminOrgUpdateSchema', () => {
  const valid = { id: '550e8400-e29b-41d4-a716-446655440000' }

  it('accepts id only', () => {
    expect(adminOrgUpdateSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts with subscription_tier', () => {
    expect(adminOrgUpdateSchema.safeParse({ ...valid, subscription_tier: 'multi' }).success).toBe(true)
  })

  it('rejects invalid tier', () => {
    expect(adminOrgUpdateSchema.safeParse({ ...valid, subscription_tier: 'gold' }).success).toBe(false)
  })

  it('accepts all valid tiers', () => {
    for (const tier of ['trial', 'core', 'pro', 'multi', 'enterprise']) {
      expect(adminOrgUpdateSchema.safeParse({ ...valid, subscription_tier: tier }).success).toBe(true)
    }
  })

  it('accepts nullable trial_expires_at', () => {
    expect(adminOrgUpdateSchema.safeParse({ ...valid, trial_expires_at: null }).success).toBe(true)
    expect(adminOrgUpdateSchema.safeParse({ ...valid, trial_expires_at: '2026-04-01' }).success).toBe(true)
  })

  it('rejects non-UUID id', () => {
    expect(adminOrgUpdateSchema.safeParse({ id: 'bad' }).success).toBe(false)
  })

  it('rejects missing id', () => {
    expect(adminOrgUpdateSchema.safeParse({}).success).toBe(false)
  })
})
