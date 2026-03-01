import { vi } from 'vitest'

/** Reusable test user matching Supabase User shape */
export const TEST_USER = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
}

/**
 * Create a chainable mock Supabase query builder.
 * All chain methods return `this`; awaiting resolves to `result`.
 */
export function mockQueryBuilder(result: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const resolved = { data: result.data ?? null, error: result.error ?? null, count: result.count ?? null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: Record<string, any> = {}
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'is', 'in', 'gte', 'lte', 'gt', 'lt',
    'order', 'limit', 'range', 'single', 'maybeSingle', 'head',
  ]
  for (const m of methods) {
    builder[m] = vi.fn().mockReturnValue(builder)
  }
  // Make thenable so `await query` resolves
  builder.then = (resolve: (v: typeof resolved) => void) => resolve(resolved)
  return builder
}

/**
 * Create a mock Supabase client whose `.from()` returns a chainable query builder.
 */
export function mockSupabaseClient(options: {
  queryResult?: { data?: unknown; error?: unknown }
  user?: typeof TEST_USER | null
} = {}) {
  const qb = mockQueryBuilder(options.queryResult)
  return {
    from: vi.fn().mockReturnValue(qb),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options.user ?? null },
        error: options.user ? null : { message: 'Not authenticated' },
      }),
      admin: {
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      },
    },
    _qb: qb,
  }
}
