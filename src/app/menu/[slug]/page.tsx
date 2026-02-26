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
    .select('name, description, city, cover_image_url, logo_url')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  const name = lounge?.name || slug
  const title = `Menu \u2014 ${name}`
  const description = lounge?.description || `Browse the menu at ${name}`
  const ogImage = lounge?.cover_image_url || lounge?.logo_url || null

  return {
    title,
    description,
    alternates: { canonical: `https://hookahtorus.com/menu/${slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://hookahtorus.com/menu/${slug}`,
      ...(ogImage && { images: [{ url: ogImage, alt: name }] }),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  }
}

export default function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  return <MenuPageClient params={params} />
}
