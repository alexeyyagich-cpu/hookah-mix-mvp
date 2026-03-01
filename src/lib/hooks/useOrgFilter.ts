'use client'

/**
 * Apply organization or profile ownership filter to a Supabase query.
 * This pattern appears 34+ times across all hooks.
 */
export function applyOrgFilter<Q extends { eq: (col: string, val: string) => Q }>(
  query: Q,
  organizationId: string | null,
  userId: string
): Q {
  return query.eq(
    organizationId ? 'organization_id' : 'profile_id',
    organizationId || userId
  )
}
