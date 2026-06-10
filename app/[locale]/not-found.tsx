import { getTranslations } from 'next-intl/server'
import { getLocale } from 'next-intl/server'

export default async function LocaleNotFound() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'NotFound' })

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center"
      style={{ background: 'var(--color-cream)' }}>
      <div className="flex flex-col items-center gap-6">
        <span className="text-7xl">⛏️</span>
        <div>
          <p className="font-extrabold mb-1"
            style={{ fontFamily: 'var(--font-pixel)', fontSize: '3rem', color: 'var(--color-green-mine)', lineHeight: 1 }}>
            {t('title')}
          </p>
          <h1 className="font-extrabold text-earth text-2xl mt-4 mb-2">{t('subtitle')}</h1>
          <p className="text-earth-soft text-base">{t('desc')}</p>
        </div>
        <a
          href={`/${locale}`}
          className="px-8 py-3 rounded-2xl font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-md"
          style={{ background: 'var(--color-green-mine)' }}>
          {t('back')}
        </a>
      </div>
    </main>
  )
}
