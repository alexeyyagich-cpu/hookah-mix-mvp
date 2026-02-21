import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateConnectLink, isTelegramConfigured } from '@/lib/telegram/bot'

export async function GET() {
  if (!isTelegramConfigured) {
    return NextResponse.json({ configured: false, link: '' })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ configured: true, link: '' }, { status: 401 })
  }

  const link = generateConnectLink(user.id)
  return NextResponse.json({ configured: true, link })
}
