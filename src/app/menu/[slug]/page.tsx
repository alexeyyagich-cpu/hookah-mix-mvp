import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import MenuPageClient from './MenuPageClient'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Try lounge_profiles first for published lounges
  const { data: lounge } = await supabase
    .from('lounge_profiles')
    .select('name, description, city')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  const name = lounge?.name || slug
  const title = `Menu \u2014 ${name}`
  const description = lounge?.description || `Browse the menu at ${name}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  return <MenuPageClient params={params} />
}
