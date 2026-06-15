'use client'

import { useTranslations, useLocale } from 'next-intl'
import { usePathname, useRouter, Link } from '@/lib/i18n/navigation'
import { routing, type Locale } from '@/lib/i18n/routing'
import { useState } from 'react'

const FLAG: Record<Locale, string> = {
  es: '🇪🇸',
  en: '🇬🇧',
  fr: '🇫🇷',
  pt: '🇵🇹',
}

export default function Header() {
  const t = useTranslations('Header')
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  function switchLocale(next: Locale) {
    router.replace(pathname, { locale: next })
    setLangOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 shadow-sm"
      style={{ background: 'var(--color-cream)', borderBottom: '2px solid var(--color-cream-dark)' }}>
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <a href={`/${locale}`} className="flex items-center gap-2 no-underline">
          <span className="text-2xl">🟩</span>
          <span className="font-extrabold text-xl tracking-tight"
            style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: 'var(--color-green-mine)' }}>
            {t('brand')}
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
          <a href="#how-it-works" className="transition-colors hover:text-green-mine"
            style={{ color: 'var(--color-earth-soft)' }}>
            {t('navHow')}
          </a>
          <Link href="/editor" className="transition-colors hover:text-green-mine"
            style={{ color: 'var(--color-earth-soft)' }}>
            {t('navEditor')}
          </Link>
          <Link href="/gallery" className="transition-colors hover:text-green-mine"
            style={{ color: 'var(--color-earth-soft)' }}>
            {t('navGallery')}
          </Link>
          <Link href="/guides" className="transition-colors hover:text-green-mine"
            style={{ color: 'var(--color-earth-soft)' }}>
            {t('navGuides')}
          </Link>
          <Link href="/blog" className="transition-colors hover:text-green-mine"
            style={{ color: 'var(--color-earth-soft)' }}>
            {t('navBlog')}
          </Link>
          <Link href="/skin-del-dia"
            className="transition-colors hover:opacity-100 px-3 py-1 rounded-xl font-bold text-xs"
            style={{ background: 'var(--color-green-mine)', color: 'white', opacity: 0.9 }}>
            📅 {t('navSkinDelDia')}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: 'var(--color-cream-dark)', color: 'var(--color-earth)' }}>
              <span>{FLAG[locale]}</span>
              <span className="uppercase">{locale}</span>
              <span className="text-xs opacity-60">▾</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-10 rounded-xl shadow-xl overflow-hidden z-50"
                style={{ background: 'var(--color-cream)', border: '2px solid var(--color-cream-dark)', minWidth: '120px' }}>
                {routing.locales.map((loc) => (
                  <button key={loc} onClick={() => switchLocale(loc)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-left transition-colors hover:bg-cream-dark"
                    style={{ color: loc === locale ? 'var(--color-green-mine)' : 'var(--color-earth)' }}>
                    <span>{FLAG[loc]}</span>
                    <span className="uppercase">{loc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CTA button */}
          <a href="#converter"
            className="hidden md:inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'var(--color-green-mine)' }}>
            {t('cta')} →
          </a>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}
            style={{ color: 'var(--color-earth)' }}>
            <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-3 text-sm font-semibold"
          style={{ borderTop: '1px solid var(--color-cream-dark)' }}>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}
            className="py-2" style={{ color: 'var(--color-earth-soft)' }}>
            {t('navHow')}
          </a>
          <Link href="/editor" onClick={() => setMenuOpen(false)}
            className="py-2" style={{ color: 'var(--color-earth-soft)' }}>
            {t('navEditor')}
          </Link>
          <Link href="/gallery" onClick={() => setMenuOpen(false)}
            className="py-2" style={{ color: 'var(--color-earth-soft)' }}>
            {t('navGallery')}
          </Link>
          <Link href="/guides" onClick={() => setMenuOpen(false)}
            className="py-2" style={{ color: 'var(--color-earth-soft)' }}>
            {t('navGuides')}
          </Link>
          <Link href="/blog" onClick={() => setMenuOpen(false)}
            className="py-2" style={{ color: 'var(--color-earth-soft)' }}>
            {t('navBlog')}
          </Link>
          <Link href="/skin-del-dia" onClick={() => setMenuOpen(false)}
            className="py-2 font-bold" style={{ color: 'var(--color-green-mine)' }}>
            📅 {t('navSkinDelDia')}
          </Link>
          <a href="#converter" onClick={() => setMenuOpen(false)}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-white font-bold"
            style={{ background: 'var(--color-green-mine)' }}>
            {t('cta')} →
          </a>
        </div>
      )}
    </header>
  )
}
