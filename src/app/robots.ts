import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/kds/', '/waiter/', '/boss/'],
      },
    ],
    sitemap: 'https://hookahtorus.com/sitemap.xml',
  }
}
