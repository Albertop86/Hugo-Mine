'use client'

import { useTranslations, useLocale } from 'next-intl'

export default function Footer() {
  const t = useTranslations('Footer')
  const locale = useLocale()

  return (
    <footer className="mt-16 py-10 px-4"
      style={{ background: 'var(--color-earth)', color: 'rgba(255,255,255,0.7)' }}>
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand + tagline */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🟩</span>
            <span className="font-extrabold text-white"
              style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.75rem' }}>
              MakeSkins
            </span>
          </div>
          <p className="text-sm opacity-70">{t('tagline')}</p>
        </div>

        {/* Links */}
        <div className="flex gap-6 text-sm">
          <a href={`/${locale}/privacy`} className="hover:text-white transition-colors">{t('privacy')}</a>
          <a href={`/${locale}/terms`} className="hover:text-white transition-colors">{t('terms')}</a>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs opacity-40 mt-8 max-w-2xl mx-auto">
        {t('disclaimer')}
      </p>
    </footer>
  )
}
