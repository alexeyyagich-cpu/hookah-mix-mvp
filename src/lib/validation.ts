import { z } from 'zod'

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
