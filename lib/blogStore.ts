import { put } from '@vercel/blob'

export interface BlogPostLocale {
  title:       string
  description: string
  metaTitle:   string
  metaDesc:    string
  intro:       string
  sections:    { heading: string; body: string }[]
  cta:         string
}

export interface BlogPost {
  slug:       string
  date:       string
  coverEmoji: string
  category:   string
  keywords:   string[]
  locales:    Record<string, BlogPostLocale>
}

const BASE_URL = 'https://qpjyakz4casdsvlz.public.blob.vercel-storage.com'

function blobKey(slug: string) {
  return `blog/posts/${slug}.json`
}

export async function savePost(post: BlogPost): Promise<void> {
  await put(blobKey(post.slug), JSON.stringify(post), {
    access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
  })
  const existing = await listSlugs()
  if (!existing.includes(post.slug)) {
    await put('blog/index.json', JSON.stringify([...existing, post.slug]), {
      access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
    })
  }
}

export async function listSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_URL}/blog/index.json`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${BASE_URL}/${blobKey(slug)}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function listPosts(): Promise<BlogPost[]> {
  const slugs = await listSlugs()
  if (slugs.length === 0) return []
  const posts = await Promise.all(slugs.map(getPost))
  return (posts.filter(Boolean) as BlogPost[]).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}
