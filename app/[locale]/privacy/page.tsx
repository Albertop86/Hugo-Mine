import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Privacy' })
  return { title: `${t('title')} – MakeSkins` }
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Privacy' })

  const sections = [
    { title: t('noDataTitle'), body: t('noDataDesc'), icon: '🔒' },
    { title: t('noAccountTitle'), body: t('noAccountDesc'), icon: '👤' },
    { title: t('cookiesTitle'), body: t('cookiesDesc'), icon: '🍪' },
    { title: t('contactTitle'), body: t('contactDesc'), icon: '✉️' },
  ]

  return (
    <main className="min-h-screen py-16 px-4" style={{ background: 'var(--color-cream)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex flex-col items-start gap-3">
          <a
            href={`/${locale}`}
            className="text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: 'var(--color-green-mine)' }}>
            {t('back')}
          </a>
          <h1
            className="font-extrabold"
            style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.1rem', lineHeight: 2, color: 'var(--color-earth)' }}>
            {t('title')}
          </h1>
          <p className="text-earth-soft leading-relaxed">{t('intro')}</p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-6">
          {sections.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl p-6 flex gap-4"
              style={{ background: 'var(--color-cream-dark)', border: '2px solid var(--color-cream-dark)' }}>
              <span className="text-2xl shrink-0 mt-0.5">{s.icon}</span>
              <div>
                <h2 className="font-extrabold text-earth mb-2">{s.title}</h2>
                <p className="text-earth-soft text-sm leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
