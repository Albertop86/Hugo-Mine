import type { Metadata } from 'next'
import Link from 'next/link'
import { GUIDES, GUIDES_INDEX, type Locale } from '@/lib/guidesContent'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const idx = GUIDES_INDEX[locale as Locale]
  return {
    title: idx.metaTitle,
    description: idx.metaDesc,
  }
}

export default async function GuidesIndexPage({ params }: Props) {
  const { locale } = await params
  const idx = GUIDES_INDEX[locale as Locale]

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--color-green-mine)', fontFamily: 'var(--font-pixel)' }}>
        {idx.title}
      </h1>
      <p className="text-lg mb-10 opacity-70">{idx.subtitle}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/${locale}/guides/${g.slug}`}
            className="block rounded-2xl p-6 transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{
              background: 'var(--color-cream)',
              border: '2px solid var(--color-cream-dark)',
              textDecoration: 'none',
            }}
          >
            <span className="text-4xl">{g.icon}</span>
            <h2 className="mt-3 font-bold text-lg" style={{ color: 'var(--color-earth)' }}>
              {g.platformName[locale as Locale]}
            </h2>
            <p className="mt-1 text-sm opacity-60" style={{ color: 'var(--color-earth)' }}>
              {g.content[locale as Locale].intro.slice(0, 90)}…
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
