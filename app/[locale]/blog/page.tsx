import type { Metadata } from 'next'
import Link from 'next/link'
import { BLOG_POSTS, BLOG_INDEX_META, type Locale } from '@/lib/blogPosts'
import { listPosts, type BlogPost } from '@/lib/blogStore'

export const revalidate = 3600 // revalida cada hora

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeStr } = await params
  const locale = localeStr as Locale
  const m = BLOG_INDEX_META[locale]
  return { title: m.metaTitle, description: m.metaDesc }
}

const READ_MORE: Record<Locale, string> = {
  es: 'Leer artículo →',
  en: 'Read article →',
  fr: 'Lire l\'article →',
  pt: 'Ler artigo →',
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale: localeStr } = await params
  const locale = localeStr as Locale
  const m = BLOG_INDEX_META[locale]

  // Posts dinámicos del Blob store (lectura vía CDN público, sin token)
  let dynamicPosts: BlogPost[] = []
  try { dynamicPosts = await listPosts() } catch {}

  // Posts estáticos originales como respaldo/complemento
  const staticCards = BLOG_POSTS.map(p => ({
    slug:        p.slug,
    date:        p.date,
    coverEmoji:  p.coverEmoji,
    category:    p.category[locale],
    title:       p.title[locale],
    description: p.description[locale],
    dynamic:     false,
  }))

  const dynamicCards = dynamicPosts.map(p => ({
    slug:        p.slug,
    date:        p.date,
    coverEmoji:  p.coverEmoji,
    category:    p.category,
    title:       p.locales[locale]?.title ?? p.locales['es']?.title ?? p.slug,
    description: p.locales[locale]?.description ?? p.locales['es']?.description ?? '',
    dynamic:     true,
  }))

  // Unir dinámicos primero (más recientes), luego estáticos, sin duplicar slugs
  const seenSlugs = new Set(dynamicCards.map(c => c.slug))
  const allCards = [
    ...dynamicCards,
    ...staticCards.filter(c => !seenSlugs.has(c.slug)),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--color-green-mine)', fontFamily: 'var(--font-pixel)' }}>
        {m.title}
      </h1>
      <p className="text-lg mb-10 opacity-70">{m.subtitle}</p>

      <div className="flex flex-col gap-6">
        {allCards.map((card) => (
          <Link
            key={card.slug}
            href={`/${locale}/blog/${card.slug}`}
            style={{ textDecoration: 'none' }}
          >
            <article
              className="rounded-2xl p-6 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
              style={{ background: 'var(--color-cream)', border: '2px solid var(--color-cream-dark)' }}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl flex-shrink-0">{card.coverEmoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--color-green-mine)', color: 'white' }}>
                      {card.category}
                    </span>
                    <span className="text-xs opacity-40">{card.date}</span>
                  </div>
                  <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--color-earth)' }}>
                    {card.title}
                  </h2>
                  <p className="text-sm opacity-60 mb-3" style={{ color: 'var(--color-earth)' }}>
                    {card.description}
                  </p>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-green-mine)' }}>
                    {READ_MORE[locale]}
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  )
}
