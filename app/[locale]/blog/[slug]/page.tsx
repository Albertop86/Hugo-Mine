import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BLOG_POSTS, type Locale } from '@/lib/blogPosts'
import { getPost, listSlugs, type BlogPost } from '@/lib/blogStore'
import AmazonBox from '@/components/AmazonBox'
import { routing } from '@/lib/i18n/routing'
import { CHARACTERS } from '@/lib/characterOfTheDay'

const POPULAR_SLUGS = ['spider-man', 'naruto', 'goku', 'batman', 'iron-man', 'sonic']

function findRelatedChars(slug: string, title: string, limit = 4) {
  const text = (slug + ' ' + title).toLowerCase()
  const matches = CHARACTERS.filter(c =>
    c.nameEn.toLowerCase().split(' ').some(w => w.length > 3 && text.includes(w)) ||
    c.nameEs.toLowerCase().split(' ').some(w => w.length > 3 && text.includes(w)) ||
    c.tags.some(t => text.includes(t))
  )
  if (matches.length >= limit) return matches.slice(0, limit)
  const popular = POPULAR_SLUGS
    .map(s => CHARACTERS.find(c => c.slug === s))
    .filter((c): c is typeof CHARACTERS[0] => !!c && !matches.find(m => m.slug === c.slug))
  return [...matches, ...popular].slice(0, limit)
}

export const revalidate = 3600

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateStaticParams() {
  const paths: { locale: string; slug: string }[] = []
  for (const locale of routing.locales) {
    for (const post of BLOG_POSTS) {
      paths.push({ locale, slug: post.slug })
    }
  }
  return paths
}

async function resolvePost(slug: string, locale: Locale): Promise<{
  title: string; description: string; metaTitle: string; metaDesc: string
  intro: string; sections: { heading: string; body: string }[]; cta: string
  coverEmoji: string; category: string; date: string
} | null> {
  // 1. Buscar en posts dinámicos (Blob CDN público, sin token)
  try {
    const dynamic = await getPost(slug)
    if (dynamic) {
      const loc = dynamic.locales[locale] ?? dynamic.locales['es']
      return {
        title:       loc.title,
        description: loc.description,
        metaTitle:   loc.metaTitle,
        metaDesc:    loc.metaDesc,
        intro:       loc.intro,
        sections:    loc.sections,
        cta:         loc.cta,
        coverEmoji:  dynamic.coverEmoji,
        category:    dynamic.category,
        date:        dynamic.date,
      }
    }
  } catch {}

  // 2. Fallback a posts estáticos
  const static_ = BLOG_POSTS.find(p => p.slug === slug)
  if (static_) {
    const s = static_
    return {
      title:       s.title[locale],
      description: s.description[locale],
      metaTitle:   s.metaTitle[locale],
      metaDesc:    s.metaDesc[locale],
      intro:       s.intro[locale],
      sections:    s.sections[locale],
      cta:         s.cta[locale].title + ' — ' + s.cta[locale].btn,
      coverEmoji:  s.coverEmoji,
      category:    s.category[locale],
      date:        s.date,
    }
  }

  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const post = await resolvePost(slug, locale)
  if (!post) return {}
  return {
    title:       post.metaTitle,
    description: post.metaDesc,
    openGraph: {
      title:         post.metaTitle,
      description:   post.metaDesc,
      type:          'article',
      publishedTime: post.date,
    },
  }
}

const BACK: Record<Locale, string> = { es: '← Blog', en: '← Blog', fr: '← Blog', pt: '← Blog' }
const RELATED: Record<Locale, string> = {
  es: 'Artículos relacionados', en: 'Related articles',
  fr: 'Articles connexes',     pt: 'Artigos relacionados',
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, locale } = await params
  const post = await resolvePost(slug, locale)
  if (!post) notFound()

  const jsonLd = {
    '@context':    'https://schema.org',
    '@type':       'Article',
    headline:      post.title,
    description:   post.description,
    datePublished: post.date,
    author:    { '@type': 'Organization', name: 'MakeSkins', url: 'https://makeskins.com' },
    publisher: { '@type': 'Organization', name: 'MakeSkins', url: 'https://makeskins.com' },
  }

  // Posts relacionados (estáticos + dinámicos)
  const staticRelated = BLOG_POSTS.filter(p => p.slug !== slug).slice(0, 3)

  const relatedChars = findRelatedChars(slug, post.title)
  const relatedCharsLabel: Record<Locale, string> = {
    es: 'Skins de personajes relacionados',
    en: 'Related character skins',
    fr: 'Skins de personnages associés',
    pt: 'Skins de personagens relacionados',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href={`/${locale}/blog`}
          className="text-sm font-semibold mb-6 inline-block opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--color-earth)', textDecoration: 'none' }}>
          {BACK[locale]}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--color-green-mine)', color: 'white' }}>
              {post.category}
            </span>
            <span className="text-xs opacity-40">{post.date}</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-5xl">{post.coverEmoji}</span>
            <h1 className="text-2xl font-extrabold leading-snug" style={{ color: 'var(--color-earth)' }}>
              {post.title}
            </h1>
          </div>
          <p className="text-base opacity-70 leading-relaxed">{post.description}</p>
        </div>

        {/* Intro */}
        <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--color-earth)' }}>
          {post.intro}
        </p>

        {/* Sections */}
        <div className="flex flex-col gap-8 mb-10">
          {post.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--color-green-mine)' }}>
                {section.heading}
              </h2>
              <div className="text-base leading-relaxed" style={{ color: 'var(--color-earth)' }}>
                {section.body.split('\n').map((line, j) => (
                  <p key={j} className={j > 0 ? 'mt-2' : ''}>{line}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--color-green-mine)' }}>
          <p className="font-bold text-lg text-white mb-4">{post.cta}</p>
          <a href={`/${locale}#converter`}
            className="inline-flex items-center px-6 py-3 rounded-xl font-bold text-base transition-all hover:opacity-90"
            style={{ background: 'white', color: 'var(--color-green-mine)' }}>
            {locale === 'es' ? 'Crear mi skin →' : locale === 'fr' ? 'Créer mon skin →' :
             locale === 'pt' ? 'Criar minha skin →' : 'Create my skin →'}
          </a>
        </div>

        {/* Amazon affiliate */}
        <AmazonBox locale={locale} />

        {/* Related character skins */}
        {relatedChars.length > 0 && (
          <div className="mt-10 pt-8" style={{ borderTop: '2px solid var(--color-cream-dark)' }}>
            <p className="text-sm font-bold mb-3 opacity-60" style={{ color: 'var(--color-earth)' }}>
              🎮 {relatedCharsLabel[locale]}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedChars.map(c => (
                <Link key={c.slug} href={`/${locale}/skins/${c.slug}`}
                  className="rounded-xl p-3 text-center hover:shadow-md hover:-translate-y-0.5 transition-all"
                  style={{ background: 'var(--color-cream)', border: '2px solid var(--color-cream-dark)', textDecoration: 'none' }}>
                  <div className="text-3xl mb-1">{c.emoji}</div>
                  <div className="text-xs font-semibold truncate" style={{ color: 'var(--color-earth)' }}>
                    {locale === 'es' ? c.nameEs : c.nameEn}
                  </div>
                  <div className="text-xs mt-1 opacity-50" style={{ color: 'var(--color-earth)' }}>
                    {locale === 'es' ? 'Ver skin →' : locale === 'fr' ? 'Voir skin →' : locale === 'pt' ? 'Ver skin →' : 'View skin →'}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related articles */}
        <div className="mt-10 pt-8" style={{ borderTop: '2px solid var(--color-cream-dark)' }}>
          <p className="text-sm font-bold mb-3 opacity-60" style={{ color: 'var(--color-earth)' }}>
            {RELATED[locale]}
          </p>
          <div className="flex flex-col gap-2">
            {staticRelated.map(p => (
              <Link key={p.slug} href={`/${locale}/blog/${p.slug}`}
                className="text-sm font-semibold hover:underline"
                style={{ color: 'var(--color-green-mine)', textDecoration: 'none' }}>
                {p.coverEmoji} {p.title[locale]}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
