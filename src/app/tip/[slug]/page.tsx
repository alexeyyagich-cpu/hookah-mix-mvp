import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import TipPageClient from './TipPageClient'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('display_name, photo_url')
    .eq('tip_slug', slug)
    .eq('is_tip_enabled', true)
    .single()

  if (!staff) {
    return { title: 'Tip | Hookah Torus' }
  }

  const title = `Tip for ${staff.display_name} | Hookah Torus`
  const description = `Leave a tip for ${staff.display_name} — fast & secure via Hookah Torus`

  return {
    title,
    description,
    alternates: { canonical: `https://hookahtorus.com/tip/${slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://hookahtorus.com/tip/${slug}`,
      ...(staff.photo_url && { images: [{ url: staff.photo_url, width: 400, height: 400 }] }),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default function TipPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ErrorBoundary sectionName="Tip"><TipPageClient params={params} /></ErrorBoundary>
}
