import { z } from 'zod'

// ── Slug validation ─────────────────────────────────────────────────────
export const slugSchema = z.string().min(1).max(100).regex(
  /^[a-z0-9][a-z0-9-]*$/,
  'Invalid slug format'
)

// ── OCR extract response validation ─────────────────────────────────────
export const ocrExtractResponseSchema = z.object({
  items: z.array(z.object({
    brand: z.string().max(200).default('Unknown'),
    flavor: z.string().max(200).default('Unknown'),
    quantity: z.number().min(0).max(10000).default(1),
    price: z.number().min(0).max(100000).default(0),
    packageGrams: z.number().min(0).max(10000).default(200),
  })).max(100).default([]),
  total: z.number().min(0).max(1000000).nullable().optional(),
  supplier: z.string().max(200).nullable().optional(),
  date: z.string().max(50).nullable().optional(),
})

// ── Telegram webhook validation ─────────────────────────────────────────
export const telegramUpdateSchema = z.object({
  update_id: z.number(),
  message: z.object({
    message_id: z.number(),
    chat: z.object({ id: z.number() }),
    text: z.string().max(4096).optional(),
    from: z.object({
      id: z.number(),
      username: z.string().optional(),
    }).optional(),
  }).optional(),
  callback_query: z.object({
    id: z.string(),
    data: z.string().max(256).optional(),
    message: z.object({
      message_id: z.number(),
      chat: z.object({ id: z.number() }),
    }).optional(),
  }).optional(),
}).passthrough()

// ── /api/public/order/[slug] ────────────────────────────────────────────
export const publicOrderSchema = z.object({
  table_id: z.string().min(1),
  guest_name: z.string().max(100).nullable().optional(),
  type: z.enum(['bar', 'hookah']),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        quantity: z.number().int().min(1).max(100),
        details: z.string().max(500).nullable().optional(),
      })
    )
    .min(1)
    .max(50),
  notes: z.string().max(500).nullable().optional(),
})

// ── /api/invite/send ────────────────────────────────────────────────────
export const inviteSendSchema = z.object({
  email: z.string().email().max(254),
  role: z.enum(['owner', 'manager', 'hookah_master', 'bartender', 'cook']),
  organizationId: z.string().uuid(),
})

// ── /api/tip/create-session ─────────────────────────────────────────────
const ALLOWED_CURRENCIES = ['eur', 'usd', 'gbp', 'chf', 'pln', 'czk'] as const

export const tipCreateSessionSchema = z.object({
  staffProfileId: z.string().uuid(),
  amount: z.number().positive().max(500),
  currency: z
    .string()
    .transform((v) => v.toLowerCase())
    .pipe(z.enum(ALLOWED_CURRENCIES))
    .optional(),
  payerName: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
  slug: z.string().min(1).max(100).optional(),
})

// ── /api/push/subscribe (POST) ──────────────────────────────────────────
export const pushSubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  profileId: z.string().uuid(),
})

// ── /api/push/subscribe (DELETE) ────────────────────────────────────────
export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
  profileId: z.string().uuid(),
})

// ── /api/stripe/checkout ────────────────────────────────────────────────
export const stripeCheckoutSchema = z.object({
  priceId: z.string().min(1),
  userId: z.string().uuid(),
  email: z.string().email().max(254),
  isYearly: z.boolean().optional(),
})

// ── /api/email/low-stock ─────────────────────────────────────────────
export const emailLowStockSchema = z.object({
  profileId: z.string().uuid(),
  items: z.array(z.object({
    brand: z.string().min(1).max(200),
    flavor: z.string().min(1).max(200),
    quantity: z.number(),
    threshold: z.number(),
  })).min(1).max(200),
})

// ── /api/email/order-status ──────────────────────────────────────────
export const emailOrderStatusSchema = z.object({
  profileId: z.string().uuid(),
  orderId: z.string().min(1),
  status: z.string().min(1).max(50),
  supplierName: z.string().max(200).default(''),
  orderNumber: z.string().max(100).default(''),
  total: z.number().default(0),
  estimatedDelivery: z.string().max(100).optional(),
})

// ── /api/push/send ──────────────────────────────────────────────────────
export const pushSendSchema = z.object({
  profileId: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().max(500).optional(),
  tag: z.string().max(100).optional(),
  url: z.string().max(500).optional(),
})

// ── /api/stripe/portal ──────────────────────────────────────────────────
export const stripePortalSchema = z.object({
  userId: z.string().uuid(),
})

// ── Helper ──────────────────────────────────────────────────────────────
/**
 * Validates `body` against `schema`.
 * Returns `{ data }` on success or `{ error }` with a human-readable message
 * listing every validation issue.
 */
export function validateBody<T>(
  schema: z.ZodType<T>,
  body: unknown
): { data: T; error?: never } | { data?: never; error: string } {
  const result = schema.safeParse(body)
  if (!result.success) {
    const msg = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ')
    return { error: msg }
  }
  return { data: result.data }
}
