import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import LoungePageClient from './LoungePageClient'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: lounge } = await supabase
    .from('lounge_profiles')
    .select('name, description, city, logo_url')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!lounge) {
    return { title: 'Lounge Not Found' }
  }

  const title = lounge.name
  const description = lounge.description || `${lounge.name}${lounge.city ? ` \u2014 ${lounge.city}` : ''}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(lounge.logo_url && { images: [{ url: lounge.logo_url, width: 400, height: 400 }] }),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default function LoungePage({ params }: { params: Promise<{ slug: string }> }) {
  return <LoungePageClient params={params} />
}
