import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://skinme.app'
const LOCALES  = ['es', 'en', 'fr', 'pt'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const now     = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const locale of LOCALES) {
    entries.push(
      { url: `${BASE_URL}/${locale}`,         lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
      { url: `${BASE_URL}/${locale}/editor`,  lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
      { url: `${BASE_URL}/${locale}/gallery`, lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
      { url: `${BASE_URL}/${locale}/privacy`, lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
      { url: `${BASE_URL}/${locale}/terms`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    )
  }

  return entries
}
