import { storagePut, storageUrl, storageGetJson } from './storage'

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

function blobKey(slug: string) {
  return `blog/posts/${slug}.json`
}

export async function savePost(post: BlogPost): Promise<void> {
  await storagePut(blobKey(post.slug), JSON.stringify(post))
  const existing = await listSlugs()
  if (!existing.includes(post.slug)) {
    await storagePut('blog/index.json', JSON.stringify([...existing, post.slug]))
  }
}

export async function listSlugs(): Promise<string[]> {
  return storageGetJson<string[]>('blog/index.json', [])
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(storageUrl(blobKey(slug)), { next: { revalidate: 3600 } })
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
