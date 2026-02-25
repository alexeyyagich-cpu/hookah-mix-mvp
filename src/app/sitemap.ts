import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://hookahtorus.com'
  const currentDate = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/mix`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/recommend`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/setup`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/legal/terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/impressum`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Fetch published lounge slugs for dynamic routes
  let dynamicRoutes: MetadataRoute.Sitemap = []

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      const { data: lounges } = await supabase
        .from('lounge_profiles')
        .select('slug, updated_at')
        .eq('is_published', true)

      if (lounges && lounges.length > 0) {
        dynamicRoutes = lounges.flatMap((lounge) => {
          const lastModified = lounge.updated_at
            ? new Date(lounge.updated_at)
            : currentDate

          return [
            {
              url: `${baseUrl}/lounge/${lounge.slug}`,
              lastModified,
              changeFrequency: 'weekly' as const,
              priority: 0.7,
            },
            {
              url: `${baseUrl}/menu/${lounge.slug}`,
              lastModified,
              changeFrequency: 'weekly' as const,
              priority: 0.7,
            },
          ]
        })
      }
    }
  } catch {
    // Sitemap still works with static routes if Supabase query fails
  }

  return [...staticRoutes, ...dynamicRoutes]
}
