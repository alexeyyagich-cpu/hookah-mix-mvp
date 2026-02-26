import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import LoungePageClient from './LoungePageClient'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function fetchLounge(slug: string) {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('lounge_profiles')
    .select('name, description, city, logo_url, phone')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const lounge = await fetchLounge(slug)

  if (!lounge) {
    return { title: 'Lounge Not Found' }
  }

  const title = lounge.name
  const description = lounge.description || `${lounge.name}${lounge.city ? ` \u2014 ${lounge.city}` : ''}`

  return {
    title,
    description,
    alternates: { canonical: `https://hookahtorus.com/lounge/${slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://hookahtorus.com/lounge/${slug}`,
      ...(lounge.logo_url && { images: [{ url: lounge.logo_url, width: 400, height: 400 }] }),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function LoungePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lounge = await fetchLounge(slug)

  const jsonLd = lounge
    ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: lounge.name,
        description: lounge.description,
        url: `https://hookahtorus.com/lounge/${slug}`,
        ...(lounge.logo_url && { image: lounge.logo_url }),
        ...(lounge.city && {
          address: {
            '@type': 'PostalAddress',
            addressLocality: lounge.city,
          },
        }),
        ...(lounge.phone && { telephone: lounge.phone }),
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      <LoungePageClient params={params} />
    </>
  )
}
