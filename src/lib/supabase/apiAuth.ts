import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { User } from '@supabase/supabase-js'

/**
 * Cookie-based authentication for API routes.
 * Extracts the user from Supabase session cookies.
 *
 * Returns `{ user, supabase }` on success, or `{ user: null, response }` on failure.
 * The returned `supabase` client is scoped to the authenticated user (anon key + cookie auth).
 */
export async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return {
      user: null as null,
      supabase,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { user, supabase, response: null as null }
}

/** Return type for getAuthenticatedUser */
export type AuthResult = Awaited<ReturnType<typeof getAuthenticatedUser>>

/**
 * Bearer token authentication for admin API routes.
 * Extracts the JWT from the Authorization header and verifies it.
 *
 * Returns `{ user, adminClient }` on success, or `{ user: null, response }` on failure.
 * The returned `adminClient` uses the service role key (bypasses RLS).
 */
export async function getAdminUser(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || !anonKey) {
    return {
      user: null as null,
      adminClient: null as null,
      response: NextResponse.json({ error: 'Not configured' }, { status: 503 }),
    }
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      user: null as null,
      adminClient: null as null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const anonClient = createClient(supabaseUrl, anonKey)
  const { data: { user }, error } = await anonClient.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (error || !user) {
    return {
      user: null as null,
      adminClient: null as null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const adminClient = createClient(supabaseUrl, supabaseKey)

  // Verify superadmin
  const { data } = await adminClient
    .from('system_superadmins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!data) {
    return {
      user: null as null,
      adminClient: null as null,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { user: user as User, adminClient, response: null as null }
}
