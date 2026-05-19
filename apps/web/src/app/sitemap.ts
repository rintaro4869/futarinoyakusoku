import type { MetadataRoute } from 'next'

import { GUIDE_ARTICLES, getGuidePath } from '@/lib/guides'

const SITE_URL = 'https://pairlog.pages.dev'
const LAST_MODIFIED = new Date('2026-05-20T00:00:00+09:00')

const routes = [
  '/',
  '/en',
  '/download',
  '/en/download',
  '/guide',
  '/guide/shared-diary-app',
  ...GUIDE_ARTICLES.map((guide) => getGuidePath(guide.slug)),
  '/privacy',
]

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => {
    const guideRoute = path === '/guide' || path.startsWith('/guide/')

    return {
      url: new URL(path, SITE_URL).toString(),
      lastModified: LAST_MODIFIED,
      changeFrequency: guideRoute ? 'monthly' : 'weekly',
      priority: path === '/' ? 1 : guideRoute ? 0.8 : 0.6,
    }
  })
}
