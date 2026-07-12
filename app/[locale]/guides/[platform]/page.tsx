import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GUIDES, type Locale } from '@/lib/guidesContent'
import { routing } from '@/lib/i18n/routing'

type Props = { params: Promise<{ locale: string; platform: string }> }

export async function generateStaticParams() {
  const paths: { locale: string; platform: string }[] = []
  for (const locale of routing.locales) {
    for (const guide of GUIDES) {
      paths.push({ locale, platform: guide.slug })
    }
  }
  return paths
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { platform, locale: localeStr } = await params
  const locale = localeStr as Locale
  const guide = GUIDES.find((g) => g.slug === platform)
  if (!guide) return {}
  const c = guide.content[locale]
  return { title: c.metaTitle, description: c.metaDesc }
}

export default async function GuidePlatformPage({ params }: Props) {
  const { platform, locale: localeStr } = await params
  const locale = localeStr as Locale
  const guide = GUIDES.find((g) => g.slug === platform)
  if (!guide) notFound()

  const c = guide.content[locale]

  const backLabel: Record<Locale, string> = {
    es: '← Volver a guías',
    en: '← Back to guides',
    fr: '← Retour aux guides',
    pt: '← Voltar aos guias',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Back link */}
      <Link
        href={`/${locale}/guides`}
        className="text-sm font-semibold mb-6 inline-block opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: 'var(--color-earth)', textDecoration: 'none' }}
      >
        {backLabel[locale]}
      </Link>

      {/* Platform icon + title */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-4xl">{guide.icon}</span>
        <h1
          className="text-2xl font-extrabold"
          style={{ color: 'var(--color-green-mine)', fontFamily: 'var(--font-pixel)', lineHeight: 1.2 }}
        >
          {c.title}
        </h1>
      </div>

      <p className="mb-8 text-base opacity-70">{c.intro}</p>

      {/* Steps */}
      <ol className="flex flex-col gap-4 mb-8">
        {c.steps.map((step, i) => (
          <li
            key={i}
            className="flex gap-4 rounded-2xl p-5"
            style={{ background: 'var(--color-cream)', border: '2px solid var(--color-cream-dark)' }}
          >
            <span
              className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-sm"
              style={{ background: 'var(--color-green-mine)' }}
            >
              {i + 1}
            </span>
            <div>
              <p className="font-bold mb-1" style={{ color: 'var(--color-earth)' }}>{step.title}</p>
              <p className="text-sm opacity-70" style={{ color: 'var(--color-earth)' }}>{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Tip */}
      <div
        className="rounded-2xl p-5 mb-10"
        style={{ background: '#f0fdf4', border: '2px solid var(--color-green-mine)' }}
      >
        <p className="font-bold mb-1" style={{ color: 'var(--color-green-mine)' }}>{c.tipLabel}</p>
        <p className="text-sm" style={{ color: 'var(--color-earth)' }}>{c.tip}</p>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="font-bold text-lg mb-4" style={{ color: 'var(--color-earth)' }}>{c.ctaTitle}</p>
        <a
          href={`/${locale}#converter`}
          className="inline-flex items-center px-6 py-3 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 hover:-translate-y-0.5"
          style={{ background: 'var(--color-green-mine)' }}
        >
          {c.ctaBtn}
        </a>
      </div>
    </div>
  )
}
