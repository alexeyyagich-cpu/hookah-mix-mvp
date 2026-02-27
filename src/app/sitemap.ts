import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://hookahtorus.com'
  const currentDate = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
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
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
              changeFrequency: 'daily' as const,
              priority: 0.8,
            },
            {
              url: `${baseUrl}/menu/${lounge.slug}`,
              lastModified,
              changeFrequency: 'daily' as const,
              priority: 0.8,
            },
          ]
        })
      }

      // Fetch published staff tip pages
      const { data: staffProfiles } = await supabase
        .from('staff_profiles')
        .select('tip_slug, updated_at')
        .eq('is_tip_enabled', true)

      if (staffProfiles && staffProfiles.length > 0) {
        const tipRoutes = staffProfiles.map((staff) => ({
          url: `${baseUrl}/tip/${staff.tip_slug}`,
          lastModified: staff.updated_at ? new Date(staff.updated_at) : currentDate,
          changeFrequency: 'monthly' as const,
          priority: 0.5,
        }))
        dynamicRoutes = [...dynamicRoutes, ...tipRoutes]
      }
    }
  } catch {
    // Sitemap still works with static routes if Supabase query fails
  }

  return [...staticRoutes, ...dynamicRoutes]
}
