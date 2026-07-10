import type { MetadataRoute } from 'next'
import { GUIDES } from '@/lib/guidesContent'
import { BLOG_POSTS } from '@/lib/blogPosts'
import { getAllCharacterSlugs } from '@/lib/characterOfTheDay'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://makeskins.com'
const LOCALES  = ['es', 'en', 'fr', 'pt'] as const

const STORAGE_BASE = 'https://raw.githubusercontent.com/Albertop86/Hugo-Mine/data'

async function getFeaturedDates(): Promise<{ slug: string; date: string }[]> {
  try {
    const res = await fetch(`${STORAGE_BASE}/characters/index.json`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

async function getDynamicBlogSlugs(): Promise<{ slug: string; date: string }[]> {
  try {
    const res = await fetch(`${STORAGE_BASE}/blog/index.json`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now     = new Date()
  const entries: MetadataRoute.Sitemap = []

  const [featured, dynamicBlog] = await Promise.all([getFeaturedDates(), getDynamicBlogSlugs()])
  const featuredMap = new Map(featured.map(e => [e.slug, e.date]))
  const allSlugs    = getAllCharacterSlugs()

  for (const locale of LOCALES) {
    entries.push(
      { url: `${BASE_URL}/${locale}`,              lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
      { url: `${BASE_URL}/${locale}/editor`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
      { url: `${BASE_URL}/${locale}/gallery`,      lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
      { url: `${BASE_URL}/${locale}/guides`,       lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
      { url: `${BASE_URL}/${locale}/blog`,         lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
      { url: `${BASE_URL}/${locale}/skin-del-dia`, lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
      { url: `${BASE_URL}/${locale}/skins`,        lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
      { url: `${BASE_URL}/${locale}/privacy`,      lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
      { url: `${BASE_URL}/${locale}/terms`,        lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    )
    const staticSlugs = new Set(BLOG_POSTS.map(p => p.slug))
    for (const post of BLOG_POSTS) {
      entries.push({
        url: `${BASE_URL}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }
    for (const post of dynamicBlog) {
      if (staticSlugs.has(post.slug)) continue
      const d = post.date ? new Date(post.date) : now
      entries.push({
        url: `${BASE_URL}/${locale}/blog/${post.slug}`,
        lastModified: isNaN(d.getTime()) ? now : d,
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }
    for (const guide of GUIDES) {
      entries.push({
        url: `${BASE_URL}/${locale}/guides/${guide.slug}`,
        lastModified: now,
        changeFrequency: 'yearly',
        priority: 0.7,
      })
    }
    for (const slug of allSlugs) {
      const date = featuredMap.get(slug)
      entries.push({
        url: `${BASE_URL}/${locale}/skins/${slug}`,
        lastModified: date ? new Date(date) : now,
        changeFrequency: 'monthly',
        priority: date ? 0.75 : 0.5,
      })
    }
  }

  return entries
}
