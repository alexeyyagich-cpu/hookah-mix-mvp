import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Verify authentication
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Delete product mappings
    await supabaseAdmin
      .from('r2o_product_mappings')
      .delete()
      .eq('profile_id', user.id)

    // Delete connection (token is destroyed)
    await supabaseAdmin
      .from('r2o_connections')
      .delete()
      .eq('profile_id', user.id)

    return NextResponse.json({ disconnected: true })
  } catch (error) {
    console.error('r2o disconnect error:', error)
    return NextResponse.json(
      { error: 'Disconnect failed' },
      { status: 500 }
    )
  }
}
